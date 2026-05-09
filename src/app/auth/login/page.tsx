'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { signIn } from './actions'

const schema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
})

type LoginForm = z.infer<typeof schema>

export default function LoginPage() {
  const [serverError, setServerError] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({ resolver: zodResolver(schema) })

  const onSubmit = async (data: LoginForm) => {
    setServerError(null)
    const result = await signIn(data)
    if (result?.error) {
      setServerError(result.error)
    }
  }

  return (
    <div className="surface-grid flex min-h-[calc(100vh-8rem)] items-center justify-center bg-park-cream px-4 py-12">
      <div className="relative w-full max-w-sm">
        {/* Logo mark */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 inline-flex h-10 w-10 items-center justify-center rounded-md bg-park-dark shadow-sm">
            <span className="text-sm font-semibold text-park-lime">P</span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-park-dark">
            Arrangörsinloggning
          </h1>
          <p className="mt-1 text-sm text-park-muted">
            Logga in för att hantera evenemang och anmälningar.
          </p>
        </div>

        <div className="rounded-lg border border-park-border bg-park-white px-7 py-8 shadow-sm">
          {serverError && (
            <div className="mb-5 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              {serverError}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label
                htmlFor="email"
                className="block text-xs font-semibold text-park-muted uppercase tracking-wider mb-1.5"
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

            <div>
              <label
                htmlFor="password"
                className="block text-xs font-semibold text-park-muted uppercase tracking-wider mb-1.5"
              >
                Lösenord
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                {...register('password')}
                className="w-full rounded-md border border-park-border bg-park-cream px-3.5 py-2.5 text-sm text-park-dark transition-[background-color,border-color,color,box-shadow] focus:border-park-green focus:outline-none focus:ring-2 focus:ring-park-green/15"
              />
              {errors.password && (
                <p className="mt-1.5 text-xs text-red-600">{errors.password.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-2 w-full rounded-md bg-park-dark px-4 py-3 text-sm font-semibold text-park-white shadow-sm transition-[background-color,color,box-shadow,opacity] hover:bg-park-green disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? 'Loggar in…' : 'Logga in →'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
