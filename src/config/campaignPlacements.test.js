import test from 'node:test'
import assert from 'node:assert/strict'
import { demoCampaigns } from './campaigns.js'
import { campaignPlacements, getCampaignById, shouldPlaceCatalogueCampaign } from './campaignPlacements.js'

test('curated page placements resolve to existing, stable campaign IDs', () => {
  const ids = new Set(demoCampaigns.map(({ id }) => id))
  assert.ok(ids.has(campaignPlacements.homeFeatured))
  assert.ok(ids.has(campaignPlacements.peripheralsFeature))
  for (const id of Object.values(campaignPlacements.componentsByCategory)) assert.ok(ids.has(id))
})

test('component categories select only their relevant campaign', () => {
  assert.equal(campaignPlacements.componentsByCategory['Graphics Cards (GPU)'], 'gpu-spotlight')
  assert.equal(campaignPlacements.componentsByCategory['Processors (CPU)'], 'cpu-focus')
  assert.equal(campaignPlacements.componentsByCategory['CPU Coolers'], 'noctua-cooling')
  assert.equal(campaignPlacements.componentsByCategory['PC Cabinets and Cases'], 'nzxt-builds')
  assert.equal(campaignPlacements.componentsByCategory.RAM, 'corsair-gear')
  assert.equal(campaignPlacements.componentsByCategory['Gaming Mice'], 'razer-viper')
  assert.equal(campaignPlacements.componentsByCategory.Keyboards, 'corsair-keyboard-lcd')
  assert.equal(campaignPlacements.componentsByCategory.all, 'corsair-gear')
  assert.equal(campaignPlacements.componentsByCategory.Monitors, undefined)
})

test('campaign lookup skips missing and paused placements', () => {
  assert.equal(getCampaignById(demoCampaigns, 'missing'), null)
  assert.equal(getCampaignById([{ id: 'paused', campaignStatus: 'Paused' }], 'paused'), null)
  assert.equal(getCampaignById(demoCampaigns, 'gpu-spotlight').id, 'gpu-spotlight')
})

test('a catalogue section gets at most one campaign after a product row', () => {
  for (const count of [0, 1, 2, 3, 4, 7]) {
    const placements = Array.from({ length: count }, (_, index) => shouldPlaceCatalogueCampaign(index, count)).filter(Boolean)
    assert.equal(placements.length, count === 0 ? 0 : 1)
  }
  assert.equal(shouldPlaceCatalogueCampaign(3, 8), true)
  assert.equal(shouldPlaceCatalogueCampaign(4, 8), false)
})
