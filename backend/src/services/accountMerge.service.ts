import prisma from '../utils/database'
import { hashPassword } from '../utils/password'

type Tx = Parameters<Parameters<typeof prisma.$transaction>[0]>[0]

/**
 * 在事务中将 absorbedId 的所有关联数据转移到 survivorId，然后删除 absorbedId
 */
async function transferAllData(tx: Tx, survivorId: string, absorbedId: string) {
  // ===== 1. 有唯一约束的关系：先删冲突，再转移 =====

  // Rating: @@unique([userId, workflowId])
  const survivorRatingWfIds = (await tx.rating.findMany({
    where: { userId: survivorId }, select: { workflowId: true }
  })).map(r => r.workflowId)
  if (survivorRatingWfIds.length > 0) {
    await tx.rating.deleteMany({
      where: { userId: absorbedId, workflowId: { in: survivorRatingWfIds } }
    })
  }
  await tx.rating.updateMany({
    where: { userId: absorbedId }, data: { userId: survivorId }
  })

  // Favorite: @@unique([userId, workflowId])
  const survivorFavWfIds = (await tx.favorite.findMany({
    where: { userId: survivorId }, select: { workflowId: true }
  })).map(f => f.workflowId)
  if (survivorFavWfIds.length > 0) {
    await tx.favorite.deleteMany({
      where: { userId: absorbedId, workflowId: { in: survivorFavWfIds } }
    })
  }
  await tx.favorite.updateMany({
    where: { userId: absorbedId }, data: { userId: survivorId }
  })

  // UserWorkflowPreference: @@unique([userId, workflowId])
  const survivorPrefWfIds = (await tx.userWorkflowPreference.findMany({
    where: { userId: survivorId }, select: { workflowId: true }
  })).map(p => p.workflowId)
  if (survivorPrefWfIds.length > 0) {
    await tx.userWorkflowPreference.deleteMany({
      where: { userId: absorbedId, workflowId: { in: survivorPrefWfIds } }
    })
  }
  await tx.userWorkflowPreference.updateMany({
    where: { userId: absorbedId }, data: { userId: survivorId }
  })

  // PostLike: @@unique([userId, postId])
  const survivorPostLikeIds = (await tx.postLike.findMany({
    where: { userId: survivorId }, select: { postId: true }
  })).map(l => l.postId)
  if (survivorPostLikeIds.length > 0) {
    await tx.postLike.deleteMany({
      where: { userId: absorbedId, postId: { in: survivorPostLikeIds } }
    })
  }
  await tx.postLike.updateMany({
    where: { userId: absorbedId }, data: { userId: survivorId }
  })

  // WorkflowLike: @@unique([userId, workflowId])
  const survivorWfLikeIds = (await tx.workflowLike.findMany({
    where: { userId: survivorId }, select: { workflowId: true }
  })).map(l => l.workflowId)
  if (survivorWfLikeIds.length > 0) {
    await tx.workflowLike.deleteMany({
      where: { userId: absorbedId, workflowId: { in: survivorWfLikeIds } }
    })
  }
  await tx.workflowLike.updateMany({
    where: { userId: absorbedId }, data: { userId: survivorId }
  })

  // UsageLimit: @@unique([userId, feature])
  const survivorFeatures = (await tx.usageLimit.findMany({
    where: { userId: survivorId }, select: { feature: true }
  })).map(l => l.feature)
  if (survivorFeatures.length > 0) {
    await tx.usageLimit.deleteMany({
      where: { userId: absorbedId, feature: { in: survivorFeatures } }
    })
  }
  await tx.usageLimit.updateMany({
    where: { userId: absorbedId }, data: { userId: survivorId }
  })

  // PromoCodeRedemption: @@unique([codeId, userId])
  const survivorCodeIds = (await tx.promoCodeRedemption.findMany({
    where: { userId: survivorId }, select: { codeId: true }
  })).map(r => r.codeId)
  if (survivorCodeIds.length > 0) {
    await tx.promoCodeRedemption.deleteMany({
      where: { userId: absorbedId, codeId: { in: survivorCodeIds } }
    })
  }
  await tx.promoCodeRedemption.updateMany({
    where: { userId: absorbedId }, data: { userId: survivorId }
  })

  // ===== 2. 简单 FK 转移 =====
  await tx.workflow.updateMany({ where: { authorId: absorbedId }, data: { authorId: survivorId } })
  await tx.workflowExecution.updateMany({ where: { userId: absorbedId }, data: { userId: survivorId } })
  await tx.comment.updateMany({ where: { userId: absorbedId }, data: { userId: survivorId } })
  await tx.usageLog.updateMany({ where: { userId: absorbedId }, data: { userId: survivorId } })
  await tx.rechargeOrder.updateMany({ where: { userId: absorbedId }, data: { userId: survivorId } })
  await tx.subscription.updateMany({ where: { userId: absorbedId }, data: { userId: survivorId } })
  await tx.conversationHistory.updateMany({ where: { userId: absorbedId }, data: { userId: survivorId } })
  await tx.userIntent.updateMany({ where: { userId: absorbedId }, data: { userId: survivorId } })
  await tx.recommendationLog.updateMany({ where: { userId: absorbedId }, data: { userId: survivorId } })
  await tx.post.updateMany({ where: { authorId: absorbedId }, data: { authorId: survivorId } })
  await tx.chatSession.updateMany({ where: { userId: absorbedId }, data: { userId: survivorId } })
  await tx.workItemUsage.updateMany({ where: { userId: absorbedId }, data: { userId: survivorId } })
  await tx.favoriteTag.updateMany({ where: { userId: absorbedId }, data: { userId: survivorId } })

  // ===== 3. 一对一关系 =====

  // UserBalance: 合并积分
  const survivorBalance = await tx.userBalance.findUnique({ where: { userId: survivorId } })
  const absorbedBalance = await tx.userBalance.findUnique({ where: { userId: absorbedId } })
  if (absorbedBalance) {
    if (survivorBalance) {
      await tx.userBalance.update({
        where: { userId: survivorId },
        data: {
          coins: survivorBalance.coins + absorbedBalance.coins,
          totalRecharged: survivorBalance.totalRecharged + absorbedBalance.totalRecharged,
          totalConsumed: survivorBalance.totalConsumed + absorbedBalance.totalConsumed,
        }
      })
      await tx.userBalance.delete({ where: { userId: absorbedId } })
    } else {
      await tx.userBalance.update({ where: { userId: absorbedId }, data: { userId: survivorId } })
    }
  }

  // WorkspaceLayout: 保留存活方
  await tx.workspaceLayout.deleteMany({ where: { userId: absorbedId } })

  // UserNavigationPrefs: 保留存活方
  await tx.userNavigationPrefs.deleteMany({ where: { userId: absorbedId } })

  // ===== 4. 合并角色/会员等级 =====
  const fullSurvivor = await tx.user.findUnique({
    where: { id: survivorId }, select: { role: true, roleExpiresAt: true }
  })
  const fullAbsorbed = await tx.user.findUnique({
    where: { id: absorbedId }, select: { role: true, roleExpiresAt: true }
  })
  if (fullSurvivor && fullAbsorbed) {
    const ROLE_LEVEL: Record<string, number> = { free: 0, pro: 1, creator: 2, admin: 99 }
    const survivorLevel = ROLE_LEVEL[fullSurvivor.role] ?? 0
    const absorbedLevel = ROLE_LEVEL[fullAbsorbed.role] ?? 0
    const bestRole = absorbedLevel > survivorLevel ? fullAbsorbed.role : fullSurvivor.role

    let bestExpiry = fullSurvivor.roleExpiresAt
    if (fullAbsorbed.roleExpiresAt) {
      if (!bestExpiry || fullAbsorbed.roleExpiresAt > bestExpiry) {
        bestExpiry = fullAbsorbed.roleExpiresAt
      }
    }

    await tx.user.update({
      where: { id: survivorId },
      data: { role: bestRole, roleExpiresAt: bestExpiry }
    })
  }

  // ===== 5. 清理并删除被吸收账号 =====
  // 清除 referralCode 唯一约束
  await tx.user.update({
    where: { id: absorbedId },
    data: { referralCode: null, wechatOpenId: null, wechatUnionId: null }
  })
  await tx.user.delete({ where: { id: absorbedId } })
}

/**
 * 场景A：邮箱用户绑定微信
 */
export async function bindWechatToEmailUser(
  currentUserId: string,
  openid: string,
  unionid: string | null,
  wxNickname: string,
  wxAvatar: string | null
) {
  return await prisma.$transaction(async (tx) => {
    const currentUser = await tx.user.findUnique({
      where: { id: currentUserId },
      select: { wechatOpenId: true }
    })
    if (currentUser?.wechatOpenId) {
      throw new Error('该账号已绑定微信')
    }

    // 检查是否有已存在的微信账号
    const existingWxUser = await tx.user.findUnique({
      where: { wechatOpenId: openid }
    })

    if (!existingWxUser) {
      // 简单绑定：没有已存在的微信账号
      await tx.user.update({
        where: { id: currentUserId },
        data: {
          wechatOpenId: openid,
          wechatUnionId: unionid,
          avatar: wxAvatar || undefined,
        }
      })
      return { merged: false, message: '微信绑定成功' }
    }

    if (existingWxUser.id === currentUserId) {
      return { merged: false, message: '微信已绑定到当前账号' }
    }

    // 需要合并：先清除被吸收账号的微信唯一字段
    await tx.user.update({
      where: { id: existingWxUser.id },
      data: { wechatOpenId: null, wechatUnionId: null }
    })

    // 转移所有数据
    await transferAllData(tx, currentUserId, existingWxUser.id)

    // 设置微信字段
    await tx.user.update({
      where: { id: currentUserId },
      data: {
        wechatOpenId: openid,
        wechatUnionId: unionid,
        avatar: wxAvatar || undefined,
      }
    })

    return { merged: true, message: '微信绑定成功，已合并微信账号数据' }
  }, { timeout: 30000 })
}

/**
 * 场景B：微信用户绑定邮箱
 */
export async function bindEmailToWechatUser(
  currentUserId: string,
  email: string,
  hashedPassword: string,
  name?: string
) {
  return await prisma.$transaction(async (tx) => {
    const currentUser = await tx.user.findUnique({
      where: { id: currentUserId },
      select: { email: true, password: true }
    })
    if (currentUser && currentUser.password && !currentUser.email.endsWith('@wechat.placeholder')) {
      throw new Error('该账号已绑定邮箱')
    }

    // 检查是否有已存在的邮箱账号
    const existingEmailUser = await tx.user.findUnique({
      where: { email }
    })

    if (!existingEmailUser) {
      // 简单绑定：没有已存在的邮箱账号，密码可选
      const updateData: any = { email }
      if (hashedPassword) updateData.password = hashedPassword
      if (name) updateData.name = name
      await tx.user.update({
        where: { id: currentUserId },
        data: updateData
      })
      return { merged: false, message: '邮箱绑定成功' }
    }

    if (existingEmailUser.id === currentUserId) {
      return { merged: false, message: '该邮箱已属于当前账号' }
    }

    // 需要合并：先清除被吸收账号的邮箱唯一字段
    await tx.user.update({
      where: { id: existingEmailUser.id },
      data: { email: `merged_${existingEmailUser.id}@deleted.placeholder` }
    })

    // 转移所有数据
    await transferAllData(tx, currentUserId, existingEmailUser.id)

    // 更新邮箱和密码（合并时用已有账号的密码）
    const updateData: any = { email }
    if (hashedPassword) updateData.password = hashedPassword
    if (name) updateData.name = name
    await tx.user.update({
      where: { id: currentUserId },
      data: updateData
    })

    return { merged: true, message: '邮箱绑定成功，已合并邮箱账号数据' }
  }, { timeout: 30000 })
}
