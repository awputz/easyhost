'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, FileCode, ExternalLink, Copy } from 'lucide-react'
import { toast } from 'sonner'
import { generateSampleData } from '@/lib/templates'
import type { Asset, TemplateVariable } from '@/types'

interface CreateInstanceModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  template: Asset | null
  onInstanceCreated: () => void
}

export function CreateInstanceModal({
  open,
  onOpenChange,
  template,
  onInstanceCreated,
}: CreateInstanceModalProps) {
  const [name, setName] = useState('')
  const [variables, setVariables] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [createdUrl, setCreatedUrl] = useState<string | null>(null)

  const schema = (template?.template_schema || []) as TemplateVariable[]

  // Initialize variables when template changes
  useEffect(() => {
    if (template && schema.length > 0) {
      setVariables(generateSampleData(schema))
      setName('')
      setCreatedUrl(null)
    }
  }, [template, schema])

  const handleCreate = async () => {
    if (!template) return

    setLoading(true)
    try {
      const response = await fetch('/api/templates/instances', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          template_id: template.id,
          name: name || 'Untitled Instance',
          variables,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to create instance')
      }

      const data = await response.json()
      setCreatedUrl(data.instance.public_url)
      toast.success('Instance created!')
      onInstanceCreated()
    } catch {
      toast.error('Failed to create instance')
    } finally {
      setLoading(false)
    }
  }

  const copyUrl = async () => {
    if (!createdUrl) return
    try {
      await navigator.clipboard.writeText(`${window.location.origin}${createdUrl}`)
      toast.success('URL copied!')
    } catch {
      toast.error('Failed to copy URL')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileCode className="h-5 w-5" />
            Create Instance
          </DialogTitle>
          <DialogDescription>
            Create a new instance of {template?.filename} with custom values
          </DialogDescription>
        </DialogHeader>

        {createdUrl ? (
          <div className="space-y-4">
            <div className="rounded-lg border bg-muted/50 p-4 text-center">
              <p className="text-sm text-muted-foreground mb-2">Instance created!</p>
              <p className="font-mono text-sm break-all">{window.location.origin}{createdUrl}</p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={copyUrl}
              >
                <Copy className="h-4 w-4 mr-2" />
                Copy URL
              </Button>
              <Button
                className="flex-1"
                onClick={() => window.open(createdUrl, '_blank')}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Open
              </Button>
            </div>
            <Button
              variant="ghost"
              className="w-full"
              onClick={() => {
                setCreatedUrl(null)
                setName('')
                setVariables(generateSampleData(schema))
              }}
            >
              Create Another
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Instance name */}
            <div className="space-y-2">
              <Label htmlFor="instance-name">Instance Name</Label>
              <Input
                id="instance-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="My Landing Page"
              />
            </div>

            {/* Variables */}
            {schema.length > 0 && (
              <div className="space-y-4">
                <Label>Variables</Label>
                {schema.map((variable) => (
                  <div key={variable.name} className="space-y-2">
                    <Label htmlFor={`var-${variable.name}`} className="text-sm flex items-center gap-2">
                      <span className="font-mono text-muted-foreground">
                        {variable.name}
                      </span>
                      {variable.required && <span className="text-destructive">*</span>}
                    </Label>
                    {variable.type === 'color' ? (
                      <div className="flex gap-2">
                        <Input
                          id={`var-${variable.name}`}
                          type="color"
                          value={variables[variable.name] || '#000000'}
                          onChange={(e) => setVariables({ ...variables, [variable.name]: e.target.value })}
                          className="w-12 p-1 h-9"
                        />
                        <Input
                          value={variables[variable.name] || ''}
                          onChange={(e) => setVariables({ ...variables, [variable.name]: e.target.value })}
                          className="flex-1"
                        />
                      </div>
                    ) : variable.type === 'date' ? (
                      <Input
                        id={`var-${variable.name}`}
                        type="date"
                        value={variables[variable.name] || ''}
                        onChange={(e) => setVariables({ ...variables, [variable.name]: e.target.value })}
                      />
                    ) : variable.type === 'number' ? (
                      <Input
                        id={`var-${variable.name}`}
                        type="number"
                        value={variables[variable.name] || ''}
                        onChange={(e) => setVariables({ ...variables, [variable.name]: e.target.value })}
                      />
                    ) : (
                      <Input
                        id={`var-${variable.name}`}
                        value={variables[variable.name] || ''}
                        onChange={(e) => setVariables({ ...variables, [variable.name]: e.target.value })}
                        placeholder={variable.type === 'url' || variable.type === 'image' ? 'https://...' : undefined}
                      />
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreate}
                disabled={loading}
                className="flex-1"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Instance'
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
