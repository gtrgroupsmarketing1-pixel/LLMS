import { prisma } from '@lmms/db';
import { importCustomerCsv } from '@lmms/ingestion';
import { logAudit } from '@lmms/audit';

export async function ingestCsv(opts: {
  tenantId: string;
  actorId: string;
  filename: string;
  content: Buffer;
  hasExplicitConsent: boolean;
}) {
  return importCustomerCsv(opts);
}

export async function addManualCustomer(opts: {
  tenantId: string;
  actorId: string;
  phone: string;
  email?: string;
  name?: string;
  language?: string;
  zone?: string;
  hasConsent: boolean;
}) {
  const existing = await prisma.endCustomer.findFirst({
    where: { tenantId: opts.tenantId, phone: opts.phone },
  });
  if (existing) throw new Error('customer_exists');

  const created = await prisma.endCustomer.create({
    data: {
      tenantId: opts.tenantId,
      phone: opts.phone,
      email: opts.email ?? null,
      name: opts.name ?? null,
      language: opts.language ?? 'ar',
      zone: opts.zone ?? null,
      source: 'MANUAL',
      consentVerified: opts.hasConsent,
      needsReview: !opts.hasConsent,
    },
  });
  await logAudit(
    opts.tenantId,
    opts.actorId,
    'customer.manual.create',
    `customer:${created.id}`,
  );
  return created;
}

export async function captureWhatsAppOptin(opts: {
  tenantId: string;
  phone: string;
  name?: string;
  language?: string;
  evidence: string;
}) {
  const existing = await prisma.endCustomer.findFirst({
    where: { tenantId: opts.tenantId, phone: opts.phone },
  });
  if (existing) {
    return prisma.endCustomer.update({
      where: { id: existing.id },
      data: { consentVerified: true, needsReview: false },
    });
  }
  return prisma.endCustomer.create({
    data: {
      tenantId: opts.tenantId,
      phone: opts.phone,
      name: opts.name ?? null,
      language: opts.language ?? 'ar',
      source: 'WHATSAPP_OPTIN',
      consentVerified: true,
    },
  });
}

export async function listDataSources(tenantId: string) {
  return prisma.dataSource.findMany({ where: { tenantId } });
}

export async function upsertDataSource(opts: {
  tenantId: string;
  type: 'ERP' | 'CSV' | 'MANUAL' | 'WEBSITE_FORM' | 'WHATSAPP_OPTIN';
  config?: unknown;
}) {
  const existing = await prisma.dataSource.findFirst({
    where: { tenantId: opts.tenantId, type: opts.type },
  });
  if (existing) {
    return prisma.dataSource.update({
      where: { id: existing.id },
      data: { config: opts.config as never, status: 'CONNECTED' },
    });
  }
  return prisma.dataSource.create({
    data: {
      tenantId: opts.tenantId,
      type: opts.type,
      status: 'CONNECTED',
      config: (opts.config ?? null) as never,
    },
  });
}

export async function dataFreshness(tenantId: string) {
  const sources = await prisma.dataSource.findMany({ where: { tenantId } });
  const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
  return sources.map((s) => ({
    id: s.id,
    type: s.type,
    status: s.status,
    lastSyncAt: s.lastSyncAt?.toISOString() ?? null,
    fresh: s.lastSyncAt ? s.lastSyncAt > twoHoursAgo : false,
  }));
}
