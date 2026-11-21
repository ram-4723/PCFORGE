// Persistent local storage utility for customer orders and users
// Enables real-time order tracking between Storefront and Admin Panel (both offline and online)

const ORDERS_STORAGE_KEY = 'pcforge_placed_orders'
const USERS_STORAGE_KEY = 'pcforge_custom_users'

export function getStoredOrders() {
  try {
    const raw = localStorage.getItem(ORDERS_STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function saveStoredOrder(order) {
  try {
    const orders = getStoredOrders()
    // Avoid duplicates by id or orderNumber
    const existingIndex = orders.findIndex(o => o.id === order.id || (o.orderNumber && o.orderNumber === order.orderNumber))
    if (existingIndex >= 0) {
      orders[existingIndex] = { ...orders[existingIndex], ...order }
    } else {
      orders.unshift(order)
    }
    localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(orders))
    window.dispatchEvent(new CustomEvent('pcforge-order-placed', { detail: order }))
  } catch (err) {
    console.error('Failed to save order to localStorage:', err)
  }
}

export function updateStoredOrderStatus(orderId, nextStatus) {
  try {
    const orders = getStoredOrders()
    const target = orders.find(o => o.id === orderId)
    if (target) {
      target.orderStatus = nextStatus
      target.updatedAt = new Date().toISOString()
      if (nextStatus === 'paid' || nextStatus === 'accepted' || nextStatus === 'assembling') {
        target.paymentStatus = 'paid'
      }
      localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(orders))
      window.dispatchEvent(new CustomEvent('pcforge-orders-updated', { detail: { orderId, nextStatus } }))
      return target
    }
  } catch (err) {
    console.error('Failed to update order in localStorage:', err)
  }
  return null
}

export function getStoredUsers() {
  try {
    const raw = localStorage.getItem(USERS_STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function saveStoredUser(user) {
  try {
    if (!user || !user.email) return
    const users = getStoredUsers()
    if (!users.some(u => u.email.toLowerCase() === user.email.toLowerCase())) {
      users.unshift({
        name: user.name || 'Customer',
        email: user.email,
        registeredAt: new Date().toISOString()
      })
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users))
      window.dispatchEvent(new CustomEvent('pcforge-user-registered', { detail: user }))
    }
  } catch (err) {
    console.error('Failed to save user to localStorage:', err)
  }
}
