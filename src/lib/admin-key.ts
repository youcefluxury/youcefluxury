/**
 * Admin key + session marker, shared by the dashboard (browser) and the Convex
 * backend.
 *
 * This module must stay dependency-free. The dashboard used to import these
 * values from `src/convex/admin.ts`, which dragged the Convex *server* runtime
 * (`_generated/server.js`, whose `export const env = process.env` needs Node)
 * into the browser bundle — the whole store then died on load with
 * “ReferenceError: process is not defined”.
 */

/** Key the dashboard sends when it reads or writes admin-only data. */
export const ADMIN_API_KEY = "hadrip-boys-admin-key";

/** Session marker stored in sessionStorage after a successful login. */
export const ADMIN_SESSION_KEY = "hadrip-admin-session";


/** True when the caller presents the dashboard key (checked server-side). */
export function isValidAdminKey(key: string | undefined | null): boolean {
  return key === ADMIN_API_KEY;
}
