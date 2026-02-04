import prisma from '../utils/database';

// 工作方法访问类型
export type WorkflowAccessType = 'free' | 'member' | 'paid';

// 用户等级配置
const TIER_CONFIG = {
  free: {
    maxCanvases: 1,
    canViewFreeContent: false,    // 免费用户不能查看步骤详细内容
    canViewMemberContent: false,
    canCopyFreeWorkflow: true,    // 可以复制免费工作方法
    canCopyMemberWorkflow: false,
    canPurchasePaidWorkflow: false,
    canBecomeCreator: false,
  },
  pro: {
    maxCanvases: 5,
    canViewFreeContent: true,     // 可查看免费方法完整步骤
    canViewMemberContent: true,   // 可查看会员方法完整步骤
    canCopyFreeWorkflow: true,
    canCopyMemberWorkflow: true,
    canPurchasePaidWorkflow: true,
    canBecomeCreator: true,
  },
};

// 成为创作者需要的免费工作方法数量
const CREATOR_REQUIRED_FREE_WORKFLOWS = 10;

export class PermissionService {

  /**
   * 获取用户信息（包含创作者状态）
   */
  async getUserWithCreatorInfo(userId: string) {
    return await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        tier: true,
        isCreator: true,
        creatorStatus: true,
      },
    });
  }

  /**
   * 获取工作方法信息
   */
  async getWorkflowAccessInfo(workflowId: string) {
    return await prisma.workflow.findUnique({
      where: { id: workflowId },
      select: {
        id: true,
        accessType: true,
        price: true,
        authorId: true,
      },
    });
  }

  /**
   * 检查用户是否已购买该付费工作方法
   */
  async hasPurchased(userId: string, workflowId: string): Promise<boolean> {
    const purchase = await prisma.workflowPurchase.findUnique({
      where: {
        userId_workflowId: {
          userId,
          workflowId,
        },
      },
    });
    return !!purchase;
  }

  /**
   * 判断用户是否能查看工作方法的步骤详细内容
   *
   * 规则：
   * - 免费用户：不能查看任何步骤详细内容
   * - Pro 用户：
   *   - 免费工作方法：可查看
   *   - 会员工作方法：可查看
   *   - 付费工作方法：购买后可查看
   * - 作者本人：始终可查看
   */
  async canViewWorkflowContent(userId: string, workflowId: string): Promise<{
    canView: boolean;
    reason?: string;
    needPurchase?: boolean;
    price?: number;
  }> {
    const user = await this.getUserWithCreatorInfo(userId);
    if (!user) {
      return { canView: false, reason: '用户不存在' };
    }

    const workflow = await this.getWorkflowAccessInfo(workflowId);
    if (!workflow) {
      return { canView: false, reason: '工作方法不存在' };
    }

    // 作者本人始终可查看
    if (workflow.authorId === userId) {
      return { canView: true };
    }

    const tierConfig = TIER_CONFIG[user.tier as keyof typeof TIER_CONFIG] || TIER_CONFIG.free;
    const accessType = workflow.accessType as WorkflowAccessType;

    // 付费工作方法特殊处理
    if (accessType === 'paid') {
      const purchased = await this.hasPurchased(userId, workflowId);
      if (purchased) {
        return { canView: true };
      }
      // Pro 用户可以购买
      if (tierConfig.canPurchasePaidWorkflow) {
        return {
          canView: false,
          reason: '需要购买后查看',
          needPurchase: true,
          price: workflow.price || 0,
        };
      }
      // 免费用户不能购买
      return {
        canView: false,
        reason: '升级会员后可购买此工作方法',
      };
    }

    // 免费工作方法
    if (accessType === 'free') {
      if (tierConfig.canViewFreeContent) {
        return { canView: true };
      }
      return {
        canView: false,
        reason: '升级会员查看详细步骤内容',
      };
    }

    // 会员工作方法
    if (accessType === 'member') {
      if (tierConfig.canViewMemberContent) {
        return { canView: true };
      }
      return {
        canView: false,
        reason: '升级会员查看详细步骤内容',
      };
    }

    return { canView: false, reason: '无权查看' };
  }

  /**
   * 判断用户是否能复制工作方法
   *
   * 规则：
   * - 免费用户：只能复制免费工作方法
   * - Pro 用户：可以复制免费和会员工作方法
   * - 付费工作方法：购买后可复制
   */
  async canCopyWorkflow(userId: string, workflowId: string): Promise<{
    canCopy: boolean;
    reason?: string;
  }> {
    const user = await this.getUserWithCreatorInfo(userId);
    if (!user) {
      return { canCopy: false, reason: '用户不存在' };
    }

    const workflow = await this.getWorkflowAccessInfo(workflowId);
    if (!workflow) {
      return { canCopy: false, reason: '工作方法不存在' };
    }

    // 作者本人始终可复制
    if (workflow.authorId === userId) {
      return { canCopy: true };
    }

    const tierConfig = TIER_CONFIG[user.tier as keyof typeof TIER_CONFIG] || TIER_CONFIG.free;
    const accessType = workflow.accessType as WorkflowAccessType;

    // 付费工作方法
    if (accessType === 'paid') {
      const purchased = await this.hasPurchased(userId, workflowId);
      if (purchased) {
        return { canCopy: true };
      }
      return { canCopy: false, reason: '需要购买后才能复制' };
    }

    // 免费工作方法
    if (accessType === 'free') {
      if (tierConfig.canCopyFreeWorkflow) {
        return { canCopy: true };
      }
      return { canCopy: false, reason: '无权复制' };
    }

    // 会员工作方法
    if (accessType === 'member') {
      if (tierConfig.canCopyMemberWorkflow) {
        return { canCopy: true };
      }
      return { canCopy: false, reason: '升级会员后可复制此工作方法' };
    }

    return { canCopy: false, reason: '无权复制' };
  }

  /**
   * 判断用户能发布什么类型的工作方法
   *
   * 规则：
   * - 免费用户：只能发布免费工作方法
   * - Pro 用户（非创作者）：只能发布免费工作方法
   * - 创作者：可以发布免费、会员、付费工作方法
   */
  async canPublishWorkflowType(userId: string, accessType: WorkflowAccessType): Promise<{
    canPublish: boolean;
    reason?: string;
  }> {
    const user = await this.getUserWithCreatorInfo(userId);
    if (!user) {
      return { canPublish: false, reason: '用户不存在' };
    }

    // 免费工作方法：所有人都可以发布
    if (accessType === 'free') {
      return { canPublish: true };
    }

    // 会员和付费工作方法：需要是创作者
    if (accessType === 'member' || accessType === 'paid') {
      if (user.isCreator) {
        return { canPublish: true };
      }
      return {
        canPublish: false,
        reason: '需要成为创作者后才能发布会员/付费工作方法',
      };
    }

    return { canPublish: false, reason: '无效的工作方法类型' };
  }

  /**
   * 判断用户是否能购买付费工作方法
   */
  async canPurchaseWorkflow(userId: string): Promise<{
    canPurchase: boolean;
    reason?: string;
  }> {
    const user = await this.getUserWithCreatorInfo(userId);
    if (!user) {
      return { canPurchase: false, reason: '用户不存在' };
    }

    const tierConfig = TIER_CONFIG[user.tier as keyof typeof TIER_CONFIG] || TIER_CONFIG.free;

    if (tierConfig.canPurchasePaidWorkflow) {
      return { canPurchase: true };
    }

    return {
      canPurchase: false,
      reason: '升级会员后可购买付费工作方法',
    };
  }

  /**
   * 判断用户是否可以申请成为创作者
   *
   * 条件：
   * 1. 必须是 Pro 用户
   * 2. 已发布 ≥10 个免费工作方法
   * 3. 当前不是创作者且没有待审核的申请
   */
  async canApplyForCreator(userId: string): Promise<{
    canApply: boolean;
    reason?: string;
    currentCount?: number;
    requiredCount?: number;
  }> {
    const user = await this.getUserWithCreatorInfo(userId);
    if (!user) {
      return { canApply: false, reason: '用户不存在' };
    }

    // 已经是创作者
    if (user.isCreator) {
      return { canApply: false, reason: '你已经是创作者了' };
    }

    // 有待审核的申请
    if (user.creatorStatus === 'pending') {
      return { canApply: false, reason: '你的创作者申请正在审核中' };
    }

    // 必须是 Pro 用户
    if (user.tier !== 'pro') {
      return {
        canApply: false,
        reason: '需要先升级为会员用户',
      };
    }

    // 统计已发布的免费工作方法数量
    const freeWorkflowCount = await prisma.workflow.count({
      where: {
        authorId: userId,
        isPublic: true,
        isDraft: false,
        accessType: 'free',
      },
    });

    if (freeWorkflowCount < CREATOR_REQUIRED_FREE_WORKFLOWS) {
      return {
        canApply: false,
        reason: `需要发布 ${CREATOR_REQUIRED_FREE_WORKFLOWS} 个免费工作方法`,
        currentCount: freeWorkflowCount,
        requiredCount: CREATOR_REQUIRED_FREE_WORKFLOWS,
      };
    }

    return {
      canApply: true,
      currentCount: freeWorkflowCount,
      requiredCount: CREATOR_REQUIRED_FREE_WORKFLOWS,
    };
  }

  /**
   * 获取创作者进度信息
   */
  async getCreatorProgress(userId: string): Promise<{
    tier: string;
    isCreator: boolean;
    creatorStatus: string | null;
    freeWorkflowCount: number;
    requiredCount: number;
    canApply: boolean;
  }> {
    const user = await this.getUserWithCreatorInfo(userId);
    if (!user) {
      throw new Error('用户不存在');
    }

    const freeWorkflowCount = await prisma.workflow.count({
      where: {
        authorId: userId,
        isPublic: true,
        isDraft: false,
        accessType: 'free',
      },
    });

    const canApplyResult = await this.canApplyForCreator(userId);

    return {
      tier: user.tier,
      isCreator: user.isCreator,
      creatorStatus: user.creatorStatus,
      freeWorkflowCount,
      requiredCount: CREATOR_REQUIRED_FREE_WORKFLOWS,
      canApply: canApplyResult.canApply,
    };
  }

  /**
   * 获取用户可以发布的工作方法类型列表
   */
  async getAllowedPublishTypes(userId: string): Promise<WorkflowAccessType[]> {
    const user = await this.getUserWithCreatorInfo(userId);
    if (!user) {
      return ['free'];
    }

    if (user.isCreator) {
      return ['free', 'member', 'paid'];
    }

    return ['free'];
  }
}

export const permissionService = new PermissionService();
