import crypto from 'crypto'
import { kv } from '@vercel/kv'

// Portaly signs JSON.stringify(data) with HMAC-SHA256
function verifySignature(data, secret, sig) {
  const expected = crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(data))
    .digest('hex')
  return expected === sig
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { data, event } = req.body ?? {}
  if (!data || !event) return res.status(400).json({ error: 'invalid payload' })

  // Verify signature (optional but recommended)
  const secret = process.env.PORTALY_WEBHOOK_SECRET
  const sig = req.headers['x-portaly-signature']
  if (secret && sig) {
    if (!verifySignature(data, secret, sig)) {
      return res.status(401).json({ error: 'invalid signature' })
    }
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
