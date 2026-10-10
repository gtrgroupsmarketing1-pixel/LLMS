import type { Request, Response, NextFunction } from 'express';
import { verifyAccess, type AccessPayload } from '@lmms/auth';
import { AuthError } from '@lmms/contracts';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      auth?: AccessPayload;
    }
  }
}

export function requireClient(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return next(new AuthError('missing_token'));
  try {
    const payload = verifyAccess(header.slice(7));
    if (payload.kind !== 'client' || !payload.tenantId) {
      return next(new AuthError('client_only', 403));
    }
    req.auth = payload;
    return next();
  } catch {
    return next(new AuthError('invalid_token'));
  }
}
