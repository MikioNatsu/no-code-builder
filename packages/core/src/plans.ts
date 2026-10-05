export const PLAN_IDS = ["free"] as const;
export type PlanId = (typeof PLAN_IDS)[number];

export interface PlanLimits {
  maxBots: number;
  maxEndUsersPerBot: number;
}

// Paid tiers are still open (docs/PLAN.md §8); add them here when decided.
export const PLANS: Record<PlanId, PlanLimits> = {
  free: { maxBots: 1, maxEndUsersPerBot: 500 },
};

export function canCreateBot(plan: PlanId, currentBotCount: number): boolean {
  return currentBotCount < PLANS[plan].maxBots;
}

export function canAcceptNewEndUser(plan: PlanId, currentEndUserCount: number): boolean {
  return currentEndUserCount < PLANS[plan].maxEndUsersPerBot;
}
