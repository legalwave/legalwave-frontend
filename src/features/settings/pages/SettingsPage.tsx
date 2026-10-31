import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router'
import { useSession } from '../../../app/providers'
import { ROUTES } from '../../../app/routes'
import { BRAND, DISCLAIMER, MCP_KEY_CHANGED_NOTE } from '../../../config/brand'
import { createKey, fetchKeys, revokeKey } from '../../../shared/api/endpoints'
import type { ApiKey } from '../../../shared/api/types'

const ago = (iso: string | null) => {
  if (!iso) return 'never'
  const s = (Date.now() - new Date(iso).getTime()) / 1000
  if (s < 60) return 'just now'
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  return `${Math.floor(s / 86400)}d ago`
}

export default function SettingsPage() {
  const [keys, setKeys] = useState<ApiKey[]>([])
  const [fresh, setFresh] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [err, setErr] = useState('')
  const { user } = useSession()

  const load = useCallback(
    () => fetchKeys().then(setKeys).catch((e) => setErr((e as Error).message)),
    [],
  )
  useEffect(() => {
    load()
  }, [load])

  async function create() {
    setErr('')
    try {
      const r = await createKey()
      setFresh(r.key)
      setCopied(false)
      load()
    } catch (e) {
      setErr((e as Error).message)
    }
  }

  async function revoke(id: string) {
    await revokeKey(id).catch((e) => setErr((e as Error).message))
    load()
  }

  const copy = (t: string) => navigator.clipboard?.writeText(t).then(() => setCopied(true))

  const snippet = JSON.stringify(
    {
      mcpServers: {
        [BRAND.mcpServerKey]: {
          url: BRAND.mcpServerUrl,
          headers: { Authorization: `Bearer ${fresh ?? '<paste-key-here>'}` },
        },
      },
    },
    null,
    2,
  )

  const initials = (user?.name || user?.email || '?').slice(0, 2).toUpperCase()

  return (
    <div className="shell">
      <div className="shell-bg" aria-hidden="true" />
      <aside className="sidebar" aria-label="Settings">
        <div className="sidebar-brand">
          <img className="sidebar-logo" src={BRAND.logoSrc} width={24} height={24} alt="" aria-hidden="true" />
          <span className="sidebar-brand-name">{BRAND.name}</span>
        </div>
        <div className="group-label">Settings</div>
        <div className="chat-item active">
          <div className="chat-title">API key</div>
        </div>
      </aside>
      <main className="main">
        <header className="topbar">
          <div className="muted-sm">Settings · API key</div>
          <div className="avatar">{initials}</div>
        </header>
        <div className="content">
          <Link className="back" to={ROUTES.CHAT}>
            ← Back to chat
          </Link>
          <h1>API key</h1>
          <p className="lede">
            Use this key to connect the analyzer from your MCP client (e.g. Claude Desktop). The key
            authenticates every request and is tied to your account.
          </p>
          {err && <p className="error">{err}</p>}

          <div className="card">
            <h2 className="card-title">Active keys</h2>
            <p className="card-sub">Revoked keys remain visible for 24 hours, then disappear.</p>
            {fresh && (
              <div className="docs">
                <strong>Copy your new key now. It will not be shown again.</strong>
                <pre className="snippet">{fresh}</pre>
                <button className="btn btn-secondary" onClick={() => copy(fresh)}>
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </div>
            )}
            <div className="key-list">
              {keys.length === 0 && (
                <div className="key-row">
                  <span className="key-meta">No keys yet.</span>
                </div>
              )}
              {keys.map((k) => (
                <div key={k.id} className={`key-row ${k.revoked_at ? 'revoked' : ''}`}>
                  <div>
                    <div className="key-mono">{k.prefix}…</div>
                    <div className="key-meta">
                      {k.revoked_at
                        ? `Revoked ${ago(k.revoked_at)}`
                        : `Created ${ago(k.created_at)} · Last used ${ago(k.last_used_at)}`}
                    </div>
                  </div>
                  <button
                    className="btn btn-danger"
                    disabled={!!k.revoked_at}
                    onClick={() => revoke(k.id)}
                  >
                    {k.revoked_at ? 'Revoked' : 'Revoke'}
                  </button>
                </div>
              ))}
            </div>
            <button className="btn btn-primary" onClick={create}>
              + Generate new key
            </button>
          </div>

          <div className="card">
            <h2 className="card-title">Quick start — MCP</h2>
            <p className="card-sub">
              Add this server to your MCP client config (streamable HTTP). Tools:
              analyze_contract_risk, search_japanese_law.
            </p>
            <pre className="snippet" data-testid="mcp-snippet">{snippet}</pre>
            <button
              className="btn btn-secondary"
              onClick={() => navigator.clipboard?.writeText(snippet)}
            >
              Copy snippet
            </button>
            <p className="mcp-note" data-testid="mcp-key-change-note">{MCP_KEY_CHANGED_NOTE}</p>
          </div>
        </div>
        <div className="disclaimer">{DISCLAIMER}</div>
      </main>
    </div>
  )
}
