/**
 * 测试阿里云视频生成服务
 */
import dotenv from 'dotenv';

// 加载环境变量（必须在导入服务之前）
dotenv.config();

import { videoGenerationService } from './src/services/videoGeneration.service';

async function testVideoGeneration() {
  console.log('=== 测试阿里云视频生成服务 ===\n');

  try {
    // 测试1: 文生视频
    console.log('测试1: 生成一段短视频...');
    const prompt1 = '一只可爱的小猫在花园里追逐蝴蝶，阳光明媚，花朵盛开';

    console.log(`提示词: ${prompt1}`);
    console.log('时长: 5秒');
    console.log('分辨率: 720p');
    console.log('正在生成视频，请稍候（预计1-3分钟）...\n');

    const result1 = await videoGenerationService.generateVideo({
      prompt: prompt1,
      duration: 5,
      resolution: '720p',
    });

    console.log('✅ 视频生成成功！');
    console.log(`任务ID: ${result1.taskId}`);
    console.log(`状态: ${result1.status}`);
    console.log(`视频URL (24小时有效): ${result1.videoUrl}`);
    console.log(`时长: ${result1.duration}秒`);
    console.log();

    // 测试2: 快速文生视频
    console.log('测试2: 使用快速接口生成视频...');
    const prompt2 = '海浪拍打沙滩，夕阳西下，海鸥飞翔';

    console.log(`提示词: ${prompt2}`);
    console.log('正在生成视频，请稍候（预计1-3分钟）...\n');

    const videoUrl = await videoGenerationService.generateTextToVideo(prompt2, {
      duration: 5,
      resolution: '720p',
    });

    console.log('✅ 视频生成成功！');
    console.log(`视频URL: ${videoUrl}`);
    console.log();

    console.log('=== 所有测试完成 ✅ ===');
    console.log('\n提示: 视频URL在24小时内有效，请及时下载保存。');
  } catch (error: any) {
    console.error('❌ 测试失败:', error.message);
    console.error('详细错误:', error);
  }
}

// 运行测试
testVideoGeneration();
