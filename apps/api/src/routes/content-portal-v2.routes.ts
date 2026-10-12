import { Router } from 'express';
import { requireClient } from '../middleware/requireClient';
import * as cc from '@lmms/content-calendar';

export const contentPortalV2Router = Router();

contentPortalV2Router.get(
  '/cards/:cardId',
  requireClient,
  async (req, res, next) => {
    try {
      const card = await cc.getCard(
        req.auth!.tenantId!,
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

contentPortalV2Router.get('/cards', requireClient, async (req, res, next) => {
  try {
    const from = req.query.from
      ? new Date(String(req.query.from))
      : new Date(Date.now() - 30 * 86_400_000);
    const to = req.query.to
      ? new Date(String(req.query.to))
      : new Date(Date.now() + 90 * 86_400_000);
    res.json(
      await cc.listCalendar({
        tenantId: req.auth!.tenantId!,
        from,
        to,
      }),
    );
  } catch (e) { next(e); }
});
