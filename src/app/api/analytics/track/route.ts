import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { headers } from 'next/headers'

// Use service role for analytics tracking (no auth required)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

function getAdminClient() {
  if (!supabaseUrl || !supabaseServiceKey) return null
  return createClient(supabaseUrl, supabaseServiceKey)
}

// Parse user agent for device info
function parseUserAgent(ua: string): { device_type: string; browser: string; os: string } {
  const isMobile = /mobile|android|iphone|ipad|tablet/i.test(ua)
  const isTablet = /ipad|tablet/i.test(ua)

  let device_type = 'desktop'
  if (isTablet) device_type = 'tablet'
  else if (isMobile) device_type = 'mobile'

  // Browser detection
  let browser = 'unknown'
  if (ua.includes('Chrome') && !ua.includes('Edg')) browser = 'chrome'
  else if (ua.includes('Safari') && !ua.includes('Chrome')) browser = 'safari'
  else if (ua.includes('Firefox')) browser = 'firefox'
  else if (ua.includes('Edg')) browser = 'edge'

  // OS detection
  let os = 'unknown'
  if (ua.includes('Windows')) os = 'windows'
  else if (ua.includes('Mac')) os = 'macos'
  else if (ua.includes('Linux')) os = 'linux'
  else if (ua.includes('Android')) os = 'android'
  else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'ios'

  return { device_type, browser, os }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { document_id, slug, event_type = 'view' } = body

    if (!document_id && !slug) {
      return NextResponse.json({ error: 'document_id or slug required' }, { status: 400 })
    }

    const supabase = getAdminClient()
    if (!supabase) {
      // Demo mode - just return success
      return NextResponse.json({ success: true, mode: 'demo' })
    }

    // Get request headers
    const headersList = await headers()
    const userAgent = headersList.get('user-agent') || ''
    const referer = headersList.get('referer') || null

    // Get IP from various headers (works with proxies/Vercel)
    const ip = headersList.get('x-forwarded-for')?.split(',')[0]?.trim() ||
               headersList.get('x-real-ip') ||
               headersList.get('cf-connecting-ip') ||
               'unknown'

    // Parse device info
    const { device_type, browser, os } = parseUserAgent(userAgent)

    // Look up document ID if only slug provided
    let docId = document_id
    if (!docId && slug) {
      const { data: doc } = await supabase
        .from('pagelink_documents')
        .select('id')
        .eq('slug', slug)
        .single()

      if (doc) {
        docId = doc.id
      } else {
        return NextResponse.json({ error: 'Document not found' }, { status: 404 })
      }
    }

    // Get geolocation from IP (using a free service - optional)
    let city = null
    let country = null
    let region = null

    if (ip && ip !== 'unknown' && !ip.startsWith('127.') && !ip.startsWith('192.168.')) {
      try {
        // Use ipapi.co free tier (1000 requests/day)
        const geoResponse = await fetch(`https://ipapi.co/${ip}/json/`, {
          signal: AbortSignal.timeout(2000), // 2 second timeout
        })
        if (geoResponse.ok) {
          const geoData = await geoResponse.json()
          city = geoData.city || null
          country = geoData.country_name || null
          region = geoData.region || null
        }
      } catch {
        // Geolocation failed - continue without it
      }
    }

    // Insert analytics record into pagelink_analytics
    const { error: insertError } = await supabase
      .from('pagelink_analytics')
      .insert({
        document_id: docId,
        event_type,
        visitor_id: `${ip}-${Date.now()}`, // Simple visitor ID
        ip_address: ip,
        user_agent: userAgent.slice(0, 500), // Limit length
        referrer: referer?.slice(0, 500) || null,
        country_code: country?.slice(0, 2)?.toUpperCase() || null,
        city,
      })

    if (insertError) {
      console.error('Analytics insert error:', insertError)
      // Don't fail the request for analytics errors
    }

    // Also increment the view count on the document
    if (event_type === 'view') {
      try {
        // Use direct update since we know the current count
        const { data: doc } = await supabase
          .from('pagelink_documents')
          .select('view_count, slug')
          .eq('id', docId)
          .single()

        if (doc) {
          await supabase
            .from('pagelink_documents')
            .update({
              view_count: (doc.view_count || 0) + 1,
              last_viewed_at: new Date().toISOString(),
            })
            .eq('id', docId)
        }
      } catch {
        // Silently fail - view tracking is not critical
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Analytics error:', error)
    return NextResponse.json({ success: true }) // Don't fail for analytics
  }
}
