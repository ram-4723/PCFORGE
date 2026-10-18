// Verified local product photography shared by the demo catalogue and API-backed products.
// Matching is deliberately strict: an image is only inferred when brand, category and model
// identify the same product family. Campaign artwork is kept in /images/campaigns and excluded.
export const productImagePathById = Object.freeze({
  'p-r5-7600': '/images/ryzen%205%207600.webp',
  'p-i5-12400': '/images/i5%2012400f.jpg',
  'p-r5-5600g': '/images/5600g.jpg',
  'p-i5-9600k': '/images/intel.jpg',
  'p-rtx-4060': '/images/RTX%204060.jpg',
  'p-rx-6600': '/images/rx%206600.jpg',
  'p-b650': '/images/b650.webp',
  'p-b550': '/images/b550.webp',
  'p-ddr4-16': '/images/corsiar.jpg',
  'p-ddr5-32': '/images/trident.webp',
  'p-hdd-2tb': '/images/HDD.jpg',
  'p-ssd-1tb': '/images/crucial-p3-1tb.webp',
  'p-psu-650': '/images/cooler-master-mwe-650-bronze-v2.png',
  'p-monitor': '/images/acer-nitro-vg271u-m3.jpg',
  'p-controller': '/images/8bitdo-ultimate-c-2-4g.jpg',
  'p-router': '/images/tp-link-archer-ax50.jpg',
  'p-case-air': '/images/pc%20cabineyt.jpg',
  'p-cooler': '/images/cooler%20air.jpg',
  'p-fan': '/images/Fans.jpg',
  'p-keyboard': '/images/71w9I5LAUZL._SX522_.jpg',
  'p-mouse': '/images/logitech%20g502.webp',
  'p-chair-basic': '/images/gaming-chair-budget.jpg',
  'p-chair-rgb': '/images/gaming%20chair.jpg',
  'p-hub': '/images/USB%20HUB.jpg',
  'p-keyboard-mouse-combo': '/images/71yVlPZv4YL._SX522_.jpg',
  'p-thermal-corsair': '/images/5111H5tek7L._SX522_.jpg',
  'p-thermal-grizzly': '/images/thermal%20paste.jpg',
  'p-mat': '/images/thermaltake-dasher-extended.jpg',
})

// Prefer recognizable product photography, then use representative category art when
// an active catalogue record has no exact photo.
const categoryFallbacks = [
  { terms: ['processor', 'cpu'], image: '/images/ryzen%205%207600.webp' },
  { terms: ['graphics', 'gpu', 'video card'], image: '/images/RTX%204060.jpg' },
  { terms: ['motherboard'], image: '/images/b650.webp' },
  { terms: ['ram', 'memory'], image: '/images/trident.webp' },
  { terms: ['storage', 'ssd', 'hdd'], image: '/images/crucial-p3-1tb.webp' },
  { terms: ['power suppl', 'psu'], image: '/images/cooler-master-mwe-650-bronze-v2.png' },
  { terms: ['case', 'cabinet', 'chassis'], image: '/images/pc%20cabineyt.jpg' },
  { terms: ['cooler', 'cooling'], image: '/images/cooler%20air.jpg' },
  { terms: ['fan'], image: '/images/Fans.jpg' },
  { terms: ['monitor', 'display'], image: '/images/acer-nitro-vg271u-m3.jpg' },
  { terms: ['keyboard'], image: '/images/71w9I5LAUZL._SX522_.jpg' },
  { terms: ['mouse', 'mice'], image: '/images/logitech%20g502.webp' },
  { terms: ['chair'], image: '/images/gaming%20chair.jpg' },
  { terms: ['headphone', 'headset', 'speaker', 'audio'], image: 'https://img.evetech.co.za/repository/components/hyperx-cloud-core-wired-gaming-headset-main-image-600px-v1.jpg?width=600' },
  { terms: ['controller', 'gamepad'], image: '/images/8bitdo-ultimate-c-2-4g.jpg' },
  { terms: ['mousepad', 'mouse pad'], image: '/images/thermaltake-dasher-extended.jpg' },
  { terms: ['network', 'router'], image: '/images/tp-link-archer-ax50.jpg' },
  { terms: ['accessory', 'accessories', 'usb'], image: '/images/USB%20HUB.jpg' },
]

export function findCategoryFallbackImage(category = '', { name = '', model = '' } = {}) {
  const normalizedCategory = category.trim().toLocaleLowerCase()
  const normalized = `${normalizedCategory} ${name} ${model}`.trim().toLocaleLowerCase()
  if (/sata/.test(normalized) && /(ssd|storage)/.test(normalized)) {
    return '/images/in-870-evo-sata-3-2-5-ssd-mz-77e1t0bw-374908662.avif'
  }
  if (normalizedCategory.includes('case fan')) return '/images/Fans.jpg'
  if (normalizedCategory.includes('mousepad') || normalizedCategory.includes('mouse pad')) return '/images/thermaltake-dasher-extended.jpg'
  const match = categoryFallbacks.find(({ terms }) => terms.some((term) => normalizedCategory.includes(term)))
    || categoryFallbacks.find(({ terms }) => terms.some((term) => normalized.includes(term)))
  return match?.image || '/images/pc%20cabineyt.jpg'
}

const imageMatches = [
  { brands: ['amd'], categories: ['processor', 'cpu'], model: /ryzen\s*5\s*7600\b/i, image: '/images/ryzen%205%207600.webp' },
  { brands: ['amd'], categories: ['processor', 'cpu'], model: /ryzen\s*5\s*5600g\b/i, image: '/images/5600g.jpg' },
  { brands: ['intel'], categories: ['processor', 'cpu'], model: /core\s*i5[-\s]*12400f\b/i, image: '/images/i5%2012400f.jpg' },
  { brands: ['intel'], categories: ['processor', 'cpu'], model: /core\s*i5[-\s]*9600k\b/i, image: '/images/intel.jpg' },
  { brands: ['asus'], categories: ['graphics', 'gpu'], model: /rtx\s*4060\b/i, image: '/images/RTX%204060.jpg' },
  { brands: ['asus'], categories: ['graphics', 'gpu'], model: /rx\s*7600\b/i, image: '/images/rx%206600.jpg' },
  { brands: ['asus'], categories: ['graphics', 'gpu'], model: /rx\s*9070\s*xt\b/i, image: '/images/81huTBuLV+L._AC_UF1000,1000_QL80_.jpg' },
  { brands: ['msi'], categories: ['motherboard'], model: /b650m\s*(gaming\s*)?(wifi|wi-fi)/i, image: '/images/b650.webp' },
  { brands: ['msi'], categories: ['motherboard'], model: /b550m/i, image: '/images/b550.webp' },
  { brands: ['corsair'], categories: ['ram', 'memory'], model: /vengeance\s*lpx/i, image: '/images/corsiar.jpg' },
  { brands: ['corsair'], categories: ['ram', 'memory'], model: /vengeance\s*rgb\s*pro/i, image: '/images/Corsair_Vengeance_RGB_Pro_DDR4_Memory_From_The_Peripheral_Store_01.webp' },
  { brands: ['corsair'], categories: ['ram', 'memory'], model: /cmsx8gx4m1a2400c16/i, image: '/images/corsair-cmsx8gx4m1a2400c16-original-imaf8nsg7ywn8ghz.webp' },
  { brands: ['g.skill', 'gskill'], categories: ['ram', 'memory'], model: /trident\s*z/i, image: '/images/trident.webp' },
  { brands: ['adata', 'xpg'], categories: ['ram', 'memory'], model: /gammix\s*d30/i, image: '/images/71ff5CVvFkL.jpg' },
  { brands: ['crucial'], categories: ['ssd', 'storage'], model: /p3\s*(1\s*tb|ct1000p3ssd8)?/i, image: '/images/crucial-p3-1tb.webp' },
  { brands: ['intel'], categories: ['ssd', 'storage'], model: /800\s*gb|s3610/i, image: '/images/Intel-800GB-SATA-6Gbps-2-5-inch-SSD.png' },
  { brands: ['samsung'], categories: ['ssd', 'storage'], model: /870\s*evo/i, image: '/images/in-870-evo-sata-3-2-5-ssd-mz-77e1t0bw-374908662.avif' },
  { brands: ['kingston'], categories: ['ssd', 'storage'], model: /a400\s*(240\s*gb)?/i, image: '/images/Kingston_SSD_A400_240GB_Internal_Solid_State_Drive_Original_India_Free_Delivery_TPS_The_Peripheral_Store_1.webp' },
  { brands: ['powerx'], categories: ['ssd', 'storage'], model: /sata\s*256\s*gb|256\s*gb\s*sata/i, image: '/images/PowerXM-SATA256GBSSD_1_ba4aeab4-0820-4b28-b26f-7bd88e582637.webp' },
  { brands: ['d25'], categories: ['hdd', 'storage'], model: /d25.*1\s*tb|1\s*tb.*surveillance/i, image: '/images/HDD.jpg' },
  { brands: ['cooler master'], categories: ['psu', 'power supply'], model: /mwe\s*650\s*bronze\s*v2/i, image: '/images/cooler-master-mwe-650-bronze-v2.png' },
  { brands: ['cooler master'], categories: ['psu', 'power supply'], model: /mwe\s*450\s*bronze\s*v2/i, image: '/images/mpe-4501-acabw-bin-cooler-master-original-imafxt6cew7ht6hj.webp' },
  { brands: ['antec'], categories: ['psu', 'power supply'], model: /g650\s*gold/i, image: '/images/Antec-G650-Gold-Semi-Modular-SMPS-1.jpg' },
  { brands: ['asus'], categories: ['psu', 'power supply'], model: /rog\s*strix\s*850g/i, image: '/images/images%20(1).jfif' },
  { brands: ['ant esports'], categories: ['case', 'cabinet'], model: /ant\s*value.*airflow/i, image: '/images/pc%20cabineyt.jpg' },
  { brands: ['antec'], categories: ['case', 'cabinet'], model: /c5\s*argb/i, image: '/images/c5-argb-antec-original-imahfdyuwjhfpgux.webp' },
  { brands: ['cooler master'], categories: ['case', 'cabinet'], model: /masterframe\s*400/i, image: '/images/MASTERFRAME_400_MESH_GOLD_LIMITED_EDITION_001.webp' },
  { brands: ['ant esports'], categories: ['cooler'], model: /ice[-\s]?120/i, image: '/images/cooler%20air.jpg' },
  { brands: ['ant esports'], categories: ['fan'], model: /carbonflow/i, image: '/images/Fans.jpg' },
  { brands: ['thermalright'], categories: ['cooler'], model: /peerless\s*assassin\s*120\s*vision\s*max/i, image: '/images/Thermalright-Peerless-Assassin-120-Vision-MAX-ARGB-White-CPU-Cooler-01.webp' },
  { brands: ['gigabyte'], categories: ['cooler'], model: /eagle.*lcd|lcd.*eagle/i, image: '/images/47288.png' },
  { brands: ['corsair'], categories: ['cooler'], model: /cw[-\s]?9060092[-\s]?ww/i, image: '/images/CW-9060092-WW_01.avif' },
  { brands: ['redragon'], categories: ['keyboard'], model: /he\s*98|rapid\s*trigger\s*cnc/i, image: '/images/9_f8b13895-b9ee-4116-bc74-805598c9ff57.webp' },
  { brands: ['powerx'], categories: ['cooler'], model: /ultra/i, image: '/images/1786192995897-powerx-ultra-cpu-cooler-fan-inclined.webp' },
  { brands: ['acer'], categories: ['monitor'], model: /nitro\s*vg271u\s*m3/i, image: '/images/acer-nitro-vg271u-m3.jpg' },
  { brands: ['viewsonic'], categories: ['monitor'], model: /vx2480/i, image: '/images/ViewSonic-VX2480-2K-SHD-24-Inch-QHD-2k-Monitor-2-e1711165325957.jpg' },
  { brands: ['benq'], categories: ['monitor'], model: /ew270q/i, image: '/images/benq-27-inch-2k-white-ew270q-01.webp' },
  { brands: ['gigabyte'], categories: ['monitor'], model: /g34wqc/i, image: '/images/o202008121103038834.png' },
  { brands: ['benq'], categories: ['monitor'], model: /gw2491/i, image: '/images/gw2491-image-main.webp' },
  { brands: ['logitech'], categories: ['mouse', 'mice'], model: /g502\s*hero/i, image: '/images/logitech%20g502.webp' },
  { brands: ['valorx'], categories: ['chair'], model: /valorx/i, image: '/images/gaming-chair-budget.jpg' },
  { brands: ['draco'], categories: ['chair'], model: /draco/i, image: '/images/gaming%20chair.jpg' },
  { brands: ['8bitdo'], categories: ['controller'], model: /ultimate\s*c\s*2\.4g/i, image: '/images/8bitdo-ultimate-c-2-4g.jpg' },
  { brands: ['tp-link'], categories: ['network', 'router'], model: /archer\s*ax50/i, image: '/images/tp-link-archer-ax50.jpg' },
  { brands: ['thermaltake'], categories: ['mousepad', 'mouse pad'], model: /dasher\s*extended/i, image: '/images/thermaltake-dasher-extended.jpg' },
]

export const verifiedProductImagePaths = Object.freeze([
  ...Object.values(productImagePathById),
  ...imageMatches.map(({ image }) => image),
  ...categoryFallbacks.map(({ image }) => image),
  '/images/in-870-evo-sata-3-2-5-ssd-mz-77e1t0bw-374908662.avif',
].filter((path, index, paths) => paths.indexOf(path) === index))

export function findVerifiedProductImage({ brand = '', model = '', name = '', category = '' } = {}) {
  const normalizedBrand = brand.trim().toLocaleLowerCase()
  const identity = `${model} ${name}`.trim()
  const normalizedCategory = category.trim().toLocaleLowerCase()
  const match = imageMatches.find((entry) => entry.brands.includes(normalizedBrand)
    && entry.categories.some((term) => normalizedCategory.includes(term) || (term === 'power supply' && normalizedCategory.includes('power suppl')))
    && entry.model.test(identity))
  return match?.image || null
}
