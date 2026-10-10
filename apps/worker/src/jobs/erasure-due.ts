import { prisma } from '@lmms/db';

export async function erasureDueJob() {
  const soon = await prisma.erasureRequest.findMany({
    where: {
      status: { in: ['REQUESTED', 'IN_REVIEW'] },
      dueAt: { lt: new Date(Date.now() + 3 * 86_400_000) },
    },
  });
  for (const r of soon) {
    // eslint-disable-next-line no-console
    console.warn(
      `[erasure-due] tenant=${r.tenantId} erasure=${r.id} due=${r.dueAt.toISOString()}`,
    );
  }
}
