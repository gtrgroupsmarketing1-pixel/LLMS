import { prisma } from '@lmms/db';
import { runAutomationsForTenant } from '@lmms/automations';
import { MockWhatsAppAdapter } from '@lmms/whatsapp';

export async function automationRunnerJob() {
  const tenants = await prisma.tenant.findMany({ where: { status: 'ACTIVE' } });
  const adapter = new MockWhatsAppAdapter();
  for (const t of tenants) {
    try {
      const summary = await runAutomationsForTenant({
        tenantId: t.id,
        adapter,
        actorId: 'system',
      });
      // eslint-disable-next-line no-console
      console.log(
        `[automation-runner] tenant=${t.id} evaluated=${summary.evaluated} sent=${summary.sent} skipped=${summary.skipped} failures=${summary.failures}`,
      );
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(`[automation-runner] tenant=${t.id} error`, e);
    }
  }
}
