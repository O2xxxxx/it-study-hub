import { Route, Routes, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'motion/react'
import { Toaster } from 'sonner'
import { AppShell } from '@/components/layout/AppShell'
import { ThemeProvider } from '@/features/theme/ThemeProvider'
import { TooltipProvider } from '@/components/ui/tooltip'
import { SearchProvider } from '@/features/search/SearchProvider'
import { SearchDialog } from '@/features/search/SearchDialog'
import HomePage from '@/pages/HomePage'
import SectionsPage from '@/pages/SectionsPage'
import SectionPage from '@/pages/SectionPage'
import ArticlePage from '@/pages/ArticlePage'
import ArticleEditorPage from '@/pages/ArticleEditorPage'
import QuestionsPage from '@/pages/QuestionsPage'
import QuestionPage from '@/pages/QuestionPage'
import AskPage from '@/pages/AskPage'
import ResourcesPage from '@/pages/ResourcesPage'
import ResourcePage from '@/pages/ResourcePage'
import PointsPage from '@/pages/PointsPage'
import ProfilePage from '@/pages/ProfilePage'
import LoginPage from '@/pages/LoginPage'
import RegisterPage from '@/pages/RegisterPage'
import NotFoundPage from '@/pages/NotFoundPage'

export default function App() {
  const location = useLocation()
  return (
    <ThemeProvider>
      <TooltipProvider delayDuration={200}>
        <SearchProvider>
          <AppShell>
            <AnimatePresence mode="wait" initial={false}>
              <Routes location={location} key={location.pathname}>
                <Route path="/" element={<HomePage />} />
                <Route path="/sections" element={<SectionsPage />} />
                <Route path="/s/:code" element={<SectionPage />} />
                <Route path="/articles/new" element={<ArticleEditorPage />} />
                <Route path="/articles/:id/edit" element={<ArticleEditorPage />} />
                <Route path="/articles/:id" element={<ArticlePage />} />
                <Route path="/qa" element={<QuestionsPage />} />
                <Route path="/qa/new" element={<AskPage />} />
                <Route path="/qa/:id" element={<QuestionPage />} />
                <Route path="/resources" element={<ResourcesPage />} />
                <Route path="/resources/:id" element={<ResourcePage />} />
                <Route path="/points" element={<PointsPage />} />
                <Route path="/me" element={<ProfilePage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </AnimatePresence>
          </AppShell>
          <SearchDialog />
          <Toaster position="bottom-right" closeButton richColors />
        </SearchProvider>
      </TooltipProvider>
    </ThemeProvider>
  )
}