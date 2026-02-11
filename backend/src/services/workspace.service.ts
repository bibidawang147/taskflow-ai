import prisma from '../utils/database'
import { sampleWorkflows } from '../data/sampleWorkflows'

// 画布常量（与前端 StoragePage.tsx 保持一致）
const CARD_WIDTH = 264
const CARD_HEIGHT = 133
const CARD_GAP = 24
const CONTAINER_PADDING = 16
const CONTAINER_HEADER_HEIGHT = 30
const ROOT_CONTAINER_ID = 'canvas-root'

// 容器颜色（对应前端分类色系）
const CATEGORY_COLORS: Record<string, string> = {
  '副业专区': 'rgba(217, 119, 6, 0.12)',
  '内容创作': 'rgba(219, 39, 119, 0.12)',
  '视频制作': 'rgba(220, 38, 38, 0.12)',
  '数据分析': 'rgba(37, 99, 235, 0.12)',
  '图文设计': 'rgba(5, 150, 105, 0.12)',
  '效率工具': 'rgba(124, 58, 237, 0.12)',
}

interface CreatedWorkflow {
  id: string
  title: string
  category: string
}

/**
 * 为新注册用户初始化示例工作流
 * 返回创建的工作流列表（用于后续画布初始化）
 */
export async function initializeSampleWorkflows(userId: string): Promise<CreatedWorkflow[]> {
  try {
    const existingCount = await prisma.workflow.count({ where: { authorId: userId } })
    if (existingCount > 0) return []

    const created: CreatedWorkflow[] = []
    for (const wf of sampleWorkflows) {
      const workflow = await prisma.workflow.create({
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
      created.push({ id: workflow.id, title: workflow.title, category: wf.category })
    }
    return created
  } catch (error) {
    console.error('初始化示例工作流失败:', error)
    return []
  }
}

/**
 * 为新注册用户初始化画布，把示例工作流按分类放入容器
 */
export async function initializeSampleCanvas(
  userId: string,
  workflows: CreatedWorkflow[] = []
): Promise<void> {
  try {
    const existing = await prisma.workspaceLayout.findUnique({ where: { userId } })
    if (existing) return

    // 按分类分组
    const byCategory = new Map<string, CreatedWorkflow[]>()
    for (const wf of workflows) {
      const list = byCategory.get(wf.category) || []
      list.push(wf)
      byCategory.set(wf.category, list)
    }

    const canvasItems: Record<string, any> = {
      [ROOT_CONTAINER_ID]: {
        id: ROOT_CONTAINER_ID,
        type: 'container',
        name: '工作流画布',
        parentId: '',
        position: { x: 0, y: 0 },
        size: { width: 3200, height: 1800 },
        collapsed: false,
        childrenIds: [] as string[],
        color: 'rgba(139, 92, 246, 0.15)'
      }
    }

    // 布局参数：3列2行排列容器
    const COLS = 3
    const CONTAINER_GAP = 40
    const START_X = 60
    const START_Y = 60
    // 每个容器宽度：容纳2张卡片横排
    const containerInnerW = CARD_WIDTH * 2 + CARD_GAP + CONTAINER_PADDING * 2
    const containerInnerH = CARD_HEIGHT + CONTAINER_PADDING * 2

    const categories = Array.from(byCategory.keys())

    categories.forEach((category, index) => {
      const col = index % COLS
      const row = Math.floor(index / COLS)
      const containerX = START_X + col * (containerInnerW + CONTAINER_GAP)
      const containerY = START_Y + row * (containerInnerH + CONTAINER_HEADER_HEIGHT + CONTAINER_GAP + 20)

      const containerId = `container-${index}`
      const childIds: string[] = []
      const wfList = byCategory.get(category) || []

      // 创建容器内的工作流卡片
      wfList.forEach((wf, wfIndex) => {
        const cardId = `card-${index}-${wfIndex}`
        const cardCol = wfIndex % 2
        const cardRow = Math.floor(wfIndex / 2)
        canvasItems[cardId] = {
          id: cardId,
          type: 'workflow',
          workflowId: wf.id,
          parentId: containerId,
          position: {
            x: containerX + CONTAINER_PADDING + cardCol * (CARD_WIDTH + CARD_GAP),
            y: containerY + CONTAINER_HEADER_HEIGHT + CONTAINER_PADDING + cardRow * (CARD_HEIGHT + CARD_GAP)
          }
        }
        childIds.push(cardId)
      })

      // 根据实际卡片数量计算容器高度
      const cardRows = Math.ceil(wfList.length / 2)
      const actualH = cardRows * (CARD_HEIGHT + CARD_GAP) - CARD_GAP + CONTAINER_PADDING * 2

      canvasItems[containerId] = {
        id: containerId,
        type: 'container',
        name: category,
        parentId: ROOT_CONTAINER_ID,
        position: { x: containerX, y: containerY },
        size: { width: containerInnerW, height: Math.max(actualH, CARD_HEIGHT + CONTAINER_PADDING * 2) },
        collapsed: false,
        childrenIds: childIds,
        color: CATEGORY_COLORS[category] || 'rgba(139, 92, 246, 0.12)'
      }

      // 注册到根容器
      ;(canvasItems[ROOT_CONTAINER_ID].childrenIds as string[]).push(containerId)
    })

    await prisma.workspaceLayout.create({
      data: {
        userId,
        layout: [],
        zoom: 1.0,
        snapshot: {
          cards: [],
          zoom: 0.85,
          canvasItems,
          canvasEdges: {},
        }
      }
    })
  } catch (error) {
    console.error('初始化示例画布失败:', error)
  }
}
