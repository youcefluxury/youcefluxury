import { v } from "convex/values";
import {
  mutation,
  query,
  type MutationCtx,
  type QueryCtx,
} from "./_generated/server";

/**
 * Storefront — single operator account for the /admin dashboard.
 *
 * The credentials live in the "meta" table (the password as
 * `sha256$<salt>$<hash>`), and every login / change-password attempt is
 * verified here on the server.
 *
 *   meta { key: "admin-username",  value: <access ID> }
 *   meta { key: "admin-password",  value: "sha256$<salt>$<hash>" }
 *   meta { key: "admin-password-customized", value: "1" }  — set after the
 *           factory password was replaced by the owner's own password.
 *
 * A successful login mints a random session token into `adminSessions`, and
 * that token — not any fixed string — is what every admin query and mutation
 * checks. It used to be a hardcoded key shipped in the browser bundle, which
 * let any visitor read customer orders; see `isAdmin` below.
 */

const USERNAME_KEY = "admin-username";
const PASSWORD_KEY = "admin-password";
const CUSTOMIZED_KEY = "admin-password-customized";

/** Factory credentials, seeded once — the owner replaces them on first login. */
const DEFAULT_USERNAME = "admin";
const DEFAULT_PASSWORD = "123456";

/**
 * How long one sign-in stays valid. The browser keeps the token in
 * sessionStorage (so it dies with the tab), and this is the server-side cap
 * for a tab left open.
 */
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

/** Anything shorter than this cannot be one of our tokens. */
const MIN_TOKEN_LENGTH = 32;

/* ------------------------------------------------------------------ */
/* Sessions                                                            */
/* ------------------------------------------------------------------ */

/** 256 bits of randomness, hex — not guessable from anything in the bundle. */
function newToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join(
    "",
  );
}

/** Drops every session that has already run out. Cheap, runs on login. */
async function pruneExpired(ctx: MutationCtx): Promise<void> {
  const now = Date.now();
  const all = await ctx.db
    .query("adminSessions")
    .withIndex("by_token")
    .collect();
  for (const row of all) {
    if (row.expiresAt <= now) await ctx.db.delete(row._id);
  }
}

/**
 * True when `token` is a live operator session.
 *
 * This is the single gate in front of every order, product, category, slider,
 * setting and upload call. It compares against the database, not against a
 * constant, so knowing the code is no longer enough.
 */
export async function isAdmin(
  ctx: QueryCtx | MutationCtx,
  token: unknown,
): Promise<boolean> {
  if (typeof token !== "string" || token.length < MIN_TOKEN_LENGTH)
    return false;
  const row = await ctx.db
    .query("adminSessions")
    .withIndex("by_token", (q) => q.eq("token", token))
    .unique();
  if (!row) return false;
  // Expired sessions are only swept on the next sign-in (`pruneExpired`):
  // this check also runs inside queries, where the database is read-only.
  return row.expiresAt > Date.now();
}

/* ------------------------------------------------------------------ */
/* Password hashing                                                    */
/* ------------------------------------------------------------------ */

function newSalt(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join(
    "",
  );
}

async function hashPassword(password: string, salt: string): Promise<string> {
  const data = new TextEncoder().encode(`${salt}:${password}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
}

/** Stored form: sha256$<salt>$<hash> — the plain password never leaves it. */
export async function hashCredential(password: string): Promise<string> {
  const salt = newSalt();
  return `sha256$${salt}$${await hashPassword(password, salt)}`;
}

export async function verifyCredential(
  password: string,
  stored: string,
): Promise<boolean> {
  const parts = stored.split("$");
  if (parts.length !== 3 || parts[0] !== "sha256") return false;
  const [, salt, expected] = parts;
  return (await hashPassword(password, salt)) === expected;
}

/* ------------------------------------------------------------------ */
/* Mutations                                                           */
/* ------------------------------------------------------------------ */

/**
 * Creates the operator account on first use. Runs on every dashboard visit —
 * it only writes when a row is missing, so it is idempotent and cheap.
 */
export const ensureAdminAccount = mutation({
  args: {},
  handler: async (ctx) => {
    const username = await ctx.db
      .query("meta")
      .withIndex("by_key", (q) => q.eq("key", USERNAME_KEY))
      .unique();
    if (!username) {
      await ctx.db.insert("meta", {
        key: USERNAME_KEY,
        value: DEFAULT_USERNAME,
      });
    }
    const password = await ctx.db
      .query("meta")
      .withIndex("by_key", (q) => q.eq("key", PASSWORD_KEY))
      .unique();
    if (!password) {
      await ctx.db.insert("meta", {
        key: PASSWORD_KEY,
        value: await hashCredential(DEFAULT_PASSWORD),
      });
    }
  },
});

/**
 * Signs the operator in and hands back a session token.
 *
 * `changed` tells the browser whether the factory password was already
 * replaced. `session` is "" when the credentials were wrong, so a failed
 * attempt never returns anything usable.
 */
export const login = mutation({
  args: { username: v.string(), password: v.string() },
  handler: async (ctx, args) => {
    const fail = { ok: false, changed: false, session: "" };

    const username = await ctx.db
      .query("meta")
      .withIndex("by_key", (q) => q.eq("key", USERNAME_KEY))
      .unique();
    const password = await ctx.db
      .query("meta")
      .withIndex("by_key", (q) => q.eq("key", PASSWORD_KEY))
      .unique();
    if (!username || !password) return fail;

    const ok =
      args.username.trim() === username.value &&
      (await verifyCredential(args.password, password.value));
    if (!ok) return fail;

    const customized = await ctx.db
      .query("meta")
      .withIndex("by_key", (q) => q.eq("key", CUSTOMIZED_KEY))
      .unique();

    await pruneExpired(ctx);
    const session = newToken();
    const now = Date.now();
    await ctx.db.insert("adminSessions", {
      token: session,
      createdAt: now,
      expiresAt: now + SESSION_TTL_MS,
    });
    return { ok: true, changed: customized?.value === "1", session };
  },
});

/**
 * Checks whether the stored token is still good.
 *
 * The dashboard calls this on load: sessionStorage can hold a token the server
 * has since revoked (password change, expiry), and without this the owner
 * would stare at an empty dashboard instead of a sign-in screen.
 */
export const verifySession = query({
  args: { session: v.string() },
  handler: async (ctx, args) => {
    return { ok: await isAdmin(ctx, args.session) };
  },
});

/** Ends one session on sign-out. Harmless for a token that is already gone. */
export const endSession = mutation({
  args: { session: v.string() },
  handler: async (ctx, args) => {
    const row = await ctx.db
      .query("adminSessions")
      .withIndex("by_token", (q) => q.eq("token", args.session))
      .unique();
    if (row) await ctx.db.delete(row._id);
    return { ok: true };
  },
});

/**
 * Changes the operator password: the current one must match, the new one must
 * be at least 6 characters and different from it. Returns a typed reason so
 * the UI can show the right message.
 *
 * Every other session is dropped — if the password changed because it leaked,
 * whoever was holding a stolen token loses access immediately.
 */
export const changeAdminPassword = mutation({
  args: {
    username: v.string(),
    currentPassword: v.string(),
    newPassword: v.string(),
  },
  handler: async (ctx, args) => {
    const username = await ctx.db
      .query("meta")
      .withIndex("by_key", (q) => q.eq("key", USERNAME_KEY))
      .unique();
    const password = await ctx.db
      .query("meta")
      .withIndex("by_key", (q) => q.eq("key", PASSWORD_KEY))
      .unique();
    if (!username || !password) {
      return { ok: false, reason: "NOT_READY" };
    }
    const accountOk =
      args.username.trim() === username.value &&
      (await verifyCredential(args.currentPassword, password.value));
    if (!accountOk) {
      return { ok: false, reason: "WRONG_CREDENTIALS" };
    }
    if (args.newPassword.trim().length < 6) {
      return { ok: false, reason: "TOO_SHORT" };
    }
    if (args.newPassword === args.currentPassword) {
      return { ok: false, reason: "SAME_PASSWORD" };
    }
    await ctx.db.patch(password._id, {
      value: await hashCredential(args.newPassword.trim()),
    });
    const customized = await ctx.db
      .query("meta")
      .withIndex("by_key", (q) => q.eq("key", CUSTOMIZED_KEY))
      .unique();
    if (customized) {
      await ctx.db.patch(customized._id, { value: "1" });
    } else {
      await ctx.db.insert("meta", { key: CUSTOMIZED_KEY, value: "1" });
    }

    // Close every session that was opened before the password changed.
    for (const row of await ctx.db.query("adminSessions").collect()) {
      await ctx.db.delete(row._id);
    }
    return { ok: true };
  },
});
