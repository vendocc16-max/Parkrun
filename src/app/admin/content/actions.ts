'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import {
  isSiteContentKey,
  validateSiteContent,
  type SiteContentKey,
  type SiteContentPayload,
} from '@/lib/site-content-schema'
import type { Json, InsertSiteContent } from '../../../../supabase/types'

export async function updateSiteContent(
  key: string,
  payload: SiteContentPayload
): Promise<{ error?: string }> {
  if (!isSiteContentKey(key)) return { error: 'Unknown content area.' }

  const validated = validateSiteContent(key, payload)
  if (validated.error || !validated.data) {
    return { error: validated.error ?? 'Invalid content payload.' }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'Unauthorized' }

  const adminClient = createAdminClient()
  const { data: organizer, error: organizerError } = await adminClient
    .from('organizers')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (organizerError || !organizer) return { error: 'Forbidden: not an organizer.' }

  const upsert: InsertSiteContent = {
    key: key as SiteContentKey,
    payload: validated.data as Json,
    updated_by: organizer.id,
  }

  const { error } = await adminClient.from('site_content').upsert(upsert, {
    onConflict: 'key',
  })

  if (error) return { error: error.message }

  revalidatePath('/admin/content')
  revalidatePath('/')
  revalidatePath('/sessions')
  revalidatePath('/privacy')
  revalidatePath('/terms')

  return {}
}
