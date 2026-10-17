// Page placements reference existing campaign records by stable ID.
export const campaignPlacements = {
  homeFeatured: 'gpu-spotlight',
  componentsByCategory: {
    all: 'corsair-gear',
    'Graphics Cards (GPU)': 'gpu-spotlight',
    'Processors (CPU)': 'cpu-focus',
    'PC Cabinets and Cases': 'nzxt-builds',
    RAM: 'corsair-gear',
    'Gaming Mice': 'razer-viper',
    Keyboards: 'corsair-keyboard-lcd',
    'CPU Coolers': 'noctua-cooling',
  },
  peripheralsFeature: 'razer-viper',
}

export function getCampaignById(campaigns, id) {
  if (!id) return null
  return campaigns.find((campaign) => campaign.id === id && campaign.campaignStatus !== 'Paused') || null
}

export function shouldPlaceCatalogueCampaign(index, productCount) {
  if (productCount <= 0) return false
  return productCount >= 4 ? index === 3 : index === productCount - 1
}
