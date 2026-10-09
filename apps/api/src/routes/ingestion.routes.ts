import { Router } from 'express';
import multer from 'multer';
import { requireAuth, requireAgency } from '../middleware/auth';
import * as svc from '../services/ingestion.service';

export const ingestionRouter = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 200 * 1024 * 1024 },
});

ingestionRouter.use(requireAuth);

ingestionRouter.post(
  '/tenants/:tenantId/csv',
  requireAgency('OWNER', 'ADMIN', 'OPS', 'STRATEGIST'),
  upload.single('file'),
  async (req, res, next) => {
    try {
      if (!req.file) {
        res.status(400).json({ error: 'missing_file' });
        return;
      }
      const hasExplicitConsent = req.body?.hasExplicitConsent === 'true';
      const result = await svc.ingestCsv({
        tenantId: req.params.tenantId as string,
        actorId: req.auth!.sub,
        filename: req.file.originalname,
        content: req.file.buffer,
        hasExplicitConsent,
      });
      res.json(result);
    } catch (e) {
      next(e);
    }
  },
);

ingestionRouter.post(
  '/tenants/:tenantId/customers/manual',
  requireAgency('OWNER', 'ADMIN', 'OPS', 'STRATEGIST'),
  async (req, res, next) => {
    try {
      const created = await svc.addManualCustomer({
        tenantId: req.params.tenantId as string,
        actorId: req.auth!.sub,
        phone: String(req.body?.phone ?? ''),
        email: req.body?.email ? String(req.body.email) : undefined,
        name: req.body?.name ? String(req.body.name) : undefined,
        language: req.body?.language ? String(req.body.language) : undefined,
        zone: req.body?.zone ? String(req.body.zone) : undefined,
        hasConsent: req.body?.hasConsent === true,
      });
      res.status(201).json(created);
    } catch (e) {
      next(e);
    }
  },
);

ingestionRouter.post(
  '/tenants/:tenantId/whatsapp-optin',
  async (req, res, next) => {
    try {
      const created = await svc.captureWhatsAppOptin({
        tenantId: req.params.tenantId as string,
        phone: String(req.body?.phone ?? ''),
        name: req.body?.name ? String(req.body.name) : undefined,
        language: req.body?.language ? String(req.body.language) : undefined,
        evidence: String(req.body?.evidence ?? 'whatsapp_keyword'),
      });
      res.status(201).json(created);
    } catch (e) {
      next(e);
    }
  },
);

ingestionRouter.get(
  '/tenants/:tenantId/data-sources',
  requireAgency('OWNER', 'ADMIN', 'OPS', 'STRATEGIST', 'DESIGNER'),
  async (req, res, next) => {
    try {
      res.json(await svc.listDataSources(req.params.tenantId as string));
    } catch (e) {
      next(e);
    }
  },
);

ingestionRouter.get(
  '/tenants/:tenantId/data-freshness',
  requireAgency('OWNER', 'ADMIN', 'OPS', 'STRATEGIST', 'DESIGNER'),
  async (req, res, next) => {
    try {
      res.json(await svc.dataFreshness(req.params.tenantId as string));
    } catch (e) {
      next(e);
    }
  },
);

ingestionRouter.post(
  '/tenants/:tenantId/data-sources',
  requireAgency('OWNER', 'ADMIN', 'OPS'),
  async (req, res, next) => {
    try {
      const ds = await svc.upsertDataSource({
        tenantId: req.params.tenantId as string,
        type: String(req.body?.type ?? 'CSV') as never,
        config: req.body?.config,
      });
      res.status(201).json(ds);
    } catch (e) {
      next(e);
    }
  },
);
