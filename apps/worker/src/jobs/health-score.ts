import { prisma } from '@lmms/db';
import { recomputeHealthScore } from '@lmms/api/services/tenant.service';

export async function healthScoreJob() {
  const tenants = await prisma.tenant.findMany({ where: { status: 'ACTIVE' } });
  for (const t of tenants) {
    try {
      const score = await recomputeHealthScore(t.id);
      // eslint-disable-next-line no-console
      console.log(`[health-score] tenant=${t.id} score=${score}`);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(`[health-score] tenant=${t.id} error`, e);
    }
  }
}
