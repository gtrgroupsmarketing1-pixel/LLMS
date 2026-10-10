import { Router } from 'express';
import { requireAuth, requireAgency } from '../middleware/auth';
import * as svc from '../services/campaign.service';
import { sendCampaign } from '@lmms/campaigns';
import { MockWhatsAppAdapter } from '@lmms/whatsapp';

export const campaignRouter = Router();
campaignRouter.use(requireAuth);

campaignRouter.post(
  '/tenants/:tenantId/template-groups',
  requireAgency('OWNER', 'ADMIN', 'STRATEGIST'),
  async (req, res, next) => {
    try {
      const r = await svc.createTemplateGroup({
        tenantId: req.params.tenantId as string,
        actorId: req.auth!.sub,
        name: String(req.body?.name ?? ''),
        category: (req.body?.category ?? 'MARKETING') as
          | 'MARKETING'
          | 'UTILITY'
          | 'AUTHENTICATION'
          | 'SERVICE',
        bodyAr: String(req.body?.bodyAr ?? ''),
        bodyEn: String(req.body?.bodyEn ?? ''),
      });
      res.status(201).json(r);
    } catch (e) { next(e); }
  },
);

campaignRouter.post(
  '/templates/:templateId/submit',
  requireAgency('OWNER', 'ADMIN', 'STRATEGIST'),
  async (req, res, next) => {
    try {
      res.json(
        await svc.submitTemplate(
          String(req.body?.tenantId ?? ''),
          req.params.templateId as string,
          req.auth!.sub,
        ),
      );
    } catch (e) { next(e); }
  },
);

campaignRouter.post(
  '/templates/:templateId/sync',
  requireAgency('OWNER', 'ADMIN', 'STRATEGIST', 'OPS'),
  async (req, res, next) => {
    try {
      res.json(
        await svc.syncTemplateStatus(
          String(req.body?.tenantId ?? ''),
          req.params.templateId as string,
        ),
      );
    } catch (e) { next(e); }
  },
);

campaignRouter.post(
  '/tenants/:tenantId/campaigns',
  requireAgency('OWNER', 'ADMIN', 'STRATEGIST'),
  async (req, res, next) => {
    try {
      const c = await svc.createCampaign({
        tenantId: req.params.tenantId as string,
        actorId: req.auth!.sub,
        name: String(req.body?.name ?? ''),
        segmentId: String(req.body?.segmentId ?? ''),
        templateId: String(req.body?.templateId ?? ''),
        scheduledAt: req.body?.scheduledAt
          ? new Date(String(req.body.scheduledAt))
          : undefined,
      });
      res.status(201).json(c);
    } catch (e) { next(e); }
  },
);

campaignRouter.get(
  '/tenants/:tenantId/campaigns',
  requireAgency('OWNER', 'ADMIN', 'STRATEGIST', 'OPS', 'DESIGNER'),
  async (req, res, next) => {
    try {
      res.json(await svc.listCampaigns(req.params.tenantId as string));
    } catch (e) { next(e); }
  },
);

campaignRouter.get(
  '/tenants/:tenantId/campaigns/:campaignId',
  requireAgency('OWNER', 'ADMIN', 'STRATEGIST', 'OPS', 'DESIGNER'),
  async (req, res, next) => {
    try {
      const c = await svc.getCampaign(
        req.params.tenantId as string,
        req.params.campaignId as string,
      );
      if (!c) return res.status(404).json({ error: 'not_found' });
      return res.json(c);
    } catch (e) { return next(e); }
  },
);

campaignRouter.get(
  '/tenants/:tenantId/campaigns/:campaignId/preview',
  requireAgency('OWNER', 'ADMIN', 'STRATEGIST', 'OPS'),
  async (req, res, next) => {
    try {
      res.json(
        await svc.previewCampaign(
          req.params.tenantId as string,
          req.params.campaignId as string,
        ),
      );
    } catch (e) { next(e); }
  },
);

campaignRouter.post(
  '/tenants/:tenantId/campaigns/:campaignId/submit',
  requireAgency('OWNER', 'ADMIN', 'STRATEGIST'),
  async (req, res, next) => {
    try {
      res.json(
        await svc.submitForApproval(
          req.params.tenantId as string,
          req.params.campaignId as string,
          req.auth!.sub,
        ),
      );
    } catch (e) { next(e); }
  },
);

campaignRouter.post(
  '/tenants/:tenantId/campaigns/:campaignId/approve',
  requireAgency('OWNER', 'ADMIN', 'STRATEGIST'),
  async (req, res, next) => {
    try {
      res.json(
        await svc.approveCampaign(
          req.params.tenantId as string,
          req.params.campaignId as string,
          req.auth!.sub,
        ),
      );
    } catch (e) { next(e); }
  },
);

campaignRouter.post(
  '/tenants/:tenantId/campaigns/:campaignId/send',
  requireAgency('OWNER', 'ADMIN', 'STRATEGIST', 'OPS'),
  async (req, res, next) => {
    try {
      const result = await sendCampaign({
        tenantId: req.params.tenantId as string,
        campaignId: req.params.campaignId as string,
        adapter: new MockWhatsAppAdapter(),
        actorId: req.auth!.sub,
        ratePerSecond: typeof req.body?.ratePerSecond === 'number'
          ? req.body.ratePerSecond
          : undefined,
      });
      res.json(result);
    } catch (e) { next(e); }
  },
);
