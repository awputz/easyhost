'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, Lock, AlertCircle, FileText, ExternalLink } from 'lucide-react'

interface LinkData {
  id: string
  slug: string
  is_active: boolean
  expires_at: string | null
  max_views: number | null
  view_count: number
  password_protected: boolean
  target_url: string
  target_name: string
  target_type: 'asset' | 'collection'
}

export default function ShortLinkPage() {
  const params = useParams()
  const router = useRouter()
  const slug = params.slug as string

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [linkData, setLinkData] = useState<LinkData | null>(null)
  const [password, setPassword] = useState('')
  const [verifying, setVerifying] = useState(false)
  const [passwordError, setPasswordError] = useState<string | null>(null)

  useEffect(() => {
    const fetchLink = async () => {
      try {
        const response = await fetch(`/api/e/${slug}`)

        if (!response.ok) {
          try {
            const data = await response.json()
            setError(data.error || 'Link not found')
          } catch {
            setError('Link not found')
          }
          return
        }

        const data = await response.json()
        setLinkData(data)

        // If no password required, redirect immediately
        if (!data.password_protected) {
          // Track the view and redirect
          await fetch(`/api/e/${slug}/view`, { method: 'POST' })
          window.location.href = data.target_url
        }
      } catch {
        setError('Failed to load link')
      } finally {
        setLoading(false)
      }
    }

    fetchLink()
  }, [slug])

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setVerifying(true)
    setPasswordError(null)

    try {
      const response = await fetch(`/api/e/${slug}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })

      if (!response.ok) {
        try {
          const data = await response.json()
          setPasswordError(data.error || 'Invalid password')
        } catch {
          setPasswordError('Invalid password')
        }
        return
      }

      const data = await response.json()
      // Password verified, redirect
      window.location.href = data.target_url
    } catch {
      setPasswordError('Failed to verify password')
    } finally {
      setVerifying(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
                <AlertCircle className="h-8 w-8 text-destructive" />
              </div>
              <h2 className="text-xl font-semibold mb-2">Link Unavailable</h2>
              <p className="text-muted-foreground mb-6">{error}</p>
              <Button onClick={() => router.push('/')} variant="outline">
                Go to Homepage
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (linkData?.password_protected) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <Lock className="h-8 w-8 text-muted-foreground" />
            </div>
            <CardTitle>Password Protected</CardTitle>
            <CardDescription>
              This link is protected. Enter the password to continue.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  required
                  autoFocus
                />
                {passwordError && (
                  <p className="text-sm text-destructive">{passwordError}</p>
                )}
              </div>

              <Button type="submit" className="w-full" disabled={verifying}>
                {verifying ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Access Content
                  </>
                )}
              </Button>
            </form>

            {linkData.target_name && (
              <div className="mt-6 pt-6 border-t">
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <FileText className="h-4 w-4" />
                  <span className="truncate">{linkData.target_name}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Branding */}
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2">
          <p className="text-xs text-muted-foreground">
            Powered by{' '}
            <a href="/" className="text-primary hover:underline">
              Pagelink
            </a>
          </p>
        </div>
      </div>
    )
  }

  // This shouldn't render - we redirect immediately if no password
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  )
}
