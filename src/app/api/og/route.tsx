import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'

export const runtime = 'edge'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    // Get parameters
    const title = searchParams.get('title') || 'Shared File'
    const type = searchParams.get('type') || 'file'
    const size = searchParams.get('size') || ''
    const username = searchParams.get('user') || ''

    // Determine icon based on type
    const getIcon = () => {
      if (type.startsWith('image')) return '🖼️'
      if (type.startsWith('video')) return '🎬'
      if (type.startsWith('audio')) return '🎵'
      if (type === 'application/pdf') return '📄'
      if (type.includes('zip') || type.includes('rar')) return '📦'
      if (type.includes('javascript') || type.includes('json') || type.includes('css')) return '💻'
      return '📁'
    }

    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#0f0f1a',
            backgroundImage: 'linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 100%)',
          }}
        >
          {/* Logo area */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 40,
            }}
          >
            <div
              style={{
                width: 80,
                height: 80,
                borderRadius: 16,
                backgroundColor: '#8b5cf6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 20,
              }}
            >
              <span style={{ fontSize: 40, color: 'white', fontWeight: 'bold' }}>P</span>
            </div>
            <span style={{ fontSize: 48, color: 'white', fontWeight: 'bold' }}>
              Pagelink
            </span>
          </div>

          {/* File icon */}
          <div
            style={{
              width: 120,
              height: 120,
              borderRadius: 24,
              backgroundColor: 'rgba(139, 92, 246, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 30,
            }}
          >
            <span style={{ fontSize: 64 }}>{getIcon()}</span>
          </div>

          {/* Title */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              maxWidth: 900,
              textAlign: 'center',
            }}
          >
            <span
              style={{
                fontSize: 48,
                fontWeight: 'bold',
                color: 'white',
                marginBottom: 16,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                maxWidth: '100%',
              }}
            >
              {title}
            </span>
            <div
              style={{
                display: 'flex',
                gap: 20,
                color: '#a1a1aa',
                fontSize: 24,
              }}
            >
              {username && <span>@{username}</span>}
              {size && <span>•</span>}
              {size && <span>{size}</span>}
            </div>
          </div>

          {/* Footer */}
          <div
            style={{
              position: 'absolute',
              bottom: 40,
              display: 'flex',
              alignItems: 'center',
              color: '#64748b',
              fontSize: 20,
            }}
          >
            Hosted on Pagelink
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    )
  } catch {
    return new Response('Failed to generate image', { status: 500 })
  }
}
