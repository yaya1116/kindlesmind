// Real HTTP 404s for unknown paths.
//
// The SPA used to be served by a `/(.*) -> /index.html` rewrite, so every
// probe returned 200 with the app shell and an agent had to conclude that
// every path existed. vercel.json now sends only unmatched paths here, and
// this function answers 404 with a body that points at the site's index files.

import { PAGES, SITE, NOT_FOUND_MARKDOWN } from '../lib/content.mjs'
import { selectMediaType } from '../lib/negotiate.mjs'

const MARKDOWN = 'text/markdown'
const HTML = 'text/html'

const escapeHtml = str =>
  String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')

export default function handler(req, res) {
  const path = requestedPath(req)

  res.setHeader('Vary', 'Accept, Accept-Encoding')
  res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=60')
  res.setHeader('X-Robots-Tag', 'noindex')

  // HTML first: a person who mistypes a URL should get the branded page.
  const chosen = selectMediaType(req.headers.accept, [HTML, MARKDOWN])

  if (chosen === MARKDOWN) {
    res.setHeader('Content-Type', 'text/markdown; charset=utf-8')
    return res.status(404).send(NOT_FOUND_MARKDOWN.replace('{{PATH}}', path))
  }

  if (chosen === null) {
    res.setHeader('Content-Type', 'text/plain; charset=utf-8')
    return res.status(404).send(`404 Not Found: ${path}\n\nSee ${SITE.origin}/llms.txt\n`)
  }

  res.setHeader('Content-Type', 'text/html; charset=utf-8')
  return res.status(404).send(renderHtml(path))
}

function requestedPath(req) {
  try {
    return new URL(req.url, `https://${req.headers.host || 'localhost'}`).pathname
  } catch {
    return req.url || '/'
  }
}

function renderHtml(path) {
  const links = PAGES.map(
    page => `        <li><a href="${page.path}">${escapeHtml(page.title)}</a></li>`
  ).join('\n')

  return `<!doctype html>
<html lang="${SITE.locale}">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>404 — 找不到這個頁面｜${SITE.name}</title>
    <meta name="robots" content="noindex" />
    <link rel="icon" type="image/x-icon" href="/favicon.ico" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Noto+Serif+TC:wght@600;700&family=Noto+Sans+TC:wght@300;400&display=swap" rel="stylesheet" />
    <style>
      body { margin:0; background:#F4EEFF; color:#2B1A42;
        font-family:'Noto Sans TC',system-ui,sans-serif; font-size:15px; line-height:1.85; }
      .wrap { max-width:34rem; margin:0 auto; padding:5rem 1.5rem; text-align:center; }
      .code { font-family:'Noto Serif TC',Georgia,serif; font-size:3.5rem; font-weight:700;
        background:linear-gradient(135deg,#DC8DF3,#33ABD3); -webkit-background-clip:text;
        background-clip:text; color:transparent; margin:0; }
      h1 { font-family:'Noto Serif TC',Georgia,serif; font-size:1.35rem; margin:.5rem 0 1rem; }
      p { color:#8060A8; }
      code { background:#EBE0FF; padding:.1rem .4rem; border-radius:.3rem; font-size:.9em; }
      ul { list-style:none; padding:0; margin:2rem 0 0; }
      li { margin:.5rem 0; }
      a { color:#33ABD3; text-decoration:none; }
      a:hover { color:#DC8DF3; text-decoration:underline; }
      .agents { margin-top:2.5rem; font-size:.8rem; color:#B898D8; }
    </style>
  </head>
  <body>
    <div class="wrap">
      <p class="code">404</p>
      <h1>找不到這個頁面</h1>
      <p><code>${escapeHtml(path)}</code> 在 ${SITE.name} 上不存在。</p>
      <ul>
${links}
      </ul>
      <p class="agents">
        給代理程式：<a href="/llms.txt">/llms.txt</a> ·
        <a href="/sitemap.xml">/sitemap.xml</a> ·
        <a href="/robots.txt">/robots.txt</a>
      </p>
    </div>
  </body>
</html>
`
}
