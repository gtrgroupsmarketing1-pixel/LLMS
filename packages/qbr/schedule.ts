import { prisma } from '@lmms/db';

export interface DueSchedule {
  id: string;
  tenantId: string;
  kind: string;
  channel: string;
  recipient: string;
}

/**
 * Returns schedules whose cadence matches the current time. Pure check —
 * does not run anything. Worker uses it to decide what to dispatch.
 */
export async function dueSchedules(now: Date = new Date()): Promise<DueSchedule[]> {
  const schedules = await prisma.reportSchedule.findMany({
    where: { enabled: true },
  });
  const result: DueSchedule[] = [];
  for (const s of schedules) {
    if (s.hourUtc !== now.getUTCHours()) continue;
    if (s.kind === 'WEEKLY_SUMMARY') {
      if (s.dayOfWeek === now.getUTCDay()) {
        result.push({ id: s.id, tenantId: s.tenantId, kind: s.kind, channel: s.channel, recipient: s.recipient });
      }
    } else if (s.kind === 'MONTHLY_REPORT') {
      if (s.dayOfMonth === now.getUTCDate()) {
        result.push({ id: s.id, tenantId: s.tenantId, kind: s.kind, channel: s.channel, recipient: s.recipient });
      }
    } else if (s.kind === 'QUARTERLY_QBR') {
      const isFirstOfQuarter =
        now.getUTCDate() === 1 && now.getUTCMonth() % 3 === 0;
      if (isFirstOfQuarter) {
        result.push({ id: s.id, tenantId: s.tenantId, kind: s.kind, channel: s.channel, recipient: s.recipient });
      }
    }
  }
  return result;
}

export async function markScheduleRun(id: string, status: string) {
  return prisma.reportSchedule.update({
    where: { id },
    data: { lastRunAt: new Date(), lastRunStatus: status },
  });
}

export async function upsertSchedule(opts: {
  tenantId: string;
  kind: 'WEEKLY_SUMMARY' | 'MONTHLY_REPORT' | 'QUARTERLY_QBR';
  channel: 'WHATSAPP' | 'EMAIL' | 'PORTAL';
  recipient: string;
  dayOfWeek?: number;
  dayOfMonth?: number;
  hourUtc?: number;
}) {
  return prisma.reportSchedule.upsert({
    where: {
      tenantId_kind_channel_recipient: {
        tenantId: opts.tenantId,
        kind: opts.kind,
        channel: opts.channel,
        recipient: opts.recipient,
      },
    },
    update: {
      dayOfWeek: opts.dayOfWeek ?? null,
      dayOfMonth: opts.dayOfMonth ?? null,
      hourUtc: opts.hourUtc ?? 9,
      enabled: true,
    },
    create: {
      tenantId: opts.tenantId,
      kind: opts.kind,
      channel: opts.channel,
      recipient: opts.recipient,
      dayOfWeek: opts.dayOfWeek ?? null,
      dayOfMonth: opts.dayOfMonth ?? null,
      hourUtc: opts.hourUtc ?? 9,
    },
  });
}

export async function listSchedules(tenantId: string) {
  return prisma.reportSchedule.findMany({
    where: { tenantId },
    orderBy: { kind: 'asc' },
  });
}
