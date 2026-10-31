import { forwardRef, useEffect, useImperativeHandle, useRef, useState, type KeyboardEvent } from 'react'
import { fmtSize } from '../types'

export interface ComposerHandle {
  /** Seed the input box with a prompt and focus it. */
  prefill: (text: string) => void
}

const Composer = forwardRef<ComposerHandle, {
  busy: boolean
  empty: boolean
  onSend: (text: string, file: File | null) => void
  onStop: () => void
}>(function Composer({ busy, empty, onSend, onStop }, ref) {
  const [input, setInput] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const fileInput = useRef<HTMLInputElement>(null)
  const taRef = useRef<HTMLTextAreaElement>(null)

  useImperativeHandle(ref, () => ({
    prefill(text: string) {
      setInput(text)
      taRef.current?.focus()
    },
  }))

  // Auto-grow the textarea up to a cap.
  useEffect(() => {
    const ta = taRef.current
    if (ta) {
      ta.style.height = 'auto'
      ta.style.height = `${Math.min(ta.scrollHeight, 240)}px`
    }
  }, [input])

  const onKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault()
      submit()
    }
  }

  const submit = () => {
    const text = input
    setInput('')
    setFile(null)
    onSend(text, file)
  }

  return (
    <div className="composer-wrap">
      <div className="composer">
        {file && (
          <div className="attach-chip">
            📎 {file.name} · {fmtSize(file.size)}
            <button className="x" aria-label="Remove file" onClick={() => setFile(null)}>
              ×
            </button>
          </div>
        )}
        <textarea
          ref={taRef}
          rows={1}
          value={input}
          disabled={busy}
          data-testid="composer-input"
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKey}
          placeholder={
            empty
              ? 'Paste a clause, ask a legal question, or attach a file (PDF, TXT)…'
              : 'Ask a follow-up…'
          }
        />
        <div className="composer-actions">
          <div>
            <input
              ref={fileInput}
              type="file"
              accept=".txt,.pdf"
              hidden
              onChange={(e) => {
                setFile(e.target.files?.[0] ?? null)
                e.target.value = ''
              }}
            />
            <button
              className="attach"
              disabled={busy}
              data-testid="composer-attach-button"
              onClick={() => fileInput.current?.click()}
            >
              ＋ Attach file
            </button>
          </div>
          {busy ? (
            <div className="act-right">
              <span className="analyzing-label">
                <span className="analyzing-dot" />
                Analyzing…
              </span>
              <button className="send-btn stop" data-testid="composer-stop-button" onClick={onStop}>
                ■ Stop
              </button>
            </div>
          ) : (
            <button
              className="send-btn"
              disabled={!input.trim()}
              data-testid="composer-send-button"
              onClick={submit}
            >
              Send
            </button>
          )}
        </div>
      </div>
      <div className="kbd-hint">Enter to send · Shift+Enter for newline</div>
    </div>
  )
})

export default Composer
