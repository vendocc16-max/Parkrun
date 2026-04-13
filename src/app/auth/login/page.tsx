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
    <div className="min-h-[calc(100vh-8rem)] bg-park-cream flex items-center justify-center px-4 py-12">
      {/* Decorative background */}
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-32 -left-32 h-64 w-64 rounded-full border border-park-green/10" />
        <div className="absolute -bottom-20 -right-20 h-96 w-96 rounded-full border border-park-green/10" />
        <div className="absolute bottom-40 right-60 h-48 w-48 rounded-full border border-park-lime/15" />
      </div>

      <div className="relative w-full max-w-sm">
        {/* Logo mark */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 inline-flex h-12 w-12 items-center justify-center rounded-full bg-park-dark">
            <span className="font-display font-bold text-park-lime text-lg">P</span>
          </div>
          <h1 className="font-display font-bold text-2xl uppercase text-park-dark">
            Arrangörsinloggning
          </h1>
          <p className="mt-1 text-sm text-park-muted">
            Logga in för att hantera evenemang och anmälningar.
          </p>
        </div>

        <div className="rounded-2xl bg-park-white border border-park-border shadow-sm px-7 py-8">
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
                className="w-full rounded-lg border border-park-border bg-park-cream px-3.5 py-2.5 text-sm text-park-dark placeholder:text-park-muted/50 focus:outline-none focus:border-park-green focus:ring-2 focus:ring-park-green/15 transition-colors"
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
                className="w-full rounded-lg border border-park-border bg-park-cream px-3.5 py-2.5 text-sm text-park-dark focus:outline-none focus:border-park-green focus:ring-2 focus:ring-park-green/15 transition-colors"
              />
              {errors.password && (
                <p className="mt-1.5 text-xs text-red-600">{errors.password.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-full bg-park-dark px-4 py-3 text-sm font-semibold text-park-white hover:bg-park-green transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              {isSubmitting ? 'Loggar in…' : 'Logga in →'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
