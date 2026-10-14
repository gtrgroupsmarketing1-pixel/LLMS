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

describe('Journey I — B2B Pipeline', () => {
  it('runs a prospect from NEW to WON and records a contract', async () => {
    const t = await createTestTenant();
    const b2b = await import('@lmms/b2b');

    const prospect = await b2b.createProspect({
      tenantId: t.id,
      actorId: 'strat',
      businessName: 'Azure Hotel',
      category: 'HOTEL',
      contactName: 'Lina',
      contactEmail: 'lina@azure.test',
      country: 'AE',
    });
    expect(prospect.status).toBe('NEW');

    await b2b.transitionProspect({ tenantId: t.id, actorId: 'strat', prospectId: prospect.id, to: 'CONTACTED' });
    await b2b.transitionProspect({ tenantId: t.id, actorId: 'strat', prospectId: prospect.id, to: 'MEETING' });
    await b2b.transitionProspect({ tenantId: t.id, actorId: 'strat', prospectId: prospect.id, to: 'PROPOSAL' });
    await b2b.transitionProspect({ tenantId: t.id, actorId: 'strat', prospectId: prospect.id, to: 'WON' });

    const final = await prisma.prospect.findUnique({ where: { id: prospect.id } });
    expect(final?.status).toBe('WON');

    const proposal = await b2b.createProposal({
      tenantId: t.id,
      actorId: 'strat',
      prospectId: prospect.id,
      input: {
        title: 'Hotel partnership',
        items: [
          { description: 'Weekly linens', amount: 4000 },
          { description: 'Towel service', amount: 1500 },
        ],
        currency: 'AED',
      },
    });
    expect(Number(proposal.totalValue)).toBe(5500);

    const contract = await b2b.recordContract({
      tenantId: t.id,
      actorId: 'strat',
      prospectId: prospect.id,
      name: 'Azure Hotel — annual',
      value: 5500,
      currency: 'AED',
      signedDate: new Date(),
      startDate: new Date(),
    });
    expect(Number(contract.value)).toBe(5500);
  });

  it('rejects an invalid state transition', async () => {
    const t = await createTestTenant();
    const b2b = await import('@lmms/b2b');

    const p = await b2b.createProspect({
      tenantId: t.id,
      actorId: 'strat',
      businessName: 'Bad path',
      category: 'OTHER',
      country: 'AE',
    });

    await expect(
      b2b.transitionProspect({ tenantId: t.id, actorId: 'strat', prospectId: p.id, to: 'WON' }),
    ).rejects.toThrow(/invalid_prospect_transition/);
  });
});

describe('Journey J — Billing cycle', () => {
  it('builds invoice with VAT, generates PDF, pays via capture', async () => {
    const t = await createTestTenant();
    const billing = await import('@lmms/billing');

    const inv = await billing.createInvoice({
      tenantId: t.id,
      actorId: 'ops',
      tenantPrefix: 'TNT',
      country: 'AE',
      currency: 'AED',
      periodStart: new Date(Date.UTC(2026, 0, 1)),
      periodEnd: new Date(Date.UTC(2026, 0, 31)),
      dueDate: new Date(Date.UTC(2026, 1, 14)),
      baseFee: 1500,
      baseFeeDescription: 'Monthly package fee',
      usageLines: [
        { description: 'Extra messages', quantity: 500, unitPrice: 0.05 },
      ],
    });
    expect(inv.total).toBeGreaterThan(1500);

    const pdf = await billing.renderInvoicePdf(t.id, inv.id, 'ops');
    expect(pdf.sizeBytes).toBeGreaterThan(500);

    await billing.sendInvoice({ tenantId: t.id, actorId: 'ops', invoiceId: inv.id });

    const payment = await billing.initiatePayment({
      tenantId: t.id,
      actorId: 'ops',
      invoiceId: inv.id,
      provider: 'STRIPE',
      returnUrl: 'https://example.com/return',
    });
    expect(payment.status).toBe('PENDING');

    const captured = await billing.capturePayment({
      tenantId: t.id,
      actorId: 'ops',
      paymentId: payment.id,
    });
    expect(captured.status).toBe('CAPTURED');

    const refreshed = await prisma.invoice.findUnique({ where: { id: inv.id } });
    expect(refreshed?.status).toBe('PAID');
  });

  it('computes correct VAT for Saudi Arabia', async () => {
    const billing = await import('@lmms/billing');
    const rate = billing.vatRateFor('SA');
    expect(rate).toBe(0.15);
    const calc = billing.computeVat(1000, rate);
    expect(calc.vatAmount).toBe(150);
    expect(calc.total).toBe(1150);
  });
});

describe('Journey O — Migration pipeline', () => {
  it('scores a tenant, builds pitch pack, sends pitch, records decline', async () => {
    const t = await createTestTenant('STANDALONE');
    const pipe = await import('@lmms/migration-pipeline');

    await prisma.endCustomer.create({
      data: { tenantId: t.id, phone: '+971501111111', source: 'CSV', language: 'ar' },
    });

    const score = await pipe.scoreAndRecord(t.id);
    expect(score.score).toBeGreaterThanOrEqual(0);
    expect(['HOT', 'WARM', 'COLD']).toContain(score.tier);

    const pack = await pipe.buildPitchPack(t.id);
    expect(pack.benefits.length).toBeGreaterThan(0);
    expect(pack.headline.length).toBeGreaterThan(0);

    const pitch = await pipe.sendPitch({ tenantId: t.id, actorId: 'ops' });
    expect(pitch.outcome).toBe('PENDING');

    const decided = await pipe.recordPitchOutcome({
      tenantId: t.id,
      actorId: 'ops',
      pitchId: pitch.id,
      outcome: 'DECLINED',
      note: 'too expensive',
    });
    expect(decided.outcome).toBe('DECLINED');

    const report = await pipe.pipelineConversionReport(30);
    expect(report.totalPitches).toBeGreaterThanOrEqual(1);
    expect(report.declined).toBeGreaterThanOrEqual(1);
  });

  it('ranks tenants by tier and score', async () => {
    const t1 = await createTestTenant('STANDALONE');
    const t2 = await createTestTenant('STANDALONE');
    const pipe = await import('@lmms/migration-pipeline');

    await pipe.scoreAndRecord(t1.id);
    await pipe.scoreAndRecord(t2.id);

    const ranked = await pipe.rankedPipeline();
    expect(ranked.length).toBeGreaterThanOrEqual(2);
    // HOT before WARM before COLD
    const tiers = ranked.map((r) => r.tier);
    const hotIdx = tiers.indexOf('HOT');
    const coldIdx = tiers.indexOf('COLD');
    if (hotIdx !== -1 && coldIdx !== -1) {
      expect(hotIdx).toBeLessThan(coldIdx);
    }
  });
});

describe('Journey P — Agency ops daily', () => {
  it('builds digest with active alerts', async () => {
    const t = await createTestTenant();
    const agency = await import('@lmms/agency');

    await prisma.dataSource.create({
      data: { tenantId: t.id, type: 'ERP', status: 'FAILED' },
    });

    const digest = await agency.buildDailyDigest();
    const failedSection = digest.sections.find((s) => s.key === 'failed_syncs');
    expect(failedSection?.count).toBeGreaterThanOrEqual(1);
  });

  it('task state machine enforces valid transitions', async () => {
    const agency = await import('@lmms/agency');

    const task = await agency.createTask({
      title: 'Onboarding cleanup',
      createdBy: 'ops',
    });
    expect(task.status).toBe('OPEN');

    await agency.transitionTask({ actorId: 'ops', taskId: task.id, to: 'IN_PROGRESS' });
    await agency.transitionTask({ actorId: 'ops', taskId: task.id, to: 'DONE' });

    const finished = await prisma.task.findUnique({ where: { id: task.id } });
    expect(finished?.status).toBe('DONE');
    expect(finished?.completedAt).not.toBeNull();
  });

  it('seeds and completes an SOP', async () => {
    const t = await createTestTenant();
    const agency = await import('@lmms/agency');

    const seeded = await agency.seedSops();
    expect(seeded).toBeGreaterThan(0);

    const completion = await agency.recordSopCompletion({
      actorId: 'ops',
      sopKey: 'campaign_launch',
      tenantId: t.id,
      notes: 'All steps verified',
    });
    expect(completion.sopKey).toBe('campaign_launch');

    const history = await agency.listSopCompletions('campaign_launch');
    expect(history.length).toBeGreaterThanOrEqual(1);
  });

  it('bulk approve caps at 50', async () => {
    const agency = await import('@lmms/agency');

    await expect(
      agency.bulkApprove({
        actorId: 'admin',
        campaignIds: Array.from({ length: 51 }, (_, i) => `c-${i}`),
      }),
    ).rejects.toThrow(/bulk_limit_exceeded/);
  });

  it('logs time entry for a task', async () => {
    const agency = await import('@lmms/agency');

    const task = await agency.createTask({ title: 'Time-tracked', createdBy: 'ops' });
    const started = new Date(Date.now() - 30 * 60 * 1000);
    const ended = new Date();

    const entry = await agency.logTime({
      actorId: 'ops',
      taskId: task.id,
      minutes: 30,
      startedAt: started,
      endedAt: ended,
    });
    expect(entry.minutes).toBe(30);
  });
});
