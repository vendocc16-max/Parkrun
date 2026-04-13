'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import type { InsertSession, UpdateSession, SessionStatus } from '../../../../supabase/types'

export type SessionFormData = {
  title: string
  slug: string
  description: string
  location: string
  event_date: string
  registration_opens_at: string
  registration_closes_at: string
  capacity: string
  waitlist_enabled: boolean
  pricing_info: string
  notes: string
  status: SessionStatus
}

async function getAuthUser() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user
}

export async function createSession(
  data: SessionFormData
): Promise<{ error: string } | void> {
  const user = await getAuthUser()
  if (!user) return { error: 'Unauthorized' }

  const adminClient = createAdminClient()

  const { data: existing } = await adminClient
    .from('sessions')
    .select('id')
    .eq('slug', data.slug)
    .maybeSingle()

  if (existing) return { error: 'A session with this slug already exists.' }

  const adminClient2 = createAdminClient()
  const { data: organizer } = await adminClient2
    .from('organizers')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle()

  const insert: InsertSession = {
    title: data.title,
    slug: data.slug,
    description: data.description || null,
    location: data.location || null,
    event_date: data.event_date,
    registration_opens_at: data.registration_opens_at || null,
    registration_closes_at: data.registration_closes_at || null,
    capacity: parseInt(data.capacity, 10),
    waitlist_enabled: data.waitlist_enabled,
    pricing_info: data.pricing_info || null,
    notes: data.notes || null,
    status: data.status,
    created_by: organizer?.id ?? null,
  }

  const { error } = await adminClient.from('sessions').insert(insert)
  if (error) return { error: error.message }

  revalidatePath('/admin/sessions')
  redirect('/admin/sessions')
}

export async function updateSession(
  id: string,
  data: SessionFormData
): Promise<{ error: string } | void> {
  const user = await getAuthUser()
  if (!user) return { error: 'Unauthorized' }

  const adminClient = createAdminClient()

  const { data: slugConflict } = await adminClient
    .from('sessions')
    .select('id')
    .eq('slug', data.slug)
    .neq('id', id)
    .maybeSingle()

  if (slugConflict) return { error: 'Another session with this slug already exists.' }

  const update: UpdateSession = {
    title: data.title,
    slug: data.slug,
    description: data.description || null,
    location: data.location || null,
    event_date: data.event_date,
    registration_opens_at: data.registration_opens_at || null,
    registration_closes_at: data.registration_closes_at || null,
    capacity: parseInt(data.capacity, 10),
    waitlist_enabled: data.waitlist_enabled,
    pricing_info: data.pricing_info || null,
    notes: data.notes || null,
    status: data.status,
  }

  const { error } = await adminClient.from('sessions').update(update).eq('id', id)
  if (error) return { error: error.message }

  revalidatePath('/admin/sessions')
  revalidatePath(`/admin/sessions/${id}`)
  redirect('/admin/sessions')
}
