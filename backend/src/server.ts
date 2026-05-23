import 'dotenv/config'
import app from './app'
import { logger } from './config/logger'

const PORT = Number(process.env.PORT ?? 3000)

app.listen(PORT, () => {
  logger.info(`LinkGuard backend running on http://localhost:${PORT}`)
  logger.info(`Environment: ${process.env.NODE_ENV ?? 'development'}`)
})
