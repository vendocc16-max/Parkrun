import Link from 'next/link'

export default function Home() {
  return (
    <>
      {/* Hero */}
      <section className="bg-gradient-to-br from-green-50 to-emerald-100 py-24 px-4">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
            Sign up for your next{' '}
            <span className="text-green-700">Parkrun event</span>
          </h1>
          <p className="mt-6 text-lg leading-8 text-gray-600">
            Browse upcoming sessions, secure your spot, and bring the whole family. Free,
            friendly, and open to everyone — just show up and run.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/sessions"
              className="rounded-md bg-green-700 px-8 py-3 text-base font-semibold text-white shadow hover:bg-green-800 transition-colors"
            >
              View sessions
            </Link>
            <a
              href="#how-it-works"
              className="rounded-md border border-gray-300 px-8 py-3 text-base font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
            >
              How it works
            </a>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-20 px-4 bg-white">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">How it works</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-10 text-center">
            {[
              {
                step: '1',
                title: 'Find a session',
                description:
                  'Browse upcoming Parkrun events near you and pick a date that suits your schedule.',
              },
              {
                step: '2',
                title: 'Register your group',
                description:
                  'Fill in your details and add up to 5 participants — adults and children welcome.',
              },
              {
                step: '3',
                title: 'Show up and run',
                description:
                  "Receive a confirmation email with everything you need. Just show up on the day and enjoy!",
              },
            ].map(({ step, title, description }) => (
              <div key={step} className="flex flex-col items-center gap-4">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-green-700 text-white font-bold text-xl">
                  {step}
                </span>
                <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact */}
      <section className="py-16 px-4 bg-gray-50 border-t border-gray-200">
        <div className="mx-auto max-w-xl text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Questions?</h2>
          <p className="text-gray-500 mb-6">
            Reach out to your local event organiser or get in touch with us directly.
          </p>
          <a
            href="mailto:hello@parkrun-registration.example.com"
            className="inline-block rounded-md border border-gray-300 px-6 py-3 text-sm font-medium text-gray-700 hover:bg-white transition-colors"
          >
            Contact us
          </a>
        </div>
      </section>
    </>
  )
}
