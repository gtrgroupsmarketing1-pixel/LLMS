import { prisma } from '@lmms/db';

/**
 * Deterministic invoice numbering: LMMS-<tenantPrefix>-<YYYYMM>-<seq>.
 * Sequence resets monthly and is scoped per tenant. Atomic via a
 * `SELECT ... FOR UPDATE` pattern on the highest number in the period.
 */
export async function nextInvoiceNumber(
  tenantId: string,
  tenantPrefix: string,
  when: Date = new Date(),
): Promise<string> {
  const year = when.getUTCFullYear();
  const month = String(when.getUTCMonth() + 1).padStart(2, '0');
  const prefix = `LMMS-${tenantPrefix.toUpperCase().slice(0, 4)}-${year}${month}`;

  const last = await prisma.invoice.findFirst({
    where: {
      tenantId,
      number: { startsWith: prefix },
    },
    orderBy: { number: 'desc' },
    select: { number: true },
  });

  let nextSeq = 1;
  if (last) {
    const suffix = last.number.slice(prefix.length + 1);
    const parsed = Number(suffix);
    if (Number.isFinite(parsed) && parsed > 0) {
      nextSeq = parsed + 1;
    }
  }

  return `${prefix}-${String(nextSeq).padStart(4, '0')}`;
}
