import mongoose from 'mongoose'

export async function connectDatabase(uri = process.env.MONGODB_URI) {
  if (!uri) {
    throw new Error('MONGODB_URI is required. Set it in server/.env before starting the API.')
  }

  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 10_000 })
    return mongoose.connection
  } catch {
    throw new Error('Could not connect to MongoDB. Check MONGODB_URI, network access, and Atlas IP access settings.')
  }
}

export async function disconnectDatabase() {
  if (mongoose.connection.readyState !== 0) await mongoose.disconnect()
}

export function databaseIsConnected() {
  return mongoose.connection.readyState === 1
}
