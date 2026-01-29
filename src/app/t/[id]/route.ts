import { NextRequest, NextResponse } from 'next/server'
import { createClient, isSupabaseConfigured } from '@/lib/supabase/server'
import { renderTemplate } from '@/lib/templates'

interface RouteParams {
  params: Promise<{ id: string }>
}

// Demo template content
const DEMO_TEMPLATE = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{company_name}} - {{hero_title}}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: system-ui, -apple-system, sans-serif; background: #0f0f1a; color: white; min-height: 100vh; }
    .hero { padding: 4rem 2rem; text-align: center; background: linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 100%); }
    .logo { font-size: 2rem; font-weight: bold; color: {{primary_color}}; margin-bottom: 1rem; }
    h1 { font-size: 3rem; margin-bottom: 1rem; }
    p { color: #a1a1aa; max-width: 600px; margin: 0 auto 2rem; }
    .btn { display: inline-block; padding: 1rem 2rem; background: {{primary_color}}; color: white; text-decoration: none; border-radius: 0.5rem; font-weight: 500; }
    .btn:hover { opacity: 0.9; }
  </style>
</head>
<body>
  <div class="hero">
    <div class="logo">{{company_name}}</div>
    <h1>{{hero_title}}</h1>
    <p>This is a demo template from Pagelink. Create dynamic landing pages with variable injection.</p>
    <a href="#" class="btn">Get Started</a>
  </div>
</body>
</html>`

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const searchParams = request.nextUrl.searchParams

    // Check for URL parameter overrides
    const urlVariables: Record<string, string> = {}
    searchParams.forEach((value, key) => {
      urlVariables[key] = value
    })

    // Demo mode handling
    if (!isSupabaseConfigured()) {
      // Demo mode - render with demo data
      const demoVariables = {
        company_name: 'Demo Company',
        hero_title: 'Welcome to the Future',
        primary_color: '#8b5cf6',
        ...urlVariables, // URL params can override
      }

      const renderedHtml = renderTemplate(DEMO_TEMPLATE, demoVariables)

      return new NextResponse(renderedHtml, {
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 'public, max-age=3600', // 1 hour cache for demo
        },
      })
    }

    const supabase = await createClient()
    if (!supabase) {
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 500 }
      )
    }

    // Find the instance
    const { data: instance, error: instanceError } = await supabase
      .from('template_instances')
      .select('*, template:assets(id, storage_path, template_schema)')
      .or(`id.eq.${id},public_url.eq./t/${id}`)
      .single()

    if (instanceError || !instance) {
      return new NextResponse(
        `<!DOCTYPE html>
        <html>
        <head><title>Not Found - Pagelink</title></head>
        <body style="font-family: system-ui; display: flex; align-items: center; justify-content: center; min-height: 100vh; background: #0f0f1a; color: white;">
          <div style="text-align: center;">
            <h1 style="font-size: 4rem; margin-bottom: 1rem;">404</h1>
            <p style="color: #a1a1aa;">Template instance not found</p>
            <a href="/" style="color: #8b5cf6; margin-top: 1rem; display: inline-block;">Go to Pagelink</a>
          </div>
        </body>
        </html>`,
        {
          status: 404,
          headers: { 'Content-Type': 'text/html; charset=utf-8' },
        }
      )
    }

    // Get the template content from storage
    const { data: templateFile, error: downloadError } = await supabase
      .storage
      .from('assets')
      .download(instance.template.storage_path)

    if (downloadError || !templateFile) {
      return NextResponse.json(
        { error: 'Failed to load template' },
        { status: 500 }
      )
    }

    const templateContent = await templateFile.text()

    // Merge stored variables with URL parameter overrides
    const variables = {
      ...instance.variables,
      ...urlVariables,
    }

    // Render the template
    const renderedHtml = renderTemplate(templateContent, variables)

    // Track analytics
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] ||
               request.headers.get('x-real-ip') ||
               'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'
    const referrer = request.headers.get('referer') || null

    await supabase
      .from('analytics_events')
      .insert({
        workspace_id: instance.workspace_id,
        asset_id: instance.template_id,
        event_type: 'view',
        ip_address: ip,
        user_agent: userAgent,
        referrer,
      })

    return new NextResponse(renderedHtml, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=300', // 5 min cache
      },
    })
  } catch (error) {
    console.error('Template render error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
