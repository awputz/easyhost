-- EZ-Host.ai Database Schema
-- Initial migration

-- Extend Supabase auth.users with profile data
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  username text unique not null,
  email text not null,
  full_name text,
  avatar_url text,
  plan text default 'free' check (plan in ('free', 'pro', 'team', 'enterprise')),
  plan_expires_at timestamptz,
  storage_used_bytes bigint default 0,
  bandwidth_used_bytes bigint default 0,
  bandwidth_reset_at timestamptz default now(),
  settings jsonb default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Workspaces (for team accounts, personal workspace auto-created)
create table public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  owner_id uuid references public.profiles(id) on delete cascade,
  custom_domain text,
  branding jsonb default '{}', -- logo, colors, etc.
  settings jsonb default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Workspace membership
create table public.workspace_members (
  workspace_id uuid references public.workspaces(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  role text default 'viewer' check (role in ('viewer', 'editor', 'admin')),
  invited_at timestamptz default now(),
  joined_at timestamptz,
  primary key (workspace_id, user_id)
);

-- Folders for organization
create table public.folders (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.workspaces(id) on delete cascade,
  parent_id uuid references public.folders(id) on delete cascade,
  name text not null,
  path text not null, -- materialized path like /logos/2024/
  color text, -- for UI organization
  created_by uuid references public.profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(workspace_id, path, name)
);

-- Assets (the core entity)
create table public.assets (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.workspaces(id) on delete cascade,
  folder_id uuid references public.folders(id) on delete set null,

  -- File info
  filename text not null,
  original_filename text not null,
  storage_path text not null,
  public_path text not null, -- /username/folder/file.png
  mime_type text not null,
  size_bytes bigint not null,

  -- Media metadata
  width int,
  height int,
  duration_seconds numeric, -- for video/audio

  -- Organization
  tags text[] default '{}',
  metadata jsonb default '{}',

  -- Template support
  is_template boolean default false,
  template_schema jsonb, -- defines variables: [{name, type, default, required}]

  -- Status
  is_public boolean default true,
  is_archived boolean default false,
  archived_at timestamptz,

  -- Tracking
  view_count int default 0,
  download_count int default 0,
  uploaded_by uuid references public.profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Asset version history
create table public.asset_versions (
  id uuid primary key default gen_random_uuid(),
  asset_id uuid references public.assets(id) on delete cascade,
  version_number int not null,
  storage_path text not null,
  size_bytes bigint not null,
  note text,
  uploaded_by uuid references public.profiles(id),
  created_at timestamptz default now(),
  unique(asset_id, version_number)
);

-- Collections (deal rooms, portfolios, etc.)
create table public.collections (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.workspaces(id) on delete cascade,

  name text not null,
  description text,
  slug text not null,

  -- Appearance
  cover_asset_id uuid references public.assets(id) on delete set null,
  branding jsonb default '{}', -- override workspace branding
  layout text default 'grid' check (layout in ('grid', 'list', 'presentation')),

  -- Access
  is_public boolean default false,

  -- Stats
  view_count int default 0,

  created_by uuid references public.profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),

  unique(workspace_id, slug)
);

-- Short links
create table public.short_links (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.workspaces(id) on delete cascade,

  -- Can link to asset OR collection
  asset_id uuid references public.assets(id) on delete cascade,
  collection_id uuid references public.collections(id) on delete cascade,

  slug text unique not null,

  -- Access controls
  password_hash text,
  expires_at timestamptz,
  max_views int,
  allowed_emails text[], -- restrict to specific emails

  -- Stats
  view_count int default 0,
  last_viewed_at timestamptz,

  -- Status
  is_active boolean default true,

  created_by uuid references public.profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),

  constraint link_target check (
    (asset_id is not null and collection_id is null) or
    (asset_id is null and collection_id is not null)
  )
);

-- Collection items (many-to-many with ordering)
create table public.collection_items (
  id uuid primary key default gen_random_uuid(),
  collection_id uuid references public.collections(id) on delete cascade,
  asset_id uuid references public.assets(id) on delete cascade,
  position int not null,
  custom_title text, -- override asset filename for display
  created_at timestamptz default now(),
  unique(collection_id, asset_id)
);

-- Template instances (generated documents)
create table public.template_instances (
  id uuid primary key default gen_random_uuid(),
  template_id uuid references public.assets(id) on delete cascade,
  workspace_id uuid references public.workspaces(id) on delete cascade,

  name text, -- optional friendly name
  variables jsonb not null,

  -- Generated output
  rendered_path text, -- cached rendered HTML if applicable
  public_url text not null,

  created_by uuid references public.profiles(id),
  created_at timestamptz default now()
);

-- Analytics events
create table public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.workspaces(id) on delete cascade,

  -- What was accessed
  asset_id uuid references public.assets(id) on delete cascade,
  short_link_id uuid references public.short_links(id) on delete cascade,
  collection_id uuid references public.collections(id) on delete cascade,

  event_type text not null check (event_type in ('view', 'download', 'click', 'embed_load')),

  -- Visitor info
  visitor_id text, -- anonymous fingerprint for session tracking
  ip_address inet,
  user_agent text,

  -- Geo (populated async via IP lookup)
  country_code text,
  country_name text,
  city text,

  -- Context
  referrer text,
  utm_source text,
  utm_medium text,
  utm_campaign text,

  created_at timestamptz default now()
);

-- ============================================
-- INDEXES
-- ============================================

create index idx_profiles_username on public.profiles(username);
create index idx_workspaces_slug on public.workspaces(slug);
create index idx_workspaces_owner on public.workspaces(owner_id);
create index idx_workspace_members_user on public.workspace_members(user_id);
create index idx_folders_workspace on public.folders(workspace_id);
create index idx_folders_parent on public.folders(parent_id);
create index idx_assets_workspace on public.assets(workspace_id);
create index idx_assets_folder on public.assets(folder_id);
create index idx_assets_public_path on public.assets(public_path);
create index idx_assets_tags on public.assets using gin(tags);
create index idx_assets_uploaded_by on public.assets(uploaded_by);
create index idx_asset_versions_asset on public.asset_versions(asset_id);
create index idx_short_links_slug on public.short_links(slug);
create index idx_short_links_workspace on public.short_links(workspace_id);
create index idx_collections_workspace on public.collections(workspace_id);
create index idx_collections_slug on public.collections(workspace_id, slug);
create index idx_collection_items_collection on public.collection_items(collection_id);
create index idx_template_instances_template on public.template_instances(template_id);
create index idx_analytics_asset on public.analytics_events(asset_id, created_at);
create index idx_analytics_workspace on public.analytics_events(workspace_id, created_at);
create index idx_analytics_short_link on public.analytics_events(short_link_id, created_at);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

alter table public.profiles enable row level security;
alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;
alter table public.folders enable row level security;
alter table public.assets enable row level security;
alter table public.asset_versions enable row level security;
alter table public.short_links enable row level security;
alter table public.collections enable row level security;
alter table public.collection_items enable row level security;
alter table public.template_instances enable row level security;
alter table public.analytics_events enable row level security;

-- ============================================
-- RLS POLICIES
-- ============================================

-- Profiles
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Workspaces
create policy "Users can view workspaces they own or are members of"
  on public.workspaces for select
  using (
    owner_id = auth.uid() or
    id in (select workspace_id from public.workspace_members where user_id = auth.uid())
  );

create policy "Users can create workspaces"
  on public.workspaces for insert
  with check (owner_id = auth.uid());

create policy "Owners can update their workspaces"
  on public.workspaces for update
  using (owner_id = auth.uid());

create policy "Owners can delete their workspaces"
  on public.workspaces for delete
  using (owner_id = auth.uid());

-- Workspace members
create policy "Members can view workspace membership"
  on public.workspace_members for select
  using (
    workspace_id in (
      select id from public.workspaces where owner_id = auth.uid()
      union
      select workspace_id from public.workspace_members where user_id = auth.uid()
    )
  );

create policy "Admins can manage workspace members"
  on public.workspace_members for all
  using (
    workspace_id in (
      select id from public.workspaces where owner_id = auth.uid()
      union
      select workspace_id from public.workspace_members
      where user_id = auth.uid() and role = 'admin'
    )
  );

-- Folders
create policy "Workspace members can view folders"
  on public.folders for select
  using (
    workspace_id in (
      select id from public.workspaces where owner_id = auth.uid()
      union
      select workspace_id from public.workspace_members where user_id = auth.uid()
    )
  );

create policy "Editors can manage folders"
  on public.folders for all
  using (
    workspace_id in (
      select id from public.workspaces where owner_id = auth.uid()
      union
      select workspace_id from public.workspace_members
      where user_id = auth.uid() and role in ('editor', 'admin')
    )
  );

-- Assets
create policy "Public assets are viewable by all"
  on public.assets for select
  using (is_public = true and is_archived = false);

create policy "Workspace members can view all workspace assets"
  on public.assets for select
  using (
    workspace_id in (
      select id from public.workspaces where owner_id = auth.uid()
      union
      select workspace_id from public.workspace_members where user_id = auth.uid()
    )
  );

create policy "Editors can manage assets"
  on public.assets for all
  using (
    workspace_id in (
      select id from public.workspaces where owner_id = auth.uid()
      union
      select workspace_id from public.workspace_members
      where user_id = auth.uid() and role in ('editor', 'admin')
    )
  );

-- Asset versions
create policy "Workspace members can view versions"
  on public.asset_versions for select
  using (
    asset_id in (
      select id from public.assets where workspace_id in (
        select id from public.workspaces where owner_id = auth.uid()
        union
        select workspace_id from public.workspace_members where user_id = auth.uid()
      )
    )
  );

create policy "Editors can manage versions"
  on public.asset_versions for all
  using (
    asset_id in (
      select id from public.assets where workspace_id in (
        select id from public.workspaces where owner_id = auth.uid()
        union
        select workspace_id from public.workspace_members
        where user_id = auth.uid() and role in ('editor', 'admin')
      )
    )
  );

-- Short links
create policy "Active public short links are viewable"
  on public.short_links for select
  using (is_active = true and (expires_at is null or expires_at > now()));

create policy "Workspace members can view all short links"
  on public.short_links for select
  using (
    workspace_id in (
      select id from public.workspaces where owner_id = auth.uid()
      union
      select workspace_id from public.workspace_members where user_id = auth.uid()
    )
  );

create policy "Editors can manage short links"
  on public.short_links for all
  using (
    workspace_id in (
      select id from public.workspaces where owner_id = auth.uid()
      union
      select workspace_id from public.workspace_members
      where user_id = auth.uid() and role in ('editor', 'admin')
    )
  );

-- Collections
create policy "Public collections are viewable"
  on public.collections for select
  using (is_public = true);

create policy "Workspace members can view all collections"
  on public.collections for select
  using (
    workspace_id in (
      select id from public.workspaces where owner_id = auth.uid()
      union
      select workspace_id from public.workspace_members where user_id = auth.uid()
    )
  );

create policy "Editors can manage collections"
  on public.collections for all
  using (
    workspace_id in (
      select id from public.workspaces where owner_id = auth.uid()
      union
      select workspace_id from public.workspace_members
      where user_id = auth.uid() and role in ('editor', 'admin')
    )
  );

-- Collection items
create policy "Collection items are viewable with collection"
  on public.collection_items for select
  using (
    collection_id in (
      select id from public.collections where is_public = true
      union
      select id from public.collections where workspace_id in (
        select id from public.workspaces where owner_id = auth.uid()
        union
        select workspace_id from public.workspace_members where user_id = auth.uid()
      )
    )
  );

create policy "Editors can manage collection items"
  on public.collection_items for all
  using (
    collection_id in (
      select id from public.collections where workspace_id in (
        select id from public.workspaces where owner_id = auth.uid()
        union
        select workspace_id from public.workspace_members
        where user_id = auth.uid() and role in ('editor', 'admin')
      )
    )
  );

-- Template instances
create policy "Workspace members can view template instances"
  on public.template_instances for select
  using (
    workspace_id in (
      select id from public.workspaces where owner_id = auth.uid()
      union
      select workspace_id from public.workspace_members where user_id = auth.uid()
    )
  );

create policy "Editors can manage template instances"
  on public.template_instances for all
  using (
    workspace_id in (
      select id from public.workspaces where owner_id = auth.uid()
      union
      select workspace_id from public.workspace_members
      where user_id = auth.uid() and role in ('editor', 'admin')
    )
  );

-- Analytics events (insert only for tracking, select for workspace members)
create policy "Anyone can insert analytics events"
  on public.analytics_events for insert
  with check (true);

create policy "Workspace members can view analytics"
  on public.analytics_events for select
  using (
    workspace_id in (
      select id from public.workspaces where owner_id = auth.uid()
      union
      select workspace_id from public.workspace_members where user_id = auth.uid()
    )
  );

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to handle new user signup
create or replace function public.handle_new_user()
returns trigger as $$
declare
  new_username text;
  workspace_id uuid;
begin
  -- Generate username from email (before @)
  new_username := split_part(new.email, '@', 1);

  -- Ensure uniqueness by adding random suffix if needed
  while exists (select 1 from public.profiles where username = new_username) loop
    new_username := split_part(new.email, '@', 1) || '_' || substr(md5(random()::text), 1, 4);
  end loop;

  -- Create profile
  insert into public.profiles (id, username, email, full_name, avatar_url)
  values (
    new.id,
    new_username,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );

  -- Create default workspace
  insert into public.workspaces (name, slug, owner_id)
  values (
    coalesce(new.raw_user_meta_data->>'full_name', new_username) || '''s Workspace',
    new_username,
    new.id
  )
  returning id into workspace_id;

  -- Add owner as admin member
  insert into public.workspace_members (workspace_id, user_id, role, joined_at)
  values (workspace_id, new.id, 'admin', now());

  return new;
end;
$$ language plpgsql security definer;

-- Trigger for new user signup
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Function to update updated_at timestamp
create or replace function public.update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Apply updated_at triggers
create trigger update_profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.update_updated_at();

create trigger update_workspaces_updated_at
  before update on public.workspaces
  for each row execute procedure public.update_updated_at();

create trigger update_folders_updated_at
  before update on public.folders
  for each row execute procedure public.update_updated_at();

create trigger update_assets_updated_at
  before update on public.assets
  for each row execute procedure public.update_updated_at();

create trigger update_short_links_updated_at
  before update on public.short_links
  for each row execute procedure public.update_updated_at();

create trigger update_collections_updated_at
  before update on public.collections
  for each row execute procedure public.update_updated_at();

-- ============================================
-- STORAGE BUCKETS
-- ============================================

-- Note: Run these in the Supabase dashboard SQL editor or via Supabase CLI
-- as storage bucket creation requires service role permissions

-- insert into storage.buckets (id, name, public)
-- values
--   ('assets', 'assets', true),
--   ('thumbnails', 'thumbnails', true),
--   ('avatars', 'avatars', true);

-- Storage policies would go here as well
