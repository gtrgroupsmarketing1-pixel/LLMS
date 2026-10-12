import { prisma } from '@lmms/db';

export function assertTestDb(): void {
  const url = process.env.DATABASE_URL ?? '';
  if (!url || (!url.includes('_test') && !url.includes('/test'))) {
    throw new Error(
      'Refusing to run tests: DATABASE_URL must point to a test DB (name must contain "test")',
    );
  }
}

export async function wipeTestData(): Promise<void> {
  await prisma.reportDelivery.deleteMany({});
  await prisma.reportRecord.deleteMany({});
  await prisma.migrationMatch.deleteMany({});
  await prisma.migrationEvent.deleteMany({});
  await prisma.migrationJob.deleteMany({});
  await prisma.contentApprovalLink.deleteMany({});
  await prisma.contentCardComment.deleteMany({});
  await prisma.contentCardVersion.deleteMany({});
  await prisma.contentCard.deleteMany({});
  await prisma.gccTemplate.deleteMany({});
  await prisma.automationRun.deleteMany({});
  await prisma.frequencyLedger.deleteMany({});
  await prisma.automationKillSwitch.deleteMany({});
  await prisma.automation.deleteMany({});
  await prisma.message.deleteMany({});
  await prisma.campaign.deleteMany({});
  await prisma.promoCode.deleteMany({});
  await prisma.utmParameter.deleteMany({});
  await prisma.template.deleteMany({});
  await prisma.templateGroup.deleteMany({});
  await prisma.segmentMembership.deleteMany({});
  await prisma.segmentSizeSnapshot.deleteMany({});
  await prisma.segment.deleteMany({});
  await prisma.order.deleteMany({});
  await prisma.consentRecord.deleteMany({});
  await prisma.consentOptOutEvent.deleteMany({});
  await prisma.doNotContact.deleteMany({});
  await prisma.erasureRequest.deleteMany({});
  await prisma.endCustomer.deleteMany({});
  await prisma.cSVImport.deleteMany({});
  await prisma.dataSource.deleteMany({});
  await prisma.portalPreference.deleteMany({});
  await prisma.portalTicket.deleteMany({});
  await prisma.portalInternalComment.deleteMany({});
  await prisma.clientMessageInbox.deleteMany({});
  await prisma.tenantHealthScore.deleteMany({});
  await prisma.upgradeReadiness.deleteMany({});
  await prisma.location.deleteMany({});
  await prisma.refreshToken.deleteMany({});
  await prisma.session.deleteMany({});
  await prisma.otpCode.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.tenant.deleteMany({});
}

export async function createTestTenant(
  mode: 'STANDALONE' | 'ERP_CONNECTED' | 'UPGRADING' = 'STANDALONE',
) {
  return prisma.tenant.create({
    data: {
      nameAr: 'عميل تجريبي',
      nameEn: `Test-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
      mode,
      country: 'AE',
      currency: 'AED',
      timezone: 'Asia/Dubai',
      package: 'LAUNCH',
      status: 'ACTIVE',
    },
  });
}

export async function createTestAgencyOwner() {
  const { hashPassword } = await import('@lmms/auth');
  const passwordHash = await hashPassword('TestPass123!');
  const email = `owner-${Date.now()}-${Math.floor(Math.random() * 10000)}@test.local`;
  const user = await prisma.user.create({
    data: { kind: 'AGENCY', email, passwordHash, agencyRole: 'OWNER' },
  });
  return { user, email, password: 'TestPass123!' };
}

export async function createTestClient(tenantId: string) {
  const phone = `+97150${Math.floor(1_000_000 + Math.random() * 8_999_999)}`;
  const user = await prisma.user.create({
    data: { kind: 'CLIENT', phone, tenantId, clientRole: 'OWNER' },
  });
  return { user, phone };
}

export async function ensureAppendOnlyTrigger(): Promise<void> {
  await prisma.$executeRawUnsafe(`
    CREATE OR REPLACE FUNCTION deny_auditlog_mutation() RETURNS trigger AS $func$
    BEGIN
      RAISE EXCEPTION 'audit_log is append-only';
    END;
    $func$ LANGUAGE plpgsql;
  `);
  const existing = await prisma.$queryRawUnsafe<Array<{ tgname: string }>>(
    `SELECT tgname FROM pg_trigger WHERE tgname IN ('auditlog_no_update','auditlog_no_delete')`,
  );
  const names = new Set(existing.map((t) => t.tgname));
  if (!names.has('auditlog_no_update')) {
    await prisma.$executeRawUnsafe(
      `CREATE TRIGGER auditlog_no_update BEFORE UPDATE ON "AuditLog" FOR EACH ROW EXECUTE FUNCTION deny_auditlog_mutation();`,
    );
  }
  if (!names.has('auditlog_no_delete')) {
    await prisma.$executeRawUnsafe(
      `CREATE TRIGGER auditlog_no_delete BEFORE DELETE ON "AuditLog" FOR EACH ROW EXECUTE FUNCTION deny_auditlog_mutation();`,
    );
  }
}
