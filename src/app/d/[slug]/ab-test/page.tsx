'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  FlaskConical,
  Trophy,
  BarChart2,
  TrendingUp,
  TrendingDown,
  Loader2,
  CheckCircle,
  AlertCircle,
  Play,
  Pause,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ABVariant {
  id: string
  name: string
  html: string
  trafficPercent: number
  views: number
  conversions: number
  conversionRate: number
}

interface ABTestConfig {
  enabled: boolean
  testName: string
  variants: ABVariant[]
  goalType: string
  minSampleSize: number
  confidenceLevel: number
  winnerId: string | null
  startedAt: string | null
  endedAt: string | null
}

export default function ABTestPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = use(params)
  const router = useRouter()

  const [documentId, setDocumentId] = useState<string | null>(null)
  const [documentTitle, setDocumentTitle] = useState('')
  const [config, setConfig] = useState<ABTestConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [declaringWinner, setDeclaringWinner] = useState<string | null>(null)

  useEffect(() => {
    fetchDocument()
  }, [slug])

  useEffect(() => {
    if (documentId) {
      fetchABTestData()
    }
  }, [documentId])

  const fetchDocument = async () => {
    try {
      const response = await fetch(`/api/pagelink/documents/by-slug/${slug}`)
      if (response.ok) {
        const doc = await response.json()
        setDocumentId(doc.id)
        setDocumentTitle(doc.title)
      } else {
        router.push('/dashboard/pages')
      }
    } catch (error) {
      console.error('Error fetching document:', error)
      router.push('/dashboard/pages')
    }
  }

  const fetchABTestData = async () => {
    if (!documentId) return

    setLoading(true)
    try {
      const response = await fetch(`/api/pagelink/documents/${documentId}/ab-test`)
      if (response.ok) {
        const data = await response.json()
        setConfig(data.config)
      }
    } catch (error) {
      console.error('Error fetching A/B test data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDeclareWinner = async (variantId: string) => {
    if (!documentId) return
    if (!confirm('Are you sure you want to declare this variant as the winner? This will end the test and update the document.')) {
      return
    }

    setDeclaringWinner(variantId)
    try {
      const response = await fetch(`/api/pagelink/documents/${documentId}/ab-test`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ winnerId: variantId }),
      })
      if (response.ok) {
        fetchABTestData()
      }
    } catch (error) {
      console.error('Declare winner error:', error)
    } finally {
      setDeclaringWinner(null)
    }
  }

  const calculateConfidence = (variants: ABVariant[]) => {
    if (variants.length < 2) return 0

    const sorted = [...variants].sort((a, b) => b.conversionRate - a.conversionRate)
    const best = sorted[0]
    const second = sorted[1]

    if (best.views < 30 || second.views < 30) return 0

    // Simplified confidence calculation
    const diff = best.conversionRate - second.conversionRate
    const avgViews = (best.views + second.views) / 2
    const confidence = Math.min(99, Math.max(0, diff * Math.sqrt(avgViews) * 2))

    return confidence
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '—'
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const totalViews = config?.variants.reduce((sum, v) => sum + v.views, 0) || 0
  const totalConversions = config?.variants.reduce((sum, v) => sum + v.conversions, 0) || 0
  const confidence = config?.variants ? calculateConfidence(config.variants) : 0
  const leadingVariant = config?.variants
    ? [...config.variants].sort((a, b) => b.conversionRate - a.conversionRate)[0]
    : null

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Header */}
      <header className="border-b border-white/5 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href={`/d/${slug}`}
              className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-zinc-400" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <FlaskConical className="w-5 h-5 text-cyan-400" />
                <h1 className="text-xl font-semibold text-white">A/B Test Results</h1>
                {config?.enabled && (
                  <span className="px-2 py-0.5 bg-cyan-500/20 text-cyan-400 text-xs font-medium rounded-full flex items-center gap-1">
                    <Play className="w-3 h-3" />
                    Running
                  </span>
                )}
                {config?.winnerId && (
                  <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 text-xs font-medium rounded-full flex items-center gap-1">
                    <Trophy className="w-3 h-3" />
                    Complete
                  </span>
                )}
              </div>
              <p className="text-sm text-zinc-500">{documentTitle}</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-cyan-500 animate-spin" />
          </div>
        ) : !config || !config.variants || config.variants.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <FlaskConical className="w-8 h-8 text-zinc-600" />
            </div>
            <h3 className="text-lg font-medium text-white mb-2">No A/B test configured</h3>
            <p className="text-zinc-500 mb-6">
              Set up an A/B test to compare different versions of your document.
            </p>
            <Link href={`/d/${slug}`}>
              <Button className="bg-cyan-600 hover:bg-cyan-500">
                Configure A/B Test
              </Button>
            </Link>
          </div>
        ) : (
          <>
            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6">
                <div className="text-3xl font-bold text-white">{totalViews.toLocaleString()}</div>
                <div className="text-sm text-zinc-500">Total Views</div>
              </div>
              <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6">
                <div className="text-3xl font-bold text-white">{totalConversions.toLocaleString()}</div>
                <div className="text-sm text-zinc-500">Conversions</div>
              </div>
              <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6">
                <div className="text-3xl font-bold text-cyan-400">
                  {totalViews > 0 ? ((totalConversions / totalViews) * 100).toFixed(1) : '0'}%
                </div>
                <div className="text-sm text-zinc-500">Avg Conversion Rate</div>
              </div>
              <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6">
                <div className={`text-3xl font-bold ${
                  confidence >= config.confidenceLevel ? 'text-green-400' : 'text-amber-400'
                }`}>
                  {confidence.toFixed(0)}%
                </div>
                <div className="text-sm text-zinc-500">Confidence</div>
              </div>
            </div>

            {/* Test Info */}
            <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6 mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-white">{config.testName}</h2>
                <div className="flex items-center gap-4 text-sm text-zinc-500">
                  <span>Started: {formatDate(config.startedAt)}</span>
                  {config.endedAt && <span>Ended: {formatDate(config.endedAt)}</span>}
                </div>
              </div>

              {/* Confidence Indicator */}
              {!config.winnerId && (
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-zinc-400">Statistical Confidence</span>
                    <span className={`text-sm font-medium ${
                      confidence >= config.confidenceLevel ? 'text-green-400' : 'text-zinc-400'
                    }`}>
                      {confidence.toFixed(0)}% / {config.confidenceLevel}% needed
                    </span>
                  </div>
                  <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 ${
                        confidence >= config.confidenceLevel ? 'bg-green-500' : 'bg-cyan-500'
                      }`}
                      style={{ width: `${Math.min(100, (confidence / config.confidenceLevel) * 100)}%` }}
                    />
                  </div>
                  {confidence >= config.confidenceLevel && (
                    <div className="flex items-center gap-2 mt-3 text-green-400 text-sm">
                      <CheckCircle className="w-4 h-4" />
                      Statistical significance reached! You can declare a winner.
                    </div>
                  )}
                </div>
              )}

              {/* Winner Banner */}
              {config.winnerId && leadingVariant && (
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 mb-6">
                  <div className="flex items-center gap-3">
                    <Trophy className="w-6 h-6 text-amber-400" />
                    <div>
                      <div className="font-medium text-white">Winner: {leadingVariant.name}</div>
                      <div className="text-sm text-zinc-400">
                        This variant has been applied to your document.
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Variants */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-white">Variants</h3>

              {config.variants.map((variant, index) => {
                const isLeading = leadingVariant?.id === variant.id
                const isWinner = config.winnerId === variant.id

                return (
                  <div
                    key={variant.id}
                    className={`bg-zinc-900 rounded-xl border p-6 ${
                      isWinner
                        ? 'border-amber-500/50'
                        : isLeading
                        ? 'border-cyan-500/50'
                        : 'border-zinc-800'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <span className={`w-8 h-8 rounded flex items-center justify-center text-sm font-bold ${
                          isWinner
                            ? 'bg-amber-500/20 text-amber-400'
                            : isLeading
                            ? 'bg-cyan-500/20 text-cyan-400'
                            : 'bg-zinc-800 text-zinc-400'
                        }`}>
                          {String.fromCharCode(65 + index)}
                        </span>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-white">{variant.name}</span>
                            {isWinner && (
                              <Trophy className="w-4 h-4 text-amber-400" />
                            )}
                            {isLeading && !isWinner && (
                              <TrendingUp className="w-4 h-4 text-cyan-400" />
                            )}
                          </div>
                          <span className="text-xs text-zinc-500">
                            {variant.trafficPercent}% traffic
                          </span>
                        </div>
                      </div>

                      {!config.winnerId && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeclareWinner(variant.id)}
                          disabled={declaringWinner === variant.id || totalViews < config.minSampleSize}
                          className="border-zinc-700"
                        >
                          {declaringWinner === variant.id ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <Trophy className="w-4 h-4 mr-2" />
                          )}
                          Declare Winner
                        </Button>
                      )}
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-6">
                      <div className="text-center p-4 bg-zinc-800/50 rounded-lg">
                        <div className="text-2xl font-bold text-white">
                          {variant.views.toLocaleString()}
                        </div>
                        <div className="text-sm text-zinc-500">Views</div>
                      </div>
                      <div className="text-center p-4 bg-zinc-800/50 rounded-lg">
                        <div className="text-2xl font-bold text-white">
                          {variant.conversions.toLocaleString()}
                        </div>
                        <div className="text-sm text-zinc-500">Conversions</div>
                      </div>
                      <div className="text-center p-4 bg-zinc-800/50 rounded-lg">
                        <div className={`text-2xl font-bold ${
                          isLeading ? 'text-cyan-400' : 'text-white'
                        }`}>
                          {variant.conversionRate.toFixed(2)}%
                        </div>
                        <div className="text-sm text-zinc-500">Conversion Rate</div>
                      </div>
                    </div>

                    {/* Comparison to baseline */}
                    {index > 0 && config.variants[0].conversionRate > 0 && (
                      <div className="mt-4 pt-4 border-t border-zinc-800">
                        <div className="flex items-center gap-2">
                          {variant.conversionRate > config.variants[0].conversionRate ? (
                            <>
                              <TrendingUp className="w-4 h-4 text-green-400" />
                              <span className="text-green-400 text-sm font-medium">
                                +{((variant.conversionRate / config.variants[0].conversionRate - 1) * 100).toFixed(1)}%
                              </span>
                              <span className="text-zinc-500 text-sm">vs Control</span>
                            </>
                          ) : (
                            <>
                              <TrendingDown className="w-4 h-4 text-red-400" />
                              <span className="text-red-400 text-sm font-medium">
                                {((variant.conversionRate / config.variants[0].conversionRate - 1) * 100).toFixed(1)}%
                              </span>
                              <span className="text-zinc-500 text-sm">vs Control</span>
                            </>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Warning if sample size not reached */}
            {totalViews < config.minSampleSize && !config.winnerId && (
              <div className="mt-6 bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0" />
                  <div>
                    <div className="font-medium text-amber-400">Collecting more data</div>
                    <div className="text-sm text-zinc-400">
                      {config.minSampleSize - totalViews} more views needed to reach minimum sample size of {config.minSampleSize}.
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}
