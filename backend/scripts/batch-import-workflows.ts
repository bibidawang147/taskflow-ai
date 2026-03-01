/**
 * 工作流批量导入脚本
 *
 * 用法：
 *   cd backend
 *   npx ts-node scripts/batch-import-workflows.ts ./path/to/workflows.json
 *
 * JSON 格式见 README 或直接参考本文件底部的示例。
 */

import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'

const prisma = new PrismaClient()

async function main() {
  const jsonPath = process.argv[2]
  if (!jsonPath) {
    console.error('用法: npx ts-node scripts/batch-import-workflows.ts <json文件路径>')
    process.exit(1)
  }

  const absPath = path.resolve(jsonPath)
  if (!fs.existsSync(absPath)) {
    console.error(`文件不存在: ${absPath}`)
    process.exit(1)
  }

  // 读取并解析 JSON
  const raw = fs.readFileSync(absPath, 'utf-8')
  let workflows: any[]
  try {
    workflows = JSON.parse(raw)
    if (!Array.isArray(workflows)) {
      console.error('JSON 文件必须是数组格式 [...]')
      process.exit(1)
    }
  } catch (e: any) {
    console.error('JSON 解析失败:', e.message)
    process.exit(1)
  }

  console.log(`读取到 ${workflows.length} 个工作流\n`)

  // 查找作者：优先 admin，否则用第一个用户
  let author = await prisma.user.findFirst({
    where: { role: 'admin' },
    select: { id: true, name: true, role: true }
  })
  if (!author) {
    author = await prisma.user.findFirst({
      select: { id: true, name: true, role: true }
    })
  }
  if (!author) {
    console.error('数据库中没有用户，请先注册一个账号')
    process.exit(1)
  }
  console.log(`使用作者: ${author.name} (${author.id}, role=${author.role})\n`)

  const isAdmin = author.role === 'admin'
  let success = 0
  let failed = 0

  for (let i = 0; i < workflows.length; i++) {
    const wf = workflows[i]
    try {
      if (!wf.title) {
        throw new Error('缺少 title 字段')
      }

      const nodes = wf.config?.nodes || []
      const edges = wf.config?.edges || []
      const preparations = wf.preparations || []
      const isPublic = wf.isPublic ?? true
      const isDraft = wf.isDraft ?? false
      const isFeatured = isAdmin && isPublic && !isDraft

      const created = await prisma.workflow.create({
        data: {
          title: wf.title,
          description: wf.description || '',
          category: wf.category || '效率工具',
          tags: typeof wf.tags === 'string' ? wf.tags : (Array.isArray(wf.tags) ? wf.tags.join(',') : null),
          config: { nodes, edges },
          isPublic,
          isDraft,
          isFeatured,
          authorId: author.id,
          ...(wf.difficultyLevel && { difficultyLevel: wf.difficultyLevel }),
          ...(wf.useScenarios && { useScenarios: JSON.stringify(wf.useScenarios) }),
          ...(wf.sourceType && { sourceType: wf.sourceType }),
          ...(wf.sourceUrl && { sourceUrl: wf.sourceUrl }),
          // 创建节点
          nodes: {
            create: nodes.map((node: any) => ({
              id: node.id,
              type: node.type || 'ai',
              label: node.label || '',
              position: node.position || { x: 0, y: 0 },
              config: node.config || {}
            }))
          },
          // 创建前置准备
          ...(preparations.length > 0 && {
            preparations: {
              create: preparations.filter((p: any) => p.name?.trim()).map((p: any, idx: number) => ({
                name: p.name,
                description: p.description || null,
                link: p.link || null,
                order: p.order ?? idx
              }))
            }
          })
        }
      })

      success++
      console.log(`✅ [${i + 1}/${workflows.length}] ${created.title} (${created.id})`)
    } catch (err: any) {
      failed++
      console.error(`❌ [${i + 1}/${workflows.length}] "${wf.title || '无标题'}" — ${err.message}`)
    }
  }

  console.log(`\n完成！成功 ${success} 个，失败 ${failed} 个`)
  await prisma.$disconnect()
}

main().catch(err => {
  console.error('脚本执行失败:', err)
  prisma.$disconnect()
  process.exit(1)
})
