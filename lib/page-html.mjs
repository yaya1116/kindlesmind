// Renders a JS-free HTML page from a Markdown body. The output is fully
// self-contained (inline CSS, no scripts) so a crawler that never runs
// JavaScript still sees the complete page, and so does a reader whose bundle
// failed to load.

import { marked } from 'marked'
import { SITE } from './content.mjs'
import { graphScript } from './jsonld.mjs'

marked.setOptions({ gfm: true, breaks: false })

const escapeHtml = str =>
  String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')

/** Brand-matched styles, mirroring tailwind.config.js and src/index.css. */
const STYLES = `
  :root {
    --bg: #F4EEFF;
    --surface: #FFFFFF;
    --text: #2B1A42;
    --muted: #8060A8;
    --light: #B898D8;
    --violet: #DC8DF3;
    --cyan: #33ABD3;
    --border: #D8C8F4;
  }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    background: var(--bg);
    color: var(--text);
    font-family: 'Noto Sans TC', system-ui, -apple-system, sans-serif;
    font-size: 15px;
    line-height: 1.85;
    letter-spacing: 0.02em;
    -webkit-text-size-adjust: 100%;
  }
  .wrap { max-width: 42rem; margin: 0 auto; padding: 2rem 1.25rem 4rem; }
  .back {
    display: inline-flex; align-items: center; gap: .4rem;
    color: var(--muted); text-decoration: none; font-size: .82rem; margin-bottom: 2rem;
  }
  .back:hover { color: var(--violet); }
  .brand { display: flex; align-items: center; gap: .55rem; margin-bottom: 1.5rem; }
  .brand img { width: 28px; height: 28px; border-radius: 8px; }
  .brand span {
    font-family: 'Noto Serif TC', Georgia, serif;
    font-weight: 600; font-size: .95rem;
  }
  article { background: var(--surface); border: 1px solid var(--border);
    border-radius: 1.5rem; padding: 2rem 1.75rem;
    box-shadow: 0 4px 20px rgba(220, 141, 243, 0.14); }
  article h1 {
    font-family: 'Noto Serif TC', Georgia, serif;
    font-size: 1.75rem; line-height: 1.4; font-weight: 700;
    margin: 0 0 1.5rem;
  }
  article h2 {
    font-family: 'Noto Serif TC', Georgia, serif;
    font-size: 1.15rem; font-weight: 600;
    margin: 2.25rem 0 .75rem; padding-left: .7rem;
    border-left: 3px solid var(--cyan);
  }
  article h3 { font-size: 1rem; font-weight: 600; margin: 1.5rem 0 .5rem; }
  article p, article li { color: var(--muted); }
  article strong { color: var(--text); font-weight: 600; }
  article a { color: var(--cyan); text-decoration: underline; text-underline-offset: 2px; }
  article a:hover { color: var(--violet); }
  article ul, article ol { padding-left: 1.25rem; }
  article li { margin: .3rem 0; }
  article code {
    background: #EBE0FF; color: var(--text);
    padding: .1rem .35rem; border-radius: .3rem; font-size: .88em;
  }
  article hr { border: 0; border-top: 1px solid var(--border); margin: 2rem 0; }
  footer { margin-top: 2.5rem; text-align: center; font-size: .78rem; color: var(--light); }
  footer nav { display: flex; flex-wrap: wrap; gap: 1.1rem; justify-content: center; margin-bottom: .9rem; }
  footer a { color: var(--muted); text-decoration: none; }
  footer a:hover { color: var(--violet); }
`
  .replace(/\n\s*/g, '\n')
  .trim()

/**
 * @param {import('./content.mjs').PAGES[number]} page
 * @returns {string} a complete HTML document
 */
export function renderPage(page) {
  const canonical = `${SITE.origin}${page.path}`
  const body = marked.parse(page.markdown)

  const navLinks = [
    ['/', '首頁'],
    ['/about', '關於我們'],
    ['/contact', '聯絡我們'],
    ['/privacy', '隱私權政策'],
    ['/terms', '服務條款'],
  ]
    .filter(([href]) => href !== page.path)
    .map(([href, label]) => `<a href="${href}">${label}</a>`)
    .join('\n        ')

  return `<!doctype html>
<html lang="${SITE.locale}">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(page.title)}</title>
    <meta name="description" content="${escapeHtml(page.description)}" />
    <link rel="canonical" href="${canonical}" />
    <link rel="alternate" type="text/markdown" href="${SITE.origin}${page.mdPath}" />
    <link rel="icon" type="image/x-icon" href="/favicon.ico" />
    <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
    <link rel="manifest" href="/site.webmanifest" />
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="${SITE.name}" />
    <meta property="og:title" content="${escapeHtml(page.title)}" />
    <meta property="og:description" content="${escapeHtml(page.description)}" />
    <meta property="og:url" content="${canonical}" />
    <meta property="og:locale" content="zh_TW" />
    <meta property="og:image" content="${SITE.origin}${SITE.ogImage}" />
    <meta property="og:image:width" content="${SITE.ogImageWidth}" />
    <meta property="og:image:height" content="${SITE.ogImageHeight}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeHtml(page.title)}" />
    <meta name="twitter:description" content="${escapeHtml(page.description)}" />
    <meta name="twitter:image" content="${SITE.origin}${SITE.ogImage}" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Noto+Serif+TC:wght@400;600;700&family=Noto+Sans+TC:wght@300;400;500&display=swap" rel="stylesheet" />
    <style>${STYLES}</style>
    <script type="application/ld+json">
${graphScript(page.slug)}
    </script>
  </head>
  <body>
    <div class="wrap">
      <a class="back" href="/">← 返回 ${SITE.name}</a>
      <div class="brand">
        <img src="/android-chrome-192x192.png" alt="${SITE.name}" width="28" height="28" />
        <span>${SITE.name}</span>
      </div>
      <article>
${body.trimEnd()}
      </article>
      <footer>
        <nav>
        ${navLinks}
        </nav>
        <p>© 2026 ${SITE.legalName} All Rights Reserved.</p>
      </footer>
    </div>
  </body>
</html>
`
}
