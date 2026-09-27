// Same no-ambiguous-characters alphabet generateLicenseKey() uses (no 0/O/1/I), so a share code
// read aloud or hand-typed from a screenshot never has a character someone has to guess at.
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
export const SHARE_CODE_LENGTH = 5;
// Private codes (a user's own configs, never listed publicly) are one character longer, so they
// can't be stumbled on by trying short codes.
export const PRIVATE_CODE_LENGTH = 6;

/** Generates a short, human-typeable share code (e.g. "K7QXM") for a published config. */
export function generateShareCode(length: number = SHARE_CODE_LENGTH): string {
  return Array.from({ length }, () => ALPHABET[Math.floor(Math.random() * ALPHABET.length)]).join("");
}
