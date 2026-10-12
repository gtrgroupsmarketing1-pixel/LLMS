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

describe('performance benchmarks (PRD §16)', () => {
  it('CSV parse 100k rows < 10 minutes', async () => {
    const { parseCustomerCsv } = await import('@lmms/ingestion');
    const header = 'phone,email,name\n';
    const rows = Array.from(
      { length: 100_000 },
      (_, i) => `+97150${String(i).padStart(7, '0')},u${i}@x.co,User${i}`,
    );
    const csv = header + rows.join('\n');
    const t0 = Date.now();
    const result = await parseCustomerCsv(csv);
    const dur = Date.now() - t0;
    expect(result.total).toBe(100_000);
    expect(dur).toBeLessThan(10 * 60 * 1000);
    // eslint-disable-next-line no-console
    console.log(`CSV parse: ${dur}ms`);
  }, 600_000);

  it('segment preview < 3s over 5k customers', async () => {
    const t = await createTestTenant();
    const data = Array.from({ length: 5_000 }, (_, i) => ({
      tenantId: t.id,
      phone: `+9716${String(i).padStart(8, '0')}`,
      source: 'CSV',
      language: i % 2 === 0 ? 'ar' : 'en',
    }));
    for (let i = 0; i < data.length; i += 500) {
      await prisma.endCustomer.createMany({
        data: data.slice(i, i + 500),
        skipDuplicates: true,
      });
    }

    const { previewSegment } = await import('@lmms/segmentation');
    const t0 = Date.now();
    const result = await previewSegment(t.id, {
      logic: 'AND',
      rules: [{ field: 'language', operator: 'eq', value: 'ar' }],
    });
    const dur = Date.now() - t0;
    expect(result.count).toBe(2_500);
    expect(dur).toBeLessThan(3000);
    // eslint-disable-next-line no-console
    console.log(`Segment preview: ${dur}ms`);
  }, 60_000);

  it('client dashboard < 3s for 1000 messages', async () => {
    const t = await createTestTenant();
    const c = await prisma.endCustomer.create({
      data: { tenantId: t.id, phone: '+971600000001', source: 'MANUAL', language: 'ar' },
    });
    const now = Date.now();
    const messages = Array.from({ length: 1000 }, (_, i) => ({
      tenantId: t.id,
      customerId: c.id,
      status: 'SENT' as const,
      sentAt: new Date(now - i * 1000),
      cost: 0,
    }));
    for (let i = 0; i < messages.length; i += 500) {
      await prisma.message.createMany({ data: messages.slice(i, i + 500) });
    }

    const { getClientDashboard } = await import('../../services/reporting.service');
    const t0 = Date.now();
    await getClientDashboard(t.id);
    const dur = Date.now() - t0;
    expect(dur).toBeLessThan(3000);
    // eslint-disable-next-line no-console
    console.log(`Dashboard: ${dur}ms`);
  }, 60_000);
});
