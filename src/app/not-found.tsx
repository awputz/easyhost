import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { FileQuestion, Home, Search } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] p-4">
      <div className="max-w-md w-full text-center">
        {/* 404 icon */}
        <div className="w-20 h-20 bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-6">
          <FileQuestion className="w-10 h-10 text-zinc-500" />
        </div>

        {/* Message */}
        <h1 className="text-6xl font-bold text-white mb-4">404</h1>
        <h2 className="text-xl font-semibold text-zinc-300 mb-2">
          Page not found
        </h2>
        <p className="text-zinc-500 mb-8">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/">
            <Button className="bg-blue-600 hover:bg-blue-500 w-full sm:w-auto">
              <Home className="w-4 h-4 mr-2" />
              Go home
            </Button>
          </Link>
          <Link href="/dashboard">
            <Button variant="outline" className="border-zinc-700 w-full sm:w-auto">
              <Search className="w-4 h-4 mr-2" />
              Dashboard
            </Button>
          </Link>
        </div>

        {/* Create document CTA */}
        <div className="mt-12 pt-8 border-t border-zinc-800">
          <p className="text-sm text-zinc-500 mb-4">
            Want to create something?
          </p>
          <Link href="/create">
            <Button variant="ghost" className="text-blue-400 hover:text-blue-300">
              Create a new document →
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
