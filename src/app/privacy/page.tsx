export const metadata = {
  title: 'Integritetspolicy | Parkrun Anmälan',
}

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 py-16">
      <h1 className="font-display font-extrabold text-4xl uppercase text-park-dark mb-2">
        Integritetspolicy
      </h1>
      <p className="text-park-muted text-sm mb-10">Senast uppdaterad: april 2026</p>

      <div className="prose prose-sm max-w-none space-y-8 text-park-dark">
        <section>
          <h2 className="font-display font-bold text-xl uppercase mb-3">1. Personuppgifter vi samlar in</h2>
          <p className="text-park-muted leading-relaxed">
            Vid anmälan samlar vi in namn, e-postadress, telefonnummer (frivilligt) samt
            eventuella medicinska uppgifter som du väljer att uppge. Vi registrerar också
            IP-adress och tidpunkt för samtycke.
          </p>
        </section>

        <section>
          <h2 className="font-display font-bold text-xl uppercase mb-3">2. Hur vi använder uppgifterna</h2>
          <p className="text-park-muted leading-relaxed">
            Dina uppgifter används enbart för att hantera din anmälan, skicka bekräftelse-
            och påminnelsemail samt administrera evenemanget. Vi delar aldrig dina uppgifter
            med tredje part i marknadsföringssyfte.
          </p>
        </section>

        <section>
          <h2 className="font-display font-bold text-xl uppercase mb-3">3. Lagring och radering</h2>
          <p className="text-park-muted leading-relaxed">
            Dina uppgifter sparas i upp till 90 dagar efter evenemanget och raderas därefter
            automatiskt. Du kan när som helst begära radering av dina uppgifter genom att
            kontakta oss.
          </p>
        </section>

        <section>
          <h2 className="font-display font-bold text-xl uppercase mb-3">4. Dina rättigheter</h2>
          <p className="text-park-muted leading-relaxed">
            Enligt GDPR har du rätt att begära ut, korrigera eller radera dina personuppgifter.
            Du har också rätt att invända mot behandling och begära begränsning av behandlingen.
          </p>
        </section>

        <section>
          <h2 className="font-display font-bold text-xl uppercase mb-3">5. Kontakt</h2>
          <p className="text-park-muted leading-relaxed">
            Frågor om vår hantering av personuppgifter skickas till{' '}
            <a href="mailto:ivantruedson@gmail.com" className="text-park-green underline">
              ivantruedson@gmail.com
            </a>
            .
          </p>
        </section>
      </div>
    </div>
  )
}
