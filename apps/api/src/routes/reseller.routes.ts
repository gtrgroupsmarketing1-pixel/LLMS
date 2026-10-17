import { Router } from 'express';
import { requireAuth, requireAgency } from '../middleware/auth';
import * as svc from '../services/reseller.service';

export const resellerRouter = Router();

// Public endpoint used by Next.js middleware to resolve branding per domain
resellerRouter.get('/resolve', async (req, res, next) => {
  try {
    const domain = String(req.query.domain ?? '');
    if (!domain) {
      res.status(400).json({ error: 'missing_domain' });
      return;
    }
    const reseller = await svc.resolveByDomain(domain);
    if (!reseller || reseller.status !== 'ACTIVE') {
      res.json({
        resellerId: null,
        resellerName: null,
        logoUrl: null,
        faviconUrl: null,
        primaryColor: '#0f172a',
        supportEmail: null,
        emailFooter: null,
      });
      return;
    }
    const wl = reseller.whiteLabel;
    res.json({
      resellerId: reseller.id,
      resellerName: reseller.name,
      logoUrl: wl?.logoUrl ?? null,
      faviconUrl: wl?.faviconUrl ?? null,
      primaryColor: wl?.primaryColor ?? '#0f172a',
      supportEmail: wl?.supportEmail ?? null,
      emailFooter: wl?.emailFooter ?? null,
    });
  } catch (e) { next(e); }
});

// Agency routes
resellerRouter.use(requireAuth);

resellerRouter.get(
  '/',
  requireAgency('OWNER', 'ADMIN', 'OPS'),
  async (_req, res, next) => {
    try {
      res.json(await svc.listResellers());
    } catch (e) { next(e); }
  },
);

resellerRouter.post(
  '/',
  requireAgency('OWNER', 'ADMIN'),
  async (req, res, next) => {
    try {
      const result = await svc.createReseller({
        name: String(req.body?.name ?? ''),
        domain: String(req.body?.domain ?? ''),
        commissionPct:
          typeof req.body?.commissionPct === 'number'
            ? req.body.commissionPct
            : undefined,
        actorId: req.auth!.sub,
      });
      // Only return rawApiKey once, at creation
      res.status(201).json(result);
    } catch (e) { next(e); }
  },
);

resellerRouter.patch(
  '/:resellerId/status',
  requireAgency('OWNER', 'ADMIN'),
  async (req, res, next) => {
    try {
      res.json(
        await svc.updateResellerStatus(
          req.params.resellerId as string,
          req.body?.status as never,
          req.auth!.sub,
        ),
      );
    } catch (e) { next(e); }
  },
);

resellerRouter.put(
  '/:resellerId/white-label',
  requireAgency('OWNER', 'ADMIN'),
  async (req, res, next) => {
    try {
      res.json(
        await svc.upsertWhiteLabel({
          resellerId: req.params.resellerId as string,
          actorId: req.auth!.sub,
          logoUrl: req.body?.logoUrl,
          faviconUrl: req.body?.faviconUrl,
          primaryColor: req.body?.primaryColor,
          supportEmail: req.body?.supportEmail,
          customEmailFrom: req.body?.customEmailFrom,
          emailFooter: req.body?.emailFooter,
        }),
      );
    } catch (e) { next(e); }
  },
);

resellerRouter.post(
  '/:resellerId/attach-tenant',
  requireAgency('OWNER', 'ADMIN'),
  async (req, res, next) => {
    try {
      res.json(
        await svc.attachTenantToReseller(
          String(req.body?.tenantId ?? ''),
          req.params.resellerId as string,
          req.auth!.sub,
        ),
      );
    } catch (e) { next(e); }
  },
);
