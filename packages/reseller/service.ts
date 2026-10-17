import { prisma } from '@lmms/db';
import { logAudit } from '@lmms/audit';
import { generateApiKey, hashApiKey } from './api-key';

export interface CreateResellerInput {
  name: string;
  domain: string;
  commissionPct?: number;
  actorId: string;
}

export async function createReseller(input: CreateResellerInput) {
  const existing = await prisma.reseller.findUnique({
    where: { domain: input.domain.toLowerCase() },
  });
  if (existing) throw new Error('domain_already_registered');

  const rawKey = generateApiKey();
  const hashedKey = hashApiKey(rawKey);

  const reseller = await prisma.reseller.create({
    data: {
      name: input.name,
      domain: input.domain.toLowerCase(),
      commissionPct: input.commissionPct ?? 20,
      apiKey: hashedKey,
      createdBy: input.actorId,
    },
  });

  await logAudit('agency', input.actorId, 'reseller.create', `reseller:${reseller.id}`);

  return { reseller, rawApiKey: rawKey };
}

export async function listResellers() {
  return prisma.reseller.findMany({
    orderBy: { createdAt: 'desc' },
  });
}

export async function updateResellerStatus(
  resellerId: string,
  status: 'PENDING' | 'ACTIVE' | 'SUSPENDED',
  actorId: string,
) {
  const reseller = await prisma.reseller.update({
    where: { id: resellerId },
    data: { status },
  });
  await logAudit('agency', actorId, 'reseller.status', `reseller:${reseller.id}:${status}`);
  return reseller;
}

export async function resolveByDomain(hostname: string) {
  return prisma.reseller.findUnique({
    where: { domain: hostname.toLowerCase() },
    include: { whiteLabel: true },
  });
}

export async function resolveByApiKey(rawKey: string) {
  const hashed = hashApiKey(rawKey);
  return prisma.reseller.findUnique({ where: { apiKey: hashed } });
}

export interface UpsertWhiteLabelInput {
  resellerId: string;
  actorId: string;
  logoUrl?: string | null;
  faviconUrl?: string | null;
  primaryColor?: string;
  supportEmail?: string | null;
  customEmailFrom?: string | null;
  emailFooter?: string | null;
}

export async function upsertWhiteLabel(input: UpsertWhiteLabelInput) {
  const existing = await prisma.whiteLabelConfig.findUnique({
    where: { resellerId: input.resellerId },
  });

  const data = {
    ...(input.logoUrl !== undefined ? { logoUrl: input.logoUrl } : {}),
    ...(input.faviconUrl !== undefined ? { faviconUrl: input.faviconUrl } : {}),
    ...(input.primaryColor ? { primaryColor: input.primaryColor } : {}),
    ...(input.supportEmail !== undefined ? { supportEmail: input.supportEmail } : {}),
    ...(input.customEmailFrom !== undefined
      ? { customEmailFrom: input.customEmailFrom }
      : {}),
    ...(input.emailFooter !== undefined ? { emailFooter: input.emailFooter } : {}),
  };

  const config = existing
    ? await prisma.whiteLabelConfig.update({ where: { id: existing.id }, data })
    : await prisma.whiteLabelConfig.create({
        data: { resellerId: input.resellerId, ...data },
      });

  await logAudit('agency', input.actorId, 'reseller.whitelabel', `reseller:${input.resellerId}`);
  return config;
}

export interface TenantBranding {
  resellerId: string | null;
  resellerName: string | null;
  logoUrl: string | null;
  faviconUrl: string | null;
  primaryColor: string;
  supportEmail: string | null;
  emailFooter: string | null;
}

/**
 * Resolves the white-label branding for a given tenant.
 * Tenants without a reseller get the default LMMS branding.
 */
export async function resolveTenantBranding(tenantId: string): Promise<TenantBranding> {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    include: {
      reseller: { include: { whiteLabel: true } },
    } as never,
  });

  if (!tenant) throw new Error('tenant_not_found');
  const reseller = (tenant as unknown as { reseller?: { id: string; name: string; whiteLabel?: TenantBranding | null } }).reseller;

  if (!reseller) {
    return {
      resellerId: null,
      resellerName: null,
      logoUrl: null,
      faviconUrl: null,
      primaryColor: '#0f172a',
      supportEmail: null,
      emailFooter: null,
    };
  }

  const wl = reseller.whiteLabel;
  return {
    resellerId: reseller.id,
    resellerName: reseller.name,
    logoUrl: wl?.logoUrl ?? null,
    faviconUrl: wl?.faviconUrl ?? null,
    primaryColor: wl?.primaryColor ?? '#0f172a',
    supportEmail: wl?.supportEmail ?? null,
    emailFooter: wl?.emailFooter ?? null,
  };
}

export interface CommissionResult {
  grossAmount: number;
  commissionPct: number;
  commissionAmount: number;
  netAmount: number;
  currency: string;
}

/**
 * Computes the reseller commission for a given invoice total.
 * If the tenant has no reseller, commission is 0.
 */
export async function computeCommission(
  tenantId: string,
  invoiceTotal: number,
  currency: string,
): Promise<CommissionResult> {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    include: { reseller: true } as never,
  });
  if (!tenant) throw new Error('tenant_not_found');
  const reseller = (tenant as unknown as { reseller?: { commissionPct: unknown } }).reseller;

  if (!reseller) {
    return {
      grossAmount: invoiceTotal,
      commissionPct: 0,
      commissionAmount: 0,
      netAmount: invoiceTotal,
      currency,
    };
  }

  const pct = Number(reseller.commissionPct);
  const amount = Math.round(invoiceTotal * (pct / 100) * 100) / 100;
  return {
    grossAmount: invoiceTotal,
    commissionPct: pct,
    commissionAmount: amount,
    netAmount: Math.round((invoiceTotal - amount) * 100) / 100,
    currency,
  };
}

export async function attachTenantToReseller(
  tenantId: string,
  resellerId: string,
  actorId: string,
) {
  const tenant = await prisma.tenant.update({
    where: { id: tenantId },
    data: { resellerId },
  });
  await logAudit(tenantId, actorId, 'reseller.attach_tenant', `reseller:${resellerId}`);
  return tenant;
}
