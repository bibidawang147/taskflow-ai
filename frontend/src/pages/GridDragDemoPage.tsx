import { useState } from 'react'
import GridDragSystem, { GridElement } from '../components/GridDragSystem/GridDragSystem'

export default function GridDragDemoPage() {
  // 初始化卡片和容器
  const [elements, setElements] = useState<GridElement[]>([
    // 容器元素（2x2 大小）
    {
      id: 'container-1',
      type: 'container',
      gridSize: { width: 2, height: 2 },
      gridPosition: { row: 0, col: 0 },
      content: (
        <div style={{
          width: '100%',
          height: '100%',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderRadius: '16px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          padding: '20px',
          boxSizing: 'border-box'
        }}>
          <div style={{ fontSize: '32px', marginBottom: '8px' }}>📦</div>
          <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '4px' }}>容器 1</div>
          <div style={{ fontSize: '12px', opacity: 0.9 }}>2×2 大小</div>
        </div>
      )
    },

    // 卡片元素（1x1 大小）
    {
      id: 'card-1',
      type: 'card',
      gridSize: { width: 1, height: 1 },
      gridPosition: { row: 0, col: 2 },
      content: (
        <div style={{
          width: '100%',
          height: '100%',
          background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
          borderRadius: '12px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          padding: '16px',
          boxSizing: 'border-box'
        }}>
          <div style={{ fontSize: '28px', marginBottom: '6px' }}>📝</div>
          <div style={{ fontSize: '14px', fontWeight: 'bold' }}>卡片 1</div>
        </div>
      )
    },

    {
      id: 'card-2',
      type: 'card',
      gridSize: { width: 1, height: 1 },
      gridPosition: { row: 0, col: 3 },
      content: (
        <div style={{
          width: '100%',
          height: '100%',
          background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
          borderRadius: '12px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          padding: '16px',
          boxSizing: 'border-box'
        }}>
          <div style={{ fontSize: '28px', marginBottom: '6px' }}>🎨</div>
          <div style={{ fontSize: '14px', fontWeight: 'bold' }}>卡片 2</div>
        </div>
      )
    },

    {
      id: 'card-3',
      type: 'card',
      gridSize: { width: 1, height: 1 },
      gridPosition: { row: 1, col: 2 },
      content: (
        <div style={{
          width: '100%',
          height: '100%',
          background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
          borderRadius: '12px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          padding: '16px',
          boxSizing: 'border-box'
        }}>
          <div style={{ fontSize: '28px', marginBottom: '6px' }}>⚡</div>
          <div style={{ fontSize: '14px', fontWeight: 'bold' }}>卡片 3</div>
        </div>
      )
    },

    {
      id: 'card-4',
      type: 'card',
      gridSize: { width: 1, height: 1 },
      gridPosition: { row: 1, col: 3 },
      content: (
        <div style={{
          width: '100%',
          height: '100%',
          background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
          borderRadius: '12px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          padding: '16px',
          boxSizing: 'border-box'
        }}>
          <div style={{ fontSize: '28px', marginBottom: '6px' }}>🚀</div>
          <div style={{ fontSize: '14px', fontWeight: 'bold' }}>卡片 4</div>
        </div>
      )
    },

    // 另一个容器
    {
      id: 'container-2',
      type: 'container',
      gridSize: { width: 2, height: 2 },
      gridPosition: { row: 2, col: 0 },
      content: (
        <div style={{
          width: '100%',
          height: '100%',
          background: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
          borderRadius: '16px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#333',
          padding: '20px',
          boxSizing: 'border-box'
        }}>
          <div style={{ fontSize: '32px', marginBottom: '8px' }}>🎯</div>
          <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '4px' }}>容器 2</div>
          <div style={{ fontSize: '12px', opacity: 0.8 }}>2×2 大小</div>
        </div>
      )
    },

    {
      id: 'card-5',
      type: 'card',
      gridSize: { width: 1, height: 1 },
      gridPosition: { row: 2, col: 2 },
      content: (
        <div style={{
          width: '100%',
          height: '100%',
          background: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
          borderRadius: '12px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#333',
          padding: '16px',
          boxSizing: 'border-box'
        }}>
          <div style={{ fontSize: '28px', marginBottom: '6px' }}>💡</div>
          <div style={{ fontSize: '14px', fontWeight: 'bold' }}>卡片 5</div>
        </div>
      )
    },

    {
      id: 'card-6',
      type: 'card',
      gridSize: { width: 1, height: 1 },
      gridPosition: { row: 2, col: 3 },
      content: (
        <div style={{
          width: '100%',
          height: '100%',
          background: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
          borderRadius: '12px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#333',
          padding: '16px',
          boxSizing: 'border-box'
        }}>
          <div style={{ fontSize: '28px', marginBottom: '6px' }}>🎪</div>
          <div style={{ fontSize: '14px', fontWeight: 'bold' }}>卡片 6</div>
        </div>
      )
    }
  ])

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(to bottom, #f0f4f8 0%, #e2e8f0 100%)',
      padding: '40px 20px'
    }}>
      {/* 标题和说明 */}
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto 40px',
        textAlign: 'center'
      }}>
        <h1 style={{
          fontSize: '36px',
          fontWeight: 'bold',
          color: '#1a202c',
          marginBottom: '16px'
        }}>
          🍎 苹果启动台风格拖拽系统
        </h1>
        <p style={{
          fontSize: '16px',
          color: '#4a5568',
          marginBottom: '8px'
        }}>
          拖动卡片或容器到新位置，其他元素会自动让位
        </p>
        <p style={{
          fontSize: '14px',
          color: '#718096'
        }}>
          💡 提示：卡片是 1×1 大小，容器是 2×2 大小。拖动时会显示紫色虚线（可放置）或红色虚线（不可放置）
        </p>
      </div>

      {/* 网格拖拽系统 */}
      <GridDragSystem
        elements={elements}
        onElementsChange={setElements}
        gridConfig={{
          columns: 6,
          cellWidth: 160,
          cellHeight: 140,
          gap: 20
        }}
        containerStyle={{
          backgroundColor: 'rgba(255, 255, 255, 0.8)',
          borderRadius: '24px',
          padding: '40px',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.1)'
        }}
      />

      {/* 底部说明 */}
      <div style={{
        maxWidth: '1200px',
        margin: '40px auto 0',
        padding: '24px',
        background: 'white',
        borderRadius: '16px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)'
      }}>
        <h3 style={{
          fontSize: '18px',
          fontWeight: 'bold',
          color: '#1a202c',
          marginBottom: '12px'
        }}>
          功能特性
        </h3>
        <ul style={{
          listStyle: 'none',
          padding: 0,
          margin: 0,
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '12px',
          fontSize: '14px',
          color: '#4a5568'
        }}>
          <li>✅ 网格布局自动对齐</li>
          <li>✅ 拖拽时其他元素自动让位</li>
          <li>✅ 平滑动画过渡效果</li>
          <li>✅ 支持不同大小的卡片和容器</li>
          <li>✅ 智能碰撞检测</li>
          <li>✅ 自动寻找最近可用位置</li>
          <li>✅ 拖拽预览和视觉反馈</li>
          <li>✅ 响应式网格系统</li>
        </ul>
      </div>
    </div>
  )
}
