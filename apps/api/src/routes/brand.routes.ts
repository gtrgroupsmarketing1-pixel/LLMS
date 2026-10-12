import { Router } from 'express';
import { requireAuth, requireAgency } from '../middleware/auth';
import { requireClient } from '../middleware/requireClient';
import * as svc from '../services/brand.service';

export const brandRouter = Router();

// Agency routes
brandRouter.get(
  '/tenants/:tenantId/brand-kit',
  requireAuth,
  requireAgency('OWNER', 'ADMIN', 'STRATEGIST', 'DESIGNER', 'OPS'),
  async (req, res, next) => {
    try {
      res.json(await svc.getBrandKit(req.params.tenantId as string));
    } catch (e) { next(e); }
  },
);

brandRouter.put(
  '/tenants/:tenantId/brand-kit',
  requireAuth,
  requireAgency('OWNER', 'ADMIN', 'STRATEGIST', 'DESIGNER'),
  async (req, res, next) => {
    try {
      res.json(
        await svc.upsertBrandKit({
          tenantId: req.params.tenantId as string,
          actorId: req.auth!.sub,
          input: {
            tagline: req.body?.tagline ?? null,
            taglineAr: req.body?.taglineAr ?? null,
            tone: req.body?.tone ?? null,
            toneAr: req.body?.toneAr ?? null,
            logoVariants: req.body?.logoVariants ?? null,
            colors: req.body?.colors ?? null,
            fonts: req.body?.fonts ?? null,
          },
        }),
      );
    } catch (e) { next(e); }
  },
);

brandRouter.post(
  '/tenants/:tenantId/brand-kit/submit',
  requireAuth,
  requireAgency('OWNER', 'ADMIN', 'STRATEGIST', 'DESIGNER'),
  async (req, res, next) => {
    try {
      res.json(
        await svc.submitForClientReview(
          req.params.tenantId as string,
          req.auth!.sub,
        ),
      );
    } catch (e) { next(e); }
  },
);

brandRouter.get(
  '/tenants/:tenantId/assets',
  requireAuth,
  requireAgency('OWNER', 'ADMIN', 'STRATEGIST', 'DESIGNER', 'OPS'),
  async (req, res, next) => {
    try {
      res.json(
        await svc.listAssets({
          tenantId: req.params.tenantId as string,
          category: req.query.category ? (String(req.query.category) as never) : undefined,
          search: req.query.search ? String(req.query.search) : undefined,
          expiringSoonDays: req.query.expiringSoonDays
            ? Number(req.query.expiringSoonDays)
            : undefined,
        }),
      );
    } catch (e) { next(e); }
  },
);

brandRouter.post(
  '/tenants/:tenantId/assets',
  requireAuth,
  requireAgency('OWNER', 'ADMIN', 'STRATEGIST', 'DESIGNER'),
  async (req, res, next) => {
    try {
      const asset = await svc.createAsset({
        tenantId: req.params.tenantId as string,
        actorId: req.auth!.sub,
        name: String(req.body?.name ?? ''),
        nameAr: req.body?.nameAr ? String(req.body.nameAr) : undefined,
        category: (req.body?.category ?? 'OTHER') as never,
        fileUrl: String(req.body?.fileUrl ?? ''),
        fileMime: req.body?.fileMime ? String(req.body.fileMime) : undefined,
        fileSizeBytes:
          typeof req.body?.fileSizeBytes === 'number'
            ? req.body.fileSizeBytes
            : undefined,
        fileWidth:
          typeof req.body?.fileWidth === 'number' ? req.body.fileWidth : undefined,
        fileHeight:
          typeof req.body?.fileHeight === 'number' ? req.body.fileHeight : undefined,
        tags: req.body?.tags,
        usageRights: req.body?.usageRights as never,
        usageRightsNotes: req.body?.usageRightsNotes
          ? String(req.body.usageRightsNotes)
          : undefined,
        usageExpiresAt: req.body?.usageExpiresAt
          ? new Date(String(req.body.usageExpiresAt))
          : undefined,
      });
      res.status(201).json(asset);
    } catch (e) { next(e); }
  },
);

brandRouter.patch(
  '/tenants/:tenantId/assets/:assetId',
  requireAuth,
  requireAgency('OWNER', 'ADMIN', 'DESIGNER'),
  async (req, res, next) => {
    try {
      res.json(
        await svc.updateAssetUsage({
          tenantId: req.params.tenantId as string,
          actorId: req.auth!.sub,
          assetId: req.params.assetId as string,
          usageRights: req.body?.usageRights as never,
          usageRightsNotes:
            req.body?.usageRightsNotes !== undefined
              ? String(req.body.usageRightsNotes)
              : undefined,
          usageExpiresAt:
            req.body?.usageExpiresAt !== undefined
              ? req.body.usageExpiresAt
                ? new Date(String(req.body.usageExpiresAt))
                : null
              : undefined,
        }),
      );
    } catch (e) { next(e); }
  },
);

brandRouter.delete(
  '/tenants/:tenantId/assets/:assetId',
  requireAuth,
  requireAgency('OWNER', 'ADMIN'),
  async (req, res, next) => {
    try {
      res.json(
        await svc.deleteAsset(
          req.params.tenantId as string,
          req.auth!.sub,
          req.params.assetId as string,
        ),
      );
    } catch (e) { next(e); }
  },
);

brandRouter.get(
  '/tenants/:tenantId/consistency',
  requireAuth,
  requireAgency('OWNER', 'ADMIN', 'STRATEGIST', 'DESIGNER'),
  async (req, res, next) => {
    try {
      res.json(await svc.runConsistencyCheck(req.params.tenantId as string));
    } catch (e) { next(e); }
  },
);

brandRouter.get(
  '/tenants/:tenantId/expiring-assets',
  requireAuth,
  requireAgency('OWNER', 'ADMIN', 'STRATEGIST', 'OPS'),
  async (req, res, next) => {
    try {
      res.json(
        await svc.listExpiringAssets(
          req.params.tenantId as string,
          req.query.days ? Number(req.query.days) : 30,
        ),
      );
    } catch (e) { next(e); }
  },
);

brandRouter.get(
  '/tenants/:tenantId/brand-project',
  requireAuth,
  requireAgency('OWNER', 'ADMIN', 'STRATEGIST', 'DESIGNER', 'OPS'),
  async (req, res, next) => {
    try {
      res.json(await svc.getBrandProject(req.params.tenantId as string));
    } catch (e) { next(e); }
  },
);

brandRouter.post(
  '/tenants/:tenantId/brand-project',
  requireAuth,
  requireAgency('OWNER', 'ADMIN', 'STRATEGIST'),
  async (req, res, next) => {
    try {
      res.status(201).json(
        await svc.createBrandProject({
          tenantId: req.params.tenantId as string,
          actorId: req.auth!.sub,
          name: String(req.body?.name ?? 'Brand Foundation'),
          milestones: (req.body?.milestones ?? []) as never,
        }),
      );
    } catch (e) { next(e); }
  },
);

brandRouter.post(
  '/tenants/:tenantId/brand-project/:projectId/milestones/:key',
  requireAuth,
  requireAgency('OWNER', 'ADMIN', 'STRATEGIST', 'DESIGNER'),
  async (req, res, next) => {
    try {
      res.json(
        await svc.updateMilestone({
          tenantId: req.params.tenantId as string,
          actorId: req.auth!.sub,
          projectId: req.params.projectId as string,
          milestoneKey: req.params.key as string,
          status: (req.body?.status ?? 'DONE') as never,
        }),
      );
    } catch (e) { next(e); }
  },
);

// Client routes
brandRouter.get(
  '/portal/tenants/:tenantId/brand-kit',
  requireClient,
  async (req, res, next) => {
    try {
      res.json(await svc.getBrandKit(req.auth!.tenantId!));
    } catch (e) { next(e); }
  },
);

brandRouter.post(
  '/portal/tenants/:tenantId/brand-kit/approve',
  requireClient,
  async (req, res, next) => {
    try {
      res.json(
        await svc.approveBrandKit(req.auth!.tenantId!, req.auth!.sub),
      );
    } catch (e) { next(e); }
  },
);
