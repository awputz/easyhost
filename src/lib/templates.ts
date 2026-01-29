// Template utility functions for EZ-Host.ai

import type { TemplateVariable } from '@/types'

// Regex to match {{variable}} patterns
const VARIABLE_REGEX = /\{\{([a-zA-Z_][a-zA-Z0-9_]*)\}\}/g

/**
 * Extract variable names from template content
 */
export function extractVariables(content: string): string[] {
  const matches = content.matchAll(VARIABLE_REGEX)
  const variables = new Set<string>()

  for (const match of matches) {
    variables.add(match[1])
  }

  return Array.from(variables)
}

/**
 * Check if content contains template variables
 */
export function isTemplate(content: string): boolean {
  return VARIABLE_REGEX.test(content)
}

/**
 * Infer variable type from name
 */
export function inferVariableType(name: string): TemplateVariable['type'] {
  const nameLower = name.toLowerCase()

  if (nameLower.includes('color') || nameLower.includes('colour')) {
    return 'color'
  }
  if (nameLower.includes('url') || nameLower.includes('link') || nameLower.includes('href')) {
    return 'url'
  }
  if (nameLower.includes('date') || nameLower.includes('time')) {
    return 'date'
  }
  if (nameLower.includes('count') || nameLower.includes('number') || nameLower.includes('amount') || nameLower.includes('price') || nameLower.includes('qty')) {
    return 'number'
  }
  if (nameLower.includes('image') || nameLower.includes('img') || nameLower.includes('photo') || nameLower.includes('logo')) {
    return 'image'
  }

  return 'text'
}

/**
 * Generate default variable schema from extracted names
 */
export function generateVariableSchema(names: string[]): TemplateVariable[] {
  return names.map((name) => ({
    name,
    type: inferVariableType(name),
    required: true,
    description: formatVariableName(name),
  }))
}

/**
 * Format variable name for display (snake_case to Title Case)
 */
export function formatVariableName(name: string): string {
  return name
    .replace(/_/g, ' ')
    .replace(/([A-Z])/g, ' $1')
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
    .trim()
}

/**
 * Render template with variables
 */
export function renderTemplate(
  template: string,
  variables: Record<string, string>
): string {
  let result = template

  for (const [name, value] of Object.entries(variables)) {
    const regex = new RegExp(`\\{\\{${name}\\}\\}`, 'g')
    result = result.replace(regex, value)
  }

  return result
}

/**
 * Validate that all required variables are provided
 */
export function validateVariables(
  schema: TemplateVariable[],
  values: Record<string, string>
): { valid: boolean; missing: string[] } {
  const missing: string[] = []

  for (const variable of schema) {
    if (variable.required && !values[variable.name]) {
      missing.push(variable.name)
    }
  }

  return {
    valid: missing.length === 0,
    missing,
  }
}

/**
 * Generate sample data for template preview
 */
export function generateSampleData(schema: TemplateVariable[]): Record<string, string> {
  const data: Record<string, string> = {}

  for (const variable of schema) {
    if (variable.default) {
      data[variable.name] = variable.default
    } else {
      data[variable.name] = getSampleValue(variable)
    }
  }

  return data
}

/**
 * Get a sample value based on variable type
 */
function getSampleValue(variable: TemplateVariable): string {
  switch (variable.type) {
    case 'text':
      return `Sample ${formatVariableName(variable.name)}`
    case 'number':
      return '42'
    case 'url':
      return 'https://example.com'
    case 'date':
      return new Date().toISOString().split('T')[0]
    case 'color':
      return '#8b5cf6'
    case 'image':
      return 'https://via.placeholder.com/400x300'
    default:
      return 'Sample Value'
  }
}
