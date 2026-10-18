import crypto from 'node:crypto';
import type { Request, Response, NextFunction } from 'express';

export function verifyWebhookSignature(secret: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    const signature = req.headers['x-lmms-signature'];
    if (!signature || typeof signature !== 'string') {
      res.status(401).json({ error: 'missing_signature' });
      return;
    }

    const payload = (req as any).rawBody || JSON.stringify(req.body);
    const expected = crypto.createHmac('sha256', secret).update(payload).digest('hex');

    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
      res.status(403).json({ error: 'invalid_signature' });
      return;
    }

    next();
  };
}
