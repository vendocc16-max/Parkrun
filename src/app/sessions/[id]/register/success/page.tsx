import Link from 'next/link'

interface Props {
  params: Promise<{ id: string }>
  searchParams: Promise<{ numbers?: string; status?: string }>
}

export const metadata = {
  title: 'Anmälan bekräftad | Parkrun',
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
    <div className="min-h-screen bg-park-cream flex items-center justify-center px-4 py-16">
      <div className="max-w-lg w-full">
        {/* Header */}
        <div className="bg-park-dark px-8 py-10 text-center mb-2">
          <div className="inline-flex h-14 w-14 items-center justify-center bg-park-lime mb-5">
            {isWaitlisted ? (
              <span className="font-display font-black text-park-dark text-xl">VL</span>
            ) : (
              <svg className="h-7 w-7 text-park-dark" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            )}
          </div>
          <h1 className="font-display font-extrabold text-3xl text-park-white uppercase leading-tight mb-2">
            {isWaitlisted ? 'Du är på väntelistan' : 'Du är anmäld'}
          </h1>
          <p className="text-park-muted text-sm">
            {isWaitlisted
              ? 'Vi hör av oss om en plats blir ledig.'
              : 'Bekräftelse skickas till din e-postadress.'}
          </p>
        </div>

        {/* Registration numbers */}
        {registrationNumbers.length > 0 && (
          <div className="bg-park-white border border-park-border px-6 py-5 mb-2">
            <p className="text-xs font-semibold text-park-muted uppercase tracking-wider mb-3">
              {registrationNumbers.length === 1 ? 'Anmälningsnummer' : 'Anmälningsnummer'}
            </p>
            <ul className="space-y-1">
              {registrationNumbers.map((num) => (
                <li key={num} className="font-mono text-xl font-bold text-park-dark tracking-wider">
                  {num}
                </li>
              ))}
            </ul>
            <p className="text-xs text-park-muted mt-4 border-t border-park-border pt-3">
              Ha numret redo på evenemangsdagen.
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-2 mt-2">
          <Link
            href={`/sessions/${slug}`}
            className="flex-1 border border-park-border px-5 py-3 text-center text-sm font-semibold text-park-dark hover:bg-park-white transition-colors"
          >
            Tillbaka till evenemanget
          </Link>
          <Link
            href="/sessions"
            className="flex-1 bg-park-lime px-5 py-3 text-center text-sm font-semibold text-park-dark hover:bg-park-green hover:text-park-white transition-colors"
          >
            Fler evenemang
          </Link>
        </div>
      </div>
    </div>
  )
}
