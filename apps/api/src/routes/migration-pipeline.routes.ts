import { Router } from 'express';
import { requireAuth, requireAgency } from '../middleware/auth';
import * as svc from '../services/migration-pipeline.service';

export const migrationPipelineRouter = Router();
migrationPipelineRouter.use(requireAuth);

migrationPipelineRouter.get(
  '/pipeline',
  requireAgency('OWNER', 'ADMIN', 'OPS', 'STRATEGIST'),
  async (_req, res, next) => {
    try {
      res.json(await svc.rankedPipeline());
    } catch (e) { next(e); }
  },
);

migrationPipelineRouter.post(
  '/tenants/:tenantId/score',
  requireAgency('OWNER', 'ADMIN', 'OPS'),
  async (req, res, next) => {
    try {
      res.json(await svc.scoreAndRecord(req.params.tenantId as string));
    } catch (e) { next(e); }
  },
);

migrationPipelineRouter.get(
  '/tenants/:tenantId/pitch-pack',
  requireAgency('OWNER', 'ADMIN', 'OPS', 'STRATEGIST'),
  async (req, res, next) => {
    try {
      res.json(await svc.buildPitchPack(req.params.tenantId as string));
    } catch (e) { next(e); }
  },
);

migrationPipelineRouter.post(
  '/tenants/:tenantId/pitch',
  requireAgency('OWNER', 'ADMIN', 'OPS'),
  async (req, res, next) => {
    try {
      res.status(201).json(
        await svc.sendPitch({
          tenantId: req.params.tenantId as string,
          actorId: req.auth!.sub,
        }),
      );
    } catch (e) { next(e); }
  },
);

migrationPipelineRouter.post(
  '/pitches/:pitchId/outcome',
  requireAgency('OWNER', 'ADMIN', 'OPS'),
  async (req, res, next) => {
    try {
      res.json(
        await svc.recordPitchOutcome({
          tenantId: String(req.body?.tenantId ?? ''),
          actorId: req.auth!.sub,
          pitchId: req.params.pitchId as string,
          outcome: (req.body?.outcome ?? 'DEFERRED') as never,
          note: req.body?.note ? String(req.body.note) : undefined,
        }),
      );
    } catch (e) { next(e); }
  },
);

migrationPipelineRouter.post(
  '/pitches/:pitchId/converted',
  requireAgency('OWNER', 'ADMIN'),
  async (req, res, next) => {
    try {
      res.json(
        await svc.markConverted({
          tenantId: String(req.body?.tenantId ?? ''),
          actorId: req.auth!.sub,
          pitchId: req.params.pitchId as string,
        }),
      );
    } catch (e) { next(e); }
  },
);

migrationPipelineRouter.get(
  '/pitches',
  requireAgency('OWNER', 'ADMIN', 'OPS', 'STRATEGIST'),
  async (req, res, next) => {
    try {
      const tenantId = req.query.tenantId ? String(req.query.tenantId) : undefined;
      res.json(await svc.listPitches(tenantId));
    } catch (e) { next(e); }
  },
);

migrationPipelineRouter.get(
  '/conversion-report',
  requireAgency('OWNER', 'ADMIN', 'STRATEGIST'),
  async (req, res, next) => {
    try {
      const days = req.query.days ? Number(req.query.days) : 90;
      res.json(await svc.pipelineConversionReport(days));
    } catch (e) { next(e); }
  },
);
