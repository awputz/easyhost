-- Pagelink Pages Schema
-- AI-generated documents that replace PDFs

-- Pages (the core document entity)
create table public.pages (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.workspaces(id) on delete cascade,

  -- Identification
  slug text unique not null,
  title text not null,
  description text,

  -- Content
  html text not null default '',
  template_type text, -- pitch-deck, investment-memo, proposal, etc.

  -- Design
  theme text default 'professional-dark',
  branding jsonb default '{}', -- logo, colors, fonts

  -- Access
  is_public boolean default true,
  password_hash text,

  -- Metadata
  metadata jsonb default '{}',

  -- Stats
  view_count int default 0,

  -- Timestamps
  created_by uuid references public.profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Page Versions (history)
create table public.page_versions (
  id uuid primary key default gen_random_uuid(),
  page_id uuid references public.pages(id) on delete cascade,
  version_number int not null,
  html text not null,
  title text,
  created_at timestamptz default now(),
  unique(page_id, version_number)
);

-- Page Chat History (for AI context)
create table public.page_chats (
  id uuid primary key default gen_random_uuid(),
  page_id uuid references public.pages(id) on delete cascade,
  role text not null check (role in ('user', 'assistant', 'system')),
  content text not null,
  created_at timestamptz default now()
);

-- Page Analytics (extends analytics_events for page-specific tracking)
create index idx_pages_workspace on public.pages(workspace_id);
create index idx_pages_slug on public.pages(slug);
create index idx_pages_created_by on public.pages(created_by);
create index idx_page_versions_page on public.page_versions(page_id);
create index idx_page_chats_page on public.page_chats(page_id);

-- RLS Policies
alter table public.pages enable row level security;
alter table public.page_versions enable row level security;
alter table public.page_chats enable row level security;

-- Pages: Public pages viewable by all
create policy "Public pages are viewable"
  on public.pages for select
  using (is_public = true);

-- Pages: Workspace members can view all
create policy "Workspace members can view pages"
  on public.pages for select
  using (
    workspace_id in (
      select id from public.workspaces where owner_id = auth.uid()
      union
      select workspace_id from public.workspace_members where user_id = auth.uid()
    )
  );

-- Pages: Editors can manage
create policy "Editors can manage pages"
  on public.pages for all
  using (
    workspace_id in (
      select id from public.workspaces where owner_id = auth.uid()
      union
      select workspace_id from public.workspace_members
      where user_id = auth.uid() and role in ('editor', 'admin')
    )
  );

-- Page versions: Same as pages
create policy "Page versions follow page access"
  on public.page_versions for select
  using (
    page_id in (
      select id from public.pages where is_public = true
      union
      select id from public.pages where workspace_id in (
        select id from public.workspaces where owner_id = auth.uid()
        union
        select workspace_id from public.workspace_members where user_id = auth.uid()
      )
    )
  );

create policy "Editors can manage page versions"
  on public.page_versions for all
  using (
    page_id in (
      select id from public.pages where workspace_id in (
        select id from public.workspaces where owner_id = auth.uid()
        union
        select workspace_id from public.workspace_members
        where user_id = auth.uid() and role in ('editor', 'admin')
      )
    )
  );

-- Page chats: Only workspace members
create policy "Workspace members can view page chats"
  on public.page_chats for select
  using (
    page_id in (
      select id from public.pages where workspace_id in (
        select id from public.workspaces where owner_id = auth.uid()
        union
        select workspace_id from public.workspace_members where user_id = auth.uid()
      )
    )
  );

create policy "Editors can manage page chats"
  on public.page_chats for all
  using (
    page_id in (
      select id from public.pages where workspace_id in (
        select id from public.workspaces where owner_id = auth.uid()
        union
        select workspace_id from public.workspace_members
        where user_id = auth.uid() and role in ('editor', 'admin')
      )
    )
  );

-- Update timestamp trigger
create trigger update_pages_updated_at
  before update on public.pages
  for each row execute procedure public.update_updated_at();
