import { Router } from 'express';
import { requireAuth, requireAgency } from '../middleware/auth';
import { requireClient } from '../middleware/requireClient';
import * as svc from '../services/qbr.service';

export const qbrRouter = Router();

// Public share endpoint — token-based
qbrRouter.get('/shared/:token', async (req, res, next) => {
  try {
    const token = req.params.token as string;
    const deck = await (await import('@lmms/db')).prisma.qbrDeck.findFirst({
      where: { shareToken: token },
    });
    if (!deck) {
      res.status(404).json({ error: 'not_found' });
      return;
    }
    res.json(deck);
  } catch (e) { next(e); }
});

// Agency routes
qbrRouter.get(
  '/tenants/:tenantId/qbr',
  requireAuth,
  requireAgency('OWNER', 'ADMIN', 'STRATEGIST', 'OPS'),
  async (req, res, next) => {
    try {
      res.json(await svc.listDecks(req.params.tenantId as string));
    } catch (e) { next(e); }
  },
);

qbrRouter.post(
  '/tenants/:tenantId/qbr/build',
  requireAuth,
  requireAgency('OWNER', 'ADMIN', 'STRATEGIST'),
  async (req, res, next) => {
    try {
      const now = new Date();
      const periodEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 0, 23, 59, 59));
      const periodStart = new Date(Date.UTC(periodEnd.getUTCFullYear(), periodEnd.getUTCMonth() - 2, 1));
      const result = await svc.buildDeck({
        tenantId: req.params.tenantId as string,
        actorId: req.auth!.sub,
        periodStart,
        periodEnd,
      });
      res.status(201).json({
        deckId: result.deck.id,
        shareToken: result.rawShareToken,
        status: result.deck.status,
      });
    } catch (e) { next(e); }
  },
);

qbrRouter.post(
  '/tenants/:tenantId/qbr/build-last-quarter',
  requireAuth,
  requireAgency('OWNER', 'ADMIN', 'STRATEGIST'),
  async (req, res, next) => {
    try {
      const result = await svc.buildDeckForLastQuarter(
        req.params.tenantId as string,
        req.auth!.sub,
      );
      res.status(201).json(result);
    } catch (e) { next(e); }
  },
);

qbrRouter.get(
  '/tenants/:tenantId/qbr/:deckId',
  requireAuth,
  requireAgency('OWNER', 'ADMIN', 'STRATEGIST', 'OPS', 'DESIGNER'),
  async (req, res, next) => {
    try {
      const deck = await svc.getDeck(
        req.params.tenantId as string,
        req.params.deckId as string,
      );
      if (!deck) {
        res.status(404).json({ error: 'not_found' });
        return;
      }
      res.json(deck);
    } catch (e) { next(e); }
  },
);

qbrRouter.post(
  '/tenants/:tenantId/qbr/:deckId/share',
  requireAuth,
  requireAgency('OWNER', 'ADMIN', 'STRATEGIST'),
  async (req, res, next) => {
    try {
      res.json(
        await svc.markShared({
          tenantId: req.params.tenantId as string,
          actorId: req.auth!.sub,
          deckId: req.params.deckId as string,
        }),
      );
    } catch (e) { next(e); }
  },
);

qbrRouter.get(
  '/tenants/:tenantId/schedules',
  requireAuth,
  requireAgency('OWNER', 'ADMIN', 'STRATEGIST', 'OPS'),
  async (req, res, next) => {
    try {
      res.json(await svc.listSchedules(req.params.tenantId as string));
    } catch (e) { next(e); }
  },
);

qbrRouter.post(
  '/tenants/:tenantId/schedules',
  requireAuth,
  requireAgency('OWNER', 'ADMIN', 'STRATEGIST'),
  async (req, res, next) => {
    try {
      res.status(201).json(
        await svc.upsertSchedule({
          tenantId: req.params.tenantId as string,
          kind: (req.body?.kind ?? 'MONTHLY_REPORT') as never,
          channel: (req.body?.channel ?? 'PORTAL') as never,
          recipient: String(req.body?.recipient ?? ''),
          dayOfWeek:
            typeof req.body?.dayOfWeek === 'number' ? req.body.dayOfWeek : undefined,
          dayOfMonth:
            typeof req.body?.dayOfMonth === 'number' ? req.body.dayOfMonth : undefined,
          hourUtc:
            typeof req.body?.hourUtc === 'number' ? req.body.hourUtc : undefined,
        }),
      );
    } catch (e) { next(e); }
  },
);

// Portal (client) route
qbrRouter.get('/portal/qbr', requireClient, async (req, res, next) => {
  try {
    res.json(await svc.listDecks(req.auth!.tenantId!));
  } catch (e) { next(e); }
});
