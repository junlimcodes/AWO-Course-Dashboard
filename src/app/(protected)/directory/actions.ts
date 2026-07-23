'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function updateProfile(data: {
  opsName: string
  contactNumber: string
  telegram: string
  whatsapp: string
  email: string
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorised' }

  const { error } = await supabase
    .from('profiles')
    .update({
      ops_name: data.opsName || null,
      contact_number: data.contactNumber || null,
      telegram: data.telegram || null,
      whatsapp: data.whatsapp || null,
      email: data.email || null,
    })
    .eq('id', user.id)

  if (error) return { error: error.message }

  revalidatePath('/directory')
  revalidatePath('/dashboard')
  return { error: null }
}
