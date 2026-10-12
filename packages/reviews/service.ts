import { prisma } from '@lmms/db';
import { logAudit } from '@lmms/audit';
import { tagSentiment, tagTopics } from './sentiment';
import { pickTemplate } from './templates';
import { shouldEscalate } from './escalation';
import { requirementsForCountry } from './directory';

type ReviewPlatform =
  | 'GOOGLE_BUSINESS'
  | 'FACEBOOK'
  | 'TRIPADVISOR'
  | 'YELP'
  | 'TRUSTPILOT'
  | 'OTHER';

interface IngestReviewInput {
  tenantId: string;
  locationId?: string;
  platform: ReviewPlatform;
  externalId: string;
  authorName?: string;
  rating: number;
  text?: string;
  language?: string;
  reviewedAt: Date;
}

export async function ingestReview(input: IngestReviewInput) {
  const sentiment = tagSentiment(input.text ?? null, input.rating);
  const topics = tagTopics(input.text ?? null);
  const escalate = shouldEscalate(input.rating, sentiment);

  const review = await prisma.review.upsert({
    where: {
      tenantId_platform_externalId: {
        tenantId: input.tenantId,
        platform: input.platform,
        externalId: input.externalId,
      },
    },
    update: {
      rating: input.rating,
      text: input.text ?? null,
      sentiment,
      topics: topics as never,
      escalated: escalate,
      escalatedAt: escalate ? new Date() : null,
    },
    create: {
      tenantId: input.tenantId,
      locationId: input.locationId ?? null,
      platform: input.platform,
      externalId: input.externalId,
      authorName: input.authorName ?? null,
      rating: input.rating,
      text: input.text ?? null,
      language: input.language ?? null,
      sentiment,
      topics: topics as never,
      escalated: escalate,
      escalatedAt: escalate ? new Date() : null,
      reviewedAt: input.reviewedAt,
    },
  });

  if (escalate) {
    await logAudit(
      input.tenantId,
      'system',
      'review.escalated',
      `review:${review.id}`,
    );
  }

  return review;
}

export interface DraftResponseInput {
  tenantId: string;
  actorId: string;
  reviewId: string;
  language: 'ar' | 'en';
  body?: string;
}

export async function draftResponse(input: DraftResponseInput) {
  const review = await prisma.review.findUnique({ where: { id: input.reviewId } });
  if (!review || review.tenantId !== input.tenantId) {
    throw new Error('review_not_found');
  }

  const topics = Array.isArray(review.topics) ? (review.topics as string[]) : [];
  const sentiment = review.sentiment as 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE';
  const body = input.body ?? pickTemplate(topics, sentiment === 'UNKNOWN' ? 'NEUTRAL' : sentiment, input.language);

  const response = await prisma.reviewResponse.create({
    data: {
      tenantId: input.tenantId,
      reviewId: input.reviewId,
      language: input.language,
      body,
      status: 'DRAFTED',
      draftedBy: input.actorId,
    },
  });

  await logAudit(
    input.tenantId,
    input.actorId,
    'review_response.draft',
    `review_response:${response.id}`,
  );
  return response;
}

export async function approveResponse(opts: {
  tenantId: string;
  actorId: string;
  responseId: string;
}) {
  const response = await prisma.reviewResponse.findUnique({
    where: { id: opts.responseId },
  });
  if (!response || response.tenantId !== opts.tenantId) {
    throw new Error('response_not_found');
  }
  if (response.status !== 'DRAFTED') {
    throw new Error('invalid_state');
  }
  const updated = await prisma.reviewResponse.update({
    where: { id: opts.responseId },
    data: {
      status: 'APPROVED',
      approvedBy: opts.actorId,
      approvedAt: new Date(),
    },
  });
  await logAudit(
    opts.tenantId,
    opts.actorId,
    'review_response.approve',
    `review_response:${opts.responseId}`,
  );
  return updated;
}

export async function postResponse(opts: {
  tenantId: string;
  actorId: string;
  responseId: string;
  externalId: string;
}) {
  const response = await prisma.reviewResponse.findUnique({
    where: { id: opts.responseId },
    include: { review: true },
  });
  if (!response || response.tenantId !== opts.tenantId) {
    throw new Error('response_not_found');
  }
  if (response.status !== 'APPROVED') {
    throw new Error('must_be_approved_first');
  }

  const [updated] = await prisma.$transaction([
    prisma.reviewResponse.update({
      where: { id: opts.responseId },
      data: {
        status: 'POSTED',
        postedAt: new Date(),
        postedExtern: opts.externalId,
      },
    }),
    prisma.review.update({
      where: { id: response.reviewId },
      data: { responded: true, respondedAt: new Date() },
    }),
  ]);

  await logAudit(
    opts.tenantId,
    opts.actorId,
    'review_response.posted',
    `review_response:${opts.responseId}`,
  );
  return updated;
}

export async function rejectResponse(opts: {
  tenantId: string;
  actorId: string;
  responseId: string;
  reason: string;
}) {
  const updated = await prisma.reviewResponse.update({
    where: { id: opts.responseId },
    data: {
      status: 'REJECTED',
      rejectionReason: opts.reason,
    },
  });
  await logAudit(
    opts.tenantId,
    opts.actorId,
    'review_response.reject',
    `review_response:${opts.responseId}`,
  );
  return updated;
}

export async function listReviews(opts: {
  tenantId: string;
  sentiment?: string;
  responded?: boolean;
  escalated?: boolean;
  limit?: number;
}) {
  const where: Record<string, unknown> = { tenantId: opts.tenantId };
  if (opts.sentiment) where.sentiment = opts.sentiment;
  if (typeof opts.responded === 'boolean') where.responded = opts.responded;
  if (typeof opts.escalated === 'boolean') where.escalated = opts.escalated;

  return prisma.review.findMany({
    where,
    include: { responses: { orderBy: { createdAt: 'desc' } } },
    orderBy: { reviewedAt: 'desc' },
    take: opts.limit ?? 200,
  });
}

export async function getReview(tenantId: string, reviewId: string) {
  const review = await prisma.review.findUnique({
    where: { id: reviewId },
    include: { responses: { orderBy: { createdAt: 'desc' } } },
  });
  if (!review || review.tenantId !== tenantId) return null;
  return review;
}

export async function reviewStats(tenantId: string) {
  const [total, avg, negativePending, escalatedPending] = await Promise.all([
    prisma.review.count({ where: { tenantId } }),
    prisma.review.aggregate({
      where: { tenantId },
      _avg: { rating: true },
    }),
    prisma.review.count({
      where: { tenantId, sentiment: 'NEGATIVE', responded: false },
    }),
    prisma.review.count({
      where: { tenantId, escalated: true, responded: false },
    }),
  ]);
  return {
    total,
    averageRating: avg._avg.rating ? Math.round(avg._avg.rating * 100) / 100 : null,
    negativePending,
    escalatedPending,
  };
}

export async function syncDirectoryListings(tenantId: string, country: string) {
  const requirements = requirementsForCountry(country);
  const upserted = [];
  for (const req of requirements) {
    const row = await prisma.directoryListing.upsert({
      where: {
        tenantId_country_platformName: {
          tenantId,
          country: country as never,
          platformName: req.platformName,
        },
      },
      update: {},
      create: {
        tenantId,
        country: country as never,
        platformName: req.platformName,
        platformUrl: req.platformUrl ?? null,
        notes: req.notes ?? null,
      },
    });
    upserted.push(row);
  }
  return upserted;
}

export async function listDirectoryListings(tenantId: string) {
  return prisma.directoryListing.findMany({
    where: { tenantId },
    orderBy: [{ country: 'asc' }, { platformName: 'asc' }],
  });
}

export async function updateDirectoryStatus(opts: {
  tenantId: string;
  actorId: string;
  listingId: string;
  status: string;
  rejectionReason?: string;
}) {
  const updated = await prisma.directoryListing.update({
    where: { id: opts.listingId },
    data: {
      status: opts.status,
      ...(opts.status === 'SUBMITTED' ? { submittedAt: new Date() } : {}),
      ...(opts.status === 'VERIFIED' ? { verifiedAt: new Date() } : {}),
      rejectionReason: opts.rejectionReason ?? null,
    },
  });
  await logAudit(
    opts.tenantId,
    opts.actorId,
    'directory.update',
    `directory:${opts.listingId}`,
  );
  return updated;
}
