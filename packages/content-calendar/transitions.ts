export type CardStatus =
  | 'DRAFT'
  | 'INTERNAL_REVIEW'
  | 'CLIENT_REVIEW'
  | 'APPROVED'
  | 'SCHEDULED'
  | 'LIVE'
  | 'COMPLETED'
  | 'REJECTED';

const ALLOWED: Record<CardStatus, CardStatus[]> = {
  DRAFT: ['INTERNAL_REVIEW'],
  INTERNAL_REVIEW: ['CLIENT_REVIEW', 'DRAFT'],
  CLIENT_REVIEW: ['APPROVED', 'DRAFT', 'REJECTED'],
  APPROVED: ['SCHEDULED'],
  SCHEDULED: ['LIVE', 'DRAFT'],
  LIVE: ['COMPLETED'],
  COMPLETED: [],
  REJECTED: ['DRAFT'],
};

export function canTransition(from: CardStatus, to: CardStatus): boolean {
  return (ALLOWED[from] ?? []).includes(to);
}

export function assertTransition(from: CardStatus, to: CardStatus): void {
  if (!canTransition(from, to)) {
    throw new Error(`invalid_transition:${from}->${to}`);
  }
}

export function canReachLive(from: CardStatus): boolean {
  if (from === 'LIVE') return true;
  if (from === 'COMPLETED') return true;
  if (from === 'SCHEDULED') return true;
  if (from === 'APPROVED') return true;
  return false;
}
