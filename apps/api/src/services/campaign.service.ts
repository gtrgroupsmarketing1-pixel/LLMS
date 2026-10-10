import { prisma } from '@lmms/db';
import { logAudit } from '@lmms/audit';
import { generatePromoCode, buildUtmUrl } from '@lmms/campaigns';
import { extractFields, ALLOWED_FIELDS, MockWhatsAppAdapter } from '@lmms/whatsapp';

type TemplateCategory = 'MARKETING' | 'UTILITY' | 'AUTHENTICATION' | 'SERVICE';

export async function createTemplateGroup(opts: {
  tenantId: string;
  actorId: string;
  name: string;
  category: TemplateCategory;
  bodyAr: string;
  bodyEn: string;
}) {
  const arFields = extractFields(opts.bodyAr);
  const enFields = extractFields(opts.bodyEn);
  for (const f of [...arFields, ...enFields]) {
    if (!ALLOWED_FIELDS.has(f)) throw new Error(`disallowed_field:${f}`);
  }

  const group = await prisma.templateGroup.create({
    data: { tenantId: opts.tenantId, name: opts.name, category: opts.category },
  });

  const ar = await prisma.template.create({
    data: {
      tenantId: opts.tenantId,
      name: opts.name,
      category: opts.category,
      language: 'ar',
      bodyText: opts.bodyAr,
      variables: arFields as never,
      groupId: group.id,
    },
  });
  const en = await prisma.template.create({
    data: {
      tenantId: opts.tenantId,
      name: opts.name,
      category: opts.category,
      language: 'en',
      bodyText: opts.bodyEn,
      variables: enFields as never,
      groupId: group.id,
    },
  });

  await prisma.templateGroup.update({
    where: { id: group.id },
    data: { arTemplateId: ar.id, enTemplateId: en.id },
  });

  await logAudit(opts.tenantId, opts.actorId, 'template.group.create', `group:${group.id}`);
  return { group, ar, en };
}

export async function submitTemplate(tenantId: string, templateId: string, actorId: string) {
  const t = await prisma.template.findUnique({ where: { id: templateId } });
  if (!t || t.tenantId !== tenantId) throw new Error('template_not_found');
  if (t.status !== 'DRAFT') throw new Error('invalid_state');

  if (t.groupId) {
    const siblings = await prisma.template.findMany({ where: { groupId: t.groupId } });
    if (siblings.length < 2) throw new Error('paired_template_required');
  }

  const adapter = new MockWhatsAppAdapter();
  const result = await adapter.submitTemplate({
    name: `${t.name}_v${t.version}`,
    category: t.category as TemplateCategory,
    language: t.language,
    bodyText: t.bodyText,
    variables: Array.isArray(t.variables) ? (t.variables as string[]) : [],
  });

  await prisma.template.update({
    where: { id: t.id },
    data: {
      status: result.ok ? 'PENDING' : 'REJECTED',
      metaId: result.metaTemplateId,
      rejectionReason: result.error,
      submittedAt: new Date(),
    },
  });

  await logAudit(tenantId, actorId, 'template.submit', `template:${t.id}`);
  return result;
}

export async function syncTemplateStatus(tenantId: string, templateId: string) {
  const t = await prisma.template.findUnique({ where: { id: templateId } });
  if (!t || !t.metaId) return null;
  const adapter = new MockWhatsAppAdapter();
  const remote = await adapter.getTemplateStatus(t.metaId);
  const status: 'APPROVED' | 'REJECTED' | 'PENDING' =
    remote.status === 'APPROVED' ? 'APPROVED'
    : remote.status === 'REJECTED' ? 'REJECTED'
    : 'PENDING';
  return prisma.template.update({
    where: { id: t.id },
    data: {
      status,
      rejectionReason: remote.reason,
      approvedAt: status === 'APPROVED' ? new Date() : null,
    },
  });
}

export async function createCampaign(opts: {
  tenantId: string;
  actorId: string;
  name: string;
  segmentId: string;
  templateId: string;
  scheduledAt?: Date;
}) {
  const tenant = await prisma.tenant.findUnique({ where: { id: opts.tenantId } });
  if (!tenant) throw new Error('tenant_not_found');

  const template = await prisma.template.findUnique({ where: { id: opts.templateId } });
  if (!template) throw new Error('template_not_found');

  const promo = await prisma.promoCode.create({
    data: {
      tenantId: opts.tenantId,
      code: generatePromoCode(tenant.nameEn.slice(0, 4), opts.name),
    },
  });

  const utmUrl = buildUtmUrl({
    baseUrl: `https://${tenant.nameEn.toLowerCase().replace(/\s+/g, '')}.example.com`,
    source: 'whatsapp',
    medium: 'campaign',
    campaign: opts.name.toLowerCase().replace(/\s+/g, '_'),
  });

  const utm = await prisma.utmParameter.create({
    data: {
      tenantId: opts.tenantId,
      campaignId: 'pending',
      source: 'whatsapp',
      medium: 'campaign',
      campaign: opts.name.toLowerCase().replace(/\s+/g, '_'),
      fullUrl: utmUrl,
    },
  });

  const campaign = await prisma.campaign.create({
    data: {
      tenantId: opts.tenantId,
      name: opts.name,
      segmentId: opts.segmentId,
      templateId: opts.templateId,
      templateGroupId: template.groupId,
      status: 'DRAFT',
      scheduledAt: opts.scheduledAt,
      promoCodeId: promo.id,
      utmId: utm.id,
    },
  });

  await prisma.promoCode.update({
    where: { id: promo.id },
    data: { campaignId: campaign.id },
  });
  await prisma.utmParameter.update({
    where: { id: utm.id },
    data: { campaignId: campaign.id },
  });

  await logAudit(opts.tenantId, opts.actorId, 'campaign.create', `campaign:${campaign.id}`);
  return campaign;
}

export async function submitForApproval(tenantId: string, campaignId: string, actorId: string) {
  const c = await prisma.campaign.findUnique({ where: { id: campaignId } });
  if (!c || c.tenantId !== tenantId) throw new Error('campaign_not_found');
  if (c.status !== 'DRAFT') throw new Error('invalid_state');

  const memberships = await prisma.segmentMembership.count({
    where: { segmentId: c.segmentId },
  });
  const requiresClient = memberships > 500;

  await prisma.campaign.update({
    where: { id: campaignId },
    data: { status: 'PENDING_APPROVAL' },
  });

  await logAudit(tenantId, actorId, 'campaign.submit', `campaign:${campaignId}`);
  return { status: 'PENDING_APPROVAL', requiresClientApproval: requiresClient, recipients: memberships };
}

export async function approveCampaign(tenantId: string, campaignId: string, actorId: string) {
  const c = await prisma.campaign.findUnique({ where: { id: campaignId } });
  if (!c || c.tenantId !== tenantId) throw new Error('campaign_not_found');
  if (c.status !== 'PENDING_APPROVAL') throw new Error('invalid_state');
  const updated = await prisma.campaign.update({
    where: { id: campaignId },
    data: { status: 'APPROVED' },
  });
  await logAudit(tenantId, actorId, 'campaign.approve', `campaign:${campaignId}`);
  return updated;
}

export async function listCampaigns(tenantId: string) {
  return prisma.campaign.findMany({
    where: { tenantId },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });
}

export async function getCampaign(tenantId: string, campaignId: string) {
  const c = await prisma.campaign.findUnique({ where: { id: campaignId } });
  if (!c || c.tenantId !== tenantId) return null;
  const promo = c.promoCodeId
    ? await prisma.promoCode.findUnique({ where: { id: c.promoCodeId } })
    : null;
  const utm = c.utmId
    ? await prisma.utmParameter.findUnique({ where: { id: c.utmId } })
    : null;
  const template = await prisma.template.findUnique({ where: { id: c.templateId } });
  return { ...c, promoCode: promo, utm, template };
}

export async function previewCampaign(
  tenantId: string,
  campaignId: string,
  sampleSize = 3,
) {
  const campaign = await prisma.campaign.findUnique({ where: { id: campaignId } });
  if (!campaign) throw new Error('campaign_not_found');
  const template = await prisma.template.findUnique({
    where: { id: campaign.templateId },
  });
  if (!template) throw new Error('template_not_found');

  const members = await prisma.segmentMembership.findMany({
    where: { segmentId: campaign.segmentId, tenantId },
    take: sampleSize,
  });
  const customers = await prisma.endCustomer.findMany({
    where: { id: { in: members.map((m) => m.customerId) } },
  });
  const promo = campaign.promoCodeId
    ? await prisma.promoCode.findUnique({ where: { id: campaign.promoCodeId } })
    : null;
  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });

  const { renderTemplate } = await import('@lmms/whatsapp');
  const samples = customers.map((c) => ({
    customerId: c.id,
    language: c.language,
    rendered: renderTemplate(template.bodyText, {
      first_name: c.name?.split(' ')[0] ?? '',
      zone: c.zone ?? '',
      promo_code: promo?.code ?? '',
      business_name: tenant?.nameEn ?? '',
    }),
  }));

  return {
    template: { name: template.name, language: template.language },
    samples,
  };
}
