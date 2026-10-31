import Markdown from '../../../shared/components/Markdown'
import type { Msg } from '../types'
import { fmtSize } from '../types'
import StageProgress from './StageProgress'

export default function MessageView({
  m,
  hasFile,
  onCite,
}: {
  m: Msg
  hasFile: boolean
  onCite: (lawId: string, article: string, label: string) => void
}) {
  if (m.role === 'user') {
    return (
      <div className="bubble user">
        {m.attachment && (
          <div className="attach-chip">
            📎 {m.attachment.filename} · {fmtSize(m.attachment.size)}
          </div>
        )}
        <div className="user-text">{m.content}</div>
      </div>
    )
  }

  const stages = m.stages ?? []
  const showProgress = m.streaming && !m.content && stages.length > 0

  return (
    <div className="bubble assistant">
      <div className="assistant-body">
        {showProgress && <StageProgress stages={stages} hasFile={hasFile} />}
        {m.streaming && !showProgress && !m.content && !m.tools?.length && (
          <span className="analyzing-dot" />
        )}
        {m.tools?.map((t) => (
          <details key={t.id} className="tool">
            <summary>
              <span className={`tool-dot ${t.summary ? 'done' : ''}`} />
              {t.name}
              {t.summary ? ` — ${t.summary}` : '…'}
            </summary>
            <pre>{JSON.stringify(t.args, null, 2)}</pre>
          </details>
        ))}
        {m.content && <Markdown text={m.content} onCite={onCite} />}
        {m.streaming && m.content && <span className="cursor" />}
        {m.error && <p className="error">⚠ {m.error}</p>}
      </div>
    </div>
  )
}
