import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { Pool } from '@neondatabase/serverless'

const url = process.env.DATABASE_URL
if (!url) {
  console.error('Set DATABASE_URL to your Neon connection string.')
  process.exit(1)
}

const root = dirname(fileURLToPath(import.meta.url))
const schema = readFileSync(join(root, '../db/schema.sql'), 'utf8')
const pool = new Pool({ connectionString: url })

console.log('Applying schema to Neon…')
await pool.query(schema)
await pool.end()
console.log('Done.')
