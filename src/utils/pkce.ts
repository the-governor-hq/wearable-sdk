import crypto from "node:crypto";
import type { PKCEPair } from "../types/index.js";

/**
 * Generate a PKCE code_verifier + code_challenge (S256).
 *
 * See RFC 7636 — used by Garmin and can be used by Fitbit.
 */
export function generatePKCE(): PKCEPair {
  // 43-byte random → base64url → 57-char verifier (well within 43–128 range)
  const codeVerifier = crypto.randomBytes(32).toString("base64url");
  const codeChallenge = crypto
    .createHash("sha256")
    .update(codeVerifier)
    .digest("base64url");

  return { codeVerifier, codeChallenge };
}

/**
 * Generate a cryptographically random state parameter.
 */
export function generateState(): string {
  return crypto.randomBytes(32).toString("base64url");
}
