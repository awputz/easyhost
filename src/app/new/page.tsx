'use client'

import Link from 'next/link'
import { Sparkles, Code, Globe, Upload, FileText, ChevronRight, ArrowLeft } from 'lucide-react'

const options = [
  {
    id: 'ai',
    icon: Sparkles,
    title: 'Create with AI',
    description: 'Describe what you want and watch it build',
    color: 'bg-purple-50 text-purple-600',
    href: '/create',
  },
  {
    id: 'paste',
    icon: Code,
    title: 'Paste HTML',
    description: 'Paste code from anywhere',
    color: 'bg-blue-50 text-blue-600',
    href: '/new/paste',
  },
  {
    id: 'url',
    icon: Globe,
    title: 'Import URL',
    description: 'Host any webpage instantly',
    color: 'bg-green-50 text-green-600',
    href: '/new/import',
  },
  {
    id: 'upload',
    icon: Upload,
    title: 'Upload files',
    description: 'HTML, PDF, images, anything',
    color: 'bg-orange-50 text-orange-600',
    href: '/new/upload',
  },
  {
    id: 'blank',
    icon: FileText,
    title: 'Blank page',
    description: 'Start from scratch',
    color: 'bg-gray-50 text-gray-600',
    href: '/dashboard/pages/new',
  },
]

export default function NewPage() {
  return (
    <div className="min-h-screen bg-[#FAFAF9] flex items-center justify-center p-6">
      <div className="max-w-2xl w-full">
        {/* Back button */}
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to dashboard
        </Link>

        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-3">
            What do you want to host?
          </h1>
          <p className="text-gray-500 text-lg">
            Create a page, upload a file, or import from anywhere
          </p>
        </div>

        {/* Options Grid */}
        <div className="grid gap-4">
          {options.map((option) => (
            <Link
              key={option.id}
              href={option.href}
              className="flex items-center gap-5 p-5 bg-white rounded-2xl border border-gray-100 hover:border-gray-200 hover:shadow-lg transition-all group"
            >
              <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${option.color}`}>
                <option.icon className="w-7 h-7" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 text-lg group-hover:text-blue-600 transition-colors">
                  {option.title}
                </h3>
                <p className="text-gray-500">{option.description}</p>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-gray-400 group-hover:translate-x-1 transition-all" />
            </Link>
          ))}
        </div>

        {/* Quick tip */}
        <p className="text-center text-gray-400 text-sm mt-8">
          Tip: Drag and drop any file anywhere to upload instantly
        </p>
      </div>
    </div>
  )
}
