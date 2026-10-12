import { prisma } from '@lmms/db';
import { MockGbpAdapter } from '@lmms/reviews';
import { ingestReview } from '@lmms/reviews';

export async function gbpSyncJob() {
  const adapter = new MockGbpAdapter();
  const ok = await adapter.validate();
  if (!ok) {
    // eslint-disable-next-line no-console
    console.error('[gbp-sync] adapter validation failed');
    return;
  }

  const tenants = await prisma.tenant.findMany({ where: { status: 'ACTIVE' } });
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);

  for (const t of tenants) {
    try {
      const reviews = await adapter.fetchNewReviews(since);
      for (const r of reviews) {
        await ingestReview({
          tenantId: t.id,
          platform: 'GOOGLE_BUSINESS',
          externalId: r.externalId,
          authorName: r.authorName,
          rating: r.rating,
          text: r.text,
          language: r.language,
          reviewedAt: new Date(r.reviewedAt),
        });
      }
      // eslint-disable-next-line no-console
      console.log(`[gbp-sync] tenant=${t.id} fetched=${reviews.length}`);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(`[gbp-sync] tenant=${t.id} error`, e);
    }
  }
}
