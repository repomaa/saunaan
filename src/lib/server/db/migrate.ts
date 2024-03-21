import { drizzle } from 'drizzle-orm/neon-http'
import { neon } from '@neondatabase/serverless'
import { migrate } from 'drizzle-orm/neon-http/migrator'

const sql = neon(process.env.DATABASE_URL!)
const db = drizzle(sql)

try {
  await migrate(db, { migrationsFolder: 'drizzle' })
  console.log('Migration completed')
} catch (error) {
  console.error('Error during migration:', error)
  process.exit(1)
}
