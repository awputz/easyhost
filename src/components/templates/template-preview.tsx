'use client'

import { useState, useMemo, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Monitor,
  Tablet,
  Smartphone,
  ExternalLink,
  RefreshCw,
  Code,
} from 'lucide-react'
import { renderTemplate, generateSampleData } from '@/lib/templates'
import type { TemplateVariable } from '@/types'

interface TemplatePreviewProps {
  templateContent: string
  schema: TemplateVariable[]
  onVariablesChange?: (variables: Record<string, string>) => void
}

type ViewportSize = 'desktop' | 'tablet' | 'mobile'

const viewportSizes: Record<ViewportSize, { width: number; label: string }> = {
  desktop: { width: 1200, label: 'Desktop' },
  tablet: { width: 768, label: 'Tablet' },
  mobile: { width: 375, label: 'Mobile' },
}

export function TemplatePreview({
  templateContent,
  schema,
  onVariablesChange,
}: TemplatePreviewProps) {
  const [variables, setVariables] = useState<Record<string, string>>({})
  const [viewport, setViewport] = useState<ViewportSize>('desktop')
  const [showSource, setShowSource] = useState(false)

  // Initialize variables with sample data
  useEffect(() => {
    const sampleData = generateSampleData(schema)
    setVariables(sampleData)
    onVariablesChange?.(sampleData)
  }, [schema, onVariablesChange])

  // Render template with current variables
  const renderedContent = useMemo(() => {
    return renderTemplate(templateContent, variables)
  }, [templateContent, variables])

  const updateVariable = (name: string, value: string) => {
    const newVariables = { ...variables, [name]: value }
    setVariables(newVariables)
    onVariablesChange?.(newVariables)
  }

  const resetToSample = () => {
    const sampleData = generateSampleData(schema)
    setVariables(sampleData)
    onVariablesChange?.(sampleData)
  }

  const openInNewTab = () => {
    const blob = new Blob([renderedContent], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    window.open(url, '_blank')
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Variable inputs */}
      <Card className="lg:col-span-1">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Variables</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={resetToSample}
              className="text-muted-foreground"
            >
              <RefreshCw className="h-4 w-4 mr-1" />
              Reset
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 max-h-[600px] overflow-y-auto">
          {schema.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No variables in this template
            </p>
          ) : (
            schema.map((variable) => (
              <div key={variable.name} className="space-y-2">
                <Label htmlFor={`var-${variable.name}`} className="flex items-center gap-2">
                  <span className="font-mono text-sm">{'{{' + variable.name + '}}'}</span>
                  {variable.required && <span className="text-destructive">*</span>}
                </Label>
                {variable.description && (
                  <p className="text-xs text-muted-foreground">{variable.description}</p>
                )}
                {variable.type === 'color' ? (
                  <div className="flex gap-2">
                    <Input
                      id={`var-${variable.name}`}
                      type="color"
                      value={variables[variable.name] || '#000000'}
                      onChange={(e) => updateVariable(variable.name, e.target.value)}
                      className="w-12 p-1 h-9"
                    />
                    <Input
                      value={variables[variable.name] || ''}
                      onChange={(e) => updateVariable(variable.name, e.target.value)}
                      className="flex-1 font-mono text-sm"
                    />
                  </div>
                ) : variable.type === 'date' ? (
                  <Input
                    id={`var-${variable.name}`}
                    type="date"
                    value={variables[variable.name] || ''}
                    onChange={(e) => updateVariable(variable.name, e.target.value)}
                  />
                ) : variable.type === 'number' ? (
                  <Input
                    id={`var-${variable.name}`}
                    type="number"
                    value={variables[variable.name] || ''}
                    onChange={(e) => updateVariable(variable.name, e.target.value)}
                  />
                ) : (
                  <Input
                    id={`var-${variable.name}`}
                    value={variables[variable.name] || ''}
                    onChange={(e) => updateVariable(variable.name, e.target.value)}
                    placeholder={variable.type === 'url' || variable.type === 'image' ? 'https://...' : undefined}
                  />
                )}
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Preview */}
      <Card className="lg:col-span-2">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Preview</CardTitle>
            <div className="flex items-center gap-2">
              {/* Viewport toggle */}
              <div className="flex items-center border rounded-md">
                <Button
                  variant={viewport === 'desktop' ? 'secondary' : 'ghost'}
                  size="sm"
                  className="rounded-r-none"
                  onClick={() => setViewport('desktop')}
                >
                  <Monitor className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewport === 'tablet' ? 'secondary' : 'ghost'}
                  size="sm"
                  className="rounded-none border-x"
                  onClick={() => setViewport('tablet')}
                >
                  <Tablet className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewport === 'mobile' ? 'secondary' : 'ghost'}
                  size="sm"
                  className="rounded-l-none"
                  onClick={() => setViewport('mobile')}
                >
                  <Smartphone className="h-4 w-4" />
                </Button>
              </div>

              {/* View source toggle */}
              <Button
                variant={showSource ? 'secondary' : 'outline'}
                size="sm"
                onClick={() => setShowSource(!showSource)}
              >
                <Code className="h-4 w-4" />
              </Button>

              {/* Open in new tab */}
              <Button
                variant="outline"
                size="sm"
                onClick={openInNewTab}
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {showSource ? (
            <pre className="bg-muted p-4 rounded-lg overflow-auto max-h-[600px] text-sm">
              <code>{renderedContent}</code>
            </pre>
          ) : (
            <div
              className="bg-white rounded-lg overflow-hidden mx-auto transition-all"
              style={{ maxWidth: viewportSizes[viewport].width }}
            >
              <iframe
                srcDoc={renderedContent}
                className="w-full h-[600px] border-0"
                sandbox="allow-scripts"
                title="Template Preview"
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
