import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

// These are static source checks, not rendered-DOM checks: the project has no
// jsdom or testing-library, and the point here is to stop the accessibility
// affordances being deleted by accident, not to re-test React.

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const app = await readFile(join(ROOT, 'src', 'App.jsx'), 'utf8')
const css = await readFile(join(ROOT, 'src', 'index.css'), 'utf8')

/** Every `<button>` / `<motion.button>` with its opening tag and children. */
function buttons(source) {
  const out = []
  const re = /<(motion\.)?button\b/g
  let m
  while ((m = re.exec(source)) !== null) {
    const close = source.indexOf(`</${m[1] ?? ''}button>`, m.index)
    out.push({ line: source.slice(0, m.index).split('\n').length, html: source.slice(m.index, close) })
  }
  return out
}

test('motion respects the reduced-motion preference globally', () => {
  assert.match(app, /import \{[^}]*\bMotionConfig\b[^}]*\} from 'framer-motion'/)
  assert.match(app, /<MotionConfig reducedMotion="user">/)
})

test('CSS animations are disabled under prefers-reduced-motion', () => {
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/)
  assert.match(css, /animation-duration:\s*0\.01ms\s*!important/)
  assert.match(css, /transition-duration:\s*0\.01ms\s*!important/)
})

test('the archetype video does not autoplay or loop under reduced motion', () => {
  assert.match(app, /const prefersReducedMotion = useReducedMotion\(\)/)
  assert.match(app, /autoPlay=\{!prefersReducedMotion\}/)
  assert.match(app, /loop=\{!prefersReducedMotion\}/)
  // …and the viewer still gets a way to play it themselves.
  assert.match(app, /controls=\{prefersReducedMotion\}/)
  // The iOS Safari autoplay fix must survive for everyone else.
  assert.match(app, /if \(!prefersReducedMotion\) e\.currentTarget\.play\(\)/)
})

test('the page exposes landmarks a screen reader can navigate by', () => {
  assert.match(app, /<main className="relative z-10">/)
  assert.match(app, /<\/main>/)
  assert.match(app, /<nav aria-label="法律資訊"/)
  assert.match(app, /<footer/)
})

test('every button has an accessible name', () => {
  const unnamed = buttons(app).filter(b => {
    if (/aria-label=/.test(b.html)) return false
    const children = b.html.slice(b.html.indexOf('>') + 1)
    // Strip JSX expressions and tags; what is left is literal text.
    const text = children
      .replace(/\{[^{}]*(\{[^{}]*\}[^{}]*)*\}/g, '')
      .replace(/<[^>]*>/g, '')
      .replace(/\s+/g, '')
    return text.length === 0
  })
  assert.deepEqual(
    unnamed.map(b => `App.jsx:${b.line}`),
    [],
    'these buttons have neither aria-label nor visible text'
  )
})

test('the diagnostic code field is labelled and reports its errors', () => {
  assert.match(app, /aria-label="診斷代碼"/)
  assert.match(app, /aria-invalid=\{codeError\}/)
  assert.match(app, /aria-describedby=\{codeError \? 'code-error' : undefined\}/)
  assert.match(app, /id="code-error" role="alert"/)
})

test('quiz progress is exposed as a progressbar, not just a coloured bar', () => {
  assert.match(app, /role="progressbar"/)
  assert.match(app, /aria-valuenow=\{currentQ \+ 1\}/)
  assert.match(app, /aria-valuemax=\{QUESTIONS\.length\}/)
  assert.match(app, /aria-valuetext=/)
})

test('every image still carries alt text', () => {
  const imgs = app.match(/<img\b[^>]*>/g) ?? []
  assert.ok(imgs.length > 0)
  for (const img of imgs) assert.match(img, /\balt=/, img)
})
