'use client'

import { useRouter } from 'next/navigation'
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Search, Menu, Upload, LogOut, User, Settings, HelpCircle } from 'lucide-react'
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
    <header className="h-20 border-b border-white/5 bg-[#050505] flex items-center justify-between px-6 gap-4">
      {/* Left section */}
      <div className="flex items-center gap-4">
        <button
          className="lg:hidden w-10 h-10 flex items-center justify-center rounded-xl text-white/60 hover:text-white hover:bg-white/5 transition-all duration-300"
          onClick={onMenuClick}
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Search */}
        <div className="relative hidden md:block">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
          <input
            type="search"
            placeholder="Search..."
            className="w-72 h-11 pl-11 pr-4 rounded-xl bg-white/[0.03] border border-white/10 text-sm text-white placeholder:text-white/30 focus:border-white/20 focus:bg-white/[0.05] focus:outline-none transition-all duration-300"
          />
        </div>
      </div>

      {/* Right section */}
      <div className="flex items-center gap-3">
        {/* Upload button */}
        <Button
          variant="secondary"
          size="sm"
          className="hidden sm:flex gap-2"
          onClick={() => router.push('/dashboard')}
        >
          <Upload className="h-4 w-4" />
          Upload
        </Button>
        <button
          className="sm:hidden w-10 h-10 flex items-center justify-center rounded-xl bg-white/10 text-white hover:bg-white/15 transition-all duration-300"
          onClick={() => router.push('/dashboard')}
        >
          <Upload className="h-4 w-4" />
        </button>

        {/* Notifications */}
        <NotificationsDropdown />

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="relative h-10 w-10 rounded-full overflow-hidden ring-2 ring-white/10 hover:ring-white/20 transition-all duration-300">
              <Avatar className="h-10 w-10">
                <AvatarImage src={profile?.avatar_url || undefined} alt={profile?.full_name || 'User'} />
                <AvatarFallback className="bg-white/10 text-white text-sm font-medium">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-56 bg-[#0a0a0a] border-white/10 rounded-xl p-1"
            align="end"
            forceMount
          >
            <DropdownMenuLabel className="font-normal px-3 py-2">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none text-white">
                  {profile?.full_name || profile?.username}
                </p>
                <p className="text-xs leading-none text-white/50">
                  {profile?.email}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-white/5" />
            <DropdownMenuItem
              onClick={() => router.push('/dashboard/settings')}
              className="px-3 py-2 rounded-lg text-white/70 hover:text-white hover:bg-white/5 cursor-pointer"
            >
              <User className="mr-3 h-4 w-4" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => router.push('/dashboard/settings')}
              className="px-3 py-2 rounded-lg text-white/70 hover:text-white hover:bg-white/5 cursor-pointer"
            >
              <Settings className="mr-3 h-4 w-4" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => router.push('/dashboard/help')}
              className="px-3 py-2 rounded-lg text-white/70 hover:text-white hover:bg-white/5 cursor-pointer"
            >
              <HelpCircle className="mr-3 h-4 w-4" />
              Help
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-white/5" />
            <DropdownMenuItem
              onClick={handleSignOut}
              className="px-3 py-2 rounded-lg text-[#ff453a] hover:bg-[#ff453a]/10 cursor-pointer"
            >
              <LogOut className="mr-3 h-4 w-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
