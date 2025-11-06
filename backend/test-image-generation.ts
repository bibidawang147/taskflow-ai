/**
 * 测试阿里云图片生成服务
 */
import dotenv from 'dotenv';

// 加载环境变量（必须在导入服务之前）
dotenv.config();

import { imageGenerationService } from './src/services/imageGeneration.service';

async function testImageGeneration() {
  console.log('=== 测试阿里云图片生成服务 ===\n');

  try {
    // 测试1: 简单文生图
    console.log('测试1: 生成一张风景画...');
    const prompt1 = '一幅美丽的山水画，青山绿水，云雾缭绕，中国水墨画风格';

    console.log(`提示词: ${prompt1}`);
    console.log('正在生成图片，请稍候...\n');

    const result1 = await imageGenerationService.generateImage({
      prompt: prompt1,
      size: '1024*1024',
      n: 1,
    });

    console.log('✅ 图片生成成功！');
    console.log(`任务ID: ${result1.taskId}`);
    console.log(`状态: ${result1.status}`);
    console.log(`图片URL (24小时有效):`);
    result1.images?.forEach((img, index) => {
      console.log(`  [${index + 1}] ${img.url}`);
      console.log(`      尺寸: ${img.width}x${img.height}`);
    });
    console.log();

    // 测试2: 使用风格标签
    console.log('测试2: 生成一张水彩画风格的图片...');
    const prompt2 = '可爱的小猫咪在花园里玩耍';

    console.log(`提示词: ${prompt2}`);
    console.log('风格: 水彩画');
    console.log('正在生成图片，请稍候...\n');

    const result2 = await imageGenerationService.generateImage({
      prompt: prompt2,
      size: '1024*1024',
      style: '<watercolor>',
      n: 1,
    });

    console.log('✅ 图片生成成功！');
    console.log(`任务ID: ${result2.taskId}`);
    console.log(`图片URL (24小时有效):`);
    result2.images?.forEach((img, index) => {
      console.log(`  [${index + 1}] ${img.url}`);
    });
    console.log();

    // 测试3: 快速生成
    console.log('测试3: 使用快速接口生成图片...');
    const prompt3 = '未来科技城市，赛博朋克风格，霓虹灯光';

    console.log(`提示词: ${prompt3}`);
    console.log('正在生成图片，请稍候...\n');

    const urls = await imageGenerationService.generateImageQuick(prompt3, {
      size: '1024*1024',
    });

    console.log('✅ 图片生成成功！');
    console.log('图片URL:');
    urls.forEach((url, index) => {
      console.log(`  [${index + 1}] ${url}`);
    });
    console.log();

    console.log('=== 所有测试完成 ✅ ===');
  } catch (error: any) {
    console.error('❌ 测试失败:', error.message);
    console.error('详细错误:', error);
  }
}

// 运行测试
testImageGeneration();
