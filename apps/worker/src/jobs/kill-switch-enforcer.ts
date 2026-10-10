import { prisma } from '@lmms/db';

export async function killSwitchEnforcerJob() {
  const killed = await prisma.automation.findMany({ where: { status: 'KILLED' } });
  for (const a of killed) {
    const runs = await prisma.automationRun.findMany({
      where: { automationId: a.id, status: 'ENTERED' },
    });
    for (const r of runs) {
      await prisma.automationRun.update({
        where: { id: r.id },
        data: {
          status: 'EXITED',
          exitedAt: new Date(),
          exitReason: 'kill_switch',
        },
      });
    }
  }
}
