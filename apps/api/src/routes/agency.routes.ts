import { Router } from 'express';
import { requireAuth, requireAgency } from '../middleware/auth';
import * as svc from '../services/agency.service';
import { SOP_LIBRARY } from '@lmms/agency';

export const agencyRouter = Router();
agencyRouter.use(requireAuth);

agencyRouter.get(
  '/sops',
  requireAgency('OWNER', 'ADMIN', 'STRATEGIST', 'DESIGNER', 'OPS'),
  async (_req, res, next) => {
    try {
      res.json(await svc.listSops());
    } catch (e) { next(e); }
  },
);

agencyRouter.get(
  '/sops/library',
  requireAgency('OWNER', 'ADMIN', 'STRATEGIST', 'DESIGNER', 'OPS'),
  async (_req, res, next) => {
    try {
      res.json(SOP_LIBRARY);
    } catch (e) { next(e); }
  },
);

agencyRouter.post(
  '/sops/seed',
  requireAgency('OWNER', 'ADMIN'),
  async (_req, res, next) => {
    try {
      res.json({ seeded: await svc.seedSops() });
    } catch (e) { next(e); }
  },
);

agencyRouter.post(
  '/sops/:key/complete',
  requireAgency('OWNER', 'ADMIN', 'STRATEGIST', 'DESIGNER', 'OPS'),
  async (req, res, next) => {
    try {
      res.status(201).json(
        await svc.recordSopCompletion({
          actorId: req.auth!.sub,
          sopKey: req.params.key as string,
          tenantId: req.body?.tenantId ? String(req.body.tenantId) : undefined,
          entityType: req.body?.entityType ? String(req.body.entityType) : undefined,
          entityId: req.body?.entityId ? String(req.body.entityId) : undefined,
          notes: req.body?.notes ? String(req.body.notes) : undefined,
        }),
      );
    } catch (e) { next(e); }
  },
);

agencyRouter.get(
  '/sops/:key/completions',
  requireAgency('OWNER', 'ADMIN', 'STRATEGIST', 'OPS'),
  async (req, res, next) => {
    try {
      res.json(await svc.listSopCompletions(req.params.key as string));
    } catch (e) { next(e); }
  },
);

agencyRouter.get(
  '/tasks',
  requireAgency('OWNER', 'ADMIN', 'STRATEGIST', 'DESIGNER', 'OPS'),
  async (req, res, next) => {
    try {
      res.json(
        await svc.listTasks({
          tenantId: req.query.tenantId ? String(req.query.tenantId) : undefined,
          status: req.query.status ? String(req.query.status) : undefined,
          assignedTo: req.query.assignedTo ? String(req.query.assignedTo) : undefined,
          linkType: req.query.linkType ? String(req.query.linkType) : undefined,
          linkId: req.query.linkId ? String(req.query.linkId) : undefined,
        }),
      );
    } catch (e) { next(e); }
  },
);

agencyRouter.post(
  '/tasks',
  requireAgency('OWNER', 'ADMIN', 'STRATEGIST', 'DESIGNER', 'OPS'),
  async (req, res, next) => {
    try {
      res.status(201).json(
        await svc.createTask({
          tenantId: req.body?.tenantId ? String(req.body.tenantId) : undefined,
          title: String(req.body?.title ?? ''),
          description: req.body?.description ? String(req.body.description) : undefined,
          priority: req.body?.priority as never,
          linkType: req.body?.linkType as never,
          linkId: req.body?.linkId ? String(req.body.linkId) : undefined,
          assignedTo: req.body?.assignedTo ? String(req.body.assignedTo) : undefined,
          dueAt: req.body?.dueAt ? new Date(String(req.body.dueAt)) : undefined,
          createdBy: req.auth!.sub,
        }),
      );
    } catch (e) { next(e); }
  },
);

agencyRouter.post(
  '/tasks/:taskId/transition',
  requireAgency('OWNER', 'ADMIN', 'STRATEGIST', 'DESIGNER', 'OPS'),
  async (req, res, next) => {
    try {
      res.json(
        await svc.transitionTask({
          actorId: req.auth!.sub,
          taskId: req.params.taskId as string,
          to: req.body?.to as never,
        }),
      );
    } catch (e) { next(e); }
  },
);

agencyRouter.post(
  '/tasks/:taskId/time',
  requireAgency('OWNER', 'ADMIN', 'STRATEGIST', 'DESIGNER', 'OPS'),
  async (req, res, next) => {
    try {
      res.status(201).json(
        await svc.logTime({
          actorId: req.auth!.sub,
          tenantId: req.body?.tenantId ? String(req.body.tenantId) : undefined,
          taskId: req.params.taskId as string,
          minutes: Number(req.body?.minutes ?? 0),
          note: req.body?.note ? String(req.body.note) : undefined,
          startedAt: new Date(String(req.body?.startedAt ?? new Date().toISOString())),
          endedAt: new Date(String(req.body?.endedAt ?? new Date().toISOString())),
        }),
      );
    } catch (e) { next(e); }
  },
);

agencyRouter.post(
  '/comments',
  requireAgency('OWNER', 'ADMIN', 'STRATEGIST', 'DESIGNER', 'OPS'),
  async (req, res, next) => {
    try {
      res.status(201).json(
        await svc.addInternalComment({
          actorId: req.auth!.sub,
          tenantId: req.body?.tenantId ? String(req.body.tenantId) : undefined,
          entityType: String(req.body?.entityType ?? ''),
          entityId: String(req.body?.entityId ?? ''),
          body: String(req.body?.body ?? ''),
        }),
      );
    } catch (e) { next(e); }
  },
);

agencyRouter.get(
  '/comments',
  requireAgency('OWNER', 'ADMIN', 'STRATEGIST', 'DESIGNER', 'OPS'),
  async (req, res, next) => {
    try {
      res.json(
        await svc.listInternalComments({
          entityType: String(req.query.entityType ?? ''),
          entityId: String(req.query.entityId ?? ''),
        }),
      );
    } catch (e) { next(e); }
  },
);

agencyRouter.get(
  '/workload',
  requireAgency('OWNER', 'ADMIN', 'OPS'),
  async (_req, res, next) => {
    try {
      res.json(await svc.workloadSnapshot());
    } catch (e) { next(e); }
  },
);

agencyRouter.get(
  '/digest',
  requireAgency('OWNER', 'ADMIN', 'STRATEGIST', 'OPS'),
  async (_req, res, next) => {
    try {
      res.json(await svc.buildDailyDigest());
    } catch (e) { next(e); }
  },
);

agencyRouter.post(
  '/bulk-approve',
  requireAgency('OWNER', 'ADMIN', 'STRATEGIST'),
  async (req, res, next) => {
    try {
      res.json(
        await svc.bulkApprove({
          actorId: req.auth!.sub,
          campaignIds: (req.body?.campaignIds ?? []) as string[],
        }),
      );
    } catch (e) { next(e); }
  },
);
