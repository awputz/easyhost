import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import { PageTheme } from '@/types'
import { CRE_THEMES, getThemeCSS } from '@/lib/cre-themes'

// Use service role for public page serving
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

function getAdminClient() {
  if (!supabaseUrl || !supabaseServiceKey) return null
  return createClient(supabaseUrl, supabaseServiceKey)
}

interface PageData {
  id: string
  slug: string
  title: string
  description?: string | null
  html: string
  theme: PageTheme | string
  branding?: {
    logo_url?: string
    primary_color?: string
    secondary_color?: string
    font_family?: string
  }
  custom_branding?: Record<string, unknown>
  is_public: boolean
  view_count: number
}

async function getPage(slug: string): Promise<PageData | null> {
  const supabase = getAdminClient()

  if (!supabase) {
    // Demo mode - return demo page
    if (slug.startsWith('demo-') || slug === 'pitch-deck-demo') {
      return {
        id: 'demo-1',
        slug: slug,
        title: 'Demo Pitch Deck',
        description: 'A demo pitch deck showcasing Pagelink capabilities',
        html: getDemoHtml(),
        theme: 'professional-dark',
        branding: {},
        is_public: true,
        view_count: 142,
      }
    }
    return null
  }

  // Try pagelink_documents table first (V2)
  let { data: page, error } = await supabase
    .from('pagelink_documents')
    .select('id, slug, title, html, theme, custom_branding, is_public, view_count')
    .eq('slug', slug)
    .eq('is_public', true)
    .single()

  // Fallback to pages table (V1) if not found
  if (error || !page) {
    const { data: legacyPage, error: legacyError } = await supabase
      .from('pages')
      .select('id, slug, title, description, html, theme, branding, is_public, view_count')
      .eq('slug', slug)
      .eq('is_public', true)
      .single()

    if (legacyError || !legacyPage) {
      return null
    }

    // Map legacy page format
    page = {
      ...legacyPage,
      custom_branding: legacyPage.branding,
    }
  }

  // View count is now tracked via the analytics API, not here

  return page as PageData
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const page = await getPage(slug)

  if (!page) {
    return { title: 'Page Not Found' }
  }

  return {
    title: page.title,
    description: page.description || `View ${page.title} on Pagelink`,
    openGraph: {
      title: page.title,
      description: page.description || `View ${page.title} on Pagelink`,
      type: 'article',
    },
  }
}

export default async function PublicPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const page = await getPage(slug)

  if (!page) {
    notFound()
  }

  const themeStyles = getThemeStyles(page.theme)

  // Analytics tracking script
  const analyticsScript = `
    (function() {
      var tracked = false;
      var startTime = Date.now();

      function trackView() {
        if (tracked) return;
        tracked = true;
        fetch('/api/analytics/track', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            document_id: '${page.id}',
            slug: '${slug}',
            event_type: 'view'
          })
        }).catch(function() {});
      }

      function trackEngagement() {
        var timeOnPage = Math.round((Date.now() - startTime) / 1000);
        if (timeOnPage < 5) return;
        fetch('/api/analytics/track', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            document_id: '${page.id}',
            slug: '${slug}',
            event_type: 'engagement',
            time_on_page: timeOnPage
          }),
          keepalive: true
        }).catch(function() {});
      }

      // Track view after short delay
      setTimeout(trackView, 500);

      // Track engagement on page leave
      document.addEventListener('visibilitychange', function() {
        if (document.visibilityState === 'hidden') trackEngagement();
      });
      window.addEventListener('beforeunload', trackEngagement);
    })();
  `

  return (
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>{page.title}</title>
        <style dangerouslySetInnerHTML={{ __html: themeStyles }} />
        <style dangerouslySetInnerHTML={{ __html: `
          .pagelink-badge {
            position: fixed;
            bottom: 1rem;
            right: 1rem;
            background: rgba(139, 92, 246, 0.9);
            color: white;
            padding: 0.5rem 1rem;
            border-radius: 2rem;
            font-size: 0.75rem;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            text-decoration: none;
            display: flex;
            align-items: center;
            gap: 0.5rem;
            backdrop-filter: blur(8px);
            border: 1px solid rgba(255,255,255,0.1);
            transition: all 0.2s;
            z-index: 1000;
          }
          .pagelink-badge:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(139, 92, 246, 0.4);
          }
          .pagelink-badge svg {
            width: 14px;
            height: 14px;
          }
        `}} />
      </head>
      <body>
        <div dangerouslySetInnerHTML={{ __html: page.html }} />

        {/* Pagelink Badge */}
        <a href="/" className="pagelink-badge" target="_blank" rel="noopener noreferrer">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
          </svg>
          Made with Pagelink
        </a>

        {/* Analytics Tracking */}
        <script dangerouslySetInnerHTML={{ __html: analyticsScript }} />
      </body>
    </html>
  )
}

function getThemeStyles(theme: PageTheme | string): string {
  // Check if it's a CRE theme first
  if (theme in CRE_THEMES) {
    return getThemeCSS(theme)
  }

  // Legacy themes
  const themes: Record<string, string> = {
    'professional-dark': `
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        background: linear-gradient(135deg, #0f0f0f 0%, #1a1a2e 100%);
        color: #e5e5e5;
        line-height: 1.7;
        padding: 3rem;
        min-height: 100vh;
      }
      h1 { font-size: 2.5rem; font-weight: 700; margin-bottom: 1.5rem; color: #fff; }
      h2 { font-size: 1.75rem; font-weight: 600; margin: 2rem 0 1rem; color: #fff; }
      h3 { font-size: 1.25rem; font-weight: 600; margin: 1.5rem 0 0.75rem; color: #f5f5f5; }
      p { margin-bottom: 1rem; }
      ul, ol { margin: 1rem 0; padding-left: 1.5rem; }
      li { margin-bottom: 0.5rem; }
      .highlight { background: linear-gradient(90deg, #8b5cf6, #6366f1); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
      .card { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 1rem; padding: 1.5rem; margin: 1.5rem 0; }
      .metric { font-size: 2.5rem; font-weight: 700; color: #8b5cf6; }
      .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1.5rem; }
      a { color: #8b5cf6; text-decoration: none; }
      a:hover { text-decoration: underline; }
      .cta { display: inline-block; background: linear-gradient(135deg, #8b5cf6, #6366f1); color: white; padding: 0.75rem 1.5rem; border-radius: 0.5rem; font-weight: 500; margin-top: 1rem; }
    `,
    'clean-light': `
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        background: #ffffff;
        color: #374151;
        line-height: 1.7;
        padding: 3rem;
        min-height: 100vh;
      }
      h1 { font-size: 2.5rem; font-weight: 700; margin-bottom: 1.5rem; color: #111827; }
      h2 { font-size: 1.75rem; font-weight: 600; margin: 2rem 0 1rem; color: #1f2937; }
      h3 { font-size: 1.25rem; font-weight: 600; margin: 1.5rem 0 0.75rem; color: #374151; }
      p { margin-bottom: 1rem; }
      ul, ol { margin: 1rem 0; padding-left: 1.5rem; }
      li { margin-bottom: 0.5rem; }
      .highlight { color: #7c3aed; font-weight: 600; }
      .card { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 1rem; padding: 1.5rem; margin: 1.5rem 0; }
      .metric { font-size: 2.5rem; font-weight: 700; color: #7c3aed; }
      .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1.5rem; }
      a { color: #7c3aed; text-decoration: none; }
      a:hover { text-decoration: underline; }
      .cta { display: inline-block; background: #7c3aed; color: white; padding: 0.75rem 1.5rem; border-radius: 0.5rem; font-weight: 500; margin-top: 1rem; }
    `,
    'corporate-blue': `
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        background: linear-gradient(180deg, #0f172a 0%, #1e293b 100%);
        color: #cbd5e1;
        line-height: 1.7;
        padding: 3rem;
        min-height: 100vh;
      }
      h1 { font-size: 2.5rem; font-weight: 700; margin-bottom: 1.5rem; color: #f1f5f9; }
      h2 { font-size: 1.75rem; font-weight: 600; margin: 2rem 0 1rem; color: #e2e8f0; }
      h3 { font-size: 1.25rem; font-weight: 600; margin: 1.5rem 0 0.75rem; color: #cbd5e1; }
      p { margin-bottom: 1rem; }
      ul, ol { margin: 1rem 0; padding-left: 1.5rem; }
      li { margin-bottom: 0.5rem; }
      .highlight { color: #3b82f6; font-weight: 600; }
      .card { background: rgba(59, 130, 246, 0.1); border: 1px solid rgba(59, 130, 246, 0.2); border-radius: 1rem; padding: 1.5rem; margin: 1.5rem 0; }
      .metric { font-size: 2.5rem; font-weight: 700; color: #3b82f6; }
      .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1.5rem; }
      a { color: #60a5fa; text-decoration: none; }
      a:hover { text-decoration: underline; }
      .cta { display: inline-block; background: #3b82f6; color: white; padding: 0.75rem 1.5rem; border-radius: 0.5rem; font-weight: 500; margin-top: 1rem; }
    `,
    'modern-minimal': `
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body {
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
        background: #fafafa;
        color: #525252;
        line-height: 1.8;
        padding: 4rem 3rem;
        min-height: 100vh;
        max-width: 800px;
        margin: 0 auto;
      }
      h1 { font-size: 2rem; font-weight: 600; margin-bottom: 2rem; color: #171717; letter-spacing: -0.025em; }
      h2 { font-size: 1.5rem; font-weight: 600; margin: 3rem 0 1rem; color: #262626; }
      h3 { font-size: 1.125rem; font-weight: 600; margin: 2rem 0 0.75rem; color: #404040; }
      p { margin-bottom: 1.25rem; }
      ul, ol { margin: 1.25rem 0; padding-left: 1.5rem; }
      li { margin-bottom: 0.75rem; }
      .highlight { color: #171717; font-weight: 600; }
      .card { background: white; border: 1px solid #e5e5e5; border-radius: 0.75rem; padding: 1.5rem; margin: 1.5rem 0; }
      .metric { font-size: 2rem; font-weight: 600; color: #171717; }
      .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1.5rem; }
      a { color: #171717; text-decoration: underline; text-underline-offset: 2px; }
      .cta { display: inline-block; background: #171717; color: white; padding: 0.75rem 1.5rem; border-radius: 0.5rem; font-weight: 500; margin-top: 1rem; text-decoration: none; }
    `,
    'custom': `
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        background: #ffffff;
        color: #333;
        line-height: 1.6;
        padding: 2rem;
      }
      h1 { font-size: 2rem; margin-bottom: 1rem; }
      h2 { font-size: 1.5rem; margin: 1.5rem 0 0.75rem; }
      p { margin-bottom: 1rem; }
      ul, ol { margin: 1rem 0; padding-left: 1.5rem; }
    `,
  }

  return themes[theme] || themes['professional-dark']
}

function getDemoHtml(): string {
  return `
<section style="text-align: center; padding: 4rem 0;">
  <h1><span class="highlight">Pagelink Demo</span></h1>
  <p style="font-size: 1.25rem; opacity: 0.8;">AI-powered document creation that replaces PDFs</p>
</section>

<section>
  <h2>What is Pagelink?</h2>
  <div class="card">
    <p>Pagelink transforms the way you create and share professional documents. Instead of static PDFs, create beautiful, interactive web pages with AI assistance.</p>
  </div>
</section>

<section>
  <h2>Key Features</h2>
  <div class="grid">
    <div class="card" style="text-align: center;">
      <div class="metric">AI</div>
      <p>Conversational document creation</p>
    </div>
    <div class="card" style="text-align: center;">
      <div class="metric">Live</div>
      <p>Real-time preview & editing</p>
    </div>
    <div class="card" style="text-align: center;">
      <div class="metric">Analytics</div>
      <p>Track views & engagement</p>
    </div>
  </div>
</section>

<section>
  <h2>Perfect For</h2>
  <div class="card">
    <ul>
      <li><strong>Pitch Decks</strong> - Impress investors with interactive presentations</li>
      <li><strong>Proposals</strong> - Stand out with professional, shareable documents</li>
      <li><strong>One-Pagers</strong> - Create concise, impactful summaries</li>
      <li><strong>Case Studies</strong> - Showcase your success stories beautifully</li>
    </ul>
  </div>
</section>

<section style="text-align: center; padding: 3rem 0;">
  <h2>Ready to Get Started?</h2>
  <p>Create your first document in minutes with AI assistance.</p>
  <a href="/dashboard/pages/new" class="cta">Create Your First Page</a>
</section>
`
}
