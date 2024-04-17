import {sequence} from '@sveltejs/kit/hooks';
import * as Sentry from '@sentry/sveltekit';
import { env } from '$env/dynamic/private'
import { Pool, neonConfig } from '@neondatabase/serverless'
import type { Handle } from '@sveltejs/kit'
import { drizzle } from 'drizzle-orm/neon-serverless'
import { schema } from '$lib/server/db'
import { dev } from '$app/environment'

Sentry.init({
    dsn: "https://c576d0d3a3ea50f83f647bb4dff761f5@o4507101945462784.ingest.de.sentry.io/4507101947560016",
    tracesSampleRate: 1
})

export const handle: Handle = sequence(Sentry.sentryHandle(), async ({ event, resolve }) => {
  if (dev) {
    const { default: ws } = await import('ws')
    neonConfig.webSocketConstructor = ws
  }

  const pool = new Pool({ connectionString: env.DATABASE_URL })
  event.locals.db = drizzle(pool, { schema })

  const response = await resolve(event)
  await pool.end()
  return response
})
export const handleError = Sentry.handleErrorWithSentry();