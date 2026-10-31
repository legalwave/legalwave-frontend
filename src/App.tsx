import { Route, Routes } from 'react-router'
import { RedirectIfAuthenticated, RequireAuth } from './app/guards'
import { ROUTES } from './app/routes'
import LoginPage from './features/auth/pages/LoginPage'
import RegisterPage from './features/auth/pages/RegisterPage'
import ChatPage from './features/chat/pages/ChatPage'
import SettingsPage from './features/settings/pages/SettingsPage'

export default function App() {
  return (
    <Routes>
      <Route
        path={ROUTES.LOGIN}
        element={
          <RedirectIfAuthenticated>
            <LoginPage />
          </RedirectIfAuthenticated>
        }
      />
      <Route
        path={ROUTES.REGISTER}
        element={
          <RedirectIfAuthenticated>
            <RegisterPage />
          </RedirectIfAuthenticated>
        }
      />
      <Route
        path={ROUTES.SETTINGS_API_KEY}
        element={
          <RequireAuth>
            <SettingsPage />
          </RequireAuth>
        }
      />
      {/* Chat workspace handles both `/` and `/c/:id`. */}
      <Route
        path="*"
        element={
          <RequireAuth>
            <ChatPage />
          </RequireAuth>
        }
      />
    </Routes>
  )
}
