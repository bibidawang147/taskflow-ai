/**
 * 测试阿里云通义千问视觉模型 (qwen-vl-plus)
 */
import axios from 'axios';
import * as dotenv from 'dotenv';
import * as path from 'path';

// 加载环境变量
dotenv.config({ path: path.join(__dirname, '.env') });

async function testAlibabaVision() {
  const apiKey = process.env.ALIBABA_API_KEY;
  const baseUrl = process.env.ALIBABA_BASE_URL || 'https://dashscope.aliyuncs.com/compatible-mode/v1';
  const model = process.env.ALIBABA_VISION_MODEL || 'qwen-vl-plus';

  if (!apiKey) {
    console.error('❌ 未配置 ALIBABA_API_KEY');
    process.exit(1);
  }

  console.log('📋 配置信息:');
  console.log(`  API Key: ${apiKey.substring(0, 10)}...`);
  console.log(`  Base URL: ${baseUrl}`);
  console.log(`  Model: ${model}`);
  console.log('');

  // 使用一个简单的测试图片URL（示例：一个简单的图表）
  const testImageUrl = 'https://via.placeholder.com/600x400/4A90E2/FFFFFF?text=Test+Chart';

  console.log('🧪 测试1: 简单文本对话 (qwen-plus)');
  try {
    const response = await axios.post(
      `${baseUrl}/chat/completions`,
      {
        model: 'qwen-plus',
        messages: [
          { role: 'user', content: '你好，请用一句话介绍你自己。' }
        ],
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
      }
    );

    console.log('✅ 文本模型测试成功!');
    console.log('响应:', response.data.choices[0]?.message?.content);
    console.log('');
  } catch (error: any) {
    console.error('❌ 文本模型测试失败:', error.response?.data || error.message);
    console.log('');
  }

  console.log(`🧪 测试2: 视觉模型测试 (${model})`);
  try {
    const response = await axios.post(
      `${baseUrl}/chat/completions`,
      {
        model: model,
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: '请描述这张图片的内容。' },
              {
                type: 'image_url',
                image_url: { url: testImageUrl },
              },
            ],
          },
        ],
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
      }
    );

    console.log('✅ 视觉模型测试成功!');
    console.log('响应:', response.data.choices[0]?.message?.content);
    console.log('Token使用:', response.data.usage);
    console.log('');
  } catch (error: any) {
    console.error('❌ 视觉模型测试失败:');
    if (error.response?.data) {
      console.error('错误详情:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error('错误信息:', error.message);
    }
    console.log('');
  }

  console.log('🧪 测试3: JSON格式输出测试');
  try {
    const response = await axios.post(
      `${baseUrl}/chat/completions`,
      {
        model: 'qwen-plus',
        messages: [
          {
            role: 'user',
            content: '请以JSON格式返回三种水果的信息，包含name和color字段。只返回JSON，不要其他内容。'
          }
        ],
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
      }
    );

    const content = response.data.choices[0]?.message?.content;
    console.log('✅ JSON格式测试成功!');
    console.log('原始响应:', content);

    // 尝试提取JSON
    let jsonStr = content;
    const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1];
      console.log('提取的JSON:', jsonStr);
    }

    try {
      const parsed = JSON.parse(jsonStr);
      console.log('✅ JSON解析成功:', parsed);
    } catch (e) {
      console.log('⚠️  JSON解析失败，可能需要额外处理');
    }
    console.log('');
  } catch (error: any) {
    console.error('❌ JSON格式测试失败:', error.response?.data || error.message);
    console.log('');
  }

  console.log('✨ 测试完成!');
}

testAlibabaVision().catch(console.error);
