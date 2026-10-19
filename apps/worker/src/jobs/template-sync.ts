import { prisma } from '@lmms/db';
import { createWhatsAppAdapterForTenant } from '@lmms/whatsapp';

export async function templateStatusSyncJob() {
  const pending = await prisma.template.findMany({ where: { status: 'PENDING' } });
  
  for (const t of pending) {
    if (!t.metaId) continue;
    try {
      const adapter = await createWhatsAppAdapterForTenant(t.tenantId);
      const remote = await adapter.getTemplateStatus(t.metaId);
      const status = remote.status === 'APPROVED' ? 'APPROVED'
        : remote.status === 'REJECTED' ? 'REJECTED' : 'PENDING';
      if (status !== t.status) {
        await prisma.template.update({
          where: { id: t.id },
          data: { status, rejectionReason: remote.reason, approvedAt: status === 'APPROVED' ? new Date() : null },
        });
      }
    } catch (e) {
      console.error(`[template-sync] template=${t.id} error`, e);
    }
  }
}
