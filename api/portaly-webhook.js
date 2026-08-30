import crypto from 'crypto'
import { kv } from '@vercel/kv'

/**
 * Portaly signs `JSON.stringify(data)` with HMAC-SHA256.
 *
 * The comparison is timing-safe: a plain `===` on a hex digest leaks, byte by
 * byte, how much of a guessed signature was correct.
 */
export function verifySignature(data, secret, sig) {
  if (typeof sig !== 'string' || sig === '') return false

  const expected = crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(data))
    .digest('hex')

  const a = Buffer.from(expected, 'utf8')
  const b = Buffer.from(sig, 'utf8')
  // timingSafeEqual throws on a length mismatch, so check that first — the
  // length of a hex digest is not a secret.
  if (a.length !== b.length) return false
  return crypto.timingSafeEqual(a, b)
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  // Previously this was `if (secret && sig)`, which meant an unset secret — or
  // a caller who simply omitted the header — skipped verification entirely.
  // Anyone could POST {event:'paid', data:{customerData:{email}}} and mark any
  // address as having paid. Verification is now mandatory.
  const secret = process.env.PORTALY_WEBHOOK_SECRET
  if (!secret) {
    console.error(
      '[portaly-webhook] PORTALY_WEBHOOK_SECRET is not set; refusing to accept unverified webhooks.'
    )
    return res.status(503).json({ error: 'webhook not configured' })
  }

  const sig = req.headers['x-portaly-signature']
  if (typeof sig !== 'string' || sig === '') {
    return res.status(401).json({ error: 'missing signature' })
  }

  const { data, event } = req.body ?? {}
  if (!data || !event) return res.status(400).json({ error: 'invalid payload' })

  if (!verifySignature(data, secret, sig)) {
    console.warn('[portaly-webhook] rejected a payload whose signature did not verify')
    return res.status(401).json({ error: 'invalid signature' })
  }

  if (event === 'paid') {
    const email = data?.customerData?.email?.toLowerCase()
    if (email) {
      // Store paid status for 7 days
      await kv.set(`paid:${email}`, '1', { ex: 60 * 60 * 24 * 7 })
    }
  }

  res.status(200).json({ ok: true })
}
