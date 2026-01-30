'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

interface UploadedFile {
  file: File
  progress: number
  status: 'pending' | 'uploading' | 'done' | 'error'
  url?: string
}

export default function UploadPage() {
  const router = useRouter()
  const [files, setFiles] = useState<UploadedFile[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [uploading, setUploading] = useState(false)

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const droppedFiles = Array.from(e.dataTransfer.files)
    addFiles(droppedFiles)
  }, [])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files)
      addFiles(selectedFiles)
    }
  }, [])

  const addFiles = (newFiles: File[]) => {
    const uploadedFiles: UploadedFile[] = newFiles.map((file) => ({
      file,
      progress: 0,
      status: 'pending',
    }))
    setFiles((prev) => [...prev, ...uploadedFiles])
  }

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
  }

  const getFileType = (file: File) => {
    if (file.type.startsWith('image/')) return 'IMG'
    if (file.type.startsWith('video/')) return 'VID'
    if (file.type === 'text/html') return 'HTML'
    if (file.type === 'application/pdf') return 'PDF'
    return 'FILE'
  }

  const handleUpload = async () => {
    if (files.length === 0) return

    setUploading(true)

    for (let i = 0; i < files.length; i++) {
      if (files[i].status === 'done') continue

      setFiles((prev) =>
        prev.map((f, idx) =>
          idx === i ? { ...f, status: 'uploading', progress: 0 } : f
        )
      )

      try {
        const formData = new FormData()
        formData.append('file', files[i].file)

        const res = await fetch('/api/assets/upload', {
          method: 'POST',
          body: formData,
        })

        if (!res.ok) throw new Error('Upload failed')

        const data = await res.json()

        setFiles((prev) =>
          prev.map((f, idx) =>
            idx === i
              ? { ...f, status: 'done', progress: 100, url: data.url }
              : f
          )
        )
      } catch (error) {
        console.error('Upload error:', error)
        setFiles((prev) =>
          prev.map((f, idx) =>
            idx === i ? { ...f, status: 'error', progress: 0 } : f
          )
        )
      }
    }

    setUploading(false)
    toast.success('Files uploaded')
  }

  const allDone = files.length > 0 && files.every((f) => f.status === 'done')
  const pendingCount = files.filter((f) => f.status === 'pending').length

  return (
    <div className="min-h-screen bg-cream-50">
      <div className="max-w-2xl mx-auto py-12 px-6">
        {/* Back link */}
        <Link
          href="/new"
          className="inline-block text-sm text-navy-400 hover:text-navy-600 mb-10 transition-colors"
        >
          &larr; Back
        </Link>

        <h1 className="font-serif text-2xl font-semibold text-navy-900 mb-2">Upload files</h1>
        <p className="text-navy-500 mb-8">
          Images, PDFs, HTML, videos - we will host anything
        </p>

        {/* Dropzone */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-xl p-12 text-center transition-all cursor-pointer ${
            isDragging
              ? 'border-navy-400 bg-navy-50'
              : 'border-navy-200 hover:border-navy-300 bg-white'
          }`}
        >
          <input
            type="file"
            multiple
            onChange={handleFileSelect}
            className="hidden"
            id="file-input"
          />
          <label htmlFor="file-input" className="cursor-pointer">
            <p className="font-medium text-navy-900 mb-1">
              {isDragging ? 'Drop files here' : 'Drag and drop files here'}
            </p>
            <p className="text-navy-500 text-sm mb-4">or click to browse</p>
            <p className="text-xs text-navy-400">Max 100MB per file</p>
          </label>
        </div>

        {/* File list */}
        {files.length > 0 && (
          <div className="mt-6 space-y-2">
            {files.map((uploadedFile, index) => (
              <div
                key={index}
                className="flex items-center gap-4 p-4 bg-white rounded-lg border border-navy-100"
              >
                <span className="font-mono text-xs text-navy-400 uppercase tracking-wider w-10">
                  {getFileType(uploadedFile.file)}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-navy-900 truncate text-sm">
                    {uploadedFile.file.name}
                  </p>
                  <div className="flex items-center gap-3 text-xs text-navy-400">
                    <span>{formatSize(uploadedFile.file.size)}</span>
                    {uploadedFile.status === 'done' && (
                      <span className="text-green-600">Uploaded</span>
                    )}
                    {uploadedFile.status === 'uploading' && (
                      <span className="text-navy-600">Uploading...</span>
                    )}
                    {uploadedFile.status === 'error' && (
                      <span className="text-red-600">Failed</span>
                    )}
                  </div>
                </div>
                {uploadedFile.status !== 'uploading' && (
                  <button
                    onClick={() => removeFile(index)}
                    className="text-navy-400 hover:text-navy-600 text-sm transition-colors"
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}

            {!allDone && (
              <button
                onClick={handleUpload}
                disabled={uploading || pendingCount === 0}
                className="w-full py-3 bg-navy-800 hover:bg-navy-700 disabled:bg-navy-200 disabled:cursor-not-allowed text-cream-50 rounded-lg font-medium transition-colors"
              >
                {uploading
                  ? 'Uploading...'
                  : `Upload ${pendingCount} file${pendingCount !== 1 ? 's' : ''}`}
              </button>
            )}

            {allDone && (
              <div className="space-y-3">
                <div className="p-4 bg-green-50 rounded-lg text-green-700 text-center text-sm">
                  All files uploaded successfully
                </div>
                <button
                  onClick={() => router.push('/dashboard/files')}
                  className="w-full py-3 bg-navy-800 hover:bg-navy-700 text-cream-50 rounded-lg font-medium transition-colors"
                >
                  View in My Files
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
