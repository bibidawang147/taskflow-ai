import prisma from '../utils/database'
import { sampleWorkflows } from '../data/sampleWorkflows'
import { buildSampleCanvasSnapshot } from '../data/sampleCanvas'

/**
 * 为新注册用户初始化示例工作流
 * 创建到 AI 工作方法库，按 6 个默认分类分组显示
 * 返回创建的 workflow ID 数组（与 sampleWorkflows 顺序一致）
 */
export async function initializeSampleWorkflows(userId: string): Promise<string[]> {
  try {
    const existingCount = await prisma.workflow.count({ where: { authorId: userId } })
    if (existingCount > 0) return []

    const createdIds: string[] = []
    for (const wf of sampleWorkflows) {
      const created = await prisma.workflow.create({
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
      createdIds.push(created.id)
    }
    return createdIds
  } catch (error) {
    console.error('初始化示例工作流失败:', error)
    return []
  }
}

/**
 * 为新注册用户初始化示例画布
 * workflowIds: initializeSampleWorkflows 返回的 ID 数组
 */
export async function initializeSampleCanvas(userId: string, workflowIds: string[]): Promise<void> {
  try {
    const existing = await prisma.workspaceLayout.findUnique({ where: { userId } })
    if (existing) return

    const snapshot = workflowIds.length >= 12
      ? buildSampleCanvasSnapshot(workflowIds)
      : {
          cards: [],
          zoom: 1.0,
          canvasItems: {
            'canvas-root': {
              id: 'canvas-root',
              type: 'container',
              name: '工作流画布',
              parentId: '',
              position: { x: 0, y: 0 },
              size: { width: 3200, height: 1800 },
              collapsed: false,
              childrenIds: [],
              color: 'rgba(139, 92, 246, 0.15)'
            }
          },
          canvasEdges: {},
        }

    await prisma.workspaceLayout.create({
      data: {
        userId,
        layout: [],
        zoom: 1.0,
        snapshot
      }
    })
  } catch (error) {
    console.error('初始化示例画布失败:', error)
  }
}
