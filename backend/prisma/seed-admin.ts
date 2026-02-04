/**
 * 设置管理员脚本
 *
 * 使用方法：
 * npx ts-node prisma/seed-admin.ts <email>
 *
 * 示例：
 * npx ts-node prisma/seed-admin.ts admin@example.com
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const email = process.argv[2]

  if (!email) {
    console.log('使用方法: npx ts-node prisma/seed-admin.ts <email>')
    console.log('示例: npx ts-node prisma/seed-admin.ts admin@example.com')
    console.log('')

    // 列出所有用户
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        isAdmin: true,
        tier: true
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    })

    console.log('最近的用户列表:')
    console.log('━'.repeat(60))
    users.forEach(user => {
      const adminBadge = user.isAdmin ? ' [管理员]' : ''
      const tierBadge = user.tier === 'pro' ? ' [Pro]' : ''
      console.log(`${user.email}${adminBadge}${tierBadge}`)
      console.log(`  ID: ${user.id}`)
      console.log(`  名称: ${user.name}`)
      console.log('')
    })

    process.exit(0)
  }

  // 查找用户
  const user = await prisma.user.findUnique({
    where: { email }
  })

  if (!user) {
    console.error(`错误: 找不到用户 ${email}`)
    process.exit(1)
  }

  // 设置为管理员
  await prisma.user.update({
    where: { id: user.id },
    data: { isAdmin: true }
  })

  console.log(`✅ 已将用户 ${user.name} (${email}) 设置为管理员`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
