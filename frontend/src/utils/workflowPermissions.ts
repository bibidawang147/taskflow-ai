import type { Workflow, WorkflowAccessType, WorkflowPermission } from '../types/workflow'

// 用户会员类型
export type UserMembershipType = 'free' | 'basic' | 'premium' | 'enterprise'

// 用户信息（权限检查需要的部分）
export interface UserForPermission {
  id: string
  membershipType: UserMembershipType
  purchasedWorkflowIds?: string[]  // 已购买的付费工作流ID列表
}

/**
 * 检查用户是否为付费会员
 */
export function isPaidMember(user: UserForPermission | null): boolean {
  if (!user) return false
  return ['basic', 'premium', 'enterprise'].includes(user.membershipType)
}

/**
 * 检查用户是否已购买指定工作流
 */
export function hasPurchasedWorkflow(user: UserForPermission | null, workflowId: string): boolean {
  if (!user) return false
  return user.purchasedWorkflowIds?.includes(workflowId) ?? false
}

/**
 * 检查用户是否为工作流的创作者
 */
export function isWorkflowOwner(user: UserForPermission | null, workflow: { authorId: string }): boolean {
  if (!user) return false
  return user.id === workflow.authorId
}

/**
 * 获取用户对指定工作流的权限
 *
 * @param user 当前用户（null表示未登录）
 * @param workflow 工作流信息
 * @returns 权限对象
 */
export function getWorkflowPermission(
  user: UserForPermission | null,
  workflow: {
    id: string
    authorId: string
    accessType?: WorkflowAccessType
    isPublic?: boolean
  }
): WorkflowPermission {
  const isOwner = isWorkflowOwner(user, workflow)
  const accessType = workflow.accessType || 'free'

  // 创作者拥有所有权限
  if (isOwner) {
    return {
      canView: true,
      canExecute: true,
      canFork: true,
      canEdit: true,
      canDelete: true,
      canPublish: true
    }
  }

  // 非公开工作流，非创作者无权限
  if (workflow.isPublic === false) {
    return {
      canView: false,
      canExecute: false,
      canFork: false,
      canEdit: false,
      canDelete: false,
      canPublish: false
    }
  }

  // 根据访问类型判断权限
  let canFork = false

  switch (accessType) {
    case 'free':
      // 免费工作流：所有人都可以fork
      canFork = true
      break

    case 'member':
      // 会员免费工作流：只有付费会员可以fork
      canFork = isPaidMember(user)
      break

    case 'paid':
      // 付费工作流：只有购买了的用户可以fork
      canFork = hasPurchasedWorkflow(user, workflow.id)
      break
  }

  return {
    canView: true,           // 公开工作流所有人都能查看
    canExecute: true,        // 公开工作流所有人都能执行（预览模式）
    canFork,                 // 根据访问类型和用户状态决定
    canEdit: false,          // 非创作者不能编辑原工作流
    canDelete: false,        // 非创作者不能删除
    canPublish: false        // 非创作者不能发布
  }
}

/**
 * 检查用户是否可以fork工作流
 * 这是一个快捷方法
 */
export function canForkWorkflow(
  user: UserForPermission | null,
  workflow: {
    id: string
    authorId: string
    accessType?: WorkflowAccessType
    isPublic?: boolean
  }
): boolean {
  return getWorkflowPermission(user, workflow).canFork
}

/**
 * 获取权限不足时的提示信息
 */
export function getPermissionDeniedMessage(
  accessType: WorkflowAccessType,
  user: UserForPermission | null
): string {
  if (!user) {
    return '请先登录后再进行操作'
  }

  switch (accessType) {
    case 'member':
      return '此工作流仅限会员使用，请升级会员后再试'
    case 'paid':
      return '此工作流为付费内容，请购买后再使用'
    default:
      return '暂无权限进行此操作'
  }
}

/**
 * 生成新的工作流ID（模拟后端生成）
 * 实际项目中应该由后端生成
 */
export function generateWorkflowId(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  let result = 'wf_'
  for (let i = 0; i < 12; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

/**
 * Fork工作流时的数据处理
 * 创建一个新的工作流副本，记录母工作流ID
 */
export function createForkedWorkflow(
  originalWorkflow: Workflow,
  newOwnerId: string
): Partial<Workflow> {
  return {
    id: generateWorkflowId(),
    title: `${originalWorkflow.title}（副本）`,
    description: originalWorkflow.description,
    thumbnail: originalWorkflow.thumbnail,
    isPublic: false,           // 默认为私有
    isTemplate: false,
    isDraft: true,             // 默认为草稿
    category: originalWorkflow.category,
    tags: [...originalWorkflow.tags],
    config: JSON.parse(JSON.stringify(originalWorkflow.config)), // 深拷贝
    version: '1.0.0',
    authorId: newOwnerId,
    parentWorkflowId: originalWorkflow.id,  // 记录母工作流ID
    accessType: 'free',        // fork后默认为免费
    difficultyLevel: originalWorkflow.difficultyLevel,
    useScenarios: originalWorkflow.useScenarios ? [...originalWorkflow.useScenarios] : undefined,
    preparations: originalWorkflow.preparations
      ? JSON.parse(JSON.stringify(originalWorkflow.preparations))
      : undefined
  }
}
