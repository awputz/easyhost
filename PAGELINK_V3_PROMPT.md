# 🏙️ PAGELINK V3 - THE ULTIMATE NYC CRE PLATFORM

## Complete Handoff Prompt for New Claude Code Session

---

# PAGELINK: AI-Powered Commercial Real Estate Document Platform

You are building Pagelink V3 - the most powerful AI document builder for NYC commercial real estate. This platform helps brokers create institutional-quality marketing materials in minutes.

---

## 🎯 MISSION

Create the **Bloomberg Terminal of CRE Marketing** - a platform where any broker can produce documents that rival CBRE, JLL, and Cushman & Wakefield quality.

---

## 🏗️ TECH STACK

- **Framework**: Next.js 14+ (App Router)
- **Database**: Supabase (PostgreSQL + Auth + Storage)
- **AI**: Anthropic Claude API (claude-sonnet-4-20250514)
- **Payments**: Stripe
- **Styling**: Tailwind CSS + Custom Design System
- **Maps**: Mapbox GL
- **Blockchain**: Ethereum/Polygon (for signatures - Coming Soon)

---

## 🎨 BRAND DESIGN SYSTEM

### Colors
```css
--navy-950: #0A1628;
--navy-900: #0F2137;
--navy-800: #1E3A5F;
--cream-50: #FAF9F7;
--cream-100: #F5F4F2;
--blue: #3B82F6;
--blue-hover: #2563EB;
--gold: #C9A962;
```

### Typography
- **Display**: Cormorant Garamond (elegant serif for headlines)
- **Body**: Libre Franklin (clean sans-serif)
- **Stats/Numbers**: IBM Plex Mono (monospace for credibility)
- **Alternative Display**: Playfair Display

### Design Principles
- Luxury, institutional, minimal
- Generous whitespace
- Gold accents for premium feel
- Dark themes for sophistication
- Print-ready quality

---

## 📁 V2 FILES TO FETCH

Get these from `https://raw.githubusercontent.com/awputz/easyhost/main/`:

```
src/lib/cre-themes.ts           # 6 premium themes
src/services/nyc-property.ts    # NYC PLUTO API integration
src/app/create/page.tsx         # AI document builder
src/components/pagelink/preview-panel.tsx
src/components/pagelink/chat-panel.tsx
src/app/api/pagelink/generate/route.ts
src/app/api/analytics/track/route.ts
src/app/dashboard/page.tsx
src/components/layout/sidebar.tsx
src/types/index.ts
src/app/p/[slug]/page.tsx       # Public document viewer
```

---

## 🏢 NYC REAL ESTATE - COMPLETE COVERAGE

### Property Types to Support

#### 1. Multifamily
- **Free Market** - Market rate apartments
- **Rent Stabilized** - RS units with DHCR registration
- **Rent Controlled** - Legacy RC units
- **Mixed (Free/Stabilized)** - Combination buildings
- **HDFC** - Housing Development Fund Corporation
- **Mitchell-Lama** - Affordable housing program

#### 2. Commercial
- **Office** - Class A, B, C
- **Retail** - Street retail, big box, mall
- **Industrial** - Warehouse, manufacturing, last-mile
- **Flex** - Office/industrial hybrid
- **Medical** - Healthcare facilities

#### 3. Development
- **Development Sites** - Buildable lots
- **Air Rights** - Transferable development rights
- **Assemblage** - Multiple lots for larger development
- **Conversion** - Office-to-resi, etc.

#### 4. Specialty
- **Hotels** - Full service, boutique, extended stay
- **Self-Storage** - Climate controlled, drive-up
- **Parking** - Garages, surface lots
- **Land** - Vacant land, ground leases
- **Mixed-Use** - Retail + residential/office

### NYC-Specific Data Points

#### Zoning & Land Use
- Zoning District (R, C, M designations)
- FAR (Floor Area Ratio) - Residential, Commercial, Facility
- Built FAR vs Max FAR
- Air Rights calculation
- Overlay districts (Special Purpose)
- Landmark status
- Environmental restrictions

#### Tax & Financials
- Tax Class (1, 2, 2A, 2B, 4)
- Assessed Value (Land + Building)
- Tax Rate and Annual Taxes
- 421a/J-51 abatement status
- ICAP benefits
- Tax lot information

#### Building Details
- Year Built / Year Altered
- Building Class (A, B, C, D series)
- Construction Class
- Number of Buildings on lot
- Number of Floors
- Unit count (total, residential, commercial)
- Elevator buildings vs walk-up

#### Rent Regulation
- DHCR registration status
- Number of stabilized units
- Legal vs preferential rents
- MCI/IAI history
- RGB increases

#### Transaction Data (ACRIS)
- Recent sales history
- Mortgage recordings
- Deed transfers
- UCC filings

---

## 📄 DOCUMENT TYPES (V3 EXPANDED)

### Investment Sales
1. **Offering Memorandum (OM)** - Full investment package (10-30 pages)
2. **Tear Sheet** - One-page property summary
3. **One Pager** - Quick overview with key stats
4. **Executive Summary** - 2-3 page deal summary
5. **Investment Highlights** - Bullet-point sell sheet

### Leasing
6. **Leasing Flyer** - Available space marketing
7. **Floor Plan Sheet** - Space layout with specs
8. **Building Brochure** - Full building marketing
9. **Availability Report** - Multi-space listing
10. **Lease Comp Sheet** - Comparable lease data

### Development
11. **Development Pro Forma** - Financial projections
12. **Zoning Analysis** - As-of-right development potential
13. **Air Rights Summary** - TDR analysis
14. **Site Plan** - Lot with proposed development

### Financing
15. **Loan Request Package** - Debt financing package
16. **Refinance Summary** - Refi opportunity overview
17. **1031 Exchange Brief** - Tax-deferred exchange summary

### Portfolio
18. **Portfolio Summary** - Multi-property overview
19. **Fund Deck** - Investment fund pitch
20. **Quarterly Report** - Investor update

---

## 🤖 AI DOCUMENT BUILDER - PERFECTION SPEC

### Chat Interface Requirements

```
┌─────────────────────────────────────────────────────────────┐
│  ← Back    Untitled Document    🏢 123 Main St    ⚙️ Settings │
├─────────────────────────────────────────────────────────────┤
│                                │                             │
│   💬 CHAT PANEL                │   👁️ LIVE PREVIEW           │
│                                │                             │
│   [AI conversation]            │   [Real-time document]      │
│                                │                             │
│   Quick Actions:               │   Desktop | Tablet | Mobile │
│   📊 Investment Memo           │                             │
│   📄 Tear Sheet                │   Theme: Navy ▼             │
│   🏢 Leasing Flyer             │                             │
│                                │   [Download] [Share] [Copy] │
│   ─────────────────            │                             │
│   Type or speak...   🎤 Send   │                             │
└─────────────────────────────────────────────────────────────┘
```

### AI Behavior Rules

1. **Always output complete HTML** - Full document, not fragments
2. **Use theme CSS variables** - var(--primary), var(--accent), etc.
3. **Real data only** - Never fabricate numbers when property data provided
4. **Professional tone** - Write like a top NYC brokerage
5. **Format numbers** - $1,234,567 | 5.07% | 16,000 SF
6. **Responsive design** - Works on all devices
7. **Print-ready** - Include @media print styles

### HTML Output Structure

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>[Address] - [Document Type] | Pagelink</title>
  <link href="[Google Fonts]" rel="stylesheet">
  <style>
    /* Theme CSS variables */
    /* Typography system */
    /* Component styles */
    /* Print styles */
  </style>
</head>
<body>
  <div class="page">
    <!-- Cover / Header -->
  </div>
  <div class="page">
    <!-- Content sections -->
  </div>
</body>
</html>
```

### Component Library

```html
<!-- Stat Box -->
<div class="stat-box">
  <div class="stat-value">$12,500,000</div>
  <div class="stat-label">Asking Price</div>
</div>

<!-- Section Header with Gold Bar -->
<div class="section-header">
  <h2>Investment Highlights</h2>
</div>

<!-- Data Table -->
<table class="data-table">
  <tr><td class="label">Address</td><td class="value">146 W 28th St</td></tr>
</table>

<!-- Badge -->
<span class="badge">Exclusive</span>
<span class="badge success">Stabilized</span>
<span class="badge warning">Value-Add</span>

<!-- Grid Layouts -->
<div class="grid grid-2">...</div>
<div class="grid grid-3">...</div>
<div class="grid grid-4">...</div>

<!-- Highlight List -->
<ul class="highlight-list">
  <li>Prime Chelsea location</li>
</ul>

<!-- CTA Button -->
<a href="#" class="cta">Schedule Tour →</a>
```

### Live Preview Features

- **Real-time updates** - HTML renders as AI types
- **Device toggle** - Desktop / Tablet / Mobile views
- **Theme switcher** - Live theme changes
- **Fullscreen mode** - Distraction-free preview
- **Sample preview** - Show example before generation
- **Refresh button** - Reload iframe
- **Download HTML** - Export raw file
- **Copy link** - Share public URL

---

## ⛓️ BLOCKCHAIN SIGNATURE PORTAL (Coming Soon)

### Vision
Replace DocuSign with blockchain-verified signatures for CRE deals. Immutable, transparent, instant verification.

### Features

#### 1. Smart Contract LOIs
- Generate LOI as smart contract
- Both parties sign with wallet
- Terms encoded on-chain
- Auto-execute upon conditions

#### 2. Document Verification
- Hash document to blockchain
- Timestamp proof of existence
- Verify document hasn't changed
- Public verification portal

#### 3. Signature NFTs
- Each signature mints NFT
- Proof of signing on wallet
- Transferable record
- Collection of signed deals

#### 4. Deal Room on Chain
- Encrypted document storage (IPFS)
- Access control via tokens
- Audit trail on blockchain
- Multi-sig for approvals

### Technical Approach
```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Pagelink UI   │────▶│  Smart Contract │────▶│   Polygon/ETH   │
│   (Next.js)     │     │  (Solidity)     │     │   Blockchain    │
└─────────────────┘     └─────────────────┘     └─────────────────┘
         │                       │
         ▼                       ▼
┌─────────────────┐     ┌─────────────────┐
│   IPFS Storage  │     │  The Graph      │
│   (Documents)   │     │  (Indexing)     │
└─────────────────┘     └─────────────────┘
```

### Signature Flow
1. User creates document in Pagelink
2. Document hashed (SHA-256)
3. Hash stored on Polygon
4. Recipient receives signing link
5. Recipient connects wallet
6. Signs transaction (gas-free with meta-tx)
7. Signature NFT minted to both parties
8. Document marked as executed

### Coming Soon Badge
```html
<div class="coming-soon-feature">
  <span class="badge blockchain">⛓️ Blockchain Verified</span>
  <p>Coming Q2 2025</p>
</div>
```

---

## 🗺️ INTERACTIVE MAPS

### Property Map Component
- Mapbox GL integration
- Custom navy/gold markers
- Building footprint highlight
- Click for property details

### Nearby Amenities
- Transit (subway, bus, ferry)
- Restaurants & retail
- Parks & recreation
- Schools
- Hospitals

### Market Data Overlay
- Sales comps (pins)
- Lease comps (pins)
- Development pipeline
- Opportunity zones

### Embed in Documents
```html
<div class="map-embed" data-lat="40.7484" data-lng="-73.9967" data-zoom="15">
  <!-- Mapbox renders here -->
</div>
```

---

## 📊 FINANCIAL CALCULATORS

### Built-in Tools

#### Cap Rate Calculator
```
NOI ÷ Purchase Price = Cap Rate
$634,000 ÷ $12,500,000 = 5.07%
```

#### Cash-on-Cash Return
```
Annual Cash Flow ÷ Total Cash Invested = CoC
$250,000 ÷ $3,125,000 = 8.0%
```

#### Debt Service Coverage (DSCR)
```
NOI ÷ Annual Debt Service = DSCR
$634,000 ÷ $520,000 = 1.22x
```

#### IRR Calculator
- Multi-year cash flows
- Exit cap rate assumptions
- Leverage scenarios

### Interactive Inputs
```html
<div class="calculator" data-type="cap-rate">
  <input type="number" name="noi" placeholder="NOI">
  <input type="number" name="price" placeholder="Price">
  <div class="result">Cap Rate: <span>5.07%</span></div>
</div>
```

---

## 👥 INVESTOR PORTAL / DATA ROOM

### Features
- Secure document sharing
- NDA requirement gate
- Folder organization
- Granular permissions
- Activity tracking
- Document watermarking
- Expiring links
- Download restrictions

### Access Levels
1. **View Only** - Can view, no download
2. **Download** - Can download files
3. **Admin** - Full access + invite others

### Audit Trail
```
[2025-01-31 10:23] john@investor.com viewed "Rent Roll.pdf"
[2025-01-31 10:25] john@investor.com downloaded "OM.pdf"
[2025-01-31 10:30] john@investor.com viewed page 5 for 3m 20s
```

---

## 📈 ANALYTICS DASHBOARD

### Document Analytics
- Total views
- Unique viewers
- Average time on document
- Page-by-page engagement
- Geographic distribution
- Device breakdown
- Referral sources

### Lead Scoring
- Views = 1 point
- Time > 2min = 5 points
- Download = 10 points
- Multiple visits = 15 points
- Shared = 20 points

### Heatmaps
- Which pages get most attention
- Scroll depth tracking
- Click tracking on links

---

## 🎯 V3 IMPLEMENTATION PRIORITIES

### Phase 1: Perfect the AI Builder (Week 1-2)
- [ ] Fetch all V2 files from GitHub
- [ ] Fix any build errors
- [ ] Improve HTML output quality
- [ ] Add all 20 document types
- [ ] Perfect the preview panel
- [ ] Add more themes (10 total)

### Phase 2: NYC Data Deep Dive (Week 3-4)
- [ ] Expand PLUTO integration
- [ ] Add ACRIS sales data
- [ ] Add rent stabilization data
- [ ] Zoning analysis component
- [ ] Air rights calculator

### Phase 3: Financial Tools (Week 5-6)
- [ ] Cap rate calculator
- [ ] Cash-on-cash calculator
- [ ] DSCR calculator
- [ ] IRR calculator
- [ ] Pro forma builder

### Phase 4: Maps & Location (Week 7-8)
- [ ] Mapbox integration
- [ ] Property markers
- [ ] Amenities overlay
- [ ] Embed in documents
- [ ] Walk/Transit scores

### Phase 5: Collaboration (Week 9-10)
- [ ] Investor portal
- [ ] Data room
- [ ] NDA signing
- [ ] Activity tracking
- [ ] Lead capture forms

### Phase 6: Blockchain (Week 11-12)
- [ ] Document hashing
- [ ] Verification portal
- [ ] Wallet connection
- [ ] Coming soon UI
- [ ] Smart contract development

---

## 📝 EXAMPLE PROMPTS FOR AI

### Offering Memorandum
```
Create an offering memorandum for 146 West 28th Street, a 16,000 SF mixed-use building in Chelsea. Asking price $12.5M, cap rate 5.07%. Include investment highlights, rent roll, and neighborhood analysis.
```

### Tear Sheet
```
Generate a one-page tear sheet for this property. Focus on the key stats: price, cap rate, NOI, building size, and 3 bullet point highlights.
```

### With Property Data
```
Create a leasing flyer for [address]. Use the property data I've loaded to populate building specs, zoning info, and available spaces.
```

---

## 🚀 START HERE

1. **Fetch V2 files** from GitHub URLs above
2. **Run build** to verify everything compiles
3. **Test /create page** - make sure AI generation works
4. **Check preview** - ensure documents render beautifully
5. **Start Phase 1** - perfect the AI builder

Let's build the future of CRE marketing! 🏙️

---

*Last updated: January 2025*
*Platform: Pagelink by EasyHost*
