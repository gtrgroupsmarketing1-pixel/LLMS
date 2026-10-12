import { Router } from 'express';
import { requireAuth, requireAgency } from '../middleware/auth';
import { requireClient } from '../middleware/requireClient';
import * as svc from '../services/reviews.service';

export const reviewsRouter = Router();

// Webhook intake (from GBP sync worker or external caller)
reviewsRouter.post('/webhook/intake', async (req, res, next) => {
  try {
    const tenantId = String(req.body?.tenantId ?? '');
    if (!tenantId) {
      res.status(400).json({ error: 'missing_tenant' });
      return;
    }
    const review = await svc.ingestReview({
      tenantId,
      locationId: req.body?.locationId,
      platform: req.body?.platform ?? 'GOOGLE_BUSINESS',
      externalId: String(req.body?.externalId ?? ''),
      authorName: req.body?.authorName,
      rating: Number(req.body?.rating ?? 0),
      text: req.body?.text,
      language: req.body?.language,
      reviewedAt: req.body?.reviewedAt
        ? new Date(String(req.body.reviewedAt))
        : new Date(),
    });
    res.status(201).json(review);
  } catch (e) { next(e); }
});

// Agency routes
reviewsRouter.get(
  '/tenants/:tenantId/reviews',
  requireAuth,
  requireAgency('OWNER', 'ADMIN', 'STRATEGIST', 'OPS'),
  async (req, res, next) => {
    try {
      res.json(
        await svc.listReviews({
          tenantId: req.params.tenantId as string,
          sentiment: req.query.sentiment ? String(req.query.sentiment) : undefined,
          responded:
            req.query.responded === 'true'
              ? true
              : req.query.responded === 'false'
                ? false
                : undefined,
          escalated:
            req.query.escalated === 'true'
              ? true
              : req.query.escalated === 'false'
                ? false
                : undefined,
        }),
      );
    } catch (e) { next(e); }
  },
);

reviewsRouter.get(
  '/tenants/:tenantId/reviews/stats',
  requireAuth,
  requireAgency('OWNER', 'ADMIN', 'STRATEGIST', 'OPS'),
  async (req, res, next) => {
    try {
      res.json(await svc.reviewStats(req.params.tenantId as string));
    } catch (e) { next(e); }
  },
);

reviewsRouter.get(
  '/tenants/:tenantId/reviews/:reviewId',
  requireAuth,
  requireAgency('OWNER', 'ADMIN', 'STRATEGIST', 'OPS'),
  async (req, res, next) => {
    try {
      const r = await svc.getReview(
        req.params.tenantId as string,
        req.params.reviewId as string,
      );
      if (!r) {
        res.status(404).json({ error: 'not_found' });
        return;
      }
      res.json(r);
    } catch (e) { next(e); }
  },
);

reviewsRouter.post(
  '/tenants/:tenantId/reviews/:reviewId/draft',
  requireAuth,
  requireAgency('OWNER', 'ADMIN', 'STRATEGIST', 'OPS'),
  async (req, res, next) => {
    try {
      const language = (req.body?.language ?? 'ar') as 'ar' | 'en';
      const body = req.body?.body ? String(req.body.body) : undefined;
      res.status(201).json(
        await svc.draftResponse({
          tenantId: req.params.tenantId as string,
          actorId: req.auth!.sub,
          reviewId: req.params.reviewId as string,
          language,
          body,
        }),
      );
    } catch (e) { next(e); }
  },
);

reviewsRouter.post(
  '/tenants/:tenantId/reviews/responses/:responseId/approve',
  requireAuth,
  requireAgency('OWNER', 'ADMIN', 'STRATEGIST'),
  async (req, res, next) => {
    try {
      res.json(
        await svc.approveResponse({
          tenantId: req.params.tenantId as string,
          actorId: req.auth!.sub,
          responseId: req.params.responseId as string,
        }),
      );
    } catch (e) { next(e); }
  },
);

reviewsRouter.post(
  '/tenants/:tenantId/reviews/responses/:responseId/reject',
  requireAuth,
  requireAgency('OWNER', 'ADMIN', 'STRATEGIST'),
  async (req, res, next) => {
    try {
      res.json(
        await svc.rejectResponse({
          tenantId: req.params.tenantId as string,
          actorId: req.auth!.sub,
          responseId: req.params.responseId as string,
          reason: String(req.body?.reason ?? 'no_reason'),
        }),
      );
    } catch (e) { next(e); }
  },
);

reviewsRouter.post(
  '/tenants/:tenantId/reviews/responses/:responseId/post',
  requireAuth,
  requireAgency('OWNER', 'ADMIN', 'STRATEGIST'),
  async (req, res, next) => {
    try {
      res.json(
        await svc.postResponse({
          tenantId: req.params.tenantId as string,
          actorId: req.auth!.sub,
          responseId: req.params.responseId as string,
          externalId: String(req.body?.externalId ?? `mock-${Date.now()}`),
        }),
      );
    } catch (e) { next(e); }
  },
);

// Directory listings
reviewsRouter.get(
  '/tenants/:tenantId/directory',
  requireAuth,
  requireAgency('OWNER', 'ADMIN', 'STRATEGIST', 'OPS'),
  async (req, res, next) => {
    try {
      res.json(await svc.listDirectoryListings(req.params.tenantId as string));
    } catch (e) { next(e); }
  },
);

reviewsRouter.post(
  '/tenants/:tenantId/directory/sync',
  requireAuth,
  requireAgency('OWNER', 'ADMIN', 'OPS'),
  async (req, res, next) => {
    try {
      const country = String(req.body?.country ?? 'AE');
      res.json(
        await svc.syncDirectoryListings(
          req.params.tenantId as string,
          country,
        ),
      );
    } catch (e) { next(e); }
  },
);

reviewsRouter.post(
  '/tenants/:tenantId/directory/:listingId/status',
  requireAuth,
  requireAgency('OWNER', 'ADMIN', 'OPS'),
  async (req, res, next) => {
    try {
      res.json(
        await svc.updateDirectoryStatus({
          tenantId: req.params.tenantId as string,
          actorId: req.auth!.sub,
          listingId: req.params.listingId as string,
          status: String(req.body?.status ?? 'PENDING'),
          rejectionReason: req.body?.rejectionReason
            ? String(req.body.rejectionReason)
            : undefined,
        }),
      );
    } catch (e) { next(e); }
  },
);

// Client (portal) route — read-only list of own reviews
reviewsRouter.get('/portal/reviews', requireClient, async (req, res, next) => {
  try {
    res.json(
      await svc.listReviews({
        tenantId: req.auth!.tenantId!,
        limit: 50,
      }),
    );
  } catch (e) { next(e); }
});
