import * as dotenv from 'dotenv'
import * as path from 'path'

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env.local') })

// Now import after env is loaded
import { seedDatabase } from '../src/lib/seed-data'

async function main() {
  console.log('Starting database seeding...')
  console.log('Supabase URL:', process.env['NEXT_PUBLIC_SUPABASE_URL'])
  
  await seedDatabase()
  console.log('Seeding complete!')
  process.exit(0)
}

main().catch((error) => {
  console.error('Seed script failed:', error)
  process.exit(1)
})