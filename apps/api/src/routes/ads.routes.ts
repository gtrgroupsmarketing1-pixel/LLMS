import { Router } from 'express';
import { requireAuth, requireAgency } from '../middleware/auth';
import * as ads from '../services/ads.service';
import { GEO_PRESETS, presetsForCountry } from '@lmms/ads';

export const adsRouter = Router();
adsRouter.use(requireAuth);

adsRouter.get(
  '/geo-presets',
  requireAgency('OWNER', 'ADMIN', 'STRATEGIST', 'OPS'),
  async (req, res, next) => {
    try {
      const country = req.query.country ? String(req.query.country) : null;
      res.json(country ? presetsForCountry(country) : GEO_PRESETS);
    } catch (e) { next(e); }
  },
);

adsRouter.get(
  '/tenants/:tenantId/accounts',
  requireAgency('OWNER', 'ADMIN', 'STRATEGIST', 'OPS'),
  async (req, res, next) => {
    try {
      res.json(await ads.listAdAccounts(req.params.tenantId as string));
    } catch (e) { next(e); }
  },
);

adsRouter.post(
  '/tenants/:tenantId/accounts',
  requireAgency('OWNER', 'ADMIN', 'OPS'),
  async (req, res, next) => {
    try {
      res.status(201).json(
        await ads.connectAdAccount({
          tenantId: req.params.tenantId as string,
          actorId: req.auth!.sub,
          platform: (req.body?.platform ?? 'META') as never,
          externalId: String(req.body?.externalId ?? ''),
          accountName: req.body?.accountName ? String(req.body.accountName) : undefined,
          currency: String(req.body?.currency ?? 'AED'),
          timezone: String(req.body?.timezone ?? 'Asia/Dubai'),
        }),
      );
    } catch (e) { next(e); }
  },
);

adsRouter.get(
  '/tenants/:tenantId/campaigns',
  requireAgency('OWNER', 'ADMIN', 'STRATEGIST', 'OPS'),
  async (req, res, next) => {
    try {
      res.json(await ads.listAdCampaigns(req.params.tenantId as string));
    } catch (e) { next(e); }
  },
);

adsRouter.post(
  '/tenants/:tenantId/campaigns',
  requireAgency('OWNER', 'ADMIN', 'STRATEGIST'),
  async (req, res, next) => {
    try {
      const campaign = await ads.createAdCampaign({
        tenantId: req.params.tenantId as string,
        actorId: req.auth!.sub,
        adAccountId: String(req.body?.adAccountId ?? ''),
        name: String(req.body?.name ?? ''),
        objective: String(req.body?.objective ?? 'TRAFFIC'),
        dailyBudgetCap: Number(req.body?.dailyBudgetCap ?? 0),
        totalBudget:
          typeof req.body?.totalBudget === 'number' ? req.body.totalBudget : undefined,
        geoPreset: String(req.body?.geoPreset ?? ''),
        startDate: new Date(String(req.body?.startDate ?? new Date().toISOString())),
        endDate: req.body?.endDate ? new Date(String(req.body.endDate)) : undefined,
        adSets: (req.body?.adSets ?? []) as never,
        creatives: (req.body?.creatives ?? []) as never,
        baseUrl: String(req.body?.baseUrl ?? 'https://example.com'),
      });
      res.status(201).json(campaign);
    } catch (e) { next(e); }
  },
);

adsRouter.get(
  '/tenants/:tenantId/campaigns/:campaignId',
  requireAgency('OWNER', 'ADMIN', 'STRATEGIST', 'OPS'),
  async (req, res, next) => {
    try {
      const c = await ads.getAdCampaign(
        req.params.tenantId as string,
        req.params.campaignId as string,
      );
      if (!c) {
        res.status(404).json({ error: 'not_found' });
        return;
      }
      res.json(c);
    } catch (e) { next(e); }
  },
);

adsRouter.post(
  '/tenants/:tenantId/campaigns/:campaignId/submit',
  requireAgency('OWNER', 'ADMIN', 'STRATEGIST'),
  async (req, res, next) => {
    try {
      res.json(
        await ads.submitAdCampaign(
          req.params.tenantId as string,
          req.params.campaignId as string,
          req.auth!.sub,
        ),
      );
    } catch (e) { next(e); }
  },
);

adsRouter.post(
  '/tenants/:tenantId/campaigns/:campaignId/approve',
  requireAgency('OWNER', 'ADMIN', 'STRATEGIST'),
  async (req, res, next) => {
    try {
      res.json(
        await ads.approveAdCampaign(
          req.params.tenantId as string,
          req.params.campaignId as string,
          req.auth!.sub,
        ),
      );
    } catch (e) { next(e); }
  },
);

adsRouter.post(
  '/tenants/:tenantId/campaigns/:campaignId/pause',
  requireAgency('OWNER', 'ADMIN', 'STRATEGIST', 'OPS'),
  async (req, res, next) => {
    try {
      res.json(
        await ads.pauseAdCampaign(
          req.params.tenantId as string,
          req.params.campaignId as string,
          req.auth!.sub,
        ),
      );
    } catch (e) { next(e); }
  },
);

adsRouter.post(
  '/tenants/:tenantId/campaigns/:campaignId/resume',
  requireAgency('OWNER', 'ADMIN', 'STRATEGIST'),
  async (req, res, next) => {
    try {
      res.json(
        await ads.resumeAdCampaign(
          req.params.tenantId as string,
          req.params.campaignId as string,
          req.auth!.sub,
        ),
      );
    } catch (e) { next(e); }
  },
);

adsRouter.post(
  '/tenants/:tenantId/campaigns/:campaignId/budget-shift',
  requireAgency('OWNER', 'ADMIN', 'STRATEGIST'),
  async (req, res, next) => {
    try {
      res.json(
        await ads.changeDailyBudget({
          tenantId: req.params.tenantId as string,
          actorId: req.auth!.sub,
          campaignId: req.params.campaignId as string,
          newDailyBudget: Number(req.body?.newDailyBudget ?? 0),
        }),
      );
    } catch (e) { next(e); }
  },
);

adsRouter.get(
  '/tenants/:tenantId/spend',
  requireAgency('OWNER', 'ADMIN', 'STRATEGIST', 'OPS'),
  async (req, res, next) => {
    try {
      const campaignId = req.query.campaignId
        ? String(req.query.campaignId)
        : undefined;
      res.json(
        await ads.listSpendSnapshots(req.params.tenantId as string, campaignId),
      );
    } catch (e) { next(e); }
  },
);
