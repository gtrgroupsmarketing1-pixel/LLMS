import { Router } from 'express';
import { requireAuth, requireAgency } from '../middleware/auth';
import { prisma } from '@lmms/db';
import { logAudit, verifyAuditChain, exportAuditLog } from '@lmms/audit';
import {
  processOptOut,
  createErasureRequest,
  processErasure,
  listErasureQueue,
  applyRetentionPolicy,
  seedRetentionPolicies,
  registerSmsSenderId,
  approveSmsSenderId,
  listSmsSenderIds,
  getOrCreateDpa,
  acceptDpa,
  getComplianceDashboard,
} from '@lmms/compliance';

export const complianceRouter = Router();

// Public webhooks — no auth (called by WhatsApp/SMS providers)
complianceRouter.post('/webhook/opt-out', async (req, res, next) => {
  try {
    const { tenantId, customerId, channel, source, evidence } = req.body ?? {};
    if (!tenantId || !customerId || !channel) {
      return res.status(400).json({ error: 'missing_fields' });
    }
    const r = await processOptOut({
      tenantId,
      customerId,
      channel,
      source: source ?? 'webhook',
      evidence,
    });
    return res.json(r);
  } catch (e) {
    return next(e);
  }
});

complianceRouter.post('/webhook/erasure', async (req, res, next) => {
  try {
    const { tenantId, customerId, scope, notes } = req.body ?? {};
    if (!tenantId || !customerId) {
      return res.status(400).json({ error: 'missing_fields' });
    }
    const r = await createErasureRequest({
      tenantId,
      customerId,
      scope: scope ?? 'PII_ONLY',
      actorId: 'webhook',
      notes,
    });
    return res.status(201).json(r);
  } catch (e) {
    return next(e);
  }
});

// All routes below require auth
complianceRouter.use(requireAuth);

complianceRouter.get(
  '/tenants/:tenantId/consent',
  requireAgency('OWNER', 'ADMIN', 'OPS'),
  async (req, res, next) => {
    try {
      const records = await prisma.consentRecord.findMany({
        where: { tenantId: req.params.tenantId as string },
        orderBy: { timestamp: 'desc' },
        take: 500,
      });
      res.json(records);
    } catch (e) { next(e); }
  },
);

complianceRouter.post(
  '/tenants/:tenantId/consent',
  requireAgency('OWNER', 'ADMIN', 'OPS'),
  async (req, res, next) => {
    try {
      const tenantId = req.params.tenantId as string;
      const record = await prisma.consentRecord.create({
        data: {
          tenantId,
          customerId: String(req.body?.customerId ?? ''),
          channel: (req.body?.channel ?? 'WHATSAPP') as
            | 'WHATSAPP'
            | 'SMS'
            | 'EMAIL',
          purpose: (req.body?.purpose ?? 'MARKETING') as
            | 'MARKETING'
            | 'TRANSACTIONAL'
            | 'AUTHENTICATION'
            | 'SERVICE',
          status: (req.body?.status ?? 'OPT_IN') as
            | 'OPT_IN'
            | 'OPT_OUT'
            | 'PENDING'
            | 'WITHDRAWN',
          source: String(req.body?.source ?? 'manual'),
          evidence: req.body?.evidence
            ? String(req.body.evidence)
            : undefined,
        },
      });
      await logAudit(tenantId, req.auth!.sub, 'consent.manual', `consent:${record.id}`);
      res.status(201).json(record);
    } catch (e) { next(e); }
  },
);

complianceRouter.get(
  '/tenants/:tenantId/dnc',
  requireAgency('OWNER', 'ADMIN', 'OPS'),
  async (req, res, next) => {
    try {
      res.json(
        await prisma.doNotContact.findMany({
          where: { tenantId: req.params.tenantId as string },
        }),
      );
    } catch (e) { next(e); }
  },
);

complianceRouter.post(
  '/tenants/:tenantId/dnc',
  requireAgency('OWNER', 'ADMIN', 'OPS'),
  async (req, res, next) => {
    try {
      const tenantId = req.params.tenantId as string;
      const created = await prisma.doNotContact.upsert({
        where: {
          tenantId_customerId: {
            tenantId,
            customerId: String(req.body?.customerId ?? ''),
          },
        },
        update: {},
        create: {
          tenantId,
          customerId: String(req.body?.customerId ?? ''),
          reason: String(req.body?.reason ?? 'manual'),
          addedBy: req.auth!.sub,
        },
      });
      await logAudit(
        tenantId,
        req.auth!.sub,
        'dnc.add',
        `customer:${req.body?.customerId}`,
      );
      res.status(201).json(created);
    } catch (e) { next(e); }
  },
);

complianceRouter.get(
  '/tenants/:tenantId/erasures',
  requireAgency('OWNER', 'ADMIN', 'OPS'),
  async (req, res, next) => {
    try {
      res.json(await listErasureQueue(req.params.tenantId as string));
    } catch (e) { next(e); }
  },
);

complianceRouter.post(
  '/tenants/:tenantId/erasures',
  requireAgency('OWNER', 'ADMIN', 'OPS'),
  async (req, res, next) => {
    try {
      const r = await createErasureRequest({
        tenantId: req.params.tenantId as string,
        customerId: String(req.body?.customerId ?? ''),
        scope: (req.body?.scope ?? 'PII_ONLY') as 'PII_ONLY' | 'FULL',
        actorId: req.auth!.sub,
        notes: req.body?.notes ? String(req.body.notes) : undefined,
      });
      res.status(201).json(r);
    } catch (e) { next(e); }
  },
);

complianceRouter.post(
  '/tenants/:tenantId/erasures/:erasureId/process',
  requireAgency('OWNER', 'ADMIN', 'OPS'),
  async (req, res, next) => {
    try {
      res.json(
        await processErasure(
          req.params.tenantId as string,
          req.params.erasureId as string,
          req.auth!.sub,
        ),
      );
    } catch (e) { next(e); }
  },
);

complianceRouter.post(
  '/tenants/:tenantId/retention/apply',
  requireAgency('OWNER', 'ADMIN', 'OPS'),
  async (req, res, next) => {
    try {
      res.json(await applyRetentionPolicy(req.params.tenantId as string));
    } catch (e) { next(e); }
  },
);

complianceRouter.post(
  '/compliance/seed-retention',
  requireAgency('OWNER', 'ADMIN'),
  async (_req, res, next) => {
    try {
      await seedRetentionPolicies();
      res.json({ ok: true });
    } catch (e) { next(e); }
  },
);

complianceRouter.get(
  '/tenants/:tenantId/dpa',
  requireAgency('OWNER', 'ADMIN', 'OPS'),
  async (req, res, next) => {
    try {
      res.json(
        await getOrCreateDpa(req.params.tenantId as string, req.auth!.sub),
      );
    } catch (e) { next(e); }
  },
);

complianceRouter.post(
  '/tenants/:tenantId/dpa/:dpaId/accept',
  requireAgency('OWNER', 'ADMIN'),
  async (req, res, next) => {
    try {
      res.json(
        await acceptDpa(
          req.params.tenantId as string,
          req.params.dpaId as string,
          req.auth!.sub,
        ),
      );
    } catch (e) { next(e); }
  },
);

complianceRouter.get(
  '/tenants/:tenantId/sms-senders',
  requireAgency('OWNER', 'ADMIN', 'OPS'),
  async (req, res, next) => {
    try {
      res.json(await listSmsSenderIds(req.params.tenantId as string));
    } catch (e) { next(e); }
  },
);

complianceRouter.post(
  '/tenants/:tenantId/sms-senders',
  requireAgency('OWNER', 'ADMIN', 'OPS'),
  async (req, res, next) => {
    try {
      const r = await registerSmsSenderId({
        tenantId: req.params.tenantId as string,
        country: String(req.body?.country ?? ''),
        senderId: String(req.body?.senderId ?? ''),
        actorId: req.auth!.sub,
      });
      res.status(201).json(r);
    } catch (e) { next(e); }
  },
);

complianceRouter.post(
  '/tenants/:tenantId/sms-senders/:recordId/approve',
  requireAgency('OWNER', 'ADMIN'),
  async (req, res, next) => {
    try {
      res.json(
        await approveSmsSenderId(
          req.params.tenantId as string,
          req.params.recordId as string,
          req.auth!.sub,
        ),
      );
    } catch (e) { next(e); }
  },
);

complianceRouter.get(
  '/tenants/:tenantId/compliance/dashboard',
  requireAgency('OWNER', 'ADMIN', 'OPS'),
  async (req, res, next) => {
    try {
      res.json(
        await getComplianceDashboard(req.params.tenantId as string),
      );
    } catch (e) { next(e); }
  },
);

complianceRouter.get(
  '/tenants/:tenantId/audit',
  requireAgency('OWNER', 'ADMIN'),
  async (req, res, next) => {
    try {
      const since = req.query.since
        ? new Date(String(req.query.since))
        : undefined;
      const until = req.query.until
        ? new Date(String(req.query.until))
        : undefined;
      res.json(
        await exportAuditLog(req.params.tenantId as string, since, until),
      );
    } catch (e) { next(e); }
  },
);

complianceRouter.get(
  '/tenants/:tenantId/audit/verify',
  requireAgency('OWNER', 'ADMIN'),
  async (req, res, next) => {
    try {
      res.json(await verifyAuditChain(req.params.tenantId as string));
    } catch (e) { next(e); }
  },
);
