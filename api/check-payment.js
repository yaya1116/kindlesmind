import { kv } from '@vercel/kv'

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end()

  const email = req.query.email?.toLowerCase()
  if (!email) return res.status(400).json({ error: 'missing email' })

  const paid = await kv.get(`paid:${email}`)
  res.status(200).json({ paid: paid === '1' })
}
