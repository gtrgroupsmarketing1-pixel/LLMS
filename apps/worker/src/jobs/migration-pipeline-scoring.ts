import { prisma } from '@lmms/db';
import { scoreAndRecord } from '@lmms/migration-pipeline';

/**
 * Runs weekly. Scores every ACTIVE Standalone / Upgrading tenant so the
 * pipeline stays fresh.
 */
export async function migrationPipelineScoringJob() {
  const tenants = await prisma.tenant.findMany({
    where: {
      status: 'ACTIVE',
      mode: { in: ['STANDALONE', 'UPGRADING'] },
    },
  });

  for (const t of tenants) {
    try {
      const r = await scoreAndRecord(t.id);
      // eslint-disable-next-line no-console
      console.log(`[migration-pipeline-scoring] tenant=${t.id} score=${r.score} tier=${r.tier}`);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(`[migration-pipeline-scoring] tenant=${t.id} error`, e);
    }
  }
}
