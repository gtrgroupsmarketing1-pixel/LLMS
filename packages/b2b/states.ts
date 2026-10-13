export type ProspectStatus =
  | 'NEW'
  | 'CONTACTED'
  | 'REPLIED'
  | 'MEETING'
  | 'PROPOSAL'
  | 'NEGOTIATION'
  | 'WON'
  | 'LOST';

const ALLOWED: Record<ProspectStatus, ProspectStatus[]> = {
  NEW: ['CONTACTED', 'LOST'],
  CONTACTED: ['REPLIED', 'MEETING', 'LOST'],
  REPLIED: ['MEETING', 'PROPOSAL', 'LOST'],
  MEETING: ['PROPOSAL', 'NEGOTIATION', 'LOST'],
  PROPOSAL: ['NEGOTIATION', 'WON', 'LOST'],
  NEGOTIATION: ['WON', 'LOST'],
  WON: [],
  LOST: ['NEW'],
};

export function canTransition(from: ProspectStatus, to: ProspectStatus): boolean {
  return (ALLOWED[from] ?? []).includes(to);
}

export function assertTransition(from: ProspectStatus, to: ProspectStatus): void {
  if (!canTransition(from, to)) {
    throw new Error(`invalid_prospect_transition:${from}->${to}`);
  }
}

export function isTerminal(status: ProspectStatus): boolean {
  return status === 'WON' || status === 'LOST';
}

export function isFollowUpAllowed(status: ProspectStatus): boolean {
  return status !== 'WON' && status !== 'LOST';
}
