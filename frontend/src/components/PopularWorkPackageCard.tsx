import { type CSSProperties, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { WorkPackage } from '../types/workPackage'
import ImportSuccessModal from './ImportSuccessModal'

interface PopularWorkPackageCardProps {
  workPackage: WorkPackage
}

export default function PopularWorkPackageCard({
  workPackage
}: PopularWorkPackageCardProps) {
  const navigate = useNavigate()
  const [showImportModal, setShowImportModal] = useState(false)

  const compactFormatter = useMemo(
    () => new Intl.NumberFormat('zh-CN', { notation: 'compact', maximumFractionDigits: 1 }),
    []
  )

  const downloads =
    workPackage.stats.downloads >= 1000
      ? compactFormatter.format(workPackage.stats.downloads)
      : workPackage.stats.downloads.toString()

  const paddedDescription = useMemo(() => {
    const targetLength = 48
    if (workPackage.description.length >= targetLength) {
      return workPackage.description
    }

    const filler = ' ·'
    const fillCount = Math.ceil((targetLength - workPackage.description.length) / filler.length)
    return `${workPackage.description}${filler.repeat(fillCount)}`
  }, [workPackage.description])

  const handleCardClick = () => {
    navigate(`/solution/${workPackage.id}`)
  }

  const handleImport = (e: React.MouseEvent) => {
    console.log('🎯 点击了一键导入按钮！', workPackage.name)
    e.stopPropagation()

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
        workPackageName={workPackage.name}
        itemCount={workPackage.items.length}
      />

      <article
        className="package-card card"
        style={{ ['--package-accent' as const]: workPackage.color, cursor: 'pointer' } as CSSProperties}
        onClick={handleCardClick}
      >
      <header className="package-card__header">
        <h3 className="card-title">{workPackage.name}</h3>
        <span className="tag tag--light">{workPackage.category}</span>
      </header>

      <p className="package-card__description">{paddedDescription}</p>

      <div className="stats-row">
        <div className="stat-item">
          <span className="stat-number">{downloads}</span>
          下载量
        </div>
        <div className="stat-item rating">
          <span className="rating-star" aria-hidden>
            ★
          </span>
          <span className="rating-number">{workPackage.stats.rating.toFixed(1)}</span>
        </div>
        <div className="stat-item">
          <span className="stat-number">{workPackage.items.length}</span>
          工作项
        </div>
      </div>

      <div className="package-card__tags">
        {workPackage.items.slice(0, 3).map((item, index) => (
          <span key={index} className="tag tag--brand" title={item.description}>
            {item.name}
          </span>
        ))}
        {workPackage.items.length > 3 && (
          <span className="tag tag--brand">+{workPackage.items.length - 3}</span>
        )}
      </div>

      <div className="package-card__actions">
        <button
          type="button"
          className="secondary-button secondary-button--soft"
          onClick={(e) => {
            e.stopPropagation()
            navigate(`/solution/${workPackage.id}`)
          }}
        >
          查看详情
        </button>
        <button
          type="button"
          className="primary-button primary-button--solid"
          onClick={handleImport}
        >
          一键导入
        </button>
      </div>
    </article>
    </>
  )
}
