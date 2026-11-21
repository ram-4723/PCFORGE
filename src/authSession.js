export const AUTH_STORAGE_KEY = 'pcforge-auth-session'

export function readAuthSession() {
  try {
    const session = JSON.parse(sessionStorage.getItem(AUTH_STORAGE_KEY) || 'null')
    if (!session?.accessToken || !session?.user) {
      return null
    }
    if (session.expiresAt && Date.parse(session.expiresAt) <= Date.now()) {
      sessionStorage.removeItem(AUTH_STORAGE_KEY)
      return null
    }
    return session
  } catch {
    sessionStorage.removeItem(AUTH_STORAGE_KEY)
    return null
  }
}

export function storeAuthSession(result) {
  const expiresAt = result.expiresAt || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
  const session = {
    accessToken: result.accessToken,
    expiresAt,
    user: result.user,
    isGuestMode: Boolean(result.isGuestMode)
  }
  sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session))
  return session
}

export function clearAuthSession() {
  sessionStorage.removeItem(AUTH_STORAGE_KEY)
}
