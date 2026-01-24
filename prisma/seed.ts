// prisma/seed.ts
// Run with: npx ts-node prisma/seed.ts

import { PrismaClient, Role } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Create superadmin user with specified credentials
  const hashedPassword = await bcrypt.hash('Password1!', 10)
  
  const superadmin = await prisma.user.upsert({
    where: { username: 'superadmin' },
    update: {},
    create: {
      email: '',
      username: 'superadmin',
      password: hashedPassword,
      role: Role.SUPERADMIN
    }
  })

  console.log('✅ Created superadmin:', superadmin.username)

  // Create initial egg count record
  let eggCount = await prisma.eggCount.findFirst()
  
  if (!eggCount) {
    eggCount = await prisma.eggCount.create({
      data: { count: 0 }
    })
    console.log('✅ Created initial egg count record')
  } else {
    console.log('ℹ️ Egg count record already exists')
  }

  console.log('🎉 Seeding completed!')
  console.log('')
  console.log('📝 Superadmin credentials:')
  console.log('   Username: superadmin')
  console.log('   Password: Password1!')
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
