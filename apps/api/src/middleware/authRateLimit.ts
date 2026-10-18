import type { Request, Response, NextFunction } from 'express';

interface AttemptRecord {
  count: number;
  blockedUntil: number;
}

const attempts = new Map<string, AttemptRecord>();
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000;
const BLOCK_MS = 30 * 60 * 1000;

export function authRateLimit(req: Request, res: Response, next: NextFunction) {
  const ip = req.ip ?? 'unknown';
  const email = req.body?.email ? String(req.body.email).toLowerCase() : 'no_email';
  const key = `${ip}:${email}`;

  const now = Date.now();
  const record = attempts.get(key);

  if (record) {
    if (record.blockedUntil > now) {
      res.status(429).json({ error: 'too_many_attempts', message: 'Account temporarily locked. Try again later.' });
      return;
    }
    if (now - record.blockedUntil > WINDOW_MS && record.blockedUntil !== 0) {
      attempts.delete(key);
    } else if (record.count >= MAX_ATTEMPTS) {
      record.blockedUntil = now + BLOCK_MS;
      attempts.set(key, record);
      res.status(429).json({ error: 'too_many_attempts', message: 'Too many failed attempts. Locked for 30 minutes.' });
      return;
    }
  }

  const originalJson = res.json;
  res.json = function (body: unknown) {
    if (res.statusCode === 401 || res.statusCode === 403) {
      const current = attempts.get(key) ?? { count: 0, blockedUntil: 0 };
      current.count += 1;
      attempts.set(key, current);
    } else if (res.statusCode === 200 || res.statusCode === 201) {
      attempts.delete(key);
    }
    return originalJson.call(this, body);
  };

  next();
}

export function resetAuthRateLimit() {
  attempts.clear();
}
