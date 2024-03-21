import 'dotenv/config'
import { migrate } from 'drizzle-orm/neon-serverless/migrator'

import { createDb } from './create'
const db = createDb(process.env.DATABASE_URL!)
await migrate(db, { migrationsFolder: './drizzle' })
