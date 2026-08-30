import test from 'node:test'
import assert from 'node:assert/strict'
import { execFile } from 'node:child_process'
import { mkdtemp, mkdir, readFile, writeFile, rm, access } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'

import { PAGES, SITE } from '../lib/content.mjs'

const run = promisify(execFile)
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const SCRIPT = join(ROOT, 'scripts', 'build-content.mjs')

const SHELL = '<!doctype html><html lang="zh-TW"><body><div id="root"></div></body></html>'
const exists = p => access(p).then(() => true, () => false)

/** Run the post-build step against a throwaway dist/ and return its path. */
async function buildInto() {
  const dist = await mkdtemp(join(tmpdir(), 'km-dist-'))
  await writeFile(join(dist, 'index.html'), SHELL)
  await mkdir(join(dist, 'assets'), { recursive: true })
  await run(process.execPath, [SCRIPT], { env: { ...process.env, KM_DIST: dist } })
  return dist
}

test('the post-build step produces every JS-free surface', async t => {
  const dist = await buildInto()
  t.after(() => rm(dist, { recursive: true, force: true }))

  await t.test('dist/index.html is gone so `/` is free for Accept routing', async () => {
    assert.equal(
      await exists(join(dist, 'index.html')),
      false,
      'a file at the output root would take precedence over every rewrite'
    )
    assert.equal(await readFile(join(dist, 'pages', 'home.html'), 'utf8'), SHELL)
  })

  await t.test('each declared page has its HTML artefact', async () => {
    for (const page of PAGES) {
      assert.ok(
        await exists(join(dist, page.htmlFile.slice(1))),
        `missing ${page.htmlFile}`
      )
    }
  })

  await t.test('sitemap.xml lists every page with a lastmod', async () => {
    const xml = await readFile(join(dist, 'sitemap.xml'), 'utf8')
    assert.match(xml, /^<\?xml version="1\.0" encoding="UTF-8"\?>/)
    assert.match(xml, /<urlset xmlns="http:\/\/www\.sitemaps\.org\/schemas\/sitemap\/0\.9">/)

    for (const page of PAGES) {
      assert.ok(xml.includes(`<loc>${SITE.origin}${page.path}</loc>`), page.path)
    }
    assert.equal(
      (xml.match(/<lastmod>/g) ?? []).length,
      PAGES.length,
      'every <url> needs a <lastmod>'
    )
    for (const [, date] of xml.matchAll(/<lastmod>([^<]+)<\/lastmod>/g)) {
      assert.match(date, /^\d{4}-\d{2}-\d{2}$/, `not a W3C date: ${date}`)
    }
    // Nothing that is not an indexable page should leak into the sitemap.
    assert.ok(!xml.includes('/pages/'))
    assert.ok(!xml.includes('.md<'))
  })

  await t.test('robots.txt points at the sitemap and the agent instructions', async () => {
    const robots = await readFile(join(dist, 'robots.txt'), 'utf8')
    assert.match(robots, /^User-agent: \*$/m)
    assert.match(robots, /^Allow: \/$/m)
    assert.ok(robots.includes(`Sitemap: ${SITE.origin}/sitemap.xml`))
    assert.ok(robots.includes('/agent-instructions.md'))
    assert.match(robots, /^Disallow: \/pages\/$/m)
  })

  await t.test('llms.txt and agent-instructions.md are written', async () => {
    const llms = await readFile(join(dist, 'llms.txt'), 'utf8')
    assert.ok(llms.startsWith(`# ${SITE.name}`))

    const agent = await readFile(join(dist, 'agent-instructions.md'), 'utf8')
    assert.match(agent, /## When to use this/)
  })

  await t.test('the build is idempotent', async () => {
    await run(process.execPath, [SCRIPT], { env: { ...process.env, KM_DIST: dist } })
    assert.equal(await readFile(join(dist, 'pages', 'home.html'), 'utf8'), SHELL)
  })
})

test('the post-build step fails loudly when there is nothing to move', async () => {
  const dist = await mkdtemp(join(tmpdir(), 'km-dist-empty-'))
  try {
    await assert.rejects(
      run(process.execPath, [SCRIPT], { env: { ...process.env, KM_DIST: dist } }),
      /dist\/index\.html is missing/
    )
  } finally {
    await rm(dist, { recursive: true, force: true })
  }
})
