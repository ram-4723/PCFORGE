export const getBuildTotal = (build) => {
  const parts = Object.values(build || {}).filter(Boolean)
  if (!parts.length) return null
  const prices = parts.map((part) => part.price)
  if (prices.some((price) => !Number.isSafeInteger(price) || price < 0)) return null
  const total = prices.reduce((sum, price) => sum + price, 0)
  return Number.isSafeInteger(total) ? total : null
}
export const totalPrice = (build) => getBuildTotal(build) ?? 0
export const formatINR = (amount) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount || 0)
