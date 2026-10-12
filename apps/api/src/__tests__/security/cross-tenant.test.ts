import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { prisma } from '@lmms/db';
import { signAccess } from '@lmms/auth';
import { createApp } from '../../app';
import {
  assertTestDb,
  wipeTestData,
  createTestTenant,
  createTestAgencyOwner,
  createTestClient,
} from '../helpers/setup';

const app = createApp();

beforeAll(async () => {
  assertTestDb();
  await wipeTestData();
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe('cross-tenant isolation', () => {
  it('client A cannot read tenant B segments via URL param', async () => {
    const tenantA = await createTestTenant();
    const tenantB = await createTestTenant();
    const { user } = await createTestClient(tenantA.id);

    const token = signAccess({
      sub: user.id,
      role: 'OWNER',
      kind: 'client',
      tenantId: tenantA.id,
    });

    const r = await request(app)
      .get(`/segmentation/tenants/${tenantB.id}/segments`)
      .set('Authorization', `Bearer ${token}`);

    expect([401, 403]).toContain(r.status);
  });

  it('agency OWNER can read any tenant by design', async () => {
    const tenantA = await createTestTenant();
    const tenantB = await createTestTenant();
    const { user } = await createTestAgencyOwner();
    const token = signAccess({ sub: user.id, role: 'OWNER', kind: 'agency' });

    const rA = await request(app)
      .get(`/segmentation/tenants/${tenantA.id}/segments`)
      .set('Authorization', `Bearer ${token}`);
    const rB = await request(app)
      .get(`/segmentation/tenants/${tenantB.id}/segments`)
      .set('Authorization', `Bearer ${token}`);

    expect(rA.status).toBe(200);
    expect(rB.status).toBe(200);
  });

  it('client-scoped queries never leak tenant B rows', async () => {
    const tenantA = await createTestTenant();
    const tenantB = await createTestTenant();

    await prisma.endCustomer.create({
      data: { tenantId: tenantB.id, phone: '+971599999990', source: 'MANUAL', language: 'ar' },
    });
    await prisma.clientMessageInbox.create({
      data: {
        tenantId: tenantB.id,
        customerId: 'x',
        direction: 'INBOUND',
        body: 'hello',
        status: 'RECEIVED',
      },
    });

    const { user } = await createTestClient(tenantA.id);
    const token = signAccess({ sub: user.id, role: 'OWNER', kind: 'client', tenantId: tenantA.id });

    const r = await request(app).get('/portal/messages').set('Authorization', `Bearer ${token}`);
    expect(r.status).toBe(200);
    expect(Array.isArray(r.body)).toBe(true);
    expect(r.body.some((m: { tenantId: string }) => m.tenantId === tenantB.id)).toBe(false);
  });

  it('direct prisma query with wrong tenantId returns nothing', async () => {
    const tenantA = await createTestTenant();
    const tenantB = await createTestTenant();
    await prisma.endCustomer.create({
      data: { tenantId: tenantB.id, phone: '+971500000099', source: 'MANUAL', language: 'ar' },
    });
    const found = await prisma.endCustomer.findMany({ where: { tenantId: tenantA.id } });
    expect(found.length).toBe(0);
  });
});
