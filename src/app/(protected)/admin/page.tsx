import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AdminClient } from './admin-client'
import { Settings } from 'lucide-react'

export const metadata: Metadata = { title: 'Admin' }

export default async function AdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: currentProfile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (!currentProfile?.is_admin) redirect('/dashboard')

  const { data: profiles } = await supabase
    .from('profiles')
    .select('*')
    .order('full_name')

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-slate-100 dark:bg-slate-800/60 flex items-center justify-center shrink-0">
          <Settings className="h-5 w-5 text-slate-600 dark:text-slate-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Admin</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">Manage course member accounts and permissions.</p>
        </div>
      </div>
      <AdminClient profiles={profiles ?? []} currentUserId={user.id} />
    </div>
  )
}
