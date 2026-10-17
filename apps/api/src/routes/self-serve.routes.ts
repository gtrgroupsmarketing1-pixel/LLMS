import { Router } from 'express';
import { requireAuth, requireAgency } from '../middleware/auth';
import * as svc from '../services/self-serve.service';

export const selfServeRouter = Router();

// Public signup endpoint
selfServeRouter.post('/signup', async (req, res, next) => {
  try {
    const request = await svc.requestSignup({
      email: String(req.body?.email ?? ''),
      contactName: req.body?.contactName ? String(req.body.contactName) : undefined,
      businessName: String(req.body?.businessName ?? ''),
      businessNameAr: req.body?.businessNameAr
        ? String(req.body.businessNameAr)
        : undefined,
      phone: req.body?.phone ? String(req.body.phone) : undefined,
      country: String(req.body?.country ?? 'AE'),
      currency: String(req.body?.currency ?? 'AED'),
      referralSource: req.body?.referralSource
        ? String(req.body.referralSource)
        : undefined,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });
    res.status(201).json({ ok: true, id: request.id });
  } catch (e) { next(e); }
});

// Agency routes
selfServeRouter.get(
  '/signups',
  requireAuth,
  requireAgency('OWNER', 'ADMIN', 'OPS'),
  async (req, res, next) => {
    try {
      const status = req.query.status ? String(req.query.status) : undefined;
      res.json(await svc.listSignupRequests(status));
    } catch (e) { next(e); }
  },
);

selfServeRouter.post(
  '/signups/:id/approve',
  requireAuth,
  requireAgency('OWNER', 'ADMIN'),
  async (req, res, next) => {
    try {
      res.json(await svc.approveSignup(req.params.id as string, req.auth!.sub));
    } catch (e) { next(e); }
  },
);

selfServeRouter.post(
  '/signups/:id/reject',
  requireAuth,
  requireAgency('OWNER', 'ADMIN'),
  async (req, res, next) => {
    try {
      res.json(
        await svc.rejectSignup(
          req.params.id as string,
          req.auth!.sub,
          String(req.body?.reason ?? 'no_reason'),
        ),
      );
    } catch (e) { next(e); }
  },
);

selfServeRouter.post(
  '/signups/:id/provision',
  requireAuth,
  requireAgency('OWNER', 'ADMIN'),
  async (req, res, next) => {
    try {
      res.json(await svc.provisionTenant(req.params.id as string, req.auth!.sub));
    } catch (e) { next(e); }
  },
);

// Tenant self-serve routes
selfServeRouter.get(
  '/tenants/:tenantId/onboarding',
  requireAuth,
  async (req, res, next) => {
    try {
      // For security, ensure the tenantId matches the JWT (if client)
      // or allow agency to view (if agency token).
      if (
        req.auth!.kind === 'client' &&
        req.auth!.tenantId !== req.params.tenantId
      ) {
        res.status(403).json({ error: 'forbidden' });
        return;
      }
      res.json(await svc.getOnboardingTasks(req.params.tenantId as string));
    } catch (e) { next(e); }
  },
);

selfServeRouter.post(
  '/tenants/:tenantId/onboarding/:key/complete',
  requireAuth,
  async (req, res, next) => {
    try {
      if (
        req.auth!.kind === 'client' &&
        req.auth!.tenantId !== req.params.tenantId
      ) {
        res.status(403).json({ error: 'forbidden' });
        return;
      }
      res.json(
        await svc.completeOnboardingTask(
          req.params.tenantId as string,
          req.params.key as string,
        ),
      );
    } catch (e) { next(e); }
  },
);

selfServeRouter.get(
  '/tenants/:tenantId/config',
  requireAuth,
  async (req, res, next) => {
    try {
      if (
        req.auth!.kind === 'client' &&
        req.auth!.tenantId !== req.params.tenantId
      ) {
        res.status(403).json({ error: 'forbidden' });
        return;
      }
      res.json(await svc.getSelfServeConfig(req.params.tenantId as string));
    } catch (e) { next(e); }
  },
);
