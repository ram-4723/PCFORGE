import { ApiError } from './errors.js'
import { ALL_COMPONENT_CATEGORIES, CATEGORY_ALIASES, normalizeCategory } from '../models/component.js'

const parsePositiveInteger = (value, field, defaultValue, maximum = Number.MAX_SAFE_INTEGER) => {
  if (value === undefined) return defaultValue
  if (typeof value !== 'string' || !/^\d+$/.test(value)) {
    throw new ApiError(400, 'INVALID_QUERY', `${field} must be a positive integer.`)
  }
  const parsed = Number(value)
  if (!Number.isSafeInteger(parsed) || parsed < 1 || parsed > maximum) {
    throw new ApiError(400, 'INVALID_QUERY', `${field} must be between 1 and ${maximum}.`)
  }
  return parsed
}

export function validateComponentQuery(request, response, next) {
  try {
    const { category, brand, search } = request.query
    if (category !== undefined && (typeof category !== 'string' || !ALL_COMPONENT_CATEGORIES.includes(category))) {
      throw new ApiError(400, 'INVALID_CATEGORY', 'category is not a supported component category.')
    }
    if (brand !== undefined && (typeof brand !== 'string' || !brand.trim() || brand.trim().length > 100)) {
      throw new ApiError(400, 'INVALID_BRAND', 'brand must be a non-empty value of at most 100 characters.')
    }
    if (search !== undefined && (typeof search !== 'string' || search.trim().length > 100)) {
      throw new ApiError(400, 'INVALID_SEARCH', 'search must be at most 100 characters.')
    }
    const minPriceInr = parsePositiveInteger(request.query.minPriceInr, 'minPriceInr', undefined)
    const maxPriceInr = parsePositiveInteger(request.query.maxPriceInr, 'maxPriceInr', undefined)
    if (minPriceInr !== undefined && maxPriceInr !== undefined && minPriceInr > maxPriceInr) {
      throw new ApiError(400, 'INVALID_PRICE_RANGE', 'minPriceInr cannot exceed maxPriceInr.')
    }
    const sort = request.query.sort === undefined ? 'name-asc' : request.query.sort
    if (!['name-asc', 'price-asc', 'price-desc', 'newest'].includes(sort)) {
      throw new ApiError(400, 'INVALID_SORT', 'sort must be name-asc, price-asc, price-desc, or newest.')
    }
    request.componentQuery = {
      category: category ? normalizeCategory(category) : undefined,
      categoryValues: category ? CATEGORY_ALIASES[normalizeCategory(category)] : undefined,
      brand: brand?.trim(),
      search: search?.trim(),
      minPriceInr,
      maxPriceInr,
      sort,
      page: parsePositiveInteger(request.query.page, 'page', 1),
      limit: parsePositiveInteger(request.query.limit, 'limit', 20, 100),
    }
    return next()
  } catch (error) {
    return next(error)
  }
}

export function validateObjectId(request, response, next) {
  if (!/^[a-f\d]{24}$/i.test(request.params.id)) {
    return next(new ApiError(400, 'INVALID_ID', 'id must be a valid MongoDB ObjectId.'))
  }
  return next()
}
