/**
 * 购买服务
 * 处理付费工作流购买、分成计算等
 *
 * 付费工作流购买规则（参考 docs/requirements.md 第五章5.2节）：
 *
 * 购买价格：
 *   - Free用户：原价购买
 *   - Pro用户：5折购买
 *   - 创作者本人：免费（自己的工作流）
 *   - 其他创作者：5折购买
 *
 * 分成比例（按创作者等级）：
 *   - LV1: 60% / 40%
 *   - LV2: 63% / 37%
 *   - ...
 *   - LV10: 90% / 10%
 *
 * 计算公式：
 *   创作者收益 = 实际成交价 × 创作者分成比例
 *   平台收益 = 实际成交价 × 平台分成比例
 */

const crypto = require('crypto');
const db = require('../config/database');
const UserService = require('./UserService');
const LevelService = require('./LevelService');
const PointsService = require('./PointsService');
const {
  WORKFLOW_LEVEL,
  WORKFLOW_STATUS,
  PRO_DISCOUNT,
  POINTS_RULE
} = require('../config/constants');
const { BusinessError, WorkflowNotFoundError, PermissionDeniedError } = require('../utils/errors');

class PurchaseService {
  /**
   * 获取工作流信息
   * @param {string} workflowId - 工作流ID
   * @returns {Promise<Object>}
   */
  async getWorkflow(workflowId) {
    const workflow = await db.queryOne(
      `SELECT w.*, cs.level as creator_level
       FROM workflows w
       LEFT JOIN creator_stats cs ON w.creator_id = cs.user_id
       WHERE w.id = ?`,
      [workflowId]
    );

    if (!workflow) {
      throw new WorkflowNotFoundError(workflowId);
    }

    return workflow;
  }

  /**
   * 检查用户是否已购买工作流
   * @param {string} userId - 用户ID
   * @param {string} workflowId - 工作流ID
   * @returns {Promise<boolean>}
   */
  async hasPurchased(userId, workflowId) {
    const purchase = await db.queryOne(
      `SELECT id FROM workflow_purchases
       WHERE buyer_id = ? AND workflow_id = ? AND status = 'paid'`,
      [userId, workflowId]
    );
    return !!purchase;
  }

  /**
   * 计算购买价格
   * @param {string} userId - 用户ID
   * @param {string} workflowId - 工作流ID
   * @returns {Promise<Object>}
   */
  async calculatePrice(userId, workflowId) {
    const workflow = await this.getWorkflow(workflowId);
    const identity = await UserService.getUserIdentity(userId);

    // 检查是否是付费工作流
    if (workflow.level !== WORKFLOW_LEVEL.PAID) {
      throw new BusinessError('此工作流不是付费工作流', 'NOT_PAID_WORKFLOW', 400);
    }

    // 检查工作流状态
    if (workflow.status !== WORKFLOW_STATUS.APPROVED) {
      throw new BusinessError('此工作流尚未上架', 'WORKFLOW_NOT_APPROVED', 400);
    }

    const originalPrice = parseFloat(workflow.price);

    // 创作者本人免费
    if (workflow.creator_id === userId) {
      return {
        workflowId,
        originalPrice,
        discountRate: 0,
        actualPrice: 0,
        isFree: true,
        reason: '您是此工作流的创作者'
      };
    }

    // 检查是否已购买
    const purchased = await this.hasPurchased(userId, workflowId);
    if (purchased) {
      return {
        workflowId,
        originalPrice,
        discountRate: 0,
        actualPrice: 0,
        isFree: true,
        reason: '您已购买此工作流',
        alreadyPurchased: true
      };
    }

    // 计算折扣
    let discountRate = 1;
    let discountReason = '原价';

    if (identity.isPro || identity.isCreator) {
      discountRate = PRO_DISCOUNT;
      discountReason = identity.isCreator ? '创作者专享5折' : 'Pro会员专享5折';
    }

    const actualPrice = originalPrice * discountRate;

    return {
      workflowId,
      originalPrice,
      discountRate,
      actualPrice,
      isFree: false,
      discountReason,
      userType: identity.isCreator ? 'creator' : (identity.isPro ? 'pro' : 'free')
    };
  }

  /**
   * 计算分成
   * @param {number} actualPrice - 实际成交价
   * @param {number} creatorLevel - 创作者等级
   * @returns {Object}
   */
  calculateRevenueSplit(actualPrice, creatorLevel) {
    const threshold = LevelService.getThreshold(creatorLevel || 1);
    const creatorShareRate = threshold.shareRate;
    const platformShareRate = 1 - creatorShareRate;

    const creatorRevenue = actualPrice * creatorShareRate;
    const platformRevenue = actualPrice * platformShareRate;

    return {
      creatorShareRate,
      platformShareRate,
      creatorRevenue: Math.round(creatorRevenue * 100) / 100,
      platformRevenue: Math.round(platformRevenue * 100) / 100
    };
  }

  /**
   * 创建购买订单
   * @param {string} userId - 用户ID
   * @param {string} workflowId - 工作流ID
   * @returns {Promise<Object>}
   */
  async createPurchaseOrder(userId, workflowId) {
    const priceInfo = await this.calculatePrice(userId, workflowId);

    // 如果是免费或已购买
    if (priceInfo.isFree) {
      if (priceInfo.alreadyPurchased) {
        throw new BusinessError('您已购买此工作流', 'ALREADY_PURCHASED', 400);
      }
      // 创作者本人，直接返回
      return {
        needPayment: false,
        reason: priceInfo.reason
      };
    }

    const workflow = await this.getWorkflow(workflowId);
    const revenueSplit = this.calculateRevenueSplit(priceInfo.actualPrice, workflow.creator_level);

    // 创建待支付订单
    const orderId = crypto.randomUUID();

    await db.query(
      `INSERT INTO workflow_purchases
       (id, workflow_id, buyer_id, seller_id, original_price, discount_rate,
        actual_price, creator_share_rate, creator_revenue, platform_revenue, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
      [
        orderId,
        workflowId,
        userId,
        workflow.creator_id,
        priceInfo.originalPrice,
        priceInfo.discountRate,
        priceInfo.actualPrice,
        revenueSplit.creatorShareRate,
        revenueSplit.creatorRevenue,
        revenueSplit.platformRevenue
      ]
    );

    return {
      orderId,
      needPayment: true,
      workflow: {
        id: workflowId,
        title: workflow.title,
        creatorId: workflow.creator_id
      },
      price: priceInfo,
      revenueSplit,
      status: 'pending'
    };
  }

  /**
   * 完成购买（支付成功后调用）
   * @param {string} orderId - 订单ID
   * @param {Object} paymentInfo - 支付信息
   * @returns {Promise<Object>}
   */
  async completePurchase(orderId, paymentInfo = {}) {
    const order = await db.queryOne(
      'SELECT * FROM workflow_purchases WHERE id = ?',
      [orderId]
    );

    if (!order) {
      throw new BusinessError('订单不存在', 'ORDER_NOT_FOUND', 404);
    }

    if (order.status !== 'pending') {
      throw new BusinessError('订单状态无效', 'INVALID_ORDER_STATUS', 400);
    }

    const transaction = await db.beginTransaction();

    try {
      // 更新订单状态
      await transaction.query(
        `UPDATE workflow_purchases
         SET status = 'paid',
             payment_method = ?,
             payment_id = ?,
             purchased_at = NOW()
         WHERE id = ?`,
        [paymentInfo.paymentMethod || null, paymentInfo.paymentId || null, orderId]
      );

      // 更新工作流购买次数
      await transaction.query(
        'UPDATE workflows SET purchase_count = purchase_count + 1 WHERE id = ?',
        [order.workflow_id]
      );

      // 创建创作者收益记录
      const revenueId = crypto.randomUUID();
      await transaction.query(
        `INSERT INTO revenue_records
         (id, user_id, amount, type, source, related_type, related_id, status)
         VALUES (?, ?, ?, 'paid_sale', ?, 'purchase', ?, 'pending')`,
        [
          revenueId,
          order.seller_id,
          order.creator_revenue,
          '付费工作流销售',
          orderId
        ]
      );

      // 更新创作者统计
      await transaction.query(
        `UPDATE creator_stats
         SET total_purchases = total_purchases + 1,
             total_revenue = total_revenue + ?,
             pending_revenue = pending_revenue + ?,
             updated_at = NOW()
         WHERE user_id = ?`,
        [order.creator_revenue, order.creator_revenue, order.seller_id]
      );

      // 给创作者加积分
      await PointsService.addPurchasePoints(
        order.seller_id,
        orderId,
        order.workflow_id,
        transaction
      );

      // 记录操作日志
      const logId = crypto.randomUUID();
      await transaction.query(
        `INSERT INTO operation_logs
         (id, operator_type, operator_id, action, target_type, target_id, new_value)
         VALUES (?, 'user', ?, 'purchase_workflow', 'workflow_purchase', ?, ?)`,
        [
          logId,
          order.buyer_id,
          orderId,
          JSON.stringify({
            workflowId: order.workflow_id,
            price: parseFloat(order.actual_price),
            creatorRevenue: parseFloat(order.creator_revenue)
          })
        ]
      );

      await transaction.commit();

      // 检查创作者是否可以升级
      await PointsService.checkAndUpgradeLevel(order.seller_id);

      return {
        success: true,
        orderId,
        workflowId: order.workflow_id,
        buyerId: order.buyer_id,
        sellerId: order.seller_id,
        actualPrice: parseFloat(order.actual_price),
        creatorRevenue: parseFloat(order.creator_revenue),
        platformRevenue: parseFloat(order.platform_revenue)
      };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * 一键购买（创建订单并完成支付）
   * 用于测试或已有余额支付的场景
   * @param {string} userId - 用户ID
   * @param {string} workflowId - 工作流ID
   * @param {Object} paymentInfo - 支付信息
   * @returns {Promise<Object>}
   */
  async quickPurchase(userId, workflowId, paymentInfo = {}) {
    // 创建订单
    const order = await this.createPurchaseOrder(userId, workflowId);

    if (!order.needPayment) {
      return {
        success: true,
        needPayment: false,
        reason: order.reason
      };
    }

    // 完成支付
    const result = await this.completePurchase(order.orderId, paymentInfo);

    return {
      success: true,
      needPayment: true,
      ...result
    };
  }

  /**
   * 申请退款
   * @param {string} orderId - 订单ID
   * @param {string} userId - 用户ID
   * @param {string} reason - 退款原因
   * @returns {Promise<Object>}
   */
  async requestRefund(orderId, userId, reason) {
    const order = await db.queryOne(
      'SELECT * FROM workflow_purchases WHERE id = ?',
      [orderId]
    );

    if (!order) {
      throw new BusinessError('订单不存在', 'ORDER_NOT_FOUND', 404);
    }

    if (order.buyer_id !== userId) {
      throw new PermissionDeniedError('您没有权限操作此订单');
    }

    if (order.status !== 'paid') {
      throw new BusinessError('订单状态无效，无法退款', 'INVALID_ORDER_STATUS', 400);
    }

    // 检查购买时间（例如：7天内可退款）
    const purchaseDate = new Date(order.purchased_at);
    const now = new Date();
    const daysDiff = (now - purchaseDate) / (1000 * 60 * 60 * 24);

    if (daysDiff > 7) {
      throw new BusinessError('已超过7天退款期限', 'REFUND_EXPIRED', 400);
    }

    // 提交退款申请，等待管理员审核
    await db.query(
      `UPDATE workflow_purchases
       SET status = 'refund_pending', refund_reason = ?, updated_at = NOW()
       WHERE id = ?`,
      [reason || '用户申请退款', orderId]
    );

    // 记录操作日志
    const logId = crypto.randomUUID();
    await db.query(
      `INSERT INTO operation_logs
       (id, operator_type, operator_id, action, target_type, target_id, new_value)
       VALUES (?, 'user', ?, 'request_refund', 'workflow_purchase', ?, ?)`,
      [logId, userId, orderId, JSON.stringify({ reason })]
    );

    return {
      success: true,
      orderId,
      refundAmount: parseFloat(order.actual_price),
      status: 'refund_pending',
      message: '退款申请已提交，请等待管理员审核'
    };
  }

  /**
   * 获取用户购买记录
   * @param {string} userId - 用户ID
   * @param {Object} options - 查询选项
   * @returns {Promise<Object>}
   */
  async getUserPurchases(userId, options = {}) {
    const { status, page = 1, limit = 20 } = options;

    let whereClause = 'WHERE p.buyer_id = ?';
    const params = [userId];

    if (status) {
      whereClause += ' AND p.status = ?';
      params.push(status);
    }

    const countResult = await db.queryOne(
      `SELECT COUNT(*) as total FROM workflow_purchases p ${whereClause}`,
      params
    );

    const offset = (page - 1) * limit;
    const purchases = await db.query(
      `SELECT p.*, w.title as workflow_title, w.cover_image,
              u.username as seller_name, u.avatar as seller_avatar
       FROM workflow_purchases p
       LEFT JOIN workflows w ON p.workflow_id = w.id
       LEFT JOIN users u ON p.seller_id = u.id
       ${whereClause}
       ORDER BY p.purchased_at DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    return {
      purchases: purchases.map(p => ({
        ...p,
        originalPrice: parseFloat(p.original_price),
        actualPrice: parseFloat(p.actual_price),
        discountRate: parseFloat(p.discount_rate)
      })),
      total: countResult.total,
      page,
      limit,
      totalPages: Math.ceil(countResult.total / limit)
    };
  }

  /**
   * 获取创作者销售记录
   * @param {string} userId - 创作者ID
   * @param {Object} options - 查询选项
   * @returns {Promise<Object>}
   */
  async getCreatorSales(userId, options = {}) {
    const { status, page = 1, limit = 20 } = options;

    let whereClause = 'WHERE p.seller_id = ?';
    const params = [userId];

    if (status) {
      whereClause += ' AND p.status = ?';
      params.push(status);
    }

    const countResult = await db.queryOne(
      `SELECT COUNT(*) as total FROM workflow_purchases p ${whereClause}`,
      params
    );

    const offset = (page - 1) * limit;
    const sales = await db.query(
      `SELECT p.*, w.title as workflow_title,
              u.username as buyer_name, u.avatar as buyer_avatar
       FROM workflow_purchases p
       LEFT JOIN workflows w ON p.workflow_id = w.id
       LEFT JOIN users u ON p.buyer_id = u.id
       ${whereClause}
       ORDER BY p.purchased_at DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    return {
      sales: sales.map(s => ({
        ...s,
        originalPrice: parseFloat(s.original_price),
        actualPrice: parseFloat(s.actual_price),
        creatorRevenue: parseFloat(s.creator_revenue),
        platformRevenue: parseFloat(s.platform_revenue)
      })),
      total: countResult.total,
      page,
      limit,
      totalPages: Math.ceil(countResult.total / limit)
    };
  }

  /**
   * 获取创作者销售统计
   * @param {string} userId - 创作者ID
   * @returns {Promise<Object>}
   */
  async getCreatorSalesStats(userId) {
    // 总销售统计
    const totals = await db.queryOne(
      `SELECT
         COUNT(*) as total_sales,
         COALESCE(SUM(actual_price), 0) as total_amount,
         COALESCE(SUM(creator_revenue), 0) as total_revenue
       FROM workflow_purchases
       WHERE seller_id = ? AND status = 'paid'`,
      [userId]
    );

    // 按工作流统计
    const byWorkflow = await db.query(
      `SELECT
         p.workflow_id,
         w.title,
         COUNT(*) as sales_count,
         SUM(p.actual_price) as total_amount,
         SUM(p.creator_revenue) as total_revenue
       FROM workflow_purchases p
       LEFT JOIN workflows w ON p.workflow_id = w.id
       WHERE p.seller_id = ? AND p.status = 'paid'
       GROUP BY p.workflow_id, w.title
       ORDER BY sales_count DESC
       LIMIT 10`,
      [userId]
    );

    // 按月统计（最近6个月）
    const byMonth = await db.query(
      `SELECT
         DATE_FORMAT(purchased_at, '%Y-%m') as month,
         COUNT(*) as sales_count,
         SUM(actual_price) as total_amount,
         SUM(creator_revenue) as total_revenue
       FROM workflow_purchases
       WHERE seller_id = ? AND status = 'paid'
       GROUP BY DATE_FORMAT(purchased_at, '%Y-%m')
       ORDER BY month DESC
       LIMIT 6`,
      [userId]
    );

    return {
      totals: {
        salesCount: totals.total_sales,
        totalAmount: parseFloat(totals.total_amount) || 0,
        totalRevenue: parseFloat(totals.total_revenue) || 0
      },
      byWorkflow: byWorkflow.map(w => ({
        ...w,
        totalAmount: parseFloat(w.total_amount) || 0,
        totalRevenue: parseFloat(w.total_revenue) || 0
      })),
      byMonth: byMonth.map(m => ({
        ...m,
        totalAmount: parseFloat(m.total_amount) || 0,
        totalRevenue: parseFloat(m.total_revenue) || 0
      }))
    };
  }

  /**
   * 获取购买详情
   * @param {string} purchaseId - 购买ID
   * @param {string} userId - 用户ID（用于权限验证）
   * @returns {Promise<Object>}
   */
  async getPurchaseDetail(purchaseId, userId) {
    const purchase = await db.queryOne(
      `SELECT p.*, w.title as workflow_title, w.description as workflow_description,
              w.cover_image, w.level as workflow_level,
              seller.username as seller_name, seller.avatar as seller_avatar,
              buyer.username as buyer_name, buyer.avatar as buyer_avatar
       FROM workflow_purchases p
       LEFT JOIN workflows w ON p.workflow_id = w.id
       LEFT JOIN users seller ON p.seller_id = seller.id
       LEFT JOIN users buyer ON p.buyer_id = buyer.id
       WHERE p.id = ?`,
      [purchaseId]
    );

    if (!purchase) {
      throw new BusinessError('购买记录不存在', 'PURCHASE_NOT_FOUND', 404);
    }

    // 只有买家或卖家可以查看详情
    if (purchase.buyer_id !== userId && purchase.seller_id !== userId) {
      throw new PermissionDeniedError('您没有权限查看此购买记录');
    }

    return {
      ...purchase,
      originalPrice: parseFloat(purchase.original_price),
      actualPrice: parseFloat(purchase.actual_price),
      discountRate: parseFloat(purchase.discount_rate),
      creatorRevenue: parseFloat(purchase.creator_revenue),
      platformRevenue: parseFloat(purchase.platform_revenue),
      creatorShareRate: parseFloat(purchase.creator_share_rate)
    };
  }

  /**
   * 获取工作流销售详情（创作者查看）
   * @param {string} userId - 创作者ID
   * @param {string} workflowId - 工作流ID
   * @param {Object} options - 分页选项
   * @returns {Promise<Object>}
   */
  async getWorkflowSales(userId, workflowId, options = {}) {
    const { page = 1, limit = 20 } = options;

    // 验证是工作流的创作者
    const workflow = await db.queryOne(
      'SELECT * FROM workflows WHERE id = ? AND creator_id = ?',
      [workflowId, userId]
    );

    if (!workflow) {
      throw new PermissionDeniedError('您不是此工作流的创作者');
    }

    const countResult = await db.queryOne(
      `SELECT COUNT(*) as total FROM workflow_purchases
       WHERE workflow_id = ? AND status = 'paid'`,
      [workflowId]
    );

    const offset = (page - 1) * limit;
    const sales = await db.query(
      `SELECT p.*, u.username as buyer_name, u.avatar as buyer_avatar
       FROM workflow_purchases p
       LEFT JOIN users u ON p.buyer_id = u.id
       WHERE p.workflow_id = ? AND p.status = 'paid'
       ORDER BY p.purchased_at DESC
       LIMIT ? OFFSET ?`,
      [workflowId, limit, offset]
    );

    return {
      workflow: {
        id: workflow.id,
        title: workflow.title,
        price: parseFloat(workflow.price),
        purchaseCount: workflow.purchase_count
      },
      sales: sales.map(s => ({
        ...s,
        actualPrice: parseFloat(s.actual_price),
        creatorRevenue: parseFloat(s.creator_revenue)
      })),
      pagination: {
        total: countResult.total,
        page,
        pageSize: limit,
        totalPages: Math.ceil(countResult.total / limit)
      }
    };
  }

  /**
   * 处理退款（管理员）
   * @param {string} purchaseId - 购买ID
   * @param {string} adminId - 管理员ID
   * @param {string} action - 操作：approve/reject
   * @param {string} reason - 原因
   * @returns {Promise<Object>}
   */
  async processRefund(purchaseId, adminId, action, reason) {
    const order = await db.queryOne(
      'SELECT * FROM workflow_purchases WHERE id = ?',
      [purchaseId]
    );

    if (!order) {
      throw new BusinessError('订单不存在', 'ORDER_NOT_FOUND', 404);
    }

    if (order.status !== 'refund_pending') {
      throw new BusinessError('订单状态无效', 'INVALID_ORDER_STATUS', 400);
    }

    const transaction = await db.beginTransaction();

    try {
      if (action === 'approve') {
        // 批准退款
        await transaction.query(
          `UPDATE workflow_purchases
           SET status = 'refunded', refund_reason = ?
           WHERE id = ?`,
          [reason || order.refund_reason, purchaseId]
        );

        // 更新工作流购买次数
        await transaction.query(
          'UPDATE workflows SET purchase_count = GREATEST(0, purchase_count - 1) WHERE id = ?',
          [order.workflow_id]
        );

        // 取消创作者收益记录
        await transaction.query(
          `UPDATE revenue_records SET status = 'cancelled' WHERE related_id = ?`,
          [purchaseId]
        );

        // 更新创作者统计
        await transaction.query(
          `UPDATE creator_stats
           SET total_purchases = GREATEST(0, total_purchases - 1),
               total_revenue = GREATEST(0, total_revenue - ?),
               pending_revenue = GREATEST(0, pending_revenue - ?),
               updated_at = NOW()
           WHERE user_id = ?`,
          [order.creator_revenue, order.creator_revenue, order.seller_id]
        );
      } else {
        // 拒绝退款
        await transaction.query(
          `UPDATE workflow_purchases
           SET status = 'paid', refund_rejected_reason = ?
           WHERE id = ?`,
          [reason, purchaseId]
        );
      }

      // 记录操作日志
      const logId = crypto.randomUUID();
      await transaction.query(
        `INSERT INTO operation_logs
         (id, operator_type, operator_id, action, target_type, target_id, new_value)
         VALUES (?, 'admin', ?, ?, 'workflow_purchase', ?, ?)`,
        [
          logId,
          adminId,
          action === 'approve' ? 'approve_refund' : 'reject_refund',
          purchaseId,
          JSON.stringify({ reason })
        ]
      );

      await transaction.commit();

      return {
        success: true,
        purchaseId,
        action,
        message: action === 'approve' ? '退款已批准' : '退款已拒绝'
      };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * 获取待处理退款列表（管理员）
   * @param {Object} options - 分页选项
   * @returns {Promise<Object>}
   */
  async getPendingRefunds(options = {}) {
    const { page = 1, limit = 20 } = options;

    const countResult = await db.queryOne(
      `SELECT COUNT(*) as total FROM workflow_purchases WHERE status = 'refund_pending'`
    );

    const offset = (page - 1) * limit;
    const refunds = await db.query(
      `SELECT p.*, w.title as workflow_title,
              buyer.username as buyer_name, buyer.avatar as buyer_avatar,
              seller.username as seller_name
       FROM workflow_purchases p
       LEFT JOIN workflows w ON p.workflow_id = w.id
       LEFT JOIN users buyer ON p.buyer_id = buyer.id
       LEFT JOIN users seller ON p.seller_id = seller.id
       WHERE p.status = 'refund_pending'
       ORDER BY p.updated_at ASC
       LIMIT ? OFFSET ?`,
      [limit, offset]
    );

    return {
      refunds: refunds.map(r => ({
        ...r,
        originalPrice: parseFloat(r.original_price),
        actualPrice: parseFloat(r.actual_price),
        creatorRevenue: parseFloat(r.creator_revenue)
      })),
      pagination: {
        total: countResult.total,
        page,
        pageSize: limit,
        totalPages: Math.ceil(countResult.total / limit)
      }
    };
  }

  /**
   * 获取用户已购买的工作流ID列表
   * @param {string} userId - 用户ID
   * @returns {Promise<string[]>}
   */
  async getPurchasedWorkflowIds(userId) {
    const purchases = await db.query(
      `SELECT workflow_id FROM workflow_purchases
       WHERE buyer_id = ? AND status = 'paid'`,
      [userId]
    );

    return purchases.map(p => p.workflow_id);
  }

  /**
   * 获取平台销售统计（管理后台）
   * @param {Object} options - 查询选项
   * @returns {Promise<Object>}
   */
  async getPlatformSalesStats(options = {}) {
    const { startDate, endDate } = options;

    let whereClause = "WHERE status = 'paid'";
    const params = [];

    if (startDate) {
      whereClause += ' AND purchased_at >= ?';
      params.push(startDate);
    }

    if (endDate) {
      whereClause += ' AND purchased_at <= ?';
      params.push(endDate);
    }

    // 总体统计
    const totals = await db.queryOne(
      `SELECT
         COUNT(*) as total_sales,
         COALESCE(SUM(actual_price), 0) as total_amount,
         COALESCE(SUM(creator_revenue), 0) as creator_revenue,
         COALESCE(SUM(platform_revenue), 0) as platform_revenue
       FROM workflow_purchases
       ${whereClause}`,
      params
    );

    // 按日统计（最近30天）
    const daily = await db.query(
      `SELECT
         DATE(purchased_at) as date,
         COUNT(*) as sales_count,
         SUM(actual_price) as total_amount,
         SUM(platform_revenue) as platform_revenue
       FROM workflow_purchases
       WHERE status = 'paid' AND purchased_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
       GROUP BY DATE(purchased_at)
       ORDER BY date ASC`
    );

    // 热门工作流
    const topWorkflows = await db.query(
      `SELECT
         p.workflow_id,
         w.title,
         w.price,
         u.username as creator_name,
         COUNT(*) as sales_count,
         SUM(p.actual_price) as total_amount
       FROM workflow_purchases p
       LEFT JOIN workflows w ON p.workflow_id = w.id
       LEFT JOIN users u ON w.creator_id = u.id
       WHERE p.status = 'paid'
       GROUP BY p.workflow_id, w.title, w.price, u.username
       ORDER BY sales_count DESC
       LIMIT 10`
    );

    return {
      totals: {
        salesCount: totals.total_sales,
        totalAmount: parseFloat(totals.total_amount) || 0,
        creatorRevenue: parseFloat(totals.creator_revenue) || 0,
        platformRevenue: parseFloat(totals.platform_revenue) || 0
      },
      daily: daily.map(d => ({
        ...d,
        totalAmount: parseFloat(d.total_amount) || 0,
        platformRevenue: parseFloat(d.platform_revenue) || 0
      })),
      topWorkflows: topWorkflows.map(w => ({
        ...w,
        price: parseFloat(w.price) || 0,
        totalAmount: parseFloat(w.total_amount) || 0
      }))
    };
  }
}

module.exports = new PurchaseService();
