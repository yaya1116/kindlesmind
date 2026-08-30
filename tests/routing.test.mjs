import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { PAGES } from '../lib/content.mjs'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const config = JSON.parse(await readFile(join(ROOT, 'vercel.json'), 'utf8'))

const { rewrites, headers, redirects } = config
const acceptsMarkdown = rule =>
  (rule.has ?? []).some(
    h => h.type === 'header' && h.key === 'accept' && /text\/markdown/.test(h.value)
  )

test('the soft-404 catch-all to the app shell is gone', () => {
  for (const rule of rewrites) {
    assert.notEqual(
      rule.destination,
      '/index.html',
      'a catch-all rewrite to the app shell is what made every path return 200'
    )
  }
})

test('unmatched paths are the last rule and go to the 404 function', () => {
  const last = rewrites[rewrites.length - 1]
  assert.equal(last.source, '/(.*)')
  assert.equal(last.destination, '/api/not-found')
  assert.equal(last.has, undefined, 'the catch-all must be unconditional')

  const catchAlls = rewrites.filter(r => r.source === '/(.*)')
  assert.equal(catchAlls.length, 1)
})

test('each page has markdown negotiation, a .md URL and a static HTML route', () => {
  for (const page of PAGES) {
    const negotiated = rewrites.find(r => r.source === page.path && acceptsMarkdown(r))
    assert.ok(negotiated, `${page.slug}: no Accept-based rewrite for ${page.path}`)
    assert.equal(negotiated.destination, `/api/content?page=${page.slug}`)

    const md = rewrites.find(r => r.source === page.mdPath)
    assert.ok(md, `${page.slug}: no rewrite for ${page.mdPath}`)
    assert.equal(md.destination, `/api/content?page=${page.slug}&ext=md`)

    const html = rewrites.find(r => r.source === page.path && !acceptsMarkdown(r))
    assert.ok(html, `${page.slug}: no static route for ${page.path}`)
    assert.equal(html.destination, page.htmlFile)
  }
})

test('markdown negotiation is matched before the static HTML route', () => {
  for (const page of PAGES) {
    const negotiated = rewrites.findIndex(r => r.source === page.path && acceptsMarkdown(r))
    const html = rewrites.findIndex(r => r.source === page.path && !acceptsMarkdown(r))
    assert.ok(
      negotiated < html,
      `${page.slug}: the unconditional route would shadow the negotiated one`
    )
  }
})

test('every page path advertises Vary: Accept so CDNs cache per representation', () => {
  for (const page of PAGES) {
    const rule = headers.find(h => h.source === page.path)
    assert.ok(rule, `${page.path}: no headers rule`)

    const vary = rule.headers.find(h => h.key === 'Vary')
    assert.ok(vary, `${page.path}: no Vary header`)
    assert.match(vary.value, /\bAccept\b/)
    assert.match(vary.value, /\bAccept-Encoding\b/)

    const link = rule.headers.find(h => h.key === 'Link')
    assert.ok(link, `${page.path}: no Link header`)
    assert.ok(link.value.includes(page.mdPath))
    assert.match(link.value, /rel="alternate"; type="text\/markdown"/)
  }
})

test('the relocated app shell directory is kept out of the index', () => {
  const rule = headers.find(h => h.source === '/pages/(.*)')
  assert.ok(rule)
  assert.deepEqual(rule.headers.find(h => h.key === 'X-Robots-Tag'), {
    key: 'X-Robots-Tag',
    value: 'noindex',
  })
})

test('the old /index.html entry point redirects instead of 404ing', () => {
  const rule = redirects.find(r => r.source === '/index.html')
  assert.ok(rule, 'dist/index.html no longer exists, so the URL needs a redirect')
  assert.equal(rule.destination, '/')
  assert.equal(rule.permanent, true)
})

test('the preview server mirrors the deployed routing table', async () => {
  const preview = await readFile(join(ROOT, 'scripts', 'preview-routes.mjs'), 'utf8')
  // The preview middleware derives its routes from PAGES rather than
  // hard-coding them, which is what keeps it honest.
  assert.match(preview, /PAGES\.find\(p => p\.path === pathname\)/)
  assert.match(preview, /PAGES\.find\(p => p\.mdPath === pathname\)/)
  assert.match(preview, /api\/not-found\.js/)
})
