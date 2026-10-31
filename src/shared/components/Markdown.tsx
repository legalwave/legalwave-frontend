import { Children, isValidElement, memo, type ReactNode } from 'react'
import ReactMarkdown, { type Components } from 'react-markdown'
import remarkGfm from 'remark-gfm'

const SEV = {
  RED: { cls: 'noncompliant', label: 'Noncompliant' },
  YELLOW: { cls: 'risky', label: 'Risky' },
  GREEN: { cls: 'compliant', label: 'Compliant' },
} as const
type Sev = keyof typeof SEV

function textOf(node: ReactNode): string {
  return Children.toArray(node)
    .map((c) => (typeof c === 'string' || typeof c === 'number' ? String(c) : isValidElement(c) ? textOf((c.props as { children?: ReactNode }).children) : ''))
    .join('')
}

function Badge({ sev }: { sev: Sev }) {
  return <span className={`severity ${SEV[sev].cls}`}>{SEV[sev].label}</span>
}

export function parseCite(href: string) {
  const m = /^cite:\/\/([^/]+)\/(.+)$/.exec(href)
  return m ? { lawId: m[1], article: decodeURIComponent(m[2]) } : null
}

function build(onCite: (lawId: string, article: string, label: string) => void): Components {
  return {
    h3({ children }) {
      const t = textOf(children).trim()
      const m = /^(RED|YELLOW|GREEN)\b\s*[·\-–—:]?\s*(.*)$/i.exec(t)
      if (m) {
        return (
          <h3 className="clause-h">
            <Badge sev={m[1].toUpperCase() as Sev} />
            <span>{m[2]}</span>
          </h3>
        )
      }
      return <h3>{children}</h3>
    },
    strong({ children }) {
      const m = /^Overall:\s*(RED|YELLOW|GREEN)\b/i.exec(textOf(children).trim())
      if (m) {
        return (
          <strong className="overall">
            Overall: <Badge sev={m[1].toUpperCase() as Sev} />
          </strong>
        )
      }
      return <strong>{children}</strong>
    },
    blockquote({ children }) {
      return <blockquote className="clause-quote">{children}</blockquote>
    },
    a({ href, children }) {
      const c = href ? parseCite(href) : null
      if (c) {
        return (
          <button type="button" className="citation-pill" onClick={() => onCite(c.lawId, c.article, textOf(children))}>
            {children}
          </button>
        )
      }
      return <a href={href} target="_blank" rel="noopener noreferrer">{children}</a>
    },
  }
}

function Markdown({ text, onCite }: { text: string; onCite: (lawId: string, article: string, label: string) => void }) {
  return (
    <div className="md">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={build(onCite)} urlTransform={(u) => u}>
        {text}
      </ReactMarkdown>
    </div>
  )
}
export default memo(Markdown)
