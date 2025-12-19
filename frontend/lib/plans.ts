export const PLANS = {
  FREE: {
  id: 'free',
    name: 'Free',
    price: 0,
    priceId: null,
    limits: {
   maxTasks: 2,
      minIntervalMinutes: 60, // 1 hour
      logRetentionDays: 7,
    },
  },
  STARTER: {
    id: 'starter',
    name: 'Starter',
    price: 9,
    priceId: process.env.NEXT_PUBLIC_STRIPE_STARTER_PRICE_ID,
    limits: {
      maxTasks: 10,
      minIntervalMinutes: 15, // 15 minutes
      logRetentionDays: 14,
    },
  },
  PRO: {
    id: 'pro',
    name: 'Pro',
    price: 15,
  priceId: process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID,
    limits: {
      maxTasks: 50,
  minIntervalMinutes: 5, // 5 minutes
      logRetentionDays: 30,
    },
  },
}

/**
 * Check if user has reached monthly run limit
 */
export function hasReachedRunLimit(currentRuns: number, planId: string): boolean {
  // No run limits anymore - unlimited runs for all plans
  return false;
}