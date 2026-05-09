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
    <div className="surface-grid px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-xl rounded-lg border border-park-border bg-park-white p-8 text-center shadow-sm sm:p-10">
        <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-md bg-park-accent-soft">
          <span className="h-2.5 w-2.5 rounded-full bg-park-accent" />
        </div>
        <h1 className="mb-2 text-3xl font-semibold tracking-tight text-park-dark">
          {isWaitlisted ? 'Du står på väntelistan' : 'Din anmälan är klar'}
        </h1>
        <p className="mb-6 text-sm leading-6 text-park-muted">
          {isWaitlisted
            ? 'Vi har lagt till dig på väntelistan och hör av oss om en plats öppnas.'
            : 'Din plats är bekräftad. Kontrollera din e-post för bekräftelsen.'}
        </p>

        {registrationNumbers.length > 0 && (
          <div className="mb-6 rounded-md border border-park-border bg-park-cream px-6 py-4">
            <p className="mb-2 text-sm font-semibold text-park-dark">
              {registrationNumbers.length === 1
                ? 'Ditt registreringsnummer'
                : 'Dina registreringsnummer'}
            </p>
            <ul className="space-y-1">
              {registrationNumbers.map((num) => (
                <li key={num} className="font-mono text-lg font-semibold text-park-green">
                  {num}
                </li>
              ))}
            </ul>
          </div>
        )}

        <p className="mb-8 text-sm leading-6 text-park-muted">
          Spara registreringsnummer{registrationNumbers.length !== 1 ? 'n' : 't'}.
          Du kan behöva visa {registrationNumbers.length !== 1 ? 'dem' : 'det'} på plats.
        </p>

        <div className="flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            href={`/sessions/${slug}`}
            className="rounded-md border border-park-border bg-park-white px-5 py-2.5 text-sm font-semibold text-park-dark shadow-sm transition-[background-color,border-color,color,box-shadow] hover:border-park-green/35 hover:bg-park-lime"
          >
            Till evenemanget
          </Link>
          <Link
            href="/sessions"
            className="rounded-md bg-park-green px-5 py-2.5 text-sm font-semibold text-park-white shadow-sm transition-[background-color,box-shadow] hover:bg-park-dark"
          >
            Fler evenemang
          </Link>
        </div>
      </div>
    </div>
  )
}
