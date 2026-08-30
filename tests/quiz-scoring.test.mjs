import test from 'node:test'
import assert from 'node:assert/strict'

import {
  DIMENSIONS,
  QUESTIONS,
  DIAG_CODE_MAP,
  PROFILES,
  encodeAnswers,
  decodeAnswers,
  calcResults,
  parseCode,
  getDimText,
} from '../src/lib/quiz.js'

// ── helpers ─────────────────────────────────────────────────────────────────

/** Seven answer weights (1–5) that sum to `total` (7–35). */
function seg(total) {
  assert.ok(total >= 7 && total <= 35, `unreachable dimension score: ${total}`)
  const w = Array(7).fill(1)
  let left = total - 7
  for (let i = 0; i < 7 && left > 0; i++) {
    const add = Math.min(4, left)
    w[i] += add
    left -= add
  }
  return w.join('')
}

/** Answers that produce exactly these four dimension scores. */
const answersFor = (a, b, c, d) => decodeAnswers(seg(a) + seg(b) + seg(c) + seg(d))

const codeFor = (a, b, c, d) => calcResults(answersFor(a, b, c, d)).diagCode.slice(0, 5)

test('the helper really produces the dimension scores each case claims', () => {
  for (const total of [7, 11, 12, 16, 17, 21, 22, 27, 28, 30, 35]) {
    const sum = seg(total).split('').reduce((n, ch) => n + Number(ch), 0)
    assert.equal(sum, total)
  }
  assert.deepEqual(calcResults(answersFor(25, 21, 10, 10)).dimScores, {
    1: 25,
    2: 21,
    3: 10,
    4: 10,
  })
})

// ── encode / decode ─────────────────────────────────────────────────────────

test('decodeAnswers rejects anything that is not 28 valid weights', () => {
  assert.equal(decodeAnswers(''), null)
  assert.equal(decodeAnswers(null), null)
  assert.equal(decodeAnswers(undefined), null)
  assert.equal(decodeAnswers('3'.repeat(27)), null, '27 answers')
  assert.equal(decodeAnswers('3'.repeat(29)), null, '29 answers')
  assert.equal(decodeAnswers('0' + '3'.repeat(27)), null, 'weight 0')
  assert.equal(decodeAnswers('6' + '3'.repeat(27)), null, 'weight 6')
  assert.equal(decodeAnswers('x'.repeat(28)), null, 'not digits')
})

test('decodeAnswers pairs every weight with the right dimension', () => {
  const decoded = decodeAnswers('1'.repeat(28))
  assert.equal(decoded.length, QUESTIONS.length)
  assert.deepEqual(
    decoded.map(a => a.dim),
    QUESTIONS.map(q => q.dim)
  )
})

test('encode → decode → encode round-trips exactly', () => {
  for (const encoded of ['1'.repeat(28), '5'.repeat(28), seg(25) + seg(21) + seg(10) + seg(10)]) {
    assert.equal(encodeAnswers(decodeAnswers(encoded)), encoded)
  }
})

// ── the 12-archetype routing table ──────────────────────────────────────────
//
// One case per branch of calcResults, written as the dimension scores
// (A = 親密焦慮, B = 親密迴避, C = 原生家庭印記, D = 衝突應激模式).

const ROUTES = [
  { name: '全向度平穩 → 安全型', scores: [21, 21, 21, 21], code: 'KM-01' },
  { name: 'A 極高 → 微光的殉道者', scores: [30, 10, 10, 10], code: 'KM-09' },
  { name: 'C 極高 → 孤獨的領跑者', scores: [10, 10, 30, 10], code: 'KM-10' },
  { name: 'D 極高、次高未達標 → 失訊的預言家', scores: [10, 10, 10, 30], code: 'KM-08' },
  { name: 'A 高 + B 高 → 曠野的復讀機', scores: [25, 21, 10, 10], code: 'KM-07' },
  { name: 'A 高 + D 高 → 暫停的焦慮家', scores: [25, 10, 10, 21], code: 'KM-03' },
  { name: 'A 高 + D 最低 → 斷線的呼喚者', scores: [25, 15, 21, 10], code: 'KM-11' },
  { name: 'A 高（其餘情況）→ 暫停的焦慮家', scores: [25, 10, 21, 15], code: 'KM-03' },
  { name: 'C 高 + A 高 → 華麗的受難者', scores: [21, 10, 25, 10], code: 'KM-05' },
  { name: 'C 高 + D 高 → 永存的瞬間', scores: [10, 10, 25, 21], code: 'KM-12' },
  { name: 'C 高（其餘情況）→ 孤獨的領跑者', scores: [10, 21, 25, 10], code: 'KM-10' },
  { name: 'B 高 + C 高 → 永恆的觀測者', scores: [10, 25, 21, 10], code: 'KM-02' },
  { name: 'B 高（其餘情況）→ 永恆的觀測者', scores: [21, 25, 10, 10], code: 'KM-02' },
  { name: 'D 高 + B 高 → 溺水的迴聲', scores: [10, 21, 10, 25], code: 'KM-04' },
  { name: 'D 高 + C 高 → 規訓的流放者', scores: [10, 10, 21, 25], code: 'KM-06' },
  { name: 'D 高（其餘情況）→ 失訊的預言家', scores: [21, 10, 10, 25], code: 'KM-08' },
]

for (const { name, scores, code } of ROUTES) {
  test(`路由：${name}`, () => {
    assert.equal(codeFor(...scores), code)
  })
}

test('the routing table can reach all 12 archetypes', () => {
  const reached = new Set(ROUTES.map(r => r.code))
  assert.deepEqual([...reached].sort(), Object.values(DIAG_CODE_MAP).sort())
})

test('every archetype key in the code map has a profile behind it', () => {
  for (const key of Object.keys(DIAG_CODE_MAP)) {
    const profile = PROFILES[key]
    assert.ok(profile, `no PROFILES entry for ${key}`)
    for (const field of ['label', 'poeticName', 'summary', 'archetype', 'rootAnalysis']) {
      assert.ok(profile[field], `${key} is missing ${field}`)
    }
  }
})

// ── threshold boundaries ────────────────────────────────────────────────────

test('the HIGH threshold sits between 21 and 22', () => {
  // Below it every dimension counts as calm, whichever one leads.
  assert.equal(codeFor(21, 20, 20, 20), 'KM-01')
  assert.equal(codeFor(22, 10, 10, 10), 'KM-03', '22 is already elevated')
})

test('the EXTREME threshold sits between 27 and 28', () => {
  assert.equal(codeFor(27, 10, 10, 10), 'KM-03')
  assert.equal(codeFor(28, 10, 10, 10), 'KM-09')
})

test('the secondary threshold sits between 19 and 20', () => {
  // At 19 B is not elevated enough to pair with A, so this falls through to the
  // plain "A 高" branch. At 20 it pairs and becomes 曠野的復讀機.
  assert.equal(codeFor(25, 19, 10, 10), 'KM-03', 'B not elevated enough to pair')
  assert.equal(codeFor(25, 20, 10, 10), 'KM-07', 'B now pairs with A')
})

test('ties resolve by dimension id descending, so results are deterministic', () => {
  const first = calcResults(answersFor(25, 25, 25, 25))
  const again = calcResults(answersFor(25, 25, 25, 25))
  assert.equal(first.profileKey, again.profileKey)
  assert.equal(first.primaryDim, 4, 'D wins an all-equal tie')
  assert.equal(first.diagCode.slice(0, 5), 'KM-06')
})

// ── diagnostic code ─────────────────────────────────────────────────────────

test('the diagnostic code always has the documented shape', () => {
  for (const { scores } of ROUTES) {
    const { diagCode } = calcResults(answersFor(...scores))
    assert.match(diagCode, /^KM-\d{2}-A[1-5]B[1-5]C[1-5]D[1-5]$/, diagCode)
  }
})

test('score buckets change at 11/12, 16/17, 21/22 and 27/28', () => {
  // KM-XX-A#B#C#D#  →  index 7 is A's bucket digit.
  const bucketOf = score => calcResults(answersFor(score, 7, 7, 7)).diagCode[7]
  assert.equal(bucketOf(11), '1')
  assert.equal(bucketOf(12), '2')
  assert.equal(bucketOf(16), '2')
  assert.equal(bucketOf(17), '3')
  assert.equal(bucketOf(21), '3')
  assert.equal(bucketOf(22), '4')
  assert.equal(bucketOf(27), '4')
  assert.equal(bucketOf(28), '5')
})

// ── parseCode ───────────────────────────────────────────────────────────────

test('parseCode accepts a code the app itself produced', () => {
  const { diagCode } = calcResults(answersFor(30, 10, 10, 10))
  const parsed = parseCode(diagCode)
  assert.ok(parsed)
  assert.equal(parsed.diagCode, diagCode)
  assert.equal(parsed.profile.poeticName, PROFILES.ac_candlelit.poeticName)
})

test('parseCode is forgiving about case and surrounding space', () => {
  assert.ok(parseCode('  km-09-a5b1c1d1  '))
})

test('parseCode rejects malformed or unknown codes', () => {
  for (const bad of [
    '',
    'KM-09',
    'KM-09-A5B1C1',
    'KM-09-A5B1C1D6',
    'KM-09-A5B1C1D0',
    'KM-99-A5B1C1D1',
    'XX-09-A5B1C1D1',
    'KM-9-A5B1C1D1',
  ]) {
    assert.equal(parseCode(bad), null, `should have rejected ${JSON.stringify(bad)}`)
  }
})

test('parseCode reconstructs every dimension bar', () => {
  const parsed = parseCode('KM-02-A1B5C3D4')
  assert.equal(parsed.dimData.length, DIMENSIONS.length)
  for (const dim of parsed.dimData) {
    assert.ok(dim.health >= 0 && dim.health <= 100, `health out of range: ${dim.health}`)
    assert.equal(dim.pct, 100 - dim.health)
  }
})

// ── derived numbers the UI draws ────────────────────────────────────────────

test('health runs 100 at the calmest score down to 0 at the most activated', () => {
  const calm = calcResults(answersFor(7, 7, 7, 7))
  assert.deepEqual(calm.dimData.map(d => d.health), [100, 100, 100, 100])

  const peak = calcResults(answersFor(35, 35, 35, 35))
  assert.deepEqual(peak.dimData.map(d => d.health), [0, 0, 0, 0])
})

test('radar percentages stay within 0–100 across the whole score range', () => {
  for (const score of [7, 14, 21, 28, 35]) {
    for (const { radarData } of [calcResults(answersFor(score, score, score, score))]) {
      for (const point of radarData) {
        assert.ok(point.pct >= 0 && point.pct <= 100, `pct ${point.pct} at score ${score}`)
      }
    }
  }
})

test('getDimText returns copy for every dimension at every band', () => {
  for (const dim of DIMENSIONS) {
    for (const health of [0, 24, 25, 49, 50, 74, 75, 100]) {
      const text = getDimText(dim.id, health)
      assert.equal(typeof text, 'string', `${dim.id} @ ${health}`)
      assert.ok(text.length > 0, `${dim.id} @ ${health} is empty`)
    }
  }
})

test('getDimText bands change at 25, 50 and 75', () => {
  for (const dim of DIMENSIONS) {
    assert.notEqual(getDimText(dim.id, 24), getDimText(dim.id, 25))
    assert.notEqual(getDimText(dim.id, 49), getDimText(dim.id, 50))
    assert.notEqual(getDimText(dim.id, 74), getDimText(dim.id, 75))
  }
})
