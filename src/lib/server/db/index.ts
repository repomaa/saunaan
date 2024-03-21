import { env } from '$env/dynamic/private'
import { createDb } from './create'

export * from './schema'
export default createDb(env.DATABASE_URL)
