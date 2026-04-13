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
  return <p className="mt-1 text-xs text-red-600">{message}</p>
}

function inputClass(hasError: boolean) {
  return `w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600 ${
    hasError ? 'border-red-400 bg-red-50' : 'border-gray-300'
  }`
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
      {/* Hidden session id */}
      <input type="hidden" {...register('sessionId')} />

      <div className="rounded-lg border border-gray-200 bg-white p-8 shadow-sm space-y-8">
        {/* Guardian / contact details */}
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-1">Your contact details</h2>
          <p className="text-sm text-gray-500 mb-4">
            We&apos;ll send your confirmation to the email address below.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="guardian-first-name" className="block text-sm font-medium text-gray-700 mb-1">
                First name <span className="text-red-500">*</span>
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
              <label htmlFor="guardian-last-name" className="block text-sm font-medium text-gray-700 mb-1">
                Last name <span className="text-red-500">*</span>
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
              <label htmlFor="guardian-email" className="block text-sm font-medium text-gray-700 mb-1">
                Email address <span className="text-red-500">*</span>
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
              <label htmlFor="guardian-phone" className="block text-sm font-medium text-gray-700 mb-1">
                Phone{' '}
                <span className="text-gray-400 font-normal">(optional)</span>
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
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-1">Participants</h2>
          <p className="text-sm text-gray-500 mb-4">
            Register yourself and up to {REGISTRATION.MAX_PARTICIPANTS_PER_SUBMISSION - 1} children
            in your care.
          </p>
          <div className="space-y-4">
            {fields.map((field, index) => {
              const isAdded = index > 0
              const pErrors = errors.participants?.[index]
              return (
                <div
                  key={field.id}
                  className="rounded-md border border-gray-200 p-4 space-y-4"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-gray-700">
                        {index === 0 ? 'You (participant 1)' : `Child ${index}`}
                      </p>
                      {isAdded && (
                        <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                          Child
                        </span>
                      )}
                    </div>
                    {isAdded && (
                      <button
                        type="button"
                        onClick={() => remove(index)}
                        className="text-xs text-red-600 hover:text-red-800 font-medium"
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label
                        htmlFor={`participants-${index}-firstName`}
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        First name <span className="text-red-500">*</span>
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
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Last name <span className="text-red-500">*</span>
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
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Date of birth{' '}
                        <span className="text-gray-400 font-normal">(optional)</span>
                      </label>
                      <input
                        id={`participants-${index}-dateOfBirth`}
                        type="date"
                        {...register(`participants.${index}.dateOfBirth`)}
                        className={inputClass(!!pErrors?.dateOfBirth)}
                      />
                    </div>
                    {!isAdded && (
                      <div className="flex items-center gap-2 pt-5">
                        <input
                          id={`participants-${index}-isChild`}
                          type="checkbox"
                          {...register(`participants.${index}.isChild`)}
                          className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-600"
                        />
                        <label
                          htmlFor={`participants-${index}-isChild`}
                          className="text-sm text-gray-700"
                        >
                          I am registering as a child
                        </label>
                      </div>
                    )}
                    <div className={isAdded ? 'sm:col-span-2' : 'sm:col-span-2'}>
                      <label
                        htmlFor={`participants-${index}-medicalNotes`}
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Medical notes{' '}
                        <span className="text-gray-400 font-normal">(optional)</span>
                      </label>
                      <textarea
                        id={`participants-${index}-medicalNotes`}
                        rows={2}
                        placeholder="Any conditions, allergies, or requirements we should know about"
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
              className="mt-3 flex items-center gap-1.5 text-sm font-medium text-green-700 hover:text-green-800"
            >
              <span className="text-lg leading-none">+</span> Add child
            </button>
          )}
          {errors.participants?.root && (
            <FieldError message={errors.participants.root.message} />
          )}
        </section>

        {/* Consent */}
        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Consent &amp; terms</h2>

          <label className="flex items-start gap-3 text-sm text-gray-700">
            <input
              type="checkbox"
              {...register('consentTerms')}
              className="mt-0.5 h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-600"
            />
            <span>
              I agree to the{' '}
              <Link href="/terms" className="text-green-700 underline">
                Terms of Service
              </Link>{' '}
              <span className="text-red-500">*</span>
            </span>
          </label>
          {errors.consentTerms && (
            <FieldError message={errors.consentTerms.message} />
          )}

          <label className="flex items-start gap-3 text-sm text-gray-700">
            <input
              type="checkbox"
              {...register('consentPrivacy')}
              className="mt-0.5 h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-600"
            />
            <span>
              I accept the{' '}
              <Link href="/privacy" className="text-green-700 underline">
                Privacy Policy
              </Link>{' '}
              <span className="text-red-500">*</span>
            </span>
          </label>
          {errors.consentPrivacy && (
            <FieldError message={errors.consentPrivacy.message} />
          )}

          {hasChildParticipant && (
            <>
              <label className="flex items-start gap-3 text-sm text-gray-700">
                <input
                  type="checkbox"
                  {...register('consentChildRegistration')}
                  className="mt-0.5 h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-600"
                />
                <span>
                  I consent to register a child in my care{' '}
                  <span className="text-red-500">*</span>
                </span>
              </label>
              {errors.consentChildRegistration && (
                <FieldError message={errors.consentChildRegistration.message} />
              )}
            </>
          )}
        </section>

        {/* Server error */}
        {serverError && (
          <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            {serverError}
          </div>
        )}

        {/* CAPTCHA Widget */}
        <TurnstileWidget
          onVerify={(token) => setCaptchaToken(token)}
          onError={() => setCaptchaToken(null)}
        />

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-md bg-green-700 px-6 py-3 text-base font-semibold text-white hover:bg-green-800 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isSubmitting
            ? 'Submitting…'
            : isWaitlist
              ? 'Join waitlist'
              : 'Submit registration'}
        </button>
      </div>
    </form>
  )
}
