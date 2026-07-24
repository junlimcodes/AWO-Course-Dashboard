import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { LessonsClient } from './lessons-client'
import { BookOpen } from 'lucide-react'

export const metadata: Metadata = { title: 'Lessons Learned' }

export default async function LessonsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: profile }, { data: lessons }] = await Promise.all([
    supabase.from('profiles').select('is_admin').eq('id', user.id).single(),
    supabase
      .from('lessons')
      .select('*, profiles(*)')
      .order('created_at', { ascending: false }),
  ])

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center shrink-0">
          <BookOpen className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Lessons Learned</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">Share your good gems and key takeaways with the course.</p>
        </div>
      </div>
      <LessonsClient
        lessons={(lessons as any) ?? []}
        currentUserId={user.id}
        isAdmin={profile?.is_admin ?? false}
      />
    </div>
  )
}
