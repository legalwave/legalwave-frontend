import { useCallback, useEffect, useState } from 'react'

/**
 * Persistence key for the sidebar collapsed preference.
 *
 * Deliberately namespaced and distinct from the session keys (`jlca_token` /
 * `jlca_user`) so signing out never clears this device preference and the
 * preference never leaks into the session (FR-5.3, NFR-6.1, risk R6).
 */
const STORAGE_KEY = 'lw_sidebar_collapsed'

/** Viewport below which the sidebar behaves as an overlay drawer (FR-6.1). */
const NARROW_QUERY = '(max-width: 767px)'

/**
 * Read the persisted collapsed preference.
 *
 * Any value other than `'1'` means expanded. A missing, empty, or malformed
 * value — or a `SecurityError` from storage being disabled — falls back to
 * expanded (FR-5.2, NFR-8.1, NFR-8.2).
 */
function readPersisted(): boolean {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === '1'
  } catch {
    return false
  }
}

/**
 * Persist the collapsed preference.
 *
 * `'1'` means collapsed; expanded removes the key entirely so the stored state
 * is unambiguous. Storage failures are swallowed — the feature must still work
 * in-memory when storage is unavailable (FR-5.1, NFR-8.1).
 */
function persist(collapsed: boolean): void {
  try {
    if (collapsed) {
      window.localStorage.setItem(STORAGE_KEY, '1')
    } else {
      window.localStorage.removeItem(STORAGE_KEY)
    }
  } catch {
    /* storage unavailable — in-memory state still applies */
  }
}

/**
 * True when the event target is a text-entry surface, in which case the
 * `Ctrl+B` shortcut must not fire (FR-4.3, risk R4).
 */
function isTextEntry(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) return true
  return target.isContentEditable
}

/**
 * Sidebar collapse state for the chat workspace.
 *
 * Owns two independent booleans:
 * - `collapsed` — the desktop rail state, persisted across reloads.
 * - `drawerOpen` — the narrow-viewport overlay drawer state, never persisted.
 *
 * `narrow` reports whether the viewport is below the breakpoint. It is exposed
 * so the caller can tell which of the two states actually governs the current
 * layout: below 768px the drawer governs and the rail never applies (FR-6.4,
 * risk R5).
 */
export function useSidebarCollapse(): {
  collapsed: boolean
  drawerOpen: boolean
  narrow: boolean
  toggle: () => void
  setDrawerOpen: (open: boolean) => void
} {
  const [collapsed, setCollapsed] = useState<boolean>(readPersisted)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [narrow, setNarrow] = useState(
    () => typeof window !== 'undefined' && typeof window.matchMedia === 'function'
      ? window.matchMedia(NARROW_QUERY).matches
      : false,
  )

  // Persist whenever the desktop collapsed state changes.
  useEffect(() => {
    persist(collapsed)
  }, [collapsed])

  // Track the viewport width so the drawer and the rail never fight (FR-6.4).
  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return
    const mql = window.matchMedia(NARROW_QUERY)
    const onChange = (e: MediaQueryListEvent) => {
      setNarrow(e.matches)
      // Leaving the narrow viewport closes the drawer so it cannot linger
      // invisibly over the desktop layout.
      if (!e.matches) setDrawerOpen(false)
    }
    mql.addEventListener('change', onChange)
    return () => mql.removeEventListener('change', onChange)
  }, [])

  // `Ctrl+B` / `Cmd+B` toggles the sidebar, but never while typing (FR-4).
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!(event.ctrlKey || event.metaKey)) return
      if (event.key.toLowerCase() !== 'b') return
      // The shortcut does not apply inside a text field, so the browser's own
      // behaviour is left alone and no default is prevented (FR-4.3).
      if (isTextEntry(event.target)) return
      event.preventDefault()
      // Below the breakpoint the drawer governs; toggling the desktop rail
      // state there would have no visible effect (FR-6.4).
      if (narrow) {
        setDrawerOpen((open) => !open)
        return
      }
      setCollapsed((c) => !c)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [narrow])

  // `Escape` closes the mobile drawer (FR-6.3).
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      setDrawerOpen(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  const toggle = useCallback(() => {
    if (narrow) {
      setDrawerOpen((open) => !open)
      return
    }
    setCollapsed((c) => !c)
  }, [narrow])

  const setDrawer = useCallback((open: boolean) => {
    setDrawerOpen(open)
  }, [])

  return { collapsed, drawerOpen, narrow, toggle, setDrawerOpen: setDrawer }
}
