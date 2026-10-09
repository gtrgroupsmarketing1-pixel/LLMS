import { prisma } from '@lmms/db';
import { logAudit } from '@lmms/audit';
import { parseCustomerCsv, type ParsedRow } from './parser';

export interface ImportOptions {
  tenantId: string;
  actorId: string;
  filename: string;
  content: Buffer | string;
  hasExplicitConsent: boolean;
}

export interface ImportSummary {
  importId: string;
  rowsTotal: number;
  rowsImported: number;
  rowsFlagged: number;
  rowsFailed: number;
  status: 'COMPLETED' | 'PARTIAL' | 'FAILED';
  durationMs: number;
}

const CHUNK = 500;

export async function importCustomerCsv(opts: ImportOptions): Promise<ImportSummary> {
  const started = Date.now();

  const created = await prisma.cSVImport.create({
    data: {
      tenantId: opts.tenantId,
      filename: opts.filename,
      status: 'PROCESSING',
    },
  });

  try {
    const parsed = await parseCustomerCsv(opts.content);
    let imported = 0;
    let flagged = 0;
    let failed = 0;

    const seenPhones = new Set<string>();
    const seenEmails = new Set<string>();

    for (let i = 0; i < parsed.rows.length; i += CHUNK) {
      const chunk = parsed.rows.slice(i, i + CHUNK);
      const deduped: ParsedRow[] = [];
      for (const row of chunk) {
        if (row.errors.length) {
          failed += 1;
          continue;
        }
        const phone = String(row.raw.phone);
        const email = row.raw.email ? String(row.raw.email) : undefined;
        if (seenPhones.has(phone)) {
          failed += 1;
          continue;
        }
        if (email && seenEmails.has(email)) {
          failed += 1;
          continue;
        }
        seenPhones.add(phone);
        if (email) seenEmails.add(email);
        deduped.push(row);
      }

      for (const row of deduped) {
        const phone = String(row.raw.phone);
        const email = row.raw.email ? String(row.raw.email) : undefined;
        const consentOk =
          opts.hasExplicitConsent || row.raw.consentStatus === 'opt_in';

        const existing = await prisma.endCustomer.findFirst({
          where: {
            tenantId: opts.tenantId,
            OR: [{ phone }, ...(email ? [{ email }] : [])],
          },
        });

        if (existing) {
          await prisma.endCustomer.update({
            where: { id: existing.id },
            data: {
              name: row.raw.name ?? existing.name,
              zone: row.raw.zone ?? existing.zone,
              language: (row.raw.language as string) ?? existing.language,
            },
          });
          continue;
        }

        await prisma.endCustomer.create({
          data: {
            tenantId: opts.tenantId,
            phone,
            email,
            name: row.raw.name ?? null,
            language: (row.raw.language as string) ?? 'ar',
            zone: row.raw.zone ?? null,
            source: 'CSV',
            consentVerified: consentOk,
            needsReview: !consentOk,
          },
        });

        if (!consentOk) flagged += 1;
        else imported += 1;
      }
    }

    const status: ImportSummary['status'] =
      failed > 0 && imported === 0 && flagged === 0
        ? 'FAILED'
        : failed > 0
          ? 'PARTIAL'
          : 'COMPLETED';

    await prisma.cSVImport.update({
      where: { id: created.id },
      data: {
        rowsTotal: parsed.total,
        rowsImported: imported,
        rowsFlagged: flagged,
        rowsFailed: failed,
        status,
        completedAt: new Date(),
        errorReport: failed > 0 ? { failedSample: failed } : null,
      },
    });

    await logAudit(opts.tenantId, opts.actorId, 'csv.import', `import:${created.id}`);

    return {
      importId: created.id,
      rowsTotal: parsed.total,
      rowsImported: imported,
      rowsFlagged: flagged,
      rowsFailed: failed,
      status,
      durationMs: Date.now() - started,
    };
  } catch (e) {
    await prisma.cSVImport.update({
      where: { id: created.id },
      data: {
        status: 'FAILED',
        completedAt: new Date(),
        errorReport: { message: (e as Error).message },
      },
    });
    throw e;
  }
}
