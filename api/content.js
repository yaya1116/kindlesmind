// Markdown representations of the site's pages, per acceptmarkdown.com.
//
// Reached two ways (see the `rewrites` in vercel.json):
//   1. a clean URL whose `Accept` header mentions text/markdown  → ?page=<slug>
//   2. the explicit `.md` variant of that URL                    → ?page=<slug>&ext=md
//
// Case 1 can still legitimately prefer HTML (`Accept: text/html;q=0.9,
// text/markdown;q=0.5`), so the HTML representation stays on offer and is
// proxied from the static shell when the client's q-values ask for it.

import { PAGE_BY_SLUG, SITE } from '../lib/content.mjs'
import { selectMediaType } from '../lib/negotiate.mjs'

const MARKDOWN = 'text/markdown'
const HTML = 'text/html'

const VARY = 'Accept, Accept-Encoding'
const CACHE = 'public, max-age=0, s-maxage=600, stale-while-revalidate=86400'

export default async function handler(req, res) {
  const slug = typeof req.query?.page === 'string' ? req.query.page : ''
  const page = PAGE_BY_SLUG[slug]

  res.setHeader('Vary', VARY)

  if (!page) {
    // Only reachable if vercel.json points here with an unknown slug.
    res.setHeader('Content-Type', 'text/plain; charset=utf-8')
    return res.status(404).send('Not Found\n')
  }

  const canonical = `${SITE.origin}${page.path}`
  // The `.md` URL is an explicit request for Markdown; the clean URL is not.
  const explicitMarkdown = req.query?.ext === 'md'
  const offers = explicitMarkdown ? [MARKDOWN] : [MARKDOWN, HTML]
  const chosen = selectMediaType(req.headers.accept, offers)

  res.setHeader(
    'Link',
    `<${canonical}>; rel="canonical", <${SITE.origin}${page.mdPath}>; rel="alternate"; type="text/markdown"`
  )

  if (chosen === null) {
    res.setHeader('Content-Type', 'text/plain; charset=utf-8')
    return res
      .status(406)
      .send(`Not Acceptable\n\nThis resource is available as: ${offers.join(', ')}\n`)
  }

  if (chosen === HTML) {
    const proxied = await fetchShell(req, page.htmlFile)
    if (proxied !== null) {
      res.setHeader('Content-Type', 'text/html; charset=utf-8')
      res.setHeader('Cache-Control', CACHE)
      return res.status(200).send(proxied)
    }
    // Fall through to Markdown rather than failing the request outright.
  }

  res.setHeader('Content-Type', 'text/markdown; charset=utf-8')
  res.setHeader('Cache-Control', CACHE)
  res.setHeader('X-Robots-Tag', 'noindex')
  return res.status(200).send(page.markdown)
}

const CANONICAL_HOST = new URL(SITE.origin).host
const APEX_HOST = CANONICAL_HOST.replace(/^www\./, '')

/**
 * Only ever fetch from a host we know is us.
 *
 * `Host` and `X-Forwarded-Host` are client-supplied, so using either one
 * unchecked to build a fetch URL is server-side request forgery: an attacker
 * sets the header, we fetch their server, and we hand the response back under
 * our own origin. The allowlist keeps the request on this deployment.
 */
export function isTrustedHost(host) {
  if (typeof host !== 'string' || host === '') return false
  const name = host.toLowerCase()
  return (
    name === CANONICAL_HOST ||
    name === APEX_HOST ||
    name === (process.env.VERCEL_URL ?? '').toLowerCase() ||
    /^[a-z0-9-]+(\.[a-z0-9-]+)*\.vercel\.app$/.test(name) ||
    /^(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/.test(name)
  )
}

/**
 * Fetch the static HTML representation from this same deployment.
 * `htmlFile` is a real file under dist/, so it is served by the filesystem and
 * never routed back through this function.
 *
 * @returns {Promise<string | null>} the HTML, or null if it could not be read
 */
async function fetchShell(req, htmlFile) {
  const host = req.headers['x-forwarded-host'] || req.headers.host
  if (!isTrustedHost(host)) return null

  const local = /^(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/.test(host.toLowerCase())
  const proto = local ? 'http' : 'https'
  try {
    const upstream = await fetch(`${proto}://${host}${htmlFile}`, {
      headers: { accept: HTML },
      redirect: 'error',
    })
    if (!upstream.ok) return null
    return await upstream.text()
  } catch {
    return null
  }
}
