'use client'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { UploadZone } from './upload-zone'

interface UploadModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onUploadComplete?: (assetIds: string[]) => void
}

export function UploadModal({ open, onOpenChange, onUploadComplete }: UploadModalProps) {
  const handleUploadComplete = (assetIds: string[]) => {
    onUploadComplete?.(assetIds)
    // Keep modal open so user can see completed uploads
    // They can close it manually
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Upload files</DialogTitle>
          <DialogDescription>
            Drag and drop files or click to browse. Supports images, documents, videos, and more.
          </DialogDescription>
        </DialogHeader>
        <UploadZone onUploadComplete={handleUploadComplete} />
      </DialogContent>
    </Dialog>
  )
}
