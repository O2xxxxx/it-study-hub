import { Navigate } from 'react-router-dom'
import { useAuth } from '@/features/auth/AuthProvider'
import { LoadingRows, PageShell } from '@/features/common/ui'
import { UserProfile } from './UserProfilePage'

export default function ProfilePage() {
  const { user, loading } = useAuth()
  if (loading) return <PageShell><LoadingRows rows={3} /></PageShell>
  if (!user) return <Navigate to="/login?redirect=%2Fme" replace />
  return <UserProfile key={user.username} username={user.username} ownRoute />
}
