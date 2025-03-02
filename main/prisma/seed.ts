import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Add your dummy data here
  console.log('Seeded database')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
