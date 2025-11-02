import crypto from "crypto";

const N = 16384; // cost
const r = 8;
const p = 1;
const KEYLEN = 64;

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.randomBytes(16);
  const derivedKey = await new Promise<Buffer>((resolve, reject) => {
    crypto.scrypt(password, salt, KEYLEN, { N, r, p }, (err, dk) => {
      if (err) return reject(err);
      resolve(dk as Buffer);
    });
  });
  const saltB64 = salt.toString("base64");
  const hashB64 = derivedKey.toString("base64");
  return `scrypt$${N}$${r}$${p}$${saltB64}$${hashB64}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  try {
    if (stored.startsWith("scrypt$")) {
      const [, nStr, rStr, pStr, saltB64, hashB64] = stored.split("$");
      const n = parseInt(nStr, 10);
      const rr = parseInt(rStr, 10);
      const pp = parseInt(pStr, 10);
      const salt = Buffer.from(saltB64, "base64");
      const hash = Buffer.from(hashB64, "base64");
      const derivedKey = await new Promise<Buffer>((resolve, reject) => {
        crypto.scrypt(password, salt, hash.length, { N: n, r: rr, p: pp }, (err, dk) => {
          if (err) return reject(err);
          resolve(dk as Buffer);
        });
      });
      return crypto.timingSafeEqual(hash, derivedKey);
    }
    // Legacy fallback (plaintext stored)
    return password === stored;
  } catch {
    return false;
  }
}
