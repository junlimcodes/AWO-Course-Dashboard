import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { DirectoryClient } from './directory-client'

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
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Directory</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Course member contact details. Click your own card to edit your info.
        </p>
      </div>
      <DirectoryClient profiles={profiles ?? []} currentUserId={user.id} />
    </div>
  )
}
