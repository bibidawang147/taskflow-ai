import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { AuthProvider } from './contexts/AuthContext'
import { ToastProvider } from './components/ui/Toast'
import { ConfirmProvider } from './components/ui/ConfirmDialog'
import './styles/variables.css'
import './styles/typography.css'
import './styles/buttons.css'
import './styles/cards.css'
import './styles/tags.css'
import './styles/sidebar.css'
import './styles/utilities.css'
import './styles/animations.css'
import './index.css'
import ErrorBoundary from './components/ui/ErrorBoundary'
import { initSentry } from './config/sentry'

// 初始化 Sentry
initSentry()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <ToastProvider>
            <ConfirmProvider>
              <App />
            </ConfirmProvider>
          </ToastProvider>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>,
)