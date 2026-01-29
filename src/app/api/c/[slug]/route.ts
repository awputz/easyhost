import { NextRequest, NextResponse } from 'next/server'
import { createClient, isSupabaseConfigured } from '@/lib/supabase/server'

interface RouteParams {
  params: Promise<{ slug: string }>
}

// GET - Get public collection by slug
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { slug } = await params

    // Check if Supabase is configured
    if (!isSupabaseConfigured()) {
      // Demo mode - return mock collection
      return NextResponse.json({
        collection: {
          id: 'demo-collection-1',
          name: 'Demo Collection',
          description: 'A sample collection for demonstration',
          slug,
          is_public: true,
          branding: {
            primary_color: '#3b82f6',
            header_text: 'Welcome to our portfolio',
            footer_text: 'Thank you for viewing',
            layout: 'grid',
          },
          items: [
            {
              id: 'item-1',
              asset_id: 'asset-1',
              position: 0,
              custom_title: 'Sample Image 1',
              asset: {
                id: 'asset-1',
                filename: 'sample-image-1.jpg',
                mime_type: 'image/jpeg',
                size_bytes: 102400,
                public_path: '/demo/sample-image-1.jpg',
              },
            },
            {
              id: 'item-2',
              asset_id: 'asset-2',
              position: 1,
              custom_title: 'Sample Document',
              asset: {
                id: 'asset-2',
                filename: 'sample-document.pdf',
                mime_type: 'application/pdf',
                size_bytes: 204800,
                public_path: '/demo/sample-document.pdf',
              },
            },
            {
              id: 'item-3',
              asset_id: 'asset-3',
              position: 2,
              custom_title: null,
              asset: {
                id: 'asset-3',
                filename: 'sample-video.mp4',
                mime_type: 'video/mp4',
                size_bytes: 5242880,
                public_path: '/demo/sample-video.mp4',
              },
            },
          ],
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

    // Get collection by slug
    const { data: collection, error } = await supabase
      .from('collections')
      .select(`
        *,
        items:collection_items(
          id,
          asset_id,
          position,
          custom_title,
          asset:assets(
            id,
            filename,
            mime_type,
            size_bytes,
            public_path
          )
        )
      `)
      .eq('slug', slug)
      .eq('is_public', true)
      .single()

    if (error || !collection) {
      return NextResponse.json(
        { error: 'Collection not found' },
        { status: 404 }
      )
    }

    // Sort items by position
    collection.items = collection.items.sort(
      (a: { position: number }, b: { position: number }) => a.position - b.position
    )

    return NextResponse.json({ collection })
  } catch (error) {
    console.error('Get public collection error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
