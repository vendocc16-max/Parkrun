import Link from 'next/link'

interface Props {
  params: Promise<{ id: string }>
  searchParams: Promise<{ numbers?: string; status?: string }>
}

export const metadata = {
  title: 'Registration Confirmed | Parkrun',
}

export default async function SuccessPage({ params, searchParams }: Props) {
  const { id: slug } = await params
  const { numbers, status } = await searchParams

  const registrationNumbers = numbers
    ? numbers
        .split(',')
        .map((n) => n.trim())
        .filter(Boolean)
    : []

  const isWaitlisted = status === 'waitlisted'

  return (
    <div className="mx-auto max-w-xl px-4 sm:px-6 lg:px-8 py-16">
      <div className="rounded-lg border border-gray-200 bg-white p-10 shadow-sm text-center">
        <div className="text-5xl mb-4">{isWaitlisted ? '⏳' : '🎉'}</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          {isWaitlisted ? "You're on the waitlist!" : "You're registered!"}
        </h1>
        <p className="text-gray-500 mb-6">
          {isWaitlisted
            ? "We've added you to the waitlist. We'll be in touch if a spot opens up."
            : 'Your registration is confirmed. Check your email for a confirmation message.'}
        </p>

        {registrationNumbers.length > 0 && (
          <div className="rounded-md bg-green-50 border border-green-200 px-6 py-4 mb-6">
            <p className="text-sm font-medium text-green-800 mb-2">
              {registrationNumbers.length === 1
                ? 'Your registration number'
                : 'Your registration numbers'}
            </p>
            <ul className="space-y-1">
              {registrationNumbers.map((num) => (
                <li key={num} className="font-mono text-lg font-bold text-green-900">
                  {num}
                </li>
              ))}
            </ul>
          </div>
        )}

        <p className="text-sm text-gray-400 mb-8">
          Keep your registration number{registrationNumbers.length !== 1 ? 's' : ''} safe — you
          may be asked to present {registrationNumbers.length !== 1 ? 'them' : 'it'} on the day.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href={`/sessions/${slug}`}
            className="rounded-md border border-gray-300 px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Back to session
          </Link>
          <Link
            href="/sessions"
            className="rounded-md bg-green-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-green-800 transition-colors"
          >
            Browse more sessions
          </Link>
        </div>
      </div>
    </div>
  )
}
