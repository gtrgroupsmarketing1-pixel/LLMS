export interface DunningStep {
  daysPastDue: number;
  kind: 'REMINDER' | 'ESCALATION' | 'FINAL_NOTICE' | 'SUSPENSION_WARNING';
  label: string;
}

export const DUNNING_SCHEDULE: DunningStep[] = [
  { daysPastDue: 1,  kind: 'REMINDER',           label: 'First reminder' },
  { daysPastDue: 5,  kind: 'REMINDER',           label: 'Second reminder' },
  { daysPastDue: 10, kind: 'ESCALATION',         label: 'Escalate to account manager' },
  { daysPastDue: 15, kind: 'FINAL_NOTICE',       label: 'Final notice' },
  { daysPastDue: 30, kind: 'SUSPENSION_WARNING', label: 'Account suspension warning' },
];

export interface DunningStatus {
  daysPastDue: number;
  nextStep: DunningStep | null;
  stepsDue: DunningStep[];
}

export function computeDunning(dueDate: Date, now: Date = new Date()): DunningStatus {
  const ms = now.getTime() - dueDate.getTime();
  if (ms <= 0) return { daysPastDue: 0, nextStep: DUNNING_SCHEDULE[0] ?? null, stepsDue: [] };
  const daysPastDue = Math.floor(ms / 86_400_000);
  const stepsDue = DUNNING_SCHEDULE.filter((s) => s.daysPastDue <= daysPastDue);
  const nextStep = DUNNING_SCHEDULE.find((s) => s.daysPastDue > daysPastDue) ?? null;
  return { daysPastDue, nextStep, stepsDue };
}
