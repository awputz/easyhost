'use client'

import { useRouter } from 'next/navigation'
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { NotificationsDropdown } from '@/components/layout/notifications-dropdown'
import type { Profile } from '@/types'

interface HeaderProps {
  profile: Profile | null
  onMenuClick?: () => void
}

export function Header({ profile, onMenuClick }: HeaderProps) {
  const router = useRouter()

  const handleSignOut = async () => {
    if (isSupabaseConfigured()) {
      const supabase = createClient()
      if (supabase) {
        await supabase.auth.signOut()
      }
    }
    router.push('/login')
    router.refresh()
  }

  const initials = profile?.full_name
    ? profile.full_name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : profile?.username?.slice(0, 2).toUpperCase() || '??'

  return (
    <header className="h-16 border-b border-navy-100 bg-cream-50 flex items-center justify-between px-6 gap-4">
      {/* Left section */}
      <div className="flex items-center gap-4">
        <button
          className="lg:hidden w-10 h-10 flex items-center justify-center rounded-lg text-navy-500 hover:text-navy-700 hover:bg-navy-50 transition-colors"
          onClick={onMenuClick}
        >
          <span className="text-xl">&equiv;</span>
        </button>

        {/* Search */}
        <div className="relative hidden md:block">
          <input
            type="search"
            placeholder="Search..."
            className="w-64 h-10 pl-4 pr-4 rounded-lg bg-white border border-navy-100 text-sm text-navy-800 placeholder:text-navy-300 focus:border-navy-200 focus:outline-none focus:ring-2 focus:ring-navy-200 transition-all"
          />
        </div>
      </div>

      {/* Right section */}
      <div className="flex items-center gap-3">
        {/* Upload button */}
        <button
          className="hidden sm:flex items-center gap-2 px-4 py-2 bg-navy-800 hover:bg-navy-700 text-cream-50 rounded-lg text-sm font-medium transition-colors"
          onClick={() => router.push('/new/upload')}
        >
          Upload
        </button>
        <button
          className="sm:hidden w-10 h-10 flex items-center justify-center rounded-lg bg-navy-800 text-cream-50 hover:bg-navy-700 transition-colors"
          onClick={() => router.push('/new/upload')}
        >
          +
        </button>

        {/* Notifications */}
        <NotificationsDropdown />

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="relative h-9 w-9 rounded-full overflow-hidden ring-2 ring-navy-100 hover:ring-navy-200 transition-all">
              <Avatar className="h-9 w-9">
                <AvatarImage src={profile?.avatar_url || undefined} alt={profile?.full_name || 'User'} />
                <AvatarFallback className="bg-navy-100 text-navy-700 text-sm font-medium">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-52 bg-white border-navy-100 rounded-lg p-1"
            align="end"
            forceMount
          >
            <DropdownMenuLabel className="font-normal px-3 py-2">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none text-navy-900">
                  {profile?.full_name || profile?.username}
                </p>
                <p className="text-xs leading-none text-navy-400">
                  {profile?.email}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-navy-100" />
            <DropdownMenuItem
              onClick={() => router.push('/dashboard/settings')}
              className="px-3 py-2 rounded-md text-navy-600 hover:text-navy-900 hover:bg-navy-50 cursor-pointer text-sm"
            >
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => router.push('/dashboard/settings')}
              className="px-3 py-2 rounded-md text-navy-600 hover:text-navy-900 hover:bg-navy-50 cursor-pointer text-sm"
            >
              Settings
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => router.push('/dashboard/help')}
              className="px-3 py-2 rounded-md text-navy-600 hover:text-navy-900 hover:bg-navy-50 cursor-pointer text-sm"
            >
              Help
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-navy-100" />
            <DropdownMenuItem
              onClick={handleSignOut}
              className="px-3 py-2 rounded-md text-red-600 hover:bg-red-50 cursor-pointer text-sm"
            >
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
