import Stripe from 'stripe'

// Initialize Stripe with secret key
const stripeSecretKey = process.env.STRIPE_SECRET_KEY

export const stripe = stripeSecretKey
  ? new Stripe(stripeSecretKey, {
      apiVersion: '2026-01-28.clover',
      typescript: true,
    })
  : null

export function isStripeConfigured(): boolean {
  return Boolean(stripeSecretKey)
}

// Plan configuration
export const PLANS = {
  free: {
    name: 'Free',
    storage: 100 * 1024 * 1024, // 100 MB
    bandwidth: 1024 * 1024 * 1024, // 1 GB
    maxFileSize: 10 * 1024 * 1024, // 10 MB
    workspaces: 1,
    teamMembers: 1,
  },
  pro: {
    name: 'Pro',
    storage: 10 * 1024 * 1024 * 1024, // 10 GB
    bandwidth: 50 * 1024 * 1024 * 1024, // 50 GB
    maxFileSize: 100 * 1024 * 1024, // 100 MB
    workspaces: 3,
    teamMembers: 3,
    monthlyPriceId: process.env.STRIPE_PRO_MONTHLY_PRICE_ID,
    yearlyPriceId: process.env.STRIPE_PRO_YEARLY_PRICE_ID,
  },
  team: {
    name: 'Team',
    storage: 100 * 1024 * 1024 * 1024, // 100 GB
    bandwidth: Infinity,
    maxFileSize: 500 * 1024 * 1024, // 500 MB
    workspaces: 10,
    teamMembers: 10,
    monthlyPriceId: process.env.STRIPE_TEAM_MONTHLY_PRICE_ID,
    yearlyPriceId: process.env.STRIPE_TEAM_YEARLY_PRICE_ID,
  },
  enterprise: {
    name: 'Enterprise',
    storage: Infinity,
    bandwidth: Infinity,
    maxFileSize: Infinity,
    workspaces: Infinity,
    teamMembers: Infinity,
  },
} as const

export type PlanName = keyof typeof PLANS

export function getPlanLimits(plan: string) {
  const planKey = plan.toLowerCase() as PlanName
  return PLANS[planKey] || PLANS.free
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  if (bytes === Infinity) return 'Unlimited'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

export function getUsagePercentage(used: number, limit: number): number {
  if (limit === Infinity) return 0
  return Math.min(100, (used / limit) * 100)
}

export function isOverLimit(used: number, limit: number): boolean {
  if (limit === Infinity) return false
  return used >= limit
}

export function isNearLimit(used: number, limit: number, threshold = 0.8): boolean {
  if (limit === Infinity) return false
  return used >= limit * threshold
}
