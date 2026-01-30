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
  ChevronRight,
  FileText,
  Sparkles,
  Plus,
} from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'

interface SidebarProps {
  collapsed?: boolean
  onCollapse?: (collapsed: boolean) => void
}

const navigation = [
  { name: 'Documents', href: '/dashboard/pages', icon: FileText },
  { name: 'Assets', href: '/dashboard', icon: LayoutDashboard },
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
        'flex flex-col h-screen border-r border-white/5 bg-[#050505] transition-all duration-300',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Logo */}
      <div className="h-20 flex items-center justify-between px-4 border-b border-white/5">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center flex-shrink-0">
            <Sparkles className="h-4 w-4 text-black" />
          </div>
          {!collapsed && (
            <span className="font-semibold text-lg tracking-tight">
              Pagelink
            </span>
          )}
        </Link>
        {onCollapse && (
          <button
            onClick={() => onCollapse(!collapsed)}
            className={cn(
              "w-8 h-8 flex items-center justify-center rounded-lg text-white/40 hover:text-white hover:bg-white/5 transition-all duration-300",
              collapsed && "absolute -right-4 bg-[#050505] border border-white/10"
            )}
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </button>
        )}
      </div>

      {/* Create Button */}
      {!collapsed && (
        <div className="p-4">
          <Link
            href="/create"
            className="flex items-center justify-center gap-2 w-full py-3 bg-white hover:bg-white/90 text-black rounded-xl text-sm font-medium transition-all duration-300"
          >
            <Plus className="h-4 w-4" />
            New Document
          </Link>
        </div>
      )}

      {collapsed && (
        <div className="p-2 flex justify-center">
          <Link
            href="/create"
            className="w-10 h-10 flex items-center justify-center bg-white hover:bg-white/90 text-black rounded-xl transition-all duration-300"
          >
            <Plus className="h-5 w-5" />
          </Link>
        </div>
      )}

      {/* Navigation */}
      <ScrollArea className="flex-1 py-2">
        <nav className="space-y-1 px-2">
          {navigation.map((item) => {
            const isActive = pathname === item.href ||
              (item.href !== '/dashboard' && pathname.startsWith(item.href))
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                  isActive
                    ? 'bg-white/10 text-white'
                    : 'text-white/50 hover:text-white hover:bg-white/5',
                  collapsed && 'justify-center px-2'
                )}
                title={collapsed ? item.name : undefined}
              >
                <item.icon className="h-5 w-5 flex-shrink-0" />
                {!collapsed && <span>{item.name}</span>}
              </Link>
            )
          })}
        </nav>

        <div className="mx-4 my-4 h-px bg-white/5" />

        <nav className="space-y-1 px-2">
          {secondaryNavigation.map((item) => {
            const isActive = pathname.startsWith(item.href)
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                  isActive
                    ? 'bg-white/10 text-white'
                    : 'text-white/50 hover:text-white hover:bg-white/5',
                  collapsed && 'justify-center px-2'
                )}
                title={collapsed ? item.name : undefined}
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
        <div className="p-4 border-t border-white/5">
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-white/40">Documents</span>
              <span className="text-white/70">0 / 3</span>
            </div>
            <div className="h-1 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-white rounded-full transition-all duration-500"
                style={{ width: '0%' }}
              />
            </div>
            <p className="text-xs text-white/30">
              Free plan · <Link href="/pricing" className="text-[#0071e3] hover:underline">Upgrade</Link>
            </p>
          </div>
        </div>
      )}
    </aside>
  )
}
