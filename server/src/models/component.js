import mongoose from 'mongoose'

export const COMPONENT_CATEGORIES = [
  'CPU', 'GPU', 'Motherboard', 'RAM', 'Storage', 'PSU', 'Case', 'CPU Cooler',
  'Monitor', 'Keyboard', 'Mouse', 'Other Peripherals',
]

export const LEGACY_COMPONENT_CATEGORIES = [
  'Processors (CPU)', 'Graphics Cards (GPU)', 'Motherboards', 'SSDs and HDDs',
  'Power Supplies', 'PC Cabinets and Cases', 'CPU Coolers', 'Case Fans',
  'Monitors', 'Keyboards', 'Gaming Mice', 'Gaming Chairs',
  'Headphones and Speakers', 'Gaming Controllers', 'Mousepads',
  'Networking Devices', 'Other PC Accessories',
]

export const ALL_COMPONENT_CATEGORIES = [...COMPONENT_CATEGORIES, ...LEGACY_COMPONENT_CATEGORIES]

export const CATEGORY_ALIASES = {
  CPU: ['CPU', 'Processors (CPU)'],
  GPU: ['GPU', 'Graphics Cards (GPU)'],
  Motherboard: ['Motherboard', 'Motherboards'],
  RAM: ['RAM'],
  Storage: ['Storage', 'SSDs and HDDs'],
  PSU: ['PSU', 'Power Supplies'],
  Case: ['Case', 'PC Cabinets and Cases'],
  'CPU Cooler': ['CPU Cooler', 'CPU Coolers'],
  Monitor: ['Monitor', 'Monitors'],
  Keyboard: ['Keyboard', 'Keyboards'],
  Mouse: ['Mouse', 'Gaming Mice'],
  'Other Peripherals': [
    'Other Peripherals', 'Case Fans', 'Gaming Chairs', 'Headphones and Speakers',
    'Gaming Controllers', 'Mousepads', 'Networking Devices', 'Other PC Accessories',
  ],
}

export const STOCK_STATUSES = ['in_stock', 'out_of_stock', 'preorder', 'discontinued']
export const POWER_CONNECTORS = ['ATX_24_PIN', 'EPS_8_PIN', 'PCIE_6_PIN', 'PCIE_8_PIN', 'PCIE_12VHPWR']
export const MEMORY_TYPES = ['DDR4', 'DDR5']
export const FORM_FACTORS = ['EATX', 'ATX', 'mATX', 'Mini-ITX']

const stringArray = { type: [String], default: undefined }
export const componentSpecificationSchema = new mongoose.Schema({
  cpu: {
    socket: { type: String, trim: true },
    memoryTypes: { type: [{ type: String, enum: MEMORY_TYPES }], default: undefined },
    tdpW: { type: Number, min: 0, validate: Number.isSafeInteger },
    cores: { type: Number, min: 1, validate: Number.isSafeInteger },
    threads: { type: Number, min: 1, validate: Number.isSafeInteger },
    integratedGraphics: Boolean,
    powerConnectors: { type: [{ type: String, enum: POWER_CONNECTORS }], default: undefined },
    platformUpgradeScore: { type: Number, min: 0, max: 10 },
  },
  motherboard: {
    socket: { type: String, trim: true },
    chipset: { type: String, trim: true },
    memoryType: { type: String, enum: MEMORY_TYPES },
    supportedMemoryTypes: { type: [{ type: String, enum: MEMORY_TYPES }], default: undefined },
    formFactor: { type: String, enum: FORM_FACTORS },
    maxMemoryGb: { type: Number, min: 1, validate: Number.isSafeInteger },
    memorySlots: { type: Number, min: 1, validate: Number.isSafeInteger },
    supportedCpuModels: stringArray,
    supportedCpuFamilies: stringArray,
    expansionSlots: stringArray,
    storageInterfaces: stringArray,
    storageFormFactors: stringArray,
    platformUpgradeScore: { type: Number, min: 0, max: 10 },
    biosVersionNotes: { type: String, trim: true, maxlength: 1000 },
  },
  ram: {
    memoryType: { type: String, enum: MEMORY_TYPES },
    capacityGb: { type: Number, min: 1, validate: Number.isSafeInteger },
    moduleCount: { type: Number, min: 1, max: 16, validate: Number.isSafeInteger },
    speedMhz: { type: Number, min: 1, validate: Number.isSafeInteger },
  },
  gpu: {
    lengthMm: { type: Number, min: 1, validate: Number.isSafeInteger },
    slotThickness: { type: Number, min: 1, max: 8 },
    powerDrawW: { type: Number, min: 0, validate: Number.isSafeInteger },
    powerConnectors: { type: [{ type: String, enum: POWER_CONNECTORS }], default: undefined },
    vramGb: { type: Number, min: 1, validate: Number.isSafeInteger },
  },
  pcCase: {
    motherboardFormFactors: { type: [{ type: String, enum: FORM_FACTORS }], default: undefined },
    maxGpuLengthMm: { type: Number, min: 1, validate: Number.isSafeInteger },
    maxCpuCoolerHeightMm: { type: Number, min: 1, validate: Number.isSafeInteger },
  },
  psu: {
    wattageW: { type: Number, min: 1, validate: Number.isSafeInteger },
    connectors: { type: [{ type: String, enum: POWER_CONNECTORS }], default: undefined },
    efficiencyRating: { type: String, trim: true, maxlength: 50 },
  },
  cooler: {
    supportedSockets: stringArray,
    heightMm: { type: Number, min: 1, validate: Number.isSafeInteger },
    ratedTdpW: { type: Number, min: 1, validate: Number.isSafeInteger },
  },
  storage: {
    interface: { type: String, trim: true, maxlength: 50 },
    formFactor: { type: String, trim: true, maxlength: 50 },
    capacityGb: { type: Number, min: 1, validate: Number.isSafeInteger },
  },
  peripheral: {
    connectionTypes: stringArray,
    intendedUses: stringArray,
  },
}, { _id: false, minimize: true })

function isIntegerInr(value) {
  return Number.isSafeInteger(value) && value >= 0
}

const componentSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, minlength: 1, maxlength: 160 },
  category: { type: String, required: true, enum: ALL_COMPONENT_CATEGORIES, index: true },
  brand: { type: String, required: true, trim: true, minlength: 1, maxlength: 100 },
  model: { type: String, required: true, trim: true, minlength: 1, maxlength: 120 },
  priceInr: {
    type: Number,
    required: true,
    validate: { validator: isIntegerInr, message: 'priceInr must be a non-negative safe integer in whole INR.' },
  },
  specifications: { type: componentSpecificationSchema, default: () => ({}) },
  imageUrl: { type: String, trim: true, maxlength: 2048, default: '' },
  stockStatus: { type: String, enum: STOCK_STATUSES, required: true, default: 'out_of_stock' },
  active: { type: Boolean, required: true, default: false },
}, { timestamps: true, toJSON: { versionKey: false } })

componentSchema.index({ active: 1, category: 1, priceInr: 1, name: 1 })
componentSchema.index({ name: 'text', brand: 'text', model: 'text' })

const Component = mongoose.models.Component || mongoose.model('Component', componentSchema)
export default Component

export function normalizeCategory(category) {
  return Object.entries(CATEGORY_ALIASES).find(([, aliases]) => aliases.includes(category))?.[0] || category
}
