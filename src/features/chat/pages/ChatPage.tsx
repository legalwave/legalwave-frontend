import { useCallback, useRef, useState } from 'react'
import { Link, useMatch, useNavigate } from 'react-router'
import { useSession } from '../../../app/providers'
import { chatPath, ROUTES } from '../../../app/routes'
import { BRAND, DISCLAIMER } from '../../../config/brand'
import CitationModal from '../../citations/components/CitationModal'
import ChatSidebar from '../components/ChatSidebar'
import ChatThread from '../components/ChatThread'
import Composer, { type ComposerHandle } from '../components/Composer'
import { useChats } from '../hooks/useChats'
import { useChatStream } from '../hooks/useChatStream'
import { useSidebarCollapse } from '../hooks/useSidebarCollapse'

export default function ChatPage() {
  const nav = useNavigate()
  const match = useMatch('/c/:id')
  const routeId = match?.params.id
  const { user } = useSession()
  const initials = (user?.name || user?.email || '?').slice(0, 2).toUpperCase()

  const { query, setQuery, groups, refreshChats, removeChat } = useChats()
  const { collapsed, drawerOpen, narrow, toggle, setDrawerOpen } = useSidebarCollapse()

  // The collapsed rail only applies at desktop widths. Below 768px the sidebar
  // is an overlay drawer and the full panel is always shown (FR-6.4).
  const railActive = collapsed && !narrow
  const [cite, setCite] = useState<{ lawId: string; article: string; label: string } | null>(null)
  const composerRef = useRef<ComposerHandle>(null)

  const onChatCreated = useCallback(
    (id: string) => nav(chatPath(id), { replace: true }),
    [nav],
  )

  const {
    messages,
    setMessages,
    title,
    setTitle,
    busy,
    loadErr,
    send,
    stop,
    reset,
    stick,
  } = useChatStream(routeId, onChatCreated)

  const empty = messages.length === 0 && !routeId

  const newChat = () => {
    reset()
    setMessages([])
    setTitle('')
    nav(ROUTES.CHAT)
  }

  const del = async (id: string) => {
    if (!confirm('Delete this chat?')) return
    await removeChat(id)
    if (id === routeId) nav(ROUTES.CHAT)
    refreshChats()
  }

  const onExample = (example: string) => {
    // Seed the composer with the example prompt rather than sending it.
    composerRef.current?.prefill(`${example}: `)
  }

  return (
    <div
      className={`shell${railActive ? ' sidebar-collapsed' : ''}${drawerOpen ? ' drawer-open' : ''}`}
    >
      <div className="shell-bg" aria-hidden="true" />
      <ChatSidebar
        groups={groups}
        query={query}
        onQueryChange={setQuery}
        routeId={routeId}
        onNewChat={newChat}
        onDeleteChat={del}
        collapsed={railActive}
        onToggle={toggle}
      />
      <main className="main">
        <header className="topbar">
          <div className={title ? 'muted-sm' : 'model-pill'}>
            {title || `${BRAND.name} · e-Gov`}
          </div>
          <div className="topbar-actions">
            <Link className="icon-btn" aria-label="Settings" to={ROUTES.SETTINGS_API_KEY}>
              ⚙
            </Link>
            <div className="avatar">{initials}</div>
          </div>
        </header>

        <ChatThread
          messages={messages}
          loadErr={loadErr}
          empty={empty}
          stick={stick}
          onExample={onExample}
          onCite={(lawId, article, label) => setCite({ lawId, article, label })}
        />

        <Composer ref={composerRef} busy={busy} empty={empty} onSend={send} onStop={stop} />
        <div className="disclaimer">{DISCLAIMER}</div>
      </main>
      <div
        className={`sidebar-scrim${drawerOpen ? ' visible' : ''}`}
        aria-hidden="true"
        onClick={() => setDrawerOpen(false)}
      />
      {cite && <CitationModal cite={cite} onClose={() => setCite(null)} />}
    </div>
  )
}
