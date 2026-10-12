import type { Request, Response, NextFunction } from 'express';
import { verifyAccess } from '@lmms/auth';

export function tenantScopeGuard(req: Request, res: Response, next: NextFunction) {
  const urlTenantId = (req.params as { tenantId?: string }).tenantId;
  if (!urlTenantId) {
    next();
    return;
  }

  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    next();
    return;
  }

  try {
    const payload = verifyAccess(header.slice(7));
    if (payload.kind === 'client' && payload.tenantId && payload.tenantId !== urlTenantId) {
      res.status(403).json({ error: 'tenant_scope_violation' });
      return;
    }
  } catch {
    // invalid token — route-level middleware will reject
  }
  next();
}
