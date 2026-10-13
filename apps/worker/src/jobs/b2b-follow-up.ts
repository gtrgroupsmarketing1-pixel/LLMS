import { prisma } from '@lmms/db';
import { dueFollowUps } from '@lmms/b2b';

export async function b2bFollowUpJob() {
  const tenants = await prisma.tenant.findMany({ where: { status: 'ACTIVE' } });
  for (const t of tenants) {
    try {
      const due = await dueFollowUps(t.id);
      for (const p of due) {
        // eslint-disable-next-line no-console
        console.log(
          `[b2b-follow-up] tenant=${t.id} prospect=${p.id} status=${p.status} business=${p.businessName}`,
        );
      }
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(`[b2b-follow-up] tenant=${t.id} error`, e);
    }
  }
}
