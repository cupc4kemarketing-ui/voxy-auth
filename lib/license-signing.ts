import "server-only";
import { createHmac, timingSafeEqual } from "crypto";

export interface EmbeddedLicensePayload {
  licenseId: string;
  username: string;
  expiresAt: string | null;
  issuedAt: string;
}

export interface SignedLicensePayload extends EmbeddedLicensePayload {
  signature: string;
}

function canonicalString(payload: EmbeddedLicensePayload): string {
  return [payload.licenseId, payload.username, payload.expiresAt ?? "lifetime", payload.issuedAt].join("|");
}

function getSecret(): string {
  const secret = process.env.LICENSE_SIGNING_SECRET;
  if (!secret) throw new Error("LICENSE_SIGNING_SECRET is not set.");
  return secret;
}

export function signLicensePayload(payload: EmbeddedLicensePayload): SignedLicensePayload {
  const signature = createHmac("sha256", getSecret()).update(canonicalString(payload)).digest("hex");
  return { ...payload, signature };
}

export function verifyLicensePayload(payload: SignedLicensePayload): boolean {
  const expected = createHmac("sha256", getSecret()).update(canonicalString(payload)).digest("hex");
  const expectedBuf = Buffer.from(expected, "hex");
  const actualBuf = Buffer.from(payload.signature, "hex");
  if (expectedBuf.length !== actualBuf.length) return false;
  return timingSafeEqual(expectedBuf, actualBuf);
}
