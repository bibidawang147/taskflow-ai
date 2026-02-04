import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const defaultCategories = [
  { name: '变现专区', icon: '💰', order: 1, isSystem: true },
  { name: '内容创作', icon: '✍️', order: 2, isSystem: true },
  { name: '视频制作', icon: '🎬', order: 3, isSystem: true },
  { name: '数据分析', icon: '📊', order: 4, isSystem: true },
  { name: '图文设计', icon: '🎨', order: 5, isSystem: true },
  { name: '效率工具', icon: '⚡', order: 6, isSystem: true },
]

async function seedCategories() {
  console.log('开始初始化工作流分类...')

  for (const category of defaultCategories) {
    // 使用 upsert：如果存在相同名称的系统分类则更新，否则创建
    const existing = await prisma.workflowCategory.findFirst({
      where: {
        name: category.name,
        isSystem: true
      }
    })

    if (existing) {
      await prisma.workflowCategory.update({
        where: { id: existing.id },
        data: {
          icon: category.icon,
          order: category.order
        }
      })
      console.log(`✅ 更新分类: ${category.name}`)
    } else {
      await prisma.workflowCategory.create({
        data: category
      })
      console.log(`✅ 创建分类: ${category.name}`)
    }
  }

  console.log('工作流分类初始化完成！')
}

seedCategories()
  .catch((e) => {
    console.error('初始化失败:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
