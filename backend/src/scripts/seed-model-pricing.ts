/**
 * 数据库初始化脚本 - 导入模型定价配置
 *
 * 运行方式：
 * npx ts-node src/scripts/seed-model-pricing.ts
 */

import prisma from '../utils/database';
import { MODEL_PRICING_CONFIG } from '../config/model-pricing';

async function seedModelPricing() {
  console.log('开始导入模型定价配置...');

  try {
    for (const config of MODEL_PRICING_CONFIG) {
      await prisma.modelPricing.upsert({
        where: {
          provider_modelId: {
            provider: config.provider,
            modelId: config.modelId,
          },
        },
        update: {
          modelName: config.modelName,
          description: config.description,
          inputPrice: config.inputPrice,
          outputPrice: config.outputPrice,
          category: config.category,
          maxTokens: config.maxTokens,
          features: config.features || {},
          isActive: config.isActive,
          allowedTiers: config.allowedTiers,
          sortOrder: config.sortOrder,
        },
        create: {
          provider: config.provider,
          modelId: config.modelId,
          modelName: config.modelName,
          description: config.description,
          inputPrice: config.inputPrice,
          outputPrice: config.outputPrice,
          category: config.category,
          maxTokens: config.maxTokens,
          features: config.features || {},
          isActive: config.isActive,
          allowedTiers: config.allowedTiers,
          sortOrder: config.sortOrder,
        },
      });

      console.log(`✓ ${config.provider}:${config.modelId} - ${config.modelName}`);
    }

    console.log(`\n成功导入 ${MODEL_PRICING_CONFIG.length} 个模型定价配置！`);
  } catch (error) {
    console.error('导入失败:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// 执行导入
seedModelPricing()
  .then(() => {
    console.log('完成！');
    process.exit(0);
  })
  .catch((error) => {
    console.error('错误:', error);
    process.exit(1);
  });
