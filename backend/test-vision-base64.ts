/**
 * 测试阿里云视觉模型 - 使用Base64图片
 */
import axios from 'axios';
import * as dotenv from 'dotenv';
import * as path from 'path';

// 加载环境变量
dotenv.config({ path: path.join(__dirname, '.env') });

async function testVisionWithBase64() {
  const apiKey = process.env.ALIBABA_API_KEY;
  const baseUrl = process.env.ALIBABA_BASE_URL || 'https://dashscope.aliyuncs.com/compatible-mode/v1';
  const model = process.env.ALIBABA_VISION_MODEL || 'qwen-vl-plus';

  if (!apiKey) {
    console.error('❌ 未配置 ALIBABA_API_KEY');
    process.exit(1);
  }

  // 一个简单的1x1红色PNG图片的Base64编码
  const testBase64Image = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==';

  console.log('📋 测试阿里云视觉模型 (qwen-vl-plus)');
  console.log(`  Model: ${model}`);
  console.log('');

  console.log('🧪 发送Base64图片测试...');
  try {
    const response = await axios.post(
      `${baseUrl}/chat/completions`,
      {
        model: model,
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: '请描述这张图片。' },
              {
                type: 'image_url',
                image_url: { url: testBase64Image },
              },
            ],
          },
        ],
        max_tokens: 500,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
      }
    );

    console.log('✅ 视觉模型测试成功!');
    console.log('');
    console.log('📊 响应内容:');
    console.log(response.data.choices[0]?.message?.content);
    console.log('');
    console.log('💰 Token使用:');
    console.log(JSON.stringify(response.data.usage, null, 2));
    console.log('');
    console.log('✨ 阿里云视觉API配置完全正确，可以正常使用！');
  } catch (error: any) {
    console.error('❌ 视觉模型测试失败:');
    if (error.response?.data) {
      console.error(JSON.stringify(error.response.data, null, 2));
    } else {
      console.error(error.message);
    }
  }
}

testVisionWithBase64().catch(console.error);
