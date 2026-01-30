'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ScrollArea } from '@/components/ui/scroll-area'
import { formatDistanceToNow, parseISO } from 'date-fns'
import { cn } from '@/lib/utils'

interface Notification {
  id: string
  type: string
  title: string
  description: string
  created_at: string
  read: boolean
}

export function NotificationsDropdown() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchNotifications = useCallback(async () => {
    try {
      setError(null)
      const response = await fetch('/api/notifications?limit=10')
      if (response.ok) {
        const data = await response.json()
        setNotifications(data.notifications || [])
        setUnreadCount(data.unread_count || 0)
      } else {
        setError('Failed to load')
      }
    } catch (err) {
      console.error('Failed to fetch notifications:', err)
      setError('Failed to load')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
    setUnreadCount(0)
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'view':
        return 'VIEW'
      case 'download':
        return 'DL'
      case 'embed_load':
        return 'EMBED'
      case 'member_joined':
        return 'TEAM'
      case 'link_expired':
        return 'LINK'
      default:
        return 'INFO'
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="relative w-10 h-10 flex items-center justify-center rounded-lg text-navy-500 hover:text-navy-700 hover:bg-navy-50 transition-colors">
          <span className="text-lg">&#128276;</span>
          {unreadCount > 0 && (
            <span className="absolute top-2 right-2 w-2 h-2 bg-navy-800 rounded-full" />
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 bg-white border-navy-100 rounded-lg">
        <div className="flex items-center justify-between px-4 py-3 border-b border-navy-100">
          <h4 className="font-medium text-navy-900">Notifications</h4>
          {unreadCount > 0 && (
            <button
              className="text-xs text-navy-500 hover:text-navy-700 transition-colors"
              onClick={markAllAsRead}
            >
              Mark all read
            </button>
          )}
        </div>

        <ScrollArea className="h-[300px]">
          {loading ? (
            <div className="p-4 text-center text-navy-400 text-sm">
              Loading...
            </div>
          ) : error ? (
            <div className="p-4 text-center text-navy-400 text-sm">
              {error}
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-sm text-navy-400">No notifications yet</p>
            </div>
          ) : (
            <div className="divide-y divide-navy-100">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={cn(
                    'flex items-start gap-3 p-4 hover:bg-navy-50 transition-colors cursor-pointer',
                    !notification.read && 'bg-navy-50/50'
                  )}
                >
                  <span className="font-mono text-xs text-navy-400 uppercase tracking-wider w-10 flex-shrink-0 pt-0.5">
                    {getTypeLabel(notification.type)}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-navy-900">{notification.title}</p>
                    <p className="text-xs text-navy-500 truncate">
                      {notification.description}
                    </p>
                    <p className="text-xs text-navy-400 mt-1">
                      {formatDistanceToNow(parseISO(notification.created_at), {
                        addSuffix: true,
                      })}
                    </p>
                  </div>
                  {!notification.read && (
                    <div className="w-2 h-2 bg-navy-600 rounded-full mt-2 flex-shrink-0" />
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        <div className="border-t border-navy-100 p-2">
          <button className="w-full py-2 text-sm text-navy-600 hover:text-navy-900 hover:bg-navy-50 rounded-md transition-colors">
            View all activity
          </button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
