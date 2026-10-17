import { Router } from 'express';
import { requireAuth, requireAgency } from '../middleware/auth';
import * as svc from '../services/website.service';

export const websiteRouter = Router();

// Public endpoints (no auth) — must come before requireAuth middleware
websiteRouter.get('/public/:subdomain', async (req, res, next) => {
  try {
    const data = await svc.getHomePage(req.params.subdomain as string);
    if (!data) {
      res.status(404).json({ error: 'not_found' });
      return;
    }
    res.json(data);
  } catch (e) { next(e); }
});

websiteRouter.get('/public/:subdomain/:slug', async (req, res, next) => {
  try {
    const data = await svc.getPageBySubdomain(
      req.params.subdomain as string,
      req.params.slug as string,
    );
    if (!data) {
      res.status(404).json({ error: 'not_found' });
      return;
    }
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

websiteRouter.post('/public/:subdomain/:slug/visit', async (req, res, next) => {
  try {
    await svc.recordVisit({
      subdomain: req.params.subdomain as string,
      pageSlug: req.params.slug as string,
      path: req.body?.path ?? '',
      referrer: req.body?.referrer,
      utmSource: req.body?.utmSource,
      utmMedium: req.body?.utmMedium,
      utmCampaign: req.body?.utmCampaign,
    });
    res.json({ ok: true });
  } catch (e) { next(e); }
});

// Agency routes
websiteRouter.use(requireAuth);

websiteRouter.get(
  '/tenants/:tenantId/website',
  requireAgency('OWNER', 'ADMIN', 'STRATEGIST', 'DESIGNER', 'OPS'),
  async (req, res, next) => {
    try {
      const w = await svc.getOrCreateWebsite(req.params.tenantId as string, req.auth!.sub);
      res.json(w);
    } catch (e) { next(e); }
  },
);

websiteRouter.patch(
  '/tenants/:tenantId/website',
  requireAgency('OWNER', 'ADMIN', 'STRATEGIST', 'DESIGNER'),
  async (req, res, next) => {
    try {
      res.json(
        await svc.updateWebsite({
          tenantId: req.params.tenantId as string,
          actorId: req.auth!.sub,
          patch: {
            subdomain: req.body?.subdomain,
            customDomain: req.body?.customDomain,
            theme: req.body?.theme,
            seoDefaults: req.body?.seoDefaults,
          },
        }),
      );
    } catch (e) { next(e); }
  },
);

websiteRouter.post(
  '/tenants/:tenantId/website/publish',
  requireAgency('OWNER', 'ADMIN', 'STRATEGIST'),
  async (req, res, next) => {
    try {
      res.json(await svc.publishWebsite(req.params.tenantId as string, req.auth!.sub));
    } catch (e) { next(e); }
  },
);

websiteRouter.get(
  '/tenants/:tenantId/website/pages',
  requireAgency('OWNER', 'ADMIN', 'STRATEGIST', 'DESIGNER', 'OPS'),
  async (req, res, next) => {
    try {
      res.json(await svc.listPages(req.params.tenantId as string));
    } catch (e) { next(e); }
  },
);

websiteRouter.post(
  '/tenants/:tenantId/website/pages',
  requireAgency('OWNER', 'ADMIN', 'STRATEGIST', 'DESIGNER'),
  async (req, res, next) => {
    try {
      res.status(201).json(
        await svc.createPage({
          tenantId: req.params.tenantId as string,
          actorId: req.auth!.sub,
          slug: String(req.body?.slug ?? 'home'),
          titleEn: String(req.body?.titleEn ?? 'Home'),
          titleAr: req.body?.titleAr ? String(req.body.titleAr) : undefined,
          blocks: req.body?.blocks,
          seo: req.body?.seo,
        }),
      );
    } catch (e) { next(e); }
  },
);

websiteRouter.patch(
  '/tenants/:tenantId/website/pages/:pageId',
  requireAgency('OWNER', 'ADMIN', 'STRATEGIST', 'DESIGNER'),
  async (req, res, next) => {
    try {
      res.json(
        await svc.updatePage({
          tenantId: req.params.tenantId as string,
          actorId: req.auth!.sub,
          pageId: req.params.pageId as string,
          patch: {
            titleEn: req.body?.titleEn,
            titleAr: req.body?.titleAr,
            blocks: req.body?.blocks,
            seo: req.body?.seo,
          },
        }),
      );
    } catch (e) { next(e); }
  },
);

websiteRouter.post(
  '/tenants/:tenantId/website/pages/:pageId/publish',
  requireAgency('OWNER', 'ADMIN', 'STRATEGIST'),
  async (req, res, next) => {
    try {
      res.json(
        await svc.publishPage(
          req.params.tenantId as string,
          req.auth!.sub,
          req.params.pageId as string,
        ),
      );
    } catch (e) { next(e); }
  },
);
