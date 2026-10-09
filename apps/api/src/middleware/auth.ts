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

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return next(new AuthError('missing_token'));
  try {
    req.auth = verifyAccess(header.slice(7));
    next();
  } catch {
    next(new AuthError('invalid_token'));
  }
}

export function requireAgency(...roles: string[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.auth || req.auth.kind !== 'agency') return next(new AuthError('agency_only', 403));
    if (roles.length && !roles.includes(req.auth.role)) return next(new AuthError('insufficient_role', 403));
    next();
  };
}

export function requireClient(req: Request, _res: Response, next: NextFunction) {
  if (!req.auth || req.auth.kind !== 'client' || !req.auth.tenantId) {
    return next(new AuthError('client_only', 403));
  }
  next();
}
