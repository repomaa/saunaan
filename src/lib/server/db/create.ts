import { Pool, neonConfig } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-serverless'
import * as schema from './schema'
import ws from 'ws'

neonConfig.webSocketConstructor = ws

export function createDb(dbUrl: string) {
  const pool = new Pool({ connectionString: dbUrl })
  return drizzle(pool, { schema })
}
