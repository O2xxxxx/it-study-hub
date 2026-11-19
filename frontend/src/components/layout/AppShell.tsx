import type { ReactNode } from 'react'
import { AppHeader } from '@/components/layout/AppHeader'
import { Footer } from '@/components/layout/Footer'
import { MobileBottomNav } from '@/components/layout/MobileBottomNav'

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-[100svh] flex-col bg-background">
      <a href="#main-content" className="skip-link">
        跳到主要内容
      </a>

      <AppHeader />

      <main id="main-content" tabIndex={-1} className="flex-1 outline-none">
        {children}
      </main>

      <Footer />
      <MobileBottomNav />
    </div>
  )
}

export default AppShell
