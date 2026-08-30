#!/usr/bin/env node
// Post-build step. Runs after `vite build` and produces every JS-free /
// machine-readable surface of the site:
//
//   dist/pages/home.html      the Vite app shell, relocated
//   dist/pages/<slug>.html    static trust-anchor pages rendered from Markdown
//   dist/sitemap.xml          indexable URLs with <lastmod>
//   dist/llms.txt             llmstxt.org index incl. a "When to use this" section
//   dist/robots.txt           crawl rules + sitemap pointer
//
// The app shell is deliberately MOVED out of dist/index.html rather than
// copied. Vercel gives the filesystem precedence over rewrites, so as long as
// a file exists at the output root the `/` URL can never be routed by Accept
// negotiation. With no dist/index.html, vercel.json owns `/` completely.

import { mkdir, readFile, writeFile, rm, access } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import {
  PAGES,
  SITE,
  LLMS_TXT,
  AGENT_INSTRUCTIONS,
  AGENT_INSTRUCTIONS_PATH,
} from '../lib/content.mjs'
import { renderPage } from '../lib/page-html.mjs'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
// KM_DIST lets tests point the build at a scratch directory.
const DIST = process.env.KM_DIST ? resolve(process.env.KM_DIST) : join(ROOT, 'dist')

const exists = async p => access(p).then(() => true, () => false)

function buildSitemap() {
  const urls = PAGES.map(
    page => `  <url>
    <loc>${SITE.origin}${page.path}</loc>
    <lastmod>${SITE.lastModified}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`
  ).join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`
}

function buildRobots() {
  return `# ${SITE.name}
# Agent-readable index: ${SITE.origin}/llms.txt
# When to use this site: ${SITE.origin}${AGENT_INSTRUCTIONS_PATH}
# Every page also has a Markdown variant: send "Accept: text/markdown"
# or append ".md" to the path.

User-agent: *
Allow: /
Disallow: /pages/
Disallow: /api/

Sitemap: ${SITE.origin}/sitemap.xml
`
}

async function main() {
  if (!(await exists(DIST))) {
    throw new Error(`dist/ not found at ${DIST} — run \`vite build\` first.`)
  }

  await mkdir(join(DIST, 'pages'), { recursive: true })

  // 1. Relocate the SPA shell so that `/` has no filesystem match.
  const viteIndex = join(DIST, 'index.html')
  if (await exists(viteIndex)) {
    const shell = await readFile(viteIndex, 'utf8')
    await writeFile(join(DIST, 'pages', 'home.html'), shell)
    await rm(viteIndex)
  } else if (!(await exists(join(DIST, 'pages', 'home.html')))) {
    throw new Error('dist/index.html is missing and dist/pages/home.html was never written.')
  }

  // 2. Static, JavaScript-free trust-anchor pages.
  const generated = PAGES.filter(page => page.generated)
  for (const page of generated) {
    await writeFile(join(DIST, 'pages', `${page.slug}.html`), renderPage(page))
  }

  // 3. Machine-readable index files.
  await writeFile(join(DIST, 'sitemap.xml'), buildSitemap())
  await writeFile(join(DIST, 'llms.txt'), LLMS_TXT)
  await writeFile(join(DIST, 'robots.txt'), buildRobots())
  await writeFile(join(DIST, AGENT_INSTRUCTIONS_PATH.slice(1)), AGENT_INSTRUCTIONS)

  const names = generated.map(p => p.slug).join(', ')
  console.log(
    `[build-content] pages/home.html + ${generated.length} static pages (${names}); ` +
      `sitemap.xml, llms.txt, robots.txt, ${AGENT_INSTRUCTIONS_PATH.slice(1)} written.`
  )
}

main().catch(err => {
  console.error('[build-content]', err.message)
  process.exit(1)
})
