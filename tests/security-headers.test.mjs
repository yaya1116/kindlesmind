import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { SECURITY_HEADERS, CONTENT_SECURITY_POLICY } from '../lib/security-headers.mjs'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const config = JSON.parse(await readFile(join(ROOT, 'vercel.json'), 'utf8'))

const globalRule = config.headers.find(h => h.source === '/(.*)')

/** The CSP as a { directive: [values] } map. */
const directives = Object.fromEntries(
  CONTENT_SECURITY_POLICY.split(';')
    .map(part => part.trim().split(/\s+/))
    .map(([name, ...values]) => [name, values])
)

test('vercel.json applies the security headers to every path', () => {
  assert.ok(globalRule, 'no /(.*) headers rule')
  assert.deepEqual(globalRule.headers, SECURITY_HEADERS, 'vercel.json has drifted from lib/security-headers.mjs')
})

test('the baseline hardening headers are present', () => {
  const byKey = Object.fromEntries(SECURITY_HEADERS.map(h => [h.key, h.value]))
  assert.equal(byKey['X-Content-Type-Options'], 'nosniff')
  assert.equal(byKey['X-Frame-Options'], 'DENY')
  assert.equal(byKey['Referrer-Policy'], 'strict-origin-when-cross-origin')
  assert.match(byKey['Permissions-Policy'], /camera=\(\)/)
})

test('the CSP locks down the directives an injected script would need', () => {
  assert.deepEqual(directives['default-src'], ["'self'"])
  assert.deepEqual(directives['object-src'], ["'none'"])
  assert.deepEqual(directives['base-uri'], ["'self'"])
  assert.deepEqual(directives['frame-ancestors'], ["'none'"])
  assert.deepEqual(directives['form-action'], ["'self'"])
  assert.ok('upgrade-insecure-requests' in directives)
})

test('no directive allows a wildcard host or unsafe-eval', () => {
  assert.doesNotMatch(CONTENT_SECURITY_POLICY, /'unsafe-eval'/)
  for (const [name, values] of Object.entries(directives)) {
    for (const value of values) {
      assert.notEqual(value, '*', `${name} must not allow every origin`)
      assert.notEqual(value, 'https:', `${name} must not allow every https origin`)
    }
  }
})

test('script-src only trusts this origin and Google Analytics', () => {
  const hosts = directives['script-src'].filter(v => v.startsWith('http'))
  assert.deepEqual(hosts, [
    'https://www.googletagmanager.com',
    'https://www.google-analytics.com',
  ])
})

test('the CSP allows everything the share-card export needs', () => {
  // html-to-image rasterises the card: it refetches the webfont CSS and font
  // files, renders through a data: URL, then reads the result back with fetch.
  assert.ok(directives['connect-src'].includes('https://fonts.googleapis.com'))
  assert.ok(directives['connect-src'].includes('https://fonts.gstatic.com'))
  assert.ok(directives['connect-src'].includes('data:'))
  assert.ok(directives['img-src'].includes('data:'))
  assert.ok(directives['img-src'].includes('blob:'))
})

test('the CSP allows the fonts, styles and archetype videos the app renders', () => {
  assert.ok(directives['style-src'].includes('https://fonts.googleapis.com'))
  assert.ok(directives['style-src'].includes("'unsafe-inline'"), 'Framer Motion animates inline styles')
  assert.ok(directives['font-src'].includes('https://fonts.gstatic.com'))
  assert.ok(directives['media-src'].includes("'self'"))
})

test('the preview server applies the same headers as the deployment', async () => {
  const preview = await readFile(join(ROOT, 'scripts', 'preview-routes.mjs'), 'utf8')
  assert.match(preview, /import \{ SECURITY_HEADERS \} from '\.\.\/lib\/security-headers\.mjs'/)
  assert.match(preview, /for \(const \{ key, value \} of SECURITY_HEADERS\) res\.setHeader\(key, value\)/)
})
