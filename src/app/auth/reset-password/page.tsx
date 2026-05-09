'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { requestPasswordReset } from './actions'

const schema = z.object({
  email: z.string().email('Ange en giltig e-postadress'),
})

type ResetRequestForm = z.infer<typeof schema>

export default function ResetPasswordPage() {
  const [serverError, setServerError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetRequestForm>({ resolver: zodResolver(schema) })

  const onSubmit = async (data: ResetRequestForm) => {
    setServerError(null)
    setSuccess(null)
    const result = await requestPasswordReset(data)

    if (result.error) {
      setServerError(result.error)
    } else if (result.success) {
      setSuccess(result.success)
    }
  }

  return (
    <div className="surface-grid flex min-h-[calc(100vh-8rem)] items-center justify-center bg-park-cream px-4 py-12">
      <div className="relative w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 inline-flex h-10 w-10 items-center justify-center rounded-md bg-park-dark shadow-sm">
            <span className="text-sm font-semibold text-park-lime">P</span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-park-dark">
            Återställ lösenord
          </h1>
          <p className="mt-1 text-sm text-park-muted">
            Ange e-postadressen för arrangörskontot.
          </p>
        </div>

        <div className="rounded-lg border border-park-border bg-park-white px-7 py-8 shadow-sm">
          {serverError && (
            <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {serverError}
            </div>
          )}

          {success && (
            <div className="mb-5 rounded-lg border border-park-green/25 bg-park-lime px-4 py-3 text-sm font-medium text-park-dark">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label
                htmlFor="email"
                className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-park-muted"
              >
                E-post
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                {...register('email')}
                className="w-full rounded-md border border-park-border bg-park-cream px-3.5 py-2.5 text-sm text-park-dark transition-[background-color,border-color,color,box-shadow] placeholder:text-park-muted/50 focus:border-park-green focus:outline-none focus:ring-2 focus:ring-park-green/15"
              />
              {errors.email && (
                <p className="mt-1.5 text-xs text-red-600">{errors.email.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-2 w-full rounded-md bg-park-dark px-4 py-3 text-sm font-semibold text-park-white shadow-sm transition-[background-color,color,box-shadow,opacity] hover:bg-park-green disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? 'Skickar…' : 'Skicka återställningslänk'}
            </button>
          </form>

          <Link
            href="/auth/login"
            className="mt-5 block text-center text-sm font-semibold text-park-green transition-colors hover:text-park-dark"
          >
            Tillbaka till inloggning
          </Link>
        </div>
      </div>
    </div>
  )
}
