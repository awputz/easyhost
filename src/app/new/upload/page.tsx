'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  Upload,
  File,
  Image,
  FileText,
  Film,
  Code,
  X,
  Loader2,
  CheckCircle,
} from 'lucide-react'
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

  const getIcon = (file: File) => {
    if (file.type.startsWith('image/')) return Image
    if (file.type.startsWith('video/')) return Film
    if (file.type === 'text/html') return Code
    if (file.type === 'application/pdf') return FileText
    return File
  }

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
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
    toast.success('Files uploaded successfully!')
  }

  const allDone = files.length > 0 && files.every((f) => f.status === 'done')
  const pendingCount = files.filter((f) => f.status === 'pending').length

  return (
    <div className="min-h-screen bg-[#FAFAF9]">
      <div className="max-w-3xl mx-auto py-12 px-6">
        {/* Back button */}
        <Link
          href="/new"
          className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Link>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">Upload files</h1>
        <p className="text-gray-500 mb-8">
          Images, PDFs, HTML, videos - we'll host anything
        </p>

        {/* Dropzone */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-2xl p-12 text-center transition-all cursor-pointer ${
            isDragging
              ? 'border-blue-400 bg-blue-50'
              : 'border-gray-200 hover:border-gray-300 bg-white'
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
            <Upload
              className={`w-12 h-12 mx-auto mb-4 ${
                isDragging ? 'text-blue-500' : 'text-gray-400'
              }`}
            />
            <p className="text-lg font-medium text-gray-900 mb-2">
              {isDragging ? 'Drop files here' : 'Drag and drop files here'}
            </p>
            <p className="text-gray-500 mb-4">or click to browse</p>
            <p className="text-sm text-gray-400">Max 100MB per file</p>
          </label>
        </div>

        {/* File list */}
        {files.length > 0 && (
          <div className="mt-6 space-y-3">
            {files.map((uploadedFile, index) => {
              const Icon = getIcon(uploadedFile.file)
              return (
                <div
                  key={index}
                  className="flex items-center gap-4 p-4 bg-white rounded-xl border border-gray-100"
                >
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                    <Icon className="w-5 h-5 text-gray-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">
                      {uploadedFile.file.name}
                    </p>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <span>{formatSize(uploadedFile.file.size)}</span>
                      {uploadedFile.status === 'done' && (
                        <span className="flex items-center gap-1 text-green-600">
                          <CheckCircle className="w-3 h-3" />
                          Uploaded
                        </span>
                      )}
                      {uploadedFile.status === 'uploading' && (
                        <span className="flex items-center gap-1 text-blue-600">
                          <Loader2 className="w-3 h-3 animate-spin" />
                          Uploading...
                        </span>
                      )}
                      {uploadedFile.status === 'error' && (
                        <span className="text-red-600">Failed</span>
                      )}
                    </div>
                  </div>
                  {uploadedFile.status !== 'uploading' && (
                    <button
                      onClick={() => removeFile(index)}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <X className="w-4 h-4 text-gray-400" />
                    </button>
                  )}
                </div>
              )
            })}

            {!allDone && (
              <button
                onClick={handleUpload}
                disabled={uploading || pendingCount === 0}
                className="w-full py-4 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  `Upload ${pendingCount} file${pendingCount !== 1 ? 's' : ''}`
                )}
              </button>
            )}

            {allDone && (
              <div className="space-y-3">
                <div className="p-4 bg-green-50 rounded-xl text-green-700 text-center">
                  <CheckCircle className="w-6 h-6 mx-auto mb-2" />
                  All files uploaded successfully!
                </div>
                <button
                  onClick={() => router.push('/dashboard/files')}
                  className="w-full py-4 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-medium transition-colors"
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
