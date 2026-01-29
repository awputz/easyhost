import { NextRequest, NextResponse } from 'next/server'
import puppeteer from 'puppeteer-core'
import chromium from '@sparticuz/chromium'

export const maxDuration = 60 // Allow up to 60 seconds for PDF generation

interface PDFExportRequest {
  html: string
  title?: string
  format?: 'A4' | 'Letter' | 'Legal'
  orientation?: 'portrait' | 'landscape'
  margin?: {
    top?: string
    right?: string
    bottom?: string
    left?: string
  }
  printBackground?: boolean
  scale?: number
}

// Print-optimized CSS that gets injected into documents
const printStyles = `
  @media print {
    * {
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      color-adjust: exact !important;
    }

    body {
      margin: 0;
      padding: 0;
    }

    /* Prevent page breaks inside elements */
    h1, h2, h3, h4, h5, h6 {
      page-break-after: avoid;
      break-after: avoid;
    }

    p, li, blockquote {
      orphans: 3;
      widows: 3;
    }

    img, table, figure {
      page-break-inside: avoid;
      break-inside: avoid;
    }

    /* Hide elements not needed in print */
    .no-print, .pagelink-badge {
      display: none !important;
    }
  }
`

export async function POST(request: NextRequest) {
  try {
    const body: PDFExportRequest = await request.json()

    if (!body.html) {
      return NextResponse.json(
        { error: 'HTML content is required' },
        { status: 400 }
      )
    }

    // Inject print styles into the HTML
    let html = body.html
    if (html.includes('</head>')) {
      html = html.replace('</head>', `<style>${printStyles}</style></head>`)
    } else if (html.includes('<body')) {
      html = html.replace('<body', `<style>${printStyles}</style><body`)
    } else {
      html = `<style>${printStyles}</style>${html}`
    }

    // Configure browser launch options
    const isProduction = process.env.NODE_ENV === 'production'

    let browser
    if (isProduction) {
      // Production: Use @sparticuz/chromium for serverless
      browser = await puppeteer.launch({
        args: chromium.args,
        defaultViewport: { width: 1920, height: 1080 },
        executablePath: await chromium.executablePath(),
        headless: true,
      })
    } else {
      // Development: Try to use local Chrome
      const possiblePaths = [
        '/usr/bin/google-chrome',
        '/usr/bin/chromium-browser',
        '/usr/bin/chromium',
        '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
        'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      ]

      let executablePath: string | undefined
      for (const path of possiblePaths) {
        try {
          const fs = await import('fs')
          if (fs.existsSync(path)) {
            executablePath = path
            break
          }
        } catch {
          // Continue to next path
        }
      }

      if (!executablePath) {
        // Fallback: try to use chromium from the package
        executablePath = await chromium.executablePath()
      }

      browser = await puppeteer.launch({
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        executablePath,
        headless: true,
      })
    }

    try {
      const page = await browser.newPage()

      // Set content and wait for it to load
      await page.setContent(html, {
        waitUntil: ['networkidle0', 'domcontentloaded'],
        timeout: 30000,
      })

      // Wait for fonts and images to load
      await page.evaluate(() => {
        return Promise.all([
          document.fonts.ready,
          ...Array.from(document.images).map((img) => {
            if (img.complete) return Promise.resolve()
            return new Promise((resolve) => {
              img.onload = resolve
              img.onerror = resolve
            })
          }),
        ])
      })

      // Generate PDF
      const pdfBuffer = await page.pdf({
        format: body.format || 'A4',
        landscape: body.orientation === 'landscape',
        printBackground: body.printBackground !== false,
        margin: body.margin || {
          top: '0.75in',
          right: '0.75in',
          bottom: '0.75in',
          left: '0.75in',
        },
        scale: body.scale || 1,
        preferCSSPageSize: true,
      })

      // Clean filename
      const filename = (body.title || 'document')
        .replace(/[^a-zA-Z0-9-_\s]/g, '')
        .replace(/\s+/g, '-')
        .toLowerCase()

      // Convert Uint8Array to Buffer for NextResponse
      const buffer = Buffer.from(pdfBuffer)

      return new NextResponse(buffer, {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${filename}.pdf"`,
          'Content-Length': buffer.length.toString(),
        },
      })
    } finally {
      await browser.close()
    }
  } catch (error) {
    console.error('PDF generation error:', error)
    return NextResponse.json(
      {
        error: 'Failed to generate PDF',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
