import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { getToken, getUser, logout as clearSession, setSession } from '../shared/api/client'
import { login as loginRequest, register as registerRequest } from '../shared/api/endpoints'
import type { User } from '../shared/api/types'

interface SessionContextValue {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, name?: string) => Promise<void>
  signOut: () => void
}

const SessionContext = createContext<SessionContextValue | null>(null)

/**
 * Single source of truth for the authenticated session.
 *
 * Backed by the same `localStorage` helpers the app has always used
 * (`jlca_token` / `jlca_user`), so existing sessions survive the upgrade and
 * the storage contract is unchanged.
 */
export function SessionProvider({ children }: { children: ReactNode }) {
  const [token, setTokenState] = useState<string | null>(() => getToken())
  const [user, setUserState] = useState<User | null>(() => getUser())

  const signIn = useCallback(async (email: string, password: string) => {
    const res = await loginRequest({ email, password })
    setSession(res.access_token, res.user)
    setTokenState(res.access_token)
    setUserState(res.user)
  }, [])

  const signUp = useCallback(async (email: string, password: string, name?: string) => {
    const res = await registerRequest({ email, password, ...(name ? { name } : {}) })
    setSession(res.access_token, res.user)
    setTokenState(res.access_token)
    setUserState(res.user)
  }, [])

  const signOut = useCallback(() => {
    clearSession()
    setTokenState(null)
    setUserState(null)
  }, [])

  const value = useMemo<SessionContextValue>(
    () => ({
      user,
      token,
      isAuthenticated: !!token,
      signIn,
      signUp,
      signOut,
    }),
    [user, token, signIn, signUp, signOut],
  )

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
}

export function useSession(): SessionContextValue {
  const ctx = useContext(SessionContext)
  if (!ctx) throw new Error('useSession must be used within a SessionProvider')
  return ctx
}
