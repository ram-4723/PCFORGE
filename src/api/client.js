const API_BASE = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '')

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { Accept: 'application/json', ...(options.body ? { 'Content-Type': 'application/json' } : {}), ...options.headers },
  })
  const payload = await response.json().catch(() => null)
  if (!response.ok) {
    const error = new Error(payload?.error?.message || `Request failed (${response.status})`)
    error.status = response.status
    error.code = payload?.error?.code
    throw error
  }
  return payload?.data
}

export function getComponents(filters = {}) {
  const params = new URLSearchParams({ page: '1', limit: '100', ...Object.fromEntries(Object.entries(filters).filter(([, value]) => value !== undefined && value !== null && value !== '' && value !== 'all')) })
  return request(`/components?${params}`)
}

export function getRecommendation(budgetInr, intendedUse, preference) {
  return request('/builds/recommendations', { method: 'POST', body: JSON.stringify({ budgetInr, intendedUse, preference }) })
}

export function checkBuildCompatibility(componentIds) {
  return request('/builds/compatibility', { method: 'POST', body: JSON.stringify({ componentIds }) })
}

export function saveBuild(payload) { return request('/builds', { method: 'POST', body: JSON.stringify(payload) }) }

export function getSavedBuild(id, sessionToken) {
  return request(`/builds/${encodeURIComponent(id)}`, { headers: { 'X-Build-Session': sessionToken } })
}

export function updateSavedBuild(id, sessionToken, payload) {
  return request(`/builds/${encodeURIComponent(id)}`, { method: 'PUT', headers: { 'X-Build-Session': sessionToken }, body: JSON.stringify(payload) })
}

export function deleteSavedBuild(id, sessionToken) {
  return request(`/builds/${encodeURIComponent(id)}`, { method: 'DELETE', headers: { 'X-Build-Session': sessionToken } })
}

export function createOrder(payload, buildSessionToken, idempotencyKey) {
  return request('/orders', { method: 'POST', headers: { 'X-Build-Session': buildSessionToken, 'Idempotency-Key': idempotencyKey }, body: JSON.stringify(payload) })
}

export function getOrder(id, accessToken) {
  return request(`/orders/${encodeURIComponent(id)}`, { headers: { 'X-Order-Access': accessToken } })
}

export function createPaymentCheckout(id, accessToken, idempotencyKey) {
  return request(`/orders/${encodeURIComponent(id)}/payments`, { method: 'POST', headers: { 'X-Order-Access': accessToken, 'Idempotency-Key': idempotencyKey } })
}

export function verifyPayment(id, accessToken, razorpayPaymentId, razorpaySignature) {
  return request(`/orders/${encodeURIComponent(id)}/payments/verify`, { method: 'POST', headers: { 'X-Order-Access': accessToken }, body: JSON.stringify({ razorpayPaymentId, razorpaySignature }) })
}

export function reportPaymentFailure(id, accessToken, razorpayPaymentId) {
  return request(`/orders/${encodeURIComponent(id)}/payments/fail`, { method: 'POST', headers: { 'X-Order-Access': accessToken }, body: JSON.stringify({ razorpayPaymentId }) })
}

export function registerAccount(name, email, password) {
  return request('/auth/register', { method: 'POST', body: JSON.stringify({ name, email, password }) })
}
export function loginAccount(email, password) {
  return request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) })
}
export function getAdminOverview(accessToken) {
  return request('/admin/overview', { headers: { Authorization: `Bearer ${accessToken}` } })
}
export function getAdminUsers(accessToken, { page = 1, size = 10, search = '' } = {}) {
  const params = new URLSearchParams({ page: String(page), size: String(size) })
  if (search.trim()) params.set('search', search.trim())
  return request(`/admin/users?${params}`, { headers: { Authorization: `Bearer ${accessToken}` } })
}
export function logoutAccount(accessToken) {
  return request('/auth/logout', { method: 'POST', headers: { Authorization: `Bearer ${accessToken}` } })
}

export async function downloadInvoice(id, accessToken) {
  const response = await fetch(`${API_BASE}/orders/${encodeURIComponent(id)}/invoice`, { headers: { Accept: 'application/pdf', 'X-Order-Access': accessToken } })
  if (!response.ok) {
    const payload = await response.json().catch(() => null)
    throw new Error(payload?.error?.message || `Invoice download failed (${response.status})`)
  }
  return response.blob()
}

export { API_BASE }
