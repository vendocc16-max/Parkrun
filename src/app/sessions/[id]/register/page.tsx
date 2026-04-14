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
      <nav className="mb-6 text-sm text-park-muted">
        <Link href={`/sessions/${slug}`} className="hover:text-park-dark transition-colors">
          ← Tillbaka till evenemanget
        </Link>
      </nav>

      <h1 className="font-display font-extrabold text-3xl uppercase text-park-dark mb-1">
        {isWaitlist ? 'Gå med i väntelista' : 'Anmäl dig'}
      </h1>
      <p className="text-park-muted mb-2 font-medium text-sm">{session.title}</p>
      <p className="text-park-muted mb-8 text-sm">
        Fyll i formuläret nedan för att säkra din plats. Du kan anmäla upp till 5 deltagare per anmälan.
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
