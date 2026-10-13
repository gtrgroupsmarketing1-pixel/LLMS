import { prisma } from '@lmms/db';

export interface WorkloadRow {
  userId: string;
  openTasks: number;
  inProgressTasks: number;
  blockedTasks: number;
  overdueTasks: number;
  minutesLast7Days: number;
}

export async function workloadSnapshot(): Promise<WorkloadRow[]> {
  const users = await prisma.user.groupBy({
    by: ['id'],
    where: { kind: 'AGENCY' },
  });
  const sevenDaysAgo = new Date(Date.now() - 7 * 86_400_000);
  const now = new Date();

  const rows: WorkloadRow[] = [];
  for (const u of users) {
    const [open, inProg, blocked, overdue, times] = await Promise.all([
      prisma.task.count({ where: { assignedTo: u.id, status: 'OPEN' } }),
      prisma.task.count({ where: { assignedTo: u.id, status: 'IN_PROGRESS' } }),
      prisma.task.count({ where: { assignedTo: u.id, status: 'BLOCKED' } }),
      prisma.task.count({
        where: {
          assignedTo: u.id,
          status: { in: ['OPEN', 'IN_PROGRESS', 'BLOCKED'] },
          dueAt: { lt: now },
        },
      }),
      prisma.timeEntry.aggregate({
        where: { userId: u.id, startedAt: { gte: sevenDaysAgo } },
        _sum: { minutes: true },
      }),
    ]);
    rows.push({
      userId: u.id,
      openTasks: open,
      inProgressTasks: inProg,
      blockedTasks: blocked,
      overdueTasks: overdue,
      minutesLast7Days: times._sum.minutes ?? 0,
    });
  }
  return rows.sort((a, b) => b.overdueTasks - a.overdueTasks);
}
