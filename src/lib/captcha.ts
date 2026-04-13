const CLOUDFLARE_TURNSTILE_API = 'https://challenges.cloudflare.com/turnstile/v0/siteverify'

interface TurnstileVerifyResponse {
  success: boolean
  challenge_ts?: string
  hostname?: string
  error_codes?: string[]
  'error-codes'?: string[]
  score?: number
  score_reason?: string
}

export async function verifyCaptcha(token: string): Promise<{ success: boolean; score?: number }> {
  const secretKey = process.env.TURNSTILE_SECRET_KEY

  if (!secretKey) {
    console.error('TURNSTILE_SECRET_KEY is not set')
    return { success: false }
  }

  if (!token) {
    return { success: false }
  }

  try {
    const response = await fetch(CLOUDFLARE_TURNSTILE_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        secret: secretKey,
        response: token,
      }),
    })

    if (!response.ok) {
      console.error('Turnstile verification request failed:', response.statusText)
      return { success: false }
    }

    const data = (await response.json()) as TurnstileVerifyResponse

    return {
      success: data.success === true,
      score: data.score,
    }
  } catch (error) {
    console.error('Error verifying Turnstile token:', error)
    return { success: false }
  }
}
