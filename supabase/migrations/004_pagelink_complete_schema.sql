-- Pagelink Complete Schema Migration
-- This migration adds all missing tables, columns, indexes, and RLS policies
-- for the full Pagelink feature set: leads, feedback, A/B testing, webhooks

-- ============================================================================
-- PHASE 1: ADD MISSING COLUMNS TO pagelink_documents
-- ============================================================================

-- Add lead capture configuration
ALTER TABLE public.pagelink_documents
ADD COLUMN IF NOT EXISTS lead_capture jsonb DEFAULT '{"enabled": false}';

-- Add feedback configuration
ALTER TABLE public.pagelink_documents
ADD COLUMN IF NOT EXISTS feedback_config jsonb DEFAULT '{"enabled": false}';

-- Add A/B test configuration
ALTER TABLE public.pagelink_documents
ADD COLUMN IF NOT EXISTS ab_test_config jsonb DEFAULT null;

-- Add webhook configuration
ALTER TABLE public.pagelink_documents
ADD COLUMN IF NOT EXISTS webhook_config jsonb DEFAULT null;

-- Add archive timestamp for soft deletes
ALTER TABLE public.pagelink_documents
ADD COLUMN IF NOT EXISTS archived_at timestamptz DEFAULT null;

-- Add metadata for additional config
ALTER TABLE public.pagelink_documents
ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}';

-- ============================================================================
-- PHASE 2: CREATE PAGELINK_LEADS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.pagelink_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES public.pagelink_documents(id) ON DELETE CASCADE,
  user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,

  -- Contact information
  email text NOT NULL,
  name text,
  company text,
  phone text,

  -- Custom fields for flexible data capture
  custom_fields jsonb DEFAULT '{}',

  -- Tracking metadata
  ip_address text,
  user_agent text,
  referrer text,

  -- Timestamps
  created_at timestamptz DEFAULT now() NOT NULL,
  viewed_at timestamptz,

  -- Ensure unique email per document
  CONSTRAINT unique_lead_email_per_document UNIQUE (document_id, email)
);

-- Indexes for pagelink_leads
CREATE INDEX IF NOT EXISTS idx_pagelink_leads_document ON public.pagelink_leads(document_id);
CREATE INDEX IF NOT EXISTS idx_pagelink_leads_email ON public.pagelink_leads(email);
CREATE INDEX IF NOT EXISTS idx_pagelink_leads_user ON public.pagelink_leads(user_id);
CREATE INDEX IF NOT EXISTS idx_pagelink_leads_created ON public.pagelink_leads(created_at DESC);

-- ============================================================================
-- PHASE 3: CREATE PAGELINK_FEEDBACK TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.pagelink_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES public.pagelink_documents(id) ON DELETE CASCADE,

  -- Feedback content
  type text NOT NULL CHECK (type IN ('comment', 'rating', 'reaction', 'suggestion')),
  content text,
  rating integer CHECK (rating >= 1 AND rating <= 5),
  reaction text,

  -- Submitter info (optional)
  email text,
  name text,

  -- Moderation
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  moderated_at timestamptz,

  -- Tracking metadata
  ip_address text,
  user_agent text,

  -- Timestamps
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Indexes for pagelink_feedback
CREATE INDEX IF NOT EXISTS idx_pagelink_feedback_document ON public.pagelink_feedback(document_id);
CREATE INDEX IF NOT EXISTS idx_pagelink_feedback_status ON public.pagelink_feedback(status);
CREATE INDEX IF NOT EXISTS idx_pagelink_feedback_created ON public.pagelink_feedback(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pagelink_feedback_type ON public.pagelink_feedback(type);

-- ============================================================================
-- PHASE 4: CREATE PAGELINK_AB_TEST_EVENTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.pagelink_ab_test_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES public.pagelink_documents(id) ON DELETE CASCADE,
  variant_id text NOT NULL,

  -- Event type
  event_type text NOT NULL CHECK (event_type IN ('view', 'conversion')),

  -- Tracking metadata
  visitor_id text,
  ip_address text,
  user_agent text,

  -- Timestamps
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Indexes for pagelink_ab_test_events
CREATE INDEX IF NOT EXISTS idx_pagelink_ab_events_document ON public.pagelink_ab_test_events(document_id);
CREATE INDEX IF NOT EXISTS idx_pagelink_ab_events_variant ON public.pagelink_ab_test_events(variant_id);
CREATE INDEX IF NOT EXISTS idx_pagelink_ab_events_type ON public.pagelink_ab_test_events(event_type);
CREATE INDEX IF NOT EXISTS idx_pagelink_ab_events_created ON public.pagelink_ab_test_events(created_at DESC);
-- Composite index for efficient stats queries
CREATE INDEX IF NOT EXISTS idx_pagelink_ab_events_stats ON public.pagelink_ab_test_events(document_id, variant_id, event_type);

-- ============================================================================
-- PHASE 5: CREATE PAGELINK_WEBHOOK_LOGS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.pagelink_webhook_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES public.pagelink_documents(id) ON DELETE CASCADE,
  endpoint_id text NOT NULL,

  -- Event info
  event_type text NOT NULL,

  -- Delivery status
  success boolean NOT NULL DEFAULT false,
  status_code integer,
  error_message text,

  -- Request/response metadata (for debugging)
  request_payload jsonb,
  response_body text,

  -- Timestamps
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Indexes for pagelink_webhook_logs
CREATE INDEX IF NOT EXISTS idx_pagelink_webhook_logs_document ON public.pagelink_webhook_logs(document_id);
CREATE INDEX IF NOT EXISTS idx_pagelink_webhook_logs_endpoint ON public.pagelink_webhook_logs(endpoint_id);
CREATE INDEX IF NOT EXISTS idx_pagelink_webhook_logs_success ON public.pagelink_webhook_logs(success);
CREATE INDEX IF NOT EXISTS idx_pagelink_webhook_logs_created ON public.pagelink_webhook_logs(created_at DESC);
-- Composite index for filtering by document and success status
CREATE INDEX IF NOT EXISTS idx_pagelink_webhook_logs_doc_success ON public.pagelink_webhook_logs(document_id, success);

-- ============================================================================
-- PHASE 6: ADDITIONAL PERFORMANCE INDEXES FOR pagelink_documents
-- ============================================================================

-- Index for archived documents filtering
CREATE INDEX IF NOT EXISTS idx_pagelink_docs_archived ON public.pagelink_documents(archived_at) WHERE archived_at IS NOT NULL;

-- Index for custom domain lookups
CREATE INDEX IF NOT EXISTS idx_pagelink_docs_custom_domain ON public.pagelink_documents(custom_domain) WHERE custom_domain IS NOT NULL;

-- Composite index for common query patterns
CREATE INDEX IF NOT EXISTS idx_pagelink_docs_user_created ON public.pagelink_documents(user_id, created_at DESC);

-- Index for public documents
CREATE INDEX IF NOT EXISTS idx_pagelink_docs_public ON public.pagelink_documents(is_public) WHERE is_public = true;

-- ============================================================================
-- PHASE 7: ADDITIONAL INDEXES FOR pagelink_analytics
-- ============================================================================

-- Index for time-based queries
CREATE INDEX IF NOT EXISTS idx_pagelink_analytics_doc_created ON public.pagelink_analytics(document_id, created_at DESC);

-- Index for event type filtering
CREATE INDEX IF NOT EXISTS idx_pagelink_analytics_event_type ON public.pagelink_analytics(event_type);

-- ============================================================================
-- PHASE 8: ENABLE ROW LEVEL SECURITY ON NEW TABLES
-- ============================================================================

ALTER TABLE public.pagelink_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pagelink_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pagelink_ab_test_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pagelink_webhook_logs ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- PHASE 9: RLS POLICIES FOR PAGELINK_LEADS
-- ============================================================================

-- Document owners can view all leads for their documents
CREATE POLICY "Document owners can view leads"
  ON public.pagelink_leads FOR SELECT
  USING (
    document_id IN (
      SELECT id FROM public.pagelink_documents WHERE user_id = auth.uid()
    )
  );

-- Anyone can insert leads (public form submission) - use service role for actual inserts
CREATE POLICY "Service role can insert leads"
  ON public.pagelink_leads FOR INSERT
  WITH CHECK (true);

-- Document owners can update leads (e.g., mark as viewed)
CREATE POLICY "Document owners can update leads"
  ON public.pagelink_leads FOR UPDATE
  USING (
    document_id IN (
      SELECT id FROM public.pagelink_documents WHERE user_id = auth.uid()
    )
  );

-- Document owners can delete leads
CREATE POLICY "Document owners can delete leads"
  ON public.pagelink_leads FOR DELETE
  USING (
    document_id IN (
      SELECT id FROM public.pagelink_documents WHERE user_id = auth.uid()
    )
  );

-- ============================================================================
-- PHASE 10: RLS POLICIES FOR PAGELINK_FEEDBACK
-- ============================================================================

-- Document owners can view all feedback
CREATE POLICY "Document owners can view feedback"
  ON public.pagelink_feedback FOR SELECT
  USING (
    document_id IN (
      SELECT id FROM public.pagelink_documents WHERE user_id = auth.uid()
    )
  );

-- Anyone can submit feedback (public form)
CREATE POLICY "Anyone can submit feedback"
  ON public.pagelink_feedback FOR INSERT
  WITH CHECK (true);

-- Document owners can moderate feedback
CREATE POLICY "Document owners can moderate feedback"
  ON public.pagelink_feedback FOR UPDATE
  USING (
    document_id IN (
      SELECT id FROM public.pagelink_documents WHERE user_id = auth.uid()
    )
  );

-- Document owners can delete feedback
CREATE POLICY "Document owners can delete feedback"
  ON public.pagelink_feedback FOR DELETE
  USING (
    document_id IN (
      SELECT id FROM public.pagelink_documents WHERE user_id = auth.uid()
    )
  );

-- ============================================================================
-- PHASE 11: RLS POLICIES FOR PAGELINK_AB_TEST_EVENTS
-- ============================================================================

-- Document owners can view A/B test events
CREATE POLICY "Document owners can view ab test events"
  ON public.pagelink_ab_test_events FOR SELECT
  USING (
    document_id IN (
      SELECT id FROM public.pagelink_documents WHERE user_id = auth.uid()
    )
  );

-- Anyone can insert A/B test events (public tracking)
CREATE POLICY "Anyone can insert ab test events"
  ON public.pagelink_ab_test_events FOR INSERT
  WITH CHECK (true);

-- ============================================================================
-- PHASE 12: RLS POLICIES FOR PAGELINK_WEBHOOK_LOGS
-- ============================================================================

-- Document owners can view webhook logs
CREATE POLICY "Document owners can view webhook logs"
  ON public.pagelink_webhook_logs FOR SELECT
  USING (
    document_id IN (
      SELECT id FROM public.pagelink_documents WHERE user_id = auth.uid()
    )
  );

-- Service role can insert webhook logs (internal use)
CREATE POLICY "Service role can insert webhook logs"
  ON public.pagelink_webhook_logs FOR INSERT
  WITH CHECK (true);

-- Document owners can delete webhook logs
CREATE POLICY "Document owners can delete webhook logs"
  ON public.pagelink_webhook_logs FOR DELETE
  USING (
    document_id IN (
      SELECT id FROM public.pagelink_documents WHERE user_id = auth.uid()
    )
  );

-- ============================================================================
-- PHASE 13: HELPER FUNCTIONS
-- ============================================================================

-- Function to safely increment lead count
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

-- Function to get document stats
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

-- ============================================================================
-- PHASE 14: TRIGGERS FOR AUTOMATED UPDATES
-- ============================================================================

-- Trigger to update document metadata when lead is added
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

-- ============================================================================
-- PHASE 15: GRANTS FOR SERVICE ROLE
-- ============================================================================

-- Grant necessary permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pagelink_leads TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pagelink_feedback TO authenticated;
GRANT SELECT, INSERT ON public.pagelink_ab_test_events TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.pagelink_webhook_logs TO authenticated;

-- Grant permissions to anon users for public operations
GRANT INSERT ON public.pagelink_leads TO anon;
GRANT INSERT ON public.pagelink_feedback TO anon;
GRANT INSERT ON public.pagelink_ab_test_events TO anon;

-- ============================================================================
-- PHASE 16: COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE public.pagelink_leads IS 'Stores lead capture form submissions for Pagelink documents';
COMMENT ON TABLE public.pagelink_feedback IS 'Stores feedback and comments submitted on Pagelink documents';
COMMENT ON TABLE public.pagelink_ab_test_events IS 'Tracks view and conversion events for A/B testing variants';
COMMENT ON TABLE public.pagelink_webhook_logs IS 'Logs webhook delivery attempts for debugging and monitoring';

COMMENT ON COLUMN public.pagelink_documents.lead_capture IS 'JSON config for lead capture settings (enabled, required fields, etc.)';
COMMENT ON COLUMN public.pagelink_documents.feedback_config IS 'JSON config for feedback widget settings';
COMMENT ON COLUMN public.pagelink_documents.ab_test_config IS 'JSON config for A/B testing (variants, goals, traffic split)';
COMMENT ON COLUMN public.pagelink_documents.webhook_config IS 'JSON config for webhook endpoints and event subscriptions';
COMMENT ON COLUMN public.pagelink_documents.archived_at IS 'Timestamp when document was archived (soft delete)';
