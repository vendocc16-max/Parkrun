import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { RETENTION } from '@/lib/config/rules'

function verifyCronSecret(request: NextRequest): boolean {
  const auth = request.headers.get('authorization')
  const expected = `Bearer ${process.env.CRON_SECRET}`
  return auth === expected
}

export async function GET(request: NextRequest) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = createAdminClient()
  let cleaned = 0

  // Delete rate limit events older than RETENTION.RATE_LIMIT_EVENTS_DAYS
  const rateLimitCutoff = new Date()
  rateLimitCutoff.setDate(rateLimitCutoff.getDate() - RETENTION.RATE_LIMIT_EVENTS_DAYS)

  const { count: rateLimitCount, error: rateLimitError } = await admin
    .from('rate_limit_events')
    .delete({ count: 'exact' })
    .lt('created_at', rateLimitCutoff.toISOString())

  if (!rateLimitError) {
    cleaned += rateLimitCount ?? 0
  }

  // Delete cancelled registrations older than RETENTION.CANCELLED_REGISTRATIONS_DAYS
  const cancelledCutoff = new Date()
  cancelledCutoff.setDate(cancelledCutoff.getDate() - RETENTION.CANCELLED_REGISTRATIONS_DAYS)

  const { count: cancelledCount, error: cancelledError } = await admin
    .from('registrations')
    .delete({ count: 'exact' })
    .eq('status', 'cancelled')
    .or(
      `cancelled_at.lt.${cancelledCutoff.toISOString()},and(cancelled_at.is.null,created_at.lt.${cancelledCutoff.toISOString()})`,
    )

  if (!cancelledError) {
    cleaned += cancelledCount ?? 0
  }

  return NextResponse.json({ cleaned })
}
