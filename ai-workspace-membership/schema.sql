-- ============================================================
-- AI工作台会员体系数据库设计
-- 技术栈: MySQL 8.0
-- 版本: 1.0
-- 创建日期: 2024-12-19
-- ============================================================

-- 设置字符集和存储引擎
SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ============================================================
-- 第一部分：用户与会员相关表
-- ============================================================

-- -----------------------------------------------------------
-- 1. 用户表 (users)
-- 存储用户基本信息
-- -----------------------------------------------------------
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
    `id` VARCHAR(36) NOT NULL COMMENT '用户ID (UUID)',
    `username` VARCHAR(50) NOT NULL COMMENT '用户名',
    `email` VARCHAR(255) NOT NULL COMMENT '邮箱地址',
    `password_hash` VARCHAR(255) NOT NULL COMMENT '密码哈希 (bcrypt)',
    `avatar` VARCHAR(500) DEFAULT NULL COMMENT '头像URL',
    `phone` VARCHAR(20) DEFAULT NULL COMMENT '手机号',
    `status` ENUM('active', 'suspended', 'banned', 'deleted') NOT NULL DEFAULT 'active' COMMENT '账户状态',
    `last_login_at` DATETIME DEFAULT NULL COMMENT '最后登录时间',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_users_email` (`email`),
    UNIQUE KEY `uk_users_username` (`username`),
    KEY `idx_users_status` (`status`),
    KEY `idx_users_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户表';

-- -----------------------------------------------------------
-- 2. 会员关系表 (memberships)
-- 记录用户的会员类型和状态
-- 注意：创作者身份是在Pro会员基础上叠加的，不是独立的会员类型
-- -----------------------------------------------------------
DROP TABLE IF EXISTS `memberships`;
CREATE TABLE `memberships` (
    `id` VARCHAR(36) NOT NULL COMMENT '记录ID (UUID)',
    `user_id` VARCHAR(36) NOT NULL COMMENT '用户ID',
    `type` ENUM('free', 'pro') NOT NULL DEFAULT 'free' COMMENT '会员类型',
    `is_creator` TINYINT(1) NOT NULL DEFAULT 0 COMMENT '是否为创作者 (0:否 1:是)',
    `status` ENUM('active', 'expired', 'cancelled') NOT NULL DEFAULT 'active' COMMENT '会员状态',
    `started_at` DATETIME DEFAULT NULL COMMENT 'Pro会员开始时间',
    `expires_at` DATETIME DEFAULT NULL COMMENT 'Pro会员过期时间',
    `creator_applied_at` DATETIME DEFAULT NULL COMMENT '申请创作者时间',
    `creator_approved_at` DATETIME DEFAULT NULL COMMENT '创作者审核通过时间',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_memberships_user` (`user_id`),
    KEY `idx_memberships_type` (`type`),
    KEY `idx_memberships_is_creator` (`is_creator`),
    KEY `idx_memberships_status` (`status`),
    KEY `idx_memberships_expires_at` (`expires_at`),
    CONSTRAINT `fk_memberships_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='会员关系表';

-- -----------------------------------------------------------
-- 3. Pro会员订阅记录表 (pro_subscriptions)
-- 记录Pro会员的购买/续费历史
-- -----------------------------------------------------------
DROP TABLE IF EXISTS `pro_subscriptions`;
CREATE TABLE `pro_subscriptions` (
    `id` VARCHAR(36) NOT NULL COMMENT '订阅ID (UUID)',
    `user_id` VARCHAR(36) NOT NULL COMMENT '用户ID',
    `plan_type` ENUM('monthly', 'quarterly', 'yearly') NOT NULL COMMENT '订阅周期',
    `amount` DECIMAL(10,2) NOT NULL COMMENT '支付金额',
    `started_at` DATETIME NOT NULL COMMENT '订阅开始时间',
    `expires_at` DATETIME NOT NULL COMMENT '订阅结束时间',
    `payment_method` VARCHAR(50) DEFAULT NULL COMMENT '支付方式',
    `payment_id` VARCHAR(100) DEFAULT NULL COMMENT '支付流水号',
    `status` ENUM('pending', 'paid', 'refunded', 'cancelled') NOT NULL DEFAULT 'pending' COMMENT '支付状态',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    PRIMARY KEY (`id`),
    KEY `idx_pro_subscriptions_user` (`user_id`),
    KEY `idx_pro_subscriptions_status` (`status`),
    KEY `idx_pro_subscriptions_expires_at` (`expires_at`),
    CONSTRAINT `fk_pro_subscriptions_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Pro会员订阅记录表';

-- ============================================================
-- 第二部分：工作流相关表
-- ============================================================

-- -----------------------------------------------------------
-- 4. 工作流表 (workflows)
-- 存储工作流的基本信息和定价
-- -----------------------------------------------------------
DROP TABLE IF EXISTS `workflows`;
CREATE TABLE `workflows` (
    `id` VARCHAR(36) NOT NULL COMMENT '工作流ID (UUID)',
    `creator_id` VARCHAR(36) NOT NULL COMMENT '创作者用户ID',
    `title` VARCHAR(200) NOT NULL COMMENT '工作流标题',
    `description` TEXT COMMENT '工作流描述',
    `prompt` TEXT COMMENT '完整prompt内容',
    `prompt_preview` VARCHAR(100) DEFAULT NULL COMMENT 'prompt预览 (前50字)',
    `cover_image` VARCHAR(500) DEFAULT NULL COMMENT '封面图URL',
    `category_id` VARCHAR(36) DEFAULT NULL COMMENT '分类ID',
    `tags` JSON DEFAULT NULL COMMENT '标签数组',
    `level` TINYINT NOT NULL DEFAULT 1 COMMENT '工作流等级 (1:免费 2:Pro免费 3:付费)',
    `price` DECIMAL(10,2) DEFAULT NULL COMMENT '价格 (仅level=3时有效)',
    `status` ENUM('draft', 'pending', 'approved', 'rejected', 'archived') NOT NULL DEFAULT 'draft' COMMENT '状态',
    `reject_reason` VARCHAR(500) DEFAULT NULL COMMENT '拒绝原因',
    `usage_count` INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '使用次数 (冗余字段，定期同步)',
    `purchase_count` INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '购买次数 (冗余字段)',
    `view_count` INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '浏览次数',
    `published_at` DATETIME DEFAULT NULL COMMENT '发布时间',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`id`),
    KEY `idx_workflows_creator` (`creator_id`),
    KEY `idx_workflows_level` (`level`),
    KEY `idx_workflows_status` (`status`),
    KEY `idx_workflows_category` (`category_id`),
    KEY `idx_workflows_creator_status` (`creator_id`, `status`),
    KEY `idx_workflows_level_status` (`level`, `status`),
    KEY `idx_workflows_published_at` (`published_at`),
    KEY `idx_workflows_usage_count` (`usage_count`),
    CONSTRAINT `fk_workflows_creator` FOREIGN KEY (`creator_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='工作流表';

-- -----------------------------------------------------------
-- 5. 工作流分类表 (workflow_categories)
-- -----------------------------------------------------------
DROP TABLE IF EXISTS `workflow_categories`;
CREATE TABLE `workflow_categories` (
    `id` VARCHAR(36) NOT NULL COMMENT '分类ID (UUID)',
    `name` VARCHAR(50) NOT NULL COMMENT '分类名称',
    `icon` VARCHAR(100) DEFAULT NULL COMMENT '分类图标',
    `sort_order` INT NOT NULL DEFAULT 0 COMMENT '排序权重',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    PRIMARY KEY (`id`),
    KEY `idx_workflow_categories_sort` (`sort_order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='工作流分类表';

-- -----------------------------------------------------------
-- 6. 工作流使用记录表 (workflow_usage)
-- 记录每次工作流被使用的情况
-- -----------------------------------------------------------
DROP TABLE IF EXISTS `workflow_usage`;
CREATE TABLE `workflow_usage` (
    `id` VARCHAR(36) NOT NULL COMMENT '记录ID (UUID)',
    `workflow_id` VARCHAR(36) NOT NULL COMMENT '工作流ID',
    `user_id` VARCHAR(36) NOT NULL COMMENT '使用者用户ID',
    `used_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '使用时间',
    PRIMARY KEY (`id`),
    KEY `idx_workflow_usage_workflow` (`workflow_id`),
    KEY `idx_workflow_usage_user` (`user_id`),
    KEY `idx_workflow_usage_date` (`used_at`),
    KEY `idx_workflow_usage_workflow_date` (`workflow_id`, `used_at`),
    -- 防刷机制：同一用户对同一工作流每分钟只记录一次
    UNIQUE KEY `uk_workflow_usage_anti_spam` (`workflow_id`, `user_id`, `used_at`),
    CONSTRAINT `fk_workflow_usage_workflow` FOREIGN KEY (`workflow_id`) REFERENCES `workflows` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_workflow_usage_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='工作流使用记录表';

-- -----------------------------------------------------------
-- 7. 工作流购买记录表 (workflow_purchases)
-- 记录付费工作流的购买情况
-- -----------------------------------------------------------
DROP TABLE IF EXISTS `workflow_purchases`;
CREATE TABLE `workflow_purchases` (
    `id` VARCHAR(36) NOT NULL COMMENT '购买记录ID (UUID)',
    `workflow_id` VARCHAR(36) NOT NULL COMMENT '工作流ID',
    `buyer_id` VARCHAR(36) NOT NULL COMMENT '购买者用户ID',
    `seller_id` VARCHAR(36) NOT NULL COMMENT '卖家(创作者)用户ID',
    `original_price` DECIMAL(10,2) NOT NULL COMMENT '原价',
    `discount_rate` DECIMAL(3,2) NOT NULL DEFAULT 1.00 COMMENT '折扣率 (Pro用户0.5)',
    `actual_price` DECIMAL(10,2) NOT NULL COMMENT '实际支付价格',
    `creator_share_rate` DECIMAL(3,2) NOT NULL COMMENT '创作者分成比例',
    `creator_revenue` DECIMAL(10,2) NOT NULL COMMENT '创作者收益',
    `platform_revenue` DECIMAL(10,2) NOT NULL COMMENT '平台收益',
    `payment_method` VARCHAR(50) DEFAULT NULL COMMENT '支付方式',
    `payment_id` VARCHAR(100) DEFAULT NULL COMMENT '支付流水号',
    `status` ENUM('pending', 'paid', 'refund_pending', 'refunded', 'cancelled') NOT NULL DEFAULT 'pending' COMMENT '支付状态',
    `refund_reason` VARCHAR(500) DEFAULT NULL COMMENT '退款原因',
    `refund_rejected_reason` VARCHAR(500) DEFAULT NULL COMMENT '退款拒绝原因',
    `purchased_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '购买时间',
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_workflow_purchases_buyer_workflow` (`buyer_id`, `workflow_id`),
    KEY `idx_workflow_purchases_workflow` (`workflow_id`),
    KEY `idx_workflow_purchases_buyer` (`buyer_id`),
    KEY `idx_workflow_purchases_seller` (`seller_id`),
    KEY `idx_workflow_purchases_status` (`status`),
    KEY `idx_workflow_purchases_date` (`purchased_at`),
    CONSTRAINT `fk_workflow_purchases_workflow` FOREIGN KEY (`workflow_id`) REFERENCES `workflows` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_workflow_purchases_buyer` FOREIGN KEY (`buyer_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_workflow_purchases_seller` FOREIGN KEY (`seller_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='工作流购买记录表';

-- -----------------------------------------------------------
-- 8. 工作流审核记录表 (workflow_audits)
-- 记录工作流的审核历史
-- -----------------------------------------------------------
DROP TABLE IF EXISTS `workflow_audits`;
CREATE TABLE `workflow_audits` (
    `id` VARCHAR(36) NOT NULL COMMENT '审核记录ID (UUID)',
    `workflow_id` VARCHAR(36) NOT NULL COMMENT '工作流ID',
    `admin_id` VARCHAR(36) DEFAULT NULL COMMENT '审核人ID',
    `action` ENUM('submit', 'approve', 'reject', 'resubmit') NOT NULL COMMENT '操作类型',
    `old_status` VARCHAR(20) DEFAULT NULL COMMENT '变更前状态',
    `new_status` VARCHAR(20) NOT NULL COMMENT '变更后状态',
    `reason` VARCHAR(500) DEFAULT NULL COMMENT '审核意见',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '操作时间',
    PRIMARY KEY (`id`),
    KEY `idx_workflow_audits_workflow` (`workflow_id`),
    KEY `idx_workflow_audits_admin` (`admin_id`),
    KEY `idx_workflow_audits_action` (`action`),
    KEY `idx_workflow_audits_created_at` (`created_at`),
    CONSTRAINT `fk_workflow_audits_workflow` FOREIGN KEY (`workflow_id`) REFERENCES `workflows` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_workflow_audits_admin` FOREIGN KEY (`admin_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='工作流审核记录表';

-- ============================================================
-- 第三部分：积分与等级相关表
-- ============================================================

-- -----------------------------------------------------------
-- 9. 创作者统计表 (creator_stats)
-- 记录创作者的积分、等级和统计数据
-- -----------------------------------------------------------
DROP TABLE IF EXISTS `creator_stats`;
CREATE TABLE `creator_stats` (
    `id` VARCHAR(36) NOT NULL COMMENT '记录ID (UUID)',
    `user_id` VARCHAR(36) NOT NULL COMMENT '用户ID',
    `level` TINYINT UNSIGNED NOT NULL DEFAULT 1 COMMENT '创作者等级 (1-10)',
    `total_points` DECIMAL(12,3) NOT NULL DEFAULT 0.000 COMMENT '累计积分',
    `work_count` INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '已上架作品数量',
    `total_usage` BIGINT UNSIGNED NOT NULL DEFAULT 0 COMMENT '总使用次数',
    `total_purchases` INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '总购买次数',
    `total_revenue` DECIMAL(12,2) NOT NULL DEFAULT 0.00 COMMENT '累计收益',
    `pending_revenue` DECIMAL(12,2) NOT NULL DEFAULT 0.00 COMMENT '待结算收益',
    `withdrawn_revenue` DECIMAL(12,2) NOT NULL DEFAULT 0.00 COMMENT '已提现收益',
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_creator_stats_user` (`user_id`),
    KEY `idx_creator_stats_level` (`level`),
    KEY `idx_creator_stats_points` (`total_points`),
    CONSTRAINT `fk_creator_stats_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='创作者统计表';

-- -----------------------------------------------------------
-- 9.1 创作者申请表 (creator_applications)
-- 记录用户申请创作者的历史
-- -----------------------------------------------------------
DROP TABLE IF EXISTS `creator_applications`;
CREATE TABLE `creator_applications` (
    `id` VARCHAR(36) NOT NULL COMMENT '申请ID (UUID)',
    `user_id` VARCHAR(36) NOT NULL COMMENT '用户ID',
    `status` ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending' COMMENT '申请状态',
    `approved_workflows` INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '申请时已通过审核的工作流数',
    `reason` TEXT DEFAULT NULL COMMENT '申请理由',
    `reject_reason` VARCHAR(500) DEFAULT NULL COMMENT '拒绝原因',
    `reviewed_by` VARCHAR(36) DEFAULT NULL COMMENT '审核人ID',
    `reviewed_at` DATETIME DEFAULT NULL COMMENT '审核时间',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '申请时间',
    PRIMARY KEY (`id`),
    KEY `idx_creator_applications_user` (`user_id`),
    KEY `idx_creator_applications_status` (`status`),
    KEY `idx_creator_applications_created_at` (`created_at`),
    CONSTRAINT `fk_creator_applications_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='创作者申请表';

-- -----------------------------------------------------------
-- 10. 积分记录表 (points_records)
-- 记录积分的获取和消耗明细
-- -----------------------------------------------------------
DROP TABLE IF EXISTS `points_records`;
CREATE TABLE `points_records` (
    `id` VARCHAR(36) NOT NULL COMMENT '记录ID (UUID)',
    `user_id` VARCHAR(36) NOT NULL COMMENT '用户ID',
    `points` DECIMAL(10,3) NOT NULL COMMENT '积分变动 (正数为获取，负数为消耗)',
    `balance_after` DECIMAL(12,3) NOT NULL COMMENT '变动后积分余额',
    `reason` ENUM(
        'publish_free',      -- 发布免费工作流 +1
        'publish_pro',       -- 发布Pro免费工作流 +2
        'publish_paid',      -- 发布付费工作流 +3
        'workflow_used',     -- 工作流被使用 +0.001
        'workflow_purchased', -- 付费工作流被购买 +0.5
        'manual_adjust'      -- 手动调整
    ) NOT NULL COMMENT '积分变动原因',
    `related_type` ENUM('workflow', 'purchase', 'admin') DEFAULT NULL COMMENT '关联对象类型',
    `related_id` VARCHAR(36) DEFAULT NULL COMMENT '关联对象ID',
    `description` VARCHAR(200) DEFAULT NULL COMMENT '描述说明',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    PRIMARY KEY (`id`),
    KEY `idx_points_records_user` (`user_id`),
    KEY `idx_points_records_reason` (`reason`),
    KEY `idx_points_records_created_at` (`created_at`),
    KEY `idx_points_records_user_date` (`user_id`, `created_at`),
    CONSTRAINT `fk_points_records_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='积分记录表';

-- -----------------------------------------------------------
-- 11. 等级升级记录表 (level_upgrades)
-- 记录创作者等级变化历史
-- -----------------------------------------------------------
DROP TABLE IF EXISTS `level_upgrades`;
CREATE TABLE `level_upgrades` (
    `id` VARCHAR(36) NOT NULL COMMENT '记录ID (UUID)',
    `user_id` VARCHAR(36) NOT NULL COMMENT '用户ID',
    `old_level` TINYINT UNSIGNED NOT NULL COMMENT '变更前等级',
    `new_level` TINYINT UNSIGNED NOT NULL COMMENT '变更后等级',
    `trigger_points` DECIMAL(12,3) NOT NULL COMMENT '触发时积分',
    `trigger_works` INT UNSIGNED NOT NULL COMMENT '触发时作品数',
    `trigger_usage` BIGINT UNSIGNED NOT NULL COMMENT '触发时使用次数',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '升级时间',
    PRIMARY KEY (`id`),
    KEY `idx_level_upgrades_user` (`user_id`),
    KEY `idx_level_upgrades_created_at` (`created_at`),
    CONSTRAINT `fk_level_upgrades_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='等级升级记录表';

-- -----------------------------------------------------------
-- 12. 等级门槛配置表 (level_thresholds)
-- 存储各等级升级所需的条件
-- -----------------------------------------------------------
DROP TABLE IF EXISTS `level_thresholds`;
CREATE TABLE `level_thresholds` (
    `level` TINYINT UNSIGNED NOT NULL COMMENT '目标等级',
    `required_points` DECIMAL(10,2) NOT NULL COMMENT '所需累计积分',
    `required_works` INT UNSIGNED NOT NULL COMMENT '所需作品数',
    `required_usage` BIGINT UNSIGNED NOT NULL COMMENT '所需总使用次数',
    `share_rate` DECIMAL(3,2) NOT NULL COMMENT '该等级的分成比例',
    PRIMARY KEY (`level`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='等级门槛配置表';

-- 插入等级门槛数据
INSERT INTO `level_thresholds` (`level`, `required_points`, `required_works`, `required_usage`, `share_rate`) VALUES
(1, 0, 0, 0, 0.60),
(2, 50, 5, 5000, 0.63),
(3, 150, 10, 20000, 0.66),
(4, 300, 15, 50000, 0.69),
(5, 500, 20, 100000, 0.72),
(6, 800, 30, 200000, 0.75),
(7, 1200, 40, 400000, 0.78),
(8, 1800, 50, 700000, 0.81),
(9, 2600, 60, 1200000, 0.85),
(10, 3600, 80, 2000000, 0.90);

-- ============================================================
-- 第四部分：收益分配相关表
-- ============================================================

-- -----------------------------------------------------------
-- 13. 收益记录表 (revenue_records)
-- 记录创作者的所有收益明细
-- -----------------------------------------------------------
DROP TABLE IF EXISTS `revenue_records`;
CREATE TABLE `revenue_records` (
    `id` VARCHAR(36) NOT NULL COMMENT '记录ID (UUID)',
    `user_id` VARCHAR(36) NOT NULL COMMENT '用户ID',
    `amount` DECIMAL(12,2) NOT NULL COMMENT '收益金额',
    `type` ENUM('pro_incentive', 'paid_sale') NOT NULL COMMENT '收益类型',
    `source` VARCHAR(200) DEFAULT NULL COMMENT '来源说明',
    `period` VARCHAR(7) DEFAULT NULL COMMENT '结算周期 (YYYY-MM)',
    `related_type` ENUM('workflow', 'purchase', 'incentive_pool') DEFAULT NULL COMMENT '关联对象类型',
    `related_id` VARCHAR(36) DEFAULT NULL COMMENT '关联对象ID',
    `status` ENUM('pending', 'settled', 'withdrawn', 'cancelled') NOT NULL DEFAULT 'pending' COMMENT '状态',
    `settled_at` DATETIME DEFAULT NULL COMMENT '结算时间',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    PRIMARY KEY (`id`),
    KEY `idx_revenue_records_user` (`user_id`),
    KEY `idx_revenue_records_type` (`type`),
    KEY `idx_revenue_records_period` (`period`),
    KEY `idx_revenue_records_status` (`status`),
    KEY `idx_revenue_records_user_period` (`user_id`, `period`),
    KEY `idx_revenue_records_type_period` (`type`, `period`),
    CONSTRAINT `fk_revenue_records_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='收益记录表';

-- -----------------------------------------------------------
-- 14. 激励池记录表 (incentive_pools)
-- 记录每月的Pro免费工作流激励池
-- -----------------------------------------------------------
DROP TABLE IF EXISTS `incentive_pools`;
CREATE TABLE `incentive_pools` (
    `id` VARCHAR(36) NOT NULL COMMENT '记录ID (UUID)',
    `period` VARCHAR(7) NOT NULL COMMENT '周期 (YYYY-MM)',
    `pro_revenue` DECIMAL(14,2) NOT NULL COMMENT '当月Pro会员总收益',
    `pool_amount` DECIMAL(14,2) NOT NULL COMMENT '激励池总额 (Pro收益的20%)',
    `non_creator_pool` DECIMAL(14,2) NOT NULL COMMENT '非创作者池 (25%)',
    `creator_pool` DECIMAL(14,2) NOT NULL COMMENT '创作者池 (75%)',
    `non_creator_usage` BIGINT UNSIGNED NOT NULL DEFAULT 0 COMMENT '非创作者Pro工作流总使用次数',
    `creator_usage` BIGINT UNSIGNED NOT NULL DEFAULT 0 COMMENT '创作者Pro工作流总使用次数',
    `status` ENUM('pending', 'calculated', 'distributed') NOT NULL DEFAULT 'pending' COMMENT '状态',
    `calculated_at` DATETIME DEFAULT NULL COMMENT '计算时间',
    `distributed_at` DATETIME DEFAULT NULL COMMENT '分配时间',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_incentive_pools_period` (`period`),
    KEY `idx_incentive_pools_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='激励池记录表';

-- -----------------------------------------------------------
-- 15. 激励分配明细表 (incentive_distributions)
-- 记录激励池分配给每个创作者的明细
-- -----------------------------------------------------------
DROP TABLE IF EXISTS `incentive_distributions`;
CREATE TABLE `incentive_distributions` (
    `id` VARCHAR(36) NOT NULL COMMENT '记录ID (UUID)',
    `pool_id` VARCHAR(36) NOT NULL COMMENT '激励池ID',
    `user_id` VARCHAR(36) NOT NULL COMMENT '用户ID',
    `is_creator` TINYINT(1) NOT NULL COMMENT '是否为创作者',
    `usage_count` BIGINT UNSIGNED NOT NULL COMMENT '该用户Pro工作流使用次数',
    `share_ratio` DECIMAL(10,8) NOT NULL COMMENT '分成比例',
    `amount` DECIMAL(12,2) NOT NULL COMMENT '分配金额',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    PRIMARY KEY (`id`),
    KEY `idx_incentive_distributions_pool` (`pool_id`),
    KEY `idx_incentive_distributions_user` (`user_id`),
    CONSTRAINT `fk_incentive_distributions_pool` FOREIGN KEY (`pool_id`) REFERENCES `incentive_pools` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_incentive_distributions_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='激励分配明细表';

-- -----------------------------------------------------------
-- 16. 提现申请表 (withdrawal_requests)
-- 记录创作者的提现申请
-- -----------------------------------------------------------
DROP TABLE IF EXISTS `withdrawal_requests`;
CREATE TABLE `withdrawal_requests` (
    `id` VARCHAR(36) NOT NULL COMMENT '申请ID (UUID)',
    `user_id` VARCHAR(36) NOT NULL COMMENT '用户ID',
    `amount` DECIMAL(12,2) NOT NULL COMMENT '提现金额',
    `fee` DECIMAL(10,2) NOT NULL DEFAULT 0.00 COMMENT '手续费',
    `actual_amount` DECIMAL(12,2) NOT NULL COMMENT '实际到账金额',
    `bank_name` VARCHAR(50) DEFAULT NULL COMMENT '银行名称',
    `bank_account` VARCHAR(50) DEFAULT NULL COMMENT '银行账号',
    `bank_holder` VARCHAR(50) DEFAULT NULL COMMENT '持卡人姓名',
    `alipay_account` VARCHAR(100) DEFAULT NULL COMMENT '支付宝账号',
    `status` ENUM('pending', 'approved', 'rejected', 'processing', 'completed', 'failed') NOT NULL DEFAULT 'pending' COMMENT '状态',
    `reject_reason` VARCHAR(200) DEFAULT NULL COMMENT '拒绝原因',
    `processed_by` VARCHAR(36) DEFAULT NULL COMMENT '处理人ID',
    `processed_at` DATETIME DEFAULT NULL COMMENT '处理时间',
    `completed_at` DATETIME DEFAULT NULL COMMENT '完成时间',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    PRIMARY KEY (`id`),
    KEY `idx_withdrawal_requests_user` (`user_id`),
    KEY `idx_withdrawal_requests_status` (`status`),
    KEY `idx_withdrawal_requests_created_at` (`created_at`),
    CONSTRAINT `fk_withdrawal_requests_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='提现申请表';

-- ============================================================
-- 第五部分：合辑相关表
-- ============================================================

-- -----------------------------------------------------------
-- 17. 合辑表 (collections)
-- 创作者可以创建合辑来组织工作流
-- -----------------------------------------------------------
DROP TABLE IF EXISTS `collections`;
CREATE TABLE `collections` (
    `id` VARCHAR(36) NOT NULL COMMENT '合辑ID (UUID)',
    `creator_id` VARCHAR(36) NOT NULL COMMENT '创作者用户ID',
    `title` VARCHAR(200) NOT NULL COMMENT '合辑标题',
    `description` TEXT COMMENT '合辑描述',
    `cover_image` VARCHAR(500) DEFAULT NULL COMMENT '封面图URL',
    `is_public` TINYINT(1) NOT NULL DEFAULT 1 COMMENT '是否公开',
    `workflow_count` INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '包含工作流数量',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`id`),
    KEY `idx_collections_creator` (`creator_id`),
    KEY `idx_collections_is_public` (`is_public`),
    CONSTRAINT `fk_collections_creator` FOREIGN KEY (`creator_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='合辑表';

-- -----------------------------------------------------------
-- 18. 合辑内容表 (collection_items)
-- 合辑与工作流的关联关系
-- -----------------------------------------------------------
DROP TABLE IF EXISTS `collection_items`;
CREATE TABLE `collection_items` (
    `id` VARCHAR(36) NOT NULL COMMENT '记录ID (UUID)',
    `collection_id` VARCHAR(36) NOT NULL COMMENT '合辑ID',
    `workflow_id` VARCHAR(36) NOT NULL COMMENT '工作流ID',
    `sort_order` INT NOT NULL DEFAULT 0 COMMENT '排序权重',
    `added_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '添加时间',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_collection_items_collection_workflow` (`collection_id`, `workflow_id`),
    KEY `idx_collection_items_collection` (`collection_id`),
    KEY `idx_collection_items_workflow` (`workflow_id`),
    KEY `idx_collection_items_sort` (`collection_id`, `sort_order`),
    CONSTRAINT `fk_collection_items_collection` FOREIGN KEY (`collection_id`) REFERENCES `collections` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_collection_items_workflow` FOREIGN KEY (`workflow_id`) REFERENCES `workflows` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='合辑内容表';

-- ============================================================
-- 第六部分：管理后台相关表
-- ============================================================

-- -----------------------------------------------------------
-- 19. 管理员表 (admins)
-- 存储管理后台用户
-- -----------------------------------------------------------
DROP TABLE IF EXISTS `admins`;
CREATE TABLE `admins` (
    `id` VARCHAR(36) NOT NULL COMMENT '管理员ID (UUID)',
    `user_id` VARCHAR(36) DEFAULT NULL COMMENT '关联的用户ID (可选)',
    `username` VARCHAR(50) NOT NULL COMMENT '管理员账号',
    `password_hash` VARCHAR(255) NOT NULL COMMENT '密码哈希',
    `role` ENUM('super_admin', 'admin', 'auditor') NOT NULL DEFAULT 'auditor' COMMENT '角色',
    `permissions` JSON DEFAULT NULL COMMENT '权限配置',
    `status` ENUM('active', 'disabled') NOT NULL DEFAULT 'active' COMMENT '状态',
    `last_login_at` DATETIME DEFAULT NULL COMMENT '最后登录时间',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_admins_username` (`username`),
    KEY `idx_admins_role` (`role`),
    KEY `idx_admins_status` (`status`),
    CONSTRAINT `fk_admins_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='管理员表';

-- -----------------------------------------------------------
-- 20. 操作日志表 (operation_logs)
-- 记录重要操作的审计日志
-- -----------------------------------------------------------
DROP TABLE IF EXISTS `operation_logs`;
CREATE TABLE `operation_logs` (
    `id` VARCHAR(36) NOT NULL COMMENT '记录ID (UUID)',
    `operator_type` ENUM('user', 'admin', 'system') NOT NULL COMMENT '操作者类型',
    `operator_id` VARCHAR(36) DEFAULT NULL COMMENT '操作者ID',
    `action` VARCHAR(50) NOT NULL COMMENT '操作类型',
    `target_type` VARCHAR(50) DEFAULT NULL COMMENT '目标对象类型',
    `target_id` VARCHAR(36) DEFAULT NULL COMMENT '目标对象ID',
    `old_value` JSON DEFAULT NULL COMMENT '变更前的值',
    `new_value` JSON DEFAULT NULL COMMENT '变更后的值',
    `ip_address` VARCHAR(45) DEFAULT NULL COMMENT 'IP地址',
    `user_agent` VARCHAR(500) DEFAULT NULL COMMENT 'User Agent',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '操作时间',
    PRIMARY KEY (`id`),
    KEY `idx_operation_logs_operator` (`operator_type`, `operator_id`),
    KEY `idx_operation_logs_action` (`action`),
    KEY `idx_operation_logs_target` (`target_type`, `target_id`),
    KEY `idx_operation_logs_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='操作日志表';

-- ============================================================
-- 第七部分：其他辅助表
-- ============================================================

-- -----------------------------------------------------------
-- 21. AI使用额度表 (ai_usage_quotas)
-- 记录用户的AI转工作流使用额度
-- -----------------------------------------------------------
DROP TABLE IF EXISTS `ai_usage_quotas`;
CREATE TABLE `ai_usage_quotas` (
    `id` VARCHAR(36) NOT NULL COMMENT '记录ID (UUID)',
    `user_id` VARCHAR(36) NOT NULL COMMENT '用户ID',
    `month` VARCHAR(7) NOT NULL COMMENT '月份 (YYYY-MM)',
    `quota_limit` INT UNSIGNED NOT NULL COMMENT '额度上限',
    `used_count` INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '已使用次数',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_ai_usage_quotas_user_month` (`user_id`, `month`),
    KEY `idx_ai_usage_quotas_month` (`month`),
    CONSTRAINT `fk_ai_usage_quotas_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='AI使用额度表';

-- -----------------------------------------------------------
-- 22. 用户操作限制表 (user_rate_limits)
-- 用于防刷和限流
-- -----------------------------------------------------------
DROP TABLE IF EXISTS `user_rate_limits`;
CREATE TABLE `user_rate_limits` (
    `id` VARCHAR(36) NOT NULL COMMENT '记录ID (UUID)',
    `user_id` VARCHAR(36) NOT NULL COMMENT '用户ID',
    `action_type` VARCHAR(50) NOT NULL COMMENT '操作类型',
    `action_count` INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '操作次数',
    `window_start` DATETIME NOT NULL COMMENT '时间窗口开始',
    `window_end` DATETIME NOT NULL COMMENT '时间窗口结束',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_user_rate_limits_user_action_window` (`user_id`, `action_type`, `window_start`),
    KEY `idx_user_rate_limits_window` (`window_end`),
    CONSTRAINT `fk_user_rate_limits_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户操作限制表';

-- -----------------------------------------------------------
-- 23. 系统配置表 (system_configs)
-- 存储可动态调整的系统配置
-- -----------------------------------------------------------
DROP TABLE IF EXISTS `system_configs`;
CREATE TABLE `system_configs` (
    `key` VARCHAR(100) NOT NULL COMMENT '配置键',
    `value` TEXT NOT NULL COMMENT '配置值',
    `type` ENUM('string', 'number', 'boolean', 'json') NOT NULL DEFAULT 'string' COMMENT '值类型',
    `description` VARCHAR(200) DEFAULT NULL COMMENT '配置说明',
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='系统配置表';

-- -----------------------------------------------------------
-- 24. 收藏文件夹表 (favorite_folders)
-- 用户的收藏分类
-- -----------------------------------------------------------
DROP TABLE IF EXISTS `favorite_folders`;
CREATE TABLE `favorite_folders` (
    `id` VARCHAR(36) NOT NULL COMMENT '文件夹ID (UUID)',
    `user_id` VARCHAR(36) NOT NULL COMMENT '用户ID',
    `name` VARCHAR(100) NOT NULL COMMENT '文件夹名称',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    PRIMARY KEY (`id`),
    KEY `idx_favorite_folders_user` (`user_id`),
    CONSTRAINT `fk_favorite_folders_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='收藏文件夹表';

-- -----------------------------------------------------------
-- 25. 用户收藏表 (user_favorites)
-- 用户收藏的工作流
-- -----------------------------------------------------------
DROP TABLE IF EXISTS `user_favorites`;
CREATE TABLE `user_favorites` (
    `id` VARCHAR(36) NOT NULL COMMENT '收藏ID (UUID)',
    `user_id` VARCHAR(36) NOT NULL COMMENT '用户ID',
    `workflow_id` VARCHAR(36) NOT NULL COMMENT '工作流ID',
    `folder_id` VARCHAR(36) DEFAULT NULL COMMENT '文件夹ID',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '收藏时间',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_user_favorites_user_workflow` (`user_id`, `workflow_id`),
    KEY `idx_user_favorites_user` (`user_id`),
    KEY `idx_user_favorites_workflow` (`workflow_id`),
    KEY `idx_user_favorites_folder` (`folder_id`),
    CONSTRAINT `fk_user_favorites_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_user_favorites_workflow` FOREIGN KEY (`workflow_id`) REFERENCES `workflows` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_user_favorites_folder` FOREIGN KEY (`folder_id`) REFERENCES `favorite_folders` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户收藏表';

-- 插入默认配置
INSERT INTO `system_configs` (`key`, `value`, `type`, `description`) VALUES
('pro_incentive_rate', '0.20', 'number', 'Pro免费工作流激励池比例 (Pro收益的百分比)'),
('non_creator_pool_rate', '0.25', 'number', '非创作者池分配比例'),
('creator_pool_rate', '0.75', 'number', '创作者池分配比例'),
('pro_discount_rate', '0.50', 'number', 'Pro用户购买付费工作流的折扣'),
('free_user_ai_quota', '5', 'number', 'Free用户每月AI转工作流次数'),
('pro_user_ai_quota', '200', 'number', 'Pro用户每月AI转工作流次数'),
('pro_monthly_price', '29.00', 'number', 'Pro会员月费'),
('pro_quarterly_price', '79.00', 'number', 'Pro会员季费'),
('pro_yearly_price', '299.00', 'number', 'Pro会员年费'),
('min_withdrawal_amount', '100.00', 'number', '最低提现金额'),
('withdrawal_fee_rate', '0.01', 'number', '提现手续费率'),
('new_user_bonus_points', '0', 'number', '新用户赠送积分');

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================
-- 数据库设计说明
-- ============================================================
--
-- 表总数：23个
--
-- 核心表说明：
-- 1. users - 用户基础信息，独立于会员状态
-- 2. memberships - 会员关系，type表示会员类型，is_creator表示是否为创作者（叠加身份）
-- 3. workflows - 工作流核心表，level字段表示定价等级(1/2/3)
-- 4. creator_stats - 创作者统计，包含等级、积分、收益汇总
-- 5. revenue_records - 收益明细，支持激励分成和销售分成两种类型
-- 6. incentive_pools - 月度激励池，用于Pro免费工作流收益分配
--
-- 关键设计决策：
-- 1. 使用UUID作为主键，便于分布式部署
-- 2. 金额字段使用DECIMAL(10,2)或更高精度，避免浮点误差
-- 3. 积分字段使用DECIMAL(12,3)支持0.001级别的积分
-- 4. 冗余字段（如usage_count）通过定时任务同步，提高查询性能
-- 5. 所有时间字段使用DATETIME，应用层统一处理时区
-- 6. 外键约束确保数据完整性，配合ON DELETE CASCADE简化删除逻辑
--
-- 索引策略：
-- 1. 主键和唯一键自动创建索引
-- 2. 外键字段创建普通索引
-- 3. 常用查询字段（status, type, created_at等）创建索引
-- 4. 复合索引按查询频率和选择性设计
--
-- ============================================================
