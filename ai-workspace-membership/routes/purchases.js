/**
 * 购买相关路由
 */

const express = require('express');
const router = express.Router();
const PurchaseService = require('../services/PurchaseService');
const { requireAuth, requirePro } = require('../middleware');
const { ValidationError } = require('../utils/errors');

/**
 * 获取工作流价格信息
 * GET /purchases/price/:workflowId
 */
router.get('/price/:workflowId', requireAuth, async (req, res, next) => {
  try {
    const { workflowId } = req.params;
    const priceInfo = await PurchaseService.calculatePrice(workflowId, req.userId);

    res.json({
      success: true,
      data: priceInfo
    });
  } catch (error) {
    next(error);
  }
});

/**
 * 创建购买订单
 * POST /purchases/orders
 */
router.post('/orders', requireAuth, async (req, res, next) => {
  try {
    const { workflowId } = req.body;

    if (!workflowId) {
      throw new ValidationError('workflowId is required');
    }

    const order = await PurchaseService.createPurchaseOrder(req.userId, workflowId);

    res.json({
      success: true,
      data: order,
      message: '订单创建成功，请在30分钟内完成支付'
    });
  } catch (error) {
    next(error);
  }
});

/**
 * 完成购买（支付回调）
 * POST /purchases/orders/:orderId/complete
 */
router.post('/orders/:orderId/complete', requireAuth, async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const { paymentId, paymentMethod } = req.body;

    if (!paymentId) {
      throw new ValidationError('paymentId is required');
    }

    const result = await PurchaseService.completePurchase(orderId, {
      paymentId,
      paymentMethod: paymentMethod || 'unknown'
    });

    res.json({
      success: true,
      data: result,
      message: '购买成功'
    });
  } catch (error) {
    next(error);
  }
});

/**
 * 快速购买（一步完成）
 * POST /purchases/quick
 */
router.post('/quick', requireAuth, async (req, res, next) => {
  try {
    const { workflowId, paymentId, paymentMethod } = req.body;

    if (!workflowId) {
      throw new ValidationError('workflowId is required');
    }
    if (!paymentId) {
      throw new ValidationError('paymentId is required');
    }

    const result = await PurchaseService.quickPurchase(req.userId, workflowId, {
      paymentId,
      paymentMethod: paymentMethod || 'unknown'
    });

    res.json({
      success: true,
      data: result,
      message: '购买成功'
    });
  } catch (error) {
    next(error);
  }
});

/**
 * 申请退款
 * POST /purchases/:purchaseId/refund
 */
router.post('/:purchaseId/refund', requireAuth, async (req, res, next) => {
  try {
    const { purchaseId } = req.params;
    const { reason } = req.body;

    const result = await PurchaseService.requestRefund(purchaseId, req.userId, reason);

    res.json({
      success: true,
      data: result,
      message: '退款申请已提交'
    });
  } catch (error) {
    next(error);
  }
});

/**
 * 获取我的购买记录
 * GET /purchases/my
 */
router.get('/my', requireAuth, async (req, res, next) => {
  try {
    const { status, page = 1, pageSize = 20 } = req.query;

    const result = await PurchaseService.getUserPurchases(req.userId, {
      status,
      page: parseInt(page),
      limit: parseInt(pageSize)
    });

    res.json({
      success: true,
      data: result.purchases,
      pagination: {
        total: result.total,
        page: result.page,
        pageSize: result.limit,
        totalPages: result.totalPages
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * 检查是否已购买
 * GET /purchases/check/:workflowId
 */
router.get('/check/:workflowId', requireAuth, async (req, res, next) => {
  try {
    const { workflowId } = req.params;
    const hasPurchased = await PurchaseService.hasPurchased(req.userId, workflowId);

    res.json({
      success: true,
      data: {
        hasPurchased,
        workflowId
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * 获取购买详情
 * GET /purchases/:purchaseId
 */
router.get('/:purchaseId', requireAuth, async (req, res, next) => {
  try {
    const { purchaseId } = req.params;
    const purchase = await PurchaseService.getPurchaseDetail(purchaseId, req.userId);

    res.json({
      success: true,
      data: purchase
    });
  } catch (error) {
    next(error);
  }
});

// ============ 创作者销售相关 ============

/**
 * 获取我的销售记录（创作者）
 * GET /purchases/creator/sales
 */
router.get('/creator/sales', requireAuth, async (req, res, next) => {
  try {
    const { status, page = 1, pageSize = 20 } = req.query;

    const result = await PurchaseService.getCreatorSales(req.userId, {
      status,
      page: parseInt(page),
      limit: parseInt(pageSize)
    });

    res.json({
      success: true,
      data: result.sales,
      pagination: {
        total: result.total,
        page: result.page,
        pageSize: result.limit,
        totalPages: result.totalPages
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * 获取销售统计（创作者）
 * GET /purchases/creator/stats
 */
router.get('/creator/stats', requireAuth, async (req, res, next) => {
  try {
    const { period } = req.query; // month, year, all
    const stats = await PurchaseService.getCreatorSalesStats(req.userId, period);

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    next(error);
  }
});

/**
 * 获取工作流销售详情（创作者）
 * GET /purchases/creator/workflows/:workflowId/sales
 */
router.get('/creator/workflows/:workflowId/sales', requireAuth, async (req, res, next) => {
  try {
    const { workflowId } = req.params;
    const { page = 1, pageSize = 20 } = req.query;

    const result = await PurchaseService.getWorkflowSales(req.userId, workflowId, {
      page: parseInt(page),
      pageSize: parseInt(pageSize)
    });

    res.json({
      success: true,
      data: result.sales,
      workflow: result.workflow,
      pagination: result.pagination
    });
  } catch (error) {
    next(error);
  }
});

// ============ 管理员相关 ============

/**
 * 处理退款申请（管理员）
 * POST /purchases/admin/refunds/:purchaseId
 */
router.post('/admin/refunds/:purchaseId', requireAuth, async (req, res, next) => {
  try {
    const { purchaseId } = req.params;
    const { action, reason } = req.body; // action: approve/reject

    if (!['approve', 'reject'].includes(action)) {
      throw new ValidationError('Invalid action, must be approve or reject');
    }

    const result = await PurchaseService.processRefund(purchaseId, req.userId, action, reason);

    res.json({
      success: true,
      data: result,
      message: action === 'approve' ? '退款已批准' : '退款已拒绝'
    });
  } catch (error) {
    next(error);
  }
});

/**
 * 获取待处理退款列表（管理员）
 * GET /purchases/admin/refunds/pending
 */
router.get('/admin/refunds/pending', requireAuth, async (req, res, next) => {
  try {
    const { page = 1, pageSize = 20 } = req.query;

    const result = await PurchaseService.getPendingRefunds({
      page: parseInt(page),
      pageSize: parseInt(pageSize)
    });

    res.json({
      success: true,
      data: result.refunds,
      pagination: result.pagination
    });
  } catch (error) {
    next(error);
  }
});

/**
 * 获取平台销售统计（管理员）
 * GET /purchases/admin/stats
 */
router.get('/admin/stats', requireAuth, async (req, res, next) => {
  try {
    const { startDate, endDate, groupBy } = req.query; // groupBy: day, week, month

    const stats = await PurchaseService.getPlatformSalesStats({
      startDate,
      endDate,
      groupBy: groupBy || 'day'
    });

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
