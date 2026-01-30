import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Use service role for public document serving
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

function getAdminClient() {
  if (!supabaseUrl || !supabaseServiceKey) return null
  return createClient(supabaseUrl, supabaseServiceKey)
}

// GET /api/custom-domain - Handle custom domain requests
export async function GET(request: NextRequest) {
  const host = request.nextUrl.searchParams.get('_host')
  const pathname = request.nextUrl.pathname.replace('/api/custom-domain', '') || '/'

  if (!host) {
    return new NextResponse('Missing host', { status: 400 })
  }

  const supabase = getAdminClient()

  if (!supabase) {
    // Demo mode - return demo content
    return new NextResponse(getDemoHtml(host), {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
      },
    })
  }

  // Look up the custom domain
  const { data: domainRecord, error: domainError } = await supabase
    .from('custom_domains')
    .select('*, document_id, workspace_id')
    .eq('domain', host.toLowerCase())
    .eq('status', 'verified')
    .single()

  if (domainError || !domainRecord) {
    return new NextResponse(getNotConfiguredHtml(host), {
      status: 404,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
      },
    })
  }

  // If domain is linked to a specific document
  if (domainRecord.document_id) {
    const { data: doc, error: docError } = await supabase
      .from('pagelink_documents')
      .select('*')
      .eq('id', domainRecord.document_id)
      .eq('is_public', true)
      .single()

    if (docError || !doc) {
      return new NextResponse(getNotFoundHtml(), {
        status: 404,
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
        },
      })
    }

    // Check if expired
    if (doc.expires_at && new Date(doc.expires_at) < new Date()) {
      return new NextResponse(getExpiredHtml(doc.title), {
        status: 410,
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
        },
      })
    }

    // Increment view count
    supabase.rpc('increment_pagelink_view_count', { doc_slug: doc.slug }).then(() => {})

    // Return the document HTML
    return new NextResponse(doc.html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
      },
    })
  }

  // If domain is linked to a workspace, serve workspace landing or specific document
  if (domainRecord.workspace_id) {
    // If pathname is not root, try to find a document by slug
    if (pathname !== '/') {
      const slug = pathname.replace(/^\//, '').split('/')[0]

      const { data: doc, error: docError } = await supabase
        .from('pagelink_documents')
        .select('*')
        .eq('workspace_id', domainRecord.workspace_id)
        .eq('slug', slug)
        .eq('is_public', true)
        .single()

      if (!docError && doc) {
        // Check if expired
        if (doc.expires_at && new Date(doc.expires_at) < new Date()) {
          return new NextResponse(getExpiredHtml(doc.title), {
            status: 410,
            headers: {
              'Content-Type': 'text/html; charset=utf-8',
            },
          })
        }

        // Increment view count
        supabase.rpc('increment_pagelink_view_count', { doc_slug: doc.slug }).then(() => {})

        return new NextResponse(doc.html, {
          status: 200,
          headers: {
            'Content-Type': 'text/html; charset=utf-8',
            'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
          },
        })
      }
    }

    // Return workspace landing page or 404
    const { data: docs } = await supabase
      .from('pagelink_documents')
      .select('slug, title')
      .eq('workspace_id', domainRecord.workspace_id)
      .eq('is_public', true)
      .order('created_at', { ascending: false })
      .limit(10)

    if (docs && docs.length > 0) {
      return new NextResponse(getWorkspaceLandingHtml(host, docs), {
        status: 200,
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
        },
      })
    }
  }

  return new NextResponse(getNotFoundHtml(), {
    status: 404,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
    },
  })
}

function getDemoHtml(host: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Custom Domain - ${host}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: system-ui, sans-serif; background: #0a0a0a; color: #fff; min-height: 100vh; display: flex; align-items: center; justify-content: center; }
    .container { text-align: center; padding: 2rem; }
    h1 { font-size: 2rem; margin-bottom: 1rem; }
    p { color: #888; margin-bottom: 2rem; }
    .domain { background: #1a1a1a; padding: 0.5rem 1rem; border-radius: 8px; font-family: monospace; color: #60a5fa; }
  </style>
</head>
<body>
  <div class="container">
    <h1>Custom Domain Active</h1>
    <p>This domain is configured with Pagelink</p>
    <div class="domain">${host}</div>
  </div>
</body>
</html>`
}

function getNotConfiguredHtml(host: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Domain Not Configured</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: system-ui, sans-serif; background: #0a0a0a; color: #fff; min-height: 100vh; display: flex; align-items: center; justify-content: center; }
    .container { text-align: center; padding: 2rem; max-width: 500px; }
    h1 { font-size: 2rem; margin-bottom: 1rem; color: #f87171; }
    p { color: #888; margin-bottom: 1rem; line-height: 1.6; }
    .domain { background: #1a1a1a; padding: 0.5rem 1rem; border-radius: 8px; font-family: monospace; color: #888; margin: 1rem 0; }
    a { color: #60a5fa; text-decoration: none; }
    a:hover { text-decoration: underline; }
  </style>
</head>
<body>
  <div class="container">
    <h1>Domain Not Configured</h1>
    <div class="domain">${host}</div>
    <p>This domain is not configured with Pagelink or verification is pending.</p>
    <p>If you own this domain, please verify it in your <a href="https://pagelink.com/dashboard/settings">Pagelink dashboard</a>.</p>
  </div>
</body>
</html>`
}

function getNotFoundHtml(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Not Found</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: system-ui, sans-serif; background: #0a0a0a; color: #fff; min-height: 100vh; display: flex; align-items: center; justify-content: center; }
    .container { text-align: center; padding: 2rem; }
    h1 { font-size: 6rem; font-weight: bold; color: #333; }
    p { color: #888; margin-top: 1rem; }
  </style>
</head>
<body>
  <div class="container">
    <h1>404</h1>
    <p>The page you're looking for doesn't exist.</p>
  </div>
</body>
</html>`
}

function getExpiredHtml(title: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Document Expired</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: system-ui, sans-serif; background: #0a0a0a; color: #fff; min-height: 100vh; display: flex; align-items: center; justify-content: center; }
    .container { text-align: center; padding: 2rem; }
    h1 { font-size: 2rem; margin-bottom: 1rem; color: #f59e0b; }
    p { color: #888; }
    .title { color: #fff; font-weight: 500; margin-bottom: 0.5rem; }
  </style>
</head>
<body>
  <div class="container">
    <h1>Document Expired</h1>
    <p class="title">${title}</p>
    <p>This document is no longer available.</p>
  </div>
</body>
</html>`
}

function getWorkspaceLandingHtml(host: string, docs: { slug: string; title: string }[]): string {
  const docLinks = docs.map(doc =>
    `<a href="/${doc.slug}" class="doc-link">${doc.title}</a>`
  ).join('')

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${host}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: system-ui, sans-serif; background: #0a0a0a; color: #fff; min-height: 100vh; padding: 4rem 2rem; }
    .container { max-width: 600px; margin: 0 auto; }
    h1 { font-size: 2rem; margin-bottom: 2rem; }
    .doc-link { display: block; padding: 1rem; background: #1a1a1a; border-radius: 8px; color: #fff; text-decoration: none; margin-bottom: 0.5rem; transition: background 0.2s; }
    .doc-link:hover { background: #2a2a2a; }
  </style>
</head>
<body>
  <div class="container">
    <h1>Documents</h1>
    ${docLinks}
  </div>
</body>
</html>`
}
