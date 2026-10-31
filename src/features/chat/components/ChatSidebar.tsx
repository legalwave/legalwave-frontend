import { useNavigate } from 'react-router'
import { useSession } from '../../../app/providers'
import { chatPath } from '../../../app/routes'
import { BRAND } from '../../../config/brand'
import type { ChatGroup } from '../hooks/useChats'

export default function ChatSidebar({
  groups,
  query,
  onQueryChange,
  routeId,
  onNewChat,
  onDeleteChat,
  collapsed,
  onToggle,
}: {
  groups: ChatGroup[]
  query: string
  onQueryChange: (q: string) => void
  routeId: string | undefined
  onNewChat: () => void
  onDeleteChat: (id: string) => void
  collapsed: boolean
  onToggle: () => void
}) {
  const nav = useNavigate()
  const { user, signOut } = useSession()
  const initials = (user?.name || user?.email || '?').slice(0, 2).toUpperCase()

  const toggleLabel = collapsed ? 'Expand sidebar' : 'Collapse sidebar'

  return (
    <aside className="sidebar" aria-label="Chat history">
      {/* The expanded panel. It stays mounted at all times so the chat list
          keeps its scroll position and no effect re-runs (FR-1.3, risk R3) —
          but when the sidebar is collapsed it is hidden from assistive
          technology and removed from the tab order, so keyboard and screen
          reader users only encounter the rail. */}
      <div className="sidebar-panel" aria-hidden={collapsed} inert={collapsed ? true : undefined}>
        <div className="sidebar-head">
          <div className="sidebar-brand">
            <img className="sidebar-logo" src={BRAND.logoSrc} width={24} height={24} alt="" aria-hidden="true" />
            <span className="sidebar-brand-name">{BRAND.name}</span>
          </div>
          <button
            className="sidebar-toggle sidebar-toggle-expanded"
            onClick={onToggle}
            aria-expanded={!collapsed}
            aria-label={toggleLabel}
            title={toggleLabel}
            data-testid="sidebar-toggle-button"
          >
            «
          </button>
        </div>
        <button className="new-chat" onClick={onNewChat} data-testid="new-chat-button">
          + New chat
        </button>
        <input
          className="search"
          placeholder="Search chats"
          aria-label="Search chats"
          data-testid="chat-search-input"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
        />
        <div className="groups">
          {groups.map((group) => (
            <div key={group.label}>
              <div className="group-label">{group.label}</div>
              {group.items.map((c) => (
                <div
                  key={c.id}
                  className={`chat-item ${c.id === routeId ? 'active' : ''}`}
                  onClick={() => nav(chatPath(c.id))}
                >
                  <div className="chat-row">
                    <div className="chat-text">
                      <div className="chat-title">{c.title || 'Untitled'}</div>
                      <div className="chat-preview">{c.preview}</div>
                    </div>
                    <button
                      className="chat-del"
                      aria-label="Delete chat"
                      data-testid={`chat-delete-${c.id}`}
                      onClick={(e) => {
                        e.stopPropagation()
                        onDeleteChat(c.id)
                      }}
                    >
                      🗑
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
        <div className="sidebar-footer">
          <div className="user-row">
            <div className="avatar">{initials}</div>
            <div className="user-name">{user?.name || user?.email}</div>
            <button className="link-btn" onClick={signOut} data-testid="sign-out-button">
              Sign out
            </button>
          </div>
        </div>
      </div>

      {/* Collapsed rail — always mounted; CSS controls its visibility so the
          full panel above is never unmounted and the chat list keeps its
          scroll position (FR-1.3, risk R3).

          The rail carries its own expand toggle. The toggle inside the
          expanded panel fades out when collapsed, so without this one the
          sidebar could be collapsed but never reopened.

          The rail deliberately shows no per-chat shortcuts: a stack of
          identical chat-bubble icons gives no way to tell the chats apart,
          so the rail carries only the controls that stay meaningful at
          56px (expand, brand, new chat). The chat list is reached by
          expanding the sidebar. */}
      <div className="sidebar-rail" aria-hidden={!collapsed}>
        <button
          className="sidebar-toggle sidebar-toggle-collapsed"
          onClick={onToggle}
          aria-expanded={!collapsed}
          aria-label={toggleLabel}
          title={toggleLabel}
          data-testid="sidebar-toggle-button"
        >
          »
        </button>
        <img className="rail-logo" src={BRAND.logoSrc} width={24} height={24} alt="" aria-hidden="true" />
        <button
          className="rail-new-chat"
          onClick={onNewChat}
          aria-label="New chat"
          title="New chat"
          data-testid="rail-new-chat-button"
        >
          +
        </button>
      </div>
    </aside>
  )
}
