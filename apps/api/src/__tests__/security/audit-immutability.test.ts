import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '@lmms/db';
import { logAudit, verifyAuditChain } from '@lmms/audit';
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

describe('audit immutability (AC-CON-003)', () => {
  it('UPDATE on AuditLog is rejected by trigger', async () => {
    const t = await createTestTenant();
    const entry = await logAudit(t.id, 'test', 'test.action', 'test:entity');
    await expect(
      prisma.auditLog.update({ where: { id: entry.id }, data: { action: 'tampered' } }),
    ).rejects.toThrow(/append-only|audit_log/i);
  });

  it('DELETE on AuditLog is rejected by trigger', async () => {
    const t = await createTestTenant();
    const entry = await logAudit(t.id, 'test', 'test.action', 'test:entity');
    await expect(prisma.auditLog.delete({ where: { id: entry.id } })).rejects.toThrow(
      /append-only|audit_log/i,
    );
  });

  it('hash chain verifies for a clean tenant', async () => {
    const t = await createTestTenant();
    await logAudit(t.id, 'test', 'a', 'e1');
    await logAudit(t.id, 'test', 'b', 'e2');
    await logAudit(t.id, 'test', 'c', 'e3');
    const result = await verifyAuditChain(t.id);
    expect(result.valid).toBe(true);
  });
});
