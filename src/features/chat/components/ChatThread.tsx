import { useEffect, useRef } from 'react'
import type { Msg } from '../types'
import { EXAMPLES } from '../types'
import MessageView from './MessageView'

export default function ChatThread({
  messages,
  loadErr,
  empty,
  stick,
  onExample,
  onCite,
}: {
  messages: Msg[]
  loadErr: string
  empty: boolean
  stick: { current: boolean }
  onExample: (example: string) => void
  onCite: (lawId: string, article: string, label: string) => void
}) {
  const threadRef = useRef<HTMLElement>(null)

  // Auto-scroll to the bottom while the user is pinned to it.
  useEffect(() => {
    const el = threadRef.current
    if (el && stick.current) el.scrollTop = el.scrollHeight
  }, [messages, stick])

  const onScroll = () => {
    const el = threadRef.current!
    stick.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80
  }

  const hasFile = !!messages.find((x) => x.role === 'user' && x.attachment)

  return (
    <section className="thread" ref={threadRef} onScroll={onScroll} data-testid="chat-thread">
      <div className="thread-inner">
        {loadErr && <p className="error">{loadErr}</p>}
        {empty && (
          <div className="empty">
            <h1 className="greeting">Paste a clause or upload a contract.</h1>
            <p className="subgreet">
              I'll cite the relevant Japanese statutes. Every claim is grounded in retrieved law.
            </p>
            <div className="examples">
              {EXAMPLES.map((x) => (
                <button key={x} className="chip" onClick={() => onExample(x)}>
                  {x}
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map((m) => (
          <MessageView key={m.id} m={m} hasFile={hasFile} onCite={onCite} />
        ))}
      </div>
    </section>
  )
}
