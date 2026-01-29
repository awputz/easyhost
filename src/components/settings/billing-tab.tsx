'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  CreditCard,
  Download,
  ExternalLink,
  HardDrive,
  Gauge,
  AlertTriangle,
  CheckCircle,
  Clock,
  Crown,
} from 'lucide-react'
import { toast } from 'sonner'
import { format, parseISO } from 'date-fns'

interface SubscriptionData {
  plan: string
  planName: string
  limits: {
    storage: number
    storageFormatted: string
    bandwidth: number
    bandwidthFormatted: string
    maxFileSize: number
    maxFileSizeFormatted: string
    workspaces: number
    teamMembers: number
  }
  usage: {
    storage: number
    storageFormatted: string
    storagePercentage: number
    bandwidth: number
    bandwidthFormatted: string
    bandwidthPercentage: number
    bandwidthResetAt: string
  }
  subscription: {
    status: string
    currentPeriodEnd: string
    cancelAtPeriodEnd: boolean
    trialEnd: string | null
  } | null
  invoices: Array<{
    id: string
    amount: number
    status: string
    date: string
    pdf: string | null
  }>
  expiresAt: string | null
}

export function BillingTab() {
  const [data, setData] = useState<SubscriptionData | null>(null)
  const [loading, setLoading] = useState(true)
  const [portalLoading, setPortalLoading] = useState(false)

  useEffect(() => {
    fetchSubscription()
  }, [])

  const fetchSubscription = async () => {
    try {
      const response = await fetch('/api/billing/subscription')
      if (response.ok) {
        const result = await response.json()
        setData(result)
      }
    } catch (error) {
      console.error('Failed to fetch subscription:', error)
    } finally {
      setLoading(false)
    }
  }

  const openPortal = async () => {
    setPortalLoading(true)
    try {
      const response = await fetch('/api/billing/portal', { method: 'POST' })
      const result = await response.json()

      if (result.url) {
        window.location.href = result.url
      } else if (result.redirect) {
        toast.info(result.message || 'Billing portal not available in demo mode')
      } else {
        toast.error('Failed to open billing portal')
      }
    } catch (error) {
      console.error('Portal error:', error)
      toast.error('Failed to open billing portal')
    } finally {
      setPortalLoading(false)
    }
  }

  const openPricing = () => {
    window.open('/pricing', '_blank')
  }

  if (loading) {
    return <BillingSkeleton />
  }

  if (!data) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Failed to load billing information
        </CardContent>
      </Card>
    )
  }

  const isTrialing = data.subscription?.trialEnd && new Date(data.subscription.trialEnd) > new Date()
  const isCancelled = data.subscription?.cancelAtPeriodEnd
  const storageWarning = data.usage.storagePercentage >= 80
  const bandwidthWarning = data.usage.bandwidthPercentage >= 80

  return (
    <div className="space-y-6">
      {/* Current Plan */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Crown className="h-5 w-5" />
                Current Plan
              </CardTitle>
              <CardDescription>
                Manage your subscription and billing
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {data.plan !== 'free' && (
                <Button variant="outline" onClick={openPortal} disabled={portalLoading}>
                  <CreditCard className="h-4 w-4 mr-2" />
                  {portalLoading ? 'Loading...' : 'Manage billing'}
                </Button>
              )}
              <Button onClick={openPricing}>
                <ExternalLink className="h-4 w-4 mr-2" />
                {data.plan === 'free' ? 'Upgrade' : 'Change plan'}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-4">
            <Badge variant="secondary" className="text-lg px-4 py-1 capitalize">
              {data.planName}
            </Badge>
            {isTrialing && (
              <Badge variant="outline" className="gap-1">
                <Clock className="h-3 w-3" />
                Trial ends {format(parseISO(data.subscription!.trialEnd!), 'MMM d')}
              </Badge>
            )}
            {isCancelled && (
              <Badge variant="destructive" className="gap-1">
                <AlertTriangle className="h-3 w-3" />
                Cancels {format(parseISO(data.subscription!.currentPeriodEnd), 'MMM d')}
              </Badge>
            )}
            {data.subscription?.status === 'active' && !isCancelled && (
              <Badge variant="outline" className="gap-1 text-green-600 border-green-600">
                <CheckCircle className="h-3 w-3" />
                Active
              </Badge>
            )}
          </div>

          {data.subscription && !isCancelled && (
            <p className="text-sm text-muted-foreground">
              Next billing date: {format(parseISO(data.subscription.currentPeriodEnd), 'MMMM d, yyyy')}
            </p>
          )}

          {/* Plan limits */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Storage</p>
              <p className="font-semibold">{data.limits.storageFormatted}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Bandwidth/mo</p>
              <p className="font-semibold">{data.limits.bandwidthFormatted}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Max file size</p>
              <p className="font-semibold">{data.limits.maxFileSizeFormatted}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Team members</p>
              <p className="font-semibold">
                {data.limits.teamMembers === Infinity ? 'Unlimited' : data.limits.teamMembers}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Usage */}
      <Card>
        <CardHeader>
          <CardTitle>Usage</CardTitle>
          <CardDescription>
            Your current usage this billing period
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Storage */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium flex items-center gap-2">
                <HardDrive className="h-4 w-4" />
                Storage
                {storageWarning && <AlertTriangle className="h-4 w-4 text-amber-500" />}
              </span>
              <span className="text-sm text-muted-foreground">
                {data.usage.storageFormatted} / {data.limits.storageFormatted}
              </span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  data.usage.storagePercentage >= 90
                    ? 'bg-red-500'
                    : data.usage.storagePercentage >= 80
                    ? 'bg-amber-500'
                    : 'bg-primary'
                }`}
                style={{ width: `${Math.min(100, data.usage.storagePercentage)}%` }}
              />
            </div>
            {storageWarning && (
              <p className="text-xs text-amber-600 mt-1">
                {data.usage.storagePercentage >= 100
                  ? 'Storage limit reached. Upgrade to continue uploading.'
                  : 'Approaching storage limit. Consider upgrading your plan.'}
              </p>
            )}
          </div>

          {/* Bandwidth */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium flex items-center gap-2">
                <Gauge className="h-4 w-4" />
                Bandwidth
                {bandwidthWarning && <AlertTriangle className="h-4 w-4 text-amber-500" />}
              </span>
              <span className="text-sm text-muted-foreground">
                {data.usage.bandwidthFormatted} / {data.limits.bandwidthFormatted}
              </span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  data.usage.bandwidthPercentage >= 90
                    ? 'bg-red-500'
                    : data.usage.bandwidthPercentage >= 80
                    ? 'bg-amber-500'
                    : 'bg-blue-500'
                }`}
                style={{ width: `${Math.min(100, data.usage.bandwidthPercentage)}%` }}
              />
            </div>
            {data.usage.bandwidthResetAt && (
              <p className="text-xs text-muted-foreground mt-1">
                Resets {format(parseISO(data.usage.bandwidthResetAt), 'MMMM d, yyyy')}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Invoices */}
      {data.invoices.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Invoice History</CardTitle>
            <CardDescription>
              Download your past invoices
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="divide-y">
              {data.invoices.map((invoice) => (
                <div
                  key={invoice.id}
                  className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
                >
                  <div>
                    <p className="font-medium">${invoice.amount.toFixed(2)}</p>
                    <p className="text-sm text-muted-foreground">
                      {format(parseISO(invoice.date), 'MMM d, yyyy')}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge
                      variant={invoice.status === 'paid' ? 'outline' : 'secondary'}
                      className={invoice.status === 'paid' ? 'text-green-600 border-green-600' : ''}
                    >
                      {invoice.status}
                    </Badge>
                    {invoice.pdf && (
                      <Button variant="ghost" size="sm" asChild>
                        <a href={invoice.pdf} target="_blank" rel="noopener noreferrer">
                          <Download className="h-4 w-4" />
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function BillingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="border rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-9 w-32" />
        </div>
        <Skeleton className="h-8 w-24 mb-4" />
        <div className="grid grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i}>
              <Skeleton className="h-4 w-20 mb-1" />
              <Skeleton className="h-5 w-16" />
            </div>
          ))}
        </div>
      </div>
      <div className="border rounded-lg p-6">
        <Skeleton className="h-6 w-24 mb-4" />
        <div className="space-y-4">
          <Skeleton className="h-2 w-full" />
          <Skeleton className="h-2 w-full" />
        </div>
      </div>
    </div>
  )
}
