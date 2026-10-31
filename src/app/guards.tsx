import { Navigate } from 'react-router'
import type { ReactElement } from 'react'
import { useSession } from './providers'
import { ROUTES } from './routes'

/**
 * Wraps protected routes. Unauthenticated users are sent to the sign-in page.
 */
export function RequireAuth({ children }: { children: ReactElement }) {
  const { isAuthenticated } = useSession()
  return isAuthenticated ? children : <Navigate to={ROUTES.LOGIN} replace />
}

/**
 * Wraps the authentication routes. A user who is already signed in is sent to
 * the chat workspace instead of being shown a form they do not need.
 */
export function RedirectIfAuthenticated({ children }: { children: ReactElement }) {
  const { isAuthenticated } = useSession()
  return isAuthenticated ? <Navigate to={ROUTES.CHAT} replace /> : children
}
