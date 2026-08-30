import test from 'node:test'
import assert from 'node:assert/strict'
import crypto from 'node:crypto'

import handler, { verifySignature } from '../api/portaly-webhook.js'

const SECRET = 'test-secret-not-a-real-one'
const PAID = { customerData: { email: 'Someone@Example.com' } }

const sign = (data, secret = SECRET) =>
  crypto.createHmac('sha256', secret).update(JSON.stringify(data)).digest('hex')

function makeRes() {
  return {
    statusCode: 200,
    body: undefined,
    ended: false,
    status(code) {
      this.statusCode = code
      return this
    },
    json(payload) {
      this.body = payload
      return this
    },
    end() {
      this.ended = true
      return this
    },
  }
}

const makeReq = ({ method = 'POST', headers = {}, body } = {}) => ({ method, headers, body })

/** Run the handler with a given env, restoring it afterwards. */
async function withSecret(secret, fn) {
  const previous = process.env.PORTALY_WEBHOOK_SECRET
  if (secret === undefined) delete process.env.PORTALY_WEBHOOK_SECRET
  else process.env.PORTALY_WEBHOOK_SECRET = secret
  try {
    return await fn()
  } finally {
    if (previous === undefined) delete process.env.PORTALY_WEBHOOK_SECRET
    else process.env.PORTALY_WEBHOOK_SECRET = previous
  }
}

// ── verifySignature ─────────────────────────────────────────────────────────

test('verifySignature accepts a correctly signed payload', () => {
  assert.equal(verifySignature(PAID, SECRET, sign(PAID)), true)
})

test('verifySignature rejects a signature made with a different secret', () => {
  assert.equal(verifySignature(PAID, SECRET, sign(PAID, 'wrong-secret')), false)
})

test('verifySignature rejects a signature for different data', () => {
  const other = { customerData: { email: 'attacker@example.com' } }
  assert.equal(verifySignature(PAID, SECRET, sign(other)), false)
})

test('verifySignature rejects missing, empty and malformed signatures', () => {
  for (const sig of [undefined, null, '', 'not-hex', sign(PAID).slice(0, -1), 123, {}]) {
    assert.equal(verifySignature(PAID, SECRET, sig), false, String(sig))
  }
})

// ── handler ─────────────────────────────────────────────────────────────────

test('non-POST methods are rejected', async () => {
  const res = makeRes()
  await withSecret(SECRET, () => handler(makeReq({ method: 'GET' }), res))
  assert.equal(res.statusCode, 405)
})

test('an unset secret fails closed with 503, never open', async () => {
  const res = makeRes()
  await withSecret(undefined, () =>
    handler(
      makeReq({ headers: { 'x-portaly-signature': sign(PAID) }, body: { event: 'paid', data: PAID } }),
      res
    )
  )
  assert.equal(res.statusCode, 503)
  assert.notEqual(res.statusCode, 200, 'an unconfigured webhook must not accept writes')
})

test('a payload with no signature header is rejected', async () => {
  const res = makeRes()
  await withSecret(SECRET, () => handler(makeReq({ body: { event: 'paid', data: PAID } }), res))
  assert.equal(res.statusCode, 401)
  assert.deepEqual(res.body, { error: 'missing signature' })
})

test('this is the exact bypass that used to work: no header, marked as paid', async () => {
  // Before the fix, `if (secret && sig)` meant omitting the header skipped
  // verification and the handler wrote to KV. It must now be a 401.
  const res = makeRes()
  await withSecret(SECRET, () =>
    handler(
      makeReq({ body: { event: 'paid', data: { customerData: { email: 'victim@example.com' } } } }),
      res
    )
  )
  assert.equal(res.statusCode, 401)
})

test('a forged signature is rejected', async () => {
  const res = makeRes()
  await withSecret(SECRET, () =>
    handler(
      makeReq({
        headers: { 'x-portaly-signature': sign(PAID, 'attacker-secret') },
        body: { event: 'paid', data: PAID },
      }),
      res
    )
  )
  assert.equal(res.statusCode, 401)
  assert.deepEqual(res.body, { error: 'invalid signature' })
})

test('a signed but structurally invalid payload is a 400', async () => {
  const res = makeRes()
  await withSecret(SECRET, () =>
    handler(makeReq({ headers: { 'x-portaly-signature': sign(PAID) }, body: {} }), res)
  )
  assert.equal(res.statusCode, 400)
})

test('a correctly signed non-paid event is accepted without writing', async () => {
  // No KV credentials are set in tests, so reaching kv.set would throw — this
  // passing is itself evidence that nothing was written.
  const data = { customerData: { email: 'someone@example.com' } }
  const res = makeRes()
  await withSecret(SECRET, () =>
    handler(
      makeReq({ headers: { 'x-portaly-signature': sign(data) }, body: { event: 'refunded', data } }),
      res
    )
  )
  assert.equal(res.statusCode, 200)
  assert.deepEqual(res.body, { ok: true })
})
