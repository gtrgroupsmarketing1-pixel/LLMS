import { prisma } from '@lmms/db';
import { computeVat, vatRateFor } from './vat';
import { nextInvoiceNumber } from './invoice-number';

export interface UsageLineInput {
  description: string;
  quantity: number;
  unitPrice: number;
  metadata?: Record<string, unknown>;
}

export interface BuildInvoiceInput {
  tenantId: string;
  actorId: string;
  subscriptionId?: string;
  tenantPrefix: string;
  country: string;
  currency: string;
  periodStart: Date;
  periodEnd: Date;
  dueDate: Date;
  baseFee: number;
  baseFeeDescription: string;
  usageLines: UsageLineInput[];
  notes?: string;
}

export interface BuiltInvoice {
  id: string;
  number: string;
  subtotal: number;
  vatAmount: number;
  total: number;
}

export async function buildInvoice(
  input: BuildInvoiceInput,
): Promise<BuiltInvoice> {
  const number = await nextInvoiceNumber(input.tenantId, input.tenantPrefix);
  const rate = vatRateFor(input.country, input.periodEnd);

  const lines = [
    {
      description: input.baseFeeDescription,
      quantity: 1,
      unitPrice: input.baseFee,
      metadata: undefined as Record<string, unknown> | undefined,
    },
    ...input.usageLines.map((u) => ({
      description: u.description,
      quantity: u.quantity,
      unitPrice: u.unitPrice,
      metadata: u.metadata,
    })),
  ];

  const subtotal = lines.reduce((s, l) => s + l.quantity * l.unitPrice, 0);
  const vat = computeVat(subtotal, rate);

  const invoice = await prisma.invoice.create({
    data: {
      tenantId: input.tenantId,
      subscriptionId: input.subscriptionId ?? null,
      number,
      status: 'DRAFT',
      currency: input.currency,
      subtotal: vat.subtotal,
      vatAmount: vat.vatAmount,
      vatRate: vat.rate,
      total: vat.total,
      country: input.country,
      periodStart: input.periodStart,
      periodEnd: input.periodEnd,
      dueDate: input.dueDate,
      notes: input.notes ?? null,
      createdBy: input.actorId,
      lines: {
        create: lines.map((l) => ({
          tenantId: input.tenantId,
          description: l.description,
          quantity: l.quantity,
          unitPrice: l.unitPrice,
          lineTotal: Math.round(l.quantity * l.unitPrice * 100) / 100,
          metadata: (l.metadata ?? null) as never,
        })),
      },
    },
  });

  return {
    id: invoice.id,
    number: invoice.number,
    subtotal: Number(invoice.subtotal),
    vatAmount: Number(invoice.vatAmount),
    total: Number(invoice.total),
  };
}
