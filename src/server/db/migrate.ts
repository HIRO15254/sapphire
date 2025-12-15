import { drizzle } from 'drizzle-orm/postgres-js'
import { migrate } from 'drizzle-orm/postgres-js/migrator'
import postgres from 'postgres'

const runMigrations = async () => {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not set')
  }

  const connection = postgres(process.env.DATABASE_URL, { max: 1 })
  const db = drizzle(connection)

  console.log('Running migrations...')

  await migrate(db, { migrationsFolder: './drizzle' })

  console.log('Migrations completed!')

  await connection.end()
  process.exit(0)
}

runMigrations().catch((error) => {
  console.error('Migration failed:', error)
  process.exit(1)
})
