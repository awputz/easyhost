'use client'

import { useState, useEffect, useRef } from 'react'
import QRCode from 'qrcode'
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
import { Download, Printer, Copy } from 'lucide-react'
import { toast } from 'sonner'
import type { ShortLink } from '@/types'

interface QRCodeModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  link: ShortLink | null
}

export function QRCodeModal({ open, onOpenChange, link }: QRCodeModalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [foreground, setForeground] = useState('#000000')
  const [background, setBackground] = useState('#ffffff')
  const [size, setSize] = useState(256)

  const url = link
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/e/${link.slug}`
    : ''

  useEffect(() => {
    if (!open || !link || !canvasRef.current) return

    QRCode.toCanvas(canvasRef.current, url, {
      width: size,
      margin: 2,
      color: {
        dark: foreground,
        light: background,
      },
    })
  }, [open, link, url, size, foreground, background])

  const downloadQR = () => {
    if (!canvasRef.current) return

    const canvas = canvasRef.current
    const dataUrl = canvas.toDataURL('image/png')
    const a = document.createElement('a')
    a.href = dataUrl
    a.download = `qr-${link?.slug || 'code'}.png`
    a.click()
    toast.success('QR code downloaded!')
  }

  const copyQR = async () => {
    if (!canvasRef.current) return

    try {
      const canvas = canvasRef.current
      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((b) => resolve(b!), 'image/png')
      })
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob }),
      ])
      toast.success('QR code copied to clipboard!')
    } catch {
      toast.error('Failed to copy QR code')
    }
  }

  const printQR = () => {
    if (!canvasRef.current) return

    const dataUrl = canvasRef.current.toDataURL('image/png')
    const printWindow = window.open('', '_blank')
    if (!printWindow) return

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>QR Code - ${link?.slug}</title>
          <style>
            body {
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              margin: 0;
              font-family: system-ui, sans-serif;
            }
            img { max-width: 100%; }
            p { margin-top: 1rem; color: #666; }
          </style>
        </head>
        <body>
          <img src="${dataUrl}" alt="QR Code" />
          <p>${url}</p>
        </body>
      </html>
    `)
    printWindow.document.close()
    printWindow.print()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>QR Code</DialogTitle>
          <DialogDescription>
            Scan this code to access the link
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* QR Code display */}
          <div className="flex justify-center p-4 bg-white rounded-lg">
            <canvas ref={canvasRef} />
          </div>

          {/* URL display */}
          <div className="flex items-center gap-2">
            <Input value={url} readOnly className="font-mono text-sm" />
            <Button
              variant="outline"
              size="icon"
              onClick={() => {
                navigator.clipboard.writeText(url)
                toast.success('URL copied!')
              }}
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>

          {/* Customization */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="qr-size">Size</Label>
              <Input
                id="qr-size"
                type="number"
                value={size}
                onChange={(e) => setSize(parseInt(e.target.value) || 256)}
                min={128}
                max={512}
                step={32}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="qr-fg">Color</Label>
              <Input
                id="qr-fg"
                type="color"
                value={foreground}
                onChange={(e) => setForeground(e.target.value)}
                className="h-9 p-1"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="qr-bg">Background</Label>
              <Input
                id="qr-bg"
                type="color"
                value={background}
                onChange={(e) => setBackground(e.target.value)}
                className="h-9 p-1"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button onClick={downloadQR} className="flex-1">
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
            <Button onClick={copyQR} variant="outline" className="flex-1">
              <Copy className="h-4 w-4 mr-2" />
              Copy
            </Button>
            <Button onClick={printQR} variant="outline" className="flex-1">
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
