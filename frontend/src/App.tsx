import { lazy, Suspense } from 'react'
import { Route, Routes, useLocation } from 'react-router-dom'
import { AnimatePresence, MotionConfig, motion } from 'motion/react'
import { Toaster } from 'sonner'
import { useAuth } from '@/features/auth/AuthProvider'
import { LikeProvider } from '@/features/likes/LikeButton'
import { LoadingRows, PageShell } from '@/features/common/ui'
import { duration, ease, pageVariants } from '@/lib/motion'
import { AppShell } from '@/components/layout/AppShell'
import { ThemeProvider } from '@/features/theme/ThemeProvider'
import { TooltipProvider } from '@/components/ui/tooltip'
import { SearchProvider } from '@/features/search/SearchProvider'
import { SearchDialog } from '@/features/search/SearchDialog'
import HomePage from '@/pages/HomePage'
import SectionsPage from '@/pages/SectionsPage'
import SectionPage from '@/pages/SectionPage'
import QuestionsPage from '@/pages/QuestionsPage'
import ResourcesPage from '@/pages/ResourcesPage'
import ResourcePage from '@/pages/ResourcePage'
import PointsPage from '@/pages/PointsPage'
import LoginPage from '@/pages/LoginPage'
import RegisterPage from '@/pages/RegisterPage'
import NotFoundPage from '@/pages/NotFoundPage'

const ArticlePage = lazy(() => import('@/pages/ArticlePage'))
const ArticleEditorPage = lazy(() => import('@/pages/ArticleEditorPage'))
const QuestionPage = lazy(() => import('@/pages/QuestionPage'))
const AskPage = lazy(() => import('@/pages/AskPage'))
const ProfilePage = lazy(() => import('@/pages/ProfilePage'))
const UserProfilePage = lazy(() => import('@/pages/UserProfilePage'))

export default function App() {
  const location = useLocation()
  const { user } = useAuth()
  return (
    <MotionConfig reducedMotion="user" transition={{ duration: duration.state, ease }}>
      <ThemeProvider>
        <TooltipProvider delayDuration={200}>
          <SearchProvider>
            <LikeProvider key={user?.id ?? 'guest'}>
              <AppShell>
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div key={location.pathname} initial="closed" animate="open" exit="closed" variants={pageVariants}>
                    <Suspense fallback={<PageShell><LoadingRows rows={3} /></PageShell>}>
                      <Routes location={location}>
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
                        <Route path="/u/:username" element={<UserProfilePage />} />
                        <Route path="/me" element={<ProfilePage />} />
                        <Route path="/login" element={<LoginPage />} />
                        <Route path="/register" element={<RegisterPage />} />
                        <Route path="*" element={<NotFoundPage />} />
                      </Routes>
                    </Suspense>
                  </motion.div>
                </AnimatePresence>
              </AppShell>
            </LikeProvider>
            <SearchDialog />
            <Toaster position="bottom-right" closeButton richColors />
          </SearchProvider>
        </TooltipProvider>
      </ThemeProvider>
    </MotionConfig>
  )
}
