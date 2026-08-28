import test from 'node:test'
import assert from 'node:assert/strict'

import {
  PAGES,
  SITE,
  LLMS_TXT,
  AGENT_INSTRUCTIONS,
  AGENT_INSTRUCTIONS_PATH,
  ARCHETYPES,
  DIMENSIONS,
} from '../lib/content.mjs'

/** Rough count of human-readable characters: strip markdown syntax and links. */
function textLength(markdown) {
  return markdown
    .replace(/```[\s\S]*?```/g, '')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[#*`>_\-|]/g, '')
    .replace(/\s+/g, '')
    .length
}

test('every page has the fields the renderers and sitemap rely on', () => {
  for (const page of PAGES) {
    assert.ok(page.slug, 'slug')
    assert.ok(page.path.startsWith('/'), `${page.slug}: path`)
    assert.equal(page.mdPath, page.slug === 'home' ? '/index.md' : `${page.path}.md`)
    assert.ok(page.htmlFile.startsWith('/pages/'), `${page.slug}: htmlFile`)
    assert.ok(page.title.includes(SITE.name), `${page.slug}: title`)
    assert.ok(page.description.length >= 50, `${page.slug}: description too short`)
    assert.ok(page.changefreq && page.priority, `${page.slug}: sitemap fields`)
  }
})

test('paths and markdown paths are unique', () => {
  assert.equal(new Set(PAGES.map(p => p.path)).size, PAGES.length)
  assert.equal(new Set(PAGES.map(p => p.mdPath)).size, PAGES.length)
  assert.equal(new Set(PAGES.map(p => p.htmlFile)).size, PAGES.length)
})

test('trust-anchor pages carry well over 500 characters of real content', () => {
  // The audit threshold is 500; anything near it is a regression worth failing.
  for (const slug of ['about', 'contact', 'privacy', 'terms']) {
    const page = PAGES.find(p => p.slug === slug)
    assert.ok(
      textLength(page.markdown) >= 500,
      `${slug} has only ${textLength(page.markdown)} characters`
    )
  }
})

test('the homepage markdown describes the product an agent needs to summarise', () => {
  const home = PAGES.find(p => p.slug === 'home')
  assert.ok(home.markdown.startsWith('# KindlesMind'))
  assert.ok(textLength(home.markdown) >= 500)
  for (const dim of DIMENSIONS) {
    assert.ok(home.markdown.includes(dim.name), `missing dimension ${dim.name}`)
  }
  for (const a of ARCHETYPES) {
    assert.ok(home.markdown.includes(a.code), `missing archetype ${a.code}`)
  }
  assert.match(home.markdown, /不.*醫療診斷/, 'the medical disclaimer must survive')
})

test('every markdown page starts with exactly one H1', () => {
  for (const page of PAGES) {
    const h1s = page.markdown.split('\n').filter(line => /^# /.test(line))
    assert.equal(h1s.length, 1, `${page.slug} has ${h1s.length} H1s`)
  }
})

test('internal links point at real paths on the canonical origin', () => {
  const known = new Set([
    ...PAGES.map(p => `${SITE.origin}${p.path}`),
    ...PAGES.map(p => `${SITE.origin}${p.mdPath}`),
    `${SITE.origin}/`,
    `${SITE.origin}${AGENT_INSTRUCTIONS_PATH}`,
    `${SITE.origin}/llms.txt`,
    `${SITE.origin}/sitemap.xml`,
    `${SITE.origin}/robots.txt`,
  ])

  const documents = [...PAGES.map(p => p.markdown), LLMS_TXT, AGENT_INSTRUCTIONS]
  for (const doc of documents) {
    for (const [, url] of doc.matchAll(/\]\((https?:\/\/[^)]+)\)/g)) {
      if (!url.startsWith(SITE.origin)) continue
      assert.ok(known.has(url), `unknown internal link: ${url}`)
    }
  }
})

test('the archetype table matches the 12 diagnostic codes the app can emit', () => {
  assert.equal(ARCHETYPES.length, 12)
  const codes = ARCHETYPES.map(a => a.code)
  assert.deepEqual(
    codes,
    Array.from({ length: 12 }, (_, i) => `KM-${String(i + 1).padStart(2, '0')}`)
  )
})

// ── llms.txt, per llmstxt.org ───────────────────────────────────────────────

test('llms.txt opens with an H1 followed by a blockquote summary', () => {
  const lines = LLMS_TXT.split('\n')
  assert.equal(lines[0], `# ${SITE.name}`)

  const firstBody = lines.slice(1).find(l => l.trim() !== '')
  assert.ok(firstBody.startsWith('> '), 'the summary must be a blockquote')
})

test('llms.txt keeps headings out of the free-form prose block', () => {
  const beforeFirstH2 = LLMS_TXT.split(/^## /m)[0]
  const headings = beforeFirstH2
    .split('\n')
    .slice(1) // the H1 itself
    .filter(line => /^#{1,6} /.test(line))
  assert.deepEqual(headings, [], 'only the H1 may be a heading before the first H2')
})

test('llms.txt H2 sections contain nothing but markdown link lists', () => {
  const sections = LLMS_TXT.split(/^## .*$/m).slice(1)
  assert.ok(sections.length >= 1)

  for (const section of sections) {
    for (const line of section.split('\n')) {
      if (line.trim() === '') continue
      assert.match(
        line,
        /^- \[[^\]]+\]\([^)]+\)(: .*)?$/,
        `not a valid llms.txt file-list item: ${line}`
      )
    }
  }
})

test('llms.txt states when to use the site and links the agent instructions', () => {
  assert.match(LLMS_TXT, /When to use this/)
  assert.match(LLMS_TXT, /When not to use this/)
  assert.match(LLMS_TXT, /How an agent should call this site/)
  assert.ok(LLMS_TXT.includes(`${SITE.origin}${AGENT_INSTRUCTIONS_PATH}`))
})

// ── agent-instructions.md ───────────────────────────────────────────────────

test('agent instructions name concrete best-fit and out-of-scope cases', () => {
  assert.ok(AGENT_INSTRUCTIONS.startsWith('# KindlesMind — Agent Instructions'))
  assert.match(AGENT_INSTRUCTIONS, /^## When to use this$/m)
  assert.match(AGENT_INSTRUCTIONS, /^## When not to use this$/m)
  assert.match(AGENT_INSTRUCTIONS, /^## How to call this site$/m)
  assert.match(AGENT_INSTRUCTIONS, /^## Required caveat$/m)
  // Crisis routing and the medical boundary are the two things an agent must
  // not paraphrase away.
  assert.match(AGENT_INSTRUCTIONS, /1925/)
  assert.match(AGENT_INSTRUCTIONS, /不構成醫療診斷/)
  assert.ok(textLength(AGENT_INSTRUCTIONS) >= 500)
})
