import type { Request, Response, NextFunction } from 'express';

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 300;

function keyFor(req: Request): string {
  const auth = (req as { auth?: { sub?: string } }).auth;
  if (auth?.sub) return `u:${auth.sub}`;
  return `ip:${req.ip ?? 'unknown'}`;
}

export function globalRateLimit(req: Request, res: Response, next: NextFunction) {
  const key = keyFor(req);
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return next();
  }
  if (bucket.count >= MAX_PER_WINDOW) {
    res.setHeader('Retry-After', String(Math.ceil((bucket.resetAt - now) / 1000)));
    res.status(429).json({ error: 'rate_limited' });
    return;
  }
  bucket.count += 1;
  return next();
}

export function _resetRateLimit(): void {
  buckets.clear();
}
