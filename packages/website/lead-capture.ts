import { prisma } from '@lmms/db';
import { normalizePhone } from '@lmms/ingestion';
import { logAudit } from '@lmms/audit';

export interface LeadInput {
  tenantId: string;
  websiteId: string;
  pageId?: string;
  name?: string;
  phone?: string;
  email?: string;
  zone?: string;
  message?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  promoCode?: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface LeadResult {
  id: string;
  consentStatus: string;
}

/**
 * Website form submissions become WebsiteLead rows.
 *
 * Consent: leads start as PENDING because the visitor has not explicitly
 * opted in for marketing. The consent engine (V1.6) will treat pending
 * leads as ineligible until they confirm via a follow-up message.
 */
export async function captureLead(input: LeadInput): Promise<LeadResult> {
  const phone = input.phone ? normalizePhone(input.phone) : null;
  if (!phone && !input.email) {
    throw new Error('lead_requires_phone_or_email');
  }

  const lead = await prisma.websiteLead.create({
    data: {
      tenantId: input.tenantId,
      websiteId: input.websiteId,
      pageId: input.pageId ?? null,
      name: input.name ?? null,
      phone,
      email: input.email?.toLowerCase() ?? null,
      zone: input.zone ?? null,
      message: input.message ?? null,
      utmSource: input.utmSource ?? null,
      utmMedium: input.utmMedium ?? null,
      utmCampaign: input.utmCampaign ?? null,
      promoCode: input.promoCode ?? null,
      consentStatus: 'PENDING',
      ipAddress: input.ipAddress ?? null,
      userAgent: input.userAgent ?? null,
    },
  });

  await logAudit(input.tenantId, 'website_lead', 'website_lead.create', `lead:${lead.id}`);
  return { id: lead.id, consentStatus: lead.consentStatus };
}

export async function listLeads(tenantId: string, consentStatus?: string) {
  return prisma.websiteLead.findMany({
    where: {
      tenantId,
      ...(consentStatus ? { consentStatus: consentStatus as never } : {}),
    },
    orderBy: { createdAt: 'desc' },
    take: 500,
  });
}

export async function markLeadConsent(
  tenantId: string,
  leadId: string,
  status: 'OPT_IN' | 'OPT_OUT',
): Promise<void> {
  const lead = await prisma.websiteLead.findUnique({ where: { id: leadId } });
  if (!lead || lead.tenantId !== tenantId) throw new Error('lead_not_found');

  await prisma.websiteLead.update({
    where: { id: leadId },
    data: { consentStatus: status },
  });

  // If OPT_IN, also create a consent record so marketing eligibility is
  // respected by the V1.6 consent engine.
  if (status === 'OPT_IN' && lead.phone) {
    const existing = await prisma.endCustomer.findFirst({
      where: { tenantId, phone: lead.phone },
    });
    const customer =
      existing ??
      (await prisma.endCustomer.create({
        data: {
          tenantId,
          phone: lead.phone,
          email: lead.email,
          name: lead.name,
          language: 'ar',
          source: 'WEBSITE_FORM',
          consentVerified: true,
        },
      }));
    await prisma.consentRecord.create({
      data: {
        tenantId,
        customerId: customer.id,
        channel: 'WHATSAPP',
        purpose: 'MARKETING',
        status: 'OPT_IN',
        source: 'website_lead_opt_in',
        evidence: `lead:${leadId}`,
      },
    });
  }

  await logAudit(tenantId, 'website_lead', 'website_lead.consent', `lead:${leadId}:${status}`);
}
