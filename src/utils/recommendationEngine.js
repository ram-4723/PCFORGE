import { catalog } from '../data/components.js'
import { totalPrice } from './pricing.js'

const byId = (group, id) => catalog[group].find((item) => item.id === id)
const assemble = (ids) => Object.fromEntries(Object.entries(ids).map(([key, id]) => [key, byId(key, id)]))

export function recommend(budget, usage, preference) {
  const isGaming = usage === 'Gaming' || preference === 'Gaming Performance'
  let ids
  if (budget < 39000) {
    ids = budget < 35000
      ? { cpu: 'i312100', gpu: 'igpu', motherboard: 'h610value', ram: budget < 27000 ? '8gbvalue' : '16gb', storage: budget < 27000 ? '480ssd' : '500nvme', psu: '400psu', case: 'compactvalue', cooling: 'stock' }
      : { cpu: usage === 'Programming & Development' ? 'i312100' : 'r5700g', gpu: 'igpu', motherboard: usage === 'Programming & Development' ? 'h610' : 'a520', ram: budget < 37000 ? '8gb' : '16gb', storage: '500nvme', psu: '450psu', case: 'compact', cooling: 'stock' }
  } else if (budget < 59000 || (preference === 'Budget-Focused' && budget < 68000)) {
    const discreteGpu = isGaming && budget >= 52000
    ids = { cpu: discreteGpu ? (usage === 'Programming & Development' ? 'i512400' : 'r5600') : (usage === 'Programming & Development' ? 'i512400' : 'r5700g'), gpu: discreteGpu ? 'rx6600' : 'igpu', motherboard: usage === 'Programming & Development' ? 'h610' : 'b550', ram: usage.includes('Content') ? '32gb' : '16gb', storage: '1tnvme', psu: discreteGpu ? '550psu' : '450psu', case: 'airflow', cooling: 'stock' }
  } else if (budget < 76000 || preference === 'Future-Upgrade Friendly') {
    ids = { cpu: 'r5600', gpu: 'rx6600', motherboard: 'b550', ram: '32gb', storage: '1tnvme', psu: '650psu', case: 'airflow', cooling: 'tower' }
  } else {
    ids = { cpu: 'r7600', gpu: 'rtx4060', motherboard: 'b650', ram: '32gb5', storage: '2tnvme', psu: '650psu', case: 'airflow', cooling: 'tower' }
  }
  let build = assemble(ids)
  // If a high-cost recommendation overshoots, step down GPU and memory until it fits.
  if (totalPrice(build) > budget && build.gpu.id !== 'igpu') {
    build = { ...build, gpu: byId('gpu', 'igpu'), psu: byId('psu', '450psu') }
    if (!build.cpu.integrated) build = { ...build, cpu: byId('cpu', 'r5700g'), motherboard: byId('motherboard', 'b550') }
    if (build.ram.type !== build.motherboard.ram) build = { ...build, ram: byId('ram', build.motherboard.ram === 'DDR5' ? '16gb5' : '32gb') }
  }
  if (totalPrice(build) > budget && build.ram.id.startsWith('32')) build = { ...build, ram: byId('ram', build.motherboard.ram === 'DDR5' ? '16gb5' : '16gb') }
  if (totalPrice(build) > budget) build = { ...build, storage: byId('storage', '500nvme'), case: byId('case', 'compact'), cooling: byId('cooling', 'stock') }
  return build
}

export function suitabilityText(usage, preference, build) {
  const graphics = build.gpu.id === 'igpu' ? 'Integrated graphics keep the estimate accessible; graphics-heavy games and creative work will benefit from a future discrete GPU.' : `${build.gpu.name} provides a dedicated graphics option for GPU-heavy work.`
  return `Selected for ${usage.toLowerCase()} with a ${preference.toLowerCase()} approach. ${graphics}`
}
