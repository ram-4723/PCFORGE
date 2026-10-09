export function filterProducts(products, { category = 'all', brand = 'all', maxPrice = 100000, query = '', sortBy = 'featured' } = {}) {
  const term = query.trim().toLowerCase()
  return products.filter((product) => (category === 'all' || product.category === category)
    && (brand === 'all' || product.brand === brand)
    && product.price <= maxPrice
    && `${product.name} ${product.brand} ${product.category} ${product.specs.join(' ')}`.toLowerCase().includes(term))
    .sort((a, b) => sortBy === 'price-low' ? a.price - b.price : sortBy === 'price-high' ? b.price - a.price : sortBy === 'name' ? a.name.localeCompare(b.name) : 0)
}
