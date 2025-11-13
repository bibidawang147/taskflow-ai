import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { popularWorkPackages } from '../data/popularWorkPackages'
import { WorkPackage } from '../types/workPackage'
import ImportSuccessModal from '../components/ImportSuccessModal'
import '../styles/solution.css'

// 为工作项生成假的工作流ID，用于演示
const generateFakeWorkflowId = (packageId: string, itemId: number) => {
  return `fake-${packageId}-item-${itemId}`
}

export default function SolutionPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [workPackage, setWorkPackage] = useState<WorkPackage | null>(null)
  const [showImportModal, setShowImportModal] = useState(false)

  useEffect(() => {
    // 根据 ID 查找工作包
    const pkg = popularWorkPackages.find((p) => p.id === id)
    if (pkg) {
      setWorkPackage(pkg)
    } else {
      // 如果找不到，跳转回探索页
      navigate('/explore')
    }
  }, [id, navigate])

  if (!workPackage) {
    return (
      <div className="solution-page">
        <div className="solution-loading">加载中...</div>
      </div>
    )
  }

  const difficultyColors: Record<string, string> = {
    简单: '#10b981',
    中等: '#f59e0b',
    高级: '#ef4444'
  }

  const handleImport = () => {
    console.log('🎯 点击了一键导入按钮！', workPackage.name)

    // 生成容器ID和颜色
    const containerId = `container-${Date.now()}`
    const containerColor = workPackage.color || 'rgba(139, 92, 246, 0.15)'

    // 创建容器
    const container = {
      id: containerId,
      type: 'container' as const,
      name: workPackage.name,
      parentId: 'canvas-root',
      position: { x: 50, y: 50 },
      size: {
        width: Math.max(500, workPackage.items.length * 240),
        height: 300
      },
      collapsed: false,
      childrenIds: [] as string[],
      color: containerColor
    }

    // 为每个工作项创建工作流卡片
    const cards = workPackage.items.map((item, index) => {
      const cardId = `workflow-${Date.now()}-${index}`
      container.childrenIds.push(cardId)

      return {
        id: cardId,
        type: 'workflow' as const,
        workflowId: `imported-${item.id}`,
        parentId: containerId,
        position: {
          x: 20 + (index * 240),
          y: 50
        },
        // 工作流定义
        workflowData: {
          id: `imported-${item.id}`,
          name: item.name,
          summary: item.description,
          status: 'draft' as const,
          category: workPackage.category,
          tags: workPackage.tags || [],
          owner: '我',
          updatedAt: new Date().toISOString().split('T')[0],
          model: item.tools[0]?.name || 'GPT-4',
          prompt: `${item.description}\n\n使用工具：${item.tools.map(t => t.name).join('、')}`
        }
      }
    })

    // 保存到 localStorage
    const importData = {
      container,
      cards,
      timestamp: Date.now()
    }
    localStorage.setItem('pendingWorkPackageImport', JSON.stringify(importData))
    console.log('💾 已保存导入数据到 localStorage:', {
      containerName: container.name,
      cardsCount: cards.length,
      dataSize: JSON.stringify(importData).length
    })

    // 显示导入成功弹窗
    setShowImportModal(true)
  }

  return (
    <>
      <ImportSuccessModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        workPackageName={workPackage?.name || ''}
        itemCount={workPackage?.items.length || 0}
      />

      <div className="solution-page">
      {/* 头部区域 */}
      <div className="solution-header solution-header--package">
        <button className="solution-back-button" onClick={() => navigate('/explore')}>
          ← 返回
        </button>

        <button className="solution-import-button-top" onClick={handleImport}>
          一键导入到工作台
        </button>

        <div className="solution-header-content">
          <div className="solution-info">
            <h1 className="solution-title">{workPackage.name}</h1>
            <p className="solution-description">{workPackage.description}</p>

            <div className="solution-meta">
              <span className="solution-author">
                {workPackage.author.avatar || '👤'} {workPackage.author.name}
              </span>
              <span className="solution-category">{workPackage.category}</span>
            </div>
          </div>
        </div>

        <div className="solution-stats">
          <div className="solution-stat">
            <span className="solution-stat-number">{workPackage.stats.downloads.toLocaleString()}</span>
            <span className="solution-stat-label">正在使用</span>
          </div>
          <div className="solution-stat">
            <span className="solution-stat-number">★ {workPackage.stats.rating.toFixed(1)}</span>
            <span className="solution-stat-label">评分</span>
          </div>
          <div className="solution-stat">
            <span className="solution-stat-number">{workPackage.stats.reviews}</span>
            <span className="solution-stat-label">评价</span>
          </div>
          <div className="solution-stat">
            <span className="solution-stat-number">{workPackage.items.length}</span>
            <span className="solution-stat-label">工作项</span>
          </div>
        </div>
      </div>

      {/* 主要内容区域 */}
      <div className="solution-content">
        {/* 工作项列表 */}
        <section className="solution-section">
          <h2 className="solution-section-title">包含的工作流程</h2>
          <div className="solution-items">
            {workPackage.items.map((item) => (
              <div
                key={item.id}
                className="solution-item"
                onClick={() => navigate(`/workflow-intro/${generateFakeWorkflowId(workPackage.id, item.id)}`)}
                style={{ cursor: 'pointer' }}
              >
                <div className="solution-item-header">
                  <span className="solution-item-icon">{item.icon}</span>
                  <h3 className="solution-item-title">{item.name}</h3>
                </div>

                <p className="solution-item-description">{item.description}</p>

                <div className="solution-item-tools">
                  <span className="solution-item-tools-label">使用工具：</span>
                  {item.tools.map((tool) => (
                    <span key={tool.id} className="solution-tool-tag">
                      {tool.icon} {tool.name}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 标签 */}
        {workPackage.tags && workPackage.tags.length > 0 && (
          <section className="solution-section">
            <h2 className="solution-section-title">相关标签</h2>
            <div className="solution-tags">
              {workPackage.tags.map((tag, index) => (
                <span key={index} className="solution-tag">
                  {tag}
                </span>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
    </>
  )
}
