import { NextRequest } from 'next/server'
import { createClient, isSupabaseConfigured } from '@/lib/supabase/server'
import Anthropic from '@anthropic-ai/sdk'
import { PageTemplateType, PageTheme } from '@/types'

const anthropic = process.env.ANTHROPIC_API_KEY
  ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  : null

const SYSTEM_PROMPT = `You are Pagelink AI, an expert at creating beautiful, professional HTML documents. Your job is to transform user descriptions into stunning, interactive web pages.

CRITICAL RULES:
1. Output ONLY valid HTML - no markdown, no explanations, no code fences
2. Use semantic HTML5 elements (section, article, header, main, footer, etc.)
3. Include proper accessibility attributes (alt, aria-label, etc.)
4. Design for the specified theme - your HTML will be styled by predefined CSS
5. Use these CSS classes for styling:
   - .highlight - for emphasized text with gradient/color
   - .card - for card containers with background and border
   - .metric - for large numbers/statistics
   - .grid - for responsive grid layouts
   - .cta - for call-to-action buttons
6. Never include <style>, <script>, <html>, <head>, or <body> tags - only content elements
7. Make content scannable with clear hierarchy (h1, h2, h3, lists, etc.)
8. For pitch decks/presentations, use section elements for each "slide"
9. Include relevant emojis sparingly for visual interest
10. Keep text concise and impactful - this isn't a blog post

DOCUMENT TYPES & STRUCTURES:

Pitch Deck:
- Hero section with company name and tagline
- Problem section (what pain point you solve)
- Solution section (your product)
- Market size (TAM/SAM/SOM with .metric class)
- Traction/milestones section
- Team section
- Financials/ask section
- Contact/CTA section

Investment Memo:
- Executive summary
- Company overview
- Market opportunity
- Product/technology
- Business model
- Competition
- Financials
- Investment thesis
- Risks and mitigations

Proposal:
- Cover/intro section
- Problem statement
- Proposed solution
- Scope of work
- Timeline
- Pricing/investment
- Why us/team
- Next steps

One-Pager:
- Header with logo area and title
- Key value proposition
- Core features/benefits (use .grid)
- Key metrics (.metric class)
- Social proof/testimonials
- CTA

Remember: Your output replaces PDF documents. Make it visually stunning and easy to scan!`

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      message,
      pageId,
      templateType,
      theme = 'professional-dark',
      existingHtml = '',
      conversationHistory = [],
    } = body as {
      message: string
      pageId?: string
      templateType?: PageTemplateType
      theme?: PageTheme
      existingHtml?: string
      conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>
    }

    if (!message) {
      return new Response(JSON.stringify({ error: 'Message is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Check authentication
    let userId: string | null = null
    let workspaceId: string | null = null

    if (isSupabaseConfigured()) {
      const supabase = await createClient()
      if (supabase) {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          userId = user.id
          const { data: workspace } = await supabase
            .from('workspaces')
            .select('id')
            .eq('owner_id', user.id)
            .single()
          workspaceId = workspace?.id || null
        }
      }
    }

    // Build messages for Claude
    const contextMessage = existingHtml
      ? `Current document HTML:\n\`\`\`html\n${existingHtml}\n\`\`\`\n\nUser wants to modify/update this document.`
      : templateType
      ? `User wants to create a ${templateType.replace('-', ' ')}. Generate a complete document.`
      : 'User wants to create a new document.'

    const themeMessage = `Theme: ${theme}. Use the appropriate styling classes for this theme.`

    const messages: Array<{ role: 'user' | 'assistant'; content: string }> = [
      ...conversationHistory,
      {
        role: 'user' as const,
        content: `${contextMessage}\n\n${themeMessage}\n\nUser request: ${message}`,
      },
    ]

    // Demo mode without API key
    if (!anthropic) {
      const demoHtml = generateDemoHtml(message, templateType, theme)

      // Return as streaming response for consistency
      const encoder = new TextEncoder()
      const stream = new ReadableStream({
        async start(controller) {
          // Simulate streaming with chunks
          const chunks = demoHtml.match(/.{1,50}/g) || [demoHtml]
          for (const chunk of chunks) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'content', content: chunk })}\n\n`))
            await new Promise(resolve => setTimeout(resolve, 20))
          }
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'done', pageId: pageId || 'demo-page' })}\n\n`))
          controller.close()
        },
      })

      return new Response(stream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      })
    }

    // Real Claude API call with streaming
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const response = await anthropic.messages.stream({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 8000,
            system: SYSTEM_PROMPT,
            messages: messages.map(m => ({ role: m.role, content: m.content })),
          })

          let fullHtml = ''

          for await (const event of response) {
            if (event.type === 'content_block_delta') {
              const delta = event.delta as { type: string; text?: string }
              if (delta.type === 'text_delta' && delta.text) {
                fullHtml += delta.text
                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify({ type: 'content', content: delta.text })}\n\n`)
                )
              }
            }
          }

          // Save to database if authenticated
          let savedPageId = pageId
          if (isSupabaseConfigured() && userId && workspaceId) {
            const supabase = await createClient()
            if (supabase) {
              if (pageId) {
                // Update existing page
                await supabase
                  .from('pages')
                  .update({ html: fullHtml, updated_at: new Date().toISOString() })
                  .eq('id', pageId)

                // Save chat messages
                await supabase.from('page_chats').insert([
                  { page_id: pageId, role: 'user', content: message },
                  { page_id: pageId, role: 'assistant', content: fullHtml },
                ])
              } else {
                // Create new page
                const slug = generateSlug()
                const { data: newPage } = await supabase
                  .from('pages')
                  .insert({
                    workspace_id: workspaceId,
                    slug,
                    title: extractTitle(fullHtml) || 'Untitled Document',
                    html: fullHtml,
                    template_type: templateType || null,
                    theme,
                    is_public: true,
                    created_by: userId,
                  })
                  .select('id')
                  .single()

                savedPageId = newPage?.id

                if (savedPageId) {
                  // Save initial chat
                  await supabase.from('page_chats').insert([
                    { page_id: savedPageId, role: 'user', content: message },
                    { page_id: savedPageId, role: 'assistant', content: fullHtml },
                  ])
                }
              }
            }
          }

          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: 'done', pageId: savedPageId, html: fullHtml })}\n\n`)
          )
          controller.close()
        } catch (error) {
          console.error('Claude API error:', error)
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: 'error', message: 'Failed to generate document' })}\n\n`)
          )
          controller.close()
        }
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })
  } catch (error) {
    console.error('Generate page error:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}

function generateSlug(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  let slug = ''
  for (let i = 0; i < 8; i++) {
    slug += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return slug
}

function extractTitle(html: string): string | null {
  const h1Match = html.match(/<h1[^>]*>([^<]+)<\/h1>/i)
  return h1Match ? h1Match[1].trim() : null
}

function generateDemoHtml(message: string, templateType?: PageTemplateType, theme?: PageTheme): string {
  // Generate demo content based on the message and template type
  const demoContent: Record<string, string> = {
    'pitch-deck': `
<section class="hero" style="text-align: center; padding: 4rem 0;">
  <h1>🚀 <span class="highlight">Your Startup Name</span></h1>
  <p style="font-size: 1.25rem; opacity: 0.8;">Transforming the way people do something amazing</p>
</section>

<section>
  <h2>The Problem</h2>
  <div class="card">
    <p>Every day, millions of people struggle with this specific problem. Current solutions are outdated, expensive, or simply don't work.</p>
  </div>
</section>

<section>
  <h2>Our Solution</h2>
  <div class="card">
    <p>We've built an AI-powered platform that solves this problem 10x better than existing alternatives.</p>
  </div>
</section>

<section>
  <h2>Market Opportunity</h2>
  <div class="grid">
    <div class="card" style="text-align: center;">
      <div class="metric">$50B</div>
      <p>Total Addressable Market</p>
    </div>
    <div class="card" style="text-align: center;">
      <div class="metric">$5B</div>
      <p>Serviceable Market</p>
    </div>
    <div class="card" style="text-align: center;">
      <div class="metric">$500M</div>
      <p>Initial Target Market</p>
    </div>
  </div>
</section>

<section>
  <h2>Traction</h2>
  <div class="grid">
    <div class="card" style="text-align: center;">
      <div class="metric">10,000+</div>
      <p>Active Users</p>
    </div>
    <div class="card" style="text-align: center;">
      <div class="metric">150%</div>
      <p>MoM Growth</p>
    </div>
    <div class="card" style="text-align: center;">
      <div class="metric">$100K</div>
      <p>Monthly Revenue</p>
    </div>
  </div>
</section>

<section>
  <h2>The Ask</h2>
  <div class="card" style="text-align: center;">
    <p>We're raising <span class="highlight">$2M Seed Round</span> to accelerate growth and expand our team.</p>
    <a href="#" class="cta">Let's Talk →</a>
  </div>
</section>`,
    'one-pager': `
<header style="text-align: center; padding: 2rem 0; border-bottom: 1px solid rgba(255,255,255,0.1); margin-bottom: 2rem;">
  <h1><span class="highlight">Company Name</span></h1>
  <p>Your compelling tagline that captures attention</p>
</header>

<section>
  <h2>What We Do</h2>
  <p>We provide an innovative solution that helps businesses achieve their goals faster and more efficiently.</p>
</section>

<section>
  <h2>Key Benefits</h2>
  <div class="grid">
    <div class="card">
      <h3>⚡ Fast</h3>
      <p>Get results 10x faster than traditional methods</p>
    </div>
    <div class="card">
      <h3>🎯 Accurate</h3>
      <p>99.9% accuracy powered by AI</p>
    </div>
    <div class="card">
      <h3>💰 Affordable</h3>
      <p>Save 50% compared to competitors</p>
    </div>
  </div>
</section>

<section style="text-align: center; padding: 2rem 0;">
  <h2>Ready to Get Started?</h2>
  <a href="#" class="cta">Schedule a Demo</a>
</section>`,
    'default': `
<article>
  <h1>${message.slice(0, 50)}...</h1>

  <section>
    <h2>Overview</h2>
    <p>This document was generated based on your request. In a full implementation with the Anthropic API configured, this would contain AI-generated content tailored to your specific needs.</p>
  </section>

  <section>
    <h2>Key Points</h2>
    <div class="card">
      <ul>
        <li>Point one about your topic</li>
        <li>Point two with relevant information</li>
        <li>Point three with actionable insights</li>
      </ul>
    </div>
  </section>

  <section>
    <h2>Summary</h2>
    <p>Configure your <span class="highlight">ANTHROPIC_API_KEY</span> environment variable to enable AI-powered document generation.</p>
  </section>
</article>`,
  }

  return demoContent[templateType || 'default'] || demoContent['default']
}
