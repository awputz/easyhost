-- ============================================================================
-- COMBINED MIGRATIONS 002, 003, 004
-- Run this after 001_initial_schema.sql
-- ============================================================================

-- ============================================================================
-- MIGRATION 002: PAGES SCHEMA
-- ============================================================================

-- Pages (the core document entity)
create table public.pages (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.workspaces(id) on delete cascade,
  slug text unique not null,
  title text not null,
  description text,
  html text not null default '',
  template_type text,
  theme text default 'professional-dark',
  branding jsonb default '{}',
  is_public boolean default true,
  password_hash text,
  metadata jsonb default '{}',
  view_count int default 0,
  created_by uuid references public.profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Page Versions
create table public.page_versions (
  id uuid primary key default gen_random_uuid(),
  page_id uuid references public.pages(id) on delete cascade,
  version_number int not null,
  html text not null,
  title text,
  created_at timestamptz default now(),
  unique(page_id, version_number)
);

-- Page Chat History
create table public.page_chats (
  id uuid primary key default gen_random_uuid(),
  page_id uuid references public.pages(id) on delete cascade,
  role text not null check (role in ('user', 'assistant', 'system')),
  content text not null,
  created_at timestamptz default now()
);

-- Indexes
create index idx_pages_workspace on public.pages(workspace_id);
create index idx_pages_slug on public.pages(slug);
create index idx_pages_created_by on public.pages(created_by);
create index idx_page_versions_page on public.page_versions(page_id);
create index idx_page_chats_page on public.page_chats(page_id);

-- RLS
alter table public.pages enable row level security;
alter table public.page_versions enable row level security;
alter table public.page_chats enable row level security;

create policy "Public pages are viewable"
  on public.pages for select
  using (is_public = true);

create policy "Workspace members can view pages"
  on public.pages for select
  using (
    workspace_id in (
      select id from public.workspaces where owner_id = auth.uid()
      union
      select workspace_id from public.workspace_members where user_id = auth.uid()
    )
  );

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

create trigger update_pages_updated_at
  before update on public.pages
  for each row execute procedure public.update_updated_at();

-- ============================================================================
-- MIGRATION 003: PAGELINK DOCUMENTS
-- ============================================================================

create table if not exists public.pagelink_documents (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.workspaces(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete set null,
  slug text unique not null,
  custom_domain text,
  title text not null,
  html text not null,
  document_type text,
  chat_history jsonb default '[]',
  is_public boolean default true,
  password_hash text,
  expires_at timestamptz,
  allowed_emails text[],
  theme text default 'midnight',
  custom_branding jsonb default '{}',
  show_pagelink_badge boolean default true,
  view_count int default 0,
  last_viewed_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.pagelink_document_versions (
  id uuid primary key default gen_random_uuid(),
  document_id uuid references public.pagelink_documents(id) on delete cascade,
  html text not null,
  title text,
  version_number int not null,
  created_by uuid references public.profiles(id),
  created_at timestamptz default now()
);

create table if not exists public.pagelink_analytics (
  id uuid primary key default gen_random_uuid(),
  document_id uuid references public.pagelink_documents(id) on delete cascade,
  event_type text not null,
  visitor_id text,
  ip_address text,
  user_agent text,
  referrer text,
  country_code text,
  city text,
  created_at timestamptz default now()
);

create index if not exists idx_pagelink_docs_slug on public.pagelink_documents(slug);
create index if not exists idx_pagelink_docs_user on public.pagelink_documents(user_id);
create index if not exists idx_pagelink_docs_workspace on public.pagelink_documents(workspace_id);
create index if not exists idx_pagelink_versions_doc on public.pagelink_document_versions(document_id);
create index if not exists idx_pagelink_analytics_doc on public.pagelink_analytics(document_id);
create index if not exists idx_pagelink_analytics_created on public.pagelink_analytics(created_at);

alter table public.pagelink_documents enable row level security;
alter table public.pagelink_document_versions enable row level security;
alter table public.pagelink_analytics enable row level security;

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

create policy "Anyone can insert analytics"
  on public.pagelink_analytics for insert
  with check (true);

create policy "Users can view analytics for own documents"
  on public.pagelink_analytics for select
  using (document_id in (
    select id from public.pagelink_documents where user_id = auth.uid()
  ));

create or replace function update_pagelink_document_timestamp()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists update_pagelink_document_timestamp on public.pagelink_documents;
create trigger update_pagelink_document_timestamp
  before update on public.pagelink_documents
  for each row
  execute function update_pagelink_document_timestamp();

create or replace function increment_pagelink_view_count(doc_slug text)
returns void as $$
begin
  update public.pagelink_documents
  set view_count = view_count + 1, last_viewed_at = now()
  where slug = doc_slug;
end;
$$ language plpgsql security definer;

-- ============================================================================
-- MIGRATION 004: COMPLETE SCHEMA (LEADS, FEEDBACK, A/B, WEBHOOKS)
-- ============================================================================

ALTER TABLE public.pagelink_documents
ADD COLUMN IF NOT EXISTS lead_capture jsonb DEFAULT '{"enabled": false}';

ALTER TABLE public.pagelink_documents
ADD COLUMN IF NOT EXISTS feedback_config jsonb DEFAULT '{"enabled": false}';

ALTER TABLE public.pagelink_documents
ADD COLUMN IF NOT EXISTS ab_test_config jsonb DEFAULT null;

ALTER TABLE public.pagelink_documents
ADD COLUMN IF NOT EXISTS webhook_config jsonb DEFAULT null;

ALTER TABLE public.pagelink_documents
ADD COLUMN IF NOT EXISTS archived_at timestamptz DEFAULT null;

ALTER TABLE public.pagelink_documents
ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}';

CREATE TABLE IF NOT EXISTS public.pagelink_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES public.pagelink_documents(id) ON DELETE CASCADE,
  user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  email text NOT NULL,
  name text,
  company text,
  phone text,
  custom_fields jsonb DEFAULT '{}',
  ip_address text,
  user_agent text,
  referrer text,
  created_at timestamptz DEFAULT now() NOT NULL,
  viewed_at timestamptz,
  CONSTRAINT unique_lead_email_per_document UNIQUE (document_id, email)
);

CREATE INDEX IF NOT EXISTS idx_pagelink_leads_document ON public.pagelink_leads(document_id);
CREATE INDEX IF NOT EXISTS idx_pagelink_leads_email ON public.pagelink_leads(email);
CREATE INDEX IF NOT EXISTS idx_pagelink_leads_user ON public.pagelink_leads(user_id);
CREATE INDEX IF NOT EXISTS idx_pagelink_leads_created ON public.pagelink_leads(created_at DESC);

CREATE TABLE IF NOT EXISTS public.pagelink_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES public.pagelink_documents(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('comment', 'rating', 'reaction', 'suggestion')),
  content text,
  rating integer CHECK (rating >= 1 AND rating <= 5),
  reaction text,
  email text,
  name text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  moderated_at timestamptz,
  ip_address text,
  user_agent text,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_pagelink_feedback_document ON public.pagelink_feedback(document_id);
CREATE INDEX IF NOT EXISTS idx_pagelink_feedback_status ON public.pagelink_feedback(status);
CREATE INDEX IF NOT EXISTS idx_pagelink_feedback_created ON public.pagelink_feedback(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pagelink_feedback_type ON public.pagelink_feedback(type);

CREATE TABLE IF NOT EXISTS public.pagelink_ab_test_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES public.pagelink_documents(id) ON DELETE CASCADE,
  variant_id text NOT NULL,
  event_type text NOT NULL CHECK (event_type IN ('view', 'conversion')),
  visitor_id text,
  ip_address text,
  user_agent text,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_pagelink_ab_events_document ON public.pagelink_ab_test_events(document_id);
CREATE INDEX IF NOT EXISTS idx_pagelink_ab_events_variant ON public.pagelink_ab_test_events(variant_id);
CREATE INDEX IF NOT EXISTS idx_pagelink_ab_events_type ON public.pagelink_ab_test_events(event_type);
CREATE INDEX IF NOT EXISTS idx_pagelink_ab_events_created ON public.pagelink_ab_test_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pagelink_ab_events_stats ON public.pagelink_ab_test_events(document_id, variant_id, event_type);

CREATE TABLE IF NOT EXISTS public.pagelink_webhook_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES public.pagelink_documents(id) ON DELETE CASCADE,
  endpoint_id text NOT NULL,
  event_type text NOT NULL,
  success boolean NOT NULL DEFAULT false,
  status_code integer,
  error_message text,
  request_payload jsonb,
  response_body text,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_pagelink_webhook_logs_document ON public.pagelink_webhook_logs(document_id);
CREATE INDEX IF NOT EXISTS idx_pagelink_webhook_logs_endpoint ON public.pagelink_webhook_logs(endpoint_id);
CREATE INDEX IF NOT EXISTS idx_pagelink_webhook_logs_success ON public.pagelink_webhook_logs(success);
CREATE INDEX IF NOT EXISTS idx_pagelink_webhook_logs_created ON public.pagelink_webhook_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pagelink_webhook_logs_doc_success ON public.pagelink_webhook_logs(document_id, success);

CREATE INDEX IF NOT EXISTS idx_pagelink_docs_archived ON public.pagelink_documents(archived_at) WHERE archived_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_pagelink_docs_custom_domain ON public.pagelink_documents(custom_domain) WHERE custom_domain IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_pagelink_docs_user_created ON public.pagelink_documents(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pagelink_docs_public ON public.pagelink_documents(is_public) WHERE is_public = true;
CREATE INDEX IF NOT EXISTS idx_pagelink_analytics_doc_created ON public.pagelink_analytics(document_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pagelink_analytics_event_type ON public.pagelink_analytics(event_type);

ALTER TABLE public.pagelink_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pagelink_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pagelink_ab_test_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pagelink_webhook_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Document owners can view leads"
  ON public.pagelink_leads FOR SELECT
  USING (document_id IN (SELECT id FROM public.pagelink_documents WHERE user_id = auth.uid()));

CREATE POLICY "Service role can insert leads"
  ON public.pagelink_leads FOR INSERT WITH CHECK (true);

CREATE POLICY "Document owners can update leads"
  ON public.pagelink_leads FOR UPDATE
  USING (document_id IN (SELECT id FROM public.pagelink_documents WHERE user_id = auth.uid()));

CREATE POLICY "Document owners can delete leads"
  ON public.pagelink_leads FOR DELETE
  USING (document_id IN (SELECT id FROM public.pagelink_documents WHERE user_id = auth.uid()));

CREATE POLICY "Document owners can view feedback"
  ON public.pagelink_feedback FOR SELECT
  USING (document_id IN (SELECT id FROM public.pagelink_documents WHERE user_id = auth.uid()));

CREATE POLICY "Anyone can submit feedback"
  ON public.pagelink_feedback FOR INSERT WITH CHECK (true);

CREATE POLICY "Document owners can moderate feedback"
  ON public.pagelink_feedback FOR UPDATE
  USING (document_id IN (SELECT id FROM public.pagelink_documents WHERE user_id = auth.uid()));

CREATE POLICY "Document owners can delete feedback"
  ON public.pagelink_feedback FOR DELETE
  USING (document_id IN (SELECT id FROM public.pagelink_documents WHERE user_id = auth.uid()));

CREATE POLICY "Document owners can view ab test events"
  ON public.pagelink_ab_test_events FOR SELECT
  USING (document_id IN (SELECT id FROM public.pagelink_documents WHERE user_id = auth.uid()));

CREATE POLICY "Anyone can insert ab test events"
  ON public.pagelink_ab_test_events FOR INSERT WITH CHECK (true);

CREATE POLICY "Document owners can view webhook logs"
  ON public.pagelink_webhook_logs FOR SELECT
  USING (document_id IN (SELECT id FROM public.pagelink_documents WHERE user_id = auth.uid()));

CREATE POLICY "Service role can insert webhook logs"
  ON public.pagelink_webhook_logs FOR INSERT WITH CHECK (true);

CREATE POLICY "Document owners can delete webhook logs"
  ON public.pagelink_webhook_logs FOR DELETE
  USING (document_id IN (SELECT id FROM public.pagelink_documents WHERE user_id = auth.uid()));

CREATE OR REPLACE FUNCTION increment_document_lead_count(doc_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE public.pagelink_documents
  SET metadata = jsonb_set(
    COALESCE(metadata, '{}'),
    '{lead_count}',
    to_jsonb(COALESCE((metadata->>'lead_count')::int, 0) + 1)
  )
  WHERE id = doc_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_document_stats(doc_id uuid)
RETURNS jsonb AS $$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'view_count', d.view_count,
    'lead_count', (SELECT COUNT(*) FROM public.pagelink_leads WHERE document_id = doc_id),
    'feedback_count', (SELECT COUNT(*) FROM public.pagelink_feedback WHERE document_id = doc_id AND status = 'approved'),
    'ab_test_events', (SELECT COUNT(*) FROM public.pagelink_ab_test_events WHERE document_id = doc_id),
    'webhook_deliveries', (SELECT COUNT(*) FROM public.pagelink_webhook_logs WHERE document_id = doc_id AND success = true)
  ) INTO result
  FROM public.pagelink_documents d
  WHERE d.id = doc_id;
  RETURN COALESCE(result, '{}');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION on_lead_created()
RETURNS trigger AS $$
BEGIN
  PERFORM increment_document_lead_count(NEW.document_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_on_lead_created ON public.pagelink_leads;
CREATE TRIGGER trigger_on_lead_created
  AFTER INSERT ON public.pagelink_leads
  FOR EACH ROW
  EXECUTE FUNCTION on_lead_created();

GRANT SELECT, INSERT, UPDATE, DELETE ON public.pagelink_leads TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pagelink_feedback TO authenticated;
GRANT SELECT, INSERT ON public.pagelink_ab_test_events TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.pagelink_webhook_logs TO authenticated;
GRANT INSERT ON public.pagelink_leads TO anon;
GRANT INSERT ON public.pagelink_feedback TO anon;
GRANT INSERT ON public.pagelink_ab_test_events TO anon;

-- ============================================================================
-- DONE! All migrations complete.
-- ============================================================================
