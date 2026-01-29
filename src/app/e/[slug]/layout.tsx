import type { Metadata } from 'next'
import { isSupabaseConfigured } from '@/lib/supabase/server'

interface LayoutProps {
  children: React.ReactNode
  params: Promise<{ slug: string }>
}

// Helper to format bytes
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

export async function generateMetadata({ params }: LayoutProps): Promise<Metadata> {
  const { slug } = await params

  // Default metadata
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://pagelink.com'
  const defaultMetadata: Metadata = {
    title: 'Shared Link - Pagelink',
    description: 'Access shared content on Pagelink',
    openGraph: {
      title: 'Shared Link',
      description: 'Access shared content on Pagelink',
      images: [`${baseUrl}/api/og?title=Shared%20Link`],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: 'Shared Link',
      description: 'Access shared content on Pagelink',
      images: [`${baseUrl}/api/og?title=Shared%20Link`],
    },
  }

  if (!isSupabaseConfigured()) {
    // Demo mode
    const ogImageUrl = `${baseUrl}/api/og?title=Demo%20Link&type=demo`
    return {
      ...defaultMetadata,
      openGraph: {
        ...defaultMetadata.openGraph,
        images: [ogImageUrl],
      },
      twitter: {
        ...defaultMetadata.twitter,
        images: [ogImageUrl],
      },
    }
  }

  // In production, we'd fetch link data here
  // For now, return default metadata since link data fetch requires async
  // The actual preview will be handled by the OG route

  const ogImageUrl = `${baseUrl}/api/og?title=${encodeURIComponent(`Link: ${slug}`)}`

  return {
    title: `${slug} - Pagelink`,
    description: 'Access shared content on Pagelink',
    openGraph: {
      title: `Shared Link`,
      description: 'Access shared content on Pagelink',
      images: [ogImageUrl],
      type: 'website',
      siteName: 'Pagelink',
    },
    twitter: {
      card: 'summary_large_image',
      title: 'Shared Link',
      description: 'Access shared content on Pagelink',
      images: [ogImageUrl],
    },
  }
}

export default function ShortLinkLayout({ children }: LayoutProps) {
  return children
}
