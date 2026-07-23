'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

const INTERNAL_DOMAIN = 'awo-course.app'

async function assertAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorised' }
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()
  if (!profile?.is_admin) return { error: 'Unauthorised' }
  return { error: null }
}

export async function createUser(data: {
  username: string
  password: string
  fullName: string
  opsName: string
  appointment: string
  isAdmin: boolean
}) {
  const { error: authError } = await assertAdmin()
  if (authError) return { error: authError }

  const adminClient = createAdminClient()
  const email = `${data.username.trim().toLowerCase()}@${INTERNAL_DOMAIN}`

  const { error } = await adminClient.auth.admin.createUser({
    email,
    password: data.password,
    email_confirm: true,
    user_metadata: {
      full_name: data.fullName.trim(),
      ops_name: data.opsName.trim() || undefined,
      appointment: data.appointment.trim() || undefined,
      is_admin: data.isAdmin,
    },
  })

  if (error) return { error: error.message }

  revalidatePath('/admin')
  revalidatePath('/directory')
  return { error: null }
}

export async function updateUserAdmin(userId: string, isAdmin: boolean) {
  const { error: authError } = await assertAdmin()
  if (authError) return { error: authError }

  const supabase = await createClient()
  const { error } = await supabase
    .from('profiles')
    .update({ is_admin: isAdmin })
    .eq('id', userId)

  if (error) return { error: error.message }
  revalidatePath('/admin')
  return { error: null }
}

export async function resetPassword(userId: string, newPassword: string) {
  const { error: authError } = await assertAdmin()
  if (authError) return { error: authError }

  const adminClient = createAdminClient()
  const { error } = await adminClient.auth.admin.updateUserById(userId, {
    password: newPassword,
  })

  if (error) return { error: error.message }
  return { error: null }
}
