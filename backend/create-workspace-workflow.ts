import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function createWorkspaceWorkflow() {
  try {
    // 获取刚才创建的测试用户
    const user = await prisma.user.findUnique({
      where: { email: 'test@test.com' }
    })

    if (!user) {
      console.error('❌ 未找到测试用户')
      return
    }

    console.log('👤 找到用户:', user.email, '(ID:', user.id, ')')

    // 创建一个示例工作流
    const workflow = await prisma.workflow.create({
      data: {
        title: '我的第一个工作流',
        description: '这是一个简单的示例工作流，可以帮助你快速开始。',
        category: '个人',
        tags: '示例,测试,入门',
        isPublic: false,
        isTemplate: false,
        isDraft: false,
        authorId: user.id,
        config: {
          prompt: '你是一个智能助手，帮助用户处理各种任务。',
          nodes: [
            {
              id: 'node-1',
              type: 'input',
              label: '输入',
              position: { x: 100, y: 100 },
              config: {
                description: '请输入你的需求',
                placeholder: '例如：帮我写一封邮件'
              }
            },
            {
              id: 'node-2',
              type: 'llm',
              label: 'AI处理',
              position: { x: 300, y: 100 },
              config: {
                model: 'GPT-4',
                systemPrompt: '你是一个专业的助手，请根据用户需求提供帮助。',
                temperature: 0.7
              }
            },
            {
              id: 'node-3',
              type: 'output',
              label: '输出',
              position: { x: 500, y: 100 },
              config: {
                outputFormat: 'text'
              }
            }
          ]
        }
      }
    })

    console.log('\n✅ 工作流创建成功！')
    console.log('=' .repeat(60))
    console.log('📋 工作流ID:', workflow.id)
    console.log('📝 标题:', workflow.title)
    console.log('📄 描述:', workflow.description)
    console.log('🏷️  分类:', workflow.category)
    console.log('👤 创建者:', user.email)
    console.log('=' .repeat(60))

    // 创建WorkspaceLayout，将工作流添加到工作面板
    const workspaceLayout = await prisma.workspaceLayout.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        layout: {
          jobRoles: [
            {
              id: 1,
              name: '我的工作',
              color: '#8b5cf6',
              workItems: [
                {
                  id: 1,
                  name: '开始使用',
                  tools: [
                    {
                      id: 1,
                      name: workflow.title,
                      workflowId: workflow.id,
                      type: 'workflow'
                    }
                  ]
                }
              ]
            }
          ]
        }
      },
      update: {
        layout: {
          jobRoles: [
            {
              id: 1,
              name: '我的工作',
              color: '#8b5cf6',
              workItems: [
                {
                  id: 1,
                  name: '开始使用',
                  tools: [
                    {
                      id: 1,
                      name: workflow.title,
                      workflowId: workflow.id,
                      type: 'workflow'
                    }
                  ]
                }
              ]
            }
          ]
        }
      }
    })

    console.log('\n✅ 工作面板布局已创建/更新！')
    console.log('🎯 工作流已添加到"我的工作"看板')
    console.log('\n现在可以登录账号，在工作面板中看到这个工作流了！')

  } catch (error) {
    console.error('❌ 创建失败:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createWorkspaceWorkflow()
