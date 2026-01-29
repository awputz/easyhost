import { NextResponse } from 'next/server'
import { createClient, isSupabaseConfigured } from '@/lib/supabase/server'
import { stripe, isStripeConfigured, getPlanLimits, formatBytes } from '@/lib/stripe'

export async function GET() {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json(getDemoSubscription())
    }

    const supabase = await createClient()
    if (!supabase) {
      return NextResponse.json(getDemoSubscription())
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get profile with subscription info
    const { data: profile } = await supabase
      .from('profiles')
      .select('plan, plan_expires_at, stripe_customer_id, stripe_subscription_id, storage_used_bytes, bandwidth_used_bytes, bandwidth_reset_at')
      .eq('id', user.id)
      .single()

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    const planLimits = getPlanLimits(profile.plan || 'free')

    let subscription = null
    let invoices: Array<{
      id: string
      amount: number
      status: string
      date: string
      pdf: string | null
    }> = []

    // Fetch Stripe subscription details if configured
    if (isStripeConfigured() && stripe && profile.stripe_subscription_id) {
      try {
        const stripeSubscription = await stripe.subscriptions.retrieve(
          profile.stripe_subscription_id
        ) as unknown as {
          status: string
          current_period_end: number
          cancel_at_period_end: boolean
          trial_end: number | null
        }

        subscription = {
          status: stripeSubscription.status,
          currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000).toISOString(),
          cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
          trialEnd: stripeSubscription.trial_end
            ? new Date(stripeSubscription.trial_end * 1000).toISOString()
            : null,
        }

        // Fetch recent invoices
        if (profile.stripe_customer_id) {
          const stripeInvoices = await stripe.invoices.list({
            customer: profile.stripe_customer_id,
            limit: 10,
          })

          invoices = stripeInvoices.data.map((inv) => ({
            id: inv.id,
            amount: inv.amount_paid / 100,
            status: inv.status || 'unknown',
            date: new Date(inv.created * 1000).toISOString(),
            pdf: inv.invoice_pdf || null,
          }))
        }
      } catch (error) {
        console.error('Failed to fetch Stripe subscription:', error)
      }
    }

    return NextResponse.json({
      plan: profile.plan || 'free',
      planName: planLimits.name,
      limits: {
        storage: planLimits.storage,
        storageFormatted: formatBytes(planLimits.storage),
        bandwidth: planLimits.bandwidth,
        bandwidthFormatted: formatBytes(planLimits.bandwidth),
        maxFileSize: planLimits.maxFileSize,
        maxFileSizeFormatted: formatBytes(planLimits.maxFileSize),
        workspaces: planLimits.workspaces,
        teamMembers: planLimits.teamMembers,
      },
      usage: {
        storage: profile.storage_used_bytes || 0,
        storageFormatted: formatBytes(profile.storage_used_bytes || 0),
        storagePercentage: planLimits.storage === Infinity
          ? 0
          : ((profile.storage_used_bytes || 0) / planLimits.storage) * 100,
        bandwidth: profile.bandwidth_used_bytes || 0,
        bandwidthFormatted: formatBytes(profile.bandwidth_used_bytes || 0),
        bandwidthPercentage: planLimits.bandwidth === Infinity
          ? 0
          : ((profile.bandwidth_used_bytes || 0) / planLimits.bandwidth) * 100,
        bandwidthResetAt: profile.bandwidth_reset_at,
      },
      subscription,
      invoices,
      expiresAt: profile.plan_expires_at,
    })
  } catch (error) {
    console.error('Subscription GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

function getDemoSubscription() {
  return {
    plan: 'pro',
    planName: 'Pro',
    limits: {
      storage: 10 * 1024 * 1024 * 1024,
      storageFormatted: '10 GB',
      bandwidth: 50 * 1024 * 1024 * 1024,
      bandwidthFormatted: '50 GB',
      maxFileSize: 100 * 1024 * 1024,
      maxFileSizeFormatted: '100 MB',
      workspaces: 3,
      teamMembers: 3,
    },
    usage: {
      storage: 52428800,
      storageFormatted: '50 MB',
      storagePercentage: 0.5,
      bandwidth: 104857600,
      bandwidthFormatted: '100 MB',
      bandwidthPercentage: 0.2,
      bandwidthResetAt: new Date().toISOString(),
    },
    subscription: {
      status: 'active',
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      cancelAtPeriodEnd: false,
      trialEnd: null,
    },
    invoices: [
      {
        id: 'inv_demo_1',
        amount: 12,
        status: 'paid',
        date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        pdf: null,
      },
      {
        id: 'inv_demo_2',
        amount: 12,
        status: 'paid',
        date: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
        pdf: null,
      },
    ],
    expiresAt: null,
  }
}
