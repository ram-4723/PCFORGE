import { publicAsset } from '../utils/assets.js'
import { productImageSources } from './productImageSources.js'
import { productImagePathById } from './productImageMap.js'

export const categories = [
  { id: 'all', name: 'All components', icon: 'Cpu' },
  { id: 'Processors (CPU)', name: 'Processors', icon: 'Cpu' },
  { id: 'Graphics Cards (GPU)', name: 'Graphics cards', icon: 'Monitor' },
  { id: 'Motherboards', name: 'Motherboards', icon: 'CircuitBoard' },
  { id: 'RAM', name: 'Memory', icon: 'MemoryStick' },
  { id: 'SSDs and HDDs', name: 'Storage', icon: 'Database' },
  { id: 'Power Supplies', name: 'Power supplies', icon: 'Zap' },
  { id: 'PC Cabinets and Cases', name: 'Cases', icon: 'Box' },
  { id: 'CPU Coolers', name: 'CPU coolers', icon: 'Fan' },
  { id: 'Case Fans', name: 'Case fans', icon: 'Fan' },
  { id: 'Monitors', name: 'Monitors', icon: 'Monitor' },
  { id: 'Keyboards', name: 'Keyboards', icon: 'Keyboard' },
  { id: 'Gaming Mice', name: 'Gaming mice', icon: 'Mouse' },
  { id: 'Gaming Chairs', name: 'Gaming chairs', icon: 'Box' },
  { id: 'Headphones and Speakers', name: 'Headsets & audio', icon: 'Headphones' },
  { id: 'Gaming Controllers', name: 'Controllers', icon: 'Gamepad2' },
  { id: 'Mousepads', name: 'Mousepads', icon: 'PanelsTopLeft' },
  { id: 'Networking Devices', name: 'Networking', icon: 'Wifi' },
  { id: 'Other PC Accessories', name: 'Accessories', icon: 'Cable' },
]

const productRecords = [
  { id: 'p-r5-7600', name: 'Ryzen 5 7600', brand: 'AMD', category: 'Processors (CPU)', specs: ['6 cores / 12 threads', 'AM5 · 65 W'], price: 18500, mrp: 21900, stock: 'Availability unverified', icon: 'Cpu', tone: 'amber' },
  { id: 'p-r5-5600g', name: 'Ryzen 5 5600G', brand: 'AMD', category: 'Processors (CPU)', specs: ['6 cores / 12 threads', 'AM4 · Radeon graphics'], price: 11900, stock: 'Availability unverified', icon: 'Cpu', tone: 'amber' },
  { id: 'p-i5-12400', name: 'Core i5-12400F', brand: 'Intel', category: 'Processors (CPU)', specs: ['6 cores / 12 threads', 'LGA1700 · 65 W · discrete GPU required'], price: 13800, stock: 'Availability unverified', icon: 'Cpu', tone: 'blue' },
  { id: 'p-i5-9600k', name: 'Core i5-9600K', brand: 'Intel', category: 'Processors (CPU)', specs: ['6 cores / 6 threads', 'LGA1151 · Unlocked'], price: 8900, stock: 'Availability unverified', icon: 'Cpu', tone: 'blue' },
  { id: 'p-rtx-4060', name: 'Dual GeForce RTX 4060 OC Edition 8 GB', brand: 'ASUS', category: 'Graphics Cards (GPU)', specs: ['8 GB GDDR6', 'ASUS Dual · OC Edition'], price: 29900, mrp: 33900, stock: 'Availability unverified', icon: 'Gpu', tone: 'green' },
  { id: 'p-rx-6600', name: 'Dual Radeon RX 7600 OC Edition 8 GB', brand: 'ASUS', category: 'Graphics Cards (GPU)', specs: ['8 GB GDDR6', 'ASUS Dual · OC Edition'], price: 21500, stock: 'Availability unverified', icon: 'Gpu', tone: 'rose' },
  { id: 'p-b650', name: 'B650M GAMING WIFI', brand: 'MSI', category: 'Motherboards', specs: ['AM5 · Micro-ATX', 'DDR5 · Wi-Fi 6E'], price: 15400, mrp: 17900, stock: 'Availability unverified', icon: 'CircuitBoard', tone: 'blue' },
  { id: 'p-b550', name: 'B550M DDR4 Board', brand: 'MSI', category: 'Motherboards', specs: ['AM4 · Micro-ATX', 'PCIe 4.0 support'], price: 8200, stock: 'Availability unverified', icon: 'CircuitBoard', tone: 'violet' },
  { id: 'p-ddr4-16', name: 'Vengeance LPX DDR4 Memory Module', brand: 'Corsair', category: 'RAM', specs: ['DDR4 desktop DIMM', 'Capacity and speed vary by model'], price: 3400, mrp: 4100, stock: 'Availability unverified', icon: 'MemoryStick', tone: 'gold' },
  { id: 'p-ddr5-32', name: 'Trident Z RGB Memory Kit', brand: 'G.SKILL', category: 'RAM', specs: ['Trident Z RGB series', 'Capacity and speed vary by kit'], price: 8900, stock: 'Availability unverified', icon: 'MemoryStick', tone: 'violet' },
  { id: 'p-ssd-1tb', name: 'Crucial P3 1 TB NVMe SSD', brand: 'Crucial', category: 'SSDs and HDDs', specs: ['M.2 2280 · PCIe 3.0 NVMe', 'Model CT1000P3SSD8'], price: 7200, mrp: 8300, stock: 'Availability unverified', icon: 'Database', tone: 'blue' },
  { id: 'p-hdd-2tb', name: 'D25 1 TB Surveillance HDD', brand: 'D25', category: 'SSDs and HDDs', specs: ['3.5 in · SATA', 'Surveillance drive'], price: 5200, stock: 'Availability unverified', icon: 'Database', tone: 'cyan' },
  { id: 'p-psu-650', name: 'MWE 650 Bronze V2', brand: 'Cooler Master', category: 'Power Supplies', specs: ['650 W · 80 PLUS Bronze', 'Model MPE-6501-ACAAB'], price: 5600, stock: 'Availability unverified', icon: 'Zap', tone: 'gold' },
  { id: 'p-case-air', name: 'ANT Value RGB Airflow Mid-Tower Case', brand: 'ANT Esports', category: 'PC Cabinets and Cases', specs: ['Tempered glass panel', 'RGB pre-installed fans'], price: 6200, stock: 'Availability unverified', icon: 'Box', tone: 'slate' },
  { id: 'p-cooler', name: 'ICE-120 ARGB Tower Air Cooler', brand: 'ANT Esports', category: 'CPU Coolers', specs: ['120 mm ARGB fan', 'Single-tower air cooling'], price: 2900, stock: 'Availability unverified', icon: 'Fan', tone: 'cyan' },
  { id: 'p-fan', name: 'Carbonflow 120 mm Case Fan', brand: 'ANT Esports', category: 'Case Fans', specs: ['120 mm · black', 'Model Carbonflow'], price: 750, stock: 'Availability unverified', icon: 'Fan', tone: 'blue' },
  { id: 'p-monitor', name: 'Nitro VG271U M3 27 in Monitor', brand: 'Acer', category: 'Monitors', specs: ['2560 × 1440 · IPS', '180 Hz'], price: 18900, mrp: 22900, stock: 'Availability unverified', icon: 'Monitor', tone: 'rose' },
  { id: 'p-keyboard', name: 'RGB Mechanical Gaming Keyboard', brand: 'Redragon', category: 'Keyboards', specs: ['Full-size layout', 'Rainbow backlighting'], price: 4200, stock: 'Availability unverified', icon: 'Keyboard', tone: 'violet' },
  { id: 'p-mouse', name: 'G502 HERO Gaming Mouse', brand: 'Logitech', category: 'Gaming Mice', specs: ['Wired USB', 'Adjustable DPI'], price: 5200, mrp: 6200, stock: 'Availability unverified', icon: 'Mouse', tone: 'green' },
  { id: 'p-chair-basic', name: 'ValorX Gaming Chair', brand: 'ValorX', category: 'Gaming Chairs', specs: ['Adjustable height', 'Padded armrests'], price: 11900, stock: 'Availability unverified', icon: 'Box', tone: 'slate' },
  { id: 'p-chair-rgb', name: 'Draco Gaming Chair', brand: 'Draco', category: 'Gaming Chairs', specs: ['Reclining backrest', 'Lumbar support'], price: 15900, stock: 'Availability unverified', icon: 'Box', tone: 'rose' },
  { id: 'p-headset', name: 'Cloud Core Headset', brand: 'HyperX', category: 'Headphones and Speakers', specs: ['Over-ear · closed-back', 'Detachable microphone'], price: 5900, stock: 'Availability unverified', icon: 'Headphones', tone: 'rose' },
  { id: 'p-controller', name: 'Ultimate C 2.4G Wireless Controller', brand: '8BitDo', category: 'Gaming Controllers', specs: ['2.4G wireless · wired USB', 'Windows · Android · Steam Deck'], price: 4200, stock: 'Availability unverified', icon: 'Gamepad2', tone: 'amber' },
  { id: 'p-mat', name: 'Dasher Extended Gaming Mousepad', brand: 'Thermaltake', category: 'Mousepads', specs: ['900 × 400 × 4 mm', 'Cloth surface · stitched edge'], price: 1600, stock: 'Availability unverified', icon: 'PanelsTopLeft', tone: 'slate' },
  { id: 'p-router', name: 'Archer AX50 AX3000 Wi-Fi 6 Router', brand: 'TP-Link', category: 'Networking Devices', specs: ['AX3000 · dual-band', '2402 Mbps (5 GHz) + 574 Mbps (2.4 GHz)'], price: 6800, stock: 'Availability unverified', icon: 'Wifi', tone: 'blue' },
  { id: 'p-hub', name: '4-Port USB-A 3.0 Hub', brand: 'Acer', category: 'Other PC Accessories', specs: ['Four USB-A ports', 'USB-A host cable'], price: 2900, stock: 'Availability unverified', icon: 'Cable', tone: 'gold' },
  { id: 'p-keyboard-mouse-combo', name: 'RGB Keyboard and Mouse Combo', brand: 'ANT Esports', category: 'Other PC Accessories', specs: ['Rainbow backlighting', 'Keyboard + mouse bundle'], price: 2600, stock: 'Availability unverified', icon: 'Keyboard', tone: 'violet' },
  { id: 'p-thermal-corsair', name: 'TM30 Thermal Paste', brand: 'Corsair', category: 'Other PC Accessories', specs: ['Thermal compound', 'CPU cooling accessory'], price: 650, stock: 'Availability unverified', icon: 'Fan', tone: 'gold' },
  { id: 'p-thermal-grizzly', name: 'Aeronaut Thermal Paste', brand: 'Thermal Grizzly', category: 'Other PC Accessories', specs: ['Thermal compound', 'Easy-apply syringe'], price: 850, stock: 'Availability unverified', icon: 'Fan', tone: 'gold' },
]

// Category art is used only in category/campaign tiles. Product cards use exact-model images below
// or a neutral placeholder; they never inherit an unrelated category representative.
const representativeImagePaths = {
  'Processors (CPU)': '/images/ryzen%205%207600.webp',
  'Graphics Cards (GPU)': '/images/RTX%204060.jpg',
  Motherboards: '/images/b650.webp',
  RAM: '/images/trident.webp',
  'SSDs and HDDs': '/images/HDD.jpg',
  'Power Supplies': '/images/cooler-master-mwe-650-bronze-v2.png',
  'PC Cabinets and Cases': '/images/pc%20cabineyt.jpg',
  'CPU Coolers': '/images/cooler%20air.jpg',
  'Case Fans': '/images/Fans.jpg',
  Monitors: '/images/acer-nitro-vg271u-m3.jpg',
  Keyboards: '/images/71w9I5LAUZL._SX522_.jpg',
  'Gaming Mice': '/images/logitech%20g502.webp',
  'Gaming Chairs': '/images/gaming%20chair.jpg',
  'Gaming Controllers': '/images/8bitdo-ultimate-c-2-4g.jpg',
  Mousepads: '/images/thermaltake-dasher-extended.jpg',
  'Networking Devices': '/images/tp-link-archer-ax50.jpg',
  'Other PC Accessories': '/images/USB%20HUB.jpg',
}
export const representativeImages = Object.fromEntries(
  Object.entries(representativeImagePaths).map(([category, path]) => [category, path ? publicAsset(path) : null]),
)

export const products = productRecords.map((product) => ({
  ...product,
  isDemoData: true,
  stock: 'Availability unverified',
  image: productImagePathById[product.id] ? publicAsset(productImagePathById[product.id]) : null,
  imageAlt: productImagePathById[product.id] ? `${product.brand} ${product.name}` : `${product.name} product image placeholder`,
  imageSource: productImageSources[product.id] || (productImagePathById[product.id]
    ? { kind: 'existing-local', label: 'Existing project asset; original source was not recorded' }
    : null),
}))

export const featuredPrebuilts = [
  { id: 'office', name: 'Everyday Desk', use: 'Office & Study', price: 32900, specs: ['Core i3-12100', '16 GB DDR4', '500 GB NVMe'], tone: 'sand', image: 'https://images.unsplash.com/photo-1696710257827-75e2e5954059?auto=format&fit=crop&w=1100&q=85', text: 'A balanced starting point for study, office apps, and day-to-day productivity.' },
  { id: 'budget-game', name: 'Entry Arena', use: 'Budget Gaming', price: 52900, specs: ['Ryzen 5 5600', 'Radeon RX 6600', '16 GB DDR4'], tone: 'green', image: 'https://images.unsplash.com/photo-1639004643579-7286ae5a771d?auto=format&fit=crop&w=1100&q=85', text: 'A sample 1080p direction with a dedicated graphics card and clear upgrade paths.' },
  { id: 'mid-game', name: 'Vanguard 1080', use: 'Mid-range Gaming', price: 68900, specs: ['Ryzen 5 5600', 'GeForce RTX 4060', '32 GB DDR4'], tone: 'blue', image: 'https://images.unsplash.com/photo-1636489953081-c4ebbd50fa3a?auto=format&fit=crop&w=1100&q=85', text: 'More memory and GPU features for a varied modern game library.' },
  { id: 'programmer', name: 'Dev Workbench', use: 'Programming & Development', price: 57800, specs: ['Core i5-12400', '32 GB DDR4', '1 TB NVMe'], tone: 'violet', image: 'https://images.unsplash.com/photo-1695480549117-e5b36e4767ca?auto=format&fit=crop&w=1100&q=85', text: 'A responsive workstation direction for editors, local builds, and multitasking.' },
  { id: 'creator-pc', name: 'Studio Forge', use: 'Content Creation', price: 91400, specs: ['Ryzen 5 7600', 'GeForce RTX 4060', '32 GB DDR5'], tone: 'rose', image: 'https://images.unsplash.com/photo-1726442125314-c70f9753c0ec?auto=format&fit=crop&w=1100&q=85', text: 'A capable starting point for editing, creative apps, and GPU-assisted workflows.' },
  { id: 'high-game', name: 'Apex Tower', use: 'High-performance Gaming', price: 99800, specs: ['Ryzen 5 7600', 'GeForce RTX 4060', '32 GB DDR5 · 2 TB NVMe'], tone: 'gold', image: 'https://images.unsplash.com/photo-1629672530716-f76299742b8e?auto=format&fit=crop&w=1100&q=85', text: 'A fast, roomy sample build for high-refresh gaming and heavy everyday use.' },
]
