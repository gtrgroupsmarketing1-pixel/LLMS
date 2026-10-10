import { Router } from 'express';
import { requireAuth, requireAgency } from '../middleware/auth';
import { requireClient } from '../middleware/requireClient';
import * as svc from '../services/reporting.service';

export const reportingRouter = Router();

// Client-scoped (uses tenant from JWT)
reportingRouter.get('/portal/dashboard', requireClient, async (req, res, next) => {
  try {
    res.json(await svc.getClientDashboard(req.auth!.tenantId!));
  } catch (e) { next(e); }
});

reportingRouter.get('/portal/reports/list', requireClient, async (req, res, next) => {
  try {
    res.json(await svc.listReportsForTenant(req.auth!.tenantId!));
  } catch (e) { next(e); }
});

reportingRouter.get(
  '/portal/reports/:reportId',
  requireClient,
  async (req, res, next) => {
    try {
      const r = await svc.getReport(
        req.auth!.tenantId!,
        req.params.reportId as string,
      );
      if (!r) {
        res.status(404).json({ error: 'not_found' });
        return;
      }
      res.json(r);
    } catch (e) { next(e); }
  },
);

// Agency-scoped
reportingRouter.get(
  '/agency/overview',
  requireAuth,
  requireAgency('OWNER', 'ADMIN', 'STRATEGIST', 'OPS'),
  async (_req, res, next) => {
    try {
      res.json(await svc.getAgencyOverview());
    } catch (e) { next(e); }
  },
);

reportingRouter.get(
  '/tenants/:tenantId/reports',
  requireAuth,
  requireAgency('OWNER', 'ADMIN', 'STRATEGIST', 'OPS'),
  async (req, res, next) => {
    try {
      res.json(await svc.listReportsForTenant(req.params.tenantId as string));
    } catch (e) { next(e); }
  },
);

reportingRouter.post(
  '/tenants/:tenantId/reports/monthly/generate',
  requireAuth,
  requireAgency('OWNER', 'ADMIN', 'STRATEGIST'),
  async (req, res, next) => {
    try {
      res.json(
        await svc.triggerMonthly(
          req.params.tenantId as string,
          req.auth!.sub,
        ),
      );
    } catch (e) { next(e); }
  },
);

reportingRouter.post(
  '/tenants/:tenantId/reports/weekly/generate',
  requireAuth,
  requireAgency('OWNER', 'ADMIN', 'STRATEGIST'),
  async (req, res, next) => {
    try {
      res.json(
        await svc.triggerWeekly(
          req.params.tenantId as string,
          req.auth!.sub,
        ),
      );
    } catch (e) { next(e); }
  },
);

reportingRouter.get(
  '/tenants/:tenantId/dashboard',
  requireAuth,
  requireAgency('OWNER', 'ADMIN', 'STRATEGIST', 'OPS', 'DESIGNER'),
  async (req, res, next) => {
    try {
      res.json(await svc.getClientDashboard(req.params.tenantId as string));
    } catch (e) { next(e); }
  },
);
