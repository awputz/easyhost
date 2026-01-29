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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { Copy, Check, Image, Code, FileText, Link2 } from 'lucide-react'
import { toast } from 'sonner'
import type { Asset } from '@/types'

interface EmbedCodeModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  asset: Asset | null
}

type EmbedType = 'img' | 'markdown' | 'html' | 'url' | 'react' | 'iframe'

export function EmbedCodeModal({ open, onOpenChange, asset }: EmbedCodeModalProps) {
  const [activeTab, setActiveTab] = useState<EmbedType>('img')
  const [copiedTab, setCopiedTab] = useState<string | null>(null)
  const [width, setWidth] = useState('auto')
  const [height, setHeight] = useState('auto')
  const [useWebP, setUseWebP] = useState(false)
  const [quality, setQuality] = useState('80')
  const [responsive, setResponsive] = useState(true)

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
  const assetUrl = asset ? `${baseUrl}${asset.public_path}` : ''

  // Build URL with transformations
  const buildUrl = (opts: { w?: string; h?: string; f?: string; q?: string } = {}) => {
    if (!asset) return ''
    const params = new URLSearchParams()
    if (opts.w && opts.w !== 'auto') params.set('w', opts.w)
    if (opts.h && opts.h !== 'auto') params.set('h', opts.h)
    if (opts.f) params.set('f', opts.f)
    if (opts.q) params.set('q', opts.q)
    const queryString = params.toString()
    return queryString ? `${assetUrl}?${queryString}` : assetUrl
  }

  const transformedUrl = buildUrl({
    w: width,
    h: height,
    f: useWebP ? 'webp' : undefined,
    q: quality !== '80' ? quality : undefined,
  })

  const isImage = asset?.mime_type.startsWith('image/')
  const isHtml = asset?.mime_type === 'text/html'

  // Generate embed codes
  const embedCodes: Record<EmbedType, string> = {
    url: transformedUrl,
    img: `<img src="${transformedUrl}" alt="${asset?.filename || 'Image'}"${responsive ? ' style="max-width: 100%; height: auto;"' : ''} />`,
    markdown: `![${asset?.filename || 'Image'}](${transformedUrl})`,
    html: `<a href="${assetUrl}" target="_blank" rel="noopener noreferrer">${asset?.filename || 'Download'}</a>`,
    react: `<Image
  src="${transformedUrl}"
  alt="${asset?.filename || 'Image'}"
  width={${width === 'auto' ? '800' : width}}
  height={${height === 'auto' ? '600' : height}}
/>`,
    iframe: `<iframe src="${assetUrl}" width="${width === 'auto' ? '100%' : width}" height="${height === 'auto' ? '600' : height}" frameborder="0"></iframe>`,
  }

  // Generate srcset for responsive images
  const generateSrcset = () => {
    if (!asset || !isImage) return ''
    const widths = [320, 640, 768, 1024, 1280, 1920]
    const srcset = widths.map(w => {
      const url = buildUrl({ w: w.toString(), f: useWebP ? 'webp' : undefined })
      return `${url} ${w}w`
    }).join(',\n  ')

    return `<img
  src="${buildUrl({ w: '800', f: useWebP ? 'webp' : undefined })}"
  srcset="
  ${srcset}"
  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 800px"
  alt="${asset.filename}"
  loading="lazy"
/>`
  }

  const copyToClipboard = async (text: string, tab: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedTab(tab)
      toast.success('Copied to clipboard!')
      setTimeout(() => setCopiedTab(null), 2000)
    } catch {
      toast.error('Failed to copy')
    }
  }

  const CodeBlock = ({ code, tabId }: { code: string; tabId: string }) => (
    <div className="relative">
      <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
        <code className="text-foreground">{code}</code>
      </pre>
      <Button
        size="sm"
        variant="secondary"
        className="absolute top-2 right-2"
        onClick={() => copyToClipboard(code, tabId)}
      >
        {copiedTab === tabId ? (
          <Check className="h-4 w-4" />
        ) : (
          <Copy className="h-4 w-4" />
        )}
      </Button>
    </div>
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Code className="h-5 w-5" />
            Embed Code
          </DialogTitle>
          <DialogDescription>
            Copy embed code for &ldquo;{asset?.filename}&rdquo;
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Transformation options for images */}
          {isImage && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-muted/50 rounded-lg">
              <div className="space-y-2">
                <Label htmlFor="width">Width</Label>
                <Input
                  id="width"
                  value={width}
                  onChange={(e) => setWidth(e.target.value)}
                  placeholder="auto"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="height">Height</Label>
                <Input
                  id="height"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  placeholder="auto"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="quality">Quality</Label>
                <Input
                  id="quality"
                  type="number"
                  min="1"
                  max="100"
                  value={quality}
                  onChange={(e) => setQuality(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>WebP Format</Label>
                <div className="flex items-center h-9">
                  <Switch
                    checked={useWebP}
                    onCheckedChange={setUseWebP}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Embed code tabs */}
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as EmbedType)}>
            <TabsList className="grid grid-cols-3 sm:grid-cols-6 w-full">
              <TabsTrigger value="url" className="gap-1">
                <Link2 className="h-3 w-3" />
                URL
              </TabsTrigger>
              {isImage && (
                <>
                  <TabsTrigger value="img" className="gap-1">
                    <Image className="h-3 w-3" />
                    IMG
                  </TabsTrigger>
                  <TabsTrigger value="markdown" className="gap-1">
                    <FileText className="h-3 w-3" />
                    MD
                  </TabsTrigger>
                </>
              )}
              <TabsTrigger value="html" className="gap-1">
                <Code className="h-3 w-3" />
                HTML
              </TabsTrigger>
              {isImage && (
                <TabsTrigger value="react" className="gap-1">
                  <Code className="h-3 w-3" />
                  React
                </TabsTrigger>
              )}
              {isHtml && (
                <TabsTrigger value="iframe" className="gap-1">
                  <Code className="h-3 w-3" />
                  iFrame
                </TabsTrigger>
              )}
            </TabsList>

            <div className="mt-4 space-y-4">
              <TabsContent value="url">
                <CodeBlock code={embedCodes.url} tabId="url" />
              </TabsContent>

              <TabsContent value="img">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Responsive Image</Label>
                    <Switch
                      checked={responsive}
                      onCheckedChange={setResponsive}
                    />
                  </div>
                  <CodeBlock code={embedCodes.img} tabId="img" />

                  {/* Srcset option */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm text-muted-foreground">
                        Responsive srcset (recommended for performance)
                      </Label>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard(generateSrcset(), 'srcset')}
                      >
                        {copiedTab === 'srcset' ? (
                          <Check className="h-4 w-4 mr-2" />
                        ) : (
                          <Copy className="h-4 w-4 mr-2" />
                        )}
                        Copy srcset
                      </Button>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="markdown">
                <CodeBlock code={embedCodes.markdown} tabId="markdown" />
              </TabsContent>

              <TabsContent value="html">
                <CodeBlock code={embedCodes.html} tabId="html" />
              </TabsContent>

              <TabsContent value="react">
                <CodeBlock code={embedCodes.react} tabId="react" />
                <p className="text-sm text-muted-foreground mt-2">
                  Requires Next.js Image component. Add the domain to next.config.js.
                </p>
              </TabsContent>

              <TabsContent value="iframe">
                <CodeBlock code={embedCodes.iframe} tabId="iframe" />
                <p className="text-sm text-muted-foreground mt-2">
                  Use iframe for embedding HTML pages or documents.
                </p>
              </TabsContent>
            </div>
          </Tabs>

          {/* Preview for images */}
          {isImage && (
            <div className="space-y-2">
              <Label>Preview</Label>
              <div className="border rounded-lg p-4 bg-muted/30 flex items-center justify-center min-h-[200px]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={transformedUrl}
                  alt={asset?.filename || 'Preview'}
                  className="max-w-full max-h-[300px] object-contain"
                />
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
