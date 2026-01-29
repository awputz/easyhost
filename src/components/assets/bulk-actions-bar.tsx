'use client'

import { X, Trash2, FolderInput, Tag, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

interface BulkActionsBarProps {
  selectedCount: number
  onClearSelection: () => void
  onDelete: () => void
  onMove: () => void
  onTag: () => void
  onDownload: () => void
}

export function BulkActionsBar({
  selectedCount,
  onClearSelection,
  onDelete,
  onMove,
  onTag,
  onDownload,
}: BulkActionsBarProps) {
  if (selectedCount === 0) return null

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
      <div className="flex items-center gap-2 px-4 py-2 bg-card border rounded-lg shadow-lg">
        <span className="text-sm font-medium mr-2">
          {selectedCount} selected
        </span>

        <div className="h-4 w-px bg-border" />

        <Button variant="ghost" size="sm" onClick={onMove}>
          <FolderInput className="h-4 w-4 mr-2" />
          Move
        </Button>

        <Button variant="ghost" size="sm" onClick={onTag}>
          <Tag className="h-4 w-4 mr-2" />
          Tag
        </Button>

        <Button variant="ghost" size="sm" onClick={onDownload}>
          <Download className="h-4 w-4 mr-2" />
          Download
        </Button>

        <div className="h-4 w-px bg-border" />

        <Button
          variant="ghost"
          size="sm"
          onClick={onDelete}
          className="text-destructive hover:text-destructive"
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Delete
        </Button>

        <div className="h-4 w-px bg-border" />

        <Button variant="ghost" size="icon" onClick={onClearSelection}>
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
