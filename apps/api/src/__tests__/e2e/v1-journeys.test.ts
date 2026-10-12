import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '@lmms/db';
import {
  assertTestDb,
  wipeTestData,
  createTestTenant,
  ensureAppendOnlyTrigger,
} from '../helpers/setup';

beforeAll(async () => {
  assertTestDb();
  await wipeTestData();
  await ensureAppendOnlyTrigger();
});
afterAll(async () => {
  await prisma.$disconnect();
});

describe('Journey A — ERP-Connected onboarding', () => {
  it('creates tenant, seeds segments and automations', async () => {
    const t = await createTestTenant('ERP_CONNECTED');
    const { seedPrebuiltSegments } = await import('@lmms/segmentation');
    const { seedAutomations } = await import('@lmms/automations');

    const segs = await seedPrebuiltSegments(t.id, 'ERP_CONNECTED');
    expect(segs).toBeGreaterThan(0);
    const autos = await seedAutomations(t.id);
    expect(autos).toBe(9);

    const segCount = await prisma.segment.count({ where: { tenantId: t.id } });
    const autoCount = await prisma.automation.count({ where: { tenantId: t.id } });
    expect(segCount).toBeGreaterThan(0);
    expect(autoCount).toBe(9);
  });
});

describe('Journey B — Standalone onboarding', () => {
  it('imports CSV with consent flagging', async () => {
    const t = await createTestTenant('STANDALONE');
    const { importCustomerCsv } = await import('@lmms/ingestion');

    const csv =
      'phone,email,name,consent_status\n' +
      '+971701111111,a@x.com,A,opt_in\n' +
      '+971702222222,b@x.com,B,\n';

    const result = await importCustomerCsv({
      tenantId: t.id,
      actorId: 'test',
      filename: 'test.csv',
      content: csv,
      hasExplicitConsent: false,
    });

    expect(result.rowsTotal).toBe(2);
    expect(result.rowsImported).toBe(1);
    expect(result.rowsFlagged).toBe(1);

    const flagged = await prisma.endCustomer.findFirst({
      where: { tenantId: t.id, consentVerified: false },
    });
    expect(flagged?.needsReview).toBe(true);
  });
});

describe('Journey D — Migration rollback', () => {
  it('rollback restores STANDALONE', async () => {
    const t = await createTestTenant('STANDALONE');
    await prisma.endCustomer.create({
      data: {
        tenantId: t.id,
        phone: '+971502222222',
        source: 'CSV',
        language: 'ar',
        consentVerified: true,
      },
    });

    const { startMigration, rollbackMigration } = await import('@lmms/migration');
    const { MockErpAdapter } = await import('@lmms/ingestion');

    const start = await startMigration({
      tenantId: t.id,
      actorId: 'test',
      adapter: new MockErpAdapter(),
    });
    await rollbackMigration({
      tenantId: t.id,
      actorId: 'test',
      jobId: start.jobId,
      reason: 'test',
    });

    const end = await prisma.tenant.findUnique({ where: { id: t.id } });
    expect(end!.mode).toBe('STANDALONE');
  });
});

describe('Journey K — Compliance & erasure', () => {
  it('erasure nulls PII, preserves audit', async () => {
    const t = await createTestTenant();
    const c = await prisma.endCustomer.create({
      data: {
        tenantId: t.id,
        phone: '+971503333333',
        email: 'x@x.com',
        name: 'X',
        source: 'MANUAL',
        language: 'ar',
      },
    });

    const { createErasureRequest, processErasure } = await import('@lmms/compliance');
    const req = await createErasureRequest({
      tenantId: t.id,
      customerId: c.id,
      scope: 'PII_ONLY',
      actorId: 'test',
    });
    const result = await processErasure(t.id, req.id, 'test');
    expect(result.auditPreserved).toBe(true);

    const after = await prisma.endCustomer.findUnique({ where: { id: c.id } });
    expect(after!.email).toBeNull();
    expect(after!.name).toBeNull();
    expect(after!.phone).toMatch(/^erased_/);

    const audit = await prisma.auditLog.findFirst({
      where: { tenantId: t.id, action: 'erasure.complete' },
    });
    expect(audit).not.toBeNull();
  });
});

describe('Journey L — Reporting', () => {
  it('monthly + weekly generators are idempotent', async () => {
    const t = await createTestTenant();
    const { generateMonthlyReport, generateWeeklySummary } = await import(
      '@lmms/reporting'
    );

    const m1 = await generateMonthlyReport(t.id, undefined, 'test');
    const m2 = await generateMonthlyReport(t.id, undefined, 'test');
    expect(m1.reportId).toBe(m2.reportId);

    const w1 = await generateWeeklySummary(t.id, undefined, 'test');
    const w2 = await generateWeeklySummary(t.id, undefined, 'test');
    expect(w1.reportId).toBe(w2.reportId);
  });
});

describe('Journey R — Consent opt-out propagation', () => {
  it('opt-out propagates across channels', async () => {
    const t = await createTestTenant();
    const c = await prisma.endCustomer.create({
      data: {
        tenantId: t.id,
        phone: '+971506666666',
        source: 'MANUAL',
        language: 'ar',
        consentVerified: true,
      },
    });
    await prisma.consentRecord.create({
      data: {
        tenantId: t.id,
        customerId: c.id,
        channel: 'WHATSAPP',
        purpose: 'MARKETING',
        status: 'OPT_IN',
        source: 'explicit',
      },
    });

    const { processOptOut } = await import('@lmms/compliance');
    const result = await processOptOut({
      tenantId: t.id,
      customerId: c.id,
      channel: 'WHATSAPP',
      source: 'keyword',
      evidence: 'STOP',
    });
    expect(result.propagated).toBe(3);

    const optOuts = await prisma.consentRecord.findMany({
      where: { tenantId: t.id, customerId: c.id, status: 'OPT_OUT' },
    });
    expect(optOuts.length).toBe(3);
  });
});
