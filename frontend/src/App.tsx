import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import HomePage from './pages/HomePage'
import DashboardPage from './pages/DashboardPage'
import ExplorePage from './pages/ExplorePage'
import ExploreThemeDetailPage from './pages/ExploreThemeDetailPage'
import WorkspacePage from './pages/WorkspacePage'
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
import TestPage from './pages/TestPage'
import GridDragDemoPage from './pages/GridDragDemoPage'
import ArticleWorkflowMVPPage from './pages/ArticleWorkflowMVPPage'
import ReverseEngineerPage from './pages/ReverseEngineerPage'
import WorkflowCreatePage from './pages/WorkflowCreatePage'
import ImportFromArticlePage from './pages/ImportFromArticlePage'

function App() {
  return (
    <Routes>
      <Route path="/test" element={<TestPage />} />
      <Route path="/grid-drag-demo" element={<GridDragDemoPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/" element={<Layout />}>
        <Route index element={<AIChatPage />} />
        <Route path="ai-chat" element={<AIChatPage />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="home" element={<HomePage />} />
        <Route path="workspace" element={<AIChatPage />} />
        <Route path="storage" element={<StoragePage />} />
        <Route path="explore" element={<ExplorePage />} />
        <Route path="explore/theme/:themeId" element={<ExploreThemeDetailPage />} />
        <Route path="search" element={<SearchResultPage />} />
        <Route path="workflow-intro/:id" element={<WorkflowSharePage />} />
        <Route path="workflow/create" element={<WorkflowCreatePage />} />
        <Route path="workflow/edit/:id" element={<WorkflowCreatePage />} />
        <Route path="workflow/import-from-article" element={<ImportFromArticlePage />} />
        <Route path="tool/:id" element={<AIToolIntroPage />} />
        <Route path="category/:category" element={<CategoryPage />} />
        <Route path="workflow-type/:type" element={<WorkflowTypePage />} />
        <Route path="recharge" element={<RechargePage />} />
        <Route path="usage-stats" element={<UsageStatsPage />} />
        <Route path="membership" element={<MembershipPage />} />
        <Route path="article-to-workflow" element={<ArticleWorkflowMVPPage />} />
        <Route path="reverse-engineer" element={<ReverseEngineerPage />} />
      </Route>
    </Routes>
  )
}

export default App
