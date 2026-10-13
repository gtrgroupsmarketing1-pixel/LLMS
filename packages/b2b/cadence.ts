import type { ProspectStatus } from './states';
import { isFollowUpAllowed } from './states';

export interface CadenceConfig {
  /** Days between follow-ups, ordered from first to last. */
  days: number[];
}

export const DEFAULT_CADENCE: CadenceConfig = {
  days: [3, 7, 14, 30],
};

export interface CadenceCheckInput {
  status: ProspectStatus;
  lastContactAt: Date | null;
  followUpIndex: number;
  now?: Date;
}

export interface CadenceCheckResult {
  allowed: boolean;
  reason?: string;
  dueAt?: Date;
}

export function checkCadence(input: CadenceCheckInput): CadenceCheckResult {
  if (!isFollowUpAllowed(input.status)) {
    return { allowed: false, reason: 'terminal_status' };
  }
  if (!input.lastContactAt) {
    return { allowed: true };
  }
  const step = DEFAULT_CADENCE.days[input.followUpIndex] ?? null;
  if (step === null) {
    return { allowed: false, reason: 'cadence_exhausted' };
  }
  const now = input.now ?? new Date();
  const dueAt = new Date(
    input.lastContactAt.getTime() + step * 86_400_000,
  );
  if (now < dueAt) {
    return { allowed: false, reason: 'not_yet_due', dueAt };
  }
  return { allowed: true, dueAt };
}
