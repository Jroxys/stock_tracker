import { prisma } from './lib/prisma.js'

async function main() {
  // Create a new user with a post
  const User = await prisma.user.create({
    data: {
        username: 'testuser',
      telegramId: 'testId123',
    }
  })
  console.log('Created user:', User)

  const allUsers = await prisma.user.findMany({
  })
  console.log('All users:', JSON.stringify(allUsers, null, 2))
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })