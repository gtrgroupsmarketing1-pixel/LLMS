export function shouldEscalate(rating: number, sentiment: string): boolean {
  return rating <= 2 || sentiment === 'NEGATIVE';
}

export interface EscalationTarget {
  managerInbox: boolean;
  strategistInbox: boolean;
  slaHours: number;
}

export function escalationTargets(): EscalationTarget {
  return {
    managerInbox: true,
    strategistInbox: true,
    slaHours: 24,
  };
}
