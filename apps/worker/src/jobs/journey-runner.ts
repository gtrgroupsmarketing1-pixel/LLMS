import { prisma } from '@lmms/db';
import { runJourneysForTenant } from '@lmms/journey-builder';
import { MockWhatsAppAdapter } from '@lmms/whatsapp';

export async function journeyRunnerJob() {
  const tenants = await prisma.tenant.findMany({ where: { status: 'ACTIVE' } });
  const adapter = new MockWhatsAppAdapter();
  for (const t of tenants) {
    try {
      const summary = await runJourneysForTenant({
        tenantId: t.id,
        adapter,
        actorId: 'system',
      });
      if (summary.journeysEvaluated > 0 || summary.messagesSent > 0) {
        // eslint-disable-next-line no-console
        console.log(
          `[journey-runner] tenant=${t.id} evaluated=${summary.journeysEvaluated} entered=${summary.customersEntered} sent=${summary.messagesSent} exits=${summary.exits} failures=${summary.failures}`,
        );
      }
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(`[journey-runner] tenant=${t.id} error`, e);
    }
  }
}
