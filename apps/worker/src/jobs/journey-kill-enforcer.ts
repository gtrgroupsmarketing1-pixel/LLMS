import { prisma } from '@lmms/db';

export async function journeyKillEnforcerJob() {
  const killed = await prisma.journeyKillSwitch.findMany();
  for (const k of killed) {
    const activeRuns = await prisma.journeyRun.findMany({
      where: {
        journeyId: k.journeyId,
        status: { in: ['ENTERED', 'RUNNING'] },
      },
    });
    for (const r of activeRuns) {
      await prisma.journeyRun.update({
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
