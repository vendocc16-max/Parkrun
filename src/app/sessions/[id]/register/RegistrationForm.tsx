'use client'

import { useState } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { registrationSchema } from '@/lib/validations/registration'
import { REGISTRATION } from '@/lib/config/rules'
import TurnstileWidget from '@/components/TurnstileWidget'

interface Props {
  sessionId: string
  sessionSlug: string
  sessionTitle: string
  isWaitlist: boolean
}

// Extend with child-consent refinement
const formSchema = registrationSchema.superRefine((data, ctx) => {
  if (data.participants.some((p) => p.isChild) && !data.consentChildRegistration) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'You must consent to register a child in your care',
      path: ['consentChildRegistration'],
    })
  }
})

type FormData = z.infer<typeof formSchema>

function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return <p className="mt-1.5 text-xs text-red-600">{message}</p>
}

function inputClass(hasError: boolean) {
  return `w-full rounded-lg border px-3.5 py-2.5 text-sm bg-park-cream text-park-dark placeholder:text-park-muted/50 focus:outline-none focus:ring-2 transition-colors ${
    hasError
      ? 'border-red-400 bg-red-50 focus:border-red-400 focus:ring-red-200'
      : 'border-park-border focus:border-park-green focus:ring-park-green/15'
  }`
}

function SectionHeader({ children, sub }: { children: React.ReactNode; sub?: string }) {
  return (
    <div className="mb-5">
      <h2 className="font-display font-bold text-lg uppercase text-park-dark leading-tight">
        {children}
      </h2>
      {sub && <p className="mt-1 text-sm text-park-muted">{sub}</p>}
    </div>

  )
}

export default function RegistrationForm({
  sessionId,
  sessionSlug,
  sessionTitle,
  isWaitlist,
}: Props) {
  const router = useRouter()
  const [serverError, setServerError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [captchaToken, setCaptchaToken] = useState<string | null>(null)

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      sessionId,
      guardian: { firstName: '', lastName: '', email: '', phone: '' },
      participants: [
        { firstName: '', lastName: '', dateOfBirth: '', isChild: false, medicalNotes: '' },
      ],
      consentTerms: false,
      consentPrivacy: false,
      consentChildRegistration: false,
      captchaToken: '',
    },
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'participants',
  })

  const watchedParticipants = form.watch('participants')
  const hasChildParticipant = watchedParticipants.some((p) => p.isChild)
  const canAddMore = fields.length < REGISTRATION.MAX_PARTICIPANTS_PER_SUBMISSION

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true)
    setServerError(null)
    try {
      const res = await fetch('/api/registrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, captchaToken }),
      })
      const json = await res.json()
      if (!res.ok) {
        setServerError((json as { error?: string }).error ?? 'Registration failed. Please try again.')
        return
      }
      const result = json as { registrationNumbers?: string[]; status?: string }
      const params = new URLSearchParams({
        numbers: (result.registrationNumbers ?? []).join(','),
        status: result.status ?? 'confirmed',
      })
      router.push(`/sessions/${sessionSlug}/register/success?${params}`)
    } catch {
      setServerError('Network error. Please check your connection and try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const {
    register,
    formState: { errors },
    handleSubmit,
  } = form

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <input type="hidden" {...register('sessionId')} />

      <div className="space-y-4">
        {/* Contact details */}
        <section className="rounded-xl bg-park-white border border-park-border p-6 sm:p-8">
          <SectionHeader sub="Vi skickar din bekräftelse till e-postadressen nedan.">
            Dina kontaktuppgifter
          </SectionHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="guardian-first-name"
                className="block text-xs font-semibold text-park-muted uppercase tracking-wider mb-1.5"
              >
                Förnamn <span className="text-red-500">*</span>
              </label>
              <input
                id="guardian-first-name"
                type="text"
                autoComplete="given-name"
                {...register('guardian.firstName')}
                className={inputClass(!!errors.guardian?.firstName)}
              />
              <FieldError message={errors.guardian?.firstName?.message} />
            </div>
            <div>
              <label
                htmlFor="guardian-last-name"
                className="block text-xs font-semibold text-park-muted uppercase tracking-wider mb-1.5"
              >
                Efternamn <span className="text-red-500">*</span>
              </label>
              <input
                id="guardian-last-name"
                type="text"
                autoComplete="family-name"
                {...register('guardian.lastName')}
                className={inputClass(!!errors.guardian?.lastName)}
              />
              <FieldError message={errors.guardian?.lastName?.message} />
            </div>
            <div className="sm:col-span-2">
              <label
                htmlFor="guardian-email"
                className="block text-xs font-semibold text-park-muted uppercase tracking-wider mb-1.5"
              >
                E-postadress <span className="text-red-500">*</span>
              </label>
              <input
                id="guardian-email"
                type="email"
                autoComplete="email"
                {...register('guardian.email')}
                className={inputClass(!!errors.guardian?.email)}
              />
              <FieldError message={errors.guardian?.email?.message} />
            </div>
            <div>
              <label
                htmlFor="guardian-phone"
                className="block text-xs font-semibold text-park-muted uppercase tracking-wider mb-1.5"
              >
                Telefon{' '}
                <span className="text-park-muted/60 font-normal normal-case tracking-normal">(valfritt)</span>
              </label>
              <input
                id="guardian-phone"
                type="tel"
                autoComplete="tel"
                placeholder="+44 7700 000000"
                {...register('guardian.phone')}
                className={inputClass(!!errors.guardian?.phone)}
              />
              <FieldError message={errors.guardian?.phone?.message} />
            </div>
          </div>
        </section>

        {/* Participants */}
        <section className="rounded-xl bg-park-white border border-park-border p-6 sm:p-8">
          <SectionHeader
            sub={`Anmäl dig själv och upp till ${REGISTRATION.MAX_PARTICIPANTS_PER_SUBMISSION - 1} barn i ditt sällskap.`}
          >
            Deltagare
          </SectionHeader>

          <div className="space-y-3">
            {fields.map((field, index) => {
              const isAdded = index > 0
              const pErrors = errors.participants?.[index]
              return (
                <div
                  key={field.id}
                  className="rounded-lg border border-park-border bg-park-cream p-4 space-y-4"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-display font-bold text-sm uppercase text-park-dark">
                        {index === 0 ? 'Du (deltagare 1)' : `Barn ${index}`}
                      </span>
                      {isAdded && (
                        <span className="rounded-full bg-park-green/10 px-2 py-0.5 text-xs font-semibold text-park-green uppercase tracking-wide">
                          Barn
                        </span>
                      )}
                    </div>
                    {isAdded && (
                      <button
                        type="button"
                        onClick={() => remove(index)}
                        className="text-xs text-red-500 hover:text-red-700 font-medium transition-colors"
                      >
                        Ta bort
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label
                        htmlFor={`participants-${index}-firstName`}
                        className="block text-xs font-semibold text-park-muted uppercase tracking-wider mb-1.5"
                      >
                        Förnamn <span className="text-red-500">*</span>
                      </label>
                      <input
                        id={`participants-${index}-firstName`}
                        type="text"
                        {...register(`participants.${index}.firstName`)}
                        className={inputClass(!!pErrors?.firstName)}
                      />
                      <FieldError message={pErrors?.firstName?.message} />
                    </div>
                    <div>
                      <label
                        htmlFor={`participants-${index}-lastName`}
                        className="block text-xs font-semibold text-park-muted uppercase tracking-wider mb-1.5"
                      >
                        Efternamn <span className="text-red-500">*</span>
                      </label>
                      <input
                        id={`participants-${index}-lastName`}
                        type="text"
                        {...register(`participants.${index}.lastName`)}
                        className={inputClass(!!pErrors?.lastName)}
                      />
                      <FieldError message={pErrors?.lastName?.message} />
                    </div>
                    <div>
                      <label
                        htmlFor={`participants-${index}-dateOfBirth`}
                        className="block text-xs font-semibold text-park-muted uppercase tracking-wider mb-1.5"
                      >
                        Födelsedatum{' '}
                        <span className="text-park-muted/60 font-normal normal-case tracking-normal">(valfritt)</span>
                      </label>
                      <input
                        id={`participants-${index}-dateOfBirth`}
                        type="date"
                        {...register(`participants.${index}.dateOfBirth`)}
                        className={inputClass(!!pErrors?.dateOfBirth)}
                      />
                    </div>
                    {!isAdded && (
                      <div className="flex items-center gap-2.5 pt-5">
                        <input
                          id={`participants-${index}-isChild`}
                          type="checkbox"
                          {...register(`participants.${index}.isChild`)}
                          className="h-4 w-4 rounded border-park-border text-park-green focus:ring-park-green/20 accent-park-green"
                        />
                        <label
                          htmlFor={`participants-${index}-isChild`}
                          className="text-sm text-park-dark"
                        >
                          Jag anmäler mig som barn
                        </label>
                      </div>
                    )}
                    <div className="sm:col-span-2">
                      <label
                        htmlFor={`participants-${index}-medicalNotes`}
                        className="block text-xs font-semibold text-park-muted uppercase tracking-wider mb-1.5"
                      >
                        Medicinska uppgifter{' '}
                        <span className="text-park-muted/60 font-normal normal-case tracking-normal">(valfritt)</span>
                      </label>
                      <textarea
                        id={`participants-${index}-medicalNotes`}
                        rows={2}
                        placeholder="Tillstånd, allergier eller krav vi bör känna till"
                        {...register(`participants.${index}.medicalNotes`)}
                        className={`${inputClass(!!pErrors?.medicalNotes)} resize-none`}
                      />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {canAddMore && (
            <button
              type="button"
              onClick={() =>
                append({
                  firstName: '',
                  lastName: '',
                  dateOfBirth: '',
                  isChild: true,
                  medicalNotes: '',
                })
              }
              className="mt-4 flex items-center gap-2 text-sm font-semibold text-park-green hover:text-park-dark transition-colors"
            >
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-park-lime text-park-dark text-xs font-bold">+</span>
              Lägg till barn
            </button>
          )}
          {errors.participants?.root && (
            <FieldError message={errors.participants.root.message} />
          )}
        </section>

        {/* Consent */}
        <section className="rounded-xl bg-park-white border border-park-border p-6 sm:p-8">
          <SectionHeader>Samtycke &amp; villkor</SectionHeader>

          <div className="space-y-4">
            <label className="flex items-start gap-3 text-sm text-park-dark cursor-pointer">
              <input
                type="checkbox"
                {...register('consentTerms')}
                className="mt-0.5 h-4 w-4 rounded border-park-border accent-park-green"
              />
              <span>
                Jag godkänner{' '}
                <Link href="/terms" className="text-park-green underline underline-offset-2 hover:text-park-dark transition-colors">
                  användarvillkoren
                </Link>{' '}
                <span className="text-red-500">*</span>
              </span>
            </label>
            {errors.consentTerms && (
              <FieldError message={errors.consentTerms.message} />
            )}

            <label className="flex items-start gap-3 text-sm text-park-dark cursor-pointer">
              <input
                type="checkbox"
                {...register('consentPrivacy')}
                className="mt-0.5 h-4 w-4 rounded border-park-border accent-park-green"
              />
              <span>
                Jag godkänner{' '}
                <Link href="/privacy" className="text-park-green underline underline-offset-2 hover:text-park-dark transition-colors">
                  integritetspolicyn
                </Link>{' '}
                <span className="text-red-500">*</span>
              </span>
            </label>
            {errors.consentPrivacy && (
              <FieldError message={errors.consentPrivacy.message} />
            )}

            {hasChildParticipant && (
              <>
                <label className="flex items-start gap-3 text-sm text-park-dark cursor-pointer">
                  <input
                    type="checkbox"
                    {...register('consentChildRegistration')}
                    className="mt-0.5 h-4 w-4 rounded border-park-border accent-park-green"
                  />
                  <span>
                    Jag samtycker till att anmäla ett barn i mitt sällskap{' '}
                    <span className="text-red-500">*</span>
                  </span>
                </label>
                {errors.consentChildRegistration && (
                  <FieldError message={errors.consentChildRegistration.message} />
                )}
              </>
            )}
          </div>
        </section>

        {/* Server error */}
        {serverError && (
          <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            {serverError}
          </div>
        )}

        {/* CAPTCHA */}
        <TurnstileWidget
          onVerify={(token) => setCaptchaToken(token)}
          onError={() => setCaptchaToken(null)}
        />

        {/* Submit */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-full bg-park-dark px-6 py-4 text-base font-semibold text-park-white hover:bg-park-green transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting
            ? 'Submitting…'
            : isWaitlist
              ? 'Gå med i väntelista →'
              : 'Skicka anmälan →'}
        </button>
      </div>
    </form>
  )
}
