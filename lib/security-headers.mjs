// Security response headers, applied to every path.
//
// vercel.json is static JSON and cannot import this module, so it carries a
// copy of these values; tests/security-headers.test.mjs fails if the two drift
// apart. scripts/preview-routes.mjs applies them verbatim, which is what makes
// the policy testable locally before it ships.

/**
 * Content-Security-Policy, derived from what the app actually loads:
 *
 * - `'unsafe-inline'` in script-src covers the gtag bootstrap snippet in
 *   index.html and the inline scripts Google Tag Manager injects. It weakens
 *   the XSS benefit, but the rest of the policy still stops an injected
 *   `<script src>` from loading off an attacker's host, and stops the page
 *   being framed or its <base> being rewritten.
 * - `'unsafe-inline'` in style-src is required: Framer Motion animates through
 *   inline style attributes on almost every element.
 * - connect-src allows fonts.googleapis.com / fonts.gstatic.com because
 *   html-to-image refetches the webfont CSS and font files when it rasterises
 *   the share card; without them the "存成圖片" export silently loses its fonts.
 * - connect-src allows `data:` because the share card is read back with
 *   `fetch(dataUrl)` before being turned into a Blob.
 * - media-src covers the per-archetype .mp4 animations served from /animations.
 */
export const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  "script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://www.google-analytics.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' data: https://fonts.gstatic.com",
  "img-src 'self' data: blob: https://www.googletagmanager.com https://www.google-analytics.com",
  "media-src 'self' blob:",
  "connect-src 'self' data: blob: https://fonts.googleapis.com https://fonts.gstatic.com https://www.googletagmanager.com https://www.google-analytics.com https://*.google-analytics.com https://*.analytics.google.com",
  "manifest-src 'self'",
  "worker-src 'self' blob:",
  'upgrade-insecure-requests',
].join('; ')

/** Applied to `/(.*)` — every HTML page, asset, function response and 404. */
export const SECURITY_HEADERS = [
  { key: 'Content-Security-Policy', value: CONTENT_SECURITY_POLICY },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()',
  },
]
