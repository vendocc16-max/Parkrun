import { z } from 'zod'

export const CONTENT_KEYS = ['layout', 'home', 'sessions', 'privacy', 'terms'] as const

export type SiteContentKey = (typeof CONTENT_KEYS)[number]

const shortText = z.string().trim().min(1)
const longText = z.string().trim().min(1)

const linkSchema = z.object({
  label: shortText,
  href: shortText,
})

const statSchema = z.object({
  value: shortText,
  label: shortText,
})

const stepSchema = z.object({
  step: shortText,
  title: shortText,
  description: longText,
})

const sectionSchema = z.object({
  heading: shortText,
  body: longText,
})

const layoutContentSchema = z.object({
  metadataTitle: shortText,
  metadataDescription: longText,
  brandName: shortText,
  brandInitial: shortText,
  navSessionsLabel: shortText,
  navAdminLabel: shortText,
  footerCopyright: shortText,
  privacyLink: linkSchema,
  termsLink: linkSchema,
})

const homeContentSchema = z.object({
  badge: shortText,
  headline: shortText,
  intro: longText,
  primaryCtaLabel: shortText,
  secondaryCtaLabel: shortText,
  previewEyebrow: shortText,
  previewWhen: shortText,
  previewDistance: shortText,
  previewStats: z.array(statSchema).min(1),
  previewStatusLabel: shortText,
  stats: z.array(statSchema).min(1),
  flowEyebrow: shortText,
  flowHeading: shortText,
  steps: z.array(stepSchema).min(1),
  ctaHeading: shortText,
  ctaBody: longText,
  ctaButtonLabel: shortText,
  contactHeading: shortText,
  contactBody: longText,
  contactButtonLabel: shortText,
  contactEmail: shortText.email(),
})

const sessionsContentSchema = z.object({
  metadataTitle: shortText,
  metadataDescription: longText,
  eyebrow: shortText,
  title: shortText,
  intro: longText,
  fetchErrorTitle: shortText,
  fetchErrorBody: longText,
  emptyTitle: shortText,
  emptyBody: longText,
  fullStatusLabel: shortText,
  openStatusLabel: shortText,
  waitlistAvailableLabel: shortText,
  noSpotsLabel: shortText,
  spotsLeftSingular: shortText,
  spotsLeftPlural: shortText,
  waitlistCtaLabel: shortText,
  openCtaLabel: shortText,
})

const legalContentSchema = z.object({
  metadataTitle: shortText,
  title: shortText,
  updatedLabel: shortText,
  sections: z.array(sectionSchema).min(1),
})

export const SITE_CONTENT_SCHEMAS = {
  layout: layoutContentSchema,
  home: homeContentSchema,
  sessions: sessionsContentSchema,
  privacy: legalContentSchema,
  terms: legalContentSchema,
}

export type LayoutContent = z.infer<typeof layoutContentSchema>
export type HomeContent = z.infer<typeof homeContentSchema>
export type SessionsContent = z.infer<typeof sessionsContentSchema>
export type LegalContent = z.infer<typeof legalContentSchema>

export type SiteContentMap = {
  layout: LayoutContent
  home: HomeContent
  sessions: SessionsContent
  privacy: LegalContent
  terms: LegalContent
}

export type SiteContentPayload = SiteContentMap[SiteContentKey]

export const DEFAULT_SITE_CONTENT: SiteContentMap = {
  layout: {
    metadataTitle: 'Parkrun Anmälan',
    metadataDescription: 'Anmäl dig till kommande Parkrun-evenemang i ditt område',
    brandName: 'Parkrun',
    brandInitial: 'P',
    navSessionsLabel: 'Evenemang',
    navAdminLabel: 'Arrangör',
    footerCopyright: 'Parkrun Anmälan',
    privacyLink: { label: 'Integritetspolicy', href: '/privacy' },
    termsLink: { label: 'Användarvillkor', href: '/terms' },
  },
  home: {
    badge: 'Gratis varje vecka, öppet för alla',
    headline: 'Parkrun-anmälan som känns enkel från första klicket.',
    intro:
      'Hitta ett kommande 5 km-pass, säkra din plats och få en tydlig bekräftelse. Allt är byggt för att vara lugnt, snabbt och lätt att förstå.',
    primaryCtaLabel: 'Visa evenemang',
    secondaryCtaLabel: 'Hur det fungerar',
    previewEyebrow: 'Nästa pass',
    previewWhen: 'Lördag 09:00',
    previewDistance: '5 km',
    previewStats: [
      { label: 'Platser kvar', value: '18' },
      { label: 'Väntelista', value: 'Aktiv vid fullbokat' },
      { label: 'Bekräftelse', value: 'Direkt via e-post' },
    ],
    previewStatusLabel: 'Anmälan öppen',
    stats: [
      { value: '5 km', label: 'Samma distans varje gång' },
      { value: '100%', label: 'Gratis att delta' },
      { value: 'Alla', label: 'Åldrar och tempo välkomna' },
    ],
    flowEyebrow: 'Flödet',
    flowHeading: 'Tre steg, inga distraktioner.',
    steps: [
      {
        step: '01',
        title: 'Välj en tid',
        description: 'Se kommande pass, plats och tillgängliga platser utan att lämna flödet.',
      },
      {
        step: '02',
        title: 'Anmäl gruppen',
        description:
          'Registrera dig själv och barn i samma lugna formulär med tydliga samtycken.',
      },
      {
        step: '03',
        title: 'Kom fram redo',
        description:
          'Bekräftelsen skickas via e-post med nummer och praktisk information.',
      },
    ],
    ctaHeading: 'Redo att hitta nästa pass?',
    ctaBody: 'Bläddra bland publicerade evenemang och anmäl din grupp.',
    ctaButtonLabel: 'Visa evenemang',
    contactHeading: 'Frågor?',
    contactBody: 'Kontakta din lokala arrangör eller hör av dig direkt.',
    contactButtonLabel: 'Kontakta oss',
    contactEmail: 'ivantruedson@gmail.com',
  },
  sessions: {
    metadataTitle: 'Evenemang | Parkrun Anmälan',
    metadataDescription: 'Bläddra bland kommande Parkrun-evenemang och säkra din plats',
    eyebrow: 'Anmäl dig idag',
    title: 'Kommande evenemang',
    intro: 'Bläddra bland tillgängliga Parkrun-evenemang och anmäl din grupp.',
    fetchErrorTitle: 'Evenemang kunde inte hämtas',
    fetchErrorBody: 'Kontrollera Supabase-konfigurationen och ladda om sidan.',
    emptyTitle: 'Inga evenemang ännu',
    emptyBody: 'Kom tillbaka snart — nya evenemang läggs till regelbundet.',
    fullStatusLabel: 'Fullbokad',
    openStatusLabel: 'Öppen',
    waitlistAvailableLabel: 'Väntelista tillgänglig',
    noSpotsLabel: 'Inga platser kvar',
    spotsLeftSingular: 'plats kvar',
    spotsLeftPlural: 'platser kvar',
    waitlistCtaLabel: 'Gå med i väntelista',
    openCtaLabel: 'Visa & anmäl',
  },
  privacy: {
    metadataTitle: 'Integritetspolicy | Parkrun Anmälan',
    title: 'Integritetspolicy',
    updatedLabel: 'Senast uppdaterad: april 2026',
    sections: [
      {
        heading: '1. Personuppgifter vi samlar in',
        body:
          'Vid anmälan samlar vi in namn, e-postadress, telefonnummer (frivilligt) samt eventuella medicinska uppgifter som du väljer att uppge. Vi registrerar också IP-adress och tidpunkt för samtycke.',
      },
      {
        heading: '2. Hur vi använder uppgifterna',
        body:
          'Dina uppgifter används enbart för att hantera din anmälan, skicka bekräftelse- och påminnelsemail samt administrera evenemanget. Vi delar aldrig dina uppgifter med tredje part i marknadsföringssyfte.',
      },
      {
        heading: '3. Lagring och radering',
        body:
          'Dina uppgifter sparas i upp till 90 dagar efter evenemanget och raderas därefter automatiskt. Du kan när som helst begära radering av dina uppgifter genom att kontakta oss.',
      },
      {
        heading: '4. Dina rättigheter',
        body:
          'Enligt GDPR har du rätt att begära ut, korrigera eller radera dina personuppgifter. Du har också rätt att invända mot behandling och begära begränsning av behandlingen.',
      },
      {
        heading: '5. Kontakt',
        body: 'Frågor om vår hantering av personuppgifter skickas till ivantruedson@gmail.com.',
      },
    ],
  },
  terms: {
    metadataTitle: 'Användarvillkor | Parkrun Anmälan',
    title: 'Användarvillkor',
    updatedLabel: 'Senast uppdaterad: april 2026',
    sections: [
      {
        heading: '1. Deltagande',
        body:
          'Genom att anmäla dig till ett Parkrun-evenemang bekräftar du att du och eventuella meddeltagare är i tillräckligt god fysisk form för att delta. Deltagande sker på egen risk.',
      },
      {
        heading: '2. Anmälan',
        body:
          'En anmälan är bindande men kan avbokas fram till 24 timmar före evenemanget. Vid avbokning frigörs platsen automatiskt och kan tilldelas nästa person på väntelistan.',
      },
      {
        heading: '3. Barn',
        body:
          'Den vuxne som anmäler ett barn ansvarar för barnets säkerhet under hela evenemanget. Barn under 18 år måste alltid ha en ansvarig vuxen med sig.',
      },
      {
        heading: '4. Uppförande',
        body:
          'Vi förväntar oss att alla deltagare uppträder respektfullt mot varandra, volontärer och arrangörer. Olämpligt beteende kan leda till avstängning från framtida evenemang.',
      },
      {
        heading: '5. Kontakt',
        body: 'Frågor om dessa villkor skickas till ivantruedson@gmail.com.',
      },
    ],
  },
}

export function isSiteContentKey(value: string): value is SiteContentKey {
  return CONTENT_KEYS.includes(value as SiteContentKey)
}

export function parseSiteContent<K extends SiteContentKey>(
  key: K,
  payload: unknown
): SiteContentMap[K] {
  const parsed = SITE_CONTENT_SCHEMAS[key].safeParse(payload)
  return parsed.success ? parsed.data as SiteContentMap[K] : DEFAULT_SITE_CONTENT[key]
}

export function validateSiteContent<K extends SiteContentKey>(
  key: K,
  payload: unknown
): { data?: SiteContentMap[K]; error?: string } {
  const parsed = SITE_CONTENT_SCHEMAS[key].safeParse(payload)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid content payload' }
  }
  return { data: parsed.data as SiteContentMap[K] }
}
