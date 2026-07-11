import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

const ALGORITHM = "aes-256-gcm";
const KEY_LENGTH_BYTES = 32;
const IV_LENGTH_BYTES = 12;

function getKey(): Buffer {
  const hex = process.env.ENCRYPTION_KEY;
  if (!hex) {
    throw new Error("ENCRYPTION_KEY must be set to a 32-byte hex string.");
  }

  const key = Buffer.from(hex, "hex");
  if (key.length !== KEY_LENGTH_BYTES) {
    throw new Error("ENCRYPTION_KEY must decode to exactly 32 bytes.");
  }

  return key;
}

export function encryptPat(plaintext: string): string {
  const key = getKey();
  const iv = randomBytes(IV_LENGTH_BYTES);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return [iv.toString("base64"), authTag.toString("base64"), ciphertext.toString("base64")].join(":");
}

export function decryptPat(stored: string): string {
  const key = getKey();
  const [ivPart, authTagPart, ciphertextPart] = stored.split(":");
  if (!ivPart || !authTagPart || !ciphertextPart) {
    throw new Error("Stored PAT is not in the expected iv:authTag:ciphertext format.");
  }

  const iv = Buffer.from(ivPart, "base64");
  const authTag = Buffer.from(authTagPart, "base64");
  const ciphertext = Buffer.from(ciphertextPart, "base64");

  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString("utf8");
}
