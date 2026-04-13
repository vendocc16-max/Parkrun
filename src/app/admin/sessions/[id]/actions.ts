'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

export async function cancelRegistration(
  registrationId: string
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const adminClient = createAdminClient()

  const { data: registration } = await adminClient
    .from('registrations')
    .select('session_id')
    .eq('id', registrationId)
    .maybeSingle()

  if (!registration) return { error: 'Registration not found' }

  const { error } = await adminClient
    .from('registrations')
    .update({ status: 'cancelled', cancelled_at: new Date().toISOString() })
    .eq('id', registrationId)

  if (error) return { error: error.message }

  try {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
    await fetch(`${baseUrl}/api/cron/promote-waitlist`, { method: 'POST' })
  } catch {
    // Non-critical — promotion will run on next scheduled trigger
  }

  revalidatePath(`/admin/sessions/${registration.session_id}`)
  revalidatePath('/admin/sessions')
  revalidatePath('/admin/registrations')

  return {}
}
