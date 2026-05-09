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
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6 lg:px-8">
      <nav className="mb-6 text-sm text-park-muted">
        <Link href={`/sessions/${slug}`} className="transition-colors hover:text-park-dark">
          ← Tillbaka till evenemang
        </Link>
      </nav>

      <h1 className="mb-1 text-3xl font-semibold tracking-tight text-park-dark">
        {isWaitlist ? 'Gå med i väntelistan' : 'Anmäl dig till evenemanget'}
      </h1>
      <p className="mb-2 text-sm font-medium text-park-accent">{session.title}</p>
      <p className="mb-8 text-sm leading-6 text-park-muted">
        Fyll i formuläret för att säkra din plats. Du kan anmäla upp till {5}{' '}
        deltagare per inskick.
      </p>

      <RegistrationForm
        sessionId={session.id}
        sessionSlug={slug}
        isWaitlist={isWaitlist}
      />
    </div>
  )
}
