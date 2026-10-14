import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '@lmms/db';
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

describe('Journey E — Content Calendar full approval cycle', () => {
  it('moves a card from DRAFT to APPROVED via one-tap token', async () => {
    const t = await createTestTenant();

    const cc = await import('@lmms/content-calendar');

    const card = await cc.createCard({
      tenantId: t.id,
      actorId: 'test',
      title: 'Ramadan promo',
      copyAr: 'عرض رمضان',
      copyEn: 'Ramadan offer',
      channel: 'WHATSAPP',
    });
    expect(card.status).toBe('DRAFT');

    await cc.transitionCard({
      tenantId: t.id,
      actorId: 'test',
      cardId: card.id,
      to: 'INTERNAL_REVIEW',
    });

    const sent = await cc.sendForClientReview({
      tenantId: t.id,
      actorId: 'test',
      cardId: card.id,
      baseApprovalUrl: 'http://localhost:3000',
    });
    expect(sent.approvalUrl).toContain('/approve/');

    const rawToken = sent.approvalUrl.split('/').pop() as string;
    const lookup = await cc.getApprovalByToken(rawToken);
    expect(lookup).not.toBeNull();
    expect(lookup?.expired).toBe(false);
    expect(lookup?.used).toBe(false);

    const updated = await cc.consumeApprovalToken({
      rawToken,
      decision: 'APPROVE',
    });
    expect(updated.status).toBe('APPROVED');

    const after = await cc.getApprovalByToken(rawToken);
    expect(after?.used).toBe(true);
    expect(after?.decision).toBe('APPROVE');
  });

  it('rejects and captures reason', async () => {
    const t = await createTestTenant();
    const cc = await import('@lmms/content-calendar');

    const card = await cc.createCard({
      tenantId: t.id,
      actorId: 'test',
      title: 'Reject me',
      copyAr: 'x',
      channel: 'WHATSAPP',
    });
    await cc.transitionCard({ tenantId: t.id, actorId: 'test', cardId: card.id, to: 'INTERNAL_REVIEW' });
    const sent = await cc.sendForClientReview({
      tenantId: t.id,
      actorId: 'test',
      cardId: card.id,
      baseApprovalUrl: 'http://x',
    });
    const rawToken = sent.approvalUrl.split('/').pop() as string;

    const updated = await cc.consumeApprovalToken({
      rawToken,
      decision: 'REJECT',
      reason: 'off-brand tone',
    });
    expect(updated.status).toBe('REJECTED');
    expect(updated.rejectionReason).toBe('off-brand tone');
  });
});

describe('Journey F — Brand Foundation approval', () => {
  it('submits and approves a brand kit', async () => {
    const t = await createTestTenant();
    const brand = await import('@lmms/brand');

    const kit = await brand.upsertBrandKit({
      tenantId: t.id,
      actorId: 'test',
      input: {
        tagline: 'Fresh in a flash',
        taglineAr: 'انتعاش سريع',
        colors: [{ name: 'navy', hex: '#0f172a' }],
        fonts: [{ name: 'Inter', script: 'latin' }],
      },
    });
    expect(kit.status).toBe('DRAFT');

    await brand.submitForClientReview(t.id, 'test');
    const afterSubmit = await brand.getBrandKit(t.id);
    expect(afterSubmit?.status).toBe('CLIENT_REVIEW');

    const approved = await brand.approveBrandKit(t.id, 'client');
    expect(approved.status).toBe('APPROVED');
    expect(approved.approvedAt).not.toBeNull();
  });

  it('consistency checker flags off-brand color', async () => {
    const t = await createTestTenant();
    const brand = await import('@lmms/brand');

    await brand.upsertBrandKit({
      tenantId: t.id,
      actorId: 'test',
      input: {
        colors: [{ name: 'navy', hex: '#0f172a' }],
        fonts: [{ name: 'Inter', script: 'latin' }],
      },
    });

    await brand.createAsset({
      tenantId: t.id,
      actorId: 'test',
      name: 'bad flyer',
      category: 'FLYER',
      fileUrl: 'https://example.com/x.png',
      tags: { declaredColors: ['#ff0000'], declaredFonts: ['Comic Sans'] },
    });

    const report = await brand.runConsistencyCheck(t.id);
    expect(report.issuesCount).toBeGreaterThan(0);
    expect(report.issues.some((i) => i.issue === 'off_brand_color')).toBe(true);
    expect(report.issues.some((i) => i.issue === 'off_brand_font')).toBe(true);
  });
});

describe('Journey G — Review management', () => {
  it('ingests a review, tags sentiment, drafts and posts a response', async () => {
    const t = await createTestTenant();
    const reviews = await import('@lmms/reviews');

    const review = await reviews.ingestReview({
      tenantId: t.id,
      platform: 'GOOGLE_BUSINESS',
      externalId: 'gbp-1',
      authorName: 'Ahmed',
      rating: 2,
      text: 'Late pickup and rude staff',
      reviewedAt: new Date(),
    });

    expect(review.sentiment).toBe('NEGATIVE');
    expect(review.escalated).toBe(true);
    const topics = review.topics as string[];
    expect(topics).toContain('TIMELINESS');

    const draft = await reviews.draftResponse({
      tenantId: t.id,
      actorId: 'strat',
      reviewId: review.id,
      language: 'en',
    });
    expect(draft.status).toBe('DRAFTED');
    expect(draft.body.length).toBeGreaterThan(10);

    const approved = await reviews.approveResponse({
      tenantId: t.id,
      actorId: 'strat',
      responseId: draft.id,
    });
    expect(approved.status).toBe('APPROVED');

    const posted = await reviews.postResponse({
      tenantId: t.id,
      actorId: 'strat',
      responseId: draft.id,
      externalId: 'mock-1',
    });
    expect(posted.status).toBe('POSTED');

    const refreshed = await prisma.review.findUnique({ where: { id: review.id } });
    expect(refreshed?.responded).toBe(true);
  });

  it('cannot post without approval', async () => {
    const t = await createTestTenant();
    const reviews = await import('@lmms/reviews');

    const review = await reviews.ingestReview({
      tenantId: t.id,
      platform: 'GOOGLE_BUSINESS',
      externalId: 'gbp-2',
      rating: 5,
      text: 'Excellent',
      reviewedAt: new Date(),
    });
    const draft = await reviews.draftResponse({
      tenantId: t.id,
      actorId: 'strat',
      reviewId: review.id,
      language: 'en',
    });

    await expect(
      reviews.postResponse({
        tenantId: t.id,
        actorId: 'strat',
        responseId: draft.id,
        externalId: 'mock-2',
      }),
    ).rejects.toThrow(/must_be_approved_first/);
  });
});

describe('Journey H — Ads lifecycle', () => {
  it('creates account, campaign, requires approval, then activates', async () => {
    const t = await createTestTenant();
    const ads = await import('@lmms/ads');

    const account = await ads.connectAdAccount({
      tenantId: t.id,
      actorId: 'test',
      platform: 'META',
      externalId: 'act_123',
      currency: 'AED',
      timezone: 'Asia/Dubai',
    });

    const campaign = await ads.createAdCampaign({
      tenantId: t.id,
      actorId: 'test',
      adAccountId: account.id,
      name: 'Ramadan Ads',
      objective: 'TRAFFIC',
      dailyBudgetCap: 500,
      geoPreset: 'AE_DUBAI_CORE',
      startDate: new Date(),
      adSets: [
        {
          name: 'Dubai — broad',
          targeting: { zones: ['Dubai Marina'] },
          dailyBudget: 300,
        },
      ],
      creatives: [
        { name: 'Hero A', fileUrl: 'https://example.com/a.png', width: 1080, height: 1080, copyEn: 'Book now' },
        { name: 'Hero B', fileUrl: 'https://example.com/b.png', width: 1080, height: 1080, copyAr: 'احجز الآن' },
      ],
      baseUrl: 'https://example.com',
    });
    expect(campaign.status).toBe('DRAFT');

    await ads.submitAdCampaign(t.id, campaign.id, 'test');
    const mid = await prisma.adCampaign.findUnique({ where: { id: campaign.id } });
    expect(mid?.status).toBe('PENDING_APPROVAL');

    const activated = await ads.approveAdCampaign(t.id, campaign.id, 'test');
    expect(activated.status).toBe('ACTIVE');
    expect(activated.externalId).toBeTruthy();
  });

  it('rejects campaigns with fewer than two creatives', async () => {
    const t = await createTestTenant();
    const ads = await import('@lmms/ads');

    const account = await ads.connectAdAccount({
      tenantId: t.id,
      actorId: 'test',
      platform: 'META',
      externalId: 'act_bad',
      currency: 'AED',
      timezone: 'Asia/Dubai',
    });

    await expect(
      ads.createAdCampaign({
        tenantId: t.id,
        actorId: 'test',
        adAccountId: account.id,
        name: 'Bad',
        objective: 'TRAFFIC',
        dailyBudgetCap: 100,
        geoPreset: 'AE_DUBAI_CORE',
        startDate: new Date(),
        adSets: [{ name: 'x', targeting: {}, dailyBudget: 100 }],
        creatives: [
          { name: 'only one', fileUrl: 'https://example.com/x.png', copyEn: 'hi' },
        ],
        baseUrl: 'https://example.com',
      }),
    ).rejects.toThrow(/creative_check_failed/);
  });

  it('auto-applies small budget shifts and holds large ones', async () => {
    const t = await createTestTenant();
    const ads = await import('@lmms/ads');

    const account = await ads.connectAdAccount({
      tenantId: t.id,
      actorId: 'test',
      platform: 'META',
      externalId: 'act_budget',
      currency: 'AED',
      timezone: 'Asia/Dubai',
    });

    const campaign = await ads.createAdCampaign({
      tenantId: t.id,
      actorId: 'test',
      adAccountId: account.id,
      name: 'Budget test',
      objective: 'TRAFFIC',
      dailyBudgetCap: 500,
      geoPreset: 'AE_DUBAI_CORE',
      startDate: new Date(),
      adSets: [{ name: 'x', targeting: {}, dailyBudget: 500 }],
      creatives: [
        { name: 'a', fileUrl: 'https://x.com/a.png', copyEn: 'hi' },
        { name: 'b', fileUrl: 'https://x.com/b.png', copyEn: 'hi' },
      ],
      baseUrl: 'https://example.com',
    });

    const small = await ads.changeDailyBudget({
      tenantId: t.id,
      actorId: 'test',
      campaignId: campaign.id,
      newDailyBudget: 550,
    });
    expect(small.applied).toBe(true);
    expect(small.requiresApproval).toBe(false);

    const large = await ads.changeDailyBudget({
      tenantId: t.id,
      actorId: 'test',
      campaignId: campaign.id,
      newDailyBudget: 800,
    });
    expect(large.applied).toBe(false);
    expect(large.requiresApproval).toBe(true);
  });
});
