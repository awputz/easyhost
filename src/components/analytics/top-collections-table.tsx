'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FolderKanban, Eye } from 'lucide-react'

interface TopCollectionsTableProps {
  collections: {
    id: string
    name: string
    slug: string
    views: number
    items?: number
  }[]
}

export function TopCollectionsTable({ collections }: TopCollectionsTableProps) {
  if (collections.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Top Collections</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            No collection data available yet
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Collections</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {collections.map((collection, index) => (
            <div
              key={collection.id}
              className="flex items-center gap-4"
            >
              <span className="text-sm text-muted-foreground w-6">
                {index + 1}.
              </span>
              <div className="p-2 rounded-lg bg-purple-500/10">
                <FolderKanban className="h-4 w-4 text-purple-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{collection.name}</p>
                <p className="text-sm text-muted-foreground">
                  /c/{collection.slug}
                  {collection.items !== undefined && ` · ${collection.items} items`}
                </p>
              </div>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Eye className="h-3 w-3" />
                {collection.views.toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
