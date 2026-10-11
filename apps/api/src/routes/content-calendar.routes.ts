import { Router } from 'express';
import { requireAuth, requireAgency } from '../middleware/auth';
import { requireClient } from '../middleware/requireClient';
import * as svc from '../services/content-calendar.service';

export const contentCalendarRouter = Router();

const APPROVAL_BASE = process.env.PUBLIC_APP_URL ?? 'http://localhost:3000';

// Public one-tap approval
contentCalendarRouter.get('/public/approve/:token', async (req, res, next) => {
  try {
    const data = await svc.getApprovalByToken(req.params.token as string);
    if (!data) {
      res.status(404).json({ error: 'not_found' });
      return;
    }
    res.json(data);
  } catch (e) { next(e); }
});

contentCalendarRouter.post('/public/approve/:token', async (req, res, next) => {
  try {
    const decision = req.body?.decision === 'REJECT' ? 'REJECT' : 'APPROVE';
    const card = await svc.consumeApprovalToken({
      rawToken: req.params.token as string,
      decision,
      reason: req.body?.reason,
    });
    res.json({ ok: true, cardId: card.id, status: card.status });
  } catch (e) { next(e); }
});

// Agency routes
contentCalendarRouter.get(
  '/agency/tenants/:tenantId/calendar',
  requireAuth,
  requireAgency('OWNER', 'ADMIN', 'STRATEGIST', 'DESIGNER', 'OPS'),
  async (req, res, next) => {
    try {
      const from = req.query.from
        ? new Date(String(req.query.from))
        : new Date(Date.now() - 30 * 86_400_000);
      const to = req.query.to
        ? new Date(String(req.query.to))
        : new Date(Date.now() + 90 * 86_400_000);
      const channel = req.query.channel ? String(req.query.channel) : undefined;
      const status = req.query.status ? String(req.query.status) : undefined;
      res.json(
        await svc.listCalendar({
          tenantId: req.params.tenantId as string,
          from,
          to,
          channel: channel as never,
          status: status as never,
        }),
      );
    } catch (e) { next(e); }
  },
);

contentCalendarRouter.post(
  '/agency/tenants/:tenantId/cards',
  requireAuth,
  requireAgency('OWNER', 'ADMIN', 'STRATEGIST', 'DESIGNER'),
  async (req, res, next) => {
    try {
      const card = await svc.createCard({
        tenantId: req.params.tenantId as string,
        actorId: req.auth!.sub,
        title: String(req.body?.title ?? ''),
        brief: req.body?.brief ? String(req.body.brief) : undefined,
        copyAr: req.body?.copyAr ? String(req.body.copyAr) : undefined,
        copyEn: req.body?.copyEn ? String(req.body.copyEn) : undefined,
        channel: (req.body?.channel ?? 'WHATSAPP') as never,
        scheduledAt: req.body?.scheduledAt
          ? new Date(String(req.body.scheduledAt))
          : undefined,
        ownerId: req.body?.ownerId ? String(req.body.ownerId) : undefined,
      });
      res.status(201).json(card);
    } catch (e) { next(e); }
  },
);

contentCalendarRouter.get(
  '/agency/tenants/:tenantId/cards/:cardId',
  requireAuth,
  requireAgency('OWNER', 'ADMIN', 'STRATEGIST', 'DESIGNER', 'OPS'),
  async (req, res, next) => {
    try {
      const card = await svc.getCard(
        req.params.tenantId as string,
        req.params.cardId as string,
      );
      if (!card) {
        res.status(404).json({ error: 'not_found' });
        return;
      }
      res.json(card);
    } catch (e) { next(e); }
  },
);

contentCalendarRouter.patch(
  '/agency/tenants/:tenantId/cards/:cardId',
  requireAuth,
  requireAgency('OWNER', 'ADMIN', 'STRATEGIST', 'DESIGNER'),
  async (req, res, next) => {
    try {
      const updated = await svc.updateCard({
        tenantId: req.params.tenantId as string,
        actorId: req.auth!.sub,
        cardId: req.params.cardId as string,
        patch: {
          title: req.body?.title,
          brief: req.body?.brief,
          copyAr: req.body?.copyAr,
          copyEn: req.body?.copyEn,
          channel: req.body?.channel,
          scheduledAt: req.body?.scheduledAt
            ? new Date(String(req.body.scheduledAt))
            : undefined,
          ownerId: req.body?.ownerId,
        },
        changeNote: req.body?.changeNote,
      });
      res.json(updated);
    } catch (e) { next(e); }
  },
);

contentCalendarRouter.post(
  '/agency/tenants/:tenantId/cards/:cardId/transition',
  requireAuth,
  requireAgency('OWNER', 'ADMIN', 'STRATEGIST', 'DESIGNER'),
  async (req, res, next) => {
    try {
      const card = await svc.transitionCard({
        tenantId: req.params.tenantId as string,
        actorId: req.auth!.sub,
        cardId: req.params.cardId as string,
        to: req.body?.to,
        reason: req.body?.reason,
      });
      res.json(card);
    } catch (e) { next(e); }
  },
);

contentCalendarRouter.post(
  '/agency/tenants/:tenantId/cards/:cardId/send-for-client-review',
  requireAuth,
  requireAgency('OWNER', 'ADMIN', 'STRATEGIST'),
  async (req, res, next) => {
    try {
      const result = await svc.sendForClientReview({
        tenantId: req.params.tenantId as string,
        actorId: req.auth!.sub,
        cardId: req.params.cardId as string,
        baseApprovalUrl: APPROVAL_BASE,
      });
      res.json(result);
    } catch (e) { next(e); }
  },
);

contentCalendarRouter.post(
  '/agency/tenants/:tenantId/cards/:cardId/comments',
  requireAuth,
  requireAgency('OWNER', 'ADMIN', 'STRATEGIST', 'DESIGNER', 'OPS'),
  async (req, res, next) => {
    try {
      const c = await svc.addComment({
        tenantId: req.params.tenantId as string,
        actorId: req.auth!.sub,
        authorKind: 'AGENCY',
        cardId: req.params.cardId as string,
        body: String(req.body?.body ?? ''),
      });
      res.status(201).json(c);
    } catch (e) { next(e); }
  },
);

contentCalendarRouter.get(
  '/agency/gcc-templates',
  requireAuth,
  requireAgency('OWNER', 'ADMIN', 'STRATEGIST', 'DESIGNER'),
  async (req, res, next) => {
    try {
      res.json(
        await svc.listGccTemplates({
          country: req.query.country ? String(req.query.country) : undefined,
          channel: req.query.channel ? String(req.query.channel) : undefined,
          occasion: req.query.occasion ? String(req.query.occasion) : undefined,
        }),
      );
    } catch (e) { next(e); }
  },
);

contentCalendarRouter.post(
  '/agency/gcc-templates/seed',
  requireAuth,
  requireAgency('OWNER', 'ADMIN'),
  async (_req, res, next) => {
    try {
      res.json({ seeded: await svc.seedGccTemplates() });
    } catch (e) { next(e); }
  },
);

// Portal (client) routes
contentCalendarRouter.get('/portal/calendar', requireClient, async (req, res, next) => {
  try {
    const from = req.query.from
      ? new Date(String(req.query.from))
      : new Date(Date.now() - 30 * 86_400_000);
    const to = req.query.to
      ? new Date(String(req.query.to))
      : new Date(Date.now() + 90 * 86_400_000);
    res.json(
      await svc.listCalendar({
        tenantId: req.auth!.tenantId!,
        from,
        to,
      }),
    );
  } catch (e) { next(e); }
});

contentCalendarRouter.post(
  '/portal/cards/:cardId/comments',
  requireClient,
  async (req, res, next) => {
    try {
      const c = await svc.addComment({
        tenantId: req.auth!.tenantId!,
        actorId: req.auth!.sub,
        authorKind: 'CLIENT',
        cardId: req.params.cardId as string,
        body: String(req.body?.body ?? ''),
      });
      res.status(201).json(c);
    } catch (e) { next(e); }
  },
);
