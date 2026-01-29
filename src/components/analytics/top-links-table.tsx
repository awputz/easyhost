'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Link2, Eye, Users } from 'lucide-react'

interface TopLinksTableProps {
  links: {
    id: string
    slug: string
    target: string
    views: number
    unique_visitors: number
  }[]
}

export function TopLinksTable({ links }: TopLinksTableProps) {
  if (links.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Top Links</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            No link data available yet
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Links</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {links.map((link, index) => (
            <div
              key={link.id}
              className="flex items-center gap-4"
            >
              <span className="text-sm text-muted-foreground w-6">
                {index + 1}.
              </span>
              <div className="p-2 rounded-lg bg-primary/10">
                <Link2 className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-mono text-sm font-medium">/e/{link.slug}</p>
                <p className="text-sm text-muted-foreground truncate">
                  {link.target}
                </p>
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Eye className="h-3 w-3" />
                  {link.views.toLocaleString()}
                </span>
                <span className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {link.unique_visitors.toLocaleString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
