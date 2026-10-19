import { prisma } from '@lmms/db';
import { logAudit } from '@lmms/audit';
import type { WhatsAppAdapter } from '@lmms/whatsapp';
import { renderTemplate, type MergeContext, lookupRate, createWhatsAppAdapterForTenant } from '@lmms/whatsapp';
import { throttle } from './throttle';
import { checkEligibility } from './consent-guard';

export interface SendCampaignOptions {
  tenantId: string;
  campaignId: string;
  adapter?: WhatsAppAdapter;
  ratePerSecond?: number;
  actorId: string;
}

export interface SendCampaignResult {
  sent: number;
  failed: number;
  totalCost: number;
  durationMs: number;
}

const MAX_PER_TICK = 2000;

export async function sendCampaign(
  opts: SendCampaignOptions,
): Promise<SendCampaignResult> {
  const { tenantId, campaignId, actorId } = opts;
  const adapter = opts.adapter ?? await createWhatsAppAdapterForTenant(tenantId);
  const ratePerSecond = opts.ratePerSecond ?? 20;

  const campaign = await prisma.campaign.findUnique({ where: { id: campaignId } });
  if (!campaign || campaign.tenantId !== tenantId) throw new Error('campaign_not_found');
  if (campaign.status === 'SENT' || campaign.status === 'SENDING') {
    throw new Error('campaign_already_processed');
  }

  const template = await prisma.template.findUnique({
    where: { id: campaign.templateId },
  });
  if (!template) throw new Error('template_not_found');
  if (template.status !== 'APPROVED') throw new Error('template_not_approved');

  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
  if (!tenant) throw new Error('tenant_not_found');

  const memberships = await prisma.segmentMembership.findMany({
    where: { segmentId: campaign.segmentId, tenantId },
  });
  const customerIds = memberships.map((m) => m.customerId);

  const { eligible, excluded, campaignBlocked, blockReason } = await checkEligibility(
    tenantId,
    customerIds,
    'WHATSAPP',
  );

  if (campaignBlocked) {
    throw new Error(`campaign_blocked:${blockReason ?? 'unknown'}`);
  }

  await prisma.campaign.update({
    where: { id: campaignId },
    data: {
      status: 'SENDING',
      totalRecipients: eligible.length,
      sentAt: new Date(),
    },
  });

  const queued = await Promise.all(
    eligible.map((c) =>
      prisma.message.create({
        data: {
          tenantId,
          campaignId,
          customerId: c.id,
          templateId: template.id,
          status: 'QUEUED',
          consentRef: c.consentId,
          costCategory: template.category,
        },
      }),
    ),
  );

  const promo = campaign.promoCodeId
    ? await prisma.promoCode.findUnique({ where: { id: campaign.promoCodeId } })
    : null;

  let sent = 0;
  let failed = 0;
  let totalCost = 0;
  const start = Date.now();

  const index = new Map(eligible.map((c) => [c.id, c]));
  const slice = queued.slice(0, MAX_PER_TICK);

  for await (const msg of throttle(slice, { ratePerSecond })) {
    const customer = index.get(msg.customerId);
    if (!customer) {
      failed += 1;
      continue;
    }

    const ctx: MergeContext = {
      first_name: customer.name?.split(' ')[0] ?? '',
      zone: customer.zone ?? '',
      promo_code: promo?.code ?? '',
      business_name: tenant.nameEn,
    };
    const body = renderTemplate(template.bodyText, ctx);

    try {
      const result = await adapter.sendTemplate({
        to: customer.phone,
        templateName: template.name,
        language: template.language,
        variables: ctx as Record<string, string>,
      });
      const cost = lookupRate(
        tenant.country,
        template.category as 'MARKETING' | 'UTILITY' | 'AUTHENTICATION' | 'SERVICE',
      );

      if (result.ok) {
        await prisma.message.update({
          where: { id: msg.id },
          data: {
            status: 'SENT',
            metaMessageId: result.metaMessageId,
            sentAt: new Date(),
            body,
            cost,
          },
        });
        sent += 1;
        totalCost += cost;
      } else {
        await prisma.message.update({
          where: { id: msg.id },
          data: {
            status: 'FAILED',
            failedAt: new Date(),
            failureReason: result.error,
            retryCount: { increment: 1 },
          },
        });
        failed += 1;
      }
    } catch (e) {
      await prisma.message.update({
        where: { id: msg.id },
        data: {
          status: 'FAILED',
          failedAt: new Date(),
          failureReason: (e as Error).message,
          retryCount: { increment: 1 },
        },
      });
      failed += 1;
    }
  }

  await prisma.campaign.update({
    where: { id: campaignId },
    data: {
      status: 'SENT',
      sentCount: sent,
      failedCount: failed,
      totalCost,
      optOutCount: excluded.filter((e) => e.reason === 'consent_unverified').length,
    },
  });

  await logAudit(
    tenantId,
    actorId,
    'campaign.send',
    `campaign:${campaignId}`,
    eligible[0]?.consentId,
  );

  return { sent, failed, totalCost, durationMs: Date.now() - start };
}
