import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ResourcesClient } from './resources-client'
import { FolderOpen } from 'lucide-react'

export const metadata: Metadata = { title: 'Resources' }

export default async function ResourcesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: profile }, { data: resources }] = await Promise.all([
    supabase.from('profiles').select('is_admin').eq('id', user.id).single(),
    supabase
      .from('resources')
      .select('*, profiles(*)')
      .order('created_at', { ascending: false }),
  ])

  // Generate signed URLs for all files (1-hour expiry)
  const filePaths = (resources ?? []).map((r) => r.file_url)
  const signedUrls: Record<string, string> = {}

  if (filePaths.length > 0) {
    const { data: signed } = await supabase.storage
      .from('resources')
      .createSignedUrls(filePaths, 3600)

    if (signed) {
      for (const item of signed) {
        if (item.signedUrl && item.path) {
          signedUrls[item.path] = item.signedUrl
        }
      }
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-sky-100 dark:bg-sky-900/40 flex items-center justify-center shrink-0">
          <FolderOpen className="h-5 w-5 text-sky-600 dark:text-sky-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Resources</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">Course notes, slides, and reference documents.</p>
        </div>
      </div>
      <ResourcesClient
        resources={(resources as any) ?? []}
        signedUrls={signedUrls}
        currentUserId={user.id}
        isAdmin={profile?.is_admin ?? false}
      />
    </div>
  )
}
