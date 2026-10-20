import { ApiError } from '../middleware/errors.js'

export function createComponentController({ ComponentModel, isDatabaseConnected }) {
  function requireDatabase() {
    if (!isDatabaseConnected()) {
      throw new ApiError(503, 'DATABASE_UNAVAILABLE', 'The database is not connected.')
    }
  }

  return {
    list: async (request, response) => {
      requireDatabase()
      const { categoryValues, brand, search, minPriceInr, maxPriceInr, sort, page, limit } = request.componentQuery
      const filter = { active: true }
      if (categoryValues) filter.category = { $in: categoryValues }
      if (brand) filter.brand = brand
      if (search) filter.$text = { $search: search }
      if (minPriceInr !== undefined || maxPriceInr !== undefined) {
        filter.priceInr = {}
        if (minPriceInr !== undefined) filter.priceInr.$gte = minPriceInr
        if (maxPriceInr !== undefined) filter.priceInr.$lte = maxPriceInr
      }
      const sortOptions = {
        'name-asc': { name: 1, _id: 1 },
        'price-asc': { priceInr: 1, _id: 1 },
        'price-desc': { priceInr: -1, _id: 1 },
        newest: { createdAt: -1, _id: -1 },
      }

      const [components, total] = await Promise.all([
        ComponentModel.find(filter).sort(sortOptions[sort]).skip((page - 1) * limit).limit(limit),
        ComponentModel.countDocuments(filter),
      ])
      return response.json({
        success: true,
        data: { components },
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      })
    },
    getById: async (request, response) => {
      requireDatabase()
      const component = await ComponentModel.findOne({ _id: request.params.id, active: true })
      if (!component) throw new ApiError(404, 'COMPONENT_NOT_FOUND', 'Component not found.')
      return response.json({ success: true, data: { component } })
    },
  }
}
