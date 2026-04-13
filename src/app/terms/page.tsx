export const metadata = {
  title: 'Användarvillkor | Parkrun Anmälan',
}

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 py-16">
      <h1 className="font-display font-extrabold text-4xl uppercase text-park-dark mb-2">
        Användarvillkor
      </h1>
      <p className="text-park-muted text-sm mb-10">Senast uppdaterad: april 2026</p>

      <div className="prose prose-sm max-w-none space-y-8 text-park-dark">
        <section>
          <h2 className="font-display font-bold text-xl uppercase mb-3">1. Deltagande</h2>
          <p className="text-park-muted leading-relaxed">
            Genom att anmäla dig till ett Parkrun-evenemang bekräftar du att du och eventuella
            meddeltagare är i tillräckligt god fysisk form för att delta. Deltagande sker på
            egen risk.
          </p>
        </section>

        <section>
          <h2 className="font-display font-bold text-xl uppercase mb-3">2. Anmälan</h2>
          <p className="text-park-muted leading-relaxed">
            En anmälan är bindande men kan avbokas fram till 24 timmar före evenemanget.
            Vid avbokning frigörs platsen automatiskt och kan tilldelas nästa person på
            väntelistan.
          </p>
        </section>

        <section>
          <h2 className="font-display font-bold text-xl uppercase mb-3">3. Barn</h2>
          <p className="text-park-muted leading-relaxed">
            Den vuxne som anmäler ett barn ansvarar för barnets säkerhet under hela evenemanget.
            Barn under 18 år måste alltid ha en ansvarig vuxen med sig.
          </p>
        </section>

        <section>
          <h2 className="font-display font-bold text-xl uppercase mb-3">4. Uppförande</h2>
          <p className="text-park-muted leading-relaxed">
            Vi förväntar oss att alla deltagare uppträder respektfullt mot varandra, volontärer
            och arrangörer. Olämpligt beteende kan leda till avstängning från framtida evenemang.
          </p>
        </section>

        <section>
          <h2 className="font-display font-bold text-xl uppercase mb-3">5. Kontakt</h2>
          <p className="text-park-muted leading-relaxed">
            Frågor om dessa villkor skickas till{' '}
            <a href="mailto:hello@parkrun-registration.example.com" className="text-park-green underline">
              hello@parkrun-registration.example.com
            </a>
            .
          </p>
        </section>
      </div>
    </div>
  )
}
