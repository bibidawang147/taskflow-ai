/**
 * 测试脚本 - 文章转工作流功能
 * 用于调试和验证功能是否正常
 */

const axios = require('axios')

const API_BASE_URL = 'http://localhost:3000/api'

async function testArticleToWorkflow() {
  console.log('🧪 开始测试文章转工作流功能...\n')

  // 测试文章URL（一个简单的示例）
  const testUrl = 'https://example.com'

  try {
    // 步骤1: 登录获取token
    console.log('📝 步骤1: 登录测试账号...')
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: 'test@workflow.com',
      password: 'test123456'
    })

    const token = loginResponse.data.token
    console.log('✅ 登录成功！Token:', token.substring(0, 20) + '...\n')

    // 步骤2: 测试生成工作流
    console.log('📝 步骤2: 调用生成工作流API...')
    console.log('测试URL:', testUrl)

    const response = await axios.post(
      `${API_BASE_URL}/workflows/generate/from-article`,
      {
        url: testUrl,
        autoSave: true
      },
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    )

    console.log('✅ 工作流生成成功！')
    console.log('\n📊 返回数据:')
    console.log('- 工作流ID:', response.data.workflow?.id)
    console.log('- 工作流标题:', response.data.workflow?.title)
    console.log('- 提取步骤数:', response.data.analysis?.stepsExtracted)
    console.log('- 分类:', response.data.analysis?.category)
    console.log('- 标签:', response.data.analysis?.tags)

  } catch (error) {
    console.error('\n❌ 测试失败！')

    if (error.response) {
      // 服务器返回了错误响应
      console.error('\n错误信息:')
      console.error('- 状态码:', error.response.status)
      console.error('- 错误:', error.response.data?.error || error.response.data)

      if (error.response.data?.error) {
        console.error('\n💡 可能的解决方案:')

        if (error.response.data.error.includes('OpenAI')) {
          console.error('   ⚠️  未配置OpenAI API Key')
          console.error('   解决方法: 在 backend/.env 文件中添加:')
          console.error('   OPENAI_API_KEY=sk-your-api-key-here')
        } else if (error.response.data.error.includes('抓取')) {
          console.error('   ⚠️  无法抓取文章内容')
          console.error('   解决方法: 使用其他文章URL，或检查网络连接')
        } else if (error.response.data.error.includes('分析')) {
          console.error('   ⚠️  AI分析失败')
          console.error('   解决方法: 检查OpenAI API Key是否有效，账号是否有余额')
        }
      }
    } else if (error.request) {
      // 请求已发送但没有收到响应
      console.error('\n❌ 无法连接到后端服务器')
      console.error('   请确认后端是否在运行: npm run dev')
      console.error('   后端应该在: http://localhost:3000')
    } else {
      // 其他错误
      console.error('\n错误详情:', error.message)
    }

    process.exit(1)
  }
}

// 运行测试
console.log('='.repeat(50))
console.log('  文章转工作流 - 功能测试')
console.log('='.repeat(50))
console.log()

testArticleToWorkflow()
  .then(() => {
    console.log('\n✅ 所有测试通过！')
    console.log('='.repeat(50))
    process.exit(0)
  })
  .catch((err) => {
    console.error('\n❌ 测试异常:', err.message)
    process.exit(1)
  })
