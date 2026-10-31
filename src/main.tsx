import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import App from './App'
import { SessionProvider } from './app/providers'
import './styles/tokens.css'
import './styles/global.css'
import './features/auth/styles/auth.css'
import './features/chat/styles/chat.css'
import './features/citations/styles/citation.css'
import './features/settings/styles/settings.css'
import './shared/components/markdown.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <SessionProvider>
        <App />
      </SessionProvider>
    </BrowserRouter>
  </StrictMode>,
)
