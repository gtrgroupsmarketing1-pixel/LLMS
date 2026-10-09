import { Router } from 'express';
import { requireAuth, requireAgency } from '../middleware/auth';
import * as svc from '../services/segmentation.service';

export const segmentationRouter = Router();
segmentationRouter.use(requireAuth);

segmentationRouter.get(
  '/tenants/:tenantId/segments',
  requireAgency('OWNER', 'ADMIN', 'STRATEGIST', 'OPS'),
  async (req, res, next) => {
    try {
      res.json(await svc.listSegments(req.params.tenantId as string));
    } catch (e) {
      next(e);
    }
  },
);

segmentationRouter.post(
  '/tenants/:tenantId/segments',
  requireAgency('OWNER', 'ADMIN', 'STRATEGIST'),
  async (req, res, next) => {
    try {
      const created = await svc.createSegment({
        tenantId: req.params.tenantId as string,
        actorId: req.auth!.sub,
        name: String(req.body?.name ?? ''),
        nameAr: req.body?.nameAr ? String(req.body.nameAr) : undefined,
        definition: req.body?.definition,
      });
      res.status(201).json(created);
    } catch (e) {
      next(e);
    }
  },
);

segmentationRouter.post(
  '/tenants/:tenantId/segments/preview',
  requireAgency('OWNER', 'ADMIN', 'STRATEGIST', 'OPS'),
  async (req, res, next) => {
    try {
      res.json(
        await svc.previewDefinition(
          req.params.tenantId as string,
          req.body?.definition,
        ),
      );
    } catch (e) {
      next(e);
    }
  },
);

segmentationRouter.get(
  '/segments/:segmentId/preview',
  requireAgency('OWNER', 'ADMIN', 'STRATEGIST', 'OPS'),
  async (req, res, next) => {
    try {
      res.json(await svc.previewSaved(req.params.segmentId as string));
    } catch (e) {
      next(e);
    }
  },
);

segmentationRouter.post(
  '/tenants/:tenantId/segments/refresh-all',
  requireAgency('OWNER', 'ADMIN', 'STRATEGIST', 'OPS'),
  async (req, res, next) => {
    try {
      res.json(
        await svc.refreshAll(req.params.tenantId as string, req.auth!.sub),
      );
    } catch (e) {
      next(e);
    }
  },
);

segmentationRouter.post(
  '/tenants/:tenantId/segments/ensure-prebuilt',
  requireAgency('OWNER', 'ADMIN', 'OPS'),
  async (req, res, next) => {
    try {
      res.json({
        seeded: await svc.ensurePrebuilt(req.params.tenantId as string),
      });
    } catch (e) {
      next(e);
    }
  },
);

segmentationRouter.get(
  '/segments/:segmentId/history',
  requireAgency('OWNER', 'ADMIN', 'STRATEGIST', 'OPS'),
  async (req, res, next) => {
    try {
      res.json(await svc.segmentSizeHistory(req.params.segmentId as string));
    } catch (e) {
      next(e);
    }
  },
);
