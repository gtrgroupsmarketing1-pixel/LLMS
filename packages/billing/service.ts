import { prisma } from '@lmms/db';
import { logAudit } from '@lmms/audit';
import { buildInvoice, type BuildInvoiceInput } from './invoice-builder';
import { generateInvoicePdf } from './pdf';
import { getPaymentAdapter } from './adapters';

export async function getSubscription(tenantId: string) {
  return prisma.subscription.findUnique({ where: { tenantId } });
}

export async function getOrCreatePackageTier(
  tenantId: string,
  tier: 'LAUNCH' | 'GROWTH' | 'DOMINATE' | 'ADD_ON',
) {
  return prisma.billingPackage.findFirst({
    where: { OR: [{ tenantId }, { tenantId: null }], tier, active: true },
    orderBy: { tenantId: 'desc' },
  });
}

export async function createInvoice(
  input: BuildInvoiceInput,
): Promise<{ id: string; number: string; total: number }> {
  const built = await buildInvoice(input);
  return { id: built.id, number: built.number, total: built.total };
}

export async function renderInvoicePdf(
  tenantId: string,
  invoiceId: string,
  actorId: string,
) {
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: { lines: true },
  });
  if (!invoice || invoice.tenantId !== tenantId) throw new Error('invoice_not_found');

  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
  if (!tenant) throw new Error('tenant_not_found');

  const pdf = await generateInvoicePdf({
    number: invoice.number,
    tenantName: tenant.nameEn,
    tenantNameAr: tenant.nameAr,
    country: invoice.country,
    currency: invoice.currency,
    periodStart: invoice.periodStart,
    periodEnd: invoice.periodEnd,
    dueDate: invoice.dueDate,
    subtotal: Number(invoice.subtotal),
    vatRate: Number(invoice.vatRate),
    vatAmount: Number(invoice.vatAmount),
    total: Number(invoice.total),
    lines: invoice.lines.map((l) => ({
      description: l.description,
      quantity: Number(l.quantity),
      unitPrice: Number(l.unitPrice),
      lineTotal: Number(l.lineTotal),
    })),
    notes: invoice.notes,
  });

  const base64 = pdf.toString('base64');
  await prisma.invoice.update({
    where: { id: invoice.id },
    data: { pdfData: base64, pdfMime: 'application/pdf' },
  });

  await logAudit(tenantId, actorId, 'invoice.pdf', `invoice:${invoice.id}`);
  return { sizeBytes: pdf.length, base64Length: base64.length };
}

export async function sendInvoice(opts: {
  tenantId: string;
  actorId: string;
  invoiceId: string;
}) {
  const updated = await prisma.invoice.update({
    where: { id: opts.invoiceId },
    data: { status: 'SENT', sentAt: new Date() },
  });
  await logAudit(opts.tenantId, opts.actorId, 'invoice.send', `invoice:${opts.invoiceId}`);
  return updated;
}

export async function voidInvoice(opts: {
  tenantId: string;
  actorId: string;
  invoiceId: string;
  reason?: string;
}) {
  const updated = await prisma.invoice.update({
    where: { id: opts.invoiceId },
    data: { status: 'VOID', voidedAt: new Date(), notes: opts.reason ?? null },
  });
  await logAudit(opts.tenantId, opts.actorId, 'invoice.void', `invoice:${opts.invoiceId}`);
  return updated;
}

export async function listInvoices(tenantId: string, status?: string) {
  return prisma.invoice.findMany({
    where: { tenantId, ...(status ? { status: status as never } : {}) },
    include: { lines: true, payments: true },
    orderBy: { createdAt: 'desc' },
    take: 200,
  });
}

export async function getInvoice(tenantId: string, invoiceId: string) {
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: { lines: true, payments: { include: { events: true } } },
  });
  if (!invoice || invoice.tenantId !== tenantId) return null;
  return invoice;
}

export async function initiatePayment(opts: {
  tenantId: string;
  actorId: string;
  invoiceId: string;
  provider: 'STRIPE' | 'TELR' | 'PAYTABS' | 'HYPERPAY' | 'MANUAL';
  returnUrl: string;
}) {
  const invoice = await prisma.invoice.findUnique({
    where: { id: opts.invoiceId },
  });
  if (!invoice || invoice.tenantId !== opts.tenantId) {
    throw new Error('invoice_not_found');
  }
  if (invoice.status === 'PAID') throw new Error('already_paid');
  if (invoice.status === 'VOID') throw new Error('invoice_voided');

  const adapter = getPaymentAdapter(opts.provider);
  const intent = await adapter.createIntent({
    amount: Number(invoice.total),
    currency: invoice.currency,
    reference: invoice.number,
    returnUrl: opts.returnUrl,
    metadata: { invoiceId: invoice.id, tenantId: opts.tenantId },
  });

  if (!intent.ok) throw new Error(`payment_intent_failed:${intent.error ?? 'unknown'}`);

  const payment = await prisma.payment.create({
    data: {
      tenantId: opts.tenantId,
      invoiceId: invoice.id,
      provider: opts.provider,
      status: 'PENDING',
      amount: invoice.total,
      currency: invoice.currency,
      externalId: intent.externalId ?? null,
      paymentUrl: intent.paymentUrl ?? null,
      events: {
        create: {
          tenantId: opts.tenantId,
          kind: 'INTENT_CREATED',
          body: ({ paymentUrl: intent.paymentUrl ?? null } as never),
        },
      },
    },
  });

  await logAudit(
    opts.tenantId,
    opts.actorId,
    'payment.initiated',
    `payment:${payment.id}`,
  );
  return payment;
}

export async function capturePayment(opts: {
  tenantId: string;
  actorId: string;
  paymentId: string;
}) {
  const payment = await prisma.payment.findUnique({ where: { id: opts.paymentId } });
  if (!payment || payment.tenantId !== opts.tenantId) {
    throw new Error('payment_not_found');
  }
  if (payment.status === 'CAPTURED') return payment;

  const adapter = getPaymentAdapter(payment.provider);
  if (payment.externalId) {
    const result = await adapter.capturePayment(payment.externalId);
    if (!result.ok) {
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: 'FAILED',
          failureReason: result.error ?? 'capture_failed',
        },
      });
      throw new Error(`capture_failed:${result.error ?? 'unknown'}`);
    }
  }

  const now = new Date();
  const [updated] = await prisma.$transaction([
    prisma.payment.update({
      where: { id: payment.id },
      data: { status: 'CAPTURED', capturedAt: now },
    }),
    prisma.invoice.update({
      where: { id: payment.invoiceId },
      data: { status: 'PAID', paidAt: now },
    }),
    prisma.paymentEvent.create({
      data: {
        tenantId: opts.tenantId,
        paymentId: payment.id,
        kind: 'CAPTURED',
      },
    }),
  ]);

  await logAudit(opts.tenantId, opts.actorId, 'payment.captured', `payment:${payment.id}`);
  return updated;
}

export async function listPayments(tenantId: string) {
  return prisma.payment.findMany({
    where: { tenantId },
    include: { events: true },
    orderBy: { createdAt: 'desc' },
    take: 200,
  });
}

export async function seedVatRates() {
  const { VAT_RATES } = await import('./vat');
  let count = 0;
  for (const v of VAT_RATES) {
    const existing = await prisma.vatRate.findFirst({
      where: { country: v.country, effectiveFrom: v.effectiveFrom },
    });
    if (!existing) {
      await prisma.vatRate.create({
        data: {
          country: v.country,
          rate: v.rate,
          label: v.label,
          effectiveFrom: v.effectiveFrom,
        },
      });
      count += 1;
    }
  }
  return count;
}

export async function seedPackages() {
  const { prisma: p } = await import('@lmms/db');
  const packages: Array<{
    tier: 'LAUNCH' | 'GROWTH' | 'DOMINATE';
    name: string;
    nameAr: string;
    baseFee: number;
    currency: string;
    includedMessages: number;
    includedAdSpend: number;
    includedCampaigns: number;
    includedLocations: number;
  }> = [
    { tier: 'LAUNCH', name: 'Launch', nameAr: 'الانطلاق', baseFee: 1500, currency: 'AED', includedMessages: 5000, includedAdSpend: 3000, includedCampaigns: 4, includedLocations: 1 },
    { tier: 'GROWTH', name: 'Growth', nameAr: 'النمو', baseFee: 3500, currency: 'AED', includedMessages: 20000, includedAdSpend: 10000, includedCampaigns: 12, includedLocations: 3 },
    { tier: 'DOMINATE', name: 'Dominate', nameAr: 'التوسع', baseFee: 7500, currency: 'AED', includedMessages: 60000, includedAdSpend: 30000, includedCampaigns: 30, includedLocations: 10 },
  ];
  let count = 0;
  for (const pkg of packages) {
    const existing = await p.billingPackage.findFirst({
      where: { tenantId: null, tier: pkg.tier },
    });
    if (!existing) {
      await p.billingPackage.create({ data: { tenantId: null, ...pkg } });
      count += 1;
    }
  }
  return count;
}
