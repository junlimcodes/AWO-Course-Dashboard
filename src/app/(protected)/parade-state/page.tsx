import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ParadeGrid } from '@/components/parade-state/parade-grid'
import { toWeekStartStr, parseWeekStart, getMonday } from '@/lib/date-utils'

export const metadata: Metadata = { title: 'Parade State' }

export default async function ParadeStatePage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string }>
}) {
  const { week } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Determine week start — default to current week's Monday
  let weekStart: string
  if (week && /^\d{4}-\d{2}-\d{2}$/.test(week)) {
    // Ensure it's a Monday
    weekStart = toWeekStartStr(parseWeekStart(week))
  } else {
    weekStart = toWeekStartStr(new Date())
  }

  const [{ data: profile }, { data: profiles }, { data: entries }] = await Promise.all([
    supabase.from('profiles').select('is_admin').eq('id', user.id).single(),
    supabase.from('profiles').select('*').order('full_name'),
    supabase
      .from('parade_state')
      .select('*')
      .eq('week_start', weekStart),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Parade State</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Click any cell in your row to update your status. Tap a filled cell to view notes.
        </p>
      </div>

      <ParadeGrid
        profiles={profiles ?? []}
        entries={entries ?? []}
        weekStart={weekStart}
        currentUserId={user.id}
        isAdmin={profile?.is_admin ?? false}
      />
    </div>
  )
}
