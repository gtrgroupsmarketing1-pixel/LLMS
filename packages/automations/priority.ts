export interface Candidate {
  automationId: string;
  customerId: string;
  priority: number;
  runId: string;
}

export function resolvePriority(candidates: Candidate[]): Candidate | null {
  if (!candidates.length) return null;
  return candidates.slice().sort((a, b) => a.priority - b.priority)[0];
}
