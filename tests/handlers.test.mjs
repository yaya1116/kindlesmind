import test from 'node:test'
import assert from 'node:assert/strict'

import contentHandler, { isTrustedHost } from '../api/content.js'
import notFoundHandler from '../api/not-found.js'
import { PAGES, SITE } from '../lib/content.mjs'

/** Minimal stand-in for the Express-ish response Vercel hands Node functions. */
function makeRes() {
  const headers = {}
  return {
    statusCode: 200,
    body: undefined,
    headers,
    setHeader(k, v) {
      headers[k.toLowerCase()] = v
    },
    status(code) {
      this.statusCode = code
      return this
    },
    send(body) {
      this.body = body
      return this
    },
  }
}

const makeReq = (query = {}, accept, extra = {}) => ({
  url: '/',
  query,
  headers: { ...(accept === undefined ? {} : { accept }), ...extra },
})

// ── api/content.js ──────────────────────────────────────────────────────────

test('content: Accept: text/markdown returns markdown with Vary: Accept', async () => {
  const res = makeRes()
  await contentHandler(makeReq({ page: 'home' }, 'text/markdown'), res)

  assert.equal(res.statusCode, 200)
  assert.equal(res.headers['content-type'], 'text/markdown; charset=utf-8')
  assert.match(res.headers.vary, /\bAccept\b/)
  assert.ok(res.body.startsWith('# KindlesMind'))
})

test('content: every page slug is reachable and returns its own markdown', async () => {
  for (const page of PAGES) {
    const res = makeRes()
    await contentHandler(makeReq({ page: page.slug }, 'text/markdown'), res)
    assert.equal(res.statusCode, 200, page.slug)
    assert.equal(res.body, page.markdown, page.slug)
  }
})

test('content: advertises the canonical URL and the markdown alternate', async () => {
  const res = makeRes()
  await contentHandler(makeReq({ page: 'about' }, 'text/markdown'), res)

  assert.match(res.headers.link, new RegExp(`<${SITE.origin}/about>; rel="canonical"`))
  assert.match(res.headers.link, /rel="alternate"; type="text\/markdown"/)
})

test('content: an unacceptable Accept gets 406, not a wrong representation', async () => {
  const res = makeRes()
  await contentHandler(makeReq({ page: 'home' }, 'application/pdf'), res)

  assert.equal(res.statusCode, 406)
  assert.match(res.headers.vary, /\bAccept\b/)
  assert.match(res.body, /Not Acceptable/)
})

test('content: the .md variant only offers markdown', async () => {
  const res = makeRes()
  // A browser-style Accept still resolves, via */*, to markdown.
  await contentHandler(
    makeReq({ page: 'terms', ext: 'md' }, 'text/html,application/xhtml+xml,*/*;q=0.8'),
    res
  )

  assert.equal(res.statusCode, 200)
  assert.equal(res.headers['content-type'], 'text/markdown; charset=utf-8')
})

test('content: the .md variant refuses a client that excludes markdown', async () => {
  const res = makeRes()
  await contentHandler(makeReq({ page: 'terms', ext: 'md' }, 'text/html'), res)

  assert.equal(res.statusCode, 406)
})

test('content: no Accept header at all still serves markdown', async () => {
  const res = makeRes()
  await contentHandler(makeReq({ page: 'home' }, undefined), res)

  assert.equal(res.statusCode, 200)
  assert.equal(res.headers['content-type'], 'text/markdown; charset=utf-8')
})

test('content: HTML-preferred request falls back to markdown when the shell is unreachable', async () => {
  const res = makeRes()
  // No host header, so the shell cannot be fetched; the request must still be
  // answered rather than erroring.
  await contentHandler(makeReq({ page: 'home' }, 'text/html;q=0.9, text/markdown;q=0.5'), res)

  assert.equal(res.statusCode, 200)
  assert.equal(res.headers['content-type'], 'text/markdown; charset=utf-8')
})

test('content: only this deployment is a trusted fetch target', () => {
  for (const host of [
    'www.kindlesmind.com',
    'kindlesmind.com',
    'kindlesmind-abc123.vercel.app',
    'localhost:4173',
    '127.0.0.1:3000',
  ]) {
    assert.equal(isTrustedHost(host), true, host)
  }

  // Host / X-Forwarded-Host are client-supplied: none of these may be fetched.
  for (const host of [
    'evil.com',
    'kindlesmind.com.evil.com',
    'www.kindlesmind.com.evil.com',
    'evil.com/www.kindlesmind.com',
    '169.254.169.254',
    'localhost.evil.com',
    'vercel.app.evil.com',
    '',
    undefined,
  ]) {
    assert.equal(isTrustedHost(host), false, String(host))
  }
})

test('content: an attacker-controlled Host cannot make us proxy their page', async () => {
  const res = makeRes()
  await contentHandler(
    makeReq({ page: 'home' }, 'text/html;q=0.9, text/markdown;q=0.5', {
      host: 'evil.example',
      'x-forwarded-host': 'evil.example',
    }),
    res
  )

  // The shell fetch is refused, so we fall back to our own markdown rather
  // than echoing someone else's HTML under this origin.
  assert.equal(res.statusCode, 200)
  assert.equal(res.headers['content-type'], 'text/markdown; charset=utf-8')
  assert.equal(res.body, PAGES.find(p => p.slug === 'home').markdown)
})

test('content: an unknown slug is a 404, never a 200', async () => {
  const res = makeRes()
  await contentHandler(makeReq({ page: 'nope' }, 'text/markdown'), res)

  assert.equal(res.statusCode, 404)
})

// ── api/not-found.js ────────────────────────────────────────────────────────

test('not-found: browsers get a 404 HTML page, not the app shell', () => {
  const res = makeRes()
  notFoundHandler(
    makeReq({}, 'text/html,application/xhtml+xml,*/*;q=0.8', { host: 'www.kindlesmind.com' }),
    res
  )

  assert.equal(res.statusCode, 404)
  assert.equal(res.headers['content-type'], 'text/html; charset=utf-8')
  assert.match(res.body, /<title>404/)
  assert.doesNotMatch(res.body, /<div id="root">/)
})

test('not-found: agents get a 404 markdown body pointing at the index files', () => {
  const res = makeRes()
  const req = makeReq({}, 'text/markdown', { host: 'www.kindlesmind.com' })
  req.url = '/some-path-that-does-not-exist'
  notFoundHandler(req, res)

  assert.equal(res.statusCode, 404)
  assert.equal(res.headers['content-type'], 'text/markdown; charset=utf-8')
  assert.match(res.body, /^# 404/)
  assert.match(res.body, /\/some-path-that-does-not-exist/)
  assert.match(res.body, /llms\.txt/)
  assert.match(res.body, /sitemap\.xml/)
  assert.match(res.body, /agent-instructions\.md/)
  assert.doesNotMatch(res.body, /\{\{PATH\}\}/)
})

test('not-found: always 404, whatever the client accepts', () => {
  for (const accept of [undefined, '*/*', 'application/pdf', 'text/plain']) {
    const res = makeRes()
    notFoundHandler(makeReq({}, accept, { host: 'www.kindlesmind.com' }), res)
    assert.equal(res.statusCode, 404, String(accept))
    assert.match(res.headers.vary, /\bAccept\b/)
    assert.equal(res.headers['x-robots-tag'], 'noindex')
  }
})
