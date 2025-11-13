const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function verify() {
  try {
    // 检查系统用户
    const systemUser = await prisma.user.findUnique({
      where: { email: 'system@workflow.com' }
    })
    console.log('📋 系统用户:', systemUser ? `✅ ${systemUser.email}` : '❌ 未找到')

    // 检查工作流模板
    const templates = await prisma.workflow.findMany({
      where: { isTemplate: true },
      select: {
        id: true,
        title: true,
        category: true,
        isPublic: true,
        isTemplate: true,
        isDraft: true
      }
    })

    console.log('\n📦 工作流模板数量:', templates.length)
    templates.forEach((t, i) => {
      console.log(`  ${i+1}. ${t.title} [${t.category}] - Public:${t.isPublic}, Draft:${t.isDraft}`)
    })

    // 检查工具
    const tools = await prisma.tool.findMany({
      where: { isBuiltIn: true },
      select: { name: true, category: true, isActive: true }
    })
    console.log('\n🔧 内置工具数量:', tools.length)
    tools.forEach((t, i) => {
      console.log(`  ${i+1}. ${t.name} [${t.category}] - Active:${t.isActive}`)
    })

    // 检查工作项
    const workItems = await prisma.workItem.findMany({
      select: { name: true, icon: true, category: true }
    })
    console.log('\n💼 工作项数量:', workItems.length)
    workItems.forEach((w, i) => {
      console.log(`  ${i+1}. ${w.icon} ${w.name} [${w.category}]`)
    })

    // 检查模型定价
    const pricings = await prisma.modelPricing.findMany({
      where: { isActive: true },
      select: { provider: true, modelName: true, inputPrice: true, outputPrice: true },
      orderBy: { sortOrder: 'asc' }
    })
    console.log('\n💰 模型定价数量:', pricings.length)
    pricings.forEach((p, i) => {
      console.log(`  ${i+1}. ${p.modelName} (${p.provider}) - 输入:${p.inputPrice} 输出:${p.outputPrice} 积分/1K tokens`)
    })

    console.log('\n✅ 种子数据验证完成!')
  } catch (error) {
    console.error('❌ 验证失败:', error)
  } finally {
    await prisma.$disconnect()
  }
}

verify()
