import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { DirectoryClient } from './directory-client'
import { Users } from 'lucide-react'

export const metadata: Metadata = { title: 'Directory' }

export default async function DirectoryPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profiles } = await supabase
    .from('profiles')
    .select('*')
    .order('full_name')

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center shrink-0">
          <Users className="h-5 w-5 text-violet-600 dark:text-violet-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Directory</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">Course member contact details. Click your own card to edit your info.</p>
        </div>
      </div>
      <DirectoryClient profiles={profiles ?? []} currentUserId={user.id} />
    </div>
  )
}
