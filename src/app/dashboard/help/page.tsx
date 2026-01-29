'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import {
  HelpCircle,
  Upload,
  Link2,
  FolderKanban,
  Code,
  BarChart3,
  Users,
  Search,
  ExternalLink,
  Keyboard,
  MessageSquare,
  BookOpen,
  Mail,
} from 'lucide-react'

const faqs = [
  {
    question: 'How do I upload files?',
    answer: 'Click the "Upload" button in the top right corner or on the dashboard, then drag and drop files or click to browse. You can upload images, videos, documents, and more. Free plan supports up to 10MB per file.',
  },
  {
    question: 'How do I share an asset?',
    answer: 'Click on any asset to open the preview, then click "Create Link" to generate a shareable URL. You can also right-click an asset and select "Create Link" from the context menu.',
  },
  {
    question: 'What is a short link?',
    answer: 'Short links are clean, memorable URLs (like ez.host/abc123) that redirect to your assets. You can optionally add password protection, expiration dates, and track how many times they\'re accessed.',
  },
  {
    question: 'How do collections work?',
    answer: 'Collections let you group multiple assets together into a shareable portfolio or "deal room". You can customize the layout, add branding, and share the entire collection with a single link.',
  },
  {
    question: 'What are templates?',
    answer: 'Templates are HTML files with {{variable}} placeholders. When you upload an HTML template, you can create multiple instances with different values filled in. Great for personalized proposals, certificates, or dynamic documents.',
  },
  {
    question: 'How do I add team members?',
    answer: 'Go to Settings > Team and click "Invite member". Enter their email address and choose their role (Viewer, Editor, or Admin). They\'ll receive an invitation to join your workspace.',
  },
  {
    question: 'What\'s the difference between viewer, editor, and admin?',
    answer: 'Viewers can only view assets and analytics. Editors can upload, edit, and delete assets but can\'t manage team or settings. Admins have full access including team management and billing.',
  },
  {
    question: 'How do I use a custom domain?',
    answer: 'Go to Settings > Workspace and enter your custom domain. Then create a CNAME record pointing to ez.host. Custom domains are available on Pro and Team plans.',
  },
]

const shortcuts = [
  { keys: ['/', 'Cmd+K'], description: 'Open search' },
  { keys: ['U'], description: 'Upload files' },
  { keys: ['N'], description: 'New folder' },
  { keys: ['G', 'D'], description: 'Go to Dashboard' },
  { keys: ['G', 'L'], description: 'Go to Links' },
  { keys: ['G', 'C'], description: 'Go to Collections' },
  { keys: ['G', 'A'], description: 'Go to Analytics' },
  { keys: ['G', 'S'], description: 'Go to Settings' },
  { keys: ['Esc'], description: 'Close modal / Clear selection' },
  { keys: ['Cmd+A'], description: 'Select all assets' },
  { keys: ['Delete'], description: 'Delete selected' },
]

const guides = [
  {
    title: 'Getting Started',
    description: 'Learn the basics of uploading and sharing assets',
    icon: Upload,
    href: '#',
  },
  {
    title: 'Short Links',
    description: 'Create trackable, password-protected links',
    icon: Link2,
    href: '#',
  },
  {
    title: 'Collections',
    description: 'Group assets into shareable portfolios',
    icon: FolderKanban,
    href: '#',
  },
  {
    title: 'Templates',
    description: 'Create dynamic documents with variables',
    icon: Code,
    href: '#',
  },
  {
    title: 'Analytics',
    description: 'Track views, downloads, and engagement',
    icon: BarChart3,
    href: '#',
  },
  {
    title: 'Team Collaboration',
    description: 'Invite team members and manage permissions',
    icon: Users,
    href: '#',
  },
]

export default function HelpPage() {
  const [searchQuery, setSearchQuery] = useState('')

  const filteredFaqs = faqs.filter(
    (faq) =>
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <HelpCircle className="h-6 w-6" />
          Help Center
        </h1>
        <p className="text-muted-foreground">
          Find answers, learn features, and get support
        </p>
      </div>

      {/* Search */}
      <div className="relative max-w-xl">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search for help..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Quick guides */}
      <section>
        <h2 className="text-lg font-semibold mb-4">Quick Guides</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {guides.map((guide) => (
            <Card key={guide.title} className="hover:border-primary/50 transition-colors cursor-pointer">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <guide.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium mb-1">{guide.title}</h3>
                    <p className="text-sm text-muted-foreground">{guide.description}</p>
                  </div>
                  <ExternalLink className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section>
        <h2 className="text-lg font-semibold mb-4">Frequently Asked Questions</h2>
        <Card>
          <CardContent className="pt-6">
            {filteredFaqs.length > 0 ? (
              <Accordion type="single" collapsible className="w-full">
                {filteredFaqs.map((faq, index) => (
                  <AccordionItem key={index} value={`item-${index}`}>
                    <AccordionTrigger className="text-left">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            ) : (
              <p className="text-muted-foreground text-center py-8">
                No results found for &quot;{searchQuery}&quot;
              </p>
            )}
          </CardContent>
        </Card>
      </section>

      {/* Keyboard shortcuts */}
      <section>
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Keyboard className="h-5 w-5" />
          Keyboard Shortcuts
        </h2>
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {shortcuts.map((shortcut, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between py-2"
                >
                  <span className="text-sm text-muted-foreground">
                    {shortcut.description}
                  </span>
                  <div className="flex items-center gap-1">
                    {shortcut.keys.map((key, i) => (
                      <span key={i} className="flex items-center">
                        {i > 0 && <span className="text-muted-foreground mx-1">+</span>}
                        <Badge variant="secondary" className="font-mono text-xs">
                          {key}
                        </Badge>
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Contact */}
      <section>
        <h2 className="text-lg font-semibold mb-4">Need More Help?</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <BookOpen className="h-5 w-5" />
                Documentation
              </CardTitle>
              <CardDescription>
                Browse our comprehensive docs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full">
                <ExternalLink className="h-4 w-4 mr-2" />
                View docs
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <MessageSquare className="h-5 w-5" />
                Community
              </CardTitle>
              <CardDescription>
                Join our Discord community
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full">
                <ExternalLink className="h-4 w-4 mr-2" />
                Join Discord
              </Button>
            </CardContent>
          </Card>

          <Card className="sm:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Mail className="h-5 w-5" />
                Contact Support
              </CardTitle>
              <CardDescription>
                Get help from our support team
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full sm:w-auto">
                <Mail className="h-4 w-4 mr-2" />
                Email support
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  )
}
