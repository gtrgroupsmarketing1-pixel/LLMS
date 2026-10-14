import crypto from 'node:crypto';

export function generateShareToken(): string {
  return crypto.randomBytes(24).toString('hex');
}

export function hashShareToken(raw: string): string {
  return crypto.createHash('sha256').update(raw).digest('hex');
}
