import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const defaultSections = [
  { name: '最近使用', type: 'recent', order: 0, isSystem: true },
  { name: '我的AI工作法', type: 'workflows', order: 1, isSystem: true },
  { name: 'AI工作方法收藏夹', type: 'favorites', order: 2, isSystem: true },
  { name: '工作画布', type: 'canvas', order: 3, isSystem: true },
]

async function seedSections() {
  console.log('开始初始化导航一级分类...')

  for (const section of defaultSections) {
    const existing = await prisma.navigationSection.findFirst({
      where: {
        type: section.type,
        isSystem: true
      }
    })

    if (existing) {
      await prisma.navigationSection.update({
        where: { id: existing.id },
        data: {
          name: section.name,
          order: section.order
        }
      })
      console.log(`✅ 更新分类: ${section.name}`)
    } else {
      await prisma.navigationSection.create({
        data: section
      })
      console.log(`✅ 创建分类: ${section.name}`)
    }
  }

  console.log('导航一级分类初始化完成！')
}

seedSections()
  .catch((e) => {
    console.error('初始化失败:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
