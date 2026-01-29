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
import { Loader2, Settings } from 'lucide-react'
import { toast } from 'sonner'
import { VariableSchemaEditor } from './variable-schema-editor'
import type { Asset, TemplateVariable } from '@/types'

interface TemplateSettingsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  template: Asset | null
  onSettingsSaved: () => void
}

export function TemplateSettingsModal({
  open,
  onOpenChange,
  template,
  onSettingsSaved,
}: TemplateSettingsModalProps) {
  const [variables, setVariables] = useState<TemplateVariable[]>([])
  const [loading, setLoading] = useState(false)

  // Initialize variables when template changes
  useEffect(() => {
    if (template) {
      setVariables((template.template_schema as TemplateVariable[]) || [])
    }
  }, [template])

  const handleSave = async () => {
    if (!template) return

    setLoading(true)
    try {
      const response = await fetch(`/api/assets/${template.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          template_schema: variables,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to save settings')
      }

      toast.success('Settings saved!')
      onSettingsSaved()
    } catch {
      toast.error('Failed to save settings')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Template Variables
          </DialogTitle>
          <DialogDescription>
            Configure the variables for {template?.filename}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <VariableSchemaEditor
            variables={variables}
            onChange={setVariables}
          />

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
              onClick={handleSave}
              disabled={loading}
              className="flex-1"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
