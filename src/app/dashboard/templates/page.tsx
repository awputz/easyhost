'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Search,
  FileCode,
  Plus,
  MoreHorizontal,
  Eye,
  Copy,
  ExternalLink,
  Trash2,
  Settings,
  Layers,
} from 'lucide-react'
import { toast } from 'sonner'
import { CreateInstanceModal } from '@/components/templates/create-instance-modal'
import { TemplateSettingsModal } from '@/components/templates/template-settings-modal'
import type { Asset, TemplateVariable } from '@/types'

interface Template extends Asset {
  template_schema: TemplateVariable[] | null
  _count?: { instances: number }
}

interface TemplateInstance {
  id: string
  template_id: string
  name: string
  variables: Record<string, string>
  public_url: string
  created_at: string
}

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([])
  const [instances, setInstances] = useState<TemplateInstance[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null)
  const [createInstanceOpen, setCreateInstanceOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)

  const fetchTemplates = useCallback(async () => {
    try {
      const response = await fetch('/api/templates')
      if (response.ok) {
        const data = await response.json()
        setTemplates(data.templates || [])
      }
    } catch (error) {
      console.error('Failed to fetch templates:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchInstances = useCallback(async () => {
    try {
      const response = await fetch('/api/templates/instances')
      if (response.ok) {
        const data = await response.json()
        setInstances(data.instances || [])
      }
    } catch (error) {
      console.error('Failed to fetch instances:', error)
    }
  }, [])

  useEffect(() => {
    fetchTemplates()
    fetchInstances()
  }, [fetchTemplates, fetchInstances])

  const handleDeleteInstance = async (instance: TemplateInstance) => {
    if (!confirm('Are you sure you want to delete this instance?')) return

    try {
      const response = await fetch(`/api/templates/instances/${instance.id}`, {
        method: 'DELETE',
      })
      if (response.ok) {
        toast.success('Instance deleted')
        fetchInstances()
      }
    } catch {
      toast.error('Failed to delete instance')
    }
  }

  const handleCopyUrl = async (url: string) => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}${url}`)
      toast.success('URL copied!')
    } catch {
      toast.error('Failed to copy URL')
    }
  }

  const handleCreateInstance = (template: Template) => {
    setSelectedTemplate(template)
    setCreateInstanceOpen(true)
  }

  const handleEditSettings = (template: Template) => {
    setSelectedTemplate(template)
    setSettingsOpen(true)
  }

  const filteredTemplates = templates.filter((t) =>
    t.filename.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const getInstancesForTemplate = (templateId: string) =>
    instances.filter((i) => i.template_id === templateId)

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Templates</h1>
          <p className="text-muted-foreground">
            Manage HTML templates with dynamic variables
          </p>
        </div>
      </div>

      {/* Search */}
      {(templates.length > 0 || searchQuery) && (
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredTemplates.length > 0 ? (
        <div className="space-y-8">
          {filteredTemplates.map((template) => {
            const templateInstances = getInstancesForTemplate(template.id)

            return (
              <Card key={template.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <FileCode className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{template.filename}</CardTitle>
                        <CardDescription className="flex items-center gap-2">
                          <Badge variant="secondary">
                            {template.template_schema?.length || 0} variables
                          </Badge>
                          <span>•</span>
                          <span>{templateInstances.length} instances</span>
                        </CardDescription>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleCreateInstance(template)}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        New Instance
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => window.open(template.public_path, '_blank')}>
                            <Eye className="mr-2 h-4 w-4" />
                            Preview Template
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEditSettings(template)}>
                            <Settings className="mr-2 h-4 w-4" />
                            Edit Variables
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleCopyUrl(template.public_path)}>
                            <Copy className="mr-2 h-4 w-4" />
                            Copy URL
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardHeader>

                {templateInstances.length > 0 && (
                  <CardContent>
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <Layers className="h-4 w-4" />
                        Instances
                      </h4>
                      <div className="divide-y rounded-md border">
                        {templateInstances.map((instance) => (
                          <div
                            key={instance.id}
                            className="flex items-center justify-between px-4 py-3"
                          >
                            <div className="min-w-0 flex-1">
                              <p className="font-medium truncate">{instance.name}</p>
                              <p className="text-sm text-muted-foreground font-mono truncate">
                                {instance.public_url}
                              </p>
                            </div>
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleCopyUrl(instance.public_url)}
                              >
                                <Copy className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => window.open(instance.public_url, '_blank')}
                              >
                                <ExternalLink className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteInstance(instance)}
                                className="text-muted-foreground hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                )}
              </Card>
            )
          })}
        </div>
      ) : searchQuery ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <Search className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No results found</h3>
            <p className="text-muted-foreground">
              No templates match &ldquo;{searchQuery}&rdquo;
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
              <FileCode className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No templates yet</h3>
            <p className="text-muted-foreground mb-6 max-w-md">
              Upload an HTML file with {`{{variable}}`} placeholders to create a template.
              Templates let you generate dynamic pages with different content.
            </p>
            <p className="text-sm text-muted-foreground">
              Go to Assets and upload an HTML file to get started
            </p>
          </CardContent>
        </Card>
      )}

      {/* Modals */}
      <CreateInstanceModal
        open={createInstanceOpen}
        onOpenChange={setCreateInstanceOpen}
        template={selectedTemplate}
        onInstanceCreated={() => {
          fetchInstances()
          setCreateInstanceOpen(false)
        }}
      />

      <TemplateSettingsModal
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        template={selectedTemplate}
        onSettingsSaved={() => {
          fetchTemplates()
          setSettingsOpen(false)
        }}
      />
    </div>
  )
}
