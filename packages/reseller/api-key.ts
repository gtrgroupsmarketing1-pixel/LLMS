import crypto from 'node:crypto';

export function generateApiKey(): string {
  const raw = crypto.randomBytes(32).toString('hex');
  return `rsk_${raw}`;
}

export function hashApiKey(raw: string): string {
  return crypto.createHash('sha256').update(raw).digest('hex');
}
