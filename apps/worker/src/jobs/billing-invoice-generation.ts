import { prisma } from '@lmms/db';
import { createInvoice } from '@lmms/billing';

/**
 * Runs monthly on the 1st. For each ACTIVE subscription whose current
 * period ended, generate the next invoice and roll the period forward.
 */
export async function billingInvoiceGenerationJob() {
  const now = new Date();
  const subs = await prisma.subscription.findMany({
    where: {
      status: 'ACTIVE',
      currentPeriodEnd: { lte: now },
    },
  });

  for (const s of subs) {
    try {
      const tenant = await prisma.tenant.findUnique({ where: { id: s.tenantId } });
      if (!tenant) continue;

      const pkg = await prisma.billingPackage.findUnique({
        where: { id: s.packageId },
      });
      if (!pkg) continue;

      const periodStart = new Date(s.currentPeriodEnd);
      const periodEnd = new Date(
        Date.UTC(
          periodStart.getUTCFullYear(),
          periodStart.getUTCMonth() + 1,
          periodStart.getUTCDate() - 1,
        ),
      );
      const dueDate = new Date(periodEnd.getTime() + 14 * 86_400_000);

      await createInvoice({
        tenantId: s.tenantId,
        actorId: 'system',
        subscriptionId: s.id,
        tenantPrefix: tenant.nameEn.slice(0, 4),
        country: tenant.country,
        currency: s.currency,
        periodStart,
        periodEnd,
        dueDate,
        baseFee: Number(pkg.baseFee),
        baseFeeDescription: `${pkg.name} — monthly package fee`,
        usageLines: [],
      });

      await prisma.subscription.update({
        where: { id: s.id },
        data: {
          currentPeriodStart: periodStart,
          currentPeriodEnd: periodEnd,
          renewalCount: { increment: 1 },
        },
      });

      // eslint-disable-next-line no-console
      console.log(`[billing-invoice-gen] tenant=${s.tenantId} generated`);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(`[billing-invoice-gen] tenant=${s.tenantId} error`, e);
    }
  }
}
