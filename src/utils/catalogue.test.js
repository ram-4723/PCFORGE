import test from 'node:test'
import assert from 'node:assert/strict'
import { access } from 'node:fs/promises'
import path from 'node:path'
import { componentToProduct, productBrand, productImageUrl, productTitle } from './catalogue.js'
import { findVerifiedProductImage, verifiedProductImagePaths } from '../data/productImageMap.js'

test('keeps the brand stored on a backend component', () => {
  assert.equal(productBrand({ brand: '  MSI  ' }), 'MSI')
})

test('accepts existing manufacturer and vendor field aliases without inferring a brand', () => {
  assert.equal(productBrand({ manufacturer: 'AMD' }), 'AMD')
  assert.equal(productBrand({ brand: '', brandName: 'Corsair' }), 'Corsair')
  assert.equal(productBrand({ brand: '', manufacturer: '', vendor: '' }), '')
})

test('hides only explicit demo-maker placeholders while retaining a real alternate brand', () => {
  assert.equal(productBrand({ brand: 'Demo Storage Maker', demoData: true }), '')
  assert.equal(productBrand({ brand: 'Demo Storage Maker', manufacturer: 'Seagate', demoData: true }), 'Seagate')
  assert.equal(productBrand({ brand: 'Demo Storage Maker', demoData: false }), 'Demo Storage Maker')
})

test('prefixes local product image paths with the frontend base path', () => {
  assert.equal(productImageUrl('/images/rtx-4060.webp', '/pcforge/'), '/pcforge/images/rtx-4060.webp')
  assert.equal(productImageUrl('images/rtx-4060.webp', '/'), '/images/rtx-4060.webp')
})

test('preserves permitted external URLs and rejects unsafe or empty image values', () => {
  assert.equal(productImageUrl(' https://cdn.example.test/gpu.webp '), 'https://cdn.example.test/gpu.webp')
  assert.equal(productImageUrl('javascript:alert(1)'), null)
  assert.equal(productImageUrl(''), null)
})

test('maps backend field names and leaves unverified brand blank', () => {
  const product = componentToProduct({ _id: 'part-1', name: '1 TB NVMe SSD (demo)', category: 'Storage', brand: 'Demo Storage Maker', specifications: { capacity: '1 TB', interface: 'NVMe' }, priceInr: 5400, imageUrl: '/images/ssd.webp', demoData: true }, '/pcforge/')
  assert.equal(product.name, 'Storage · 1 TB · NVMe')
  assert.equal(product.brand, '')
  assert.equal(product.price, 5400)
  assert.equal(product.image, null)
  assert.equal(product.imageAlt, `${product.name} product image placeholder`)
})

test('keeps a demo product image when the record carries a verified brand', () => {
  const product = componentToProduct({ name: 'Ryzen 5 7600 (demo)', category: 'Processors (CPU)', brand: 'AMD', priceInr: 18500, imageUrl: '/images/ryzen-5-7600.webp', demoData: true }, '/pcforge/')
  assert.equal(product.brand, 'AMD')
  assert.equal(product.name, 'Ryzen 5 7600')
  assert.equal(product.image, '/pcforge/images/ryzen-5-7600.webp')
})

test('uses a verified local model image for an API component without imageUrl', () => {
  const product = componentToProduct({
    _id: 'atlas-component',
    name: 'Core i5-12400F',
    model: 'i5-12400F',
    category: 'Processors (CPU)',
    brand: 'Intel',
    priceInr: 13800,
  }, '/pcforge/')
  assert.equal(product.image, '/pcforge/images/i5%2012400f.jpg')
  assert.equal(product.imageAlt, 'Intel Core i5-12400F')
})

test('local model image matching requires the verified brand and product category', () => {
  assert.equal(findVerifiedProductImage({ brand: 'ASUS', category: 'Graphics Cards (GPU)', model: 'Dual GeForce RTX 4060 OC Edition' }), '/images/RTX%204060.jpg')
  assert.equal(findVerifiedProductImage({ brand: 'MSI', category: 'Motherboards', model: 'B650M GAMING WIFI' }), '/images/b650.webp')
  assert.equal(findVerifiedProductImage({ brand: 'ASUS', category: 'Motherboards', model: 'B650M GAMING WIFI' }), null)
  assert.equal(findVerifiedProductImage({ brand: '', category: 'Graphics Cards (GPU)', model: 'RTX 4060' }), null)
})

test('every configured local product image points to an existing public asset', async () => {
  for (const imagePath of verifiedProductImagePaths) {
    const filename = decodeURIComponent(imagePath.slice('/images/'.length))
    await access(path.join(process.cwd(), 'public', 'images', filename))
  }
})

test('build titles include verified brands once and omit missing brands', () => {
  assert.equal(productTitle('Ryzen 5 7600', 'AMD'), 'AMD Ryzen 5 7600')
  assert.equal(productTitle('AMD Ryzen 5 7600', 'AMD'), 'AMD Ryzen 5 7600')
  assert.equal(productTitle('Storage · 1 TB', ''), 'Storage · 1 TB')
})
