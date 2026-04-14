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

        {/* Status header — race-result board style */}
        <div className="bg-park-dark border-b-2 border-park-lime px-8 py-8">
          <p className="font-mono text-park-lime text-xs uppercase tracking-widest mb-3">
            {isWaitlisted ? 'Väntelista' : 'Anmälan bekräftad'}
          </p>
          <h1 className="font-display font-extrabold text-4xl text-park-white uppercase leading-tight">
            {isWaitlisted ? 'Du är på\nväntelistan' : 'Du är\nanmäld'}
          </h1>
          <p className="text-park-muted text-sm mt-3">
            {isWaitlisted
              ? 'Vi hör av oss om en plats blir ledig.'
              : 'Bekräftelse skickas till din e-postadress.'}
          </p>
        </div>

        {/* Registration numbers — race bib style */}
        {registrationNumbers.length > 0 && (
          <div className="bg-park-white border-x border-b border-park-border">
            <div className="border-b border-park-border px-6 py-3">
              <p className="font-mono text-[10px] font-bold text-park-muted uppercase tracking-widest">
                {registrationNumbers.length === 1 ? 'Anmälningsnummer' : 'Anmälningsnummer'}
              </p>
            </div>
            <ul className="divide-y divide-park-border">
              {registrationNumbers.map((num) => (
                <li key={num} className="px-6 py-4">
                  <span className="font-mono text-2xl font-bold text-park-dark tracking-widest">
                    {num}
                  </span>
                </li>
              ))}
            </ul>
            <div className="border-t border-park-border px-6 py-3 bg-park-cream">
              <p className="font-mono text-[10px] text-park-muted uppercase tracking-widest">
                Ha numret redo på evenemangsdagen
              </p>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-0 mt-4">
          <Link
            href={`/sessions/${slug}`}
            className="flex-1 border border-park-border px-5 py-3 text-center text-sm font-semibold text-park-dark hover:bg-park-white transition-colors"
          >
            Tillbaka till evenemanget
          </Link>
          <Link
            href="/sessions"
            className="flex-1 bg-park-lime px-5 py-3 text-center text-sm font-bold uppercase tracking-wide text-park-dark hover:bg-park-green hover:text-park-white transition-colors"
          >
            Fler evenemang
          </Link>
        </div>
      </div>
    </div>
  )
}
