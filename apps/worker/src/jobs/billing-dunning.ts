import { prisma } from '@lmms/db';
import { computeDunning } from '@lmms/billing';

/**
 * Runs daily. Finds unpaid invoices past due and journals the appropriate
 * dunning step. Real channel delivery (email/WhatsApp) lands in V2.10.
 */
export async function billingDunningJob() {
  const now = new Date();
  const overdue = await prisma.invoice.findMany({
    where: {
      status: { in: ['SENT', 'OVERDUE'] },
      dueDate: { lt: now },
    },
    take: 500,
  });

  for (const inv of overdue) {
    const status = computeDunning(inv.dueDate, now);
    if (status.stepsDue.length === 0) continue;

    const lastStep = status.stepsDue[status.stepsDue.length - 1];
    // eslint-disable-next-line no-console
    console.log(
      `[billing-dunning] invoice=${inv.number} tenant=${inv.tenantId} daysPastDue=${status.daysPastDue} step=${lastStep.kind}`,
    );

    if (inv.status !== 'OVERDUE' && status.daysPastDue > 0) {
      await prisma.invoice.update({
        where: { id: inv.id },
        data: { status: 'OVERDUE' },
      });
    }
  }
}
