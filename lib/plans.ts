/**
 * API Pulse Pricing Plans Configuration
 * 
 * Defines the limits and features for each subscription tier
 */

export const PLANS = {
  FREE: {
    id: 'free',
    name: 'Free',
    price: 0,
    priceId: null,
    limits: {
      maxTasks: 2,
      minIntervalMinutes: 60, // 1 hour
      maxRunsPerMonth: 100,
      logRetentionDays: 7,
    },
    features: {
      dashboard: true,
      emailNotifications: false,
slackNotifications: false,
      smsNotifications: false,
      apiAccess: false,
      prioritySupport: false,
    },
    description: 'Perfect for personal projects and testing',
    cta: 'Start Free',
  },
  
  STARTER: {
    id: 'starter',
    name: 'Starter',
    price: 9,
    priceId: process.env.NEXT_PUBLIC_STRIPE_STARTER_PRICE_ID,
    limits: {
      maxTasks: 10,
      minIntervalMinutes: 15, // 15 minutes
      maxRunsPerMonth: 2000,
      logRetentionDays: 14,
    },
    features: {
      dashboard: true,
      emailNotifications: false,
      slackNotifications: true,
      discordNotifications: true,
      smsNotifications: false,
      apiAccess: false,
      prioritySupport: false,
    },
    description: 'Great for small teams and startups',
    cta: 'Start 14-Day Trial',
    popular: true,
  },
  
  PRO: {
id: 'pro',
    name: 'Pro',
    price: 15,
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID,
    limits: {
      maxTasks: 50,
      minIntervalMinutes: 5, // 5 minutes
      maxRunsPerMonth: 5000,
      logRetentionDays: 30,
    },
    features: {
      dashboard: true,
      emailNotifications: true,
      slackNotifications: true,
      discordNotifications: true,
      smsNotifications: false,
      apiAccess: true,
      prioritySupport: true,
    },
    description: 'Full-featured for production monitoring',
    cta: 'Start 14-Day Trial',
  },
};

/**
 * Get plan by ID
 */
export function getPlan(planId: string) {
  const plan = Object.values(PLANS).find(p => p.id === planId);
  return plan || PLANS.FREE;
}

/**
 * Get plan limits for a user
 */
export function getPlanLimits(planId: string) {
  return getPlan(planId).limits;
}

/**
 * Get plan features for a user
 */
export function getPlanFeatures(planId: string) {
  return getPlan(planId).features;
}

/**
 * Check if user can create more tasks
 */
export function canCreateTask(currentTaskCount: number, planId: string): boolean {
  const limits = getPlanLimits(planId);
  return currentTaskCount < limits.maxTasks;
}

/**
 * Check if interval is allowed for plan
 */
export function isIntervalAllowed(intervalMinutes: number, planId: string): boolean {
  const limits = getPlanLimits(planId);
  return intervalMinutes >= limits.minIntervalMinutes;
}

/**
 * Check if user has reached monthly run limit
 */
export function hasReachedRunLimit(currentRuns: number, planId: string): boolean {
  const limits = getPlanLimits(planId);
return currentRuns >= limits.maxRunsPerMonth;
}

/**
 * Get available intervals for plan
 */
export function getAvailableIntervals(planId: string) {
  const limits = getPlanLimits(planId);
  const minMinutes = limits.minIntervalMinutes;
  
  const allIntervals = [
    { value: '5_minutes', label: 'Every 5 minutes', minutes: 5 },
    { value: '15_minutes', label: 'Every 15 minutes', minutes: 15 },
    { value: '30_minutes', label: 'Every 30 minutes', minutes: 30 },
    { value: 'hourly', label: 'Every hour', minutes: 60 },
  { value: 'every_6_hours', label: 'Every 6 hours', minutes: 360 },
    { value: 'daily', label: 'Every day', minutes: 1440 },
  ];
  
  return allIntervals.filter(interval => interval.minutes >= minMinutes);
}

/**
 * Feature comparison for pricing page
 */
export const FEATURE_COMPARISON = [
  {
    category: 'Monitoring',
  features: [
      { name: 'API Tasks', free: '2', starter: '10', pro: '50' },
      { name: 'Check Interval', free: '1 hour', starter: '15 min', pro: '5 min' },
      { name: 'Monthly Runs', free: '100', starter: '2,000', pro: '5,000' },
      { name: 'Log Retention', free: '7 days', starter: '14 days', pro: '30 days' },
  ],
  },
  {
    category: 'Notifications',
    features: [
    { name: 'Dashboard View', free: true, starter: true, pro: true },
      { name: 'Email Alerts', free: false, starter: false, pro: true },
      { name: 'Slack Integration', free: false, starter: true, pro: true },
      { name: 'Discord Integration', free: false, starter: true, pro: true },
    ],
  },
  {
    category: 'Advanced Features',
    features: [
    { name: 'API Access', free: false, starter: false, pro: true },
{ name: 'Priority Support', free: false, starter: false, pro: true },
      { name: 'Custom Webhooks', free: false, starter: false, pro: true },
    ],
  },
];
