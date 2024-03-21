import { env } from '$env/dynamic/private'
import { Pool, neonConfig } from '@neondatabase/serverless'
import type { Handle } from '@sveltejs/kit'
import { drizzle } from 'drizzle-orm/neon-serverless'
import { schema } from '$lib/server/db'
import { dev } from '$app/environment'

export const handle: Handle = async ({ event, resolve }) => {
  if (dev) {
    const { default: ws } = await import('ws')
    neonConfig.webSocketConstructor = ws
  }

  const pool = new Pool({ connectionString: env.DATABASE_URL })
  event.locals.db = drizzle(pool, { schema })

  const response = await resolve(event)
  await pool.end()
  return response
}
