import { prisma } from '@lmms/db';

export interface FrequencyCheckInput {
  tenantId: string;
  customerId: string;
  capHours: number;
}

export interface FrequencyCheckResult {
  allowed: boolean;
  reason?: string;
  lastSendAt?: Date;
}

export async function checkFrequency(
  input: FrequencyCheckInput,
): Promise<FrequencyCheckResult> {
  const ledger = await prisma.frequencyLedger.findUnique({
    where: {
      tenantId_customerId: {
        tenantId: input.tenantId,
        customerId: input.customerId,
      },
    },
  });
  if (!ledger) return { allowed: true };
  const since = Date.now() - ledger.lastSendAt.getTime();
  if (since < input.capHours * 3_600_000) {
    return { allowed: false, reason: 'frequency_cap', lastSendAt: ledger.lastSendAt };
  }
  return { allowed: true, lastSendAt: ledger.lastSendAt };
}

export async function recordSend(tenantId: string, customerId: string) {
  const now = new Date();
  await prisma.frequencyLedger.upsert({
    where: { tenantId_customerId: { tenantId, customerId } },
    update: { lastSendAt: now, count24h: { increment: 1 } },
    create: { tenantId, customerId, lastSendAt: now, count24h: 1 },
  });
}
