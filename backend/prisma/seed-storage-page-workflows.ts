import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 开始创建 StoragePage 工作流数据...')

  // 获取第一个用户作为作者（如果没有用户则创建演示用户）
  let author = await prisma.user.findFirst()

  if (!author) {
    author = await prisma.user.create({
      data: {
        email: 'demo@example.com',
        name: '演示用户',
        password: 'hashed_password_here',
        tier: 'pro'
      }
    })
    console.log('✅ 创建演示用户:', author.id)
  } else {
    console.log('✅ 使用现有用户作为作者:', author.id)
  }

  const workflows = [
    {
      id: 'wf-orders',
      title: '订单处理流程',
      description: '覆盖下单、库存校验、物流推送的全链路自动化流程。',
      thumbnail: '📦',
      isPublic: true,
      isTemplate: true,
      isDraft: false,
      category: '电商',
      tags: '订单,物流,自动化',
      authorId: author.id,
      config: {
        prompt: '你是一个专业的订单处理助手。请根据用户输入的订单信息，自动执行以下步骤：\n1. 验证订单格式和完整性\n2. 校验库存是否充足\n3. 计算订单金额和优惠\n4. 生成物流推送信息\n5. 返回处理结果和追踪信息',
        nodes: [
          {
            id: 'node-1',
            type: 'input',
            label: '订单信息录入',
            position: { x: 0, y: 0 },
            config: {
              description: '请输入订单的基本信息',
              placeholder: '例如：订单号、商品列表、收货地址、联系方式等',
              requiredFields: ['订单号', '商品信息', '收货地址', '联系方式', '支付金额']
            }
          },
          {
            id: 'node-2',
            type: 'llm',
            label: '订单信息验证',
            position: { x: 200, y: 0 },
            config: {
              model: 'GPT-4',
              systemPrompt: '你是一个订单验证专家。请检查订单信息的完整性和格式正确性。',
              userPrompt: '请验证以下订单信息是否完整且格式正确：\n- 订单号格式是否符合规范\n- 商品信息是否完整（名称、数量、价格）\n- 收货地址是否详细准确\n- 联系方式是否有效\n- 支付金额是否匹配商品总价\n\n如果发现问题，请明确指出；如果验证通过，请输出"验证通过"并总结订单信息。',
              temperature: 0.3
            }
          },
          {
            id: 'node-3',
            type: 'tool',
            label: '库存查询与校验',
            position: { x: 400, y: 0 },
            config: {
              toolName: '库存管理系统 API',
              apiEndpoint: '/api/inventory/check',
              description: '调用库存管理系统API，查询商品库存并校验是否充足'
            }
          },
          {
            id: 'node-4',
            type: 'llm',
            label: '订单金额计算',
            position: { x: 600, y: 0 },
            config: {
              model: 'GPT-4',
              systemPrompt: '你是一个订单金额计算专家。请根据商品价格、数量、优惠券和运费计算最终订单金额。',
              temperature: 0.1
            }
          },
          {
            id: 'node-5',
            type: 'condition',
            label: '支付状态判断',
            position: { x: 800, y: 0 },
            config: {
              conditionType: '支付完成判断'
            }
          },
          {
            id: 'node-6',
            type: 'tool',
            label: '物流信息推送',
            position: { x: 1000, y: 0 },
            config: {
              toolName: '物流平台 API',
              apiEndpoint: '/api/logistics/create-order'
            }
          },
          {
            id: 'node-7',
            type: 'llm',
            label: '生成订单确认通知',
            position: { x: 1200, y: 0 },
            config: {
              model: 'GPT-4',
              systemPrompt: '你是一个客服专家。请生成友好、专业的订单确认通知。',
              temperature: 0.7
            }
          },
          {
            id: 'node-8',
            type: 'output',
            label: '输出处理结果',
            position: { x: 1400, y: 0 },
            config: {
              outputFormat: 'JSON'
            }
          }
        ]
      },
      exampleInput: {
        orderNumber: 'ORD20250208001',
        products: [
          { name: 'iPhone 15 Pro', quantity: 1, price: 7999 }
        ],
        address: '北京市朝阳区xxx街道xxx号',
        contact: '13800138000',
        paymentAmount: 7999
      },
      exampleOutput: {
        orderId: 'ORD20250208001',
        status: '处理成功',
        totalAmount: 7999,
        logisticsNumber: 'SF1234567890',
        estimatedDelivery: '2025-02-10'
      }
    },
    {
      id: 'wf-payments',
      title: '支付风险控制',
      description: '支付回调监控、风控策略执行、异常通知的闭环流程。',
      thumbnail: '💳',
      isPublic: true,
      isTemplate: true,
      isDraft: true,
      category: '财务',
      tags: '风控,支付,监控',
      authorId: author.id,
      config: {
        prompt: '你是一个支付安全专家。请分析支付交易数据，识别潜在风险：\n1. 检查交易金额是否异常\n2. 验证用户行为模式\n3. 评估设备和地理位置风险\n4. 应用风控规则并返回风险评分\n5. 对高风险交易生成预警',
        nodes: []
      }
    },
    {
      id: 'wf-approvals',
      title: '多级审批模板',
      description: '适用于费用、采购等审批场景，可自定义审批层级。',
      thumbnail: '✅',
      isPublic: true,
      isTemplate: true,
      isDraft: false,
      category: '协作',
      tags: '审批,模板,自动提醒',
      authorId: author.id,
      config: {
        prompt: '你是一个智能审批助手。根据审批请求，自动执行多级审批流程：\n1. 解析审批请求的类型和金额\n2. 根据规则确定审批层级\n3. 依次推送给相应审批人\n4. 跟踪审批进度\n5. 汇总审批意见并通知申请人',
        nodes: []
      }
    },
    {
      id: 'wf-notify',
      title: '全渠道通知流程',
      description: '统一触达邮件、短信、站内信的通知流程。',
      thumbnail: '📧',
      isPublic: true,
      isTemplate: true,
      isDraft: false,
      category: '运营',
      tags: '通知,多渠道,消息',
      authorId: author.id,
      config: {
        prompt: '你是一个通知编排专家。根据用户输入，自动分发通知到各个渠道：\n1. 解析通知内容和目标用户\n2. 根据用户偏好选择通知渠道（邮件/短信/站内信）\n3. 格式化不同渠道的消息内容\n4. 批量发送并记录状态\n5. 返回发送结果统计',
        nodes: []
      }
    },
    {
      id: 'wf-activity',
      title: '活动数据回流',
      description: '拉取第三方平台活动数据并写入数据仓库。',
      thumbnail: '📊',
      isPublic: true,
      isTemplate: true,
      isDraft: false,
      category: '数据',
      tags: '数据同步,ETL',
      authorId: author.id,
      config: {
        prompt: '你是一个数据同步专家。自动从第三方平台拉取活动数据：\n1. 连接第三方API获取活动数据\n2. 清洗和标准化数据格式\n3. 验证数据完整性和准确性\n4. 将数据写入数据仓库\n5. 生成同步日志和数据质量报告',
        nodes: []
      }
    },
    {
      id: 'wf-content',
      title: '内容审校流程',
      description: '聚合多种模型进行内容检测与风格校验。',
      thumbnail: '📝',
      isPublic: true,
      isTemplate: true,
      isDraft: false,
      category: '内容',
      tags: '内容审核,模型编排',
      authorId: author.id,
      config: {
        prompt: '你是一个内容审核专家。对用户提交的内容进行多维度审校：\n1. 检测敏感词和违规内容\n2. 分析文本语气和情感倾向\n3. 评估内容质量和可读性\n4. 检查事实准确性\n5. 提供修改建议和风险评级',
        nodes: []
      }
    }
  ]

  console.log(`\n准备插入 ${workflows.length} 个工作流...`)

  for (const workflowData of workflows) {
    try {
      // 检查工作流是否已存在
      const existing = await prisma.workflow.findUnique({
        where: { id: workflowData.id }
      })

      if (existing) {
        console.log(`⚠️  工作流 ${workflowData.id} 已存在，跳过`)
        continue
      }

      // 创建工作流
      const workflow = await prisma.workflow.create({
        data: workflowData
      })

      console.log(`✅ 创建工作流: ${workflow.id} - ${workflow.title}`)
    } catch (error) {
      console.error(`❌ 创建工作流 ${workflowData.id} 失败:`, error)
    }
  }

  console.log('\n🎉 StoragePage 工作流数据创建完成！')
}

main()
  .catch((e) => {
    console.error('❌ 种子数据生成失败:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
