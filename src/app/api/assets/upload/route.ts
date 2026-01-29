import { NextRequest, NextResponse } from 'next/server'
import { createClient, isSupabaseConfigured } from '@/lib/supabase/server'

// File size limits by plan (in bytes)
const FILE_SIZE_LIMITS = {
  free: 10 * 1024 * 1024,      // 10MB
  pro: 100 * 1024 * 1024,      // 100MB
  team: 500 * 1024 * 1024,     // 500MB
  enterprise: 1024 * 1024 * 1024, // 1GB
}

// Allowed MIME types
const ALLOWED_TYPES = [
  // Images
  'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml', 'image/avif',
  // Videos
  'video/mp4', 'video/webm', 'video/quicktime',
  // Documents
  'application/pdf', 'text/html', 'text/plain', 'text/markdown', 'text/css', 'text/csv',
  // Code
  'application/javascript', 'application/json', 'application/xml', 'text/javascript',
  // Fonts
  'font/woff', 'font/woff2', 'font/ttf', 'font/otf',
  // Archives
  'application/zip', 'application/x-tar', 'application/gzip',
]

export async function POST(request: NextRequest) {
  try {
    // Check if Supabase is configured
    if (!isSupabaseConfigured()) {
      // Demo mode - return mock response
      const formData = await request.formData()
      const file = formData.get('file') as File | null

      if (!file) {
        return NextResponse.json(
          { error: 'No file provided' },
          { status: 400 }
        )
      }

      // Return mock asset for demo
      const mockAsset = {
        id: `demo-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        filename: file.name,
        original_filename: file.name,
        mime_type: file.type,
        size_bytes: file.size,
        public_path: `/demo/${file.name}`,
        storage_path: `demo/${file.name}`,
        is_public: true,
        created_at: new Date().toISOString(),
      }

      return NextResponse.json(mockAsset)
    }

    // Real Supabase upload
    const supabase = await createClient()
    if (!supabase) {
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 500 }
      )
    }

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user's profile to check plan limits
    const { data: profile } = await supabase
      .from('profiles')
      .select('plan, storage_used_bytes')
      .eq('id', user.id)
      .single()

    const plan = (profile?.plan || 'free') as keyof typeof FILE_SIZE_LIMITS
    const maxFileSize = FILE_SIZE_LIMITS[plan]

    // Parse form data
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const folderId = formData.get('folder_id') as string | null

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Validate file size
    if (file.size > maxFileSize) {
      return NextResponse.json(
        { error: `File too large. Max size for ${plan} plan is ${formatBytes(maxFileSize)}` },
        { status: 400 }
      )
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type) && !file.type.startsWith('text/')) {
      return NextResponse.json(
        { error: 'File type not supported' },
        { status: 400 }
      )
    }

    // Get user's workspace
    const { data: workspace } = await supabase
      .from('workspaces')
      .select('id, slug')
      .eq('owner_id', user.id)
      .single()

    if (!workspace) {
      return NextResponse.json(
        { error: 'Workspace not found' },
        { status: 404 }
      )
    }

    // Generate unique filename
    const ext = file.name.split('.').pop() || ''
    const baseName = file.name.replace(/\.[^/.]+$/, '')
    const uniqueId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const storagePath = `${workspace.id}/${uniqueId}${ext ? `.${ext}` : ''}`
    const publicPath = `/${workspace.slug}/${file.name}`

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('assets')
      .upload(storagePath, file, {
        contentType: file.type,
        upsert: false,
      })

    if (uploadError) {
      console.error('Storage upload error:', uploadError)
      return NextResponse.json(
        { error: 'Failed to upload file' },
        { status: 500 }
      )
    }

    // Get image dimensions if applicable
    let width: number | null = null
    let height: number | null = null

    // Create asset record
    const { data: asset, error: dbError } = await supabase
      .from('assets')
      .insert({
        workspace_id: workspace.id,
        folder_id: folderId || null,
        filename: file.name,
        original_filename: file.name,
        storage_path: storagePath,
        public_path: publicPath,
        mime_type: file.type,
        size_bytes: file.size,
        width,
        height,
        tags: [],
        metadata: {},
        is_template: false,
        is_public: true,
        is_archived: false,
        uploaded_by: user.id,
      })
      .select()
      .single()

    if (dbError) {
      console.error('Database insert error:', dbError)
      // Try to clean up the uploaded file
      await supabase.storage.from('assets').remove([storagePath])
      return NextResponse.json(
        { error: 'Failed to save asset' },
        { status: 500 }
      )
    }

    // Update user's storage usage
    await supabase
      .from('profiles')
      .update({
        storage_used_bytes: (profile?.storage_used_bytes || 0) + file.size,
      })
      .eq('id', user.id)

    return NextResponse.json(asset)
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}
