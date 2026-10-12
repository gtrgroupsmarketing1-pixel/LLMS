import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '@lmms/db';
import { assertConsent } from '@lmms/compliance';
import { assertTestDb, wipeTestData, createTestTenant } from '../helpers/setup';

beforeAll(async () => {
  assertTestDb();
  await wipeTestData();
});
afterAll(async () => {
  await prisma.$disconnect();
});

async function makeCustomer(tenantId: string, phone: string, withExplicitConsent: boolean) {
  const c = await prisma.endCustomer.create({
    data: {
      tenantId,
      phone,
      source: 'MANUAL',
      language: 'ar',
      consentVerified: withExplicitConsent,
      needsReview: !withExplicitConsent,
    },
  });
  if (withExplicitConsent) {
    await prisma.consentRecord.create({
      data: {
        tenantId,
        customerId: c.id,
        channel: 'WHATSAPP',
        purpose: 'MARKETING',
        status: 'OPT_IN',
        source: 'explicit',
      },
    });
  }
  return c;
}

describe('consent gate (AC-CON-001)', () => {
  it('blocks send when customer has no consent', async () => {
    const t = await createTestTenant();
    const c = await makeCustomer(t.id, '+971500000001', false);
    const r = await assertConsent({
      tenantId: t.id,
      customerId: c.id,
      channel: 'WHATSAPP',
      purpose: 'MARKETING',
    });
    expect(r.allowed).toBe(false);
  });

  it('allows send with explicit consent record', async () => {
    const t = await createTestTenant();
    const c = await makeCustomer(t.id, '+971500000002', true);
    const r = await assertConsent({
      tenantId: t.id,
      customerId: c.id,
      channel: 'WHATSAPP',
      purpose: 'MARKETING',
    });
    expect(r.allowed).toBe(true);
    expect(r.consentId).toBeTruthy();
  });

  it('DNC list overrides valid consent', async () => {
    const t = await createTestTenant();
    const c = await makeCustomer(t.id, '+971500000003', true);
    await prisma.doNotContact.create({
      data: { tenantId: t.id, customerId: c.id, reason: 'test', addedBy: 'test' },
    });
    const r = await assertConsent({
      tenantId: t.id,
      customerId: c.id,
      channel: 'WHATSAPP',
      purpose: 'MARKETING',
    });
    expect(r.allowed).toBe(false);
    expect(r.reason).toBe('dnc');
  });
});
