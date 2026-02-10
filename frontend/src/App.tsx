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
import CommunityPage from './pages/CommunityPage'
import CommunityWorkflowsPage from './pages/CommunityWorkflowsPage'
import CommunityPostsPage from './pages/CommunityPostsPage'
import PostDetailPage from './pages/PostDetailPage'
import NewPostPage from './pages/NewPostPage'
import AIRecommendationTestPage from './pages/AIRecommendationTestPage'
import GridDragDemoPage from './pages/GridDragDemoPage'
import ArticleWorkflowMVPPage from './pages/ArticleWorkflowMVPPage'
import ReverseEngineerPage from './pages/ReverseEngineerPage'
import WorkflowCreatePage from './pages/WorkflowCreatePage'
import ImportFromArticlePage from './pages/ImportFromArticlePage'
import SolutionPage from './pages/SolutionPage'
import WorkflowViewPage from './pages/WorkflowViewPage'
import AdminPromoPage from './pages/AdminPromoPage'
import AdminOrdersPage from './pages/AdminOrdersPage'
import AdminPricingPage from './pages/AdminPricingPage'

function App() {
  return (
    <Routes>
      <Route path="/test" element={<TestPage />} />
      <Route path="/ai-recommendation-test" element={<AIRecommendationTestPage />} />
      <Route path="/grid-drag-demo" element={<GridDragDemoPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/ai-chat" element={<AIChatPage />} />
      <Route path="/" element={<Layout />}>
        <Route index element={<StoragePage />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="home" element={<HomePage />} />
        <Route path="workspace" element={<StoragePage />} />
        <Route path="storage" element={<StoragePage />} />
        <Route path="explore" element={<ExplorePage />} />
        <Route path="explore/theme/:themeId" element={<ExploreThemeDetailPage />} />
        <Route path="solution/:id" element={<SolutionPage />} />
        <Route path="search" element={<SearchResultPage />} />
        <Route path="workflow-intro/:id" element={<WorkflowViewPage />} />
        <Route path="workflow/create" element={<WorkflowCreatePage />} />
        <Route path="workflow/edit/:id" element={<WorkflowCreatePage />} />
        <Route path="workflow/import-from-article" element={<ImportFromArticlePage />} />
        <Route path="workflow/view/:id" element={<WorkflowViewPage />} />
        <Route path="tool/:id" element={<AIToolIntroPage />} />
        <Route path="category/:category" element={<CategoryPage />} />
        <Route path="workflow-type/:type" element={<WorkflowTypePage />} />
        <Route path="recharge" element={<RechargePage />} />
        <Route path="usage-stats" element={<UsageStatsPage />} />
        <Route path="membership" element={<MembershipPage />} />
        <Route path="article-to-workflow" element={<ArticleWorkflowMVPPage />} />
        <Route path="reverse-engineer" element={<ReverseEngineerPage />} />
        <Route path="community" element={<CommunityPage />} />
        <Route path="community/workflows" element={<CommunityWorkflowsPage />} />
        <Route path="community/posts" element={<CommunityPostsPage />} />
        <Route path="community/posts/new" element={<NewPostPage />} />
        <Route path="community/posts/:id" element={<PostDetailPage />} />
        <Route path="admin/promo" element={<AdminPromoPage />} />
        <Route path="admin/orders" element={<AdminOrdersPage />} />
        <Route path="admin/pricing" element={<AdminPricingPage />} />
      </Route>
    </Routes>
  )
}

export default App
