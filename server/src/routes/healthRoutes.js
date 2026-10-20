import { Router } from 'express'

export function createHealthRoutes({ isDatabaseConnected }) {
  const router = Router()
  router.get('/health', (request, response) => {
    const connected = isDatabaseConnected()
    return response.status(connected ? 200 : 503).json({
      success: connected,
      data: { status: connected ? 'ok' : 'degraded', database: connected ? 'connected' : 'disconnected' },
    })
  })
  return router
}
