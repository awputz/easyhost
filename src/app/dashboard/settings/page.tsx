'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  User,
  Building2,
  Users,
  Palette,
  Save,
  MoreHorizontal,
  UserPlus,
  Shield,
  Trash2,
  HardDrive,
  Gauge,
  Calendar,
  CreditCard,
  Globe,
  ExternalLink,
} from 'lucide-react'
import { toast } from 'sonner'
import { format, parseISO } from 'date-fns'
import { InviteMemberModal } from '@/components/settings/invite-member-modal'
import { BillingTab } from '@/components/settings/billing-tab'
import { CustomDomainSettings } from '@/components/pagelink/custom-domain-settings'
import type { Profile, Workspace, WorkspaceRole } from '@/types'

interface TeamMember {
  workspace_id: string
  user_id: string
  role: WorkspaceRole
  invited_at: string
  joined_at: string | null
  profile: {
    id: string
    username: string
    email: string
    full_name: string | null
    avatar_url: string | null
  }
}

export default function SettingsPage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [workspace, setWorkspace] = useState<Workspace | null>(null)
  const [members, setMembers] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [inviteOpen, setInviteOpen] = useState(false)
  const [domainsOpen, setDomainsOpen] = useState(false)

  // Form state
  const [fullName, setFullName] = useState('')
  const [workspaceName, setWorkspaceName] = useState('')
  const [workspaceSlug, setWorkspaceSlug] = useState('')
  const [customDomain, setCustomDomain] = useState('')
  const [primaryColor, setPrimaryColor] = useState('#3b82f6')

  const fetchSettings = useCallback(async () => {
    try {
      const [settingsRes, teamRes] = await Promise.all([
        fetch('/api/settings'),
        fetch('/api/settings/team'),
      ])

      if (settingsRes.ok) {
        const data = await settingsRes.json()
        setProfile(data.profile)
        setWorkspace(data.workspace)
        setFullName(data.profile?.full_name || '')
        setWorkspaceName(data.workspace?.name || '')
        setWorkspaceSlug(data.workspace?.slug || '')
        setCustomDomain(data.workspace?.custom_domain || '')
        setPrimaryColor(data.workspace?.branding?.primary_color || '#3b82f6')
      }

      if (teamRes.ok) {
        const data = await teamRes.json()
        setMembers(data.members || [])
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error)
      toast.error('Failed to load settings')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSettings()
  }, [fetchSettings])

  const saveProfile = async () => {
    setSaving(true)
    try {
      const response = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profile: { full_name: fullName },
        }),
      })

      if (response.ok) {
        const data = await response.json()
        if (data.profile) setProfile(data.profile)
        toast.success('Profile saved')
      } else {
        toast.error('Failed to save profile')
      }
    } catch (error) {
      console.error('Save profile error:', error)
      toast.error('Failed to save profile')
    } finally {
      setSaving(false)
    }
  }

  const saveWorkspace = async () => {
    setSaving(true)
    try {
      const response = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspace: {
            name: workspaceName,
            slug: workspaceSlug,
            custom_domain: customDomain || null,
            branding: { primary_color: primaryColor },
          },
        }),
      })

      if (response.ok) {
        const data = await response.json()
        if (data.workspace) setWorkspace(data.workspace)
        toast.success('Workspace saved')
      } else {
        toast.error('Failed to save workspace')
      }
    } catch (error) {
      console.error('Save workspace error:', error)
      toast.error('Failed to save workspace')
    } finally {
      setSaving(false)
    }
  }

  const updateMemberRole = async (userId: string, role: WorkspaceRole) => {
    try {
      const response = await fetch(`/api/settings/team/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      })

      if (response.ok) {
        setMembers((prev) =>
          prev.map((m) => (m.user_id === userId ? { ...m, role } : m))
        )
        toast.success('Role updated')
      } else {
        const data = await response.json()
        toast.error(data.error || 'Failed to update role')
      }
    } catch (error) {
      console.error('Update role error:', error)
      toast.error('Failed to update role')
    }
  }

  const removeMember = async (userId: string) => {
    if (!confirm('Are you sure you want to remove this team member?')) return

    try {
      const response = await fetch(`/api/settings/team/${userId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setMembers((prev) => prev.filter((m) => m.user_id !== userId))
        toast.success('Member removed')
      } else {
        const data = await response.json()
        toast.error(data.error || 'Failed to remove member')
      }
    } catch (error) {
      console.error('Remove member error:', error)
      toast.error('Failed to remove member')
    }
  }

  const handleInviteSent = (newMember: TeamMember) => {
    setMembers((prev) => [...prev, newMember])
  }

  if (loading) {
    return <SettingsSkeleton />
  }

  const storageUsedMB = (profile?.storage_used_bytes || 0) / (1024 * 1024)
  const bandwidthUsedMB = (profile?.bandwidth_used_bytes || 0) / (1024 * 1024)
  const storageLimitMB = profile?.plan === 'free' ? 100 : profile?.plan === 'pro' ? 10000 : 100000
  const bandwidthLimitMB = profile?.plan === 'free' ? 1000 : profile?.plan === 'pro' ? 50000 : 500000

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account, workspace, and team settings
        </p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList>
          <TabsTrigger value="profile" className="gap-2">
            <User className="h-4 w-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="workspace" className="gap-2">
            <Building2 className="h-4 w-4" />
            Workspace
          </TabsTrigger>
          <TabsTrigger value="team" className="gap-2">
            <Users className="h-4 w-4" />
            Team
          </TabsTrigger>
          <TabsTrigger value="billing" className="gap-2">
            <CreditCard className="h-4 w-4" />
            Billing
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>
                Update your personal information and preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-6">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={profile?.avatar_url || undefined} />
                  <AvatarFallback className="text-2xl">
                    {fullName
                      ? fullName.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
                      : profile?.username?.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <Button variant="outline" size="sm">
                    Change avatar
                  </Button>
                  <p className="text-xs text-muted-foreground mt-2">
                    JPG, PNG or GIF. Max 2MB.
                  </p>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full name</Label>
                  <Input
                    id="fullName"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Enter your full name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    value={profile?.username || ''}
                    disabled
                    className="bg-muted"
                  />
                  <p className="text-xs text-muted-foreground">
                    Username cannot be changed
                  </p>
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={profile?.email || ''}
                    disabled
                    className="bg-muted"
                  />
                </div>
              </div>

              <Button onClick={saveProfile} disabled={saving}>
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Saving...' : 'Save changes'}
              </Button>
            </CardContent>
          </Card>

          {/* Usage Card */}
          <Card>
            <CardHeader>
              <CardTitle>Usage</CardTitle>
              <CardDescription>
                Your current plan usage and limits
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="capitalize">
                    {profile?.plan} Plan
                  </Badge>
                  {profile?.plan_expires_at && (
                    <span className="text-sm text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Renews {format(parseISO(profile.plan_expires_at), 'MMM d, yyyy')}
                    </span>
                  )}
                </div>
                <Button variant="outline" size="sm">
                  Upgrade
                </Button>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium flex items-center gap-2">
                      <HardDrive className="h-4 w-4" />
                      Storage
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {storageUsedMB.toFixed(1)} MB / {storageLimitMB} MB
                    </span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full"
                      style={{ width: `${Math.min(100, (storageUsedMB / storageLimitMB) * 100)}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium flex items-center gap-2">
                      <Gauge className="h-4 w-4" />
                      Bandwidth (this month)
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {bandwidthUsedMB.toFixed(1)} MB / {bandwidthLimitMB} MB
                    </span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full"
                      style={{ width: `${Math.min(100, (bandwidthUsedMB / bandwidthLimitMB) * 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Workspace Tab */}
        <TabsContent value="workspace" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Workspace Settings</CardTitle>
              <CardDescription>
                Configure your workspace name, URL, and branding
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="workspaceName">Workspace name</Label>
                  <Input
                    id="workspaceName"
                    value={workspaceName}
                    onChange={(e) => setWorkspaceName(e.target.value)}
                    placeholder="My Workspace"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="workspaceSlug">URL slug</Label>
                  <div className="flex items-center">
                    <span className="text-sm text-muted-foreground mr-1">ez.host/</span>
                    <Input
                      id="workspaceSlug"
                      value={workspaceSlug}
                      onChange={(e) => setWorkspaceSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                      placeholder="my-workspace"
                      className="flex-1"
                    />
                  </div>
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="customDomain">Custom domain</Label>
                  <div className="flex gap-2">
                    <Input
                      id="customDomain"
                      value={customDomain}
                      onChange={(e) => setCustomDomain(e.target.value)}
                      placeholder="docs.yourcompany.com"
                      className="flex-1"
                    />
                    <Button
                      variant="outline"
                      onClick={() => setDomainsOpen(true)}
                    >
                      <Globe className="h-4 w-4 mr-2" />
                      Manage Domains
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Use your own domain for documents. Requires DNS configuration.
                  </p>
                </div>
              </div>

              <Button onClick={saveWorkspace} disabled={saving}>
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Saving...' : 'Save changes'}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Branding
              </CardTitle>
              <CardDescription>
                Customize how your workspace appears to visitors
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="primaryColor">Primary color</Label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      id="primaryColor"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="h-10 w-14 rounded border cursor-pointer"
                    />
                    <Input
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      placeholder="#3b82f6"
                      className="flex-1"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Logo</Label>
                  <div className="flex items-center gap-2">
                    <div className="h-10 w-10 rounded border flex items-center justify-center bg-muted">
                      <Building2 className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <Button variant="outline" size="sm">
                      Upload logo
                    </Button>
                  </div>
                </div>
              </div>

              <Button onClick={saveWorkspace} disabled={saving}>
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Saving...' : 'Save branding'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Team Tab */}
        <TabsContent value="team" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Team Members</CardTitle>
                  <CardDescription>
                    Manage who has access to this workspace
                  </CardDescription>
                </div>
                <Button onClick={() => setInviteOpen(true)}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Invite member
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="divide-y">
                {members.map((member) => (
                  <div
                    key={member.user_id}
                    className="flex items-center justify-between py-4 first:pt-0 last:pb-0"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={member.profile.avatar_url || undefined} />
                        <AvatarFallback>
                          {member.profile.full_name
                            ? member.profile.full_name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
                            : member.profile.username?.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">
                          {member.profile.full_name || member.profile.username}
                          {member.user_id === profile?.id && (
                            <span className="text-muted-foreground ml-2">(you)</span>
                          )}
                        </p>
                        <p className="text-sm text-muted-foreground">{member.profile.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Select
                        value={member.role}
                        onValueChange={(value) =>
                          updateMemberRole(member.user_id, value as WorkspaceRole)
                        }
                        disabled={member.user_id === profile?.id}
                      >
                        <SelectTrigger className="w-28">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="viewer">
                            <div className="flex items-center gap-2">
                              <User className="h-3 w-3" />
                              Viewer
                            </div>
                          </SelectItem>
                          <SelectItem value="editor">
                            <div className="flex items-center gap-2">
                              <User className="h-3 w-3" />
                              Editor
                            </div>
                          </SelectItem>
                          <SelectItem value="admin">
                            <div className="flex items-center gap-2">
                              <Shield className="h-3 w-3" />
                              Admin
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>

                      {member.user_id !== profile?.id && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => removeMember(member.user_id)}
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Remove
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Role descriptions */}
          <Card>
            <CardHeader>
              <CardTitle>Role Permissions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 text-sm">
                <div className="flex items-start gap-3">
                  <Badge variant="outline" className="mt-0.5">Viewer</Badge>
                  <p className="text-muted-foreground">
                    Can view assets, collections, and analytics. Cannot upload, edit, or delete.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <Badge variant="outline" className="mt-0.5">Editor</Badge>
                  <p className="text-muted-foreground">
                    Can upload assets, create links and collections, manage templates. Cannot manage team members or settings.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <Badge variant="secondary" className="mt-0.5">Admin</Badge>
                  <p className="text-muted-foreground">
                    Full access including team management, workspace settings, and billing.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Billing Tab */}
        <TabsContent value="billing">
          <BillingTab />
        </TabsContent>
      </Tabs>

      <InviteMemberModal
        open={inviteOpen}
        onOpenChange={setInviteOpen}
        onInviteSent={handleInviteSent}
      />

      <CustomDomainSettings
        isOpen={domainsOpen}
        onClose={() => setDomainsOpen(false)}
        workspaceId={workspace?.id || ''}
      />
    </div>
  )
}

function SettingsSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-8 w-32 mb-2" />
        <Skeleton className="h-4 w-64" />
      </div>
      <Skeleton className="h-10 w-80" />
      <div className="space-y-6">
        <div className="border rounded-lg p-6 space-y-4">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-64" />
          <div className="flex items-center gap-6">
            <Skeleton className="h-20 w-20 rounded-full" />
            <Skeleton className="h-9 w-32" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
