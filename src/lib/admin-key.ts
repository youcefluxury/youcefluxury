/**
 * Admin session token — the only admin credential the browser ever holds.
 *
 * It used to be a fixed string ("storefront-admin-key") compiled into the
 * JavaScript bundle, which meant every visitor could read it and call the
 * admin-only Convex functions. Now the server issues a random token at
 * sign-in (see `admin:login` in src/convex/admin.ts), stores it, and every
 * admin call presents it instead. Nothing secret lives in this file any more —
 * only the name of the sessionStorage slot, which is not a secret.
 *
 * This module must stay dependency-free: the dashboard imports it in the
 * browser, and pulling in Convex's server runtime (which reads `process.env`)
 * crashed the store with "process is not defined".
 */

/** sessionStorage key holding the session token. A name, not a secret. */
export const ADMIN_SESSION_KEY = "storefront-admin-session";

/** The live session token, or "" when signed out. */
export function getAdminSession(): string {
  try {
    return window.sessionStorage.getItem(ADMIN_SESSION_KEY) ?? "";
  } catch {
    return "";
  }
}

export function setAdminSession(token: string): void {
  try {
    window.sessionStorage.setItem(ADMIN_SESSION_KEY, token);
  } catch {
    /* private mode / storage disabled — the dashboard just stays signed out */
  }
}

export function clearAdminSession(): void {
  try {
    window.sessionStorage.removeItem(ADMIN_SESSION_KEY);
  } catch {
    /* nothing to do */
  }
}
