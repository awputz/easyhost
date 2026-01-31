'use client'

import { useEffect, useRef } from 'react'

interface ViewTrackerProps {
  documentId?: string
  slug: string
}

export function ViewTracker({ documentId, slug }: ViewTrackerProps) {
  const hasTracked = useRef(false)

  useEffect(() => {
    // Only track once per page load
    if (hasTracked.current) return
    hasTracked.current = true

    // Track the view
    const trackView = async () => {
      try {
        await fetch('/api/analytics/track', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            document_id: documentId,
            slug,
            event_type: 'view',
          }),
        })
      } catch {
        // Silently fail - analytics shouldn't break the page
      }
    }

    // Small delay to ensure the page has loaded
    const timeoutId = setTimeout(trackView, 500)

    return () => clearTimeout(timeoutId)
  }, [documentId, slug])

  // Track time on page when user leaves
  useEffect(() => {
    const startTime = Date.now()

    const trackEngagement = async () => {
      const timeOnPage = Math.round((Date.now() - startTime) / 1000)

      // Only track if user spent more than 5 seconds
      if (timeOnPage < 5) return

      try {
        await fetch('/api/analytics/track', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            document_id: documentId,
            slug,
            event_type: 'engagement',
            time_on_page: timeOnPage,
          }),
          // Use keepalive to ensure the request completes on page unload
          keepalive: true,
        })
      } catch {
        // Silently fail
      }
    }

    // Track when user leaves
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        trackEngagement()
      }
    }

    const handleBeforeUnload = () => {
      trackEngagement()
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [documentId, slug])

  // This component renders nothing
  return null
}
