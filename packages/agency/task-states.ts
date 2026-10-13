export type TaskStatus = 'OPEN' | 'IN_PROGRESS' | 'BLOCKED' | 'DONE' | 'CANCELLED';

const ALLOWED: Record<TaskStatus, TaskStatus[]> = {
  OPEN: ['IN_PROGRESS', 'BLOCKED', 'DONE', 'CANCELLED'],
  IN_PROGRESS: ['BLOCKED', 'DONE', 'CANCELLED'],
  BLOCKED: ['IN_PROGRESS', 'CANCELLED'],
  DONE: ['OPEN'],
  CANCELLED: ['OPEN'],
};

export function canTransition(from: TaskStatus, to: TaskStatus): boolean {
  return (ALLOWED[from] ?? []).includes(to);
}

export function assertTransition(from: TaskStatus, to: TaskStatus): void {
  if (!canTransition(from, to)) {
    throw new Error(`invalid_task_transition:${from}->${to}`);
  }
}

export function isTerminal(status: TaskStatus): boolean {
  return status === 'DONE' || status === 'CANCELLED';
}
