import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { SITE, PAGES } from '../lib/content.mjs'
import { graphForPage } from '../lib/jsonld.mjs'
import { renderPage } from '../lib/page-html.mjs'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const indexHtml = await readFile(join(ROOT, 'index.html'), 'utf8')

const metaContent = (html, attr, name) => {
  const re = new RegExp(`<meta[^>]*${attr}="${name}"[^>]*content="([^"]*)"`, 'i')
  const alt = new RegExp(`<meta[^>]*content="([^"]*)"[^>]*${attr}="${name}"`, 'i')
  return (html.match(re) ?? html.match(alt))?.[1]
}

const ldJson = html => {
  const m = html.match(
    /<script type="application\/ld\+json">([\s\S]*?)<\/script>/
  )
  assert.ok(m, 'no JSON-LD block found')
  return JSON.parse(m[1])
}

// ── index.html (the app shell) ───────────────────────────────────────────────

test('the shell declares all four entity-resolution signals', () => {
  assert.match(indexHtml, /<html lang="zh-TW">/)
  assert.match(indexHtml, /<link rel="canonical" href="https:\/\/www\.kindlesmind\.com\/" \/>/)
  assert.equal(metaContent(indexHtml, 'property', 'og:type'), 'website')
  assert.equal(
    metaContent(indexHtml, 'property', 'og:image'),
    `${SITE.origin}${SITE.ogImage}`
  )
})

test('the shell carries a description, og:url and twitter card', () => {
  assert.ok((metaContent(indexHtml, 'name', 'description') ?? '').length >= 80)
  assert.equal(metaContent(indexHtml, 'property', 'og:url'), `${SITE.origin}/`)
  assert.equal(metaContent(indexHtml, 'property', 'og:site_name'), SITE.name)
  assert.equal(metaContent(indexHtml, 'name', 'twitter:card'), 'summary_large_image')
  assert.equal(
    metaContent(indexHtml, 'property', 'og:image:width'),
    String(SITE.ogImageWidth)
  )
})

test('the shell points at the markdown alternate of the homepage', () => {
  assert.match(
    indexHtml,
    /<link rel="alternate" type="text\/markdown" href="https:\/\/www\.kindlesmind\.com\/index\.md" \/>/
  )
})

test('the embedded JSON-LD has not drifted from lib/jsonld.mjs', () => {
  assert.deepEqual(ldJson(indexHtml), graphForPage('home'))
})

// ── JSON-LD shape ────────────────────────────────────────────────────────────

test('Organization schema is complete enough to verify the business', () => {
  const org = graphForPage('home')['@graph'].find(n => n['@type'] === 'Organization')
  assert.ok(org)
  assert.equal(org.name, SITE.name)
  assert.equal(org.url, `${SITE.origin}/`)
  assert.ok(org.description.length >= 50)

  assert.equal(org.address['@type'], 'PostalAddress')
  assert.equal(org.address.addressCountry, SITE.addressCountry)

  assert.ok(Array.isArray(org.contactPoint) && org.contactPoint.length >= 1)
  for (const cp of org.contactPoint) {
    assert.equal(cp['@type'], 'ContactPoint')
    assert.ok(cp.contactType, 'contactType is required')
    assert.match(cp.email, /@/)
  }
  assert.ok(org.contactPoint.some(cp => cp.contactType === 'customer support'))
})

test('the product is described as a WebApplication with offers', () => {
  const app = graphForPage('home')['@graph'].find(n => n['@type'] === 'WebApplication')
  assert.ok(app)
  assert.equal(app.url, `${SITE.origin}/`)
  assert.ok(app.applicationCategory)
  assert.ok(app.offers.length >= 1)
  for (const offer of app.offers) {
    assert.equal(offer['@type'], 'Offer')
    assert.equal(offer.priceCurrency, 'TWD')
    assert.match(offer.price, /^\d+$/)
  }
})

test('every non-home page gets a WebPage node bound to the same Organization', () => {
  for (const page of PAGES.filter(p => p.slug !== 'home')) {
    const graph = graphForPage(page.slug)['@graph']
    const webpage = graph.find(n => n['@type'] === 'WebPage')
    assert.ok(webpage, page.slug)
    assert.equal(webpage.url, `${SITE.origin}${page.path}`)
    assert.equal(webpage.publisher['@id'], `${SITE.origin}/#organization`)
    assert.ok(graph.some(n => n['@type'] === 'Organization'), page.slug)
  }
})

// ── generated static pages ───────────────────────────────────────────────────

test('generated pages are JavaScript-free and fully self-contained', () => {
  for (const page of PAGES.filter(p => p.generated)) {
    const html = renderPage(page)
    const scripts = [...html.matchAll(/<script([^>]*)>/g)].map(m => m[1])
    for (const attrs of scripts) {
      assert.match(
        attrs,
        /type="application\/ld\+json"/,
        `${page.slug}: only the JSON-LD script tag is allowed`
      )
    }
  }
})

test('generated pages carry the four metadata signals and valid JSON-LD', () => {
  for (const page of PAGES.filter(p => p.generated)) {
    const html = renderPage(page)
    assert.match(html, /<html lang="zh-TW">/, page.slug)
    assert.match(
      html,
      new RegExp(`<link rel="canonical" href="${SITE.origin}${page.path}" />`),
      page.slug
    )
    assert.equal(metaContent(html, 'property', 'og:type'), 'website', page.slug)
    assert.equal(
      metaContent(html, 'property', 'og:image'),
      `${SITE.origin}${SITE.ogImage}`,
      page.slug
    )
    assert.deepEqual(ldJson(html), graphForPage(page.slug), page.slug)
  }
})

test('generated pages render the markdown as real HTML text', () => {
  const about = PAGES.find(p => p.slug === 'about')
  const html = renderPage(about)
  assert.match(html, /<h1>關於 KindlesMind<\/h1>/)
  assert.match(html, /<h2>理論基礎<\/h2>/)

  const visible = html
    .replace(/<script[\s\S]*?<\/script>/g, '')
    .replace(/<style[\s\S]*?<\/style>/g, '')
    .replace(/<head>[\s\S]*?<\/head>/g, '')
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, '')
  assert.ok(visible.length >= 500, `only ${visible.length} rendered characters`)
})

// ── the no-JS fallback in the shell ──────────────────────────────────────────

test('the shell ships an H1 and 500+ characters of text without JavaScript', () => {
  const body = indexHtml.slice(indexHtml.indexOf('<body>'))
  const fallback = body.slice(
    body.indexOf('<div id="km-nojs">'),
    body.indexOf('<script type="module"')
  )

  assert.match(fallback, /<h1>KindlesMind — 依附類型診斷<\/h1>/)

  const text = fallback.replace(/<[^>]+>/g, '').replace(/\s+/g, '')
  assert.ok(text.length >= 500, `the no-JS fallback has only ${text.length} characters`)
})

test('the fallback is removed by main.jsx so the app renders unchanged', async () => {
  const main = await readFile(join(ROOT, 'src', 'main.jsx'), 'utf8')
  assert.match(main, /getElementById\('km-nojs'\)\?\.remove\(\)/)
  // The React root itself must stay untouched.
  assert.match(main, /createRoot\(document\.getElementById\('root'\)\)/)
})
