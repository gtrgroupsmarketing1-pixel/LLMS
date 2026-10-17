import { Router } from 'express';
import { requireAuth, requireAgency } from '../middleware/auth';
import * as svc from '../services/residency.service';
import { requestDataExport, processDataExport } from '@lmms/residency';

export const residencyRouter = Router();
residencyRouter.use(requireAuth);

residencyRouter.patch(
  '/tenants/:tenantId/region',
  requireAgency('OWNER', 'ADMIN'),
  async (req, res, next) => {
    try {
      const region = req.body?.region as 'UAE' | 'KSA';
      if (!['UAE', 'KSA'].includes(region)) {
        res.status(400).json({ error: 'invalid_region' });
        return;
      }
      const updated = await svc.updateTenantRegion(
        req.params.tenantId as string,
        region,
        req.auth!.sub,
      );
      res.json(updated);
    } catch (e) { next(e); }
  },
);

residencyRouter.get(
  '/tenants/:tenantId/exports',
  requireAgency('OWNER', 'ADMIN', 'OPS'),
  async (req, res, next) => {
    try {
      res.json(await svc.listExports(req.params.tenantId as string));
    } catch (e) { next(e); }
  },
);

residencyRouter.post(
  '/tenants/:tenantId/exports',
  requireAgency('OWNER', 'ADMIN', 'OPS'),
  async (req, res, next) => {
    try {
      const r = await requestDataExport(
        req.params.tenantId as string,
        req.auth!.sub,
      );
      res.status(201).json(r);
    } catch (e) { next(e); }
  },
);

residencyRouter.post(
  '/tenants/:tenantId/exports/:exportId/process',
  requireAgency('OWNER', 'ADMIN'),
  async (req, res, next) => {
    try {
      res.json(await processDataExport(req.params.exportId as string));
    } catch (e) { next(e); }
  },
);
