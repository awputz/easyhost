import { NextRequest, NextResponse } from 'next/server'
import { createClient, isSupabaseConfigured } from '@/lib/supabase/server'
import { subDays } from 'date-fns'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const limit = parseInt(searchParams.get('limit') || '20', 10)

    if (!isSupabaseConfigured()) {
      return NextResponse.json({
        notifications: getDemoNotifications(),
        unread_count: 3,
      })
    }

    const supabase = await createClient()
    if (!supabase) {
      return NextResponse.json({
        notifications: getDemoNotifications(),
        unread_count: 3,
      })
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's workspace
    const { data: workspace } = await supabase
      .from('workspaces')
      .select('id')
      .eq('owner_id', user.id)
      .single()

    if (!workspace) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })
    }

    // Get recent analytics events as activity feed
    // In a full implementation, there would be a dedicated notifications table
    const { data: events, error } = await supabase
      .from('analytics_events')
      .select(`
        id,
        event_type,
        created_at,
        asset:assets(id, filename),
        collection:collections(id, name),
        short_link:short_links(id, slug)
      `)
      .eq('workspace_id', workspace.id)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Failed to fetch notifications:', error)
      return NextResponse.json({ notifications: [], unread_count: 0 })
    }

    // Transform events into notifications
    const notifications = (events || []).map((event) => {
      const asset = event.asset as unknown as { id: string; filename: string } | null
      const collection = event.collection as unknown as { id: string; name: string } | null
      const link = event.short_link as unknown as { id: string; slug: string } | null

      let title = ''
      let description = ''

      switch (event.event_type) {
        case 'view':
          if (asset) {
            title = 'Asset viewed'
            description = asset.filename
          } else if (collection) {
            title = 'Collection viewed'
            description = collection.name
          } else if (link) {
            title = 'Link accessed'
            description = `/${link.slug}`
          }
          break
        case 'download':
          title = 'Asset downloaded'
          description = asset?.filename || 'Unknown asset'
          break
        case 'embed_load':
          title = 'Embed loaded'
          description = asset?.filename || 'Unknown asset'
          break
      }

      return {
        id: event.id,
        type: event.event_type,
        title,
        description,
        created_at: event.created_at,
        read: true, // No read tracking in analytics_events
      }
    })

    return NextResponse.json({
      notifications,
      unread_count: 0,
    })
  } catch (error) {
    console.error('Notifications GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

function getDemoNotifications() {
  const now = new Date()
  return [
    {
      id: '1',
      type: 'view',
      title: 'Asset viewed',
      description: 'product-hero.png was viewed 5 times',
      created_at: subDays(now, 0).toISOString(),
      read: false,
    },
    {
      id: '2',
      type: 'download',
      title: 'Asset downloaded',
      description: 'pricing-guide.pdf was downloaded',
      created_at: subDays(now, 0).toISOString(),
      read: false,
    },
    {
      id: '3',
      type: 'member_joined',
      title: 'Team member joined',
      description: 'Jane Smith accepted your invitation',
      created_at: subDays(now, 1).toISOString(),
      read: false,
    },
    {
      id: '4',
      type: 'view',
      title: 'Collection viewed',
      description: 'Q4 Marketing Materials was viewed',
      created_at: subDays(now, 2).toISOString(),
      read: true,
    },
    {
      id: '5',
      type: 'embed_load',
      title: 'Embed loaded',
      description: 'logo.svg embedded on external site',
      created_at: subDays(now, 3).toISOString(),
      read: true,
    },
    {
      id: '6',
      type: 'link_expired',
      title: 'Link expired',
      description: 'Short link /promo expired',
      created_at: subDays(now, 5).toISOString(),
      read: true,
    },
  ]
}
