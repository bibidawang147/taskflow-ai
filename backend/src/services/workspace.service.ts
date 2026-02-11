import prisma from '../utils/database'
import { sampleCanvasItems, sampleCanvasEdges } from '../data/sampleCanvas'
import { sampleWorkflows } from '../data/sampleWorkflows'

/**
 * 为新注册用户初始化示例画布
 */
export async function initializeSampleCanvas(userId: string): Promise<void> {
  try {
    // 检查是否只有空的默认画布（避免重复初始化）
    const existing = await prisma.workspaceLayout.findUnique({ where: { userId } })
    if (existing) return

    await prisma.workspaceLayout.create({
      data: {
        userId,
        layout: [],
        zoom: 1.0,
        snapshot: {
          cards: [],
          zoom: 1.0,
          canvasItems: sampleCanvasItems,
          canvasEdges: sampleCanvasEdges,
        }
      }
    })
  } catch (error) {
    // 不阻断注册流程
    console.error('初始化示例画布失败:', error)
  }
}

/**
 * 为新注册用户初始化示例工作流
 * 创建几个预设的工作流卡片，让用户看到"AI工作方法库"有内容
 */
export async function initializeSampleWorkflows(userId: string): Promise<void> {
  try {
    // 检查用户是否已有工作流（避免重复初始化）
    const existingCount = await prisma.workflow.count({ where: { authorId: userId } })
    if (existingCount > 0) return

    for (const wf of sampleWorkflows) {
      await prisma.workflow.create({
        data: {
          title: wf.title,
          description: wf.description,
          category: wf.category,
          tags: wf.tags,
          config: wf.config,
          isDraft: false,
          isPublic: false,
          isTemplate: false,
          authorId: userId,
        }
      })
    }
  } catch (error) {
    // 不阻断注册流程
    console.error('初始化示例工作流失败:', error)
  }
}
