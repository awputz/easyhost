-- Pagelink Documents Schema
-- This extends the pages schema for the full Pagelink experience

-- Create pagelink_documents table
create table if not exists public.pagelink_documents (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.workspaces(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete set null,

  -- URL and identification
  slug text unique not null,
  custom_domain text,

  -- Content
  title text not null,
  html text not null,
  document_type text, -- 'investment_memo', 'pitch_deck', 'proposal', 'one_pager', 'report', 'custom'

  -- Chat history for context (stores conversation with AI)
  chat_history jsonb default '[]',

  -- Access control
  is_public boolean default true,
  password_hash text,
  expires_at timestamptz,
  allowed_emails text[], -- email whitelist if set

  -- Branding and theming
  theme text default 'midnight', -- 'midnight', 'charcoal', 'slate', 'espresso', 'olive', 'custom'
  custom_branding jsonb default '{}',
  show_pagelink_badge boolean default true,

  -- Analytics
  view_count int default 0,
  last_viewed_at timestamptz,

  -- Timestamps
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Document versions for history/undo
create table if not exists public.pagelink_document_versions (
  id uuid primary key default gen_random_uuid(),
  document_id uuid references public.pagelink_documents(id) on delete cascade,
  html text not null,
  title text,
  version_number int not null,
  created_by uuid references public.profiles(id),
  created_at timestamptz default now()
);

-- Document analytics events
create table if not exists public.pagelink_analytics (
  id uuid primary key default gen_random_uuid(),
  document_id uuid references public.pagelink_documents(id) on delete cascade,
  event_type text not null, -- 'view', 'download', 'share'
  visitor_id text,
  ip_address text,
  user_agent text,
  referrer text,
  country_code text,
  city text,
  created_at timestamptz default now()
);

-- Indexes for performance
create index if not exists idx_pagelink_docs_slug on public.pagelink_documents(slug);
create index if not exists idx_pagelink_docs_user on public.pagelink_documents(user_id);
create index if not exists idx_pagelink_docs_workspace on public.pagelink_documents(workspace_id);
create index if not exists idx_pagelink_versions_doc on public.pagelink_document_versions(document_id);
create index if not exists idx_pagelink_analytics_doc on public.pagelink_analytics(document_id);
create index if not exists idx_pagelink_analytics_created on public.pagelink_analytics(created_at);

-- Enable Row Level Security
alter table public.pagelink_documents enable row level security;
alter table public.pagelink_document_versions enable row level security;
alter table public.pagelink_analytics enable row level security;

-- RLS Policies for pagelink_documents
create policy "Users can view own documents"
  on public.pagelink_documents for select
  using (user_id = auth.uid() or workspace_id in (
    select workspace_id from public.workspace_members where user_id = auth.uid()
  ));

create policy "Public documents are viewable by anyone"
  on public.pagelink_documents for select
  using (is_public = true);

create policy "Users can create documents"
  on public.pagelink_documents for insert
  with check (user_id = auth.uid());

create policy "Users can update own documents"
  on public.pagelink_documents for update
  using (user_id = auth.uid() or workspace_id in (
    select workspace_id from public.workspace_members
    where user_id = auth.uid() and role in ('admin', 'editor')
  ));

create policy "Users can delete own documents"
  on public.pagelink_documents for delete
  using (user_id = auth.uid());

-- RLS Policies for pagelink_document_versions
create policy "Users can view versions of own documents"
  on public.pagelink_document_versions for select
  using (document_id in (
    select id from public.pagelink_documents where user_id = auth.uid()
  ));

create policy "Users can create versions for own documents"
  on public.pagelink_document_versions for insert
  with check (document_id in (
    select id from public.pagelink_documents where user_id = auth.uid()
  ));

-- RLS Policies for pagelink_analytics (insert only, no user restriction for tracking)
create policy "Anyone can insert analytics"
  on public.pagelink_analytics for insert
  with check (true);

create policy "Users can view analytics for own documents"
  on public.pagelink_analytics for select
  using (document_id in (
    select id from public.pagelink_documents where user_id = auth.uid()
  ));

-- Function to update updated_at timestamp
create or replace function update_pagelink_document_timestamp()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Trigger to auto-update timestamp
drop trigger if exists update_pagelink_document_timestamp on public.pagelink_documents;
create trigger update_pagelink_document_timestamp
  before update on public.pagelink_documents
  for each row
  execute function update_pagelink_document_timestamp();

-- Function to increment view count
create or replace function increment_pagelink_view_count(doc_slug text)
returns void as $$
begin
  update public.pagelink_documents
  set view_count = view_count + 1, last_viewed_at = now()
  where slug = doc_slug;
end;
$$ language plpgsql security definer;
