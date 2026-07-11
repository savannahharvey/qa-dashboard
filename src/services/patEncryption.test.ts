import { randomBytes } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { decryptPat, encryptPat } from "./patEncryption.js";

const originalKey = process.env.ENCRYPTION_KEY;

beforeEach(() => {
  process.env.ENCRYPTION_KEY = randomBytes(32).toString("hex");
});

afterEach(() => {
  if (originalKey === undefined) {
    delete process.env.ENCRYPTION_KEY;
  } else {
    process.env.ENCRYPTION_KEY = originalKey;
  }
});

describe("patEncryption", () => {
  it("round-trips a PAT through encrypt and decrypt", () => {
    const stored = encryptPat("super-secret-pat-value");
    expect(stored).not.toContain("super-secret-pat-value");
    expect(decryptPat(stored)).toBe("super-secret-pat-value");
  });

  it("produces a different ciphertext each time due to a random IV", () => {
    const first = encryptPat("same-value");
    const second = encryptPat("same-value");
    expect(first).not.toBe(second);
  });

  it("rejects tampered ciphertext", () => {
    const stored = encryptPat("super-secret-pat-value");
    const [iv, authTag, ciphertext] = stored.split(":");
    const tamperedByte = Buffer.from(ciphertext, "base64");
    tamperedByte[0] = tamperedByte[0] ^ 0xff;
    const tampered = [iv, authTag, tamperedByte.toString("base64")].join(":");

    expect(() => decryptPat(tampered)).toThrow();
  });

  it("rejects a key that is not 32 bytes", () => {
    process.env.ENCRYPTION_KEY = randomBytes(16).toString("hex");
    expect(() => encryptPat("value")).toThrow(/32 bytes/);
  });

  it("throws when ENCRYPTION_KEY is not set", () => {
    delete process.env.ENCRYPTION_KEY;
    expect(() => encryptPat("value")).toThrow(/ENCRYPTION_KEY/);
  });
});
