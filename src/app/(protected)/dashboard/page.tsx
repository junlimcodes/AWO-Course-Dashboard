import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { CalendarRange, Users, Briefcase, BookOpen, FolderOpen, ArrowRight } from 'lucide-react'
import { toWeekStartStr, toDayIndex } from '@/lib/date-utils'

export const metadata: Metadata = { title: 'Dashboard' }

function StatCard({
  title,
  value,
  sub,
  dot,
}: {
  title: string
  value: number
  sub?: string
  dot: string
}) {
  return (
    <Card>
      <CardContent className="pt-5 pb-5">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-sm text-muted-foreground font-medium">{title}</p>
            <p className="mt-1.5 text-3xl font-semibold tabular-nums">{value}</p>
            {sub && <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>}
          </div>
          <span className={`mt-1 inline-flex h-2.5 w-2.5 rounded-full shrink-0 ${dot}`} />
        </div>
      </CardContent>
    </Card>
  )
}

const QUICK_LINKS = [
  { href: '/parade-state', icon: CalendarRange, label: 'Parade State', desc: 'Weekly movement forecast' },
  { href: '/directory', icon: Users, label: 'Directory', desc: 'Course member contacts' },
  { href: '/roles', icon: Briefcase, label: 'Roles', desc: 'Course appointments' },
  { href: '/lessons', icon: BookOpen, label: 'Lessons Learned', desc: 'Shared learning gems' },
  { href: '/resources', icon: FolderOpen, label: 'Resources', desc: 'Notes, slides & docs' },
]

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const today = new Date()

  const [{ data: profile }, { data: profiles }, { data: todayStates }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('profiles').select('id'),
    supabase
      .from('parade_state')
      .select('user_id, status')
      .eq('week_start', toWeekStartStr(today))
      .eq('day_of_week', toDayIndex(today)),
  ])

  if (!profile) redirect('/login')

  const totalMembers = profiles?.length ?? 0
  const counts: Record<string, number> = {}
  for (const s of todayStates ?? []) counts[s.status] = (counts[s.status] ?? 0) + 1

  const inCamp = counts['in_camp'] ?? 0
  const outOfCamp = counts['out_of_camp'] ?? 0
  const medical = (counts['rso'] ?? 0) + (counts['rsi'] ?? 0) + (counts['medical_appt'] ?? 0)
  const notUpdated = totalMembers - (todayStates?.length ?? 0)

  const hour = today.getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'
  const displayName = profile.ops_name
    ? `${profile.full_name} (${profile.ops_name})`
    : profile.full_name

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          {greeting}, {displayName}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Here&apos;s a quick overview of the course today.
        </p>
      </div>

      <section className="space-y-3">
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
          Today&apos;s Strength
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard title="In Camp" value={inCamp} dot="bg-emerald-500" />
          <StatCard title="Out of Camp" value={outOfCamp} dot="bg-sky-500" />
          <StatCard title="Medical / RSO" value={medical} sub="RSO / RSI / Appt" dot="bg-amber-500" />
          <StatCard title="Not Updated" value={notUpdated} sub={`of ${totalMembers} total`} dot="bg-zinc-400" />
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
          Quick Access
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {QUICK_LINKS.map(({ href, icon: Icon, label, desc }) => (
            <Link key={href} href={href} className="group">
              <Card className="h-full transition-colors group-hover:bg-accent/50 cursor-pointer">
                <CardContent className="pt-5 pb-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800 group-hover:bg-zinc-200 dark:group-hover:bg-zinc-700 transition-colors">
                        <Icon className="h-4 w-4 text-zinc-600 dark:text-zinc-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium leading-none">{label}</p>
                        <p className="text-xs text-muted-foreground mt-1">{desc}</p>
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground/40 shrink-0 mt-0.5 transition-transform group-hover:translate-x-0.5" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}
