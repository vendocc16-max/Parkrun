import { createAdminClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { EditSessionForm } from './EditSessionForm'

interface Props {
  params: Promise<{ id: string }>
}

export default async function EditSessionPage({ params }: Props) {
  const { id } = await params
  const adminClient = createAdminClient()
  const { data: session } = await adminClient
    .from('sessions')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  if (!session) notFound()

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-1">
          <Link href="/admin/sessions" className="text-sm text-park-muted hover:text-park-dark">
            Sessions
          </Link>
          <span className="text-park-border">/</span>
          <Link
            href={`/admin/sessions/${id}`}
            className="text-sm text-park-muted hover:text-park-dark"
          >
            {session.title}
          </Link>
          <span className="text-park-border">/</span>
          <span className="text-sm text-park-dark">Edit</span>
        </div>
        <h1 className="text-2xl font-semibold text-park-dark">Edit session</h1>
      </div>

      <EditSessionForm session={session} />
    </div>
  )
}
