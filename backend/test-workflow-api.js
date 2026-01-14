const jwt = require('jsonwebtoken');
const https = require('https');
const http = require('http');

const userId = 'cmhydnhaa00009k0re6466k79';
const workflowId = 'cmhyk1utk003n9kaoizsoy4ef';
const jwtSecret = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';

const token = jwt.sign({ userId }, jwtSecret);

const options = {
  hostname: 'localhost',
  port: 3000,
  path: `/api/workflows/${workflowId}`,
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`
  }
};

const req = http.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log('状态码:', res.statusCode);
    const result = JSON.parse(data);
    if (result.workflow) {
      console.log('成功获取工作流:', result.workflow.id, '-', result.workflow.title);
    } else if (result.error) {
      console.log('错误:', result.error);
    } else {
      console.log('返回数据:', JSON.stringify(result).substring(0, 200));
    }
  });
});

req.on('error', (e) => {
  console.error('请求失败:', e.message);
});

req.end();
