import type { NeonDatabase } from 'drizzle-orm/neon-serverless'
import * as schema from './schema'
export type Schema = typeof schema
export type Database = NeonDatabase<Schema>
export { schema }
