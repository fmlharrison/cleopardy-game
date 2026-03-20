const CODE_LENGTH = 6;
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

/** Human-friendly session code (no ambiguous 0/O/1/I). */
export function generateSessionCode(): string {
  let out = "";
  for (let i = 0; i < CODE_LENGTH; i++) {
    out += ALPHABET[Math.floor(Math.random() * ALPHABET.length)]!;
  }
  return out;
}

const CODE_REGEX = /^[A-Z2-9]{6}$/;

export function normalizeSessionCode(raw: string): string {
  return raw.trim().toUpperCase();
}

export function isValidSessionCode(raw: string): boolean {
  return CODE_REGEX.test(normalizeSessionCode(raw));
}
