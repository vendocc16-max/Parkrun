'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { updatePassword } from '../actions'

const schema = z
  .object({
    password: z.string().min(8, 'Lösenordet måste vara minst 8 tecken'),
    confirmPassword: z.string().min(1, 'Bekräfta lösenordet'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Lösenorden matchar inte',
    path: ['confirmPassword'],
  })

type UpdatePasswordForm = z.infer<typeof schema>

export default function UpdatePasswordPage() {
  const [serverError, setServerError] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<UpdatePasswordForm>({ resolver: zodResolver(schema) })

  const onSubmit = async (data: UpdatePasswordForm) => {
    setServerError(null)
    const result = await updatePassword(data)

    if (result?.error) {
      setServerError(result.error)
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
            Välj nytt lösenord
          </h1>
          <p className="mt-1 text-sm text-park-muted">
            Ange ett nytt lösenord för arrangörskontot.
          </p>
        </div>

        <div className="rounded-lg border border-park-border bg-park-white px-7 py-8 shadow-sm">
          {serverError && (
            <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {serverError}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label
                htmlFor="password"
                className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-park-muted"
              >
                Nytt lösenord
              </label>
              <input
                id="password"
                type="password"
                autoComplete="new-password"
                {...register('password')}
                className="w-full rounded-md border border-park-border bg-park-cream px-3.5 py-2.5 text-sm text-park-dark transition-[background-color,border-color,color,box-shadow] focus:border-park-green focus:outline-none focus:ring-2 focus:ring-park-green/15"
              />
              {errors.password && (
                <p className="mt-1.5 text-xs text-red-600">{errors.password.message}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-park-muted"
              >
                Bekräfta lösenord
              </label>
              <input
                id="confirmPassword"
                type="password"
                autoComplete="new-password"
                {...register('confirmPassword')}
                className="w-full rounded-md border border-park-border bg-park-cream px-3.5 py-2.5 text-sm text-park-dark transition-[background-color,border-color,color,box-shadow] focus:border-park-green focus:outline-none focus:ring-2 focus:ring-park-green/15"
              />
              {errors.confirmPassword && (
                <p className="mt-1.5 text-xs text-red-600">
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-2 w-full rounded-md bg-park-dark px-4 py-3 text-sm font-semibold text-park-white shadow-sm transition-[background-color,color,box-shadow,opacity] hover:bg-park-green disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? 'Sparar…' : 'Spara nytt lösenord'}
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
