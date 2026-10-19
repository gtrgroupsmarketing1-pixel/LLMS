import { Router } from 'express';
import { requireAuth, requireAgency } from '../middleware/auth';
import { prisma } from '@lmms/db';
import { logAudit, verifyAuditChain, exportAuditLog } from '@lmms/audit';
import { paginate } from '@lmms/scale';
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
  getLatestPrivacyPolicy,
  recordPrivacyPolicyAcceptance,
  listProcessingActivities,
  seedComplianceDefaults,
} from '@lmms/compliance';

export const complianceRouter = Router();

// Public webhooks — no auth (called by WhatsApp/SMS providers)
complianceRouter.post('/webhook/opt-out', async (req, res, next) => {
  try {
    const { tenantId, customerId, channel, source, evidence } = req.body ?? {};
    if (!tenantId || !customerId || !channel) {
      res.status(400).json({ error: 'missing_fields' });
      return;
    }
    const r = await processOptOut({
      tenantId,
      customerId,
      channel,
      source: source ?? 'webhook',
      evidence,
    });
    res.json(r);
  } catch (e) { next(e); }
});

complianceRouter.post('/webhook/erasure', async (req, res, next) => {
  try {
    const { tenantId, customerId, scope, notes } = req.body ?? {};
    if (!tenantId || !customerId) {
      res.status(400).json({ error: 'missing_fields' });
      return;
    }
    const r = await createErasureRequest({
      tenantId,
      customerId,
      scope: scope ?? 'PII_ONLY',
      actorId: 'webhook',
      notes,
    });
    res.status(201).json(r);
  } catch (e) { next(e); }
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
          channel: (req.body?.channel ?? 'WHATSAPP') as never,
          purpose: (req.body?.purpose ?? 'MARKETING') as never,
          status: (req.body?.status ?? 'OPT_IN') as never,
          source: String(req.body?.source ?? 'manual'),
          evidence: req.body?.evidence ? String(req.body.evidence) : undefined,
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
      await logAudit(tenantId, req.auth!.sub, 'dnc.add', `customer:${req.body?.customerId}`);
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
        scope: (req.body?.scope ?? 'PII_ONLY') as never,
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
      await seedComplianceDefaults();
      res.json({ ok: true });
    } catch (e) { next(e); }
  },
);

// DPA routes
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
        await acceptDpa({
          tenantId: req.params.tenantId as string,
          actorId: req.auth!.sub,
          dpaId: req.params.dpaId as string,
          ipAddress: req.ip,
          signatureData: req.body?.signatureData
            ? String(req.body.signatureData)
            : undefined,
        }),
      );
    } catch (e) { next(e); }
  },
);

// Privacy Policy routes
complianceRouter.get('/compliance/privacy-policy', async (_req, res, next) => {
  try {
    res.json(await getLatestPrivacyPolicy());
  } catch (e) { next(e); }
});

complianceRouter.post(
  '/tenants/:tenantId/privacy-policy/:policyId/accept',
  requireAgency('OWNER', 'ADMIN'),
  async (req, res, next) => {
    try {
      res.json(
        await recordPrivacyPolicyAcceptance({
          tenantId: req.params.tenantId as string,
          actorId: req.auth!.sub,
          policyId: req.params.policyId as string,
          ipAddress: req.ip,
        }),
      );
    } catch (e) { next(e); }
  },
);

// Processing Activity Registry
complianceRouter.get(
  '/compliance/processing-activities',
  async (req, res, next) => {
    try {
      const tenantId = req.query.tenantId ? String(req.query.tenantId) : undefined;
      res.json(await listProcessingActivities(tenantId));
    } catch (e) { next(e); }
  },
);

// SMS Sender IDs
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

// Compliance dashboard
complianceRouter.get(
  '/tenants/:tenantId/compliance/dashboard',
  requireAgency('OWNER', 'ADMIN', 'OPS'),
  async (req, res, next) => {
    try {
      res.json(await getComplianceDashboard(req.params.tenantId as string));
    } catch (e) { next(e); }
  },
);

// Audit log with pagination
complianceRouter.get(
  '/tenants/:tenantId/audit',
  requireAgency('OWNER', 'ADMIN'),
  async (req, res, next) => {
    try {
      const cursor = req.query.cursor ? String(req.query.cursor) : undefined;
      const limit = req.query.limit ? Number(req.query.limit) : 50;

      const page = await paginate(
        prisma.auditLog,
        {
          where: { tenantId: req.params.tenantId as string },
          orderBy: { timestamp: 'desc' },
        },
        { cursor: cursor || null, limit },
      );
      res.json(page);
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

// Legacy exports kept for backwards compat
complianceRouter.get(
  '/tenants/:tenantId/audit/export',
  requireAgency('OWNER', 'ADMIN'),
  async (req, res, next) => {
    try {
      const since = req.query.since ? new Date(String(req.query.since)) : undefined;
      const until = req.query.until ? new Date(String(req.query.until)) : undefined;
      res.json(await exportAuditLog(req.params.tenantId as string, since, until));
    } catch (e) { next(e); }
  },
);
