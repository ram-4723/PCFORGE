export function addOrIncrement(cart, item) {
  const existing = cart.find((entry) => entry.key === item.key)
  if (existing) return cart.map((entry) => entry.key === item.key ? { ...entry, quantity: entry.quantity + 1 } : entry)
  return [...cart, { ...item, quantity: 1 }]
}

export function setCartQuantity(cart, key, quantity) {
  return cart.map((item) => item.key === key ? { ...item, quantity: Math.max(1, Math.floor(quantity) || 1) } : item)
}

export function removeFromCart(cart, key) {
  return cart.filter((item) => item.key !== key)
}

export const cartItemCount = (cart) => cart.reduce((sum, item) => sum + item.quantity, 0)
export const cartTotal = (cart) => cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
