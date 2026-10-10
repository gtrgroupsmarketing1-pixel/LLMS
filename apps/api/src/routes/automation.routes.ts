import { Router } from 'express';
import { requireAuth, requireAgency } from '../middleware/auth';
import * as svc from '../services/automation.service';
import { runAutomationsForTenant } from '@lmms/automations';
import { MockWhatsAppAdapter } from '@lmms/whatsapp';

export const automationRouter = Router();
automationRouter.use(requireAuth);

automationRouter.get(
  '/tenants/:tenantId/automations',
  requireAgency('OWNER', 'ADMIN', 'STRATEGIST', 'OPS'),
  async (req, res, next) => {
    try {
      res.json(await svc.listAutomations(req.params.tenantId as string));
    } catch (e) { next(e); }
  },
);

automationRouter.post(
  '/tenants/:tenantId/automations/seed',
  requireAgency('OWNER', 'ADMIN', 'OPS'),
  async (req, res, next) => {
    try {
      res.json({
        seeded: await svc.ensureAutomationsSeeded(req.params.tenantId as string),
      });
    } catch (e) { next(e); }
  },
);

automationRouter.patch(
  '/tenants/:tenantId/automations/:automationId',
  requireAgency('OWNER', 'ADMIN', 'STRATEGIST'),
  async (req, res, next) => {
    try {
      const updated = await svc.updateAutomation({
        tenantId: req.params.tenantId as string,
        automationId: req.params.automationId as string,
        actorId: req.auth!.sub,
        status: req.body?.status,
        templateId: req.body?.templateId,
        segmentId: req.body?.segmentId,
        priority:
          typeof req.body?.priority === 'number' ? req.body.priority : undefined,
      });
      res.json(updated);
    } catch (e) { next(e); }
  },
);

automationRouter.post(
  '/tenants/:tenantId/automations/:automationId/kill',
  requireAgency('OWNER', 'ADMIN', 'OPS'),
  async (req, res, next) => {
    try {
      const r = await svc.killOne(
        req.params.tenantId as string,
        req.params.automationId as string,
        req.auth!.sub,
        req.body?.reason ? String(req.body.reason) : undefined,
      );
      res.json(r);
    } catch (e) { next(e); }
  },
);

automationRouter.post(
  '/tenants/:tenantId/automations/:automationId/revive',
  requireAgency('OWNER', 'ADMIN'),
  async (req, res, next) => {
    try {
      const r = await svc.reviveOne(
        req.params.tenantId as string,
        req.params.automationId as string,
        req.auth!.sub,
      );
      res.json(r);
    } catch (e) { next(e); }
  },
);

automationRouter.get(
  '/tenants/:tenantId/automations/:automationId/runs',
  requireAgency('OWNER', 'ADMIN', 'STRATEGIST', 'OPS'),
  async (req, res, next) => {
    try {
      res.json(
        await svc.listRuns(
          req.params.tenantId as string,
          req.params.automationId as string,
        ),
      );
    } catch (e) { next(e); }
  },
);

automationRouter.post(
  '/tenants/:tenantId/automations/run-now',
  requireAgency('OWNER', 'ADMIN', 'STRATEGIST', 'OPS'),
  async (req, res, next) => {
    try {
      const summary = await runAutomationsForTenant({
        tenantId: req.params.tenantId as string,
        adapter: new MockWhatsAppAdapter(),
        actorId: req.auth!.sub,
      });
      res.json(summary);
    } catch (e) { next(e); }
  },
);
