import crypto from 'node:crypto';

export const APPROVAL_TOKEN_TTL_DAYS = 7;

export interface GeneratedToken {
  raw: string;
  hash: string;
  expiresAt: Date;
}

export function generateApprovalToken(
  ttlDays = APPROVAL_TOKEN_TTL_DAYS,
): GeneratedToken {
  const raw = crypto.randomBytes(32).toString('hex');
  const hash = crypto.createHash('sha256').update(raw).digest('hex');
  const expiresAt = new Date(Date.now() + ttlDays * 86_400_000);
  return { raw, hash, expiresAt };
}

export function hashApprovalToken(raw: string): string {
  return crypto.createHash('sha256').update(raw).digest('hex');
}

export function isExpired(expiresAt: Date, now: Date = new Date()): boolean {
  return expiresAt.getTime() <= now.getTime();
}
