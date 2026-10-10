import { prisma } from '@lmms/db';
import { generateWeeklySummary } from '@lmms/reporting';
import { MockWhatsAppAdapter } from '@lmms/whatsapp';

export async function weeklySummaryJob() {
  const adapter = new MockWhatsAppAdapter();
  const tenants = await prisma.tenant.findMany({ where: { status: 'ACTIVE' } });
  for (const t of tenants) {
    try {
      const result = await generateWeeklySummary(t.id);
      const owner = await prisma.user.findFirst({
        where: { tenantId: t.id, kind: 'CLIENT' },
      });
      if (owner?.phone) {
        await adapter
          .sendTemplate({
            to: owner.phone,
            templateName: 'weekly_summary',
            language: 'ar',
            variables: { body: result.body },
          })
          .catch(() => undefined);
      }
      await prisma.reportDelivery.create({
        data: {
          reportId: result.reportId,
          tenantId: t.id,
          channel: 'WHATSAPP',
          meta: { deliveredTo: owner?.phone ?? null } as never,
        },
      });
      // eslint-disable-next-line no-console
      console.log(`[weekly-summary] tenant=${t.id} report=${result.reportId}`);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(`[weekly-summary] tenant=${t.id} error`, e);
    }
  }
}
