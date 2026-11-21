// Persistent local storage utility for customer orders and users
// Real orders only: all sample/demo records are excluded.

const ORDERS_STORAGE_KEY = 'pcforge_placed_orders'
const USERS_STORAGE_KEY = 'pcforge_custom_users'

// Clean up any legacy demo/sample order keys
try {
  if (typeof window !== 'undefined' && window.localStorage) {
    localStorage.removeItem('pcforge_demo_orders')
    localStorage.removeItem('pcforge_sample_orders')
  }
} catch {
  // localStorage may be unavailable in some sandboxes
}

export function getStoredOrders() {
  try {
    const raw = localStorage.getItem(ORDERS_STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    // Filter out any mock/sample/demo orders so ONLY REAL customer orders exist
    const realOrders = parsed.filter(o =>
      o &&
      !o.isDemo &&
      !o.id?.startsWith('ord_demo_') &&
      !o.id?.startsWith('demo_') &&
      !o.id?.includes('sample') &&
      !o.orderNumber?.includes('880') &&
      o.customerEmail !== 'recruiter@pcforge.dev' &&
      o.customerEmail !== 'demo@pcforge.dev' &&
      o.customerName !== 'Sample Order'
    )
    if (realOrders.length !== parsed.length) {
      localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(realOrders))
    }
    return realOrders
  } catch {
    return []
  }
}

export function saveStoredOrder(order) {
  try {
    const orders = getStoredOrders()
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
      if (nextStatus === 'paid' || nextStatus === 'assembling' || nextStatus === 'tested' || nextStatus === 'shipped' || nextStatus === 'delivered') {
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

export function clearAllStoredOrders() {
  try {
    localStorage.removeItem(ORDERS_STORAGE_KEY)
    window.dispatchEvent(new CustomEvent('pcforge-orders-updated', { detail: { action: 'cleared' } }))
  } catch (err) {
    console.error('Failed to clear orders from localStorage:', err)
  }
}

export function getStoredUsers() {
  try {
    const raw = localStorage.getItem(USERS_STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    // Filter out demo/recruiter users
    const realUsers = parsed.filter(u =>
      u &&
      !u.isDemo &&
      u.email !== 'recruiter@pcforge.dev' &&
      u.email !== 'demo@pcforge.dev' &&
      !u.email?.includes('designstudio.in') &&
      !u.email?.includes('gaminghub.com')
    )
    if (realUsers.length !== parsed.length) {
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(realUsers))
    }
    return realUsers
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
        name: user.name || 'User',
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
