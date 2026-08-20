export interface PasswordResetMail {
  to: string
  resetUrl: string
}

export function applicationOrigin(): string | null {
  const raw = (process.env.APP_ORIGIN ?? '').trim().replace(/\/$/, '')
  if (!raw) return null
  try {
    const url = new URL(raw)
    const local = url.hostname === 'localhost' || url.hostname === '127.0.0.1'
    if (url.protocol === 'https:' || (url.protocol === 'http:' && local)) return raw
    return null
  } catch {
    return null
  }
}

export function isMailerConfigured(): boolean {
  return Boolean(
    process.env.RESEND_API_KEY?.trim()
    && process.env.MAIL_FROM?.trim()
    && applicationOrigin(),
  )
}

export function passwordResetUrl(token: string): string | null {
  const origin = applicationOrigin()
  if (!origin) return null
  return `${origin}/app/reset-password?token=${encodeURIComponent(token)}`
}

export async function sendPasswordResetEmail(mail: PasswordResetMail): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY?.trim()
  const from = process.env.MAIL_FROM?.trim()
  if (!apiKey || !from) throw new Error('mailer_unconfigured')

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: [mail.to],
      subject: 'Reset your Fud AI password',
      text: [
        'Use this link to choose a new password. It expires in 30 minutes and can be used once.',
        mail.resetUrl,
        'If you did not ask for this, you can ignore the message.',
      ].join('\n\n'),
    }),
  })
  if (!res.ok) throw new Error('mailer_failed')
}
