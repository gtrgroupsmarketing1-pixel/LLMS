import { Router } from 'express';
import { requireAuth, requireAgency } from '../middleware/auth';
import * as svc from '../services/journey.service';
import { validateGraph } from '@lmms/journey-builder';
import { runJourneysForTenant } from '@lmms/journey-builder';
import { MockWhatsAppAdapter } from '@lmms/whatsapp';

export const journeyRouter = Router();
journeyRouter.use(requireAuth);

journeyRouter.get(
  '/tenants/:tenantId/journeys',
  requireAgency('OWNER', 'ADMIN', 'STRATEGIST', 'OPS'),
  async (req, res, next) => {
    try {
      res.json(await svc.listJourneys(req.params.tenantId as string));
    } catch (e) { next(e); }
  },
);

journeyRouter.post(
  '/tenants/:tenantId/journeys',
  requireAgency('OWNER', 'ADMIN', 'STRATEGIST'),
  async (req, res, next) => {
    try {
      const journey = await svc.createJourney({
        tenantId: req.params.tenantId as string,
        actorId: req.auth!.sub,
        name: String(req.body?.name ?? ''),
        nameAr: req.body?.nameAr ? String(req.body.nameAr) : undefined,
        definition: req.body?.definition,
        priority: typeof req.body?.priority === 'number' ? req.body.priority : undefined,
        frequencyCapHours:
          typeof req.body?.frequencyCapHours === 'number'
            ? req.body.frequencyCapHours
            : undefined,
      });
      res.status(201).json(journey);
    } catch (e) { next(e); }
  },
);

journeyRouter.post(
  '/tenants/:tenantId/journeys/validate',
  requireAgency('OWNER', 'ADMIN', 'STRATEGIST'),
  async (req, res, next) => {
    try {
      res.json(validateGraph(req.body?.definition));
    } catch (e) { next(e); }
  },
);

journeyRouter.post(
  '/tenants/:tenantId/journeys/simulate',
  requireAgency('OWNER', 'ADMIN', 'STRATEGIST', 'OPS'),
  async (req, res, next) => {
    try {
      res.json(
        await svc.simulate(req.params.tenantId as string, req.body?.definition),
      );
    } catch (e) { next(e); }
  },
);

journeyRouter.get(
  '/tenants/:tenantId/journeys/:journeyId',
  requireAgency('OWNER', 'ADMIN', 'STRATEGIST', 'OPS', 'DESIGNER'),
  async (req, res, next) => {
    try {
      const j = await svc.getJourney(
        req.params.tenantId as string,
        req.params.journeyId as string,
      );
      if (!j) {
        res.status(404).json({ error: 'not_found' });
        return;
      }
      res.json(j);
    } catch (e) { next(e); }
  },
);

journeyRouter.patch(
  '/tenants/:tenantId/journeys/:journeyId',
  requireAgency('OWNER', 'ADMIN', 'STRATEGIST'),
  async (req, res, next) => {
    try {
      const updated = await svc.updateJourney({
        tenantId: req.params.tenantId as string,
        actorId: req.auth!.sub,
        journeyId: req.params.journeyId as string,
        patch: {
          name: req.body?.name,
          nameAr: req.body?.nameAr,
          definition: req.body?.definition,
          priority: req.body?.priority,
          frequencyCapHours: req.body?.frequencyCapHours,
        },
        changeNote: req.body?.changeNote,
      });
      res.json(updated);
    } catch (e) { next(e); }
  },
);

journeyRouter.post(
  '/tenants/:tenantId/journeys/:journeyId/publish',
  requireAgency('OWNER', 'ADMIN', 'STRATEGIST'),
  async (req, res, next) => {
    try {
      res.json(
        await svc.publishJourney(
          req.params.tenantId as string,
          req.params.journeyId as string,
          req.auth!.sub,
        ),
      );
    } catch (e) { next(e); }
  },
);

journeyRouter.post(
  '/tenants/:tenantId/journeys/:journeyId/pause',
  requireAgency('OWNER', 'ADMIN', 'STRATEGIST'),
  async (req, res, next) => {
    try {
      res.json(
        await svc.pauseJourney(
          req.params.tenantId as string,
          req.params.journeyId as string,
          req.auth!.sub,
        ),
      );
    } catch (e) { next(e); }
  },
);

journeyRouter.post(
  '/tenants/:tenantId/journeys/:journeyId/archive',
  requireAgency('OWNER', 'ADMIN'),
  async (req, res, next) => {
    try {
      res.json(
        await svc.archiveJourney(
          req.params.tenantId as string,
          req.params.journeyId as string,
          req.auth!.sub,
        ),
      );
    } catch (e) { next(e); }
  },
);

journeyRouter.post(
  '/tenants/:tenantId/journeys/:journeyId/kill',
  requireAgency('OWNER', 'ADMIN', 'OPS'),
  async (req, res, next) => {
    try {
      res.json(
        await svc.killJourney(
          req.params.tenantId as string,
          req.params.journeyId as string,
          req.auth!.sub,
          req.body?.reason ? String(req.body.reason) : undefined,
        ),
      );
    } catch (e) { next(e); }
  },
);

journeyRouter.post(
  '/tenants/:tenantId/journeys/:journeyId/revive',
  requireAgency('OWNER', 'ADMIN'),
  async (req, res, next) => {
    try {
      res.json(
        await svc.reviveJourney(
          req.params.tenantId as string,
          req.params.journeyId as string,
          req.auth!.sub,
        ),
      );
    } catch (e) { next(e); }
  },
);

journeyRouter.get(
  '/tenants/:tenantId/journeys/:journeyId/runs',
  requireAgency('OWNER', 'ADMIN', 'STRATEGIST', 'OPS'),
  async (req, res, next) => {
    try {
      res.json(
        await svc.listRunsForJourney(
          req.params.tenantId as string,
          req.params.journeyId as string,
        ),
      );
    } catch (e) { next(e); }
  },
);

journeyRouter.post(
  '/tenants/:tenantId/journeys/run-now',
  requireAgency('OWNER', 'ADMIN', 'STRATEGIST', 'OPS'),
  async (req, res, next) => {
    try {
      const summary = await runJourneysForTenant({
        tenantId: req.params.tenantId as string,
        adapter: new MockWhatsAppAdapter(),
        actorId: req.auth!.sub,
      });
      res.json(summary);
    } catch (e) { next(e); }
  },
);
