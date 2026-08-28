import test from 'node:test'
import assert from 'node:assert/strict'

import { parseAccept, qualityFor, selectMediaType } from '../lib/negotiate.mjs'

const MD = 'text/markdown'
const HTML = 'text/html'

test('parseAccept: empty or missing header yields no ranges', () => {
  assert.deepEqual(parseAccept(undefined), [])
  assert.deepEqual(parseAccept(null), [])
  assert.deepEqual(parseAccept('   '), [])
})

test('parseAccept: reads media ranges and q-values', () => {
  const ranges = parseAccept('text/markdown, text/html;q=0.5, */*;q=0.1')
  assert.deepEqual(
    ranges.map(r => [`${r.type}/${r.subtype}`, r.q, r.specificity]),
    [
      ['text/markdown', 1, 2],
      ['text/html', 0.5, 2],
      ['*/*', 0.1, 0],
    ]
  )
})

test('parseAccept: clamps out-of-range q and tolerates junk', () => {
  assert.equal(parseAccept('text/html;q=5')[0].q, 1)
  assert.equal(parseAccept('text/html;q=-2')[0].q, 0)
  assert.equal(parseAccept('text/html;q=abc')[0].q, 1)
})

test('qualityFor: absent Accept means anything is acceptable', () => {
  assert.equal(qualityFor(undefined, MD), 1)
  assert.equal(qualityFor('', HTML), 1)
})

test('qualityFor: wildcards match, most specific range wins', () => {
  assert.equal(qualityFor('*/*', MD), 1)
  assert.equal(qualityFor('text/*;q=0.6', MD), 0.6)
  // The exact range must beat the wildcard even though it is listed second.
  assert.equal(qualityFor('*/*;q=0.2, text/markdown;q=0.9', MD), 0.9)
  assert.equal(qualityFor('text/markdown;q=0.9, */*;q=0.2', HTML), 0.2)
})

test('qualityFor: unlisted types with no wildcard are not acceptable', () => {
  assert.equal(qualityFor('application/pdf', MD), 0)
  assert.equal(qualityFor('image/png, image/webp', HTML), 0)
})

test('qualityFor: q=0 explicitly rejects a type', () => {
  assert.equal(qualityFor('text/markdown;q=0, */*', MD), 0)
})

test('qualityFor: parameters other than q are ignored', () => {
  assert.equal(qualityFor('text/markdown;charset=utf-8;q=0.4', MD), 0.4)
})

test('selectMediaType: plain markdown request gets markdown', () => {
  assert.equal(selectMediaType(MD, [MD, HTML]), MD)
})

test('selectMediaType: honours q-values when both are on offer', () => {
  assert.equal(selectMediaType('text/html;q=0.9, text/markdown;q=0.5', [MD, HTML]), HTML)
  assert.equal(selectMediaType('text/html;q=0.5, text/markdown;q=0.9', [MD, HTML]), MD)
})

test('selectMediaType: ties go to the server preference order', () => {
  assert.equal(selectMediaType('text/markdown, text/html', [MD, HTML]), MD)
  assert.equal(selectMediaType('text/markdown, text/html', [HTML, MD]), HTML)
})

test('selectMediaType: a typical browser Accept resolves to HTML', () => {
  const browser =
    'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8'
  assert.equal(selectMediaType(browser, [HTML, MD]), HTML)
})

test('selectMediaType: returns null when nothing on offer is acceptable', () => {
  assert.equal(selectMediaType('application/pdf', [MD, HTML]), null)
  assert.equal(selectMediaType('text/markdown;q=0', [MD]), null)
})
