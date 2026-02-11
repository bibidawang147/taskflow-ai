import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { AuthProvider } from './contexts/AuthContext'
import './styles/variables.css'
import './styles/typography.css'
import './styles/buttons.css'
import './styles/cards.css'
import './styles/tags.css'
import './styles/sidebar.css'
import './styles/utilities.css'
import './styles/animations.css'
import './index.css'
import { initSentry } from './config/sentry'

// 初始化 Sentry
initSentry()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
)