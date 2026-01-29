'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import {
  Check,
  X,
  Zap,
  Building2,
  Users,
  Crown,
  ArrowRight,
  HelpCircle,
} from 'lucide-react'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'

const plans = [
  {
    name: 'Free',
    description: 'For individuals getting started',
    monthlyPrice: 0,
    yearlyPrice: 0,
    icon: Zap,
    features: [
      { name: '100 MB storage', included: true },
      { name: '1 GB bandwidth/month', included: true },
      { name: '10 MB max file size', included: true },
      { name: 'Unlimited short links', included: true },
      { name: 'Basic analytics', included: true },
      { name: '1 workspace', included: true },
      { name: 'Community support', included: true },
      { name: 'Custom domain', included: false },
      { name: 'Password protection', included: false },
      { name: 'Team members', included: false },
      { name: 'Collections', included: false },
      { name: 'Templates', included: false },
    ],
    cta: 'Get started free',
    popular: false,
  },
  {
    name: 'Pro',
    description: 'For professionals and creators',
    monthlyPrice: 12,
    yearlyPrice: 9,
    icon: Crown,
    features: [
      { name: '10 GB storage', included: true },
      { name: '50 GB bandwidth/month', included: true },
      { name: '100 MB max file size', included: true },
      { name: 'Unlimited short links', included: true },
      { name: 'Advanced analytics', included: true },
      { name: '3 workspaces', included: true },
      { name: 'Email support', included: true },
      { name: 'Custom domain', included: true },
      { name: 'Password protection', included: true },
      { name: 'Team members (up to 3)', included: true },
      { name: 'Collections', included: true },
      { name: 'Templates', included: true },
    ],
    cta: 'Start free trial',
    popular: true,
  },
  {
    name: 'Team',
    description: 'For growing teams and agencies',
    monthlyPrice: 29,
    yearlyPrice: 24,
    icon: Users,
    features: [
      { name: '100 GB storage', included: true },
      { name: 'Unlimited bandwidth', included: true },
      { name: '500 MB max file size', included: true },
      { name: 'Unlimited short links', included: true },
      { name: 'Advanced analytics + exports', included: true },
      { name: '10 workspaces', included: true },
      { name: 'Priority support', included: true },
      { name: 'Custom domain', included: true },
      { name: 'Password protection', included: true },
      { name: 'Team members (up to 10)', included: true },
      { name: 'Collections', included: true },
      { name: 'Templates', included: true },
    ],
    cta: 'Start free trial',
    popular: false,
  },
  {
    name: 'Enterprise',
    description: 'For large organizations',
    monthlyPrice: null,
    yearlyPrice: null,
    icon: Building2,
    features: [
      { name: 'Unlimited storage', included: true },
      { name: 'Unlimited bandwidth', included: true },
      { name: 'Unlimited file size', included: true },
      { name: 'Unlimited short links', included: true },
      { name: 'Custom analytics', included: true },
      { name: 'Unlimited workspaces', included: true },
      { name: 'Dedicated support', included: true },
      { name: 'Custom domains', included: true },
      { name: 'SSO/SAML', included: true },
      { name: 'Unlimited team members', included: true },
      { name: 'SLA guarantee', included: true },
      { name: 'Custom integrations', included: true },
    ],
    cta: 'Contact sales',
    popular: false,
  },
]

const faqs = [
  {
    question: 'Can I change plans later?',
    answer: 'Yes! You can upgrade or downgrade your plan at any time. When upgrading, you\'ll be charged the prorated difference. When downgrading, the credit will be applied to future invoices.',
  },
  {
    question: 'What happens if I exceed my limits?',
    answer: 'We\'ll notify you when you reach 80% and 90% of your limits. On the Free plan, uploads are blocked at 100%. On paid plans, you can continue with overage charges or upgrade your plan.',
  },
  {
    question: 'Is there a free trial?',
    answer: 'Yes! Pro and Team plans come with a 14-day free trial. No credit card required to start. You\'ll only be charged when the trial ends if you decide to continue.',
  },
  {
    question: 'What payment methods do you accept?',
    answer: 'We accept all major credit cards (Visa, Mastercard, American Express) and PayPal. Enterprise customers can also pay via invoice.',
  },
  {
    question: 'Can I cancel anytime?',
    answer: 'Absolutely. You can cancel your subscription at any time from your account settings. You\'ll retain access until the end of your billing period.',
  },
  {
    question: 'Do you offer refunds?',
    answer: 'We offer a 30-day money-back guarantee on all paid plans. If you\'re not satisfied, contact us within 30 days for a full refund.',
  },
  {
    question: 'What counts toward bandwidth?',
    answer: 'Bandwidth includes all file downloads and views from your public links, embeds, and API access. Uploads and dashboard usage don\'t count toward your bandwidth limit.',
  },
  {
    question: 'Do you offer discounts for nonprofits?',
    answer: 'Yes! We offer 50% off for registered nonprofits and educational institutions. Contact us with proof of status to receive your discount.',
  },
]

export default function PricingPage() {
  const [annual, setAnnual] = useState(true)

  const handleSelectPlan = async (planName: string) => {
    if (planName === 'Free') {
      window.location.href = '/signup'
      return
    }

    if (planName === 'Enterprise') {
      window.location.href = 'mailto:sales@pagelink.com?subject=Enterprise%20Plan%20Inquiry'
      return
    }

    // Redirect to checkout
    try {
      const response = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan: planName.toLowerCase(),
          interval: annual ? 'year' : 'month',
        }),
      })

      const data = await response.json()

      if (data.url) {
        window.location.href = data.url
      } else if (data.redirect) {
        window.location.href = data.redirect
      }
    } catch (error) {
      console.error('Checkout error:', error)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold">
            Pagelink
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost">Sign in</Button>
            </Link>
            <Link href="/signup">
              <Button>Get started</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-16">
        {/* Hero */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold mb-4">
            Simple, transparent pricing
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Choose the perfect plan for your needs. Start free and upgrade as you grow.
          </p>

          {/* Billing toggle */}
          <div className="flex items-center justify-center gap-3">
            <Label htmlFor="billing-toggle" className={!annual ? 'font-semibold' : 'text-muted-foreground'}>
              Monthly
            </Label>
            <Switch
              id="billing-toggle"
              checked={annual}
              onCheckedChange={setAnnual}
            />
            <Label htmlFor="billing-toggle" className={annual ? 'font-semibold' : 'text-muted-foreground'}>
              Annual
            </Label>
            {annual && (
              <Badge variant="secondary" className="ml-2">
                Save 25%
              </Badge>
            )}
          </div>
        </div>

        {/* Pricing cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
          {plans.map((plan) => {
            const Icon = plan.icon
            const price = annual ? plan.yearlyPrice : plan.monthlyPrice

            return (
              <Card
                key={plan.name}
                className={`relative ${plan.popular ? 'border-primary shadow-lg scale-105' : ''}`}
              >
                {plan.popular && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">
                    Most popular
                  </Badge>
                )}
                <CardHeader>
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`p-2 rounded-lg ${plan.popular ? 'bg-primary/10' : 'bg-muted'}`}>
                      <Icon className={`h-5 w-5 ${plan.popular ? 'text-primary' : ''}`} />
                    </div>
                    <CardTitle>{plan.name}</CardTitle>
                  </div>
                  <CardDescription>{plan.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="mb-6">
                    {price !== null ? (
                      <div className="flex items-baseline gap-1">
                        <span className="text-4xl font-bold">${price}</span>
                        <span className="text-muted-foreground">/{annual ? 'mo' : 'mo'}</span>
                      </div>
                    ) : (
                      <div className="text-4xl font-bold">Custom</div>
                    )}
                    {annual && price !== null && price > 0 && (
                      <p className="text-sm text-muted-foreground mt-1">
                        Billed ${price * 12}/year
                      </p>
                    )}
                  </div>

                  <ul className="space-y-3">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-2">
                        {feature.included ? (
                          <Check className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                        ) : (
                          <X className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                        )}
                        <span className={feature.included ? '' : 'text-muted-foreground'}>
                          {feature.name}
                        </span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button
                    className="w-full"
                    variant={plan.popular ? 'default' : 'outline'}
                    onClick={() => handleSelectPlan(plan.name)}
                  >
                    {plan.cta}
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </CardFooter>
              </Card>
            )
          })}
        </div>

        {/* FAQ */}
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-8 flex items-center justify-center gap-2">
            <HelpCircle className="h-6 w-6" />
            Frequently asked questions
          </h2>
          <Card>
            <CardContent className="pt-6">
              <Accordion type="single" collapsible className="w-full">
                {faqs.map((faq, index) => (
                  <AccordionItem key={index} value={`item-${index}`}>
                    <AccordionTrigger className="text-left">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        </div>

        {/* CTA */}
        <div className="text-center mt-20">
          <h2 className="text-2xl font-bold mb-4">Ready to get started?</h2>
          <p className="text-muted-foreground mb-6">
            Join thousands of users who trust Pagelink for their document hosting needs.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link href="/signup">
              <Button size="lg">
                Start free trial
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button size="lg" variant="outline">
                View demo
              </Button>
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t mt-20 py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Pagelink. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
