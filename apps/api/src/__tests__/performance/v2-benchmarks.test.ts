import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '@lmms/db';
import { assertTestDb, wipeTestData, createTestTenant } from '../helpers/setup';

beforeAll(async () => {
  assertTestDb();
  await wipeTestData();
});
afterAll(async () => {
  await prisma.$disconnect();
});

describe('V2 performance benchmarks', () => {
  it('readiness scoring on a tenant < 2 seconds', async () => {
    const t = await createTestTenant('STANDALONE');
    const pipe = await import('@lmms/migration-pipeline');

    // Seed some activity
    const data = Array.from({ length: 500 }, (_, i) => ({
      tenantId: t.id,
      phone: `+9715${String(i).padStart(8, '0')}`,
      source: 'CSV',
      language: 'ar',
    }));
    for (let i = 0; i < data.length; i += 100) {
      await prisma.endCustomer.createMany({
        data: data.slice(i, i + 100),
        skipDuplicates: true,
      });
    }

    const t0 = Date.now();
    await pipe.scoreAndRecord(t.id);
    const dur = Date.now() - t0;
    expect(dur).toBeLessThan(2000);
    // eslint-disable-next-line no-console
    console.log(`readiness scoring: ${dur}ms`);
  }, 30_000);

  it('cohort snapshot on 1k customers < 3 seconds', async () => {
    const t = await createTestTenant();
    const qbr = await import('@lmms/qbr');

    const data = Array.from({ length: 1000 }, (_, i) => ({
      tenantId: t.id,
      phone: `+9716${String(i).padStart(8, '0')}`,
      source: 'CSV',
      language: i % 2 === 0 ? 'ar' : 'en',
      createdAt: new Date(Date.UTC(2026, 0, 15)),
    }));
    for (let i = 0; i < data.length; i += 200) {
      await prisma.endCustomer.createMany({
        data: data.slice(i, i + 200),
        skipDuplicates: true,
      });
    }

    const t0 = Date.now();
    await qbr.buildCohortSnapshot({
      tenantId: t.id,
      cohortDate: new Date(Date.UTC(2026, 0, 1)),
    });
    const dur = Date.now() - t0;
    expect(dur).toBeLessThan(3000);
    // eslint-disable-next-line no-console
    console.log(`cohort snapshot: ${dur}ms`);
  }, 60_000);

  it('invoice builder < 1 second', async () => {
    const t = await createTestTenant();
    const billing = await import('@lmms/billing');

    const t0 = Date.now();
    await billing.createInvoice({
      tenantId: t.id,
      actorId: 'test',
      tenantPrefix: 'TNT',
      country: 'AE',
      currency: 'AED',
      periodStart: new Date(Date.UTC(2026, 0, 1)),
      periodEnd: new Date(Date.UTC(2026, 0, 31)),
      dueDate: new Date(Date.UTC(2026, 1, 14)),
      baseFee: 1500,
      baseFeeDescription: 'Monthly',
      usageLines: [],
    });
    const dur = Date.now() - t0;
    expect(dur).toBeLessThan(1000);
    // eslint-disable-next-line no-console
    console.log(`invoice build: ${dur}ms`);
  }, 30_000);

  it('QBR deck build < 5 seconds', async () => {
    const t = await createTestTenant();
    const qbr = await import('@lmms/qbr');

    const t0 = Date.now();
    await qbr.buildDeck({
      tenantId: t.id,
      actorId: 'test',
      periodStart: new Date(Date.UTC(2026, 0, 1)),
      periodEnd: new Date(Date.UTC(2026, 2, 31)),
    });
    const dur = Date.now() - t0;
    expect(dur).toBeLessThan(5000);
    // eslint-disable-next-line no-console
    console.log(`qbr build: ${dur}ms`);
  }, 60_000);

  it('ranked pipeline < 2 seconds for 20 tenants', async () => {
    const tenants = await Promise.all(
      Array.from({ length: 20 }, () => createTestTenant('STANDALONE')),
    );
    const pipe = await import('@lmms/migration-pipeline');

    for (const t of tenants) {
      await pipe.scoreAndRecord(t.id);
    }

    const t0 = Date.now();
    const ranked = await pipe.rankedPipeline();
    const dur = Date.now() - t0;
    expect(ranked.length).toBeGreaterThanOrEqual(20);
    expect(dur).toBeLessThan(2000);
    // eslint-disable-next-line no-console
    console.log(`ranked pipeline: ${dur}ms`);
  }, 60_000);
});
