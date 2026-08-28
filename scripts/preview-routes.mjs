// A Vite preview plugin that mirrors the `rewrites` in vercel.json, so
// `npm run preview` behaves like production: clean URLs resolve to the
// relocated static pages, `Accept: text/markdown` and `.md` URLs hit the real
// api/content.js handler, and unknown paths get a real 404 from
// api/not-found.js instead of the app shell.
//
// Keep this in sync with vercel.json — tests/routing.test.mjs asserts that both
// cover exactly the same set of paths.

import { PAGES } from '../lib/content.mjs'

const MARKDOWN_ACCEPT = /text\/markdown/i

/** Give a plain Node response the small Express-ish surface Vercel handlers use. */
function vercelifyRes(res) {
  res.status = code => {
    res.statusCode = code
    return res
  }
  res.send = body => {
    res.end(body)
    return res
  }
  return res
}

function vercelifyReq(req, url) {
  req.query = Object.fromEntries(url.searchParams)
  return req
}

export default function previewRoutes() {
  return {
    name: 'kindlesmind-preview-routes',
    configurePreviewServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`)
        const pathname = url.pathname

        const byPath = PAGES.find(p => p.path === pathname)
        const byMd = PAGES.find(p => p.mdPath === pathname)
        const wantsMarkdown = MARKDOWN_ACCEPT.test(req.headers.accept || '')

        if (byMd || (byPath && wantsMarkdown)) {
          const page = byMd ?? byPath
          const params = new URLSearchParams({ page: page.slug })
          if (byMd) params.set('ext', 'md')
          const { default: handler } = await import('../api/content.js')
          return handler(vercelifyReq(req, new URL(`?${params}`, url)), vercelifyRes(res))
        }

        if (byPath) {
          // vercel.json attaches these to the clean URLs in production.
          res.setHeader('Vary', 'Accept, Accept-Encoding')
          res.setHeader(
            'Link',
            `<${byPath.mdPath}>; rel="alternate"; type="text/markdown"`
          )
          req.url = byPath.htmlFile
          return next()
        }

        // Anything the static server can also serve (assets, sitemap.xml, …)
        // stays with Vite; only genuinely unknown paths fall through to 404,
        // which the static middleware signals by calling next() again.
        return next()
      })

      // Installed last: reached only when nothing above (including Vite's own
      // static file server) produced a response.
      return () => {
        server.middlewares.use(async (req, res) => {
          const { default: handler } = await import('../api/not-found.js')
          return handler(req, vercelifyRes(res))
        })
      }
    },
  }
}
