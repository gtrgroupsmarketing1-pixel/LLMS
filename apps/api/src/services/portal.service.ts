import { prisma } from '@lmms/db';
import { logAudit } from '@lmms/audit';
import { paginate } from '@lmms/scale';

export async function getPortalDashboard(tenantId: string) {
  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
  if (!tenant) throw new Error('tenant_not_found');

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    campaignsSentThisMonth,
    messagesSentThisMonth,
    pendingApprovals,
    unreadMessages,
    latestDataSource,
  ] = await Promise.all([
    prisma.campaign.count({
      where: { tenantId, status: 'SENT', sentAt: { gte: monthStart } },
    }),
    prisma.message.count({
      where: {
        tenantId,
        sentAt: { gte: monthStart },
        status: { in: ['SENT', 'DELIVERED', 'READ'] },
      },
    }),
    prisma.campaign.count({
      where: { tenantId, status: 'PENDING_APPROVAL' },
    }),
    prisma.clientMessageInbox.count({
      where: { tenantId, direction: 'INBOUND', status: 'RECEIVED' },
    }),
    prisma.dataSource.findFirst({
      where: { tenantId },
      orderBy: { lastSyncAt: 'desc' },
    }),
  ]);

  const freshness = latestDataSource?.lastSyncAt
    ? {
        lastSyncAt: latestDataSource.lastSyncAt,
        fresh:
          latestDataSource.lastSyncAt >
          new Date(Date.now() - 2 * 60 * 60 * 1000),
      }
    : { lastSyncAt: null, fresh: false };

  return {
    tenant: {
      id: tenant.id,
      nameEn: tenant.nameEn,
      nameAr: tenant.nameAr,
      mode: tenant.mode,
    },
    metrics: {
      campaignsSentThisMonth,
      messagesSentThisMonth,
      pendingApprovals,
      negativeReviewsPending: 0,
      unreadMessages,
    },
    freshness,
  };
}

export async function listApprovals(tenantId: string) {
  return prisma.campaign.findMany({
    where: { tenantId, status: 'PENDING_APPROVAL' },
    orderBy: { createdAt: 'desc' },
  });
}

export async function approveCampaign(
  tenantId: string,
  campaignId: string,
  actorId: string,
) {
  const c = await prisma.campaign.findUnique({ where: { id: campaignId } });
  if (!c || c.tenantId !== tenantId) throw new Error('campaign_not_found');
  const updated = await prisma.campaign.update({
    where: { id: campaignId },
    data: { status: 'APPROVED' },
  });
  await logAudit(tenantId, actorId, 'portal.campaign.approve', `campaign:${campaignId}`);
  return updated;
}

export async function rejectCampaign(
  tenantId: string,
  campaignId: string,
  actorId: string,
  reason: string,
) {
  const c = await prisma.campaign.findUnique({ where: { id: campaignId } });
  if (!c || c.tenantId !== tenantId) throw new Error('campaign_not_found');
  const updated = await prisma.campaign.update({
    where: { id: campaignId },
    data: { status: 'DRAFT' },
  });
  await prisma.portalInternalComment.create({
    data: {
      tenantId,
      authorId: actorId,
      authorKind: 'CLIENT',
      entityType: 'campaign',
      entityId: campaignId,
      body: `Rejected: ${reason}`,
    },
  });
  await logAudit(tenantId, actorId, 'portal.campaign.reject', `campaign:${campaignId}`);
  return updated;
}

export async function listCampaigns(tenantId: string) {
  return prisma.campaign.findMany({
    where: { tenantId },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });
}

export async function listReviews(_tenantId: string) {
  return [] as Array<{
    id: string;
    platform: string;
    rating: number;
    text: string;
    responded: boolean;
    createdAt: string;
  }>;
}

export async function listMessages(tenantId: string, cursor?: string, limit = 50) {
  return paginate(
    prisma.clientMessageInbox,
    {
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    },
    { cursor: cursor || null, limit },
  );
}

export async function replyMessage(
  tenantId: string,
  messageId: string,
  actorId: string,
  body: string,
) {
  const msg = await prisma.clientMessageInbox.findUnique({
    where: { id: messageId },
  });
  if (!msg || msg.tenantId !== tenantId) throw new Error('message_not_found');

  const updated = await prisma.clientMessageInbox.update({
    where: { id: messageId },
    data: { status: 'REPLIED', repliedById: actorId, repliedAt: new Date() },
  });

  await prisma.clientMessageInbox.create({
    data: {
      tenantId,
      customerId: msg.customerId,
      channel: msg.channel,
      direction: 'OUTBOUND',
      body,
      toPhone: msg.fromPhone,
      status: 'SENT',
    },
  });

  await logAudit(tenantId, actorId, 'portal.message.reply', `message:${messageId}`);
  return updated;
}

export async function flagToAgency(
  tenantId: string,
  actorId: string,
  entityType: string,
  entityId: string,
  body: string,
) {
  const comment = await prisma.portalInternalComment.create({
    data: {
      tenantId,
      authorId: actorId,
      authorKind: 'CLIENT',
      entityType,
      entityId,
      body,
    },
  });
  await logAudit(tenantId, actorId, 'portal.flag', `${entityType}:${entityId}`);
  return comment;
}

export async function listReports(_tenantId: string) {
  return { items: [] as Array<{ id: string; generatedAt: string; url: string }> };
}

export async function listInvoices(_tenantId: string) {
  return [] as Array<{
    id: string;
    amount: string;
    currency: string;
    status: string;
    dueDate: string;
  }>;
}

export async function listTickets(tenantId: string) {
  return prisma.portalTicket.findMany({
    where: { tenantId },
    orderBy: { createdAt: 'desc' },
  });
}

export async function createTicket(
  tenantId: string,
  actorId: string,
  subject: string,
  body: string,
  kind: 'SUPPORT' | 'BUG' | 'BILLING' | 'ESCALATION' = 'SUPPORT',
) {
  const ticket = await prisma.portalTicket.create({
    data: { tenantId, createdBy: actorId, subject, body, kind },
  });
  await logAudit(tenantId, actorId, 'portal.ticket.create', `ticket:${ticket.id}`);
  return ticket;
}

export async function getSupportConfig(tenantId: string) {
  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
  const agencyNumber = process.env.AGENCY_WHATSAPP_NUMBER ?? '+971500000000';
  return {
    whatsappDeepLink: `https://wa.me/${agencyNumber.replace(/\D/g, '')}?text=${encodeURIComponent(
      `Support request for ${tenant?.nameEn ?? 'tenant'}`,
    )}`,
    agencyNumber,
  };
}

export async function getPreferences(userId: string) {
  const pref = await prisma.portalPreference.findUnique({ where: { userId } });
  return (
    pref ?? {
      language: 'ar',
      upgradePromptDismissedUntil: null as Date | null,
    }
  );
}

export async function setPreferences(userId: string, language: 'ar' | 'en') {
  return prisma.portalPreference.upsert({
    where: { userId },
    update: { language },
    create: { userId, language },
  });
}

export async function dismissUpgradePrompt(userId: string, days = 7) {
  const until = new Date(Date.now() + days * 86_400_000);
  return prisma.portalPreference.upsert({
    where: { userId },
    update: { upgradePromptDismissedUntil: until },
    create: { userId, language: 'ar', upgradePromptDismissedUntil: until },
  });
}

export async function getUpgradePromptStatus(tenantId: string, userId: string) {
  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
  if (!tenant || tenant.mode !== 'STANDALONE') return { show: false };
  const pref = await prisma.portalPreference.findUnique({ where: { userId } });
  const dismissed =
    pref?.upgradePromptDismissedUntil &&
    pref.upgradePromptDismissedUntil > new Date();
  return {
    show: !dismissed,
    dismissedUntil: pref?.upgradePromptDismissedUntil ?? null,
    reason: 'Unlock order-level attribution and ERP automations.',
  };
}
