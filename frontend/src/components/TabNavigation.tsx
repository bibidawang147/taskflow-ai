import { useState } from 'react'

interface Tab {
  id: string
  label: string
  icon?: string
}

interface TabNavigationProps {
  tabs: Tab[]
  defaultTab?: string
  onChange?: (tabId: string) => void
}

export const TabNavigation: React.FC<TabNavigationProps> = ({
  tabs,
  defaultTab,
  onChange
}) => {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id || '')

  const handleTabClick = (tabId: string) => {
    setActiveTab(tabId)
    onChange?.(tabId)
  }

  return (
    <div
      style={{
        display: 'flex',
        gap: '0.5rem',
        padding: '1rem 1.5rem',
        borderBottom: '1px solid #e5e7eb',
        backgroundColor: 'white'
      }}
    >
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => handleTabClick(tab.id)}
          style={{
            padding: '0.75rem 1.5rem',
            fontSize: '15px',
            fontWeight: activeTab === tab.id ? 600 : 400,
            color: activeTab === tab.id ? '#3b82f6' : '#6b7280',
            backgroundColor: activeTab === tab.id ? '#eff6ff' : 'transparent',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
          onMouseEnter={(e) => {
            if (activeTab !== tab.id) {
              e.currentTarget.style.backgroundColor = '#f3f4f6'
            }
          }}
          onMouseLeave={(e) => {
            if (activeTab !== tab.id) {
              e.currentTarget.style.backgroundColor = 'transparent'
            }
          }}
        >
          {tab.icon && <span>{tab.icon}</span>}
          <span>{tab.label}</span>
        </button>
      ))}
    </div>
  )
}
