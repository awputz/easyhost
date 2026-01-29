'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowRight, FileText, Presentation, Mail, FileSpreadsheet, Sparkles } from 'lucide-react'

const examples = [
  { label: 'Pitch Deck', prompt: 'Create a pitch deck for my startup raising seed funding', icon: Presentation },
  { label: 'Investment Memo', prompt: 'Create an investment memorandum for a commercial property', icon: FileSpreadsheet },
  { label: 'Proposal', prompt: 'Create a consulting proposal for a 3-month engagement', icon: FileText },
  { label: 'One-Pager', prompt: 'Create a one-pager explaining my product', icon: Mail },
]

export default function HomePage() {
  const [prompt, setPrompt] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = () => {
    if (!prompt.trim()) return
    setIsLoading(true)
    // Store prompt in sessionStorage and redirect to builder
    sessionStorage.setItem('pagelink_initial_prompt', prompt)
    router.push('/create')
  }

  const handleExample = (examplePrompt: string) => {
    setPrompt(examplePrompt)
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col">
      {/* Header */}
      <header className="border-b border-white/5">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-violet-600 rounded-lg flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <span className="font-semibold text-lg text-white">Pagelink</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-sm text-zinc-400 hover:text-white transition-colors"
            >
              Log in
            </Link>
            <Button asChild size="sm" className="bg-white text-black hover:bg-zinc-200">
              <Link href="/signup">Sign up free</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-20">
        <div className="max-w-3xl mx-auto text-center space-y-8">
          {/* Main Headline */}
          <div className="space-y-4">
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-white">
              Don't send files.
            </h1>
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-zinc-500">
              Send Pagelinks.
            </h1>
          </div>

          <p className="text-xl text-zinc-400 max-w-xl mx-auto">
            Create beautiful documents in seconds with AI.
            <br />
            Share them instantly with a link.
          </p>

          {/* Main Input */}
          <div className="relative max-w-2xl mx-auto mt-12">
            <div className="relative">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="What do you want to create?"
                className="w-full h-36 p-5 pr-16 rounded-2xl bg-zinc-900 border border-zinc-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none text-lg text-white placeholder-zinc-500 transition-all"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleSubmit()
                  }
                }}
              />
              <Button
                size="icon"
                className="absolute bottom-4 right-4 rounded-xl bg-blue-600 hover:bg-blue-500 h-10 w-10"
                onClick={handleSubmit}
                disabled={!prompt.trim() || isLoading}
              >
                <ArrowRight className="h-5 w-5" />
              </Button>
            </div>
            <p className="text-xs text-zinc-600 mt-3">
              Press Enter to send • No signup required to start
            </p>
          </div>

          {/* Example Pills */}
          <div className="pt-8">
            <p className="text-sm text-zinc-600 mb-4">Try an example:</p>
            <div className="flex flex-wrap justify-center gap-3">
              {examples.map((ex) => (
                <button
                  key={ex.label}
                  onClick={() => handleExample(ex.prompt)}
                  className="flex items-center gap-2 px-4 py-2.5 text-sm rounded-full bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-zinc-300 transition-all"
                >
                  <ex.icon className="h-4 w-4 text-zinc-500" />
                  {ex.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Social Proof */}
        <div className="mt-20 text-center">
          <p className="text-sm text-zinc-600 mb-6">Trusted by professionals at</p>
          <div className="flex items-center justify-center gap-8 opacity-40">
            <span className="text-zinc-400 font-medium">Goldman Sachs</span>
            <span className="text-zinc-400 font-medium">CBRE</span>
            <span className="text-zinc-400 font-medium">JLL</span>
            <span className="text-zinc-400 font-medium">Cushman & Wakefield</span>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 py-6">
        <div className="container mx-auto px-4 flex items-center justify-between text-sm text-zinc-600">
          <div>© 2025 Pagelink</div>
          <div className="flex gap-6">
            <Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link>
            <Link href="/templates" className="hover:text-white transition-colors">Templates</Link>
            <Link href="/dashboard" className="hover:text-white transition-colors">Dashboard</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
