export const metadata = {
  title: 'Integritetspolicy | Parkrun Anmälan',
}

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="mb-2 text-4xl font-semibold tracking-tight text-park-dark">
        Integritetspolicy
      </h1>
      <p className="mb-10 text-sm text-park-muted">Senast uppdaterad: april 2026</p>

      <div className="max-w-none space-y-8 rounded-lg border border-park-border bg-park-white p-6 text-park-dark shadow-sm sm:p-8">
        <section>
          <h2 className="mb-3 text-lg font-semibold tracking-tight">1. Personuppgifter vi samlar in</h2>
          <p className="text-park-muted leading-relaxed">
            Vid anmälan samlar vi in namn, e-postadress, telefonnummer (frivilligt) samt
            eventuella medicinska uppgifter som du väljer att uppge. Vi registrerar också
            IP-adress och tidpunkt för samtycke.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold tracking-tight">2. Hur vi använder uppgifterna</h2>
          <p className="text-park-muted leading-relaxed">
            Dina uppgifter används enbart för att hantera din anmälan, skicka bekräftelse-
            och påminnelsemail samt administrera evenemanget. Vi delar aldrig dina uppgifter
            med tredje part i marknadsföringssyfte.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold tracking-tight">3. Lagring och radering</h2>
          <p className="text-park-muted leading-relaxed">
            Dina uppgifter sparas i upp till 90 dagar efter evenemanget och raderas därefter
            automatiskt. Du kan när som helst begära radering av dina uppgifter genom att
            kontakta oss.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold tracking-tight">4. Dina rättigheter</h2>
          <p className="text-park-muted leading-relaxed">
            Enligt GDPR har du rätt att begära ut, korrigera eller radera dina personuppgifter.
            Du har också rätt att invända mot behandling och begära begränsning av behandlingen.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold tracking-tight">5. Kontakt</h2>
          <p className="text-park-muted leading-relaxed">
            Frågor om vår hantering av personuppgifter skickas till{' '}
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
