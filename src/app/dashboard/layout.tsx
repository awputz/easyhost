import { DashboardShell } from './dashboard-shell'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // TODO: Add Supabase auth check once environment is configured
  // For now, render dashboard without auth for development
  const mockProfile = {
    id: 'demo',
    username: 'demo',
    email: 'demo@example.com',
    full_name: 'Demo User',
    avatar_url: null,
    plan: 'free' as const,
    plan_expires_at: null,
    storage_used_bytes: 0,
    bandwidth_used_bytes: 0,
    bandwidth_reset_at: new Date().toISOString(),
    settings: {},
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }

  return <DashboardShell profile={mockProfile}>{children}</DashboardShell>
}
