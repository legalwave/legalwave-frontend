import { useEffect, useState } from 'react'
import { fetchArticle } from '../../../shared/api/endpoints'
import type { Article } from '../../../shared/api/types'

export default function CitationModal({
  cite,
  onClose,
}: {
  cite: { lawId: string; article: string; label: string }
  onClose: () => void
}) {
  const [art, setArt] = useState<Article | null>(null)
  const [err, setErr] = useState('')

  useEffect(() => {
    fetchArticle(cite.lawId, cite.article)
      .then(setArt)
      .catch((e) => setErr((e as Error).message))
  }, [cite.lawId, cite.article])

  useEffect(() => {
    const h = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [onClose])

  return (
    <>
      <div className="scrim" onClick={onClose} />
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <header className="modal-head">
          <div className="modal-head-info">
            <div className="modal-meta">
              {art ? `${art.law_title} · Article ${art.article_num}` : cite.label}
            </div>
            <h2 className="modal-title" id="modal-title">
              {art?.article_title || (art ? `Article ${art.article_num}` : 'Loading…')}
            </h2>
          </div>
          <button className="modal-close" aria-label="Close (Esc)" onClick={onClose}>
            ×
          </button>
        </header>
        <div className="modal-body">
          {err && <p className="error">{err === 'Not Found' ? 'Article not found.' : err}</p>}
          {!art && !err && <p className="muted">Fetching from e-Gov…</p>}
          {art && (
            <>
              <p className="modal-section-label">Statute text (Japanese)</p>
              <div className="modal-statute-text">
                {art.paragraphs.map((p, i) => (
                  <p key={i}>{p.num ? `${p.num}　` : ''}{p.text}</p>
                ))}
              </div>
            </>
          )}
        </div>
        <footer className="modal-foot">
          <span className="modal-hint">
            Press <kbd>Esc</kbd> to close
          </span>
          {art?.source_url && (
            <a className="modal-egov" href={art.source_url} target="_blank" rel="noopener noreferrer">
              Open on e-Gov
            </a>
          )}
        </footer>
      </div>
    </>
  )
}
