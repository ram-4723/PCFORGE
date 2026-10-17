const labels = {
  capacity: 'Capacity', capacityGb: 'Memory', interface: 'Interface', wattage: 'Power',
  memoryType: 'Memory type', efficiency: 'Efficiency', socket: 'Socket', chipset: 'Chipset',
  formFactor: 'Form factor', clockSpeed: 'Clock speed', speed: 'Speed', cores: 'Cores',
  threads: 'Threads', tdpWatts: 'TDP', boardPowerWatts: 'Board power', coolingType: 'Cooling',
  moduleCount: 'Modules', memorySlots: 'Memory slots', maxMemoryGb: 'Max memory',
}

function humanizeKey(key) {
  return labels[key] || key.replace(/([a-z0-9])([A-Z])/g, '$1 $2').replace(/^./, (letter) => letter.toUpperCase())
}

function formatValue(key, value) {
  if (value == null || (typeof value !== 'string' && typeof value !== 'number')) return null
  if (typeof value === 'number' && !Number.isFinite(value)) return null
  const text = String(value).trim()
  if (!text || /^(unknown|n\/a|null|undefined)$/i.test(text)) return null
  if (key === 'capacityGb' || key === 'maxMemoryGb') return `${text} GB`
  if (['wattage', 'tdpWatts', 'boardPowerWatts'].includes(key)) return `${text} W`
  if (key === 'clockSpeed' && /^\d+(\.\d+)?$/.test(text)) return `${text} MHz`
  return text
}

export function specificationItems(specifications) {
  if (Array.isArray(specifications)) return specifications.filter((item) => typeof item === 'string' && item.trim()).map((item) => item.trim())
  if (!specifications || typeof specifications !== 'object') return []
  return Object.entries(specifications).flatMap(([key, value]) => {
    const formatted = formatValue(key, value)
    if (!formatted) return []
    return [labels[key] ? formatted : `${humanizeKey(key)} · ${formatted}`]
  })
}
