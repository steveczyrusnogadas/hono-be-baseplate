import { Hono } from 'hono'
import { config } from './config'

const app = new Hono()

app.get('/', (c) => {
  return c.json({ message: 'Hello Hono!' })
})

export default {
  port: config.server.port,
  fetch: app.fetch,
}
