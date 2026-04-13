'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

export async function bulkCancelRegistrations(
  registrationIds: string[]
): Promise<{ error?: string; count?: number }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  if (registrationIds.length === 0) return { count: 0 }

  const adminClient = createAdminClient()
  const { error, count } = await adminClient
    .from('registrations')
    .update({ status: 'cancelled' as const, cancelled_at: new Date().toISOString(), waitlist_position: null })
    .in('id', registrationIds)
    .neq('status', 'cancelled')

  if (error) return { error: error.message }

  revalidatePath('/admin/registrations')
  revalidatePath('/admin/sessions')

  return { count: count ?? 0 }
}
