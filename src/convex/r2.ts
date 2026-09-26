"use node";

import { createHash, createHmac } from "node:crypto";
import { v } from "convex/values";
import { action } from "./_generated/server";
import { isValidAdminKey } from "./admin";

/**
 * Image storage on Cloudflare R2.
 *
 * The dashboard uploads straight to the bucket through this action: the
 * browser sends the (already compressed) file, the action signs an S3 request
 * with the store's own R2 keys and PUTs it — no public write access needed on
 * the bucket, and the secret key never leaves the server.
 *
 * When the keys are missing the upload simply fails with `R2_NOT_CONFIGURED`,
 * and the storefront falls back to Convex storage (see src/lib/upload.ts), so
 * the shop keeps working while the owner is still setting the bucket up.
 *
 * Env vars (add them in the project's Keys / API keys tab):
 *   R2_ACCOUNT_ID · R2_ACCESS_KEY_ID · R2_SECRET_ACCESS_KEY
 *   R2_BUCKET · R2_PUBLIC_URL
 */

const REQUIRED_ENV = [
  "R2_ACCOUNT_ID",
  "R2_ACCESS_KEY_ID",
  "R2_SECRET_ACCESS_KEY",
  "R2_BUCKET",
  "R2_PUBLIC_URL",
] as const;

type EnvName = (typeof REQUIRED_ENV)[number];

type R2Config = {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
  /** Public base URL of the bucket, without a trailing slash. */
  publicUrl: string;
};

/** 1×1 transparent PNG — the probe image the connection test pushes. */
const PROBE_PNG = new Uint8Array([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
  0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
  0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4, 0x89, 0x00, 0x00, 0x00,
  0x0a, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9c, 0x63, 0x00, 0x01, 0x00, 0x00,
  0x05, 0x00, 0x01, 0x0d, 0x0a, 0x2d, 0xb4, 0x00, 0x00, 0x00, 0x00, 0x49,
  0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82,
]);

/** Reads the five variables, reporting exactly which ones are still missing. */
function readConfig(): { config: R2Config | null; missing: EnvName[] } {
  const missing: EnvName[] = [];
  const values = {} as Record<EnvName, string>;
  for (const name of REQUIRED_ENV) {
    const value = (process.env[name] ?? "").trim();
    if (!value) missing.push(name);
    values[name] = value;
  }
  if (missing.length > 0) return { config: null, missing };

  return {
    config: {
      accountId: values.R2_ACCOUNT_ID,
      accessKeyId: values.R2_ACCESS_KEY_ID,
      secretAccessKey: values.R2_SECRET_ACCESS_KEY,
      bucket: values.R2_BUCKET,
      publicUrl: values.R2_PUBLIC_URL.replace(/\/+$/, ""),
    },
    missing,
  };
}

function sha256Hex(data: Uint8Array | string): string {
  return createHash("sha256").update(data).digest("hex");
}

function hmac(key: Uint8Array | string, data: string): Uint8Array {
  return createHmac("sha256", key).update(data).digest();
}

/** RFC 3986 encoding — S3 signatures are picky about `+`, `~` and friends. */
function encodeRfc3986(value: string): string {
  return encodeURIComponent(value).replace(
    /[!'()*]/g,
    (char) => `%${char.charCodeAt(0).toString(16).toUpperCase()}`,
  );
}

function encodeKey(key: string): string {
  return key.split("/").map(encodeRfc3986).join("/");
}

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

/** One signed S3 request against the store's bucket. */
async function signedFetch({
  config,
  method,
  key,
  body,
  contentType,
}: {
  config: R2Config;
  method: "PUT" | "GET" | "DELETE";
  key: string;
  body?: Uint8Array;
  contentType?: string;
}): Promise<Response> {
  const host = `${config.accountId}.r2.cloudflarestorage.com`;
  const encodedKey = encodeKey(key);
  const canonicalUri = `/${config.bucket}/${encodedKey}`;
  const url = `https://${host}${canonicalUri}`;

  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, "");
  const dateStamp = amzDate.slice(0, 8);
  const payloadHash = sha256Hex(body ?? "");

  const headers: Record<string, string> = {
    host,
    "x-amz-content-sha256": payloadHash,
    "x-amz-date": amzDate,
  };
  if (contentType) headers["content-type"] = contentType;

  const signedHeaders = Object.keys(headers).sort();
  const canonicalHeaders = signedHeaders
    .map((name) => `${name}:${headers[name]}\n`)
    .join("");
  const canonicalRequest = [
    method,
    canonicalUri,
    "",
    canonicalHeaders,
    signedHeaders.join(";"),
    payloadHash,
  ].join("\n");

  const scope = `${dateStamp}/auto/s3/aws4_request`;
  const stringToSign = [
    "AWS4-HMAC-SHA256",
    amzDate,
    scope,
    sha256Hex(canonicalRequest),
  ].join("\n");

  const signingKey = hmac(
    hmac(hmac(hmac(`AWS4${config.secretAccessKey}`, dateStamp), "auto"), "s3"),
    "aws4_request",
  );
  const signature = toHex(hmac(signingKey, stringToSign));

  return await fetch(url, {
    method,
    headers: {
      ...headers,
      Authorization: `AWS4-HMAC-SHA256 Credential=${config.accessKeyId}/${scope}, SignedHeaders=${signedHeaders.join(";")}, Signature=${signature}`,
    },
    body: body as BodyInit | undefined,
  });
}

/** Yet another random suffix, so two identical photos never collide. */
function randomToken(): string {
  return Math.random().toString(36).slice(2, 10);
}

/** Keeps the original name readable, minus anything a URL should not carry. */
function safeFileName(fileName: string): string {
  const cleaned = fileName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return cleaned || "image.jpg";
}

/**
 * Proves the keys work end to end: upload a tiny image, read it back from the
 * public URL, then delete it again — and report each step's status.
 */
export const checkConnection = action({
  args: { adminKey: v.string() },
  handler: async (_ctx, args) => {
    if (!isValidAdminKey(args.adminKey)) {
      throw new Error("UNAUTHORIZED");
    }
    const { config, missing } = readConfig();
    if (!config) {
      return { ok: false as const, stage: "config" as const, missing };
    }

    const key = `health/${Date.now()}-${randomToken()}.png`;
    const put = await signedFetch({
      config,
      method: "PUT",
      key,
      body: PROBE_PNG,
      contentType: "image/png",
    });
    const read = await fetch(`${config.publicUrl}/${encodeKey(key)}`);
    const cleanup = await signedFetch({ config, method: "DELETE", key });

    if (!put.ok || !read.ok) {
      return {
        ok: false as const,
        stage: "transport" as const,
        bucket: config.bucket,
        putStatus: String(put.status),
        getStatus: String(read.status),
      };
    }
    return {
      ok: true as const,
      bucket: config.bucket,
      putStatus: String(put.status),
      getStatus: String(read.status),
      cleanupStatus: String(cleanup.status),
    };
  },
});

/** Uploads one compressed image and returns the public URL it now lives at. */
export const uploadImage = action({
  args: {
    adminKey: v.string(),
    contentType: v.string(),
    fileName: v.string(),
    /** The raw file bytes, straight from the admin's device. */
    body: v.bytes(),
  },
  handler: async (_ctx, args) => {
    if (!isValidAdminKey(args.adminKey)) {
      throw new Error("UNAUTHORIZED");
    }
    const { config } = readConfig();
    if (!config) {
      throw new Error("R2_NOT_CONFIGURED");
    }

    const key = `products/${Date.now()}-${randomToken()}-${safeFileName(args.fileName)}`;
    const response = await signedFetch({
      config,
      method: "PUT",
      key,
      body: new Uint8Array(args.body),
      contentType: args.contentType || "application/octet-stream",
    });
    if (!response.ok) {
      throw new Error(`R2_UPLOAD_FAILED:${response.status}`);
    }
    return { publicUrl: `${config.publicUrl}/${encodeKey(key)}`, key };
  },
});
