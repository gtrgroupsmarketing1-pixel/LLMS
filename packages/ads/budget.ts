export const BUDGET_SHIFT_APPROVAL_THRESHOLD = 20;

export interface BudgetShiftCheck {
  allowedAuto: boolean;
  requiresApproval: boolean;
  percentChange: number;
}

export function evaluateBudgetShift(
  currentDailyBudget: number,
  newDailyBudget: number,
): BudgetShiftCheck {
  if (currentDailyBudget <= 0) {
    return { allowedAuto: false, requiresApproval: true, percentChange: 100 };
  }
  const percentChange =
    Math.round(((newDailyBudget - currentDailyBudget) / currentDailyBudget) * 10000) / 100;
  const absChange = Math.abs(percentChange);
  if (absChange <= BUDGET_SHIFT_APPROVAL_THRESHOLD) {
    return { allowedAuto: true, requiresApproval: false, percentChange };
  }
  return { allowedAuto: false, requiresApproval: true, percentChange };
}

export function enforceDailyCap(
  proposedSpend: number,
  dailyCap: number,
): { allowed: boolean; reason?: string } {
  if (proposedSpend > dailyCap) {
    return { allowed: false, reason: 'daily_cap_exceeded' };
  }
  return { allowed: true };
}
