import { prisma } from '@lmms/db';
import { buildDeckForLastQuarter } from '@lmms/qbr';

/**
 * Runs weekly. On the first Monday of a new quarter, builds the last
 * quarter's QBR for every ACTIVE tenant.
 */
export async function qbrBuilderJob() {
  const now = new Date();
  const isFirstMonday = now.getUTCDay() === 1 && now.getUTCDate() <= 7;
  const isQuarterStart = now.getUTCMonth() % 3 === 0;

  if (!isFirstMonday || !isQuarterStart) {
    // eslint-disable-next-line no-console
    console.log('[qbr-builder] skipping — not first Monday of quarter');
    return;
  }

  const tenants = await prisma.tenant.findMany({ where: { status: 'ACTIVE' } });
  for (const t of tenants) {
    try {
      const result = await buildDeckForLastQuarter(t.id, 'system');
      // eslint-disable-next-line no-console
      console.log(`[qbr-builder] tenant=${t.id} deck=${result.deckId}`);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(`[qbr-builder] tenant=${t.id} error`, e);
    }
  }
}
