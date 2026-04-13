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
          <Link href="/admin/sessions" className="text-sm text-gray-500 hover:text-gray-700">
            Sessions
          </Link>
          <span className="text-gray-300">/</span>
          <Link
            href={`/admin/sessions/${id}`}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            {session.title}
          </Link>
          <span className="text-gray-300">/</span>
          <span className="text-sm text-gray-700">Edit</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Edit session</h1>
      </div>

      <EditSessionForm session={session} />
    </div>
  )
}
