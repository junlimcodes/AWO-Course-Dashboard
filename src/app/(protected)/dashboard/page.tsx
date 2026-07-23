import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardAction } from '@/components/ui/card'
import { CalendarRange, Users, Briefcase, BookOpen, FolderOpen, ArrowRight } from 'lucide-react'
import { toWeekStartStr, toDayIndex } from '@/lib/date-utils'

export const metadata: Metadata = { title: 'Dashboard' }

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const today = new Date()

  const [
    { data: profile },
    { data: profiles },
    { data: todayStates },
    { data: roles },
    { data: latestLessons },
    { data: resources },
  ] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('profiles').select('id, full_name, ops_name'),
    supabase
      .from('parade_state')
      .select('user_id, status')
      .eq('week_start', toWeekStartStr(today))
      .eq('day_of_week', toDayIndex(today)),
    supabase
      .from('course_roles')
      .select('id, title, profiles(ops_name, full_name)')
      .order('sort_order')
      .limit(4),
    supabase
      .from('lessons')
      .select('id, title, profiles(ops_name, full_name)')
      .order('created_at', { ascending: false })
      .limit(1),
    supabase.from('resources').select('id, category'),
  ])

  if (!profile) redirect('/login')

  const totalMembers = profiles?.length ?? 0
  const counts: Record<string, number> = {}
  for (const s of todayStates ?? []) counts[s.status] = (counts[s.status] ?? 0) + 1
  const inCamp = counts['in_camp'] ?? 0
  const outOfCamp = counts['out_of_camp'] ?? 0
  const medical = (counts['rso'] ?? 0) + (counts['rsi'] ?? 0) + (counts['medical_appt'] ?? 0)
  const notUpdated = totalMembers - (todayStates?.length ?? 0)

  const resourceCount = resources?.length ?? 0
  const categoryCount = new Set(resources?.map(r => r.category) ?? []).size

  const sgtHour = parseInt(
    new Intl.DateTimeFormat('en-SG', {
      timeZone: 'Asia/Singapore', hour: 'numeric', hour12: false,
    }).format(today)
  )
  const greeting = sgtHour < 12 ? 'GOOD MORNING' : sgtHour < 18 ? 'GOOD AFTERNOON' : 'GOOD EVENING'

  const dateLabel = today.toLocaleDateString('en-SG', {
    timeZone: 'Asia/Singapore',
    weekday: 'short', day: '2-digit', month: 'short', year: 'numeric',
  }).toUpperCase()

  const weekday = today.toLocaleDateString('en-SG', {
    timeZone: 'Asia/Singapore', weekday: 'long',
  })

  const latestLesson = latestLessons?.[0] ?? null
  const lessonAuthor = latestLesson
    ? ((latestLesson.profiles as { ops_name?: string; full_name?: string } | null)?.ops_name ?? 'UNKNOWN')
    : null

  return (
    <div className="space-y-5">

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-mono tracking-[0.3em] text-blue-500 dark:text-blue-400 mb-1">
            {greeting}
          </p>
          <h1 className="text-3xl font-bold tracking-tight">
            {profile.ops_name || profile.full_name}
          </h1>
          <p className="mt-1 text-[10px] font-mono tracking-[0.2em] text-muted-foreground">
            {dateLabel}
          </p>
        </div>
        <div className="shrink-0 flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[10px] font-mono tracking-[0.15em] text-emerald-600 dark:text-emerald-400">COURSE ACTIVE</span>
        </div>
      </div>

      {/* ── Parade State ── */}
      <Link href="/parade-state" className="group block">
        <Card className="transition-colors group-hover:bg-accent/40 cursor-pointer ring-1 ring-blue-500/20 dark:ring-blue-500/15">
          <CardHeader>
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 dark:bg-blue-500/15">
                <CalendarRange className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-[10px] font-mono tracking-[0.25em] text-blue-500 dark:text-blue-400">
                  PARADE STATE
                </p>
                <CardTitle className="text-sm font-semibold">Daily Strength Report · {weekday}</CardTitle>
              </div>
            </div>
            <CardAction>
              <div className="flex items-center gap-1.5 text-muted-foreground/50 group-hover:text-muted-foreground transition-colors">
                <span className="hidden sm:block text-[10px] font-mono tracking-widest">VIEW FULL</span>
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </div>
            </CardAction>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-2.5">
              {[
                {
                  label: 'IN CAMP',
                  value: inCamp,
                  color: 'text-emerald-600 dark:text-emerald-400',
                  bg: 'bg-emerald-50 dark:bg-emerald-950/50 ring-1 ring-emerald-200/80 dark:ring-emerald-800/40',
                },
                {
                  label: 'OUT OF CAMP',
                  value: outOfCamp,
                  color: 'text-sky-600 dark:text-sky-400',
                  bg: 'bg-sky-50 dark:bg-sky-950/50 ring-1 ring-sky-200/80 dark:ring-sky-800/40',
                },
                {
                  label: 'MEDICAL / RSO',
                  value: medical,
                  color: 'text-amber-600 dark:text-amber-400',
                  bg: 'bg-amber-50 dark:bg-amber-950/50 ring-1 ring-amber-200/80 dark:ring-amber-800/40',
                },
                {
                  label: 'NOT UPDATED',
                  value: notUpdated,
                  color: 'text-rose-600 dark:text-rose-400',
                  bg: 'bg-rose-50 dark:bg-rose-950/50 ring-1 ring-rose-200/80 dark:ring-rose-800/40',
                },
              ].map(({ label, value, color, bg }) => (
                <div key={label} className={`rounded-lg p-3 text-center ${bg}`}>
                  <p className={`text-3xl font-bold font-mono tabular-nums ${color}`}>{value}</p>
                  <p className={`text-[9px] font-mono tracking-[0.1em] mt-1 leading-tight ${color} opacity-70`}>{label}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </Link>

      {/* ── Secondary widgets ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

        {/* Directory */}
        <Link href="/directory" className="group block">
          <Card className="h-full transition-colors group-hover:bg-accent/40 cursor-pointer">
            <CardHeader>
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-500/10 dark:bg-violet-500/15">
                  <Users className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                </div>
                <div>
                  <p className="text-[10px] font-mono tracking-[0.25em] text-violet-500 dark:text-violet-400">DIRECTORY</p>
                  <CardTitle className="text-sm font-semibold">Personnel</CardTitle>
                </div>
              </div>
              <CardAction>
                <ArrowRight className="h-4 w-4 text-muted-foreground/40 mt-1 transition-transform group-hover:translate-x-0.5" />
              </CardAction>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-4xl font-bold font-mono tabular-nums">{totalMembers}</p>
                <p className="text-[10px] font-mono tracking-[0.2em] text-muted-foreground mt-0.5">
                  PERSONNEL ON STRENGTH
                </p>
              </div>
              <div className="flex -space-x-1.5">
                {(profiles ?? []).slice(0, 7).map((p) => (
                  <div
                    key={p.id}
                    className="h-7 w-7 rounded-full bg-violet-100 dark:bg-violet-900/50 border-2 border-card flex items-center justify-center text-[10px] font-bold text-violet-700 dark:text-violet-300 uppercase"
                  >
                    {(p.ops_name || p.full_name || '?')[0]}
                  </div>
                ))}
                {totalMembers > 7 && (
                  <div className="h-7 w-7 rounded-full bg-muted border-2 border-card flex items-center justify-center text-[10px] font-mono font-bold text-muted-foreground">
                    +{totalMembers - 7}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Roles */}
        <Link href="/roles" className="group block">
          <Card className="h-full transition-colors group-hover:bg-accent/40 cursor-pointer">
            <CardHeader>
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 dark:bg-amber-500/15">
                  <Briefcase className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <p className="text-[10px] font-mono tracking-[0.25em] text-amber-500 dark:text-amber-400">ROLES</p>
                  <CardTitle className="text-sm font-semibold">Appointments</CardTitle>
                </div>
              </div>
              <CardAction>
                <ArrowRight className="h-4 w-4 text-muted-foreground/40 mt-1 transition-transform group-hover:translate-x-0.5" />
              </CardAction>
            </CardHeader>
            <CardContent>
              {(roles ?? []).length === 0 ? (
                <p className="text-[10px] font-mono tracking-widest text-muted-foreground">NO ROLES CONFIGURED</p>
              ) : (
                <ul className="space-y-2">
                  {(roles ?? []).map((role) => {
                    const holder = role.profiles as { ops_name?: string; full_name?: string } | null
                    return (
                      <li key={role.id} className="flex items-center justify-between gap-3">
                        <span className="text-[11px] font-mono text-muted-foreground truncate uppercase tracking-wide">
                          {role.title}
                        </span>
                        <span className="text-[11px] font-mono font-semibold shrink-0">
                          {holder
                            ? (holder.ops_name || holder.full_name)
                            : <span className="text-muted-foreground/40">TBC</span>
                          }
                        </span>
                      </li>
                    )
                  })}
                </ul>
              )}
            </CardContent>
          </Card>
        </Link>

        {/* Lessons Learned */}
        <Link href="/lessons" className="group block">
          <Card className="h-full transition-colors group-hover:bg-accent/40 cursor-pointer">
            <CardHeader>
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 dark:bg-emerald-500/15">
                  <BookOpen className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <p className="text-[10px] font-mono tracking-[0.25em] text-emerald-500 dark:text-emerald-400">LESSONS LEARNED</p>
                  <CardTitle className="text-sm font-semibold">Knowledge Base</CardTitle>
                </div>
              </div>
              <CardAction>
                <ArrowRight className="h-4 w-4 text-muted-foreground/40 mt-1 transition-transform group-hover:translate-x-0.5" />
              </CardAction>
            </CardHeader>
            <CardContent>
              {latestLesson ? (
                <div className="space-y-1.5">
                  <p className="text-[10px] font-mono tracking-[0.15em] text-muted-foreground">LATEST GEM</p>
                  <p className="text-sm font-medium line-clamp-2 leading-snug">{latestLesson.title}</p>
                  <p className="text-[10px] font-mono text-muted-foreground">— {lessonAuthor}</p>
                </div>
              ) : (
                <p className="text-[10px] font-mono tracking-widest text-muted-foreground">NO ENTRIES YET</p>
              )}
            </CardContent>
          </Card>
        </Link>

        {/* Resources */}
        <Link href="/resources" className="group block">
          <Card className="h-full transition-colors group-hover:bg-accent/40 cursor-pointer">
            <CardHeader>
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-cyan-500/10 dark:bg-cyan-500/15">
                  <FolderOpen className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
                </div>
                <div>
                  <p className="text-[10px] font-mono tracking-[0.25em] text-cyan-500 dark:text-cyan-400">RESOURCES</p>
                  <CardTitle className="text-sm font-semibold">Files & Docs</CardTitle>
                </div>
              </div>
              <CardAction>
                <ArrowRight className="h-4 w-4 text-muted-foreground/40 mt-1 transition-transform group-hover:translate-x-0.5" />
              </CardAction>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold font-mono tabular-nums">{resourceCount}</p>
              <p className="text-[10px] font-mono tracking-[0.15em] text-muted-foreground mt-0.5">
                {resourceCount === 0
                  ? 'NO FILES UPLOADED'
                  : `${categoryCount} ${categoryCount === 1 ? 'CATEGORY' : 'CATEGORIES'}`}
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  )
}
