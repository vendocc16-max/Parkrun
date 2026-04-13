import { createAdminClient } from '@/lib/supabase/admin'
import type { Session } from '../../../../supabase/types'
import { MessagesClient } from './MessagesClient'

export const metadata = { title: 'Send Message | Parkrun Admin' }

export default async function MessagesPage() {
  const adminClient = createAdminClient()
  const { data: sessions } = await adminClient
    .from('sessions')
    .select('*')
    .order('event_date', { ascending: false })

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Send Message</h1>
        <p className="text-gray-500 mt-1">
          Compose and send messages to session registrants.
        </p>
      </div>
      <MessagesClient sessions={(sessions as Session[]) ?? []} />
    </div>
  )
}
