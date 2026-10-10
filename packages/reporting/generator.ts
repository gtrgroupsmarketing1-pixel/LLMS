import { prisma } from '@lmms/db';
import { logAudit } from '@lmms/audit';
import { collectRawMetrics } from './collect';
import { computeKpis, applyModeFilter } from './metrics';
import { generateMonthlyPdf } from './pdf';
import { buildWeeklySummary } from './whatsapp-summary';
import { lastCompletedMonth, lastCompletedWeek, type Period } from './period';

export interface GenerationResult {
  reportId: string;
  kind: 'MONTHLY_PDF' | 'WEEKLY_SUMMARY';
  status: 'READY' | 'FAILED';
  periodStart: Date;
  periodEnd: Date;
  error?: string;
}

export async function generateMonthlyReport(
  tenantId: string,
  period?: Period,
  actorId = 'system',
): Promise<GenerationResult> {
  const p = period ?? lastCompletedMonth();
  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
  if (!tenant) throw new Error('tenant_not_found');

  const record = await prisma.reportRecord.upsert({
    where: {
      tenantId_kind_periodStart: {
        tenantId,
        kind: 'MONTHLY_PDF',
        periodStart: p.start,
      },
    },
    update: { status: 'GENERATING' },
    create: {
      tenantId,
      kind: 'MONTHLY_PDF',
      periodStart: p.start,
      periodEnd: p.end,
      status: 'GENERATING',
    },
  });

  try {
    const raw = await collectRawMetrics(tenantId, p);
    const kpis = computeKpis(raw);
    const filtered = applyModeFilter(
      kpis,
      tenant.mode as 'ERP_CONNECTED' | 'STANDALONE' | 'UPGRADING',
    ) as typeof kpis;

    const pdf = await generateMonthlyPdf({
      tenantNameEn: tenant.nameEn,
      tenantNameAr: tenant.nameAr,
      period: p,
      kpis: filtered,
      mode: tenant.mode as 'ERP_CONNECTED' | 'STANDALONE' | 'UPGRADING',
    });

    const payload = { kpis: filtered, bytes: pdf.length } as never;

    await prisma.reportRecord.update({
      where: { id: record.id },
      data: {
        status: 'READY',
        generatedAt: new Date(),
        payload,
        pdfPath: null,
      },
    });

    await logAudit(tenantId, actorId, 'report.monthly.generate', `report:${record.id}`);
    return {
      reportId: record.id,
      kind: 'MONTHLY_PDF',
      status: 'READY',
      periodStart: p.start,
      periodEnd: p.end,
    };
  } catch (e) {
    await prisma.reportRecord.update({
      where: { id: record.id },
      data: { status: 'FAILED', error: (e as Error).message },
    });
    return {
      reportId: record.id,
      kind: 'MONTHLY_PDF',
      status: 'FAILED',
      periodStart: p.start,
      periodEnd: p.end,
      error: (e as Error).message,
    };
  }
}

export async function generateWeeklySummary(
  tenantId: string,
  period?: Period,
  actorId = 'system',
): Promise<{ reportId: string; body: string; periodStart: Date; periodEnd: Date }> {
  const p = period ?? lastCompletedWeek();
  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
  if (!tenant) throw new Error('tenant_not_found');

  const raw = await collectRawMetrics(tenantId, p);
  const kpis = computeKpis(raw);
  const filtered = applyModeFilter(
    kpis,
    tenant.mode as 'ERP_CONNECTED' | 'STANDALONE' | 'UPGRADING',
  ) as typeof kpis;

  const body = buildWeeklySummary({
    tenantNameEn: tenant.nameEn,
    tenantNameAr: tenant.nameAr,
    period: p,
    kpis: filtered,
    mode: tenant.mode as 'ERP_CONNECTED' | 'STANDALONE' | 'UPGRADING',
    locale: 'ar',
  });

  const payload = { body } as never;

  const record = await prisma.reportRecord.upsert({
    where: {
      tenantId_kind_periodStart: {
        tenantId,
        kind: 'WEEKLY_SUMMARY',
        periodStart: p.start,
      },
    },
    update: { status: 'READY', payload, generatedAt: new Date() },
    create: {
      tenantId,
      kind: 'WEEKLY_SUMMARY',
      periodStart: p.start,
      periodEnd: p.end,
      status: 'READY',
      payload,
      generatedAt: new Date(),
    },
  });

  await logAudit(tenantId, actorId, 'report.weekly.generate', `report:${record.id}`);
  return {
    reportId: record.id,
    body,
    periodStart: p.start,
    periodEnd: p.end,
  };
}
