'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function saveResourceMeta(data: {
  title: string
  description: string
  category: string
  filePath: string
  fileName: string
  fileSize: number
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorised' }

  const { error } = await supabase.from('resources').insert({
    uploader_id: user.id,
    title: data.title,
    description: data.description || null,
    category: data.category,
    file_url: data.filePath,
    file_name: data.fileName,
    file_size: data.fileSize,
  })

  if (error) return { error: error.message }
  revalidatePath('/resources')
  return { error: null }
}

export async function deleteResource(id: string, filePath: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorised' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  const { data: resource } = await supabase
    .from('resources')
    .select('uploader_id')
    .eq('id', id)
    .single()

  if (!resource) return { error: 'Not found' }
  if (resource.uploader_id !== user.id && !profile?.is_admin) return { error: 'Unauthorised' }

  // Delete from storage
  await supabase.storage.from('resources').remove([filePath])

  // Delete from DB
  const { error } = await supabase.from('resources').delete().eq('id', id)
  if (error) return { error: error.message }

  revalidatePath('/resources')
  return { error: null }
}
