import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { Session } from '../../../../../supabase/types'
import RegistrationForm from './RegistrationForm'

interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props) {
  const { id: slug } = await params
  const supabase = await createClient()
  const { data } = await supabase.from('sessions').select('title').eq('slug', slug).single()
  const session = data as Pick<Session, 'title'> | null
  return {
    title: session
      ? `Register for ${session.title} | Parkrun`
      : 'Register | Parkrun Registration',
  }
}

export default async function RegisterPage({ params }: Props) {
  const { id: slug } = await params
  const supabase = await createClient()

  const { data, error } = await supabase.from('sessions').select('*').eq('slug', slug).single()
  const session = data as Session | null

  if (error || !session || session.status === 'draft' || session.status === 'cancelled') {
    notFound()
  }

  const now = new Date()
  const eventDate = new Date(session.event_date)
  const isClosed =
    session.status === 'closed' ||
    eventDate <= now ||
    (session.registration_closes_at !== null &&
      new Date(session.registration_closes_at) < now)

  if (isClosed) {
    redirect(`/sessions/${slug}`)
  }

  if (
    session.registration_opens_at !== null &&
    new Date(session.registration_opens_at) > now
  ) {
    redirect(`/sessions/${slug}`)
  }

  if (session.status === 'full' && !session.waitlist_enabled) {
    redirect(`/sessions/${slug}`)
  }

  const isWaitlist = session.status === 'full' && session.waitlist_enabled

  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 py-12">
      <nav className="mb-6 text-sm text-gray-500">
        <Link href={`/sessions/${slug}`} className="hover:text-gray-700 transition-colors">
          ← Back to session
        </Link>
      </nav>

      <h1 className="text-2xl font-bold text-gray-900 mb-1">
        {isWaitlist ? 'Join the waitlist' : 'Register for this session'}
      </h1>
      <p className="text-gray-500 mb-2 font-medium text-sm">{session.title}</p>
      <p className="text-gray-400 mb-8 text-sm">
        Complete the form below to secure your spot. You can register up to{' '}
        {5} participants per submission.
      </p>

      <RegistrationForm
        sessionId={session.id}
        sessionSlug={slug}
        sessionTitle={session.title}
        isWaitlist={isWaitlist}
      />
    </div>
  )
}
