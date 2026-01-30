'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  FileText,
  FolderOpen,
  BarChart3,
  Settings,
  Plus,
  Link2,
} from 'lucide-react'

interface SidebarProps {
  collapsed?: boolean
  onCollapse?: (collapsed: boolean) => void
}

// Simplified navigation - only 4 main sections
const navigation = [
  { name: 'My Pages', href: '/dashboard', icon: FileText },
  { name: 'My Files', href: '/dashboard/files', icon: FolderOpen },
  { name: 'Analytics', href: '/dashboard/analytics', icon: BarChart3 },
]

export function Sidebar({ collapsed = false, onCollapse }: SidebarProps) {
  const pathname = usePathname()

  return (
    <aside
      className={cn(
        'flex flex-col h-screen border-r border-gray-100 bg-white transition-all duration-300',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Logo */}
      <div className="h-16 flex items-center px-5 border-b border-gray-100">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
            <Link2 className="h-4 w-4 text-white" />
          </div>
          {!collapsed && (
            <span className="font-semibold text-lg text-gray-900">
              Pagelink
            </span>
          )}
        </Link>
      </div>

      {/* Create Button - THE most important action */}
      <div className={cn('p-4', collapsed && 'p-2')}>
        <Link
          href="/new"
          className={cn(
            'flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-medium transition-all',
            collapsed ? 'w-10 h-10' : 'w-full py-3 px-4'
          )}
        >
          <Plus className={cn('flex-shrink-0', collapsed ? 'h-5 w-5' : 'h-4 w-4')} />
          {!collapsed && <span>New</span>}
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-2 space-y-1">
        {navigation.map((item) => {
          const isActive = pathname === item.href ||
            (item.href !== '/dashboard' && pathname.startsWith(item.href))
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all',
                isActive
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-600 hover:bg-gray-50',
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

      {/* Settings at bottom */}
      <div className="p-2 border-t border-gray-100">
        <Link
          href="/dashboard/settings"
          className={cn(
            'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all',
            pathname.startsWith('/dashboard/settings')
              ? 'bg-blue-50 text-blue-600'
              : 'text-gray-600 hover:bg-gray-50',
            collapsed && 'justify-center px-2'
          )}
          title={collapsed ? 'Settings' : undefined}
        >
          <Settings className="h-5 w-5 flex-shrink-0" />
          {!collapsed && <span>Settings</span>}
        </Link>
      </div>

      {/* Usage indicator */}
      {!collapsed && (
        <div className="p-4 border-t border-gray-100">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-400">Pages used</span>
              <span className="text-gray-600 font-medium">0 / 3</span>
            </div>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded-full transition-all duration-500"
                style={{ width: '0%' }}
              />
            </div>
            <p className="text-xs text-gray-400">
              Free plan · <Link href="/pricing" className="text-blue-500 hover:underline">Upgrade</Link>
            </p>
          </div>
        </div>
      )}
    </aside>
  )
}
