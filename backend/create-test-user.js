const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function createTestUser() {
  try {
    const email = 'test@workflow.com'
    const password = 'test123456'
    const name = '测试用户'

    // 检查用户是否已存在
    const existing = await prisma.user.findUnique({
      where: { email }
    })

    if (existing) {
      console.log('用户已存在，更新密码...')
      const hashedPassword = await bcrypt.hash(password, 10)
      await prisma.user.update({
        where: { email },
        data: { password: hashedPassword }
      })
      console.log('密码已更新！')
    } else {
      console.log('创建新用户...')
      const hashedPassword = await bcrypt.hash(password, 10)
      const user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          name
        }
      })

      // 初始化用户余额
      const now = new Date()
      const tomorrow = new Date(now)
      tomorrow.setDate(tomorrow.getDate() + 1)
      tomorrow.setHours(0, 0, 0, 0)

      await prisma.userBalance.create({
        data: {
          userId: user.id,
          coins: 50000,
          freeQuota: 10000,
          usedToday: 0,
          quotaResetAt: tomorrow
        }
      })

      console.log('新用户创建成功！')
    }

    console.log('\n========== 测试账号信息 ==========')
    console.log('邮箱:', email)
    console.log('密码:', password)
    console.log('================================\n')

  } catch (error) {
    console.error('错误:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createTestUser()
