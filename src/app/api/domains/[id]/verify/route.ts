import { NextRequest, NextResponse } from 'next/server'
import { createClient, isSupabaseConfigured } from '@/lib/supabase/server'
import dns from 'dns'
import { promisify } from 'util'

const resolveTxt = promisify(dns.resolveTxt)

// Verify DNS TXT record for domain ownership
async function verifyDnsTxtRecord(domain: string, expectedToken: string): Promise<boolean> {
  try {
    // Look for TXT record at _pagelink.subdomain.domain.com
    const subdomain = domain.split('.')[0]
    const baseDomain = domain.split('.').slice(1).join('.')
    const txtHost = `_pagelink.${subdomain}.${baseDomain}`

    try {
      const records = await resolveTxt(txtHost)
      // records is an array of arrays, flatten it
      const flatRecords = records.flat()
      return flatRecords.some(record => record === expectedToken)
    } catch {
      // Try alternate format: _pagelink-verify.domain.com
      try {
        const altRecords = await resolveTxt(`_pagelink-verify.${domain}`)
        const flatAltRecords = altRecords.flat()
        return flatAltRecords.some(record => record === expectedToken)
      } catch {
        return false
      }
    }
  } catch (error) {
    console.error('DNS verification error:', error)
    return false
  }
}

// Verify CNAME record points to pagelink
async function verifyCnameRecord(domain: string): Promise<boolean> {
  const resolveCname = promisify(dns.resolveCname)

  try {
    const records = await resolveCname(domain)
    return records.some(record =>
      record.toLowerCase().includes('pagelink') ||
      record.toLowerCase().includes('cname.pagelink.com')
    )
  } catch {
    // CNAME might not exist yet, which is okay for verification
    return false
  }
}

// POST /api/domains/[id]/verify - Verify domain ownership
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  if (!isSupabaseConfigured()) {
    // Demo mode - simulate successful verification
    return NextResponse.json({
      verified: true,
      message: 'Domain verified successfully (demo mode)',
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

  // Get the domain record
  const { data: domain, error: fetchError } = await supabase
    .from('custom_domains')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (fetchError || !domain) {
    return NextResponse.json({ error: 'Domain not found' }, { status: 404 })
  }

  // If already verified, just return success
  if (domain.status === 'verified') {
    return NextResponse.json({
      verified: true,
      message: 'Domain is already verified',
    })
  }

  // Verify the TXT record
  const txtVerified = await verifyDnsTxtRecord(domain.domain, domain.verification_token)

  if (!txtVerified) {
    // Update status to failed
    await supabase
      .from('custom_domains')
      .update({ status: 'failed' })
      .eq('id', id)

    return NextResponse.json({
      verified: false,
      message: 'TXT record verification failed. Please check your DNS settings and try again.',
    })
  }

  // Check CNAME (optional warning)
  const cnameVerified = await verifyCnameRecord(domain.domain)

  // Update domain status to verified
  const { error: updateError } = await supabase
    .from('custom_domains')
    .update({
      status: 'verified',
      verified_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (updateError) {
    console.error('Error updating domain status:', updateError)
    return NextResponse.json({ error: 'Failed to update domain status' }, { status: 500 })
  }

  return NextResponse.json({
    verified: true,
    cnameConfigured: cnameVerified,
    message: cnameVerified
      ? 'Domain verified successfully!'
      : 'Domain ownership verified! Remember to add the CNAME record to route traffic.',
  })
}
