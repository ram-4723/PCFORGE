import test from 'node:test'
import assert from 'node:assert/strict'
import { getBuildTotal } from './pricing.js'

test('sums only selected components and accepts a zero-priced selected part', () => {
  assert.equal(getBuildTotal({ cpu: { price: 22000 }, gpu: { price: 0 } }), 22000)
})

test('returns unavailable for empty, missing, invalid, or unsafe totals', () => {
  assert.equal(getBuildTotal(null), null)
  assert.equal(getBuildTotal({ cpu: {} }), null)
  assert.equal(getBuildTotal({ cpu: { price: -1 } }), null)
  assert.equal(getBuildTotal({ cpu: { price: 1.5 } }), null)
  assert.equal(getBuildTotal({ cpu: { price: Number.MAX_SAFE_INTEGER }, gpu: { price: 1 } }), null)
})
