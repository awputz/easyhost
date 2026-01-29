import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import { ExpiredDocument } from '@/components/pagelink/expired-document'
import { PrivateDocument } from '@/components/pagelink/private-document'
import { DocumentViewer } from '@/components/pagelink/document-viewer'

// Reserved slugs that shouldn't be used for documents
const RESERVED_SLUGS = [
  'api', 'dashboard', 'login', 'signup', 'create', 'pricing',
  'templates', 'settings', 'p', 'c', 'e', 't', 'help', 'docs', 'd'
]

// Use service role for public document serving
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

function getAdminClient() {
  if (!supabaseUrl || !supabaseServiceKey) return null
  return createClient(supabaseUrl, supabaseServiceKey)
}

interface DocumentData {
  id: string
  slug: string
  title: string
  html: string
  theme: string
  custom_branding: Record<string, unknown>
  is_public: boolean
  show_pagelink_badge: boolean
  view_count: number
  password_hash: string | null
  expires_at: string | null
  allowed_emails: string[] | null
}

interface DocumentAccessResult {
  status: 'ok' | 'expired' | 'private' | 'password_required' | 'not_found'
  document?: DocumentData
}

async function getDocumentAccess(slug: string): Promise<DocumentAccessResult> {
  // Check for reserved slugs
  if (RESERVED_SLUGS.includes(slug)) {
    return { status: 'not_found' }
  }

  const supabase = getAdminClient()

  if (!supabase) {
    // Demo mode - return demo documents for certain slugs
    const demoDoc = getDemoDocument(slug)
    if (demoDoc) {
      return { status: 'ok', document: demoDoc }
    }
    return { status: 'not_found' }
  }

  const { data: doc, error } = await supabase
    .from('pagelink_documents')
    .select('id, slug, title, html, theme, custom_branding, is_public, show_pagelink_badge, view_count, password_hash, expires_at, allowed_emails')
    .eq('slug', slug)
    .single()

  if (error || !doc) {
    // Fallback to demo
    const demoDoc = getDemoDocument(slug)
    if (demoDoc) {
      return { status: 'ok', document: demoDoc }
    }
    return { status: 'not_found' }
  }

  // Check if document is public
  if (!doc.is_public) {
    return { status: 'private' }
  }

  // Check if document is expired
  if (doc.expires_at && new Date(doc.expires_at) < new Date()) {
    return { status: 'expired', document: doc as DocumentData }
  }

  // Check if document requires password
  if (doc.password_hash) {
    return { status: 'password_required', document: doc as DocumentData }
  }

  // Document is accessible
  // Increment view count (fire and forget)
  supabase.rpc('increment_pagelink_view_count', { doc_slug: slug }).then(() => {})

  // Track analytics
  supabase.from('pagelink_analytics').insert({
    document_id: doc.id,
    event_type: 'view',
    created_at: new Date().toISOString(),
  }).then(() => {})

  return { status: 'ok', document: doc as DocumentData }
}

function getDemoDocument(slug: string): DocumentData | null {
  // Return demo documents for demo slugs
  if (slug.startsWith('bold-') || slug.startsWith('swift-') || slug.startsWith('demo')) {
    return {
      id: 'demo',
      slug,
      title: 'Demo Document',
      html: getDemoHtml(),
      theme: 'midnight',
      custom_branding: {},
      is_public: true,
      show_pagelink_badge: true,
      view_count: 42,
      password_hash: null,
      expires_at: null,
      allowed_emails: null,
    }
  }
  return null
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params

  // Skip metadata for reserved slugs
  if (RESERVED_SLUGS.includes(slug)) {
    return {}
  }

  const result = await getDocumentAccess(slug)

  if (result.status === 'not_found') {
    return { title: 'Document Not Found' }
  }

  if (result.status === 'expired') {
    return { title: 'Document Expired' }
  }

  if (result.status === 'private') {
    return { title: 'Private Document' }
  }

  if (result.status === 'password_required') {
    return {
      title: result.document?.title || 'Protected Document',
      description: 'This document is password protected',
    }
  }

  const doc = result.document!
  return {
    title: doc.title,
    description: `View ${doc.title} on Pagelink`,
    openGraph: {
      title: doc.title,
      description: `View ${doc.title} on Pagelink`,
      type: 'article',
    },
  }
}

export default async function PublicDocumentPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  // Skip for reserved slugs (let Next.js handle 404)
  if (RESERVED_SLUGS.includes(slug)) {
    notFound()
  }

  const result = await getDocumentAccess(slug)

  // Handle not found
  if (result.status === 'not_found') {
    notFound()
  }

  // Handle private documents
  if (result.status === 'private') {
    return <PrivateDocument />
  }

  // Handle expired documents
  if (result.status === 'expired' && result.document) {
    return (
      <ExpiredDocument
        title={result.document.title}
        expiredAt={result.document.expires_at!}
      />
    )
  }

  // Handle password-protected documents
  if (result.status === 'password_required' && result.document) {
    return (
      <DocumentViewer
        slug={result.document.slug}
        title={result.document.title}
        html={null}
        hasPassword={true}
        showBadge={result.document.show_pagelink_badge}
        branding={result.document.custom_branding}
      />
    )
  }

  // Document is accessible - render it
  const doc = result.document!
  return (
    <DocumentViewer
      slug={doc.slug}
      title={doc.title}
      html={doc.html}
      hasPassword={false}
      showBadge={doc.show_pagelink_badge}
      branding={doc.custom_branding}
    />
  )
}

function getDemoHtml(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Demo Document</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Playfair+Display:wght@300;400&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Inter', sans-serif; background: linear-gradient(135deg, #0f0f0f 0%, #1a1a2e 100%); color: #e5e5e5; line-height: 1.7; min-height: 100vh; padding: 60px; }
    .container { max-width: 800px; margin: 0 auto; }
    h1 { font-family: 'Playfair Display', serif; font-size: 3rem; font-weight: 400; margin-bottom: 1.5rem; text-align: center; }
    .highlight { background: linear-gradient(90deg, #3b82f6, #8b5cf6); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
    .card { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; padding: 32px; margin: 2rem 0; }
    .stat-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin: 2rem 0; }
    .stat-box { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 24px; text-align: center; }
    .stat-value { font-size: 2rem; font-weight: 600; color: #3b82f6; }
    .stat-label { font-size: 0.75rem; text-transform: uppercase; letter-spacing: 2px; opacity: 0.6; margin-top: 8px; }
    .cta { display: inline-block; background: linear-gradient(135deg, #3b82f6, #8b5cf6); color: white; padding: 14px 28px; border-radius: 8px; font-weight: 500; text-decoration: none; margin-top: 1rem; }
    p { margin-bottom: 1rem; }
  </style>
</head>
<body>
  <div class="container">
    <h1><span class="highlight">Welcome to Pagelink</span></h1>

    <div class="card" style="text-align: center;">
      <p style="font-size: 1.25rem;">This is a demo document showing what you can create with Pagelink.</p>
      <p style="opacity: 0.7;">Replace PDFs with beautiful, shareable web pages.</p>
    </div>

    <div class="stat-grid">
      <div class="stat-box">
        <div class="stat-value">10x</div>
        <div class="stat-label">Faster Creation</div>
      </div>
      <div class="stat-box">
        <div class="stat-value">∞</div>
        <div class="stat-label">Updates</div>
      </div>
      <div class="stat-box">
        <div class="stat-value">Live</div>
        <div class="stat-label">Analytics</div>
      </div>
    </div>

    <div class="card">
      <h2 style="font-family: 'Playfair Display', serif; margin-bottom: 1rem;">What You Can Create</h2>
      <ul style="padding-left: 1.5rem;">
        <li>Investment Memoranda</li>
        <li>Pitch Decks</li>
        <li>Consulting Proposals</li>
        <li>Product One-Pagers</li>
        <li>Investor Updates</li>
      </ul>
    </div>

    <div style="text-align: center; margin-top: 3rem;">
      <a href="/create" class="cta">Create Your Own →</a>
    </div>
  </div>
</body>
</html>`
}
