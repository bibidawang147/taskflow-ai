import React, { useState, useCallback, useEffect } from 'react'

interface ResizableSplitterProps {
  onResize: (leftWidth: number) => void
}

const ResizableSplitter: React.FC<ResizableSplitterProps> = ({ onResize }) => {
  const [isDragging, setIsDragging] = useState(false)

  const handleMouseDown = useCallback(() => {
    setIsDragging(true)
  }, [])

  useEffect(() => {
    if (!isDragging) return

    const handleMouseMove = (e: MouseEvent) => {
      const containerWidth = window.innerWidth
      const leftWidth = (e.clientX / containerWidth) * 100

      // 限制范围在 30%-70%
      if (leftWidth >= 30 && leftWidth <= 70) {
        onResize(leftWidth)
      }
    }

    const handleMouseUp = () => {
      setIsDragging(false)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)

    // 添加 body 样式，防止文本选中
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
  }, [isDragging, onResize])

  return (
    <div
      onMouseDown={handleMouseDown}
      style={{
        width: '4px',
        backgroundColor: isDragging ? '#8b5cf6' : '#e5e7eb',
        cursor: 'col-resize',
        flexShrink: 0,
        position: 'relative',
        transition: isDragging ? 'none' : 'background-color 0.2s',
        zIndex: 10
      }}
      onMouseEnter={(e) => {
        if (!isDragging) {
          e.currentTarget.style.backgroundColor = '#c4b5fd'
        }
      }}
      onMouseLeave={(e) => {
        if (!isDragging) {
          e.currentTarget.style.backgroundColor = '#e5e7eb'
        }
      }}
    >
      {/* 可拖拽区域扩展（视觉上是4px，但交互区域是12px） */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          left: '-4px',
          right: '-4px',
          cursor: 'col-resize'
        }}
      />

      {/* 拖拽提示图标 */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '24px',
          height: '48px',
          backgroundColor: isDragging ? '#8b5cf6' : '#e5e7eb',
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
          transition: isDragging ? 'none' : 'all 0.2s',
          opacity: isDragging ? 1 : 0,
          pointerEvents: 'none'
        }}
      >
        <svg
          width="8"
          height="24"
          viewBox="0 0 8 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle cx="2" cy="6" r="1.5" fill="white" />
          <circle cx="6" cy="6" r="1.5" fill="white" />
          <circle cx="2" cy="12" r="1.5" fill="white" />
          <circle cx="6" cy="12" r="1.5" fill="white" />
          <circle cx="2" cy="18" r="1.5" fill="white" />
          <circle cx="6" cy="18" r="1.5" fill="white" />
        </svg>
      </div>
    </div>
  )
}

export default ResizableSplitter
