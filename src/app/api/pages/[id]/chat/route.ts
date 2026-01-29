import { NextRequest, NextResponse } from 'next/server'
import { createClient, isSupabaseConfigured } from '@/lib/supabase/server'
import { PageChat } from '@/types'

// GET - Get chat history for a page
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  try {
    if (!isSupabaseConfigured()) {
      // Demo mode - return empty chat or demo messages
      return NextResponse.json(getDemoChatHistory(id))
    }

    const supabase = await createClient()
    if (!supabase) {
      return NextResponse.json(getDemoChatHistory(id))
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: chats, error } = await supabase
      .from('page_chats')
      .select('*')
      .eq('page_id', id)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching chat history:', error)
      return NextResponse.json({ error: 'Failed to fetch chat history' }, { status: 500 })
    }

    return NextResponse.json(chats || [])
  } catch (error) {
    console.error('Chat GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Add a chat message
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  try {
    const body = await request.json()
    const { role, content } = body as { role: 'user' | 'assistant'; content: string }

    if (!role || !content) {
      return NextResponse.json(
        { error: 'Role and content are required' },
        { status: 400 }
      )
    }

    if (!isSupabaseConfigured()) {
      // Demo mode - return mock message
      return NextResponse.json({
        id: `demo-${Date.now()}`,
        page_id: id,
        role,
        content,
        created_at: new Date().toISOString(),
      })
    }

    const supabase = await createClient()
    if (!supabase) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 })
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: chat, error } = await supabase
      .from('page_chats')
      .insert({
        page_id: id,
        role,
        content,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating chat message:', error)
      return NextResponse.json({ error: 'Failed to create chat message' }, { status: 500 })
    }

    return NextResponse.json(chat)
  } catch (error) {
    console.error('Chat POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

function getDemoChatHistory(pageId: string): PageChat[] {
  if (pageId === 'demo-1') {
    return [
      {
        id: 'demo-chat-1',
        page_id: pageId,
        role: 'user',
        content: 'Create a pitch deck for my AI automation startup. We help businesses automate their workflows.',
        created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'demo-chat-2',
        page_id: pageId,
        role: 'assistant',
        content: 'I\'ve created a professional pitch deck for TechStartup Inc. The deck includes sections for the problem, solution, market opportunity, traction, and your funding ask. Feel free to customize the content!',
        created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000 + 5000).toISOString(),
      },
    ]
  }
  return []
}
