// db import will be used when seed data is implemented
// import { db } from './index'

const seed = async () => {
  console.log('Seeding database...')

  // TODO: Add seed data for development
  // This is a placeholder - actual seed logic will be added in later phases

  console.log('Seeding completed!')
  process.exit(0)
}

seed().catch((error) => {
  console.error('Seeding failed:', error)
  process.exit(1)
})
