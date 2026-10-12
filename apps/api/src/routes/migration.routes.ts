import { Router } from 'express';
import { requireAuth, requireAgency } from '../middleware/auth';
import * as svc from '../services/migration.service';
import { MockErpAdapter } from '@lmms/ingestion';

export const migrationRouter = Router();
migrationRouter.use(requireAuth);

migrationRouter.get(
  '/tenants/:tenantId/migration/jobs',
  requireAgency('OWNER', 'ADMIN', 'OPS', 'STRATEGIST'),
  async (req, res, next) => {
    try {
      res.json(await svc.listJobs(req.params.tenantId as string));
    } catch (e) { next(e); }
  },
);

migrationRouter.get(
  '/tenants/:tenantId/migration/jobs/:jobId',
  requireAgency('OWNER', 'ADMIN', 'OPS', 'STRATEGIST'),
  async (req, res, next) => {
    try {
      const data = await svc.getJob(
        req.params.tenantId as string,
        req.params.jobId as string,
      );
      if (!data) {
        res.status(404).json({ error: 'not_found' });
        return;
      }
      res.json(data);
    } catch (e) { next(e); }
  },
);

migrationRouter.get(
  '/tenants/:tenantId/migration/jobs/:jobId/unmatched',
  requireAgency('OWNER', 'ADMIN', 'OPS'),
  async (req, res, next) => {
    try {
      res.json(
        await svc.listUnmatched(
          req.params.tenantId as string,
          req.params.jobId as string,
        ),
      );
    } catch (e) { next(e); }
  },
);

migrationRouter.post(
  '/tenants/:tenantId/migration/start',
  requireAgency('OWNER', 'ADMIN', 'OPS'),
  async (req, res, next) => {
    try {
      const adapter = new MockErpAdapter();
      const result = await svc.startMigration({
        tenantId: req.params.tenantId as string,
        actorId: req.auth!.sub,
        adapter,
      });
      res.status(201).json(result);
    } catch (e) { next(e); }
  },
);

migrationRouter.post(
  '/tenants/:tenantId/migration/jobs/:jobId/resolve-match',
  requireAgency('OWNER', 'ADMIN', 'OPS'),
  async (req, res, next) => {
    try {
      const result = await svc.resolveMatch({
        tenantId: req.params.tenantId as string,
        actorId: req.auth!.sub,
        jobId: req.params.jobId as string,
        matchId: String(req.body?.matchId ?? ''),
        erpExternalId: req.body?.erpExternalId
          ? String(req.body.erpExternalId)
          : null,
        decision: req.body?.decision === 'SKIP' ? 'SKIP' : 'ASSIGN',
      });
      res.json(result);
    } catch (e) { next(e); }
  },
);

migrationRouter.post(
  '/tenants/:tenantId/migration/jobs/:jobId/backfill',
  requireAgency('OWNER', 'ADMIN', 'OPS'),
  async (req, res, next) => {
    try {
      const adapter = new MockErpAdapter();
      const result = await svc.backfillOrders({
        tenantId: req.params.tenantId as string,
        actorId: req.auth!.sub,
        jobId: req.params.jobId as string,
        adapter,
      });
      res.json(result);
    } catch (e) { next(e); }
  },
);

migrationRouter.post(
  '/tenants/:tenantId/migration/jobs/:jobId/complete',
  requireAgency('OWNER', 'ADMIN'),
  async (req, res, next) => {
    try {
      res.json(
        await svc.completeMigration({
          tenantId: req.params.tenantId as string,
          actorId: req.auth!.sub,
          jobId: req.params.jobId as string,
        }),
      );
    } catch (e) { next(e); }
  },
);

migrationRouter.post(
  '/tenants/:tenantId/migration/jobs/:jobId/rollback',
  requireAgency('OWNER', 'ADMIN'),
  async (req, res, next) => {
    try {
      res.json(
        await svc.rollbackMigration({
          tenantId: req.params.tenantId as string,
          actorId: req.auth!.sub,
          jobId: req.params.jobId as string,
          reason: req.body?.reason ? String(req.body.reason) : undefined,
        }),
      );
    } catch (e) { next(e); }
  },
);
