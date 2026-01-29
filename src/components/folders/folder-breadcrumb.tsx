'use client'

import { ChevronRight, Home } from 'lucide-react'
import { cn } from '@/lib/utils'

interface BreadcrumbItem {
  id: string | null
  name: string
}

interface FolderBreadcrumbProps {
  items: BreadcrumbItem[]
  onNavigate: (folderId: string | null) => void
}

export function FolderBreadcrumb({ items, onNavigate }: FolderBreadcrumbProps) {
  return (
    <nav className="flex items-center gap-1 text-sm">
      <button
        onClick={() => onNavigate(null)}
        className={cn(
          'flex items-center gap-1 px-2 py-1 rounded hover:bg-muted transition-colors',
          items.length === 0 ? 'text-foreground font-medium' : 'text-muted-foreground'
        )}
      >
        <Home className="h-4 w-4" />
        <span>Assets</span>
      </button>

      {items.map((item, index) => (
        <div key={item.id} className="flex items-center">
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
          <button
            onClick={() => onNavigate(item.id)}
            className={cn(
              'px-2 py-1 rounded hover:bg-muted transition-colors',
              index === items.length - 1
                ? 'text-foreground font-medium'
                : 'text-muted-foreground'
            )}
          >
            {item.name}
          </button>
        </div>
      ))}
    </nav>
  )
}
