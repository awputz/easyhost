import { NextRequest, NextResponse } from 'next/server'
import { createClient, isSupabaseConfigured } from '@/lib/supabase/server'
import sharp from 'sharp'

interface RouteParams {
  params: Promise<{ username: string; path: string[] }>
}

// MIME type mapping
const mimeTypes: Record<string, string> = {
  // Images
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  gif: 'image/gif',
  webp: 'image/webp',
  avif: 'image/avif',
  svg: 'image/svg+xml',
  ico: 'image/x-icon',
  // Videos
  mp4: 'video/mp4',
  webm: 'video/webm',
  mov: 'video/quicktime',
  // Audio
  mp3: 'audio/mpeg',
  wav: 'audio/wav',
  ogg: 'audio/ogg',
  // Documents
  pdf: 'application/pdf',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xls: 'application/vnd.ms-excel',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ppt: 'application/vnd.ms-powerpoint',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  // Text
  txt: 'text/plain',
  html: 'text/html',
  css: 'text/css',
  js: 'application/javascript',
  json: 'application/json',
  xml: 'application/xml',
  md: 'text/markdown',
  // Archives
  zip: 'application/zip',
  rar: 'application/x-rar-compressed',
  '7z': 'application/x-7z-compressed',
  tar: 'application/x-tar',
  gz: 'application/gzip',
}

function getMimeType(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase() || ''
  return mimeTypes[ext] || 'application/octet-stream'
}

// Parse image transformation parameters
function parseTransformParams(searchParams: URLSearchParams) {
  return {
    width: searchParams.get('w') ? parseInt(searchParams.get('w')!) : undefined,
    height: searchParams.get('h') ? parseInt(searchParams.get('h')!) : undefined,
    quality: searchParams.get('q') ? parseInt(searchParams.get('q')!) : 80,
    format: searchParams.get('f') as 'webp' | 'avif' | 'jpeg' | 'png' | undefined,
    fit: (searchParams.get('fit') || 'cover') as 'cover' | 'contain' | 'fill' | 'inside' | 'outside',
    gravity: searchParams.get('g') || 'center',
  }
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { username, path } = await params
    const fullPath = `/${username}/${path.join('/')}`
    const filename = path[path.length - 1]
    const searchParams = request.nextUrl.searchParams

    // Demo mode handling
    if (!isSupabaseConfigured()) {
      // Return a placeholder response for demo mode
      const mimeType = getMimeType(filename)

      // For demo mode, return a simple placeholder
      if (mimeType.startsWith('image/')) {
        // Return a simple SVG placeholder
        const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300">
          <rect width="400" height="300" fill="#1a1a2e"/>
          <text x="200" y="150" text-anchor="middle" fill="#8b5cf6" font-family="system-ui" font-size="24">
            Demo Image
          </text>
          <text x="200" y="180" text-anchor="middle" fill="#64748b" font-family="system-ui" font-size="14">
            ${filename}
          </text>
        </svg>`

        return new NextResponse(svg, {
          headers: {
            'Content-Type': 'image/svg+xml',
            'Cache-Control': 'public, max-age=3600',
          },
        })
      }

      return new NextResponse(`Demo file: ${filename}`, {
        headers: {
          'Content-Type': mimeType,
          'Cache-Control': 'public, max-age=3600',
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

    // Find the asset by public path
    const { data: asset, error } = await supabase
      .from('assets')
      .select('*, workspace:workspaces(id, slug, owner_id)')
      .eq('public_path', fullPath)
      .eq('is_archived', false)
      .eq('is_public', true)
      .single()

    if (error || !asset) {
      return NextResponse.json(
        { error: 'Asset not found' },
        { status: 404 }
      )
    }

    // Increment view count
    await supabase
      .from('assets')
      .update({ view_count: asset.view_count + 1 })
      .eq('id', asset.id)

    // Track analytics
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] ||
               request.headers.get('x-real-ip') ||
               'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'
    const referrer = request.headers.get('referer') || null

    await supabase
      .from('analytics_events')
      .insert({
        workspace_id: asset.workspace_id,
        asset_id: asset.id,
        event_type: 'view',
        ip_address: ip,
        user_agent: userAgent,
        referrer,
      })

    // Track bandwidth usage
    await supabase
      .from('profiles')
      .update({
        bandwidth_used_bytes: supabase.rpc('increment_bandwidth', {
          user_id: asset.workspace.owner_id,
          bytes: asset.size_bytes,
        }),
      })
      .eq('id', asset.workspace.owner_id)

    // Get the file from storage
    const { data: fileData, error: downloadError } = await supabase
      .storage
      .from('assets')
      .download(asset.storage_path)

    if (downloadError || !fileData) {
      return NextResponse.json(
        { error: 'Failed to retrieve file' },
        { status: 500 }
      )
    }

    const mimeType = asset.mime_type
    let fileBuffer: Buffer | Uint8Array = Buffer.from(await fileData.arrayBuffer())

    // Apply image transformations if requested and file is an image
    if (mimeType.startsWith('image/') && !mimeType.includes('svg')) {
      const transforms = parseTransformParams(searchParams)
      const hasTransforms = transforms.width || transforms.height || transforms.format

      if (hasTransforms) {
        let sharpInstance = sharp(fileBuffer as Buffer)

        // Resize
        if (transforms.width || transforms.height) {
          sharpInstance = sharpInstance.resize({
            width: transforms.width,
            height: transforms.height === 0 ? undefined : transforms.height,
            fit: transforms.fit,
            position: transforms.gravity,
          })
        }

        // Format conversion
        if (transforms.format === 'webp') {
          sharpInstance = sharpInstance.webp({ quality: transforms.quality })
        } else if (transforms.format === 'avif') {
          sharpInstance = sharpInstance.avif({ quality: transforms.quality })
        } else if (transforms.format === 'jpeg') {
          sharpInstance = sharpInstance.jpeg({ quality: transforms.quality })
        } else if (transforms.format === 'png') {
          sharpInstance = sharpInstance.png()
        }

        fileBuffer = await sharpInstance.toBuffer()
      }
    }

    // Determine final content type
    let contentType = mimeType
    const format = searchParams.get('f')
    if (format === 'webp') contentType = 'image/webp'
    else if (format === 'avif') contentType = 'image/avif'
    else if (format === 'jpeg') contentType = 'image/jpeg'
    else if (format === 'png') contentType = 'image/png'

    // Set cache headers
    const cacheControl = 'public, max-age=31536000, immutable' // 1 year cache

    return new NextResponse(new Uint8Array(fileBuffer), {
      headers: {
        'Content-Type': contentType,
        'Content-Length': fileBuffer.length.toString(),
        'Cache-Control': cacheControl,
        'X-Content-Type-Options': 'nosniff',
        'Accept-Ranges': 'bytes',
      },
    })
  } catch (error) {
    console.error('Public asset error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Handle HEAD requests for file info
export async function HEAD(request: NextRequest, { params }: RouteParams) {
  const { username, path } = await params
  const fullPath = `/${username}/${path.join('/')}`
  const filename = path[path.length - 1]

  if (!isSupabaseConfigured()) {
    return new NextResponse(null, {
      headers: {
        'Content-Type': getMimeType(filename),
        'Cache-Control': 'public, max-age=3600',
      },
    })
  }

  const supabase = await createClient()
  if (!supabase) {
    return new NextResponse(null, { status: 500 })
  }

  const { data: asset } = await supabase
    .from('assets')
    .select('mime_type, size_bytes')
    .eq('public_path', fullPath)
    .eq('is_archived', false)
    .eq('is_public', true)
    .single()

  if (!asset) {
    return new NextResponse(null, { status: 404 })
  }

  return new NextResponse(null, {
    headers: {
      'Content-Type': asset.mime_type,
      'Content-Length': asset.size_bytes.toString(),
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  })
}
