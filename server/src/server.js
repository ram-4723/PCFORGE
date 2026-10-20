import 'dotenv/config'
import createApp from './app.js'
import { connectDatabase, disconnectDatabase } from './config/database.js'

const port = Number(process.env.PORT || 3001)

try {
  await connectDatabase()
  const server = createApp().listen(port, () => {
    console.log(`PCForge API listening on port ${port}`)
  })

  async function shutdown(signal) {
    console.log(`${signal} received. Closing PCForge API.`)
    server.close(async () => {
      await disconnectDatabase()
      process.exit(0)
    })
  }

  process.once('SIGINT', () => shutdown('SIGINT'))
  process.once('SIGTERM', () => shutdown('SIGTERM'))
} catch (error) {
  console.error(error.message)
  process.exitCode = 1
}
