import { Router } from 'express';
import { requireAuth, requireAgency } from '../middleware/auth';
import * as svc from '../services/modules.service';

export const modulesRouter = Router();
modulesRouter.use(requireAuth);

modulesRouter.get(
  '/tenants/:tenantId',
  requireAgency('OWNER', 'ADMIN', 'STRATEGIST', 'OPS'),
  async (req, res, next) => {
    try {
      res.json(await svc.getTenantModules(req.params.tenantId as string));
    } catch (e) { next(e); }
  },
);

modulesRouter.post(
  '/tenants/:tenantId/toggle',
  requireAgency('OWNER', 'ADMIN'),
  async (req, res, next) => {
    try {
      const result = await svc.toggleModule(
        req.params.tenantId as string,
        String(req.body?.moduleKey ?? ''),
        Boolean(req.body?.enabled ?? false),
        req.auth!.sub,
      );
      res.json(result);
    } catch (e) { next(e); }
  },
);

modulesRouter.post(
  '/seed',
  requireAgency('OWNER', 'ADMIN'),
  async (_req, res, next) => {
    try {
      const count = await svc.seedModuleDefinitions();
      res.json({ seeded: count });
    } catch (e) { next(e); }
  },
);
