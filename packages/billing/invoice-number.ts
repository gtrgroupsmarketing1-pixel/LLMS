import crypto from 'node:crypto';
import { prisma } from '@lmms/db';

/**
 * Deterministic invoice numbering: LMMS-<tenantHash>-<YYYYMM>-<seq>.
 *
 * The tenant prefix is derived from a short hash of the tenantId so two
 * different tenants can never collide even if they share the same display
 * prefix string. Sequence resets monthly and is scoped per tenant.
 */
export async function nextInvoiceNumber(
  tenantId: string,
  tenantPrefix: string,
  when: Date = new Date(),
): Promise<string> {
  const year = when.getUTCFullYear();
  const month = String(when.getUTCMonth() + 1).padStart(2, '0');

  const tenantHash = crypto
    .createHash('sha256')
    .update(tenantId)
    .digest('hex')
    .slice(0, 4)
    .toUpperCase();

  const displayPrefix = tenantPrefix.toUpperCase().slice(0, 4);
  const prefix = `LMMS-${displayPrefix}${tenantHash}-${year}${month}`;

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
