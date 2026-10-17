import { specificationItems } from './specifications.js'
import { findVerifiedProductImage } from '../data/productImageMap.js'

const brandFields = ['brand', 'brandName', 'manufacturer', 'vendor']

function isInternalDemoBrand(value) {
  return /^demo\s+.+\s+(maker|brand)$/i.test(value) || /^demo\s+brand\s*[·:-]/i.test(value)
}

export function productBrand(record = {}) {
  for (const field of brandFields) {
    const value = record[field]
    if (typeof value !== 'string') continue
    const normalized = value.trim()
    if (!normalized) continue
    if (record.demoData === true && isInternalDemoBrand(normalized)) continue
    return normalized
  }
  return ''
}

export function productImageUrl(value, baseUrl = '/') {
  if (typeof value !== 'string') return null
  const source = value.trim()
  if (!source) return null
  if (/^https?:\/\//i.test(source)) return source
  if (source.startsWith('//') || /^[a-z][a-z\d+.-]*:/i.test(source)) return null

  const base = `${baseUrl || '/'}`.endsWith('/') ? (baseUrl || '/') : `${baseUrl}/`
  return `${base}${source.replace(/^\/+/, '')}`
}

export function productTitle(name, brand) {
  const title = typeof name === 'string' ? name.trim() : ''
  const maker = typeof brand === 'string' ? brand.trim() : ''
  if (!maker) return title
  return title.toLocaleLowerCase().startsWith(maker.toLocaleLowerCase()) ? title : `${maker} ${title}`
}

export function componentToProduct(component = {}, baseUrl = '/') {
  const brand = productBrand(component)
  const category = typeof component.category === 'string' && component.category.trim()
    ? component.category.trim()
    : 'PC component'
  const specs = specificationItems(component.specifications)
  const suppliedName = typeof component.name === 'string'
    ? component.name.replace(/\s*\(demo\)\s*$/i, '').replace(/\s+demo\s*$/i, '').trim()
    : ''
  const name = component.demoData === true && !brand
    ? [category, ...specs.slice(0, 2)].join(' · ')
    : suppliedName || [category, ...specs.slice(0, 2)].join(' · ')
  const rawImage = [component.imageUrl, component.imageURL, component.image]
    .find((candidate) => typeof candidate === 'string' && candidate.trim())
  const verifiedLocalImage = findVerifiedProductImage({
    brand,
    model: typeof component.model === 'string' ? component.model : '',
    name: suppliedName,
    category,
  })
  // The backend's explicit imageUrl is the source of truth. When absent, use a strict
  // brand + category + model lookup so exact local assets also work for Atlas records.
  const image = component.demoData === true && !brand && !verifiedLocalImage
    ? null
    : productImageUrl(rawImage || verifiedLocalImage, baseUrl)

  return {
    id: component._id || component.id,
    name,
    brand,
    category,
    specs,
    price: component.priceInr ?? component.price,
    stock: component.stockStatus?.replaceAll('_', ' ') || (component.demoData ? 'Availability unverified' : 'Status unavailable'),
    isDemoData: component.demoData === true,
    image,
    imageAlt: image ? productTitle(name, brand) : `${name} product image placeholder`,
  }
}
