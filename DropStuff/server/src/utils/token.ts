import crypto from 'crypto';

/**
 * Generates a cryptographically strong, URL-safe random token.
 * Uses 16 random bytes encoded as base64url or hex.
 */
export function generateDropToken(): string {
  // 16 bytes = 128 bits of entropy
  return crypto.randomBytes(12).toString('hex');
}
