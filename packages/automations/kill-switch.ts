import { prisma } from '@lmms/db';

export async function killAutomation(
  tenantId: string,
  automationId: string,
  actorId: string,
  reason?: string,
) {
  await prisma.automationKillSwitch.upsert({
    where: { tenantId_automationId: { tenantId, automationId } },
    update: { killedAt: new Date(), killedBy: actorId, reason },
    create: { tenantId, automationId, killedBy: actorId, reason },
  });
  await prisma.automation.update({
    where: { id: automationId },
    data: { status: 'KILLED' },
  });
  return { killed: true };
}

export async function reviveAutomation(tenantId: string, automationId: string) {
  await prisma.automationKillSwitch.deleteMany({
    where: { tenantId, automationId },
  });
  await prisma.automation.update({
    where: { id: automationId },
    data: { status: 'ACTIVE' },
  });
  return { revived: true };
}

export async function isKilled(tenantId: string, automationId: string): Promise<boolean> {
  const row = await prisma.automationKillSwitch.findUnique({
    where: { tenantId_automationId: { tenantId, automationId } },
  });
  return !!row;
}
