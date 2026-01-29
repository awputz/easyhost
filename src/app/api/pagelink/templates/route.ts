import { NextResponse } from 'next/server'

export interface PagelinkTemplate {
  id: string
  name: string
  description: string
  category: 'business' | 'real-estate' | 'marketing' | 'personal'
  thumbnail: string
  html: string
  defaultTitle: string
  tags: string[]
}

// Pre-built templates
const TEMPLATES: PagelinkTemplate[] = [
  {
    id: 'pitch-deck',
    name: 'Startup Pitch Deck',
    description: 'Present your startup to investors with a compelling narrative and key metrics.',
    category: 'business',
    thumbnail: '/templates/pitch-deck.png',
    tags: ['startup', 'investors', 'funding'],
    defaultTitle: 'Company Name - Series A Pitch',
    html: getPitchDeckTemplate(),
  },
  {
    id: 'investment-memo',
    name: 'Investment Memorandum',
    description: 'Professional real estate investment memo with property details, financials, and analysis.',
    category: 'real-estate',
    thumbnail: '/templates/investment-memo.png',
    tags: ['real-estate', 'investment', 'property'],
    defaultTitle: 'Investment Memorandum - Property Address',
    html: getInvestmentMemoTemplate(),
  },
  {
    id: 'consulting-proposal',
    name: 'Consulting Proposal',
    description: 'Win new clients with a structured proposal outlining scope, timeline, and pricing.',
    category: 'business',
    thumbnail: '/templates/proposal.png',
    tags: ['consulting', 'services', 'proposal'],
    defaultTitle: 'Consulting Proposal - Project Name',
    html: getProposalTemplate(),
  },
  {
    id: 'product-one-pager',
    name: 'Product One-Pager',
    description: 'Showcase your product with key features, benefits, and a clear call to action.',
    category: 'marketing',
    thumbnail: '/templates/one-pager.png',
    tags: ['product', 'marketing', 'sales'],
    defaultTitle: 'Product Name - One Pager',
    html: getOnePagerTemplate(),
  },
  {
    id: 'investor-update',
    name: 'Investor Update',
    description: 'Keep your investors informed with monthly or quarterly progress updates.',
    category: 'business',
    thumbnail: '/templates/investor-update.png',
    tags: ['investors', 'update', 'report'],
    defaultTitle: 'Q1 2025 Investor Update',
    html: getInvestorUpdateTemplate(),
  },
  {
    id: 'case-study',
    name: 'Case Study',
    description: 'Demonstrate your impact with a detailed client success story.',
    category: 'marketing',
    thumbnail: '/templates/case-study.png',
    tags: ['case-study', 'testimonial', 'results'],
    defaultTitle: 'Case Study - Client Name',
    html: getCaseStudyTemplate(),
  },
]

export async function GET() {
  return NextResponse.json(TEMPLATES.map(t => ({
    id: t.id,
    name: t.name,
    description: t.description,
    category: t.category,
    thumbnail: t.thumbnail,
    tags: t.tags,
    defaultTitle: t.defaultTitle,
  })))
}

// Template HTML generators

function getPitchDeckTemplate(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Company Name - Series A Pitch</title>
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
    <h1><span class="highlight">[Company Name]</span></h1>
    <p style="font-size: 1.5rem; opacity: 0.8; margin-bottom: 2rem;">[Your compelling tagline here]</p>
    <p style="opacity: 0.5;">Series A Pitch Deck • [Month Year]</p>
  </section>

  <section class="slide">
    <h2>The Problem</h2>
    <div class="card">
      <p style="font-size: 1.25rem;">[Describe the pain point you're solving. Make it relatable and quantifiable.]</p>
    </div>
    <div class="stat-grid">
      <div class="stat-box">
        <div class="stat-value">[X]%</div>
        <div class="stat-label">[Problem metric 1]</div>
      </div>
      <div class="stat-box">
        <div class="stat-value">$[X]</div>
        <div class="stat-label">[Problem metric 2]</div>
      </div>
      <div class="stat-box">
        <div class="stat-value">[X]</div>
        <div class="stat-label">[Problem metric 3]</div>
      </div>
    </div>
  </section>

  <section class="slide">
    <h2>Our Solution</h2>
    <div class="card">
      <p style="font-size: 1.25rem; margin-bottom: 1.5rem;">[Explain your solution in one clear paragraph.]</p>
      <ul style="font-size: 1.1rem;">
        <li>[Key feature 1]</li>
        <li>[Key feature 2]</li>
        <li>[Key feature 3]</li>
        <li>[Key feature 4]</li>
      </ul>
    </div>
  </section>

  <section class="slide">
    <h2>Market Opportunity</h2>
    <div class="stat-grid">
      <div class="stat-box">
        <div class="stat-value">$[X]B</div>
        <div class="stat-label">Total Addressable Market</div>
      </div>
      <div class="stat-box">
        <div class="stat-value">$[X]B</div>
        <div class="stat-label">Serviceable Market</div>
      </div>
      <div class="stat-box">
        <div class="stat-value">$[X]M</div>
        <div class="stat-label">Initial Target Market</div>
      </div>
    </div>
    <div class="card">
      <p>[Market context and growth drivers]</p>
    </div>
  </section>

  <section class="slide">
    <h2>Traction</h2>
    <div class="stat-grid">
      <div class="stat-box">
        <div class="stat-value">[X]K+</div>
        <div class="stat-label">Active Users</div>
      </div>
      <div class="stat-box">
        <div class="stat-value">[X]%</div>
        <div class="stat-label">MoM Growth</div>
      </div>
      <div class="stat-box">
        <div class="stat-value">$[X]K</div>
        <div class="stat-label">ARR</div>
      </div>
    </div>
    <div class="card">
      <p>[Notable customers, partnerships, or milestones]</p>
    </div>
  </section>

  <section class="slide" style="text-align: center;">
    <h2>The Ask</h2>
    <div class="card" style="max-width: 600px; margin: 0 auto;">
      <p style="font-size: 1.5rem; margin-bottom: 1rem;">Raising <span class="highlight">$[X]M Series A</span></p>
      <p style="opacity: 0.7;">[Use of funds and expected milestones]</p>
      <a href="mailto:[email]" class="cta">Let's Talk →</a>
    </div>
  </section>
</body>
</html>`
}

function getInvestmentMemoTemplate(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Investment Memorandum - Property Address</title>
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
    <h1>[Property Address]</h1>
    <p style="font-size: 1.25rem; opacity: 0.7; margin: 1rem 0;">[Neighborhood], [City]</p>
    <p style="font-size: 1rem; opacity: 0.5;">Confidential Investment Memorandum</p>
  </section>

  <section class="page">
    <div class="gold-bar"></div>
    <h2>Investment Summary</h2>
    <div class="stat-grid">
      <div class="stat-box">
        <div class="stat-value">$[X,XXX,XXX]</div>
        <div class="stat-label">Asking Price</div>
      </div>
      <div class="stat-box">
        <div class="stat-value">[X.XX]%</div>
        <div class="stat-label">Cap Rate</div>
      </div>
      <div class="stat-box">
        <div class="stat-value">$[XXX,XXX]</div>
        <div class="stat-label">Net Operating Income</div>
      </div>
      <div class="stat-box">
        <div class="stat-value">$[XXX]/SF</div>
        <div class="stat-label">Price Per Sq Ft</div>
      </div>
    </div>

    <div class="card">
      <table>
        <tr><td class="label">Address</td><td class="value">[Full Address]</td></tr>
        <tr><td class="label">Building Type</td><td class="value">[Type]</td></tr>
        <tr><td class="label">Total Square Feet</td><td class="value">[XX,XXX] SF</td></tr>
        <tr><td class="label">Year Built</td><td class="value">[YYYY]</td></tr>
        <tr><td class="label">Lot Size</td><td class="value">[X,XXX] SF</td></tr>
        <tr><td class="label">Zoning</td><td class="value">[Zone Code]</td></tr>
      </table>
    </div>
  </section>

  <section class="page">
    <div class="gold-bar"></div>
    <h2>Investment Highlights</h2>
    <div class="card">
      <ul class="highlight-list" style="list-style: none;">
        <li><strong>[Highlight 1 Title]</strong> - [Description]</li>
        <li><strong>[Highlight 2 Title]</strong> - [Description]</li>
        <li><strong>[Highlight 3 Title]</strong> - [Description]</li>
        <li><strong>[Highlight 4 Title]</strong> - [Description]</li>
        <li><strong>[Highlight 5 Title]</strong> - [Description]</li>
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
        <tr><td>[Unit 1]</td><td>[Tenant Name]</td><td>[X,XXX]</td><td>$[XX]</td><td class="value">$[XXX,XXX]</td></tr>
        <tr><td>[Unit 2]</td><td>[Tenant Name]</td><td>[X,XXX]</td><td>$[XX]</td><td class="value">$[XXX,XXX]</td></tr>
        <tr><td>[Unit 3]</td><td>[Tenant Name]</td><td>[X,XXX]</td><td>$[XX]</td><td class="value">$[XXX,XXX]</td></tr>
        <tr style="border-top: 2px solid rgba(255,255,255,0.2); font-weight: 600;">
          <td colspan="4">Total Gross Income</td>
          <td class="value">$[XXX,XXX]</td>
        </tr>
      </table>
    </div>
  </section>

  <section class="page" style="text-align: center;">
    <div class="gold-bar" style="margin: 0 auto;"></div>
    <h2>Contact</h2>
    <div class="card" style="max-width: 500px; margin: 2rem auto;">
      <p style="font-size: 1.1rem; margin-bottom: 1rem;">For additional information or to schedule a tour:</p>
      <p style="font-size: 1.25rem; color: #f0f4f8; margin-bottom: 0.5rem;">[Broker Name]</p>
      <p style="opacity: 0.7;">[Title]</p>
      <p style="color: #c9a962; margin-top: 1rem;">[email] | [phone]</p>
    </div>
  </section>
</body>
</html>`
}

function getProposalTemplate(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Consulting Proposal - Project Name</title>
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
    <p style="color: #3b82f6; font-weight: 500; margin-bottom: 1rem;">[YOUR COMPANY]</p>
    <h1>[Project/Engagement Title]</h1>
    <p style="font-size: 1.25rem; color: #6b7280; margin-bottom: 2rem;">Prepared for [Client Name]</p>
    <p style="opacity: 0.5;">[Date] • Confidential</p>
  </section>

  <section class="page">
    <div class="accent-bar"></div>
    <h2>Executive Summary</h2>
    <div class="card">
      <p>[Brief overview of the engagement, your understanding of their needs, and the value you'll deliver. Keep it to 2-3 sentences.]</p>
    </div>
    <div class="stat-row">
      <div class="stat-item">
        <div class="stat-value">[X]</div>
        <div class="stat-label">Weeks</div>
      </div>
      <div class="stat-item">
        <div class="stat-value">$[XXX]K</div>
        <div class="stat-label">Investment</div>
      </div>
      <div class="stat-item">
        <div class="stat-value">[X]x</div>
        <div class="stat-label">Expected ROI</div>
      </div>
    </div>
  </section>

  <section class="page">
    <div class="accent-bar"></div>
    <h2>Our Approach</h2>
    <div class="card">
      <h3 style="margin-bottom: 1rem; color: #111827;">Phase 1: [Name] (Weeks 1-[X])</h3>
      <ul>
        <li>[Deliverable/activity 1]</li>
        <li>[Deliverable/activity 2]</li>
        <li>[Deliverable/activity 3]</li>
      </ul>
    </div>
    <div class="card">
      <h3 style="margin-bottom: 1rem; color: #111827;">Phase 2: [Name] (Weeks [X]-[X])</h3>
      <ul>
        <li>[Deliverable/activity 1]</li>
        <li>[Deliverable/activity 2]</li>
        <li>[Deliverable/activity 3]</li>
      </ul>
    </div>
    <div class="card">
      <h3 style="margin-bottom: 1rem; color: #111827;">Phase 3: [Name] (Weeks [X]-[X])</h3>
      <ul>
        <li>[Deliverable/activity 1]</li>
        <li>[Deliverable/activity 2]</li>
        <li>[Deliverable/activity 3]</li>
      </ul>
    </div>
  </section>

  <section class="page">
    <div class="accent-bar"></div>
    <h2>Investment</h2>
    <table>
      <tr><th>Component</th><th>Description</th><th style="text-align: right;">Amount</th></tr>
      <tr><td>[Phase/Item 1]</td><td>[Brief description]</td><td style="text-align: right;">$[XX,XXX]</td></tr>
      <tr><td>[Phase/Item 2]</td><td>[Brief description]</td><td style="text-align: right;">$[XX,XXX]</td></tr>
      <tr><td>[Phase/Item 3]</td><td>[Brief description]</td><td style="text-align: right;">$[XX,XXX]</td></tr>
      <tr style="font-weight: 600;"><td colspan="2">Total Investment</td><td style="text-align: right;">$[XXX,XXX]</td></tr>
    </table>
    <div class="card" style="background: #eff6ff; border-color: #3b82f6;">
      <p><span class="highlight">Payment Terms:</span> [Your payment terms, e.g., 50% upon signing, 25% at midpoint, 25% upon completion]</p>
    </div>
  </section>

  <section class="page" style="text-align: center;">
    <div class="accent-bar" style="margin: 0 auto;"></div>
    <h2>Next Steps</h2>
    <p style="max-width: 500px; margin: 0 auto 2rem;">[Call to action - what should they do next?]</p>
    <a href="mailto:[email]" class="cta">Schedule a Call →</a>
  </section>
</body>
</html>`
}

function getOnePagerTemplate(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Product Name - One Pager</title>
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
    .cta { display: inline-block; background: #171717; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 500; }
    .testimonial { background: white; border: 1px solid #e5e5e5; border-radius: 12px; padding: 24px; margin: 2rem 0; }
    .quote { font-style: italic; color: #525252; margin-bottom: 1rem; }
    .author { font-weight: 500; color: #171717; }
  </style>
</head>
<body>
  <header style="text-align: center; margin-bottom: 4rem;">
    <p style="color: #171717; font-weight: 600; margin-bottom: 1rem;">INTRODUCING</p>
    <h1>[Product Name]</h1>
    <p class="tagline">[Your compelling value proposition in one line]</p>
  </header>

  <section>
    <div class="stat-row">
      <div class="stat-box">
        <div class="stat-value">[X]x</div>
        <div class="stat-label">[Benefit 1]</div>
      </div>
      <div class="stat-box">
        <div class="stat-value">[X]%</div>
        <div class="stat-label">[Benefit 2]</div>
      </div>
      <div class="stat-box">
        <div class="stat-value">[X]</div>
        <div class="stat-label">[Benefit 3]</div>
      </div>
    </div>
  </section>

  <section>
    <h2>Key Features</h2>
    <div class="feature-grid">
      <div class="feature">
        <div class="feature-title">[Feature 1]</div>
        <div class="feature-desc">[Brief description of the feature and its benefit]</div>
      </div>
      <div class="feature">
        <div class="feature-title">[Feature 2]</div>
        <div class="feature-desc">[Brief description of the feature and its benefit]</div>
      </div>
      <div class="feature">
        <div class="feature-title">[Feature 3]</div>
        <div class="feature-desc">[Brief description of the feature and its benefit]</div>
      </div>
      <div class="feature">
        <div class="feature-title">[Feature 4]</div>
        <div class="feature-desc">[Brief description of the feature and its benefit]</div>
      </div>
    </div>
  </section>

  <section>
    <h2>What Our Customers Say</h2>
    <div class="testimonial">
      <p class="quote">"[Compelling testimonial from a satisfied customer that highlights specific results.]"</p>
      <p class="author">[Name], [Title] at [Company]</p>
    </div>
  </section>

  <section style="text-align: center; margin-top: 4rem;">
    <h2>Ready to Get Started?</h2>
    <p style="color: #737373; margin-bottom: 1rem;">[Brief call to action text]</p>
    <a href="[link]" class="cta">[CTA Button Text] →</a>
  </section>
</body>
</html>`
}

function getInvestorUpdateTemplate(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Q1 2025 Investor Update</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Playfair+Display:wght@300;400&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Inter', sans-serif; background: #ffffff; color: #374151; line-height: 1.8; max-width: 700px; margin: 0 auto; padding: 60px 40px; }
    h1 { font-family: 'Playfair Display', serif; font-size: 2rem; font-weight: 400; color: #111827; margin-bottom: 0.5rem; }
    h2 { font-size: 1.25rem; font-weight: 600; color: #111827; margin: 2.5rem 0 1rem; padding-bottom: 0.5rem; border-bottom: 1px solid #e5e7eb; }
    .header { margin-bottom: 3rem; }
    .date { color: #6b7280; font-size: 0.875rem; }
    .highlight-box { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 20px; margin: 1.5rem 0; }
    .highlight-title { font-weight: 600; color: #166534; margin-bottom: 8px; }
    .metric-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin: 1.5rem 0; }
    .metric { text-align: center; padding: 16px; background: #f9fafb; border-radius: 8px; }
    .metric-value { font-size: 1.5rem; font-weight: 600; color: #111827; }
    .metric-label { font-size: 0.75rem; color: #6b7280; margin-top: 4px; }
    .metric-change { font-size: 0.75rem; margin-top: 4px; }
    .metric-change.up { color: #16a34a; }
    .metric-change.down { color: #dc2626; }
    ul { padding-left: 1.25rem; margin: 1rem 0; }
    li { margin-bottom: 0.5rem; }
    .ask-box { background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 20px; margin: 1.5rem 0; }
    .footer { margin-top: 3rem; padding-top: 2rem; border-top: 1px solid #e5e7eb; text-align: center; color: #6b7280; font-size: 0.875rem; }
  </style>
</head>
<body>
  <div class="header">
    <h1>[Company Name] Investor Update</h1>
    <p class="date">[Quarter/Month] [Year]</p>
  </div>

  <div class="highlight-box">
    <div class="highlight-title">TL;DR</div>
    <p>[2-3 sentence summary of the most important things from this update]</p>
  </div>

  <h2>Key Metrics</h2>
  <div class="metric-grid">
    <div class="metric">
      <div class="metric-value">$[XXX]K</div>
      <div class="metric-label">ARR</div>
      <div class="metric-change up">↑ [XX]% MoM</div>
    </div>
    <div class="metric">
      <div class="metric-value">[X,XXX]</div>
      <div class="metric-label">Active Users</div>
      <div class="metric-change up">↑ [XX]% MoM</div>
    </div>
    <div class="metric">
      <div class="metric-value">[XX]</div>
      <div class="metric-label">Months Runway</div>
      <div class="metric-change">—</div>
    </div>
  </div>

  <h2>Highlights</h2>
  <ul>
    <li><strong>[Achievement 1]:</strong> [Brief description]</li>
    <li><strong>[Achievement 2]:</strong> [Brief description]</li>
    <li><strong>[Achievement 3]:</strong> [Brief description]</li>
  </ul>

  <h2>Product Updates</h2>
  <p>[Summary of product developments, new features, or improvements]</p>
  <ul>
    <li>[Update 1]</li>
    <li>[Update 2]</li>
    <li>[Update 3]</li>
  </ul>

  <h2>Challenges</h2>
  <p>[Be transparent about challenges you're facing]</p>
  <ul>
    <li>[Challenge 1 and how you're addressing it]</li>
    <li>[Challenge 2 and how you're addressing it]</li>
  </ul>

  <h2>What's Next</h2>
  <p>[Your priorities for the next quarter/month]</p>
  <ul>
    <li>[Priority 1]</li>
    <li>[Priority 2]</li>
    <li>[Priority 3]</li>
  </ul>

  <h2>How You Can Help</h2>
  <div class="ask-box">
    <p>We'd appreciate introductions to:</p>
    <ul style="margin-bottom: 0;">
      <li>[Type of person/company 1]</li>
      <li>[Type of person/company 2]</li>
    </ul>
  </div>

  <div class="footer">
    <p>Thank you for your continued support.</p>
    <p style="margin-top: 0.5rem;">[Founder Name]<br>[Email]</p>
  </div>
</body>
</html>`
}

function getCaseStudyTemplate(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Case Study - Client Name</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Playfair+Display:wght@300;400&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Inter', sans-serif; background: #ffffff; color: #374151; line-height: 1.8; }
    .hero { background: linear-gradient(135deg, #1e3a5f 0%, #0f1f33 100%); color: white; padding: 80px 40px; text-align: center; }
    .hero h1 { font-family: 'Playfair Display', serif; font-size: 2.5rem; font-weight: 400; margin-bottom: 1rem; }
    .hero .subtitle { font-size: 1.25rem; opacity: 0.8; }
    .content { max-width: 800px; margin: 0 auto; padding: 60px 40px; }
    h2 { font-family: 'Playfair Display', serif; font-size: 1.75rem; font-weight: 400; color: #111827; margin: 2.5rem 0 1rem; }
    .results-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; margin: 2rem 0; }
    .result { text-align: center; padding: 24px; background: #f0fdf4; border-radius: 12px; }
    .result-value { font-size: 2.5rem; font-weight: 700; color: #166534; }
    .result-label { font-size: 0.875rem; color: #15803d; margin-top: 4px; }
    .quote-box { background: #f9fafb; border-left: 4px solid #3b82f6; padding: 24px; margin: 2rem 0; }
    .quote { font-size: 1.125rem; font-style: italic; color: #374151; margin-bottom: 1rem; }
    .quote-author { font-weight: 500; color: #111827; }
    .section { margin: 3rem 0; }
    ul { padding-left: 1.5rem; }
    li { margin-bottom: 0.75rem; }
    .cta { background: #3b82f6; color: white; padding: 16px 32px; border-radius: 8px; text-decoration: none; font-weight: 500; display: inline-block; margin-top: 2rem; }
  </style>
</head>
<body>
  <div class="hero">
    <p style="text-transform: uppercase; letter-spacing: 2px; font-size: 0.75rem; opacity: 0.7; margin-bottom: 1rem;">Case Study</p>
    <h1>How [Client Name] [Achieved Result]</h1>
    <p class="subtitle">[Industry] • [Company Size] • [Location]</p>
  </div>

  <div class="content">
    <div class="results-grid">
      <div class="result">
        <div class="result-value">[X]%</div>
        <div class="result-label">[Result 1 Label]</div>
      </div>
      <div class="result">
        <div class="result-value">[X]x</div>
        <div class="result-label">[Result 2 Label]</div>
      </div>
      <div class="result">
        <div class="result-value">$[X]K</div>
        <div class="result-label">[Result 3 Label]</div>
      </div>
    </div>

    <div class="section">
      <h2>The Challenge</h2>
      <p>[Describe the client's situation before working with you. What problems were they facing? What were the stakes?]</p>
      <ul>
        <li>[Specific challenge 1]</li>
        <li>[Specific challenge 2]</li>
        <li>[Specific challenge 3]</li>
      </ul>
    </div>

    <div class="section">
      <h2>The Solution</h2>
      <p>[Describe how you approached the problem and what solution you implemented.]</p>
      <ul>
        <li>[Solution component 1]</li>
        <li>[Solution component 2]</li>
        <li>[Solution component 3]</li>
      </ul>
    </div>

    <div class="section">
      <h2>The Results</h2>
      <p>[Describe the outcomes and impact of your work.]</p>
      <ul>
        <li><strong>[Metric 1]:</strong> [Specific result with numbers]</li>
        <li><strong>[Metric 2]:</strong> [Specific result with numbers]</li>
        <li><strong>[Metric 3]:</strong> [Specific result with numbers]</li>
      </ul>
    </div>

    <div class="quote-box">
      <p class="quote">"[Testimonial quote from the client about their experience working with you and the results achieved.]"</p>
      <p class="quote-author">[Name], [Title] at [Client Company]</p>
    </div>

    <div class="section" style="text-align: center;">
      <h2>Ready for Similar Results?</h2>
      <p style="color: #6b7280;">[Call to action text]</p>
      <a href="mailto:[email]" class="cta">Get Started →</a>
    </div>
  </div>
</body>
</html>`
}

// Get single template by ID
export { TEMPLATES }
