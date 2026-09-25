import { v } from "convex/values";
import { mutation } from "./_generated/server";

/**
 * HA Drip Boys — single operator account for the /admin dashboard.
 *
 * The credentials no longer live in the browser bundle: they are stored in
 * the "meta" table (the password as `sha256$<salt>$<hash>`), and every login
 * / change-password attempt is verified here on the server.
 *
 *   meta { key: "admin-username",  value: <access ID> }
 *   meta { key: "admin-password",  value: "sha256$<salt>$<hash>" }
 *   meta { key: "admin-password-customized", value: "1" }  — set after the
 *           factory password was replaced by the owner's own password.
 *
 * The dashboard itself keeps working with the existing ADMIN_API_KEY contract
 * the other mutations already validate.
 */

/*
 * The key and the session marker are defined in `src/lib/admin-key.ts` — a
 * plain, dependency-free module — because the dashboard (browser) needs them
 * too. Importing them from this file pulled the Convex server runtime
 * (`_generated/server.js` → `process.env`) into the browser bundle, which
 * crashed the store front with “process is not defined”.
 */
export {
  ADMIN_API_KEY,
  ADMIN_SESSION_KEY,
  isValidAdminKey,
} from "../lib/admin-key";

const USERNAME_KEY = "admin-username";
const PASSWORD_KEY = "admin-password";
const CUSTOMIZED_KEY = "admin-password-customized";

/** Factory credentials, seeded once — the owner replaces them on first login. */
const DEFAULT_USERNAME = "admin";
const DEFAULT_PASSWORD = "123456";

/* ------------------------------------------------------------------ */
/* Password hashing                                                    */
/* ------------------------------------------------------------------ */

function newSalt(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
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
      await ctx.db.insert("meta", { key: USERNAME_KEY, value: DEFAULT_USERNAME });
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
 * Server-side login check. `changed` tells the browser whether the factory
 * password was already replaced — the dashboard forces a first-time change.
 */
export const checkAdminLogin = mutation({
  args: { username: v.string(), password: v.string() },
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
      return { ok: false, changed: false };
    }
    const customized = await ctx.db
      .query("meta")
      .withIndex("by_key", (q) => q.eq("key", CUSTOMIZED_KEY))
      .unique();
    const ok =
      args.username.trim() === username.value &&
      (await verifyCredential(args.password, password.value));
    return { ok, changed: customized?.value === "1" };
  },
});

/**
 * Changes the operator password: the current one must match, the new one must
 * be at least 6 characters and different from it. Returns a typed reason so
 * the UI can show the right message.
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
    return { ok: true };
  },
});
