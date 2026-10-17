import { prisma } from '@lmms/db';

/**
 * Placeholder for future aggregation. For now this just cleans up visit
 * records older than 90 days so the table stays small.
 */
export async function websiteVisitAggregationJob() {
  const cutoff = new Date(Date.now() - 90 * 86_400_000);
  const deleted = await prisma.websiteVisit.deleteMany({
    where: { createdAt: { lt: cutoff } },
  });
  if (deleted.count > 0) {
    // eslint-disable-next-line no-console
    console.log(`[website-visit-aggregation] deleted=${deleted.count}`);
  }
}
