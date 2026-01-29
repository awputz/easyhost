import { NextRequest } from 'next/server'
import { createClient, isSupabaseConfigured } from '@/lib/supabase/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = process.env.ANTHROPIC_API_KEY
  ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  : null

const SYSTEM_PROMPT = `You are Pagelink's document creation AI. Your job is to create beautiful, professional web documents based on user requests.

## Your Capabilities

1. **Create Documents** - Generate complete HTML documents with inline CSS
2. **Edit Documents** - Modify existing documents based on feedback
3. **Fetch Data** - For NYC real estate, you can fetch data from public APIs
4. **Answer Questions** - Help users understand what's possible

## Design System

### Typography
Use Google Fonts with these combinations:
- Headlines: Playfair Display (weight 300, 400)
- Stats/Numbers: Gotham fallback stack (Gotham, Century Gothic, Poppins, sans-serif)
- Body: Inter (weights 300, 400, 500, 600)

### Color Themes

**Midnight Navy (Default for Real Estate)**
\`\`\`css
:root {
  --midnight: #0a1628;
  --navy: #1a2d4a;
  --steel: #2d4263;
  --gold: #c9a962;
  --pearl: #c4d0e4;
  --ivory: #f0f4f8;
}
\`\`\`

**Charcoal (Modern/Tech)**
\`\`\`css
:root {
  --primary: #2C2C2C;
  --accent: #3A3A3A;
  --text: #FFFFFF;
  --stat-bg: rgba(255,255,255,0.95);
  --stat-text: #1A1A1A;
}
\`\`\`

**Slate (Corporate/Professional)**
\`\`\`css
:root {
  --primary: #3D4F5F;
  --accent: #2D3F4F;
  --text: #F5F5F5;
}
\`\`\`

### Component Patterns

**Stat Box:**
\`\`\`html
<div style="background: rgba(255,255,255,0.95); padding: 24px; border-radius: 8px; text-align: center;">
  <div style="font-family: 'Poppins', 'Century Gothic', sans-serif; font-size: 32px; font-weight: 500; color: #1a1a1a;">$12,500,000</div>
  <div style="font-size: 11px; font-weight: 600; letter-spacing: 2px; text-transform: uppercase; opacity: 0.6; margin-top: 8px;">Asking Price</div>
</div>
\`\`\`

**Section Header:**
\`\`\`html
<div style="margin-bottom: 32px;">
  <div style="width: 40px; height: 3px; background: #c9a962; margin-bottom: 16px;"></div>
  <h2 style="font-family: 'Playfair Display', serif; font-size: 32px; font-weight: 400; margin: 0;">Investment Highlights</h2>
</div>
\`\`\`

**Data Table:**
\`\`\`html
<table style="width: 100%; border-collapse: collapse;">
  <tr style="border-bottom: 1px solid rgba(255,255,255,0.1);">
    <td style="padding: 12px 0; color: rgba(255,255,255,0.6);">Address</td>
    <td style="padding: 12px 0; text-align: right;">146 West 28th Street</td>
  </tr>
</table>
\`\`\`

**Status Badge:**
\`\`\`html
<span style="display: inline-block; padding: 4px 10px; border-radius: 3px; font-size: 9px; font-weight: 600; letter-spacing: 1px; text-transform: uppercase; background: rgba(201, 169, 98, 0.15); color: #c9a962;">Free Market</span>
\`\`\`

**Metric Grid:**
\`\`\`html
<div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px;">
  <!-- Stat boxes here -->
</div>
\`\`\`

## Document Types

### 1. Investment Memorandum (Real Estate)
Structure: Cover → Key Metrics → Property Overview → Investment Highlights → Rent Roll → Income & Expenses → Tax & Zoning → Building Details → Neighborhood → Legal → Team Contact → Back Cover

### 2. Pitch Deck
Structure: Title → Problem → Solution → Market Size → Product → Business Model → Traction → Team → Financials → The Ask

### 3. Consulting Proposal
Structure: Cover → Executive Summary → Understanding → Approach → Timeline → Team → Investment → Terms → Next Steps

### 4. One-Pager
Structure: Hero with value prop → Key stats → Features/Benefits → Social proof → CTA

### 5. Investor Update
Structure: Header → Highlights → KPIs → Progress → Challenges → Ask → Timeline

## Output Format

When generating a document, output the complete HTML:

\`\`\`html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>[Document Title]</title>
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@300;400&family=Inter:wght@300;400;500;600&family=Poppins:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Inter', sans-serif; }
    /* All CSS inline */
  </style>
</head>
<body>
  <!-- Document content -->
</body>
</html>
\`\`\`

## Important Rules

1. Always generate complete, self-contained HTML files
2. Use inline styles and embedded CSS (no external CSS except Google Fonts)
3. Make all documents responsive (mobile-friendly)
4. Include print styles for documents that might be printed
5. Use professional, confident language - no fluff or superlatives
6. Format currency with commas ($1,000,000)
7. Percentages to two decimal places (5.07%)
8. Never use dashes in professional copy (use commas instead)
9. Use semantic HTML5 elements (section, article, header, footer)
10. Add accessibility attributes where needed

## Responding to Edits

When the user asks to modify the document:
1. Acknowledge what you're changing
2. Output the COMPLETE updated HTML (not just the changed section)
3. Confirm what was changed

Remember: You're helping create documents that replace PDFs. They should be beautiful, professional, and instantly shareable.`

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      message,
      documentId,
      existingHtml = '',
      conversationHistory = [],
    } = body as {
      message: string
      documentId?: string
      existingHtml?: string
      conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>
    }

    if (!message) {
      return new Response(JSON.stringify({ error: 'Message is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Check authentication (optional for /create)
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

    // Build context for Claude
    const contextMessage = existingHtml
      ? `Current document HTML:\n\`\`\`html\n${existingHtml.slice(0, 2000)}...\n\`\`\`\n\nUser wants to modify/update this document.`
      : 'User wants to create a new document.'

    const messages: Array<{ role: 'user' | 'assistant'; content: string }> = [
      ...conversationHistory.slice(-6), // Keep last 6 messages for context
      {
        role: 'user' as const,
        content: `${contextMessage}\n\nUser request: ${message}`,
      },
    ]

    // Demo mode without API key
    if (!anthropic) {
      const demoHtml = generateDemoDocument(message)
      const demoSlug = generateSlug()

      const encoder = new TextEncoder()
      const stream = new ReadableStream({
        async start(controller) {
          // Simulate streaming
          const response = `I'll create that document for you now.\n\n\`\`\`html\n${demoHtml}\n\`\`\``
          const chunks = response.match(/.{1,100}/g) || [response]

          for (const chunk of chunks) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'content', content: chunk })}\n\n`))
            await new Promise(resolve => setTimeout(resolve, 30))
          }

          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'done', slug: demoSlug })}\n\n`))
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
            max_tokens: 16000,
            system: SYSTEM_PROMPT,
            messages: messages.map(m => ({ role: m.role, content: m.content })),
          })

          let fullResponse = ''
          let savedSlug = documentId

          for await (const event of response) {
            if (event.type === 'content_block_delta') {
              const delta = event.delta as { type: string; text?: string }
              if (delta.type === 'text_delta' && delta.text) {
                fullResponse += delta.text
                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify({ type: 'content', content: delta.text })}\n\n`)
                )
              }
            }
          }

          // Extract HTML and save to database if authenticated
          const htmlMatch = fullResponse.match(/```html\n([\s\S]*?)```/)?.[1] ||
                           fullResponse.match(/<!DOCTYPE html[\s\S]*<\/html>/i)?.[0]

          if (htmlMatch && isSupabaseConfigured() && workspaceId) {
            const supabase = await createClient()
            if (supabase) {
              const titleMatch = htmlMatch.match(/<title>([^<]+)<\/title>/i)
              const title = titleMatch ? titleMatch[1] : 'Untitled Document'

              if (documentId) {
                // Update existing
                await supabase
                  .from('pagelink_documents')
                  .update({
                    html: htmlMatch,
                    title,
                    updated_at: new Date().toISOString(),
                  })
                  .eq('slug', documentId)
              } else {
                // Create new
                savedSlug = generateSlug()
                await supabase
                  .from('pagelink_documents')
                  .insert({
                    workspace_id: workspaceId,
                    user_id: userId,
                    slug: savedSlug,
                    title,
                    html: htmlMatch,
                    is_public: true,
                  })
              }
            }
          } else if (!savedSlug) {
            savedSlug = generateSlug()
          }

          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: 'done', slug: savedSlug })}\n\n`)
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
    console.error('Generate error:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}

function generateSlug(): string {
  const adjectives = ['bold', 'swift', 'bright', 'clear', 'prime', 'keen', 'smart']
  const nouns = ['oak', 'hawk', 'peak', 'wave', 'star', 'deck', 'page']
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)]
  const noun = nouns[Math.floor(Math.random() * nouns.length)]
  const num = Math.floor(Math.random() * 999)
  return `${adj}-${noun}-${num}`
}

function generateDemoDocument(message: string): string {
  const lowerMessage = message.toLowerCase()

  if (lowerMessage.includes('pitch') || lowerMessage.includes('startup') || lowerMessage.includes('deck')) {
    return generatePitchDeck()
  } else if (lowerMessage.includes('investment') || lowerMessage.includes('memo') || lowerMessage.includes('property')) {
    return generateInvestmentMemo()
  } else if (lowerMessage.includes('proposal')) {
    return generateProposal()
  } else {
    return generateOnePager()
  }
}

function generatePitchDeck(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>TechStartup - Series A Pitch Deck</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Playfair+Display:wght@300;400&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Inter', sans-serif; background: linear-gradient(135deg, #0f0f0f 0%, #1a1a2e 100%); color: #e5e5e5; line-height: 1.7; }
    .slide { min-height: 100vh; padding: 60px; display: flex; flex-direction: column; justify-content: center; }
    h1 { font-family: 'Playfair Display', serif; font-size: 3.5rem; font-weight: 400; margin-bottom: 1rem; }
    h2 { font-family: 'Playfair Display', serif; font-size: 2.5rem; font-weight: 400; margin-bottom: 2rem; }
    .highlight { background: linear-gradient(90deg, #3b82f6, #8b5cf6); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
    .stat-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; margin: 2rem 0; }
    .stat-box { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; padding: 32px; text-align: center; }
    .stat-value { font-size: 2.5rem; font-weight: 600; color: #3b82f6; }
    .stat-label { font-size: 0.75rem; text-transform: uppercase; letter-spacing: 2px; opacity: 0.6; margin-top: 8px; }
    .card { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; padding: 32px; margin: 1.5rem 0; }
    .cta { display: inline-block; background: linear-gradient(135deg, #3b82f6, #8b5cf6); color: white; padding: 16px 32px; border-radius: 8px; font-weight: 500; text-decoration: none; margin-top: 2rem; }
    ul { padding-left: 1.5rem; }
    li { margin-bottom: 0.75rem; }
  </style>
</head>
<body>
  <section class="slide" style="text-align: center;">
    <h1><span class="highlight">TechStartup Inc.</span></h1>
    <p style="font-size: 1.5rem; opacity: 0.8; margin-bottom: 2rem;">Revolutionizing Business Automation with AI</p>
    <p style="opacity: 0.5;">Series A Pitch Deck • 2025</p>
  </section>

  <section class="slide">
    <h2>The Problem</h2>
    <div class="card">
      <p style="font-size: 1.25rem;">Every day, businesses waste countless hours on manual processes that should be automated. Current solutions are expensive, complex, and require technical expertise most teams don't have.</p>
    </div>
    <div class="stat-grid">
      <div class="stat-box">
        <div class="stat-value">40%</div>
        <div class="stat-label">Time spent on repetitive tasks</div>
      </div>
      <div class="stat-box">
        <div class="stat-value">$10K+</div>
        <div class="stat-label">Average monthly cost of current solutions</div>
      </div>
      <div class="stat-box">
        <div class="stat-value">6mo</div>
        <div class="stat-label">Average implementation time</div>
      </div>
    </div>
  </section>

  <section class="slide">
    <h2>Our Solution</h2>
    <div class="card">
      <p style="font-size: 1.25rem; margin-bottom: 1.5rem;">An AI-powered platform that automates business workflows with zero configuration. Simply describe what you want to accomplish, and our system handles the rest.</p>
      <ul style="font-size: 1.1rem;">
        <li>Natural language workflow creation</li>
        <li>Integrates with 200+ business tools</li>
        <li>Enterprise-grade security and compliance</li>
        <li>Results in days, not months</li>
      </ul>
    </div>
  </section>

  <section class="slide">
    <h2>Market Opportunity</h2>
    <div class="stat-grid">
      <div class="stat-box">
        <div class="stat-value">$120B</div>
        <div class="stat-label">Total Addressable Market</div>
      </div>
      <div class="stat-box">
        <div class="stat-value">$15B</div>
        <div class="stat-label">Serviceable Addressable Market</div>
      </div>
      <div class="stat-box">
        <div class="stat-value">$2B</div>
        <div class="stat-label">Serviceable Obtainable Market</div>
      </div>
    </div>
    <div class="card">
      <p>The business automation market is growing at 25% CAGR, driven by increasing labor costs and the need for operational efficiency.</p>
    </div>
  </section>

  <section class="slide">
    <h2>Traction</h2>
    <div class="stat-grid">
      <div class="stat-box">
        <div class="stat-value">50K+</div>
        <div class="stat-label">Active Users</div>
      </div>
      <div class="stat-box">
        <div class="stat-value">200%</div>
        <div class="stat-label">QoQ Growth</div>
      </div>
      <div class="stat-box">
        <div class="stat-value">$500K</div>
        <div class="stat-label">ARR</div>
      </div>
    </div>
    <div class="card">
      <p>Notable customers include Fortune 500 companies across finance, healthcare, and manufacturing sectors.</p>
    </div>
  </section>

  <section class="slide" style="text-align: center;">
    <h2>The Ask</h2>
    <div class="card" style="max-width: 600px; margin: 0 auto;">
      <p style="font-size: 1.5rem; margin-bottom: 1rem;">We're raising <span class="highlight">$5M Series A</span></p>
      <p style="opacity: 0.7;">to scale our team, expand enterprise features, and accelerate market penetration.</p>
      <a href="mailto:founders@techstartup.com" class="cta">Let's Talk →</a>
    </div>
  </section>
</body>
</html>`
}

function generateInvestmentMemo(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Investment Memorandum - 146 West 28th Street</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&family=Playfair+Display:wght@300;400&family=Poppins:wght@400;500;600&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Inter', sans-serif; background: linear-gradient(180deg, #0a1628 0%, #1a2d4a 100%); color: #c4d0e4; line-height: 1.7; }
    .page { min-height: 100vh; padding: 60px; }
    h1 { font-family: 'Playfair Display', serif; font-size: 3rem; font-weight: 300; color: #f0f4f8; }
    h2 { font-family: 'Playfair Display', serif; font-size: 2rem; font-weight: 400; color: #f0f4f8; margin-bottom: 1.5rem; }
    .gold-bar { width: 40px; height: 3px; background: #c9a962; margin-bottom: 16px; }
    .stat-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin: 2rem 0; }
    .stat-box { background: rgba(255,255,255,0.95); border-radius: 8px; padding: 24px; text-align: center; }
    .stat-value { font-family: 'Poppins', sans-serif; font-size: 1.75rem; font-weight: 500; color: #1a1a1a; }
    .stat-label { font-size: 0.65rem; text-transform: uppercase; letter-spacing: 2px; color: #666; margin-top: 8px; }
    .card { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 32px; margin: 1.5rem 0; }
    .badge { display: inline-block; padding: 4px 10px; border-radius: 3px; font-size: 9px; font-weight: 600; letter-spacing: 1px; text-transform: uppercase; background: rgba(201, 169, 98, 0.15); color: #c9a962; }
    table { width: 100%; border-collapse: collapse; }
    td { padding: 12px 0; border-bottom: 1px solid rgba(255,255,255,0.1); }
    .label { color: rgba(255,255,255,0.5); }
    .value { text-align: right; color: #f0f4f8; }
    .highlight-list li { margin-bottom: 12px; padding-left: 20px; position: relative; }
    .highlight-list li::before { content: ''; position: absolute; left: 0; top: 8px; width: 8px; height: 8px; background: #c9a962; border-radius: 50%; }
  </style>
</head>
<body>
  <section class="page" style="display: flex; flex-direction: column; justify-content: center; text-align: center;">
    <div class="badge" style="margin-bottom: 24px;">Exclusive Offering</div>
    <h1>146 West 28th Street</h1>
    <p style="font-size: 1.25rem; opacity: 0.7; margin: 1rem 0;">Chelsea, Manhattan</p>
    <p style="font-size: 1rem; opacity: 0.5;">Confidential Investment Memorandum</p>
  </section>

  <section class="page">
    <div class="gold-bar"></div>
    <h2>Investment Summary</h2>
    <div class="stat-grid">
      <div class="stat-box">
        <div class="stat-value">$12,500,000</div>
        <div class="stat-label">Asking Price</div>
      </div>
      <div class="stat-box">
        <div class="stat-value">5.07%</div>
        <div class="stat-label">Cap Rate</div>
      </div>
      <div class="stat-box">
        <div class="stat-value">$634,000</div>
        <div class="stat-label">Net Operating Income</div>
      </div>
      <div class="stat-box">
        <div class="stat-value">$781/SF</div>
        <div class="stat-label">Price Per Sq Ft</div>
      </div>
    </div>

    <div class="card">
      <table>
        <tr><td class="label">Address</td><td class="value">146 West 28th Street, New York, NY 10001</td></tr>
        <tr><td class="label">Building Type</td><td class="value">Mixed-Use (Retail + Office)</td></tr>
        <tr><td class="label">Total Square Feet</td><td class="value">16,000 SF</td></tr>
        <tr><td class="label">Year Built</td><td class="value">1920</td></tr>
        <tr><td class="label">Lot Size</td><td class="value">2,500 SF</td></tr>
        <tr><td class="label">Zoning</td><td class="value">C6-4A</td></tr>
      </table>
    </div>
  </section>

  <section class="page">
    <div class="gold-bar"></div>
    <h2>Investment Highlights</h2>
    <div class="card">
      <ul class="highlight-list" style="list-style: none;">
        <li><strong>Prime Chelsea Location</strong> - Steps from the High Line and Madison Square Park</li>
        <li><strong>Strong Tenant Mix</strong> - 100% occupied with established retail and office tenants</li>
        <li><strong>Below Market Rents</strong> - 20% upside potential upon lease renewal</li>
        <li><strong>Value-Add Opportunity</strong> - Air rights available for vertical expansion</li>
        <li><strong>Recent Improvements</strong> - New facade, HVAC, and common areas (2023)</li>
      </ul>
    </div>
  </section>

  <section class="page">
    <div class="gold-bar"></div>
    <h2>Rent Roll</h2>
    <div class="card">
      <table>
        <tr style="border-bottom: 2px solid rgba(255,255,255,0.2);">
          <td class="label">Unit</td>
          <td class="label">Tenant</td>
          <td class="label">SF</td>
          <td class="label">$/SF</td>
          <td class="value">Annual Rent</td>
        </tr>
        <tr><td>Ground Floor</td><td>Retail Tenant A</td><td>4,000</td><td>$85</td><td class="value">$340,000</td></tr>
        <tr><td>2nd Floor</td><td>Office Tenant B</td><td>4,000</td><td>$55</td><td class="value">$220,000</td></tr>
        <tr><td>3rd Floor</td><td>Office Tenant C</td><td>4,000</td><td>$50</td><td class="value">$200,000</td></tr>
        <tr><td>4th Floor</td><td>Office Tenant D</td><td>4,000</td><td>$48</td><td class="value">$192,000</td></tr>
        <tr style="border-top: 2px solid rgba(255,255,255,0.2); font-weight: 600;">
          <td colspan="4">Total Gross Income</td>
          <td class="value">$952,000</td>
        </tr>
      </table>
    </div>
  </section>

  <section class="page" style="text-align: center;">
    <div class="gold-bar" style="margin: 0 auto;"></div>
    <h2>Contact</h2>
    <div class="card" style="max-width: 500px; margin: 2rem auto;">
      <p style="font-size: 1.1rem; margin-bottom: 1rem;">For additional information or to schedule a property tour, please contact:</p>
      <p style="font-size: 1.25rem; color: #f0f4f8; margin-bottom: 0.5rem;">John Smith</p>
      <p style="opacity: 0.7;">Senior Investment Associate</p>
      <p style="color: #c9a962; margin-top: 1rem;">john.smith@realestate.com | (212) 555-0100</p>
    </div>
  </section>
</body>
</html>`
}

function generateProposal(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Consulting Proposal - Digital Transformation</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&family=Playfair+Display:wght@300;400&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Inter', sans-serif; background: #ffffff; color: #374151; line-height: 1.8; }
    .page { min-height: 100vh; padding: 60px 80px; max-width: 900px; margin: 0 auto; }
    h1 { font-family: 'Playfair Display', serif; font-size: 2.5rem; font-weight: 400; color: #111827; margin-bottom: 1rem; }
    h2 { font-family: 'Playfair Display', serif; font-size: 1.75rem; font-weight: 400; color: #111827; margin-bottom: 1.5rem; }
    .accent-bar { width: 40px; height: 3px; background: #3b82f6; margin-bottom: 16px; }
    .card { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 12px; padding: 24px; margin: 1.5rem 0; }
    .highlight { color: #3b82f6; font-weight: 500; }
    .stat-row { display: flex; gap: 24px; margin: 2rem 0; }
    .stat-item { flex: 1; text-align: center; padding: 24px; background: #f9fafb; border-radius: 8px; }
    .stat-value { font-size: 2rem; font-weight: 600; color: #3b82f6; }
    .stat-label { font-size: 0.75rem; text-transform: uppercase; letter-spacing: 1px; opacity: 0.6; margin-top: 4px; }
    table { width: 100%; border-collapse: collapse; margin: 1rem 0; }
    th, td { padding: 12px; text-align: left; border-bottom: 1px solid #e5e7eb; }
    th { font-weight: 500; color: #6b7280; font-size: 0.875rem; }
    .cta { display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 500; }
    ul { padding-left: 1.5rem; }
    li { margin-bottom: 0.5rem; }
  </style>
</head>
<body>
  <section class="page" style="display: flex; flex-direction: column; justify-content: center;">
    <p style="color: #3b82f6; font-weight: 500; margin-bottom: 1rem;">CONSULTING PROPOSAL</p>
    <h1>Digital Transformation Strategy</h1>
    <p style="font-size: 1.25rem; color: #6b7280; margin-bottom: 2rem;">Prepared for Acme Corporation</p>
    <p style="opacity: 0.5;">January 2025 • Confidential</p>
  </section>

  <section class="page">
    <div class="accent-bar"></div>
    <h2>Executive Summary</h2>
    <div class="card">
      <p>We propose a comprehensive 3-month engagement to modernize Acme Corporation's technology infrastructure and business processes. Our approach combines strategic planning with hands-on implementation to deliver measurable results.</p>
    </div>
    <div class="stat-row">
      <div class="stat-item">
        <div class="stat-value">3</div>
        <div class="stat-label">Months</div>
      </div>
      <div class="stat-item">
        <div class="stat-value">$150K</div>
        <div class="stat-label">Investment</div>
      </div>
      <div class="stat-item">
        <div class="stat-value">4x</div>
        <div class="stat-label">Expected ROI</div>
      </div>
    </div>
  </section>

  <section class="page">
    <div class="accent-bar"></div>
    <h2>Our Approach</h2>
    <div class="card">
      <h3 style="margin-bottom: 1rem; color: #111827;">Phase 1: Discovery (Weeks 1-2)</h3>
      <ul>
        <li>Stakeholder interviews and requirements gathering</li>
        <li>Current state technology assessment</li>
        <li>Process mapping and gap analysis</li>
      </ul>
    </div>
    <div class="card">
      <h3 style="margin-bottom: 1rem; color: #111827;">Phase 2: Strategy (Weeks 3-4)</h3>
      <ul>
        <li>Future state architecture design</li>
        <li>Technology vendor evaluation</li>
        <li>Implementation roadmap development</li>
      </ul>
    </div>
    <div class="card">
      <h3 style="margin-bottom: 1rem; color: #111827;">Phase 3: Implementation (Weeks 5-12)</h3>
      <ul>
        <li>System configuration and integration</li>
        <li>Data migration and testing</li>
        <li>Training and change management</li>
      </ul>
    </div>
  </section>

  <section class="page">
    <div class="accent-bar"></div>
    <h2>Investment</h2>
    <table>
      <tr><th>Component</th><th>Description</th><th style="text-align: right;">Amount</th></tr>
      <tr><td>Discovery & Strategy</td><td>Weeks 1-4</td><td style="text-align: right;">$45,000</td></tr>
      <tr><td>Implementation</td><td>Weeks 5-12</td><td style="text-align: right;">$85,000</td></tr>
      <tr><td>Training & Support</td><td>Throughout engagement</td><td style="text-align: right;">$20,000</td></tr>
      <tr style="font-weight: 600;"><td colspan="2">Total Investment</td><td style="text-align: right;">$150,000</td></tr>
    </table>
    <div class="card" style="background: #eff6ff; border-color: #3b82f6;">
      <p><span class="highlight">Payment Terms:</span> 50% upon signing, 25% at Phase 2 completion, 25% upon project completion.</p>
    </div>
  </section>

  <section class="page" style="text-align: center;">
    <div class="accent-bar" style="margin: 0 auto;"></div>
    <h2>Next Steps</h2>
    <p style="max-width: 500px; margin: 0 auto 2rem;">Ready to begin? Let's schedule a call to discuss your specific needs and answer any questions.</p>
    <a href="mailto:hello@consulting.com" class="cta">Schedule a Call →</a>
  </section>
</body>
</html>`
}

function generateOnePager(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Product One-Pager</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Inter', sans-serif; background: #fafafa; color: #525252; line-height: 1.8; max-width: 800px; margin: 0 auto; padding: 60px 40px; }
    h1 { font-size: 2.5rem; font-weight: 600; color: #171717; letter-spacing: -0.025em; margin-bottom: 1rem; }
    h2 { font-size: 1.5rem; font-weight: 600; color: #262626; margin: 3rem 0 1rem; }
    .tagline { font-size: 1.25rem; color: #737373; margin-bottom: 2rem; }
    .stat-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; margin: 2rem 0; }
    .stat-box { background: white; border: 1px solid #e5e5e5; border-radius: 12px; padding: 24px; text-align: center; }
    .stat-value { font-size: 2rem; font-weight: 600; color: #171717; }
    .stat-label { font-size: 0.75rem; text-transform: uppercase; letter-spacing: 1px; color: #a3a3a3; margin-top: 4px; }
    .feature-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; }
    .feature { background: white; border: 1px solid #e5e5e5; border-radius: 8px; padding: 20px; }
    .feature-title { font-weight: 600; color: #171717; margin-bottom: 4px; }
    .feature-desc { font-size: 0.875rem; color: #737373; }
    .cta { display: inline-block; background: #171717; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 500; margin-top: 2rem; }
    .testimonial { background: white; border: 1px solid #e5e5e5; border-radius: 12px; padding: 24px; margin: 2rem 0; }
    .quote { font-style: italic; color: #525252; margin-bottom: 1rem; }
    .author { font-weight: 500; color: #171717; }
  </style>
</head>
<body>
  <header style="text-align: center; margin-bottom: 4rem;">
    <p style="color: #171717; font-weight: 600; margin-bottom: 1rem;">INTRODUCING</p>
    <h1>Product Name</h1>
    <p class="tagline">The simplest way to accomplish your goal</p>
  </header>

  <section>
    <div class="stat-row">
      <div class="stat-box">
        <div class="stat-value">10x</div>
        <div class="stat-label">Faster</div>
      </div>
      <div class="stat-box">
        <div class="stat-value">50%</div>
        <div class="stat-label">Cost Savings</div>
      </div>
      <div class="stat-box">
        <div class="stat-value">99.9%</div>
        <div class="stat-label">Uptime</div>
      </div>
    </div>
  </section>

  <section>
    <h2>Key Features</h2>
    <div class="feature-grid">
      <div class="feature">
        <div class="feature-title">Easy Setup</div>
        <div class="feature-desc">Get started in minutes with no technical knowledge required</div>
      </div>
      <div class="feature">
        <div class="feature-title">Powerful Analytics</div>
        <div class="feature-desc">Track everything that matters with real-time dashboards</div>
      </div>
      <div class="feature">
        <div class="feature-title">Integrations</div>
        <div class="feature-desc">Connect with 100+ tools you already use</div>
      </div>
      <div class="feature">
        <div class="feature-title">24/7 Support</div>
        <div class="feature-desc">Our team is always here to help you succeed</div>
      </div>
    </div>
  </section>

  <section>
    <h2>What Our Customers Say</h2>
    <div class="testimonial">
      <p class="quote">"This product has transformed how we work. We've saved countless hours and our team is more productive than ever."</p>
      <p class="author">Sarah Johnson, CEO at TechCorp</p>
    </div>
  </section>

  <section style="text-align: center; margin-top: 4rem;">
    <h2>Ready to Get Started?</h2>
    <p style="color: #737373; margin-bottom: 1rem;">Join thousands of companies already using our product.</p>
    <a href="#" class="cta">Start Free Trial →</a>
  </section>
</body>
</html>`
}
