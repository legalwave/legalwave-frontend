// GENERATED FILE — DO NOT EDIT BY HAND.
//
// Derived from the backend's OpenAPI spec by `scripts/generate-frontend-types.py`.
// To change an API type, change the backend's route declaration or
// `backend/app/schemas.py`, then regenerate:
//
//     uv run python backend/scripts/export-openapi.py
//     python3 frontend/scripts/generate-frontend-types.py
//
// CI fails if this file is stale. Editing it directly will be overwritten.
//

export interface ApiKeyCreated {
  created_at: string
  id: string
  key: string
  prefix: string
}

export interface ApiKey {
  created_at: string
  id: string
  last_used_at: string | null
  prefix: string
  revoked_at: string | null
}

export interface Attachment {
  filename: string
  size: number
}

export interface AuthResponse {
  access_token: string
  user: User
}

export interface ChatDetail {
  id: string
  messages: ApiMessage[]
  title: string
}

export interface ChatSummary {
  id: string
  preview: string
  title: string
  updated_at: string
}

export interface HealthOut {
  status: string
}

export interface Article {
  article_num: string
  article_title: string
  law_id: string
  law_title: string
  paragraphs: LawParagraph[]
  source_url: string
}

export interface LawParagraph {
  num: string
  text: string
}

export interface LoginPayload {
  email: string
  password: string
}

export interface ApiMessage {
  attachment?: Attachment | null
  content: string
  created_at: string
  id: string
  role: "user" | "assistant"
}

export interface RegisterPayload {
  email: string
  name?: string | null
  password: string
}

export interface User {
  email: string
  id: string
  name?: string | null
}

export interface StreamCitation {
  article: string
  id: string
  label: string
  law_id: string
  law_title: string
}

// ---- streaming ----
//
// The NDJSON stream from POST /api/chats/stream. One JSON object per
// line, discriminated by `type`. The final member is an open catch-all:
// the frontend must tolerate event types it does not know, because the
// backend may add one without a frontend release.

export type StreamEvent =
  | { type: 'chat'; chat_id: string; title: string }
  | { type: 'stage'; label: string | null; stage: string; status: "active" | "complete" }
  | { type: 'tool_call'; args: Record<string, unknown>; id: string; name: string }
  | { type: 'tool_result'; id: string; name: string; summary: string }
  | { type: 'text_delta'; delta: string }
  | { type: 'citations'; items: StreamCitation[] }
  | { type: 'done'; message_id: string }
  | { type: 'error'; message: string }
  | { type: string; [k: string]: unknown }
