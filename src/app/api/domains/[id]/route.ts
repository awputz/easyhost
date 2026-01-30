import { NextRequest, NextResponse } from 'next/server'
import { createClient, isSupabaseConfigured } from '@/lib/supabase/server'

// GET /api/domains/[id] - Get a single domain
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  if (!isSupabaseConfigured()) {
    return NextResponse.json({
      domain: {
        id,
        domain: 'docs.example.com',
        status: 'verified',
        verificationToken: 'pagelink-verify=demo123',
        verifiedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      },
    })
  }

  const supabase = await createClient()
  if (!supabase) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
  }

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: domain, error } = await supabase
    .from('custom_domains')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (error || !domain) {
    return NextResponse.json({ error: 'Domain not found' }, { status: 404 })
  }

  return NextResponse.json({
    domain: {
      id: domain.id,
      domain: domain.domain,
      status: domain.status,
      verificationToken: domain.verification_token,
      verifiedAt: domain.verified_at,
      createdAt: domain.created_at,
    },
  })
}

// DELETE /api/domains/[id] - Delete a domain
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ success: true })
  }

  const supabase = await createClient()
  if (!supabase) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
  }

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { error } = await supabase
    .from('custom_domains')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    console.error('Error deleting domain:', error)
    return NextResponse.json({ error: 'Failed to delete domain' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
