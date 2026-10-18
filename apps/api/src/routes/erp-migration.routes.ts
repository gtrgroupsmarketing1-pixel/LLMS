import { Router } from 'express';
import multer from 'multer';
import { requireAuth, requireAgency } from '../middleware/auth';
import * as svc from '../services/erp-migration.service';

export const erpMigrationRouter = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } });

erpMigrationRouter.use(requireAuth);

erpMigrationRouter.post(
  '/tenants/:tenantId/upload',
  requireAgency('OWNER', 'ADMIN', 'OPS'),
  upload.single('file'),
  async (req, res, next) => {
    try {
      if (!req.file) {
        res.status(400).json({ error: 'missing_file' });
        return;
      }
      const sourceSystem = String(req.body?.sourceSystem ?? 'UNKNOWN');
      const result = await svc.uploadFile(
        req.params.tenantId as string,
        sourceSystem,
        req.file.buffer,
      );
      res.status(201).json(result);
    } catch (e) { next(e); }
  },
);

erpMigrationRouter.get(
  '/tenants/:tenantId/jobs/:jobId',
  requireAgency('OWNER', 'ADMIN', 'OPS'),
  async (req, res, next) => {
    try {
      const job = await svc.getJob(
        req.params.tenantId as string,
        req.params.jobId as string,
      );
      if (!job) {
        res.status(404).json({ error: 'not_found' });
        return;
      }
      res.json(job);
    } catch (e) { next(e); }
  },
);

erpMigrationRouter.post(
  '/tenants/:tenantId/jobs/:jobId/process',
  requireAgency('OWNER', 'ADMIN', 'OPS'),
  async (req, res, next) => {
    try {
      const result = await svc.startProcessing(
        req.params.tenantId as string,
        req.params.jobId as string,
        req.auth!.sub,
        req.body?.mappings as never,
      );
      res.json(result);
    } catch (e) { next(e); }
  },
);
