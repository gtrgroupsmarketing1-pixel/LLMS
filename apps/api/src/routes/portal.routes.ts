import { Router } from 'express';
import multer from 'multer';
import { requireClient } from '../middleware/requireClient';
import * as svc from '../services/portal.service';
import { ingestCsv } from '../services/ingestion.service';

export const portalRouter = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 200 * 1024 * 1024 },
});

portalRouter.use(requireClient);

portalRouter.get('/me', async (req, res) => {
  res.json({
    userId: req.auth!.sub,
    tenantId: req.auth!.tenantId,
    role: req.auth!.role,
  });
});

portalRouter.get('/dashboard', async (req, res, next) => {
  try {
    res.json(await svc.getPortalDashboard(req.auth!.tenantId!));
  } catch (e) { next(e); }
});

portalRouter.get('/approvals', async (req, res, next) => {
  try {
    res.json(await svc.listApprovals(req.auth!.tenantId!));
  } catch (e) { next(e); }
});

portalRouter.post('/approvals/:campaignId/approve', async (req, res, next) => {
  try {
    res.json(
      await svc.approveCampaign(
        req.auth!.tenantId!,
        req.params.campaignId as string,
        req.auth!.sub,
      ),
    );
  } catch (e) { next(e); }
});

portalRouter.post('/approvals/:campaignId/reject', async (req, res, next) => {
  try {
    res.json(
      await svc.rejectCampaign(
        req.auth!.tenantId!,
        req.params.campaignId as string,
        req.auth!.sub,
        String(req.body?.reason ?? 'no_reason'),
      ),
    );
  } catch (e) { next(e); }
});

portalRouter.get('/campaigns', async (req, res, next) => {
  try {
    res.json(await svc.listCampaigns(req.auth!.tenantId!));
  } catch (e) { next(e); }
});

portalRouter.get('/reviews', async (req, res, next) => {
  try {
    res.json(await svc.listReviews(req.auth!.tenantId!));
  } catch (e) { next(e); }
});

portalRouter.get('/messages', async (req, res, next) => {
  try {
    res.json(await svc.listMessages(req.auth!.tenantId!));
  } catch (e) { next(e); }
});

portalRouter.post('/messages/:messageId/reply', async (req, res, next) => {
  try {
    res.json(
      await svc.replyMessage(
        req.auth!.tenantId!,
        req.params.messageId as string,
        req.auth!.sub,
        String(req.body?.body ?? ''),
      ),
    );
  } catch (e) { next(e); }
});

portalRouter.post('/flag', async (req, res, next) => {
  try {
    res.json(
      await svc.flagToAgency(
        req.auth!.tenantId!,
        req.auth!.sub,
        String(req.body?.entityType ?? ''),
        String(req.body?.entityId ?? ''),
        String(req.body?.body ?? ''),
      ),
    );
  } catch (e) { next(e); }
});

portalRouter.get('/reports', async (req, res, next) => {
  try {
    res.json(await svc.listReports(req.auth!.tenantId!));
  } catch (e) { next(e); }
});

portalRouter.get('/invoices', async (req, res, next) => {
  try {
    res.json(await svc.listInvoices(req.auth!.tenantId!));
  } catch (e) { next(e); }
});

portalRouter.get('/support', async (req, res, next) => {
  try {
    res.json(await svc.getSupportConfig(req.auth!.tenantId!));
  } catch (e) { next(e); }
});

portalRouter.get('/tickets', async (req, res, next) => {
  try {
    res.json(await svc.listTickets(req.auth!.tenantId!));
  } catch (e) { next(e); }
});

portalRouter.post('/tickets', async (req, res, next) => {
  try {
    res.status(201).json(
      await svc.createTicket(
        req.auth!.tenantId!,
        req.auth!.sub,
        String(req.body?.subject ?? ''),
        String(req.body?.body ?? ''),
        (req.body?.kind ?? 'SUPPORT') as
          | 'SUPPORT'
          | 'BUG'
          | 'BILLING'
          | 'ESCALATION',
      ),
    );
  } catch (e) { next(e); }
});

portalRouter.get('/preferences', async (req, res, next) => {
  try {
    res.json(await svc.getPreferences(req.auth!.sub));
  } catch (e) { next(e); }
});

portalRouter.put('/preferences', async (req, res, next) => {
  try {
    res.json(
      await svc.setPreferences(
        req.auth!.sub,
        (req.body?.language ?? 'ar') as 'ar' | 'en',
      ),
    );
  } catch (e) { next(e); }
});

portalRouter.get('/upgrade-prompt', async (req, res, next) => {
  try {
    res.json(
      await svc.getUpgradePromptStatus(req.auth!.tenantId!, req.auth!.sub),
    );
  } catch (e) { next(e); }
});

portalRouter.post('/upgrade-prompt/dismiss', async (req, res, next) => {
  try {
    res.json(
      await svc.dismissUpgradePrompt(
        req.auth!.sub,
        typeof req.body?.days === 'number' ? req.body.days : 7,
      ),
    );
  } catch (e) { next(e); }
});

portalRouter.post(
  '/data-sources/csv',
  upload.single('file'),
  async (req, res, next) => {
    try {
      if (!req.file) {
        res.status(400).json({ error: 'missing_file' });
        return;
      }
      const result = await ingestCsv({
        tenantId: req.auth!.tenantId!,
        actorId: req.auth!.sub,
        filename: req.file.originalname,
        content: req.file.buffer,
        hasExplicitConsent: req.body?.hasExplicitConsent === 'true',
      });
      res.json(result);
    } catch (e) { next(e); }
  },
);
