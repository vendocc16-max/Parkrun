import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

function getSafeNextPath(next: string | null) {
  if (!next || !next.startsWith('/') || next.startsWith('//')) {
    return '/admin'
  }

  return next
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = getSafeNextPath(requestUrl.searchParams.get('next'))
  const redirectUrl = request.nextUrl.clone()

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      redirectUrl.pathname = next
      redirectUrl.search = ''
      return NextResponse.redirect(redirectUrl)
    }
  }

  redirectUrl.pathname = '/auth/login'
  redirectUrl.searchParams.set('error', 'auth_callback_failed')
  return NextResponse.redirect(redirectUrl)
}
