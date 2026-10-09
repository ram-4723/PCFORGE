export const totalPrice = (build) => Object.values(build || {}).reduce((sum, part) => sum + (Number(part?.price) || 0), 0)
export const formatINR = (amount) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount || 0)
