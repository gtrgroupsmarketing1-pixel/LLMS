import { Router } from 'express';
import { requireAuth, requireAgency } from '../middleware/auth';
import * as attr from '../services/attribution.service';

export const attributionRouter = Router();
attributionRouter.use(requireAuth);

attributionRouter.get(
  '/tenants/:tenantId/attribution/report',
  requireAgency('OWNER', 'ADMIN', 'STRATEGIST', 'OPS'),
  async (req, res, next) => {
    try {
      const days = req.query.days ? Number(req.query.days) : 30;
      const since = new Date(Date.now() - days * 86_400_000);
      const until = new Date();
      res.json(
        await attr.buildReport(req.params.tenantId as string, since, until),
      );
    } catch (e) { next(e); }
  },
);

attributionRouter.post(
  '/tenants/:tenantId/attribution/reattribute',
  requireAgency('OWNER', 'ADMIN', 'STRATEGIST', 'OPS'),
  async (req, res, next) => {
    try {
      const days = req.body?.days ? Number(req.body.days) : 30;
      const since = new Date(Date.now() - days * 86_400_000);
      res.json(
        await attr.reattributeOrders({
          tenantId: req.params.tenantId as string,
          actorId: req.auth!.sub,
          since,
        }),
      );
    } catch (e) { next(e); }
  },
);

attributionRouter.post(
  '/tenants/:tenantId/attribution/manual',
  requireAgency('OWNER', 'ADMIN'),
  async (req, res, next) => {
    try {
      res.status(201).json(
        await attr.attributeManual({
          tenantId: req.params.tenantId as string,
          actorId: req.auth!.sub,
          customerId: req.body?.customerId ? String(req.body.customerId) : undefined,
          campaignId: req.body?.campaignId ? String(req.body.campaignId) : undefined,
          revenue: Number(req.body?.revenue ?? 0),
          currency: String(req.body?.currency ?? 'AED'),
          note: req.body?.note ? String(req.body.note) : undefined,
        }),
      );
    } catch (e) { next(e); }
  },
);
