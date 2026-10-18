import { Router } from 'express';
import { requireAuth, requireAgency } from '../middleware/auth';
import { requireModule } from '../middleware/requireModule';
import * as svc from '../services/website.service';

export const websiteRouter = Router();

// Public endpoints — no auth, no module check (must be publicly viewable if site is published)
websiteRouter.get('/public/:subdomain', async (req, res, next) => {
  try {
    const data = await svc.getHomePage(req.params.subdomain as string);
    if (!data) { res.status(404).json({ error: 'not_found' }); return; }
    res.json(data);
  } catch (e) { next(e); }
});

websiteRouter.get('/public/:subdomain/:slug', async (req, res, next) => {
  try {
    const data = await svc.getPageBySubdomain(req.params.subdomain as string, req.params.slug as string);
    if (!data) { res.status(404).json({ error: 'not_found' }); return; }
    res.json(data);
  } catch (e) { next(e); }
});

websiteRouter.post('/public/:subdomain/:slug/lead', async (req, res, next) => {
  try {
    const result = await svc.submitLead({
      subdomain: req.params.subdomain as string,
      pageSlug: req.params.slug as string,
      name: req.body?.name,
      phone: req.body?.phone,
      email: req.body?.email,
      zone: req.body?.zone,
      message: req.body?.message,
      utmSource: req.body?.utmSource,
      utmMedium: req.body?.utmMedium,
      utmCampaign: req.body?.utmCampaign,
      promoCode: req.body?.promoCode,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });
    res.status(201).json(result);
  } catch (e) { next(e); }
});

// Agency endpoints
websiteRouter.use(requireAuth);
websiteRouter.use(requireModule('WEBSITE_BUILDER')); // V3.9 ENFORCEMENT

websiteRouter.get('/tenants/:tenantId/website', requireAgency('OWNER', 'ADMIN', 'STRATEGIST', 'DESIGNER', 'OPS'), async (req, res, next) => {
  try { res.json(await svc.getOrCreateWebsite(req.params.tenantId as string, req.auth!.sub)); } catch (e) { next(e); }
});

websiteRouter.patch('/tenants/:tenantId/website', requireAgency('OWNER', 'ADMIN', 'STRATEGIST', 'DESIGNER'), async (req, res, next) => {
  try { res.json(await svc.updateWebsite({ tenantId: req.params.tenantId as string, actorId: req.auth!.sub, patch: req.body })); } catch (e) { next(e); }
});

websiteRouter.post('/tenants/:tenantId/website/publish', requireAgency('OWNER', 'ADMIN', 'STRATEGIST'), async (req, res, next) => {
  try { res.json(await svc.publishWebsite(req.params.tenantId as string, req.auth!.sub)); } catch (e) { next(e); }
});

websiteRouter.get('/tenants/:tenantId/website/pages', requireAgency('OWNER', 'ADMIN', 'STRATEGIST', 'DESIGNER', 'OPS'), async (req, res, next) => {
  try { res.json(await svc.listPages(req.params.tenantId as string)); } catch (e) { next(e); }
});

websiteRouter.post('/tenants/:tenantId/website/pages', requireAgency('OWNER', 'ADMIN', 'STRATEGIST', 'DESIGNER'), async (req, res, next) => {
  try { res.status(201).json(await svc.createPage({ tenantId: req.params.tenantId as string, actorId: req.auth!.sub, slug: String(req.body?.slug), titleEn: String(req.body?.titleEn), titleAr: req.body?.titleAr, blocks: req.body?.blocks, seo: req.body?.seo })); } catch (e) { next(e); }
});

websiteRouter.patch('/tenants/:tenantId/website/pages/:pageId', requireAgency('OWNER', 'ADMIN', 'STRATEGIST', 'DESIGNER'), async (req, res, next) => {
  try { res.json(await svc.updatePage({ tenantId: req.params.tenantId as string, actorId: req.auth!.sub, pageId: req.params.pageId as string, patch: req.body })); } catch (e) { next(e); }
});

websiteRouter.post('/tenants/:tenantId/website/pages/:pageId/publish', requireAgency('OWNER', 'ADMIN', 'STRATEGIST'), async (req, res, next) => {
  try { res.json(await svc.publishPage(req.params.tenantId as string, req.auth!.sub, req.params.pageId as string)); } catch (e) { next(e); }
});
