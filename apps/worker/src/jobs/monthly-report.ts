import { prisma } from '@lmms/db';
import { generateMonthlyReport } from '@lmms/reporting';

export async function monthlyReportJob() {
  const tenants = await prisma.tenant.findMany({ where: { status: 'ACTIVE' } });
  for (const t of tenants) {
    try {
      const r = await generateMonthlyReport(t.id);
      // eslint-disable-next-line no-console
      console.log(`[monthly-report] tenant=${t.id} status=${r.status}`);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(`[monthly-report] tenant=${t.id} error`, e);
    }
  }
}
