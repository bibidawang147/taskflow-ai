import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import HomePage from './pages/HomePage'
import DashboardPage from './pages/DashboardPage'
import ExplorePage from './pages/ExplorePage'
import ExploreThemeDetailPage from './pages/ExploreThemeDetailPage'
import StoragePage from './pages/StoragePage'
import SearchResultPage from './pages/SearchResultPage'
import WorkflowSharePage from './pages/WorkflowSharePage'
import AIToolIntroPage from './pages/AIToolIntroPage'
import CategoryPage from './pages/CategoryPage'
import WorkflowTypePage from './pages/WorkflowTypePage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import { RechargePage } from './pages/RechargePage'
import { UsageStatsPage } from './pages/UsageStatsPage'
import { MembershipPage } from './pages/MembershipPage'
import { AIChatPage } from './pages/AIChatPage'
import CommunityPage from './pages/CommunityPage'
import CommunityWorkflowsPage from './pages/CommunityWorkflowsPage'
import CommunityPostsPage from './pages/CommunityPostsPage'
import PostDetailPage from './pages/PostDetailPage'
import NewPostPage from './pages/NewPostPage'
import ArticleWorkflowMVPPage from './pages/ArticleWorkflowMVPPage'
import ReverseEngineerPage from './pages/ReverseEngineerPage'
import WorkflowCreatePage from './pages/WorkflowCreatePage'
import ImportFromArticlePage from './pages/ImportFromArticlePage'
import SolutionPage from './pages/SolutionPage'
import WorkflowViewPage from './pages/WorkflowViewPage'
import AdminPromoPage from './pages/AdminPromoPage'
import AdminOrdersPage from './pages/AdminOrdersPage'
import AdminPricingPage from './pages/AdminPricingPage'
import WechatCallbackPage from './pages/WechatCallbackPage'
import WechatBindCallbackPage from './pages/WechatBindCallbackPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import ResetPasswordPage from './pages/ResetPasswordPage'
import RedeemPage from './pages/RedeemPage'
import NotFoundPage from './pages/NotFoundPage'
import ProtectedRoute from './components/ProtectedRoute'
import { lazy, Suspense } from 'react'

const isDev = import.meta.env.DEV
const TestPage = lazy(() => import('./pages/TestPage'))
const AIRecommendationTestPage = lazy(() => import('./pages/AIRecommendationTestPage'))
const GridDragDemoPage = lazy(() => import('./pages/GridDragDemoPage'))

function App() {
  return (
    <Routes>
      {/* Dev-only test routes */}
      {isDev && <Route path="/test" element={<Suspense><TestPage /></Suspense>} />}
      {isDev && <Route path="/ai-recommendation-test" element={<Suspense><AIRecommendationTestPage /></Suspense>} />}
      {isDev && <Route path="/grid-drag-demo" element={<Suspense><GridDragDemoPage /></Suspense>} />}

      <Route path="/login" element={<LoginPage />} />
      <Route path="/auth/wechat/callback" element={<WechatCallbackPage />} />
      <Route path="/auth/wechat/bindback" element={<WechatBindCallbackPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/redeem" element={<RedeemPage />} />
      <Route path="/ai-chat" element={<AIChatPage />} />
      <Route path="/" element={<Layout />}>
        <Route index element={<Navigate to="/workspace" replace />} />
        <Route path="dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
        <Route path="home" element={<HomePage />} />
        <Route path="workspace" element={<ProtectedRoute><StoragePage /></ProtectedRoute>} />
        {/* /storage 重定向到 /workspace 统一入口 */}
        <Route path="storage" element={<Navigate to="/workspace" replace />} />
        {/* 公开页面 */}
        <Route path="explore" element={<ExplorePage />} />
        <Route path="explore/theme/:themeId" element={<ExploreThemeDetailPage />} />
        <Route path="solution/:id" element={<SolutionPage />} />
        <Route path="search" element={<SearchResultPage />} />
        <Route path="workflow-intro/:id" element={<WorkflowViewPage />} />
        <Route path="workflow/view/:id" element={<WorkflowViewPage />} />
        <Route path="tool/:id" element={<AIToolIntroPage />} />
        <Route path="category/:category" element={<CategoryPage />} />
        <Route path="workflow-type/:type" element={<WorkflowTypePage />} />
        <Route path="community" element={<CommunityPage />} />
        <Route path="community/workflows" element={<CommunityWorkflowsPage />} />
        <Route path="community/posts" element={<CommunityPostsPage />} />
        <Route path="community/posts/:id" element={<PostDetailPage />} />
        {/* 需要登录的页面 */}
        <Route path="workflow/create" element={<ProtectedRoute><WorkflowCreatePage /></ProtectedRoute>} />
        <Route path="workflow/edit/:id" element={<ProtectedRoute><WorkflowCreatePage /></ProtectedRoute>} />
        <Route path="workflow/import-from-article" element={<ProtectedRoute><ImportFromArticlePage /></ProtectedRoute>} />
        <Route path="recharge" element={<ProtectedRoute><RechargePage /></ProtectedRoute>} />
        <Route path="usage-stats" element={<ProtectedRoute><UsageStatsPage /></ProtectedRoute>} />
        <Route path="membership" element={<ProtectedRoute><MembershipPage /></ProtectedRoute>} />
        <Route path="article-to-workflow" element={<ProtectedRoute><ArticleWorkflowMVPPage /></ProtectedRoute>} />
        <Route path="reverse-engineer" element={<ProtectedRoute><ReverseEngineerPage /></ProtectedRoute>} />
        <Route path="community/posts/new" element={<ProtectedRoute><NewPostPage /></ProtectedRoute>} />
        {/* 管理员页面 */}
        <Route path="admin/promo" element={<ProtectedRoute><AdminPromoPage /></ProtectedRoute>} />
        <Route path="admin/orders" element={<ProtectedRoute><AdminOrdersPage /></ProtectedRoute>} />
        <Route path="admin/pricing" element={<ProtectedRoute><AdminPricingPage /></ProtectedRoute>} />
        {/* 404 catch-all */}
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}

export default App
