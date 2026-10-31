import { BRAND } from '../../../config/brand'

/**
 * The artwork panel — the always-dark left half of the auth screen.
 *
 * Ported verbatim in structure from
 * `context-docs/mockups/08-responsive-login-register.html` (FR-2.1 … FR-2.10).
 *
 * Two properties of the source artifact are load-bearing and are carried
 * across deliberately:
 *
 *  - The clause paragraphs use a **hanging indent** (`padding-left` plus a
 *    negative `text-indent`), never `display:flex` — flex would shred the
 *    prose into columns and break the inline highlight spans (FR-2.3).
 *  - Each annotation card's width is capped against the space remaining to
 *    the panel's right edge, via `--card-left`. Without that cap the cards
 *    escaped the panel at 901–1000px (the source artifact's D9 defect).
 */

/** The three annotation cards. `left` and `--card-left` must agree (FR-2.10). */
const ANNOTATIONS = [
  {
    top: '16%',
    left: '54%',
    cardLeft: '54%',
    ref: 'Clause 12.1 · Notice',
    statute: 'Civil Code, Art. 132 · e-Gov',
    verdict: 'YELLOW',
    tone: 'yellow',
    text: 'No cure period stated. Review before signing.',
  },
  {
    top: '42%',
    left: '58%',
    cardLeft: '58%',
    ref: 'Clause 12.2 · Termination',
    statute: 'Civil Code, Art. 541 · e-Gov',
    verdict: 'GREEN',
    tone: 'green',
    text: 'Termination after a failed cure is consistent with statute.',
  },
  {
    top: '68%',
    left: '55%',
    cardLeft: '55%',
    ref: 'Clause 13.1 · Governing law',
    statute: 'Civil Code, Art. 1 · e-Gov',
    verdict: 'GREEN',
    tone: 'green',
    text: 'Japanese law applies.',
  },
] as const

export default function AuthArtwork() {
  return (
    <aside className="auth-art" aria-label={`${BRAND.name} product overview`}>
      {/* Decorative layers — hidden from assistive technology (FR-7.8). */}
      <div className="auth-art-glow" aria-hidden="true" />
      <div className="auth-art-rules" aria-hidden="true" />

      {/* FR-2.7 — the top-left brand lockup. This is where the brand now
          lives: the old centred `Brand` card was replaced by the two-panel
          layout, so the `brand` testid moves here with it (FR-8.1). */}
      <div className="auth-art-brand" data-testid="brand">
        <svg
          className="auth-art-brand-mark"
          viewBox="0 0 32 32"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M16 4.5v23M9 8h14M11.5 8 7 17h9L11.5 8Zm9 0L16 17h9L20.5 8Z" />
          <path d="M7 17a4.5 4.5 0 0 0 9 0M16 17a4.5 4.5 0 0 0 9 0" />
          <path d="M11.5 27.5h9" />
        </svg>
        <span className="auth-art-brand-name">{BRAND.name}</span>
      </div>

      <div className="auth-art-stage">
        {/* FR-2.2 … FR-2.4 — the contract page. */}
        <article className="auth-contract" data-testid="auth-contract">
          <div className="auth-scanline" aria-hidden="true" />
          <h2 className="auth-contract-title">Service Agreement</h2>
          <p className="auth-contract-meta">Draft v3 · 14 pages</p>

          <h3>Article 12 — Termination</h3>
          <p className="auth-clause">
            <span className="auth-clause-no">12.1</span> Either party may terminate this Agreement by giving{' '}
            <span className="auth-mark-yellow">thirty (30) days' written notice</span> to the other party.
          </p>
          <p className="auth-clause">
            <span className="auth-clause-no">12.2</span> If a party breaches a material obligation and fails to cure it
            within a reasonable period,{' '}
            <span className="auth-mark-green">the other party may terminate this Agreement immediately</span>.
          </p>

          <h3>Article 13 — Governing Law</h3>
          <p className="auth-clause">
            <span className="auth-clause-no">13.1</span> This Agreement shall be governed by{' '}
            <span className="auth-mark-green">the laws of Japan</span>.
          </p>

          <div className="auth-contract-skeleton" aria-hidden="true">
            <span />
            <span />
            <span />
            <span />
            <span />
          </div>
        </article>

        {/* FR-2.6 — connector lines drawn as an inline SVG overlay above the
            document, with the cards themselves as HTML above that, so the
            analysis text stays real, selectable text. */}
        <svg
          className="auth-art-connectors"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path d="M62 22 L 55 21" />
          <path d="M62 46 L 58 45" />
          <path d="M62 63 L 56 68" />
        </svg>

        {/* FR-2.6 — three annotation cards, each citing a real Civil Code
            article. The verdict chip carries its verdict as text, not colour
            alone (FR-7.9). */}
        <div className="auth-cards">
          {ANNOTATIONS.map((a) => (
            <div
              key={a.ref}
              className={`auth-card ${a.tone}`}
              style={{
                top: a.top,
                left: a.left,
                '--card-left': a.cardLeft,
              } as React.CSSProperties}
              data-testid="auth-annotation-card"
            >
              <p className="auth-card-ref">{a.ref}</p>
              <p className="auth-card-statute">{a.statute}</p>
              <div className="auth-card-body">
                <span className={`auth-card-verdict ${a.tone}`}>{a.verdict}</span>
                <p className="auth-card-text">{a.text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* FR-2.8 — the bottom-left headline and subtext. */}
      <div className="auth-art-copy">
        <h2 className="auth-art-headline">Every clause, checked against the statute.</h2>
        <p className="auth-art-subtext">
          Upload a contract and see each claim tied to the law it came from.
        </p>
      </div>
    </aside>
  )
}
