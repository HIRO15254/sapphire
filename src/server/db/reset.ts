import { sql } from 'drizzle-orm'
import { db } from './index'

const reset = async () => {
  console.log('WARNING: This will drop all tables in the database!')
  console.log('Press Ctrl+C within 5 seconds to cancel...')

  await new Promise((resolve) => setTimeout(resolve, 5000))

  console.log('Dropping all tables...')

  // Get all table names in the public schema
  const tables = await db.execute<{ tablename: string }>(sql`
    SELECT tablename FROM pg_tables WHERE schemaname = 'public'
  `)

  // Drop all tables
  for (const { tablename } of tables) {
    console.log(`Dropping table: ${tablename}`)
    await db.execute(sql.raw(`DROP TABLE IF EXISTS "${tablename}" CASCADE`))
  }

  console.log('All tables dropped!')
  console.log('Run "bun run db:migrate" to recreate tables.')
  process.exit(0)
}

reset().catch((error) => {
  console.error('Reset failed:', error)
  process.exit(1)
})
