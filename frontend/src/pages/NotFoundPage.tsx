import { useNavigate } from 'react-router-dom'

export default function NotFoundPage() {
  const navigate = useNavigate()

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '60vh',
      padding: '2rem',
      textAlign: 'center',
    }}>
      <div style={{ fontSize: '72px', fontWeight: 700, color: '#E5E7EB', lineHeight: 1 }}>
        404
      </div>
      <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#374151', marginTop: '16px' }}>
        页面不存在
      </h2>
      <p style={{ fontSize: '14px', color: '#9CA3AF', marginTop: '8px', maxWidth: '360px' }}>
        你访问的页面可能已被移除或地址有误
      </p>
      <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            padding: '8px 20px',
            border: '1px solid #E5E7EB',
            borderRadius: '8px',
            background: 'white',
            color: '#374151',
            fontSize: '14px',
            fontWeight: 500,
            cursor: 'pointer',
          }}
        >
          返回上一页
        </button>
        <button
          onClick={() => navigate('/workspace')}
          style={{
            padding: '8px 20px',
            border: 'none',
            borderRadius: '8px',
            background: '#8b5cf6',
            color: 'white',
            fontSize: '14px',
            fontWeight: 500,
            cursor: 'pointer',
          }}
        >
          回到工作台
        </button>
      </div>
    </div>
  )
}
