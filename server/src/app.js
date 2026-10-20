import express from 'express'
import cors from 'cors'
import mongoose from 'mongoose'
import Component from './models/component.js'
import { databaseIsConnected } from './config/database.js'
import { createComponentRoutes } from './routes/componentRoutes.js'
import { createHealthRoutes } from './routes/healthRoutes.js'
import { errorHandler, notFoundHandler } from './middleware/errors.js'
import { ApiError } from './middleware/errors.js'

function allowedOrigins(value = process.env.FRONTEND_ORIGINS || 'http://localhost:5173') {
  return value.split(',').map((origin) => origin.trim()).filter(Boolean)
}

export function createApp({ ComponentModel = Component, isDatabaseConnected = databaseIsConnected } = {}) {
  const app = express()
  const origins = allowedOrigins()

  app.disable('x-powered-by')
  app.use(cors({
    origin(origin, callback) {
      if (!origin || origins.includes(origin)) return callback(null, true)
      return callback(new ApiError(403, 'ORIGIN_NOT_ALLOWED', 'This origin is not allowed to access the API.'))
    },
  }))
  app.use(express.json({ limit: '32kb' }))
  app.use('/api', createHealthRoutes({ isDatabaseConnected }))
  app.use('/api/components', createComponentRoutes({ ComponentModel, isDatabaseConnected }))
  app.use(notFoundHandler)
  app.use(errorHandler)
  return app
}

export default createApp
