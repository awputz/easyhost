import { NextRequest, NextResponse } from 'next/server'
import { createClient, isSupabaseConfigured } from '@/lib/supabase/server'

// GET - Get a document by slug (for editing)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params

  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json(getDemoDocument(slug))
    }

    const supabase = await createClient()
    if (!supabase) {
      return NextResponse.json(getDemoDocument(slug))
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get document by slug - must be owned by user
    const { data: document, error } = await supabase
      .from('pagelink_documents')
      .select('*')
      .eq('slug', slug)
      .eq('user_id', user.id)
      .single()

    if (error || !document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    // Don't return password hash
    const { password_hash, ...safeDoc } = document
    return NextResponse.json({
      ...safeDoc,
      has_password: !!password_hash,
    })
  } catch (error) {
    console.error('Document by slug GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

function getDemoDocument(slug: string) {
  return {
    id: `demo-${slug}`,
    slug,
    title: 'Demo Document',
    html: getDemoHtml(),
    document_type: 'pitch_deck',
    theme: 'midnight',
    is_public: true,
    has_password: false,
    expires_at: null,
    allowed_emails: null,
    show_pagelink_badge: true,
    view_count: 42,
    chat_history: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
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
    h1 { font-family: 'Playfair Display', serif; font-size: 3rem; font-weight: 400; text-align: center; margin-bottom: 2rem; }
    .highlight { background: linear-gradient(90deg, #3b82f6, #8b5cf6); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
    .card { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; padding: 32px; margin: 2rem auto; max-width: 600px; text-align: center; }
  </style>
</head>
<body>
  <h1><span class="highlight">Demo Document</span></h1>
  <div class="card">
    <p>This is a demo document. Edit it using the chat on the left to see real-time changes.</p>
  </div>
</body>
</html>`
}
