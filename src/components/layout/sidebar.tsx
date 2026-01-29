'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  FolderOpen,
  Link2,
  FolderKanban,
  FileCode,
  BarChart3,
  Settings,
  HelpCircle,
  ChevronLeft,
  FileText,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'

interface SidebarProps {
  collapsed?: boolean
  onCollapse?: (collapsed: boolean) => void
}

const navigation = [
  { name: 'Assets', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Pages', href: '/dashboard/pages', icon: FileText },
  { name: 'Folders', href: '/dashboard/folders', icon: FolderOpen },
  { name: 'Links', href: '/dashboard/links', icon: Link2 },
  { name: 'Collections', href: '/dashboard/collections', icon: FolderKanban },
  { name: 'Templates', href: '/dashboard/templates', icon: FileCode },
  { name: 'Analytics', href: '/dashboard/analytics', icon: BarChart3 },
]

const secondaryNavigation = [
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
  { name: 'Help', href: '/dashboard/help', icon: HelpCircle },
]

export function Sidebar({ collapsed = false, onCollapse }: SidebarProps) {
  const pathname = usePathname()

  return (
    <aside
      className={cn(
        'flex flex-col border-r border-sidebar-border bg-sidebar transition-all duration-300',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Logo */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-sidebar-border">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center flex-shrink-0">
            <span className="text-primary-foreground font-bold text-sm">EZ</span>
          </div>
          {!collapsed && (
            <span className="font-semibold text-lg text-sidebar-foreground">
              EZ-Host.ai
            </span>
          )}
        </Link>
        {onCollapse && !collapsed && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-sidebar-foreground"
            onClick={() => onCollapse(true)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 py-4">
        <nav className="space-y-1 px-2">
          {navigation.map((item) => {
            const isActive = pathname === item.href ||
              (item.href !== '/dashboard' && pathname.startsWith(item.href))
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                    : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                )}
              >
                <item.icon className="h-5 w-5 flex-shrink-0" />
                {!collapsed && <span>{item.name}</span>}
              </Link>
            )
          })}
        </nav>

        <Separator className="my-4 mx-2 bg-sidebar-border" />

        <nav className="space-y-1 px-2">
          {secondaryNavigation.map((item) => {
            const isActive = pathname.startsWith(item.href)
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                    : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                )}
              >
                <item.icon className="h-5 w-5 flex-shrink-0" />
                {!collapsed && <span>{item.name}</span>}
              </Link>
            )
          })}
        </nav>
      </ScrollArea>

      {/* Storage indicator */}
      {!collapsed && (
        <div className="p-4 border-t border-sidebar-border">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-sidebar-foreground/70">Storage</span>
              <span className="text-sidebar-foreground">0 / 1 GB</span>
            </div>
            <div className="h-1.5 bg-sidebar-accent rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all"
                style={{ width: '0%' }}
              />
            </div>
            <p className="text-xs text-sidebar-foreground/50">
              Free plan
            </p>
          </div>
        </div>
      )}
    </aside>
  )
}
