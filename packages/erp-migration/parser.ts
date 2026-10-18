import { parse } from 'csv-parse';
import { prisma } from '@lmms/db';

export async function ingestRawCsv(
  tenantId: string,
  sourceSystem: string,
  csvContent: string | Buffer,
): Promise<string> {
  const job = await prisma.competitorImportJob.create({
    data: { tenantId, sourceSystem, status: 'MAPPING' },
  });

  const parser = parse({
    columns: true,
    skip_empty_lines: true,
    trim: true,
    bom: true,
  });

  const rows: Record<string, unknown>[] = [];
  parser.on('readable', () => {
    let record;
    while ((record = parser.read()) !== null) {
      rows.push(record);
    }
  });

  return new Promise((resolve, reject) => {
    parser.on('error', reject);
    parser.on('end', async () => {
      try {
        if (rows.length === 0) throw new Error('empty_csv');

        // Chunk inserts to avoid hitting query limits
        const chunk = 1000;
        for (let i = 0; i < rows.length; i += chunk) {
          const chunkRows = rows.slice(i, i + chunk);
          await prisma.competitorImportRow.createMany({
            data: chunkRows.map((r) => ({
              jobId: job.id,
              tenantId,
              rawData: r as never,
              status: 'PENDING',
            })),
          });
        }

        await prisma.competitorImportJob.update({
          where: { id: job.id },
          data: { totalRows: rows.length },
        });

        resolve(job.id);
      } catch (e) {
        reject(e);
      }
    });
    parser.write(csvContent);
    parser.end();
  });
}
