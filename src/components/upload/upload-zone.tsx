'use client'

import { useState, useRef, useCallback } from 'react'
import { Upload, X, FileImage, FileVideo, FileText, File, CheckCircle, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'

interface UploadFile {
  id: string
  file: File
  progress: number
  status: 'pending' | 'uploading' | 'complete' | 'error'
  error?: string
  assetId?: string
}

interface UploadZoneProps {
  onUploadComplete?: (assetIds: string[]) => void
  maxFileSize?: number // in bytes
  maxFiles?: number
  acceptedTypes?: string[]
}

export function UploadZone({
  onUploadComplete,
  maxFileSize = 10 * 1024 * 1024, // 10MB default
  maxFiles = 20,
  acceptedTypes,
}: UploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [files, setFiles] = useState<UploadFile[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }, [])

  const validateFile = (file: File): string | null => {
    if (file.size > maxFileSize) {
      return `File too large. Max size is ${formatBytes(maxFileSize)}`
    }
    if (acceptedTypes && acceptedTypes.length > 0) {
      const isAccepted = acceptedTypes.some((type) => {
        if (type.endsWith('/*')) {
          return file.type.startsWith(type.slice(0, -1))
        }
        return file.type === type
      })
      if (!isAccepted) {
        return 'File type not supported'
      }
    }
    return null
  }

  const addFiles = useCallback((newFiles: FileList | File[]) => {
    const fileArray = Array.from(newFiles)
    const remainingSlots = maxFiles - files.length

    if (remainingSlots <= 0) {
      return
    }

    const filesToAdd = fileArray.slice(0, remainingSlots).map((file) => {
      const error = validateFile(file)
      return {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        file,
        progress: 0,
        status: error ? 'error' : 'pending',
        error,
      } as UploadFile
    })

    setFiles((prev) => [...prev, ...filesToAdd])
  }, [files.length, maxFiles, maxFileSize, acceptedTypes])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const droppedFiles = e.dataTransfer.files
    if (droppedFiles.length > 0) {
      addFiles(droppedFiles)
    }
  }, [addFiles])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files
    if (selectedFiles && selectedFiles.length > 0) {
      addFiles(selectedFiles)
    }
    // Reset input so same file can be selected again
    e.target.value = ''
  }, [addFiles])

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const items = e.clipboardData.items
    const pastedFiles: File[] = []

    for (let i = 0; i < items.length; i++) {
      const item = items[i]
      if (item.kind === 'file') {
        const file = item.getAsFile()
        if (file) {
          pastedFiles.push(file)
        }
      }
    }

    if (pastedFiles.length > 0) {
      addFiles(pastedFiles)
    }
  }, [addFiles])

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id))
  }

  const uploadFiles = async () => {
    const pendingFiles = files.filter((f) => f.status === 'pending')
    if (pendingFiles.length === 0) return

    setIsUploading(true)
    const completedIds: string[] = []

    for (const uploadFile of pendingFiles) {
      setFiles((prev) =>
        prev.map((f) =>
          f.id === uploadFile.id ? { ...f, status: 'uploading' } : f
        )
      )

      try {
        const formData = new FormData()
        formData.append('file', uploadFile.file)

        const response = await fetch('/api/assets/upload', {
          method: 'POST',
          body: formData,
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.message || 'Upload failed')
        }

        const result = await response.json()

        setFiles((prev) =>
          prev.map((f) =>
            f.id === uploadFile.id
              ? { ...f, status: 'complete', progress: 100, assetId: result.id }
              : f
          )
        )
        completedIds.push(result.id)
      } catch (error) {
        setFiles((prev) =>
          prev.map((f) =>
            f.id === uploadFile.id
              ? {
                  ...f,
                  status: 'error',
                  error: error instanceof Error ? error.message : 'Upload failed',
                }
              : f
          )
        )
      }
    }

    setIsUploading(false)

    if (completedIds.length > 0 && onUploadComplete) {
      onUploadComplete(completedIds)
    }
  }

  const clearCompleted = () => {
    setFiles((prev) => prev.filter((f) => f.status !== 'complete'))
  }

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) return FileImage
    if (file.type.startsWith('video/')) return FileVideo
    if (file.type.startsWith('text/') || file.type === 'application/pdf') return FileText
    return File
  }

  const hasFiles = files.length > 0
  const hasPending = files.some((f) => f.status === 'pending')
  const hasCompleted = files.some((f) => f.status === 'complete')

  return (
    <div className="space-y-4" onPaste={handlePaste}>
      {/* Drop zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={cn(
          'relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors',
          isDragging
            ? 'border-primary bg-primary/5'
            : 'border-border hover:border-primary/50 hover:bg-muted/50'
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileSelect}
          className="hidden"
          accept={acceptedTypes?.join(',')}
        />

        <div className="flex flex-col items-center gap-2">
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
            <Upload className="h-6 w-6 text-muted-foreground" />
          </div>
          <div>
            <p className="font-medium">
              {isDragging ? 'Drop files here' : 'Drag and drop files here'}
            </p>
            <p className="text-sm text-muted-foreground">
              or click to browse · Max {formatBytes(maxFileSize)} per file
            </p>
          </div>
        </div>
      </div>

      {/* File list */}
      {hasFiles && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">
              {files.length} file{files.length !== 1 ? 's' : ''} selected
            </p>
            {hasCompleted && (
              <Button variant="ghost" size="sm" onClick={clearCompleted}>
                Clear completed
              </Button>
            )}
          </div>

          <div className="space-y-2 max-h-64 overflow-y-auto">
            {files.map((uploadFile) => {
              const Icon = getFileIcon(uploadFile.file)
              return (
                <div
                  key={uploadFile.id}
                  className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg"
                >
                  <Icon className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {uploadFile.file.name}
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        {formatBytes(uploadFile.file.size)}
                      </span>
                      {uploadFile.status === 'uploading' && (
                        <Progress value={uploadFile.progress} className="h-1 w-20" />
                      )}
                      {uploadFile.status === 'error' && (
                        <span className="text-xs text-destructive">
                          {uploadFile.error}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {uploadFile.status === 'complete' && (
                      <CheckCircle className="h-5 w-5 text-success" />
                    )}
                    {uploadFile.status === 'error' && (
                      <AlertCircle className="h-5 w-5 text-destructive" />
                    )}
                    {(uploadFile.status === 'pending' || uploadFile.status === 'error') && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={(e) => {
                          e.stopPropagation()
                          removeFile(uploadFile.id)
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {hasPending && (
            <Button onClick={uploadFiles} disabled={isUploading} className="w-full">
              {isUploading ? 'Uploading...' : `Upload ${files.filter((f) => f.status === 'pending').length} file${files.filter((f) => f.status === 'pending').length !== 1 ? 's' : ''}`}
            </Button>
          )}
        </div>
      )}
    </div>
  )
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}
