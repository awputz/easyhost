import { NextRequest, NextResponse } from 'next/server'
import { stripe, isStripeConfigured } from '@/lib/stripe'
import { createClient } from '@supabase/supabase-js'

// Use service role key for webhooks (bypasses RLS)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

function getAdminClient() {
  if (!supabaseUrl || !supabaseServiceKey) return null
  return createClient(supabaseUrl, supabaseServiceKey)
}

export async function POST(request: NextRequest) {
  if (!isStripeConfigured() || !stripe) {
    return NextResponse.json(
      { error: 'Stripe not configured' },
      { status: 400 }
    )
  }

  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json(
      { error: 'Missing signature' },
      { status: 400 }
    )
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!webhookSecret) {
    console.error('STRIPE_WEBHOOK_SECRET not configured')
    return NextResponse.json(
      { error: 'Webhook secret not configured' },
      { status: 500 }
    )
  }

  let event

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 400 }
    )
  }

  const supabase = getAdminClient()
  if (!supabase) {
    console.error('Supabase admin client not configured')
    return NextResponse.json(
      { error: 'Database not configured' },
      { status: 500 }
    )
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object
        const userId = session.metadata?.supabase_user_id
        const plan = session.metadata?.plan

        if (userId && plan) {
          await supabase
            .from('profiles')
            .update({
              plan,
              stripe_subscription_id: session.subscription as string,
            })
            .eq('id', userId)

          console.log(`User ${userId} upgraded to ${plan}`)
        }
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as unknown as {
          metadata?: { supabase_user_id?: string; plan?: string }
          status: string
          current_period_end?: number
        }
        const userId = subscription.metadata?.supabase_user_id

        if (userId) {
          const plan = subscription.metadata?.plan || 'pro'
          const status = subscription.status

          if (status === 'active' || status === 'trialing') {
            await supabase
              .from('profiles')
              .update({
                plan,
                plan_expires_at: subscription.current_period_end
                  ? new Date(subscription.current_period_end * 1000).toISOString()
                  : null,
              })
              .eq('id', userId)
          }

          console.log(`Subscription updated for user ${userId}: ${status}`)
        }
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object
        const userId = subscription.metadata?.supabase_user_id

        if (userId) {
          // Downgrade to free plan
          await supabase
            .from('profiles')
            .update({
              plan: 'free',
              plan_expires_at: null,
              stripe_subscription_id: null,
            })
            .eq('id', userId)

          console.log(`User ${userId} downgraded to free`)
        }
        break
      }

      case 'invoice.paid': {
        const invoice = event.data.object
        const customerId = invoice.customer as string

        // Find user by Stripe customer ID
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('stripe_customer_id', customerId)
          .single()

        if (profile) {
          console.log(`Invoice paid for user ${profile.id}`)
        }
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object
        const customerId = invoice.customer as string

        // Find user by Stripe customer ID
        const { data: profile } = await supabase
          .from('profiles')
          .select('id, email')
          .eq('stripe_customer_id', customerId)
          .single()

        if (profile) {
          console.log(`Payment failed for user ${profile.id} (${profile.email})`)
          // TODO: Send notification email about payment failure
        }
        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook handler error:', error)
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    )
  }
}
