const axios = require('axios');

async function testAlibabaAPI() {
  const apiKey = 'sk-9f74ae6c017b46249f8081cc4296b5a3';
  const baseUrl = 'https://dashscope.aliyuncs.com/compatible-mode/v1';
  const model = 'qwen-plus';
  
  console.log('Testing Alibaba Cloud API...');
  console.log('API Key:', apiKey.substring(0, 10) + '...');
  console.log('Base URL:', baseUrl);
  console.log('Model:', model);
  
  try {
    const response = await axios.post(
      `${baseUrl}/chat/completions`,
      {
        model: model,
        messages: [
          {
            role: 'user',
            content: '你好，请回复"测试成功"'
          }
        ]
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      }
    );
    
    console.log('\n✅ API Test Successful!');
    console.log('Response:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error('\n❌ API Test Failed!');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Status Text:', error.response.statusText);
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error('Error:', error.message);
    }
  }
}

testAlibabaAPI();
