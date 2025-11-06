import { type CSSProperties, useMemo } from 'react'
import { WorkPackage } from '../types/workPackage'

interface PopularWorkPackageCardProps {
  workPackage: WorkPackage
  onViewDetails: (pkg: WorkPackage) => void
  onImport: (pkg: WorkPackage) => void
}

export default function PopularWorkPackageCard({
  workPackage,
  onViewDetails,
  onImport
}: PopularWorkPackageCardProps) {
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

  return (
    <article
      className="package-card card"
      style={{ ['--package-accent' as const]: workPackage.color } as CSSProperties}
    >
      <header className="package-card__header">
        <h3 className="card-title">{workPackage.name}</h3>
        <div className="package-card__meta">
          <span className="tag tag--light">{workPackage.category}</span>
          <span className="package-card__author-name">{workPackage.author.name}</span>
        </div>
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
        {workPackage.tags.slice(0, 4).map((tag, index) => (
          <span key={index} className="tag tag--brand">
            {tag}
          </span>
        ))}
      </div>

      <div className="package-card__actions">
        <button
          type="button"
          className="secondary-button secondary-button--soft"
          onClick={() => onViewDetails(workPackage)}
        >
          查看详情
        </button>
        <button type="button" className="primary-button primary-button--solid" onClick={() => onImport(workPackage)}>
          一键导入
        </button>
      </div>
    </article>
  )
}
