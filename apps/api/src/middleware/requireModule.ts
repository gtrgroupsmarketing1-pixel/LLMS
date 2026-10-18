import type { Request, Response, NextFunction } from 'express';
import { isModuleEnabled } from '@lmms/modules';

/**
 * Enforces that a specific module is enabled for the tenant.
 * Assumes requireAuth and tenantScopeGuard have already run.
 */
export function requireModule(moduleKey: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // The tenantId might be in the URL params (agency) or JWT (client)
      const tenantId = req.params.tenantId || req.auth?.tenantId;
      
      if (!tenantId) {
        res.status(400).json({ error: 'missing_tenant_id' });
        return;
      }

      // Agencies can bypass module checks in dev/admin contexts? 
      // For now, strict enforcement even for agency unless we build an override.
      const enabled = await isModuleEnabled(tenantId, moduleKey);
      
      if (!enabled) {
        res.status(403).json({ 
          error: 'module_disabled', 
          module: moduleKey,
          message: `The ${moduleKey} module is not enabled for this tenant.` 
        });
        return;
      }

      next();
    } catch (e) {
      next(e);
    }
  };
}
