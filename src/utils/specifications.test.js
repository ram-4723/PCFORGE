import test from 'node:test'
import assert from 'node:assert/strict'
import { specificationItems } from './specifications.js'

test('formats structured hardware values without raw database keys', () => {
  assert.deepEqual(specificationItems({ capacityGb: 32, interface: 'NVMe', wattage: 650, memoryType: 'DDR5' }), ['32 GB', 'NVMe', '650 W', 'DDR5'])
})

test('hides missing and invalid specifications', () => {
  assert.deepEqual(specificationItems({ capacity: null, interface: ' ', speed: Number.NaN, wattage: {}, notes: 'unknown' }), [])
})

test('retains clean existing specification labels', () => {
  assert.deepEqual(specificationItems([' 1 TB ', 'SATA', '', null, '80 PLUS Bronze']), ['1 TB', 'SATA', '80 PLUS Bronze'])
})
