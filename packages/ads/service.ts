import { prisma } from '@lmms/db';
import { logAudit } from '@lmms/audit';
import { buildUtmUrl, generatePromoCode } from '@lmms/campaigns';
import {
  evaluateBudgetShift,
  enforceDailyCap,
} from './budget';
import {
  MockMetaAdsAdapter,
  MockGoogleAdsAdapter,
  type AdPlatformAdapter,
  type AdSetInput,
  type AdCreativeInput,
} from './adapters';
import { checkCreatives } from './creative-rules';

type AdPlatform = 'META' | 'GOOGLE' | 'TIKTOK' | 'SNAPCHAT' | 'OTHER';

function adapterFor(platform: AdPlatform): AdPlatformAdapter {
  if (platform === 'META') return new MockMetaAdsAdapter();
  return new MockGoogleAdsAdapter();
}

export async function connectAdAccount(opts: {
  tenantId: string;
  actorId: string;
  platform: AdPlatform;
  externalId: string;
  accountName?: string;
  currency: string;
  timezone: string;
}) {
  const account = await prisma.adAccount.upsert({
    where: {
      tenantId_platform_externalId: {
        tenantId: opts.tenantId,
        platform: opts.platform,
        externalId: opts.externalId,
      },
    },
    update: {
      accountName: opts.accountName ?? null,
      currency: opts.currency,
      timezone: opts.timezone,
      status: 'CONNECTED',
    },
    create: {
      tenantId: opts.tenantId,
      platform: opts.platform,
      externalId: opts.externalId,
      accountName: opts.accountName ?? null,
      currency: opts.currency,
      timezone: opts.timezone,
    },
  });
  await logAudit(opts.tenantId, opts.actorId, 'ad_account.connect', `ad_account:${account.id}`);
  return account;
}

export async function listAdAccounts(tenantId: string) {
  return prisma.adAccount.findMany({
    where: { tenantId },
    orderBy: { createdAt: 'desc' },
  });
}

export interface CreateAdCampaignInput {
  tenantId: string;
  actorId: string;
  adAccountId: string;
  name: string;
  objective: string;
  dailyBudgetCap: number;
  totalBudget?: number;
  geoPreset: string;
  startDate: Date;
  endDate?: Date;
  adSets: AdSetInput[];
  creatives: AdCreativeInput[];
  baseUrl: string;
}

export async function createAdCampaign(input: CreateAdCampaignInput) {
  const account = await prisma.adAccount.findUnique({
    where: { id: input.adAccountId },
  });
  if (!account || account.tenantId !== input.tenantId) {
    throw new Error('ad_account_not_found');
  }

  const creativeCheck = checkCreatives(
    input.creatives.map((c, i) => ({
      id: `new-${i}`,
      width: c.width,
      height: c.height,
      mimeType: c.mimeType,
      copyAr: c.copyAr,
      copyEn: c.copyEn,
    })),
  );
  if (!creativeCheck.valid) {
    throw new Error(`creative_check_failed:${creativeCheck.issues.map((i) => i.issue).join(',')}`);
  }

  const campaignSlug = input.name.toLowerCase().replace(/\s+/g, '_');

  const promo = await prisma.promoCode.create({
    data: {
      tenantId: input.tenantId,
      code: generatePromoCode(input.tenantId.slice(0, 4), input.name),
    },
  });

  const utmUrl = buildUtmUrl({
    baseUrl: input.baseUrl,
    source: account.platform.toLowerCase(),
    medium: 'ads',
    campaign: campaignSlug,
  });

  const utm = await prisma.utmParameter.create({
    data: {
      tenantId: input.tenantId,
      campaignId: 'pending',
      source: account.platform.toLowerCase(),
      medium: 'ads',
      campaign: campaignSlug,
      fullUrl: utmUrl,
    },
  });

  const campaign = await prisma.adCampaign.create({
    data: {
      tenantId: input.tenantId,
      adAccountId: account.id,
      name: input.name,
      status: 'DRAFT',
      objective: input.objective,
      dailyBudgetCap: input.dailyBudgetCap,
      totalBudget: input.totalBudget ?? null,
      geoPreset: input.geoPreset,
      startDate: input.startDate,
      endDate: input.endDate ?? null,
      promoCodeId: promo.id,
      utmId: utm.id,
      createdBy: input.actorId,
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

  for (const s of input.adSets) {
    await prisma.adSet.create({
      data: {
        tenantId: input.tenantId,
        adCampaignId: campaign.id,
        name: s.name,
        targeting: s.targeting as never,
        dailyBudget: s.dailyBudget,
      },
    });
  }

  for (const c of input.creatives) {
    await prisma.adCreative.create({
      data: {
        tenantId: input.tenantId,
        adCampaignId: campaign.id,
        name: c.name,
        fileUrl: c.fileUrl,
        mimeType: c.mimeType ?? null,
        width: c.width ?? null,
        height: c.height ?? null,
        copyAr: c.copyAr ?? null,
        copyEn: c.copyEn ?? null,
        status: 'DRAFT',
      },
    });
  }

  await logAudit(input.tenantId, input.actorId, 'ad_campaign.create', `ad_campaign:${campaign.id}`);
  return campaign;
}

export async function listAdCampaigns(tenantId: string) {
  return prisma.adCampaign.findMany({
    where: { tenantId },
    include: {
      adAccount: true,
      adSets: true,
      creatives: true,
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getAdCampaign(tenantId: string, campaignId: string) {
  const campaign = await prisma.adCampaign.findUnique({
    where: { id: campaignId },
    include: {
      adAccount: true,
      adSets: true,
      creatives: true,
    },
  });
  if (!campaign || campaign.tenantId !== tenantId) return null;
  return campaign;
}

export async function submitAdCampaign(
  tenantId: string,
  campaignId: string,
  actorId: string,
) {
  const updated = await prisma.adCampaign.update({
    where: { id: campaignId },
    data: { status: 'PENDING_APPROVAL' },
  });
  await logAudit(tenantId, actorId, 'ad_campaign.submit', `ad_campaign:${campaignId}`);
  return updated;
}

export async function approveAdCampaign(
  tenantId: string,
  campaignId: string,
  actorId: string,
) {
  const campaign = await prisma.adCampaign.findUnique({
    where: { id: campaignId },
    include: { adAccount: true, adSets: true, creatives: true },
  });
  if (!campaign || campaign.tenantId !== tenantId) throw new Error('ad_campaign_not_found');

  const adapter = adapterFor(campaign.adAccount.platform as AdPlatform);
  const result = await adapter.createCampaign(
    {
      name: campaign.name,
      objective: campaign.objective ?? 'TRAFFIC',
      dailyBudget: Number(campaign.dailyBudgetCap ?? 0),
      currency: campaign.adAccount.currency,
      startDate: (campaign.startDate ?? new Date()).toISOString(),
      endDate: campaign.endDate?.toISOString(),
      geoPreset: campaign.geoPreset ?? '',
    },
    campaign.adSets.map((s) => ({
      name: s.name,
      targeting: (s.targeting ?? {}) as Record<string, unknown>,
      dailyBudget: Number(s.dailyBudget ?? 0),
    })),
    campaign.creatives.map((c) => ({
      name: c.name,
      fileUrl: c.fileUrl,
      mimeType: c.mimeType ?? undefined,
      width: c.width ?? undefined,
      height: c.height ?? undefined,
      copyAr: c.copyAr ?? undefined,
      copyEn: c.copyEn ?? undefined,
    })),
  );

  if (!result.ok) {
    throw new Error(`adapter_create_failed:${result.error ?? 'unknown'}`);
  }

  const updated = await prisma.adCampaign.update({
    where: { id: campaignId },
    data: {
      status: 'ACTIVE',
      externalId: result.externalId ?? null,
    },
  });

  for (const c of campaign.creatives) {
    await prisma.adCreative.update({
      where: { id: c.id },
      data: { status: 'ACTIVE' },
    });
  }

  await logAudit(tenantId, actorId, 'ad_campaign.approve', `ad_campaign:${campaignId}`);
  return updated;
}

export async function pauseAdCampaign(
  tenantId: string,
  campaignId: string,
  actorId: string,
) {
  const campaign = await prisma.adCampaign.findUnique({
    where: { id: campaignId },
    include: { adAccount: true },
  });
  if (!campaign || campaign.tenantId !== tenantId) throw new Error('ad_campaign_not_found');
  if (campaign.externalId) {
    const adapter = adapterFor(campaign.adAccount.platform as AdPlatform);
    await adapter.pauseCampaign(campaign.externalId);
  }
  const updated = await prisma.adCampaign.update({
    where: { id: campaignId },
    data: { status: 'PAUSED' },
  });
  await logAudit(tenantId, actorId, 'ad_campaign.pause', `ad_campaign:${campaignId}`);
  return updated;
}

export async function resumeAdCampaign(
  tenantId: string,
  campaignId: string,
  actorId: string,
) {
  const campaign = await prisma.adCampaign.findUnique({
    where: { id: campaignId },
    include: { adAccount: true },
  });
  if (!campaign || campaign.tenantId !== tenantId) throw new Error('ad_campaign_not_found');
  if (campaign.externalId) {
    const adapter = adapterFor(campaign.adAccount.platform as AdPlatform);
    await adapter.resumeCampaign(campaign.externalId);
  }
  const updated = await prisma.adCampaign.update({
    where: { id: campaignId },
    data: { status: 'ACTIVE' },
  });
  await logAudit(tenantId, actorId, 'ad_campaign.resume', `ad_campaign:${campaignId}`);
  return updated;
}

export interface BudgetShiftInput {
  tenantId: string;
  actorId: string;
  campaignId: string;
  newDailyBudget: number;
}

export async function changeDailyBudget(input: BudgetShiftInput) {
  const campaign = await prisma.adCampaign.findUnique({
    where: { id: input.campaignId },
    include: { adAccount: true },
  });
  if (!campaign || campaign.tenantId !== input.tenantId) {
    throw new Error('ad_campaign_not_found');
  }

  const current = Number(campaign.dailyBudgetCap ?? 0);
  const check = evaluateBudgetShift(current, input.newDailyBudget);

  if (check.requiresApproval) {
    return {
      requiresApproval: true,
      percentChange: check.percentChange,
      applied: false,
    };
  }

  const capCheck = enforceDailyCap(input.newDailyBudget, input.newDailyBudget);
  if (!capCheck.allowed) {
    throw new Error(`cap_check_failed:${capCheck.reason}`);
  }

  if (campaign.externalId) {
    const adapter = adapterFor(campaign.adAccount.platform as AdPlatform);
    await adapter.updateDailyBudget(campaign.externalId, input.newDailyBudget);
  }

  const updated = await prisma.adCampaign.update({
    where: { id: input.campaignId },
    data: { dailyBudgetCap: input.newDailyBudget },
  });

  await logAudit(input.tenantId, input.actorId, 'ad_campaign.budget_shift', `ad_campaign:${input.campaignId}`);
  return {
    requiresApproval: false,
    percentChange: check.percentChange,
    applied: true,
    campaign: updated,
  };
}

export async function listSpendSnapshots(
  tenantId: string,
  campaignId?: string,
) {
  return prisma.adSpendSnapshot.findMany({
    where: {
      tenantId,
      ...(campaignId ? { adCampaignId: campaignId } : {}),
    },
    orderBy: { date: 'desc' },
    take: 500,
  });
}

export async function recordSpendSnapshot(opts: {
  tenantId: string;
  adCampaignId: string;
  date: Date;
  spend: number;
  impressions: number;
  clicks: number;
  conversions: number;
  currency: string;
}) {
  return prisma.adSpendSnapshot.upsert({
    where: {
      tenantId_adCampaignId_date: {
        tenantId: opts.tenantId,
        adCampaignId: opts.adCampaignId,
        date: opts.date,
      },
    },
    update: {
      spend: opts.spend,
      impressions: opts.impressions,
      clicks: opts.clicks,
      conversions: opts.conversions,
      currency: opts.currency,
    },
    create: {
      tenantId: opts.tenantId,
      adCampaignId: opts.adCampaignId,
      date: opts.date,
      spend: opts.spend,
      impressions: opts.impressions,
      clicks: opts.clicks,
      conversions: opts.conversions,
      currency: opts.currency,
    },
  });
}

export async function syncSpendForTenant(tenantId: string) {
  const campaigns = await prisma.adCampaign.findMany({
    where: { tenantId, status: 'ACTIVE', externalId: { not: null } },
    include: { adAccount: true },
  });
  let snapshotsWritten = 0;
  const since = new Date(Date.now() - 7 * 86_400_000);
  const until = new Date();
  for (const c of campaigns) {
    const adapter = adapterFor(c.adAccount.platform as AdPlatform);
    const rows = await adapter.fetchSpend(c.externalId as string, since, until);
    for (const r of rows) {
      await recordSpendSnapshot({
        tenantId,
        adCampaignId: c.id,
        date: new Date(r.date),
        spend: r.spend,
        impressions: r.impressions,
        clicks: r.clicks,
        conversions: r.conversions,
        currency: r.currency,
      });
      snapshotsWritten += 1;
    }
  }
  return { snapshotsWritten };
}
