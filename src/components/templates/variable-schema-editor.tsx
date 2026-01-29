'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Plus, Trash2, GripVertical, Type, Hash, Link2, Calendar, Palette, Image } from 'lucide-react'
import type { TemplateVariable } from '@/types'

interface VariableSchemaEditorProps {
  variables: TemplateVariable[]
  onChange: (variables: TemplateVariable[]) => void
  readOnly?: boolean
}

const variableTypes: { value: TemplateVariable['type']; label: string; icon: React.ReactNode }[] = [
  { value: 'text', label: 'Text', icon: <Type className="h-4 w-4" /> },
  { value: 'number', label: 'Number', icon: <Hash className="h-4 w-4" /> },
  { value: 'url', label: 'URL', icon: <Link2 className="h-4 w-4" /> },
  { value: 'date', label: 'Date', icon: <Calendar className="h-4 w-4" /> },
  { value: 'color', label: 'Color', icon: <Palette className="h-4 w-4" /> },
  { value: 'image', label: 'Image URL', icon: <Image className="h-4 w-4" /> },
]

export function VariableSchemaEditor({
  variables,
  onChange,
  readOnly = false,
}: VariableSchemaEditorProps) {
  const updateVariable = (index: number, updates: Partial<TemplateVariable>) => {
    const newVariables = [...variables]
    newVariables[index] = { ...newVariables[index], ...updates }
    onChange(newVariables)
  }

  const removeVariable = (index: number) => {
    onChange(variables.filter((_, i) => i !== index))
  }

  const addVariable = () => {
    onChange([
      ...variables,
      {
        name: `variable_${variables.length + 1}`,
        type: 'text',
        required: false,
      },
    ])
  }

  const moveVariable = (fromIndex: number, toIndex: number) => {
    const newVariables = [...variables]
    const [moved] = newVariables.splice(fromIndex, 1)
    newVariables.splice(toIndex, 0, moved)
    onChange(newVariables)
  }

  if (variables.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-8 text-center">
          <Type className="h-8 w-8 text-muted-foreground mb-3" />
          <p className="text-muted-foreground mb-4">
            No variables detected in this template
          </p>
          {!readOnly && (
            <Button onClick={addVariable} variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Variable
            </Button>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {variables.map((variable, index) => (
        <Card key={index}>
          <CardContent className="p-4">
            <div className="flex items-start gap-4">
              {/* Drag handle */}
              {!readOnly && (
                <div className="flex items-center h-9 cursor-move text-muted-foreground">
                  <GripVertical className="h-5 w-5" />
                </div>
              )}

              {/* Variable fields */}
              <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Name */}
                <div className="space-y-2">
                  <Label htmlFor={`name-${index}`}>Variable Name</Label>
                  <Input
                    id={`name-${index}`}
                    value={variable.name}
                    onChange={(e) => updateVariable(index, { name: e.target.value.replace(/[^a-zA-Z0-9_]/g, '') })}
                    placeholder="variable_name"
                    disabled={readOnly}
                    className="font-mono"
                  />
                </div>

                {/* Type */}
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select
                    value={variable.type}
                    onValueChange={(value) => updateVariable(index, { type: value as TemplateVariable['type'] })}
                    disabled={readOnly}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {variableTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          <div className="flex items-center gap-2">
                            {type.icon}
                            {type.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Default value */}
                <div className="space-y-2">
                  <Label htmlFor={`default-${index}`}>Default Value</Label>
                  {variable.type === 'color' ? (
                    <div className="flex gap-2">
                      <Input
                        id={`default-${index}`}
                        type="color"
                        value={variable.default || '#000000'}
                        onChange={(e) => updateVariable(index, { default: e.target.value })}
                        disabled={readOnly}
                        className="w-12 p-1 h-9"
                      />
                      <Input
                        value={variable.default || ''}
                        onChange={(e) => updateVariable(index, { default: e.target.value })}
                        placeholder="#000000"
                        disabled={readOnly}
                        className="flex-1"
                      />
                    </div>
                  ) : variable.type === 'date' ? (
                    <Input
                      id={`default-${index}`}
                      type="date"
                      value={variable.default || ''}
                      onChange={(e) => updateVariable(index, { default: e.target.value })}
                      disabled={readOnly}
                    />
                  ) : variable.type === 'number' ? (
                    <Input
                      id={`default-${index}`}
                      type="number"
                      value={variable.default || ''}
                      onChange={(e) => updateVariable(index, { default: e.target.value })}
                      disabled={readOnly}
                    />
                  ) : (
                    <Input
                      id={`default-${index}`}
                      value={variable.default || ''}
                      onChange={(e) => updateVariable(index, { default: e.target.value })}
                      placeholder={variable.type === 'url' ? 'https://...' : 'Default text'}
                      disabled={readOnly}
                    />
                  )}
                </div>

                {/* Required toggle */}
                <div className="space-y-2">
                  <Label>Required</Label>
                  <div className="flex items-center h-9">
                    <Switch
                      checked={variable.required}
                      onCheckedChange={(checked) => updateVariable(index, { required: checked })}
                      disabled={readOnly}
                    />
                    <span className="ml-2 text-sm text-muted-foreground">
                      {variable.required ? 'Yes' : 'No'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Delete button */}
              {!readOnly && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeVariable(index)}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>

            {/* Description */}
            <div className="mt-4">
              <Label htmlFor={`desc-${index}`}>Description (optional)</Label>
              <Input
                id={`desc-${index}`}
                value={variable.description || ''}
                onChange={(e) => updateVariable(index, { description: e.target.value })}
                placeholder="Brief description for this variable"
                disabled={readOnly}
                className="mt-2"
              />
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Add variable button */}
      {!readOnly && (
        <Button onClick={addVariable} variant="outline" className="w-full">
          <Plus className="h-4 w-4 mr-2" />
          Add Variable
        </Button>
      )}
    </div>
  )
}
