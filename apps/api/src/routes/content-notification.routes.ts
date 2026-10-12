import { Router } from 'express';
import { requireAuth, requireAgency } from '../middleware/auth';
import * as svc from '../services/content-notification.service';

export const contentNotificationRouter = Router();

contentNotificationRouter.get(
  '/agency/tenants/:tenantId/approval-queue',
  requireAuth,
  requireAgency('OWNER', 'ADMIN', 'STRATEGIST', 'OPS'),
  async (req, res, next) => {
    try {
      res.json(await svc.approvalQueue(req.params.tenantId as string));
    } catch (e) { next(e); }
  },
);

contentNotificationRouter.get(
  '/agency/tenants/:tenantId/rejection-analytics',
  requireAuth,
  requireAgency('OWNER', 'ADMIN', 'STRATEGIST'),
  async (req, res, next) => {
    try {
      res.json(await svc.rejectionAnalytics(req.params.tenantId as string));
    } catch (e) { next(e); }
  },
);

contentNotificationRouter.get(
  '/agency/tenants/:tenantId/cards/:cardId/notifications',
  requireAuth,
  requireAgency('OWNER', 'ADMIN', 'STRATEGIST', 'OPS', 'DESIGNER'),
  async (req, res, next) => {
    try {
      res.json(
        await svc.listNotifications(
          req.params.tenantId as string,
          req.params.cardId as string,
        ),
      );
    } catch (e) { next(e); }
  },
);

contentNotificationRouter.post(
  '/agency/tenants/:tenantId/cards/:cardId/notify',
  requireAuth,
  requireAgency('OWNER', 'ADMIN', 'STRATEGIST'),
  async (req, res, next) => {
    try {
      const n = await svc.sendApprovalRequest({
        tenantId: req.params.tenantId as string,
        actorId: req.auth!.sub,
        cardId: req.params.cardId as string,
        sentTo: String(req.body?.sentTo ?? ''),
        approvalUrl: String(req.body?.approvalUrl ?? ''),
      });
      res.status(201).json(n);
    } catch (e) { next(e); }
  },
);
