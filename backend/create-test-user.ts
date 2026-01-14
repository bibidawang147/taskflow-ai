import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function createTestUser() {
  try {
    // 简单易记的测试账号
    const email = 'test@test.com'
    const password = '123456'
    const hashedPassword = await bcrypt.hash(password, 10)

    // 删除旧的测试用户（如果存在）
    await prisma.user.deleteMany({
      where: { email }
    })

    // 创建新用户
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name: '测试用户',
        tier: 'pro'
      }
    })

    console.log('\n✅ 测试账号创建成功！')
    console.log('=' .repeat(50))
    console.log('📧 邮箱:', email)
    console.log('🔑 密码:', password)
    console.log('👤 用户ID:', user.id)
    console.log('👑 会员等级:', user.tier)
    console.log('=' .repeat(50))
    console.log('\n可以使用这个账号登录了！')

  } catch (error) {
    console.error('❌ 创建用户失败:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createTestUser()
