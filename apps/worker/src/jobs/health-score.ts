import { prisma } from '@lmms/db';

async function recomputeHealthScore(tenantId: string) {
  const components = { engagement: 20, results: 20, payment: 20, approvalSpeed: 20 };
  const score = Object.values(components).reduce((a, b) => a + b, 0);
  await prisma.tenantHealthScore.create({ data: { tenantId, score, components } });
  if (score < 60) {
    await prisma.tenant.update({ where: { id: tenantId }, data: { churnRisk: true } });
  }
  return score;
}

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
