import "server-only";
import { createPrivateKey, createPublicKey, sign, verify, type KeyObject } from "crypto";

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

// Ed25519 (asymmetric) instead of the old HMAC-SHA256 shared secret. The Cobalt client is fully
// decompilable, so a shared secret embedded there would let anyone who reads it forge their own
// "valid" license offline (see LicenseGate.java's own class comment for the incident this fixes).
// With Ed25519, the client only ever holds LICENSE_SIGNING_PUBLIC_KEY_B64's public half, which can
// verify a signature but cannot be used to create a new one — only this server holds the private
// key. Both keys are PKCS8/SPKI DER, base64-encoded; Node's own `sign(null, ...)`/`verify(null, ...)`
// (the `null` digest argument is required for EdDSA — it's a pure, non-prehashed signature scheme)
// produce byte-identical output to Java's `Signature.getInstance("Ed25519")` for the same input,
// verified directly against the Java client's own implementation.
let cachedPrivateKey: KeyObject | null = null;
function getPrivateKey(): KeyObject {
  if (cachedPrivateKey) return cachedPrivateKey;
  const b64 = process.env.LICENSE_SIGNING_PRIVATE_KEY_B64;
  if (!b64) throw new Error("LICENSE_SIGNING_PRIVATE_KEY_B64 is not set.");
  cachedPrivateKey = createPrivateKey({ key: Buffer.from(b64, "base64"), format: "der", type: "pkcs8" });
  return cachedPrivateKey;
}

let cachedPublicKey: KeyObject | null = null;
function getPublicKey(): KeyObject {
  if (cachedPublicKey) return cachedPublicKey;
  const b64 = process.env.LICENSE_SIGNING_PUBLIC_KEY_B64;
  if (!b64) throw new Error("LICENSE_SIGNING_PUBLIC_KEY_B64 is not set.");
  cachedPublicKey = createPublicKey({ key: Buffer.from(b64, "base64"), format: "der", type: "spki" });
  return cachedPublicKey;
}

export function signLicensePayload(payload: EmbeddedLicensePayload): SignedLicensePayload {
  const signature = sign(null, Buffer.from(canonicalString(payload), "utf8"), getPrivateKey()).toString("hex");
  return { ...payload, signature };
}

export function verifyLicensePayload(payload: SignedLicensePayload): boolean {
  try {
    const sigBuf = Buffer.from(payload.signature, "hex");
    return verify(null, Buffer.from(canonicalString(payload), "utf8"), getPublicKey(), sigBuf);
  } catch {
    return false;
  }
}
