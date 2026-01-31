'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

interface SidebarProps {
  collapsed?: boolean
  onCollapse?: (collapsed: boolean) => void
}

// Simplified navigation - only 4 main sections
const navigation = [
  { name: 'Pages', href: '/dashboard' },
  { name: 'Files', href: '/dashboard/files' },
  { name: 'Analytics', href: '/dashboard/analytics' },
]

export function Sidebar({ collapsed = false, onCollapse }: SidebarProps) {
  const pathname = usePathname()

  return (
    <aside
      className={cn(
        'flex flex-col h-screen border-r border-navy-100 bg-cream-50 transition-all duration-300',
        collapsed ? 'w-16' : 'w-56'
      )}
    >
      {/* Logo */}
      <div className="h-16 flex items-center px-5 border-b border-navy-100">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <span className="font-serif text-xl font-semibold text-navy-900 tracking-tight">
            {collapsed ? 'P' : 'Pagelink'}
          </span>
        </Link>
      </div>

      {/* Create Button */}
      <div className={cn('p-4', collapsed && 'p-2')}>
        <Link
          href="/create"
          className={cn(
            'flex items-center justify-center gap-2 bg-navy-800 hover:bg-navy-700 text-cream-50 font-medium transition-all',
            collapsed ? 'w-10 h-10 rounded-lg text-lg' : 'w-full py-2.5 px-4 rounded-lg text-sm'
          )}
        >
          {collapsed ? '+' : '+ New Document'}
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 space-y-0.5">
        {navigation.map((item) => {
          const isActive = pathname === item.href ||
            (item.href !== '/dashboard' && pathname.startsWith(item.href))
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center px-3 py-2 rounded-md text-sm transition-all',
                isActive
                  ? 'bg-navy-800 text-cream-50 font-medium'
                  : 'text-navy-600 hover:text-navy-900 hover:bg-navy-50',
                collapsed && 'justify-center px-2'
              )}
              title={collapsed ? item.name : undefined}
            >
              {collapsed ? item.name[0] : item.name}
            </Link>
          )
        })}
      </nav>

      {/* Settings at bottom */}
      <div className="px-3 pb-2 border-t border-navy-100 pt-2">
        <Link
          href="/dashboard/settings"
          className={cn(
            'flex items-center px-3 py-2 rounded-md text-sm transition-all',
            pathname.startsWith('/dashboard/settings')
              ? 'bg-navy-800 text-cream-50 font-medium'
              : 'text-navy-600 hover:text-navy-900 hover:bg-navy-50',
            collapsed && 'justify-center px-2'
          )}
          title={collapsed ? 'Settings' : undefined}
        >
          {collapsed ? 'S' : 'Settings'}
        </Link>
      </div>

      {/* Usage indicator */}
      {!collapsed && (
        <div className="p-4 border-t border-navy-100">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs text-navy-400 uppercase tracking-wider">Usage</span>
              <span className="font-mono text-xs text-navy-600">0/3</span>
            </div>
            <div className="h-1 bg-navy-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-navy-600 rounded-full transition-all duration-500"
                style={{ width: '0%' }}
              />
            </div>
            <p className="text-xs text-navy-400">
              <Link href="/pricing" className="text-navy-600 hover:text-navy-800 transition-colors">
                Upgrade to Pro
              </Link>
            </p>
          </div>
        </div>
      )}
    </aside>
  )
}
