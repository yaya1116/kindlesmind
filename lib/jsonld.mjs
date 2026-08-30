// schema.org JSON-LD graph, shared by index.html (the SPA shell) and every
// generated static page. Keeping it in one module means the identity an agent
// parses is identical wherever it lands.
//
// index.html embeds the homepage graph literally; tests/jsonld.test.mjs asserts
// the embedded copy still matches what this module produces.

import { SITE, PAGE_BY_SLUG } from './content.mjs'

const ORG_ID = `${SITE.origin}/#organization`
const SITE_ID = `${SITE.origin}/#website`
const APP_ID = `${SITE.origin}/#webapp`

/** Organization node — the entity an agent resolves the brand to. */
export function organizationNode() {
  return {
    '@type': 'Organization',
    '@id': ORG_ID,
    name: SITE.name,
    legalName: SITE.legalName,
    alternateName: 'KindlesMind 依附類型診斷',
    url: `${SITE.origin}/`,
    logo: {
      '@type': 'ImageObject',
      url: `${SITE.origin}/android-chrome-512x512.png`,
      width: 512,
      height: 512,
    },
    image: `${SITE.origin}${SITE.ogImage}`,
    description: SITE.description,
    email: SITE.supportEmail,
    address: {
      '@type': 'PostalAddress',
      addressCountry: SITE.addressCountry,
    },
    contactPoint: [
      {
        '@type': 'ContactPoint',
        contactType: 'customer support',
        email: SITE.supportEmail,
        url: `${SITE.origin}/contact`,
        availableLanguage: ['zh-Hant', 'zh-TW'],
        areaServed: SITE.addressCountry,
      },
      {
        '@type': 'ContactPoint',
        contactType: 'sales',
        email: SITE.businessEmail,
        url: `${SITE.origin}/contact`,
        availableLanguage: ['zh-Hant', 'zh-TW'],
        areaServed: SITE.addressCountry,
      },
    ],
  }
}

/** WebSite node — enables site-level entity resolution. */
export function webSiteNode() {
  return {
    '@type': 'WebSite',
    '@id': SITE_ID,
    name: SITE.name,
    url: `${SITE.origin}/`,
    description: SITE.description,
    inLanguage: SITE.language,
    publisher: { '@id': ORG_ID },
  }
}

/** WebApplication node — the quiz itself, with its freemium offers. */
export function webApplicationNode() {
  return {
    '@type': 'WebApplication',
    '@id': APP_ID,
    name: SITE.name,
    url: `${SITE.origin}/`,
    applicationCategory: 'HealthApplication',
    applicationSubCategory: '依附類型心理測驗',
    operatingSystem: 'Web',
    browserRequirements: 'Requires JavaScript. Requires a modern browser.',
    inLanguage: SITE.language,
    description: SITE.description,
    featureList: [
      '28 題依附類型自評測驗',
      '親密焦慮／親密迴避／原生家庭印記／衝突應激模式 四向度計分',
      '12 種依附原型與診斷代碼',
      '完整報告：成因分析、伴侶解碼、三個月療癒處方箋',
    ],
    isAccessibleForFree: true,
    publisher: { '@id': ORG_ID },
    offers: [
      {
        '@type': 'Offer',
        name: '免費測驗與結果預覽',
        price: '0',
        priceCurrency: 'TWD',
        availability: 'https://schema.org/InStock',
        url: `${SITE.origin}/`,
      },
      {
        '@type': 'Offer',
        name: '完整診斷報告解鎖',
        price: '399',
        priceCurrency: 'TWD',
        availability: 'https://schema.org/InStock',
        category: 'DigitalContent',
        url: `${SITE.origin}/`,
      },
    ],
  }
}

/**
 * The graph for a given page slug.
 * @param {string} slug a key of PAGE_BY_SLUG
 */
export function graphForPage(slug) {
  const page = PAGE_BY_SLUG[slug]
  if (!page) throw new Error(`Unknown page slug: ${slug}`)

  const nodes = [organizationNode(), webSiteNode()]

  if (slug === 'home') {
    nodes.push(webApplicationNode())
  } else {
    nodes.push({
      '@type': 'WebPage',
      '@id': `${SITE.origin}${page.path}#webpage`,
      url: `${SITE.origin}${page.path}`,
      name: page.title,
      description: page.description,
      inLanguage: SITE.language,
      isPartOf: { '@id': SITE_ID },
      about: { '@id': ORG_ID },
      publisher: { '@id': ORG_ID },
      dateModified: SITE.lastModified,
    })
  }

  return { '@context': 'https://schema.org', '@graph': nodes }
}

/**
 * Serialised, ready to drop inside a <script type="application/ld+json"> tag.
 *
 * `<` is escaped so a stray `</script>` in any description can never close the
 * tag early and turn page copy into markup. `<` is valid JSON and parses
 * back to the same string.
 */
export function graphScript(slug, indent = 2) {
  return JSON.stringify(graphForPage(slug), null, indent).replace(/</g, '\\u003C')
}
