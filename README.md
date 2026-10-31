# LegalWave — Frontend (MVP)

React + TypeScript + Vite SPA for **LegalWave**, the Japanese-law contract risk analyzer. Talks to the FastAPI backend per `aidlc-docs/inception/api-contract.md`.

LegalWave pastes a clause or uploads a contract, streams a staged analysis back, and cites the relevant Japanese statutes.

## Prerequisites
- Node.js 20.19+ (tested on 24) and npm
- Backend on `http://localhost:8000` (or the optional mock below)

## Install & run
```
npm install
npm run dev        # http://localhost:5173 (next free port if taken)
```

## Config
Vite proxies `/api` and `/mcp` to `http://localhost:8000`. Override: `VITE_BACKEND_URL=http://host:port npm run dev`. Backend CORS allows 5173-5180.

## Build
```
npm run build      # tsc -b && vite build -> dist/
npm run preview
npm run lint       # oxlint
```

## Mock backend (optional)
If the real backend is not up: `node mock-server.mjs` (port 8000; `PORT=8001 node mock-server.mjs` plus `VITE_BACKEND_URL=http://localhost:8001` to run beside the real one). Any credentials work; it streams a canned NDJSON verdict report.

---

## Project structure

The frontend is organised **by feature**, not by file type. A feature owns its pages, components, hooks, and styles; only genuinely cross-cutting code lives in `app/`, `shared/`, or `config/`.

```
frontend/src/
├── main.tsx                 # Entry: router + SessionProvider + stylesheet imports
├── App.tsx                  # Route table (thin — delegates to features)
│
├── app/                     # Application shell concerns
│   ├── providers.tsx        # SessionProvider + useSession() context
│   ├── guards.tsx           # RequireAuth / RedirectIfAuthenticated route guards
│   └── routes.tsx           # ROUTES path constants + chatPath(id) helper
│
├── config/
│   └── brand.ts             # BRAND — single source of truth for name, tagline, MCP key, assets
│
├── features/
│   ├── auth/                # Login + Register
│   │   ├── components/      # AuthCard, Brand (logo lockup)
│   │   ├── pages/           # LoginPage.tsx, RegisterPage.tsx
│   │   └── styles/          # auth.css
│   ├── chat/                # Chat workspace
│   │   ├── components/      # ChatSidebar, ChatThread, Composer, MessageView, StageProgress
│   │   ├── hooks/           # useChats.ts, useChatStream.ts, useSidebarCollapse.ts
│   │   ├── pages/           # ChatPage.tsx
│   │   ├── styles/          # chat.css
│   │   └── types.ts
│   ├── citations/           # Statute citation modal
│   │   ├── components/      # CitationModal.tsx
│   │   └── styles/          # citation.css
│   └── settings/            # API key management
│       ├── pages/           # SettingsPage.tsx
│       └── styles/          # settings.css
│
├── shared/                  # Cross-feature code
│   ├── api/                 # client.ts (fetch + NDJSON stream), endpoints.ts, types.ts
│   └── components/          # Markdown.tsx + markdown.css
│
├── scripts/
│   └── generate-frontend-types.py   # regenerates shared/api/types.ts from the spec
│
├── styles/
│   ├── tokens.css           # :root design tokens (source of truth for the palette)
│   └── global.css           # Reset + base element rules
│
└── assets/
    ├── logo.svg             # LegalWave logo (scales + wave monogram)
    └── wave-field.svg       # Artistic background artwork
```

### Conventions
- **Imports** — use relative paths within a feature; cross-feature imports go through `shared/` or `app/`.
- **Styles** — each feature owns a `styles/*.css` file, imported once from `main.tsx`. Design tokens live in `styles/tokens.css`; components consume `var(--token)` and never hardcode colours.
- **API calls** — components never call `fetch` directly. They use `shared/api/endpoints.ts`, which wraps `shared/api/client.ts`. The client owns auth headers, error shaping, and 401 handling.
- **Type-only imports** must use `import type` (`verbatimModuleSyntax` is on).
- **Branding** — product name, tagline, MCP server key, and asset paths all come from `config/brand.ts`. Do not hardcode them in components.
- **`shared/api/types.ts` is generated.** It is derived from the backend's OpenAPI spec by `scripts/generate-frontend-types.py`. Never edit it by hand — change the backend's response model instead, then regenerate:

  ```bash
  (cd ../backend && uv run python scripts/export-openapi.py)
  python3 scripts/generate-frontend-types.py
  ```

  CI fails if the committed file does not match the spec.


---

## Routes and guards

| Path | Page | Guard |
|---|---|---|
| `/login` | `features/auth/pages/LoginPage.tsx` | `RedirectIfAuthenticated` |
| `/register` | `features/auth/pages/RegisterPage.tsx` | `RedirectIfAuthenticated` |
| `/settings/api-key` | `features/settings/pages/SettingsPage.tsx` | `RequireAuth` |
| `/` and `/c/:id` | `features/chat/pages/ChatPage.tsx` | `RequireAuth` |

- **`/login` and `/register` are separate routes.** Registration is no longer a toggle on the login page — each page posts to its own backend endpoint (`POST /api/auth/login` and `POST /api/auth/register` respectively) and owns its own form, validation, and error display. The login page links to `/register`; the register page links back to `/login`.
- **`RequireAuth`** — when there is no session, redirects to `/login` (preserving the intended destination is not yet supported). When a session exists, renders the child.
- **`RedirectIfAuthenticated`** — when a session exists, redirects to the chat workspace. When there is no session, renders the child. This keeps a signed-in user from re-visiting `/login` or `/register`.
- Guards read session state from the React context (`app/providers.tsx`), never directly from `localStorage`.
- A `401` from any API call clears the session and sends the user to `/login` (handled centrally in `shared/api/client.ts`). Auth-form submissions opt out of this so an incorrect password shows an inline error instead of a redirect.

### Session storage
The JWT and cached user object live in `localStorage` under `jlca_token` and `jlca_user`. These key names are part of the existing contract and must not change.

Device preferences use separate, namespaced keys and are never confused with the session — for example `lw_sidebar_collapsed` for the collapsed sidebar (see [Sidebar collapse](#sidebar-collapse)). Signing out clears only the session keys; the sidebar preference survives.

---

## Features

- **`/login`** — email + password, sign in to the workspace. `autoComplete="email"` / `"current-password"`. Inline error on bad credentials; input is not cleared.
- **`/register`** — optional name + email + password, creates an account and signs in. `autoComplete="name"` / `"email"` / `"new-password"`.
- **Chat workspace (`/` and `/c/:id`)** — sidebar (New chat, search, history grouped Today/Yesterday/Earlier, delete on hover, user footer + sign out, collapsible to an icon rail), example chips, `.txt`/`.pdf` attach, Enter to send / Shift+Enter newline.
- **Streaming** via `POST /api/chats/stream` (fetch + ReadableStream, NDJSON buffered by newline, unknown events ignored): `stage` -> progress list, `tool_call`/`tool_result` -> collapsible tool lines, `text_delta` -> progressively rendered markdown, auto-scroll (pauses when you scroll up), Stop button (AbortController).
- **Markdown renderers** — `### RED|YELLOW|GREEN · ...` -> severity badge, `**Overall: RED**` badge, blockquote -> clause quote, `cite://law_id/article` -> amber pill opening a modal fed by `GET /api/laws/{id}/articles/{n}` (Esc closes).
- **`/settings/api-key`** — list / generate (shown once, copy) / revoke keys, MCP quick-start snippet (`http://localhost:8000/mcp`, `Authorization: Bearer`).

PDF report generation is out of scope.

---

## Sidebar collapse

The chat workspace sidebar can be collapsed to a narrow icon rail and expanded again.

### The toggle

Two toggles drive the sidebar, one per visual state. The expanded toggle sits in the sidebar header next to the LegalWave logo; the collapsed toggle sits at the top of the rail. Exactly one is visible at a time, so the sidebar can always be reopened from wherever it currently is.

| State | Visible toggle | Glyph | Toggle label | `aria-expanded` |
|---|---|---|---|---|
| Expanded | `sidebar-toggle-expanded` (header) | `«` | "Collapse sidebar" | `true` |
| Collapsed | `sidebar-toggle-collapsed` (rail) | `»` | "Expand sidebar" | `false` |

Both carry `data-testid="sidebar-toggle-button"`, so a single selector resolves to whichever one is currently visible.

### The collapsed rail

At 56px wide, the sidebar shows an icon-only rail containing:

- the **expand toggle** (`»`, described above),
- the LegalWave logo,
- a **new chat** button (`data-testid="rail-new-chat-button"`).

The rail deliberately shows **no per-chat shortcuts**. A column of identical chat-bubble icons gives no way to tell the chats apart, so the rail carries only the controls that stay meaningful at 56px. The chat list is reached by expanding the sidebar.

The full sidebar panel — search box, chat list, user footer — stays mounted in the DOM at all times. Only its visibility changes, so the chat list keeps its scroll position and no data is refetched when the sidebar is toggled. While collapsed the panel is also marked `aria-hidden` and `inert`, so its controls are hidden from assistive technology and removed from the tab order — only the rail is reachable.

### Keyboard shortcut

`Ctrl+B` (Windows/Linux) or `Cmd+B` (macOS) toggles the sidebar from anywhere in the chat workspace. Above 768px it toggles the collapsed rail; below 768px it toggles the mobile drawer instead, so the shortcut always does something visible.

**The shortcut is disabled while typing.** If focus is inside a text field — the composer, the chat search box, or any contenteditable element — `Ctrl+B` / `Cmd+B` is left alone and the browser's own behaviour applies. The default is only prevented when the shortcut actually fires.

### Persistence

The collapsed state is stored in `localStorage` under the key **`lw_sidebar_collapsed`**. The value `'1'` means collapsed; when the sidebar is expanded the key is removed entirely, so only one unambiguous value is ever stored.

This is a **device preference, independent of your session**. It is separate from the `jlca_token` / `jlca_user` session keys — signing out does not clear it, and it is never sent to the backend. If `localStorage` is unavailable (private browsing with storage disabled, for example), the feature still works in-memory for the current page.

### Mobile drawer

Below **768px** the sidebar becomes an overlay drawer rather than a collapsed rail:

- the drawer slides in from the left over the chat area,
- a scrim behind it dims the workspace and closes the drawer when clicked,
- `Escape` also closes the drawer.

The desktop collapsed preference and the mobile drawer are **independent states** — a preference saved on a large screen never leaves the drawer open on a phone, and the drawer state is not persisted.

### Reduced motion

If the operating system has "reduce motion" enabled (`prefers-reduced-motion: reduce`), the sidebar jumps straight to its end state with no sliding, fading, or animation.

---

## Branding

The product is **LegalWave**. All product-name strings, the tagline, the MCP server key, and asset paths are centralised in `frontend/src/config/brand.ts` — change them there, not in components.

### MCP server key rename ⚠️

The MCP server key was renamed during the LegalWave rebrand:

```
legal-assistant   →   legalwave
```

The settings page shows the updated snippet plus a visible note explaining the change. **Existing MCP client configurations must be updated** to use the new key, otherwise they will fail to connect. The MCP server URL (`http://localhost:8000/mcp`) is unchanged.

---

## Assets

| File | Purpose | Used by |
|---|---|---|
| `src/assets/logo.svg` | LegalWave logo — a balance scale above two wave strokes, amber on a dark rounded plate. Solid strokes only (no gradients), so it renders correctly at 24px as well as 256px. | `features/auth/components/Brand.tsx`, sidebar brand lockup, `index.html` favicon |
| `src/assets/wave-field.svg` | Artistic background artwork — layered wave contours with an amber glow and a vignette. Scales to any viewport with no focal point. | Auth screens (`.auth-bg`, opacity .55 behind a scrim) and the chat workspace (`.shell-bg`, opacity .05 as texture) |

Both are vector SVG with no raster fallback and no external font dependency. They are referenced through `BRAND.logoSrc` / `BRAND.backgroundSrc` in `config/brand.ts`, which resolve them via `import.meta.url` so Vite fingerprints and bundles them correctly.

**Decorative by design.** The background layers are `aria-hidden="true"` and `pointer-events: none`, so they never intercept clicks or reach screen readers, and the app remains fully usable if the artwork fails to load.

---

## Testing

`data-testid` attributes follow a `{component}-{element-role}` convention, e.g. `login-form-email-input`, `register-form-submit-button`, `register-form-error`, `mcp-key-change-note`, `sidebar-toggle-button`, `rail-new-chat-button`. See `aidlc-docs/construction/build-and-test/` for the full manual verification checklist.
