import crypto from "node:crypto";

/**
 * Compares two secrets in constant time using crypto.timingSafeEqual.
 * Protects against timing side-channel attacks on CRON_SECRET or auth tokens.
 */
export function timingSafeCompare(known: string, received: string): boolean {
  if (!known || !received) {
    return false;
  }

  const knownBuffer = Buffer.from(known);
  const receivedBuffer = Buffer.from(received);

  // If buffer lengths differ, timingSafeEqual throws an error,
  // so we compare against a dummy buffer of matching length to maintain constant time.
  if (knownBuffer.length !== receivedBuffer.length) {
    crypto.timingSafeEqual(knownBuffer, knownBuffer);
    return false;
  }

  return crypto.timingSafeEqual(knownBuffer, receivedBuffer);
}

