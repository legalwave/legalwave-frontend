import { useCallback, useEffect, useLayoutEffect, useRef } from 'react'
import type { AuthMode } from '../hooks/useAuthValidation'

/**
 * The authentication mode tablist.
 *
 * Implements the WAI-ARIA APG tablist pattern (FR-3.2, FR-3.3):
 *  - `role="tablist"` with two `role="tab"` buttons
 *  - `aria-selected` reflecting the active tab
 *  - a **roving `tabindex`** — the selected tab is `0`, the other is `-1`, so
 *    the tab set occupies a single tab stop
 *  - ArrowRight/ArrowDown → next, ArrowLeft/ArrowUp → previous, Home → first,
 *    End → last, wrapping at both ends
 *  - `aria-controls` linking each tab to its panel
 *
 * The tabs are a **navigation control over the two auth routes**, not a
 * local-only state toggle (FR-5.3, decision D2): selecting a tab navigates to
 * `/login` or `/register`, and the route determines which tab is active.
 *
 * The sliding amber underline is positioned from the active tab's measured
 * `offsetWidth` / `offsetLeft`, recomputed on mount, on resize, and once the
 * web fonts have loaded (FR-3.1).
 */

const TABS: { mode: AuthMode; id: string; label: string; controls: string; testid: string }[] = [
  { mode: 'signin', id: 'tab-signin', label: 'Sign in', controls: 'panel-signin', testid: 'auth-tab-signin' },
  {
    mode: 'register',
    id: 'tab-register',
    label: 'Create account',
    controls: 'panel-register',
    testid: 'auth-tab-register',
  },
]

/**
 * The mode whose tab should receive focus once the tab set has mounted.
 *
 * This lives at module scope, NOT in a component ref, because selecting a tab
 * NAVIGATES (D2): React Router unmounts `LoginPage` and mounts
 * `RegisterPage`, so `AuthTabs` is unmounted and remounted. A component ref
 * would be destroyed by the unmount and the focus intent would be lost, which
 * would leave focus on `<body>` after every arrow-key tab change — a direct
 * violation of the APG pattern (FR-3.3), under which focus MUST follow the
 * selection.
 *
 * Module scope is the right lifetime: it survives the route swap but is
 * discarded when the page is left entirely.
 */
let pendingFocusMode: AuthMode | null = null

export default function AuthTabs({
  mode,
  onSelect,
}: {
  mode: AuthMode
  onSelect: (mode: AuthMode) => void
}) {
  const underlineRef = useRef<HTMLSpanElement | null>(null)
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({})

  const moveUnderline = useCallback(() => {
    const underline = underlineRef.current
    const active = tabRefs.current[mode]
    if (!underline || !active) return
    underline.style.width = `${active.offsetWidth}px`
    underline.style.transform = `translateX(${active.offsetLeft}px)`
  }, [mode])

  // Position once the layout is settled, and again when the viewport changes
  // (NFR-2.5 — percentage-based widths must be re-resolved, not cached).
  useLayoutEffect(() => {
    moveUnderline()
  }, [moveUnderline])

  // FR-3.3 — the APG pattern moves focus to the newly selected tab. Because
  // the selection navigates, the focus call happens on MOUNT of the newly
  // routed tab set rather than in the keydown handler — focusing the
  // pre-navigation node would focus an element that is about to be unmounted,
  // and focus would be lost to <body>.
  useEffect(() => {
    if (!pendingFocusMode) return
    const pending = pendingFocusMode
    pendingFocusMode = null
    tabRefs.current[pending]?.focus()
  }, [])

  useEffect(() => {
    const onResize = () => moveUnderline()
    window.addEventListener('resize', onResize)
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => moveUnderline()).catch(() => {
        /* font loading failed — the fallback stack is already applied */
      })
    }
    return () => window.removeEventListener('resize', onResize)
  }, [moveUnderline])

  function onKeyDown(event: React.KeyboardEvent<HTMLButtonElement>) {
    const order: AuthMode[] = ['signin', 'register']
    const current = order.indexOf(mode)
    let next: number | null = null

    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      next = (current + 1) % order.length
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      next = (current - 1 + order.length) % order.length
    } else if (event.key === 'Home') {
      next = 0
    } else if (event.key === 'End') {
      next = order.length - 1
    }

    if (next === null) return
    event.preventDefault()
    // Move focus with the selection — the APG pattern moves focus on arrow.
    // The intent is recorded at module scope and applied by the mount effect
    // above, once the navigation has swapped in the new tab set.
    pendingFocusMode = order[next]
    onSelect(order[next])
  }

  return (
    <div className="auth-tabs" role="tablist" aria-label="Authentication mode">
      {TABS.map((tab) => {
        const isActive = tab.mode === mode
        return (
          <button
            key={tab.mode}
            type="button"
            role="tab"
            id={tab.id}
            className="auth-tab"
            aria-selected={isActive ? 'true' : 'false'}
            aria-controls={tab.controls}
            tabIndex={isActive ? 0 : -1}
            data-testid={tab.testid}
            ref={(el) => {
              tabRefs.current[tab.mode] = el
            }}
            onClick={() => onSelect(tab.mode)}
            onKeyDown={onKeyDown}
          >
            {tab.label}
          </button>
        )
      })}
      <span className="auth-tab-underline" ref={underlineRef} aria-hidden="true" />
    </div>
  )
}
