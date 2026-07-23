import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { LessonsClient } from './lessons-client'

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
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Lessons Learned</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Share your good gems and key takeaways with the course.
        </p>
      </div>
      <LessonsClient
        lessons={(lessons as any) ?? []}
        currentUserId={user.id}
        isAdmin={profile?.is_admin ?? false}
      />
    </div>
  )
}
