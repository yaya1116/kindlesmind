// HTTP content negotiation for the `Accept` request header.
//
// Implements the media-range matching and quality-value rules from
// RFC 9110 §12.5.1, which is what acceptmarkdown.com builds on:
//   - a media range is `type/subtype` with optional parameters
//   - `*/*` and `type/*` are wildcards, matched with lower precedence
//   - `q=0` means "not acceptable"
//   - when nothing acceptable is on offer the server answers 406

/**
 * Parse an Accept header into ranges, tagged with their precedence.
 * Precedence = specificity first (an exact range beats a subtype wildcard,
 * which beats a full wildcard), then q, then the order they were listed in.
 *
 * @param {string | undefined | null} header
 * @returns {{ type: string, subtype: string, q: number, specificity: number, order: number }[]}
 */
export function parseAccept(header) {
  if (typeof header !== 'string' || header.trim() === '') return []

  return header
    .split(',')
    .map((part, order) => {
      const [rawRange, ...params] = part.split(';')
      const range = rawRange.trim().toLowerCase()
      if (!range) return null

      const slash = range.indexOf('/')
      const type = slash === -1 ? range : range.slice(0, slash)
      const subtype = slash === -1 ? '*' : range.slice(slash + 1)
      if (!type) return null

      let q = 1
      for (const param of params) {
        const eq = param.indexOf('=')
        if (eq === -1) continue
        if (param.slice(0, eq).trim().toLowerCase() !== 'q') continue
        const parsed = Number.parseFloat(param.slice(eq + 1).trim())
        // An unparsable q is treated as 1, matching lenient real-world parsers.
        q = Number.isNaN(parsed) ? 1 : Math.min(Math.max(parsed, 0), 1)
        break
      }

      const specificity = type === '*' ? 0 : subtype === '*' ? 1 : 2
      return { type, subtype, q, specificity, order }
    })
    .filter(Boolean)
}

/**
 * The quality the client assigned to a concrete media type, or 0 when the
 * client did not accept it at all. An absent/empty Accept header means
 * "anything is fine" and yields 1.
 *
 * @param {string | undefined | null} header
 * @param {string} mediaType e.g. "text/markdown"
 * @returns {number} 0–1
 */
export function qualityFor(header, mediaType) {
  const ranges = parseAccept(header)
  if (ranges.length === 0) return 1

  const slash = mediaType.indexOf('/')
  const type = mediaType.slice(0, slash).toLowerCase()
  const subtype = mediaType.slice(slash + 1).toLowerCase()

  let best = null
  for (const range of ranges) {
    const matches =
      (range.type === '*' && range.subtype === '*') ||
      (range.type === type && range.subtype === '*') ||
      (range.type === type && range.subtype === subtype)
    if (!matches) continue
    // Most specific range wins; ties go to the earliest listed range.
    if (
      best === null ||
      range.specificity > best.specificity ||
      (range.specificity === best.specificity && range.order < best.order)
    ) {
      best = range
    }
  }

  return best === null ? 0 : best.q
}

/**
 * Pick the best representation to send.
 *
 * @param {string | undefined | null} header the raw Accept header
 * @param {string[]} offers media types the endpoint can produce, in server
 *   preference order (most preferred first)
 * @returns {string | null} the chosen media type, or null when the client
 *   accepts none of them (the caller should answer 406)
 */
export function selectMediaType(header, offers) {
  let chosen = null
  let chosenQ = 0

  for (const offer of offers) {
    const q = qualityFor(header, offer)
    if (q > chosenQ) {
      chosen = offer
      chosenQ = q
    }
  }

  return chosen
}
