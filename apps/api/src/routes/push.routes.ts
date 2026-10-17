import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { requireClient } from '../middleware/requireClient';
import * as svc from '../services/push.service';

export const pushRouter = Router();

// Agency routes
pushRouter.post('/subscribe', requireAuth, async (req, res, next) => {
  try {
    res.status(201).json(
      await svc.registerSubscription({
        userId: req.auth!.sub,
        tenantId: req.auth!.tenantId,
        endpoint: String(req.body?.endpoint ?? ''),
        p256dh: String(req.body?.p256dh ?? ''),
        auth: String(req.body?.auth ?? ''),
        userAgent: req.headers['user-agent'],
      }),
    );
  } catch (e) { next(e); }
});

pushRouter.post('/unsubscribe', requireAuth, async (req, res, next) => {
  try {
    res.json(await svc.revokeSubscription(String(req.body?.endpoint ?? '')));
  } catch (e) { next(e); }
});

pushRouter.get('/notifications', requireAuth, async (req, res, next) => {
  try {
    res.json(await svc.listForUser(req.auth!.sub));
  } catch (e) { next(e); }
});

pushRouter.get('/notifications/unread-count', requireAuth, async (req, res, next) => {
  try {
    res.json({ count: await svc.unreadCount(req.auth!.sub) });
  } catch (e) { next(e); }
});

pushRouter.post(
  '/notifications/:notificationId/read',
  requireAuth,
  async (req, res, next) => {
    try {
      res.json(
        await svc.markNotificationRead(
          req.params.notificationId as string,
          req.auth!.sub,
        ),
      );
    } catch (e) { next(e); }
  },
);

pushRouter.post('/offline/enqueue', requireAuth, async (req, res, next) => {
  try {
    res.status(201).json(
      await svc.enqueueOfflineAction({
        userId: req.auth!.sub,
        tenantId: req.auth!.tenantId,
        clientId: String(req.body?.clientId ?? ''),
        action: String(req.body?.action ?? ''),
        payload: (req.body?.payload ?? {}) as Record<string, unknown>,
      }),
    );
  } catch (e) { next(e); }
});

pushRouter.get('/offline/pending', requireAuth, async (req, res, next) => {
  try {
    res.json(await svc.listPending(req.auth!.sub));
  } catch (e) { next(e); }
});

pushRouter.post('/offline/sync', requireAuth, async (req, res, next) => {
  try {
    res.json(
      await svc.markSynced(
        String(req.body?.clientId ?? ''),
        Boolean(req.body?.success ?? true),
        req.body?.reason ? String(req.body.reason) : undefined,
      ),
    );
  } catch (e) { next(e); }
});

// Portal-scoped aliases
pushRouter.post('/portal/subscribe', requireClient, async (req, res, next) => {
  try {
    res.status(201).json(
      await svc.registerSubscription({
        userId: req.auth!.sub,
        tenantId: req.auth!.tenantId!,
        endpoint: String(req.body?.endpoint ?? ''),
        p256dh: String(req.body?.p256dh ?? ''),
        auth: String(req.body?.auth ?? ''),
        userAgent: req.headers['user-agent'],
      }),
    );
  } catch (e) { next(e); }
});

pushRouter.get('/portal/notifications', requireClient, async (req, res, next) => {
  try {
    res.json(await svc.listForUser(req.auth!.sub));
  } catch (e) { next(e); }
});

pushRouter.get(
  '/portal/notifications/unread-count',
  requireClient,
  async (req, res, next) => {
    try {
      res.json({ count: await svc.unreadCount(req.auth!.sub) });
    } catch (e) { next(e); }
  },
);

pushRouter.post(
  '/portal/offline/enqueue',
  requireClient,
  async (req, res, next) => {
    try {
      res.status(201).json(
        await svc.enqueueOfflineAction({
          userId: req.auth!.sub,
          tenantId: req.auth!.tenantId!,
          clientId: String(req.body?.clientId ?? ''),
          action: String(req.body?.action ?? ''),
          payload: (req.body?.payload ?? {}) as Record<string, unknown>,
        }),
      );
    } catch (e) { next(e); }
  },
);

pushRouter.get('/portal/offline/pending', requireClient, async (req, res, next) => {
  try {
    res.json(await svc.listPending(req.auth!.sub));
  } catch (e) { next(e); }
});

pushRouter.post('/portal/offline/sync', requireClient, async (req, res, next) => {
  try {
    res.json(
      await svc.markSynced(
        String(req.body?.clientId ?? ''),
        Boolean(req.body?.success ?? true),
        req.body?.reason ? String(req.body.reason) : undefined,
      ),
    );
  } catch (e) { next(e); }
});
