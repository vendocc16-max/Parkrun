export const metadata = {
  title: 'Användarvillkor | Parkrun Anmälan',
}

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="mb-2 text-4xl font-semibold tracking-tight text-park-dark">
        Användarvillkor
      </h1>
      <p className="mb-10 text-sm text-park-muted">Senast uppdaterad: april 2026</p>

      <div className="max-w-none space-y-8 rounded-lg border border-park-border bg-park-white p-6 text-park-dark shadow-sm sm:p-8">
        <section>
          <h2 className="mb-3 text-lg font-semibold tracking-tight">1. Deltagande</h2>
          <p className="text-park-muted leading-relaxed">
            Genom att anmäla dig till ett Parkrun-evenemang bekräftar du att du och eventuella
            meddeltagare är i tillräckligt god fysisk form för att delta. Deltagande sker på
            egen risk.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold tracking-tight">2. Anmälan</h2>
          <p className="text-park-muted leading-relaxed">
            En anmälan är bindande men kan avbokas fram till 24 timmar före evenemanget.
            Vid avbokning frigörs platsen automatiskt och kan tilldelas nästa person på
            väntelistan.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold tracking-tight">3. Barn</h2>
          <p className="text-park-muted leading-relaxed">
            Den vuxne som anmäler ett barn ansvarar för barnets säkerhet under hela evenemanget.
            Barn under 18 år måste alltid ha en ansvarig vuxen med sig.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold tracking-tight">4. Uppförande</h2>
          <p className="text-park-muted leading-relaxed">
            Vi förväntar oss att alla deltagare uppträder respektfullt mot varandra, volontärer
            och arrangörer. Olämpligt beteende kan leda till avstängning från framtida evenemang.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold tracking-tight">5. Kontakt</h2>
          <p className="text-park-muted leading-relaxed">
            Frågor om dessa villkor skickas till{' '}
            <a href="mailto:ivantruedson@gmail.com" className="text-park-green underline underline-offset-2 transition-colors hover:text-park-dark">
              ivantruedson@gmail.com
            </a>
            .
          </p>
        </section>
      </div>
    </div>
  )
}
