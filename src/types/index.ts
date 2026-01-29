// Database types for EZ-Host.ai

export type Plan = 'free' | 'pro' | 'team' | 'enterprise'

export type WorkspaceRole = 'viewer' | 'editor' | 'admin'

export type CollectionLayout = 'grid' | 'list' | 'presentation'

export type AnalyticsEventType = 'view' | 'download' | 'click' | 'embed_load'

export interface Profile {
  id: string
  username: string
  email: string
  full_name: string | null
  avatar_url: string | null
  plan: Plan
  plan_expires_at: string | null
  storage_used_bytes: number
  bandwidth_used_bytes: number
  bandwidth_reset_at: string
  settings: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface Workspace {
  id: string
  name: string
  slug: string
  owner_id: string
  custom_domain: string | null
  branding: {
    logo_url?: string
    primary_color?: string
    secondary_color?: string
  }
  settings: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface WorkspaceMember {
  workspace_id: string
  user_id: string
  role: WorkspaceRole
  invited_at: string
  joined_at: string | null
}

export interface Folder {
  id: string
  workspace_id: string
  parent_id: string | null
  name: string
  path: string
  color: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface Asset {
  id: string
  workspace_id: string
  folder_id: string | null
  filename: string
  original_filename: string
  storage_path: string
  public_path: string
  mime_type: string
  size_bytes: number
  width: number | null
  height: number | null
  duration_seconds: number | null
  tags: string[]
  metadata: Record<string, unknown>
  is_template: boolean
  template_schema: TemplateVariable[] | null
  is_public: boolean
  is_archived: boolean
  archived_at: string | null
  view_count: number
  download_count: number
  uploaded_by: string | null
  created_at: string
  updated_at: string
}

export interface TemplateVariable {
  name: string
  type: 'text' | 'number' | 'url' | 'date' | 'color' | 'image'
  default?: string
  required: boolean
  description?: string
}

export interface AssetVersion {
  id: string
  asset_id: string
  version_number: number
  storage_path: string
  size_bytes: number
  note: string | null
  uploaded_by: string | null
  created_at: string
}

export interface ShortLink {
  id: string
  workspace_id: string
  asset_id: string | null
  collection_id: string | null
  slug: string
  password_hash: string | null
  expires_at: string | null
  max_views: number | null
  allowed_emails: string[] | null
  view_count: number
  last_viewed_at: string | null
  is_active: boolean
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface Collection {
  id: string
  workspace_id: string
  name: string
  description: string | null
  slug: string
  cover_asset_id: string | null
  branding: {
    logo_url?: string
    primary_color?: string
    header_text?: string
    footer_text?: string
  }
  layout: CollectionLayout
  is_public: boolean
  view_count: number
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface CollectionItem {
  id: string
  collection_id: string
  asset_id: string
  position: number
  custom_title: string | null
  created_at: string
}

export interface TemplateInstance {
  id: string
  template_id: string
  workspace_id: string
  name: string | null
  variables: Record<string, string>
  rendered_path: string | null
  public_url: string
  created_by: string | null
  created_at: string
}

export interface AnalyticsEvent {
  id: string
  workspace_id: string
  asset_id: string | null
  short_link_id: string | null
  collection_id: string | null
  event_type: AnalyticsEventType
  visitor_id: string | null
  ip_address: string | null
  user_agent: string | null
  country_code: string | null
  country_name: string | null
  city: string | null
  referrer: string | null
  utm_source: string | null
  utm_medium: string | null
  utm_campaign: string | null
  created_at: string
}

// Pagelink Types
export type PageTheme = 'professional-dark' | 'clean-light' | 'corporate-blue' | 'modern-minimal' | 'custom'

export type PageTemplateType =
  | 'pitch-deck'
  | 'investment-memo'
  | 'proposal'
  | 'one-pager'
  | 'case-study'
  | 'report'
  | 'newsletter'
  | 'custom'

export interface Page {
  id: string
  workspace_id: string
  slug: string
  title: string
  description: string | null
  html: string
  template_type: PageTemplateType | null
  theme: PageTheme
  branding: {
    logo_url?: string
    primary_color?: string
    secondary_color?: string
    font_family?: string
  }
  is_public: boolean
  password_hash: string | null
  metadata: Record<string, unknown>
  view_count: number
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface PageVersion {
  id: string
  page_id: string
  version_number: number
  html: string
  title: string | null
  created_at: string
}

export interface PageChat {
  id: string
  page_id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  created_at: string
}

// Supabase Database type helper
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile
        Insert: Omit<Profile, 'created_at' | 'updated_at' | 'storage_used_bytes' | 'bandwidth_used_bytes' | 'bandwidth_reset_at'>
        Update: Partial<Omit<Profile, 'id' | 'created_at'>>
      }
      workspaces: {
        Row: Workspace
        Insert: Omit<Workspace, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Workspace, 'id' | 'created_at'>>
      }
      workspace_members: {
        Row: WorkspaceMember
        Insert: Omit<WorkspaceMember, 'invited_at'>
        Update: Partial<WorkspaceMember>
      }
      folders: {
        Row: Folder
        Insert: Omit<Folder, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Folder, 'id' | 'created_at'>>
      }
      assets: {
        Row: Asset
        Insert: Omit<Asset, 'id' | 'created_at' | 'updated_at' | 'view_count' | 'download_count'>
        Update: Partial<Omit<Asset, 'id' | 'created_at'>>
      }
      asset_versions: {
        Row: AssetVersion
        Insert: Omit<AssetVersion, 'id' | 'created_at'>
        Update: Partial<Omit<AssetVersion, 'id' | 'created_at'>>
      }
      short_links: {
        Row: ShortLink
        Insert: Omit<ShortLink, 'id' | 'created_at' | 'updated_at' | 'view_count'>
        Update: Partial<Omit<ShortLink, 'id' | 'created_at'>>
      }
      collections: {
        Row: Collection
        Insert: Omit<Collection, 'id' | 'created_at' | 'updated_at' | 'view_count'>
        Update: Partial<Omit<Collection, 'id' | 'created_at'>>
      }
      collection_items: {
        Row: CollectionItem
        Insert: Omit<CollectionItem, 'id' | 'created_at'>
        Update: Partial<Omit<CollectionItem, 'id' | 'created_at'>>
      }
      template_instances: {
        Row: TemplateInstance
        Insert: Omit<TemplateInstance, 'id' | 'created_at'>
        Update: Partial<Omit<TemplateInstance, 'id' | 'created_at'>>
      }
      analytics_events: {
        Row: AnalyticsEvent
        Insert: Omit<AnalyticsEvent, 'id' | 'created_at'>
        Update: never
      }
    }
  }
}
