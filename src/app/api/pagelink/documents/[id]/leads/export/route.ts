import { NextRequest, NextResponse } from 'next/server'
import { createClient, isSupabaseConfigured } from '@/lib/supabase/server'

// GET /api/pagelink/documents/[id]/leads/export - Export leads as CSV
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  if (!isSupabaseConfigured()) {
    // Demo mode - return demo CSV
    const csv = `Email,Name,Company,Phone,Submitted At
john@example.com,John Doe,Acme Inc,+1 555-1234,2024-01-15T10:30:00Z
jane@startup.io,Jane Smith,Startup.io,,2024-01-14T09:15:00Z`

    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="leads-${id}.csv"`,
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

  // Verify user owns the document
  const { data: doc } = await supabase
    .from('pagelink_documents')
    .select('id, slug')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!doc) {
    return NextResponse.json({ error: 'Document not found' }, { status: 404 })
  }

  // Get all leads
  const { data: leads, error } = await supabase
    .from('pagelink_leads')
    .select('*')
    .eq('document_id', id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching leads:', error)
    return NextResponse.json({ error: 'Failed to fetch leads' }, { status: 500 })
  }

  if (!leads || leads.length === 0) {
    return new NextResponse('No leads to export', { status: 404 })
  }

  // Get all custom field names
  const customFieldNames = new Set<string>()
  leads.forEach(lead => {
    if (lead.custom_fields && typeof lead.custom_fields === 'object') {
      Object.keys(lead.custom_fields).forEach(key => customFieldNames.add(key))
    }
  })

  // Build CSV
  const headers = ['Email', 'Name', 'Company', 'Phone', ...Array.from(customFieldNames), 'Submitted At', 'Viewed At']
  const rows = leads.map(lead => {
    const customValues = Array.from(customFieldNames).map(name =>
      escapeCSV((lead.custom_fields as Record<string, string>)?.[name] || '')
    )
    return [
      escapeCSV(lead.email),
      escapeCSV(lead.name || ''),
      escapeCSV(lead.company || ''),
      escapeCSV(lead.phone || ''),
      ...customValues,
      lead.created_at,
      lead.viewed_at || '',
    ].join(',')
  })

  const csv = [headers.join(','), ...rows].join('\n')

  return new NextResponse(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="leads-${doc.slug}-${new Date().toISOString().split('T')[0]}.csv"`,
    },
  })
}

function escapeCSV(value: string): string {
  if (!value) return ''
  // Escape quotes and wrap in quotes if contains comma, quote, or newline
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}
