// Zod Validation Schemas for Pagelink API
import { z } from 'zod'

// ============================================================================
// COMMON SCHEMAS
// ============================================================================

// UUID validation
export const uuidSchema = z.string().uuid('Invalid UUID format')

// Email validation with lowercase normalization
export const emailSchema = z
  .string()
  .email('Invalid email format')
  .max(255, 'Email too long')
  .transform(val => val.toLowerCase().trim())

// Slug validation (URL-safe string)
export const slugSchema = z
  .string()
  .min(1, 'Slug is required')
  .max(100, 'Slug too long')
  .regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens')

// Safe string (prevents XSS)
export const safeStringSchema = z
  .string()
  .transform(val => val.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ''))

// URL validation
export const urlSchema = z
  .string()
  .url('Invalid URL format')
  .max(2048, 'URL too long')

// Webhook URL validation (prevents SSRF)
export const webhookUrlSchema = z
  .string()
  .url('Invalid URL format')
  .max(2048, 'URL too long')
  .refine(url => {
    try {
      const parsed = new URL(url)
      const hostname = parsed.hostname.toLowerCase()

      // Block localhost and internal addresses
      if (
        hostname === 'localhost' ||
        hostname === '127.0.0.1' ||
        hostname === '0.0.0.0' ||
        hostname.startsWith('192.168.') ||
        hostname.startsWith('10.') ||
        hostname.match(/^172\.(1[6-9]|2[0-9]|3[0-1])\./) ||
        hostname === '169.254.169.254' ||
        hostname.endsWith('.local') ||
        hostname.endsWith('.internal') ||
        hostname.endsWith('.localhost')
      ) {
        return false
      }

      // Only allow https for webhooks
      if (parsed.protocol !== 'https:') {
        return false
      }

      return true
    } catch {
      return false
    }
  }, 'Invalid or blocked webhook URL')

// Pagination
export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
})

// ============================================================================
// DOCUMENT SCHEMAS
// ============================================================================

export const createDocumentSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(200, 'Title too long'),
  html: z
    .string()
    .min(1, 'Content is required')
    .max(5000000, 'Content too large'), // 5MB limit
  slug: slugSchema.optional(),
  document_type: z
    .enum(['investment_memo', 'pitch_deck', 'proposal', 'one_pager', 'report', 'custom'])
    .optional(),
  is_public: z.boolean().default(true),
  theme: z
    .enum(['midnight', 'charcoal', 'slate', 'espresso', 'olive', 'custom'])
    .default('midnight'),
  custom_branding: z.object({
    logo_url: urlSchema.optional(),
    primary_color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid hex color').optional(),
    secondary_color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid hex color').optional(),
    font_family: z.string().max(100).optional(),
    custom_css: z.string().max(10000).optional(),
  }).optional(),
})

export const updateDocumentSchema = createDocumentSchema.partial().extend({
  password: z.string().max(100).optional(),
  expires_at: z.string().datetime().optional().nullable(),
  allowed_emails: z.array(emailSchema).max(100).optional(),
  custom_domain: z.string().max(255).optional().nullable(),
  show_pagelink_badge: z.boolean().optional(),
})

// ============================================================================
// LEAD SCHEMAS
// ============================================================================

export const leadCaptureConfigSchema = z.object({
  enabled: z.boolean().default(false),
  required_fields: z.array(z.enum(['email', 'name', 'company', 'phone'])).default(['email']),
  custom_fields: z.array(z.object({
    id: z.string(),
    label: z.string().max(100),
    type: z.enum(['text', 'textarea', 'select', 'checkbox']),
    required: z.boolean().default(false),
    options: z.array(z.string()).optional(),
  })).max(10).optional(),
  cta_text: z.string().max(50).default('Get Access'),
  success_message: z.string().max(200).default('Thank you! You now have access.'),
  require_for_access: z.boolean().default(false),
})

export const submitLeadSchema = z.object({
  email: emailSchema,
  name: z.string().max(100).optional(),
  company: z.string().max(100).optional(),
  phone: z.string().max(20).optional(),
  customFields: z.record(z.string(), z.string()).optional(),
})

// ============================================================================
// FEEDBACK SCHEMAS
// ============================================================================

export const feedbackConfigSchema = z.object({
  enabled: z.boolean().default(false),
  allow_comments: z.boolean().default(true),
  allow_ratings: z.boolean().default(true),
  allow_reactions: z.boolean().default(true),
  require_email: z.boolean().default(false),
  moderation_enabled: z.boolean().default(false),
  allowed_reactions: z.array(z.string()).default(['👍', '❤️', '🎉', '💡', '🤔']),
})

export const submitFeedbackSchema = z.object({
  type: z.enum(['comment', 'rating', 'reaction', 'suggestion']),
  content: z.string().max(2000).optional(),
  rating: z.number().int().min(1).max(5).optional(),
  reaction: z.string().max(10).optional(),
  email: emailSchema.optional(),
  name: z.string().max(100).optional(),
})

export const moderateFeedbackSchema = z.object({
  feedbackId: uuidSchema,
  status: z.enum(['pending', 'approved', 'rejected']),
})

// ============================================================================
// A/B TEST SCHEMAS
// ============================================================================

export const abTestVariantSchema = z.object({
  id: z.string().min(1),
  name: z.string().max(100),
  html: z.string().max(5000000),
  trafficPercent: z.number().min(0).max(100),
})

export const abTestConfigSchema = z.object({
  enabled: z.boolean().default(false),
  testName: z.string().max(100),
  variants: z.array(abTestVariantSchema).min(2).max(5),
  goalType: z.enum(['clicks', 'conversions', 'time_on_page', 'scroll_depth']),
  goalSelector: z.string().max(200).optional(),
  minSampleSize: z.number().int().min(10).max(100000).default(100),
  confidenceLevel: z.number().min(80).max(99).default(95),
}).refine(
  data => {
    const totalPercent = data.variants.reduce((sum, v) => sum + v.trafficPercent, 0)
    return totalPercent === 100
  },
  { message: 'Variant traffic percentages must sum to 100' }
)

export const recordAbEventSchema = z.object({
  variantId: z.string().min(1),
  eventType: z.enum(['view', 'conversion']),
})

export const declareWinnerSchema = z.object({
  winnerId: z.string().min(1),
})

// ============================================================================
// WEBHOOK SCHEMAS
// ============================================================================

export const webhookEndpointSchema = z.object({
  id: z.string().min(1),
  name: z.string().max(100),
  url: webhookUrlSchema,
  secret: z.string().min(16).max(100),
  enabled: z.boolean().default(true),
  events: z.array(z.enum([
    'document.viewed',
    'document.updated',
    'lead.captured',
    'feedback.submitted',
    'ab_test.conversion',
  ])).min(1),
})

export const webhookConfigSchema = z.object({
  enabled: z.boolean().default(false),
  endpoints: z.array(webhookEndpointSchema).max(10),
  globalSecret: z.string().max(100).optional(),
})

export const testWebhookSchema = z.object({
  endpointId: z.string().optional(),
  url: webhookUrlSchema,
  secret: z.string().max(100).optional(),
})

// ============================================================================
// ANALYTICS SCHEMAS
// ============================================================================

export const analyticsQuerySchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  granularity: z.enum(['hour', 'day', 'week', 'month']).default('day'),
  metrics: z.array(z.enum(['views', 'unique_visitors', 'avg_time', 'bounce_rate'])).optional(),
})

export const trackEventSchema = z.object({
  event_type: z.enum(['view', 'download', 'share', 'click', 'scroll']),
  visitor_id: z.string().max(100).optional(),
  referrer: urlSchema.optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
})

// ============================================================================
// PASSWORD/ACCESS SCHEMAS
// ============================================================================

export const verifyPasswordSchema = z.object({
  password: z.string().min(1).max(100),
})

export const updateAccessSchema = z.object({
  is_public: z.boolean().optional(),
  password: z.string().max(100).optional().nullable(),
  allowed_emails: z.array(emailSchema).max(100).optional().nullable(),
  expires_at: z.string().datetime().optional().nullable(),
})

// ============================================================================
// TEMPLATE SCHEMAS
// ============================================================================

export const templateSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  category: z.enum(['pitch_deck', 'investment_memo', 'proposal', 'report', 'other']),
  html: z.string().max(5000000),
  thumbnail_url: urlSchema.optional(),
  is_premium: z.boolean().default(false),
})

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Validate request body against a schema
 */
export function validateBody<T>(
  schema: z.ZodType<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: z.ZodError } {
  const result = schema.safeParse(data)
  if (result.success) {
    return { success: true, data: result.data }
  }
  return { success: false, errors: result.error }
}

/**
 * Format Zod errors for API response
 */
export function formatZodErrors(errors: z.ZodError): Record<string, string[]> {
  const formatted: Record<string, string[]> = {}
  const issues = errors.issues || []
  for (const issue of issues) {
    const path = issue.path.join('.') || '_root'
    if (!formatted[path]) {
      formatted[path] = []
    }
    formatted[path].push(issue.message)
  }
  return formatted
}

// Export types
export type CreateDocumentInput = z.infer<typeof createDocumentSchema>
export type UpdateDocumentInput = z.infer<typeof updateDocumentSchema>
export type LeadCaptureConfig = z.infer<typeof leadCaptureConfigSchema>
export type SubmitLeadInput = z.infer<typeof submitLeadSchema>
export type FeedbackConfig = z.infer<typeof feedbackConfigSchema>
export type SubmitFeedbackInput = z.infer<typeof submitFeedbackSchema>
export type AbTestConfig = z.infer<typeof abTestConfigSchema>
export type WebhookConfig = z.infer<typeof webhookConfigSchema>
export type WebhookEndpoint = z.infer<typeof webhookEndpointSchema>
