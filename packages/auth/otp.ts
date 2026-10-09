import crypto from 'node:crypto';
import argon2 from 'argon2';

const ARGON_OPTS = {
  type: argon2.argon2id,
  memoryCost: 19456,
  timeCost: 2,
  parallelism: 1,
};

export function generateOtp(): string {
  return String(crypto.randomInt(100000, 1000000));
}

export async function hashOtp(otp: string): Promise<string> {
  return argon2.hash(otp, ARGON_OPTS);
}

export async function verifyOtp(hash: string, otp: string): Promise<boolean> {
  try {
    return await argon2.verify(hash, otp);
  } catch {
    return false;
  }
}
