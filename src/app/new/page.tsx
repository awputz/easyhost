'use client'

import Link from 'next/link'

const options = [
  {
    id: 'ai',
    title: 'Create with AI',
    description: 'Describe what you want and watch it build',
    href: '/create',
    label: 'AI',
  },
  {
    id: 'paste',
    title: 'Paste HTML',
    description: 'Paste code from anywhere',
    href: '/new/paste',
    label: 'HTML',
  },
  {
    id: 'url',
    title: 'Import URL',
    description: 'Host any webpage instantly',
    href: '/new/import',
    label: 'URL',
  },
  {
    id: 'upload',
    title: 'Upload files',
    description: 'HTML, PDF, images, anything',
    href: '/new/upload',
    label: 'FILE',
  },
  {
    id: 'blank',
    title: 'Blank page',
    description: 'Start from scratch',
    href: '/dashboard/pages/new',
    label: 'NEW',
  },
]

export default function NewPage() {
  return (
    <div className="min-h-screen bg-cream-50 flex items-center justify-center p-6">
      <div className="max-w-xl w-full">
        {/* Back link */}
        <Link
          href="/dashboard"
          className="inline-block text-sm text-navy-400 hover:text-navy-600 mb-10 transition-colors"
        >
          &larr; Back
        </Link>

        {/* Header */}
        <div className="mb-10">
          <h1 className="font-serif text-3xl font-semibold text-navy-900 mb-2">
            What do you want to host?
          </h1>
          <p className="text-navy-500">
            Create a page, upload a file, or import from anywhere
          </p>
        </div>

        {/* Options */}
        <div className="space-y-3">
          {options.map((option) => (
            <Link
              key={option.id}
              href={option.href}
              className="flex items-center gap-4 p-4 bg-white rounded-lg border border-navy-100 hover:border-navy-200 hover:shadow-sm transition-all group"
            >
              <span className="font-mono text-xs text-navy-400 uppercase tracking-wider w-10">
                {option.label}
              </span>
              <div className="flex-1">
                <h3 className="font-medium text-navy-900 group-hover:text-navy-700 transition-colors">
                  {option.title}
                </h3>
                <p className="text-sm text-navy-500">{option.description}</p>
              </div>
              <span className="text-navy-300 group-hover:text-navy-400 group-hover:translate-x-0.5 transition-all">
                &rarr;
              </span>
            </Link>
          ))}
        </div>

        {/* Tip */}
        <p className="text-center text-navy-400 text-sm mt-10">
          Drag and drop any file anywhere to upload instantly
        </p>
      </div>
    </div>
  )
}
