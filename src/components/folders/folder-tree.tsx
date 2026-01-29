'use client'

import { useState } from 'react'
import { ChevronRight, Folder, FolderOpen, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

export interface FolderItem {
  id: string
  name: string
  path: string
  parent_id: string | null
  color: string | null
  asset_count?: number
  children?: FolderItem[]
}

interface FolderTreeProps {
  folders: FolderItem[]
  selectedFolderId?: string | null
  onSelectFolder: (folderId: string | null) => void
  onCreateFolder?: (parentId: string | null) => void
}

export function FolderTree({
  folders,
  selectedFolderId,
  onSelectFolder,
  onCreateFolder,
}: FolderTreeProps) {
  // Build tree structure from flat list
  const buildTree = (items: FolderItem[], parentId: string | null = null): FolderItem[] => {
    return items
      .filter((item) => item.parent_id === parentId)
      .map((item) => ({
        ...item,
        children: buildTree(items, item.id),
      }))
  }

  const tree = buildTree(folders)

  return (
    <div className="space-y-1">
      {/* All Assets */}
      <button
        onClick={() => onSelectFolder(null)}
        className={cn(
          'w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors',
          selectedFolderId === null
            ? 'bg-sidebar-accent text-sidebar-accent-foreground'
            : 'text-sidebar-foreground hover:bg-sidebar-accent/50'
        )}
      >
        <Folder className="h-4 w-4" />
        <span>All Assets</span>
      </button>

      {/* Folder tree */}
      {tree.map((folder) => (
        <FolderTreeItem
          key={folder.id}
          folder={folder}
          depth={0}
          selectedFolderId={selectedFolderId}
          onSelectFolder={onSelectFolder}
        />
      ))}

      {/* Create folder button */}
      {onCreateFolder && (
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-muted-foreground hover:text-foreground"
          onClick={() => onCreateFolder(null)}
        >
          <Plus className="h-4 w-4 mr-2" />
          New folder
        </Button>
      )}
    </div>
  )
}

interface FolderTreeItemProps {
  folder: FolderItem
  depth: number
  selectedFolderId?: string | null
  onSelectFolder: (folderId: string | null) => void
}

function FolderTreeItem({
  folder,
  depth,
  selectedFolderId,
  onSelectFolder,
}: FolderTreeItemProps) {
  const [expanded, setExpanded] = useState(false)
  const hasChildren = folder.children && folder.children.length > 0
  const isSelected = selectedFolderId === folder.id

  const Icon = expanded ? FolderOpen : Folder

  return (
    <div>
      <button
        onClick={() => onSelectFolder(folder.id)}
        className={cn(
          'w-full flex items-center gap-1 px-2 py-1.5 rounded-md text-sm transition-colors',
          isSelected
            ? 'bg-sidebar-accent text-sidebar-accent-foreground'
            : 'text-sidebar-foreground hover:bg-sidebar-accent/50'
        )}
        style={{ paddingLeft: `${(depth * 12) + 8}px` }}
      >
        {hasChildren ? (
          <button
            onClick={(e) => {
              e.stopPropagation()
              setExpanded(!expanded)
            }}
            className="p-0.5 hover:bg-sidebar-accent rounded"
          >
            <ChevronRight
              className={cn(
                'h-3 w-3 transition-transform',
                expanded && 'rotate-90'
              )}
            />
          </button>
        ) : (
          <span className="w-4" />
        )}
        <Icon
          className="h-4 w-4 flex-shrink-0"
          style={{ color: folder.color || undefined }}
        />
        <span className="truncate flex-1 text-left">{folder.name}</span>
        {folder.asset_count !== undefined && folder.asset_count > 0 && (
          <span className="text-xs text-muted-foreground">{folder.asset_count}</span>
        )}
      </button>

      {/* Children */}
      {hasChildren && expanded && (
        <div>
          {folder.children!.map((child) => (
            <FolderTreeItem
              key={child.id}
              folder={child}
              depth={depth + 1}
              selectedFolderId={selectedFolderId}
              onSelectFolder={onSelectFolder}
            />
          ))}
        </div>
      )}
    </div>
  )
}
