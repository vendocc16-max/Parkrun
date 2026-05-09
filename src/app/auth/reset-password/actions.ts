'use server'

import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

const resetRequestSchema = z.object({
  email: z.string().email('Ange en giltig e-postadress'),
})

const updatePasswordSchema = z
  .object({
    password: z.string().min(8, 'Lösenordet måste vara minst 8 tecken'),
    confirmPassword: z.string().min(1, 'Bekräfta lösenordet'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Lösenorden matchar inte',
    path: ['confirmPassword'],
  })

async function getAppOrigin() {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, '')
  }

  const requestHeaders = await headers()
  const host = requestHeaders.get('x-forwarded-host') ?? requestHeaders.get('host')
  const proto = requestHeaders.get('x-forwarded-proto') ?? 'http'

  if (!host) {
    return null
  }

  return `${proto}://${host}`
}

export async function requestPasswordReset(data: {
  email: string
}): Promise<{ error?: string; success?: string }> {
  const parsed = resetRequestSchema.safeParse(data)

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Kontrollera e-postadressen' }
  }

  const appOrigin = await getAppOrigin()

  if (!appOrigin) {
    return { error: 'Kunde inte skapa återställningslänk. Försök igen senare.' }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${appOrigin}/auth/confirm?next=/auth/reset-password/update`,
  })

  if (error) {
    return { error: error.message }
  }

  return {
    success:
      'Om e-postadressen finns skickar vi en länk för att välja ett nytt lösenord.',
  }
}

export async function updatePassword(data: {
  password: string
  confirmPassword: string
}): Promise<{ error: string } | void> {
  const parsed = updatePasswordSchema.safeParse(data)

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Kontrollera lösenordet' }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  })

  if (error) {
    return { error: error.message }
  }

  redirect('/admin')
}
