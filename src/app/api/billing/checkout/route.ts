import { NextRequest, NextResponse } from 'next/server'
import { createClient, isSupabaseConfigured } from '@/lib/supabase/server'
import { stripe, isStripeConfigured, PLANS } from '@/lib/stripe'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { plan, interval = 'month' } = body

    // Validate plan
    if (!['pro', 'team'].includes(plan)) {
      return NextResponse.json(
        { error: 'Invalid plan' },
        { status: 400 }
      )
    }

    // Check if Stripe is configured
    if (!isStripeConfigured() || !stripe) {
      // Demo mode - redirect to dashboard with success message
      return NextResponse.json({
        redirect: '/dashboard/settings?billing=demo',
        message: 'Stripe not configured - demo mode',
      })
    }

    // Check if Supabase is configured
    if (!isSupabaseConfigured()) {
      return NextResponse.json({
        redirect: '/dashboard/settings?billing=demo',
      })
    }

    const supabase = await createClient()
    if (!supabase) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 500 }
      )
    }

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized', redirect: '/login' },
        { status: 401 }
      )
    }

    // Get user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id, email, full_name')
      .eq('id', user.id)
      .single()

    // Get or create Stripe customer
    let customerId = profile?.stripe_customer_id

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: profile?.email || user.email,
        name: profile?.full_name || undefined,
        metadata: {
          supabase_user_id: user.id,
        },
      })
      customerId = customer.id

      // Save customer ID to profile
      await supabase
        .from('profiles')
        .update({ stripe_customer_id: customerId })
        .eq('id', user.id)
    }

    // Get price ID based on plan and interval
    const planConfig = PLANS[plan as keyof typeof PLANS]
    const priceId = interval === 'year'
      ? (planConfig as { yearlyPriceId?: string }).yearlyPriceId
      : (planConfig as { monthlyPriceId?: string }).monthlyPriceId

    if (!priceId) {
      // If no price ID configured, use demo mode
      return NextResponse.json({
        redirect: '/dashboard/settings?billing=demo&plan=' + plan,
        message: 'Price not configured',
      })
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${request.nextUrl.origin}/dashboard/settings?billing=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${request.nextUrl.origin}/pricing?billing=cancelled`,
      subscription_data: {
        trial_period_days: 14,
        metadata: {
          supabase_user_id: user.id,
          plan,
        },
      },
      metadata: {
        supabase_user_id: user.id,
        plan,
      },
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('Checkout error:', error)
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}
