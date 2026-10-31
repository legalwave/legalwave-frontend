import { api } from './client'
import type {
  ApiKey,
  Article,
  AuthResponse,
  ChatDetail,
  ChatSummary,
  LoginPayload,
  RegisterPayload,
} from './types'

// ---- auth ----
export function login(payload: LoginPayload) {
  return api<AuthResponse>('/api/auth/login', {
    method: 'POST',
    body: payload,
    noRedirect: true,
  })
}

export function register(payload: RegisterPayload) {
  return api<AuthResponse>('/api/auth/register', {
    method: 'POST',
    body: payload,
    noRedirect: true,
  })
}

export function fetchMe() {
  return api<AuthResponse['user']>('/api/auth/me')
}

// ---- chats ----
export function fetchChats() {
  return api<ChatSummary[]>('/api/chats')
}

export function fetchChat(id: string) {
  return api<ChatDetail>(`/api/chats/${id}`)
}

export function deleteChat(id: string) {
  return api<void>(`/api/chats/${id}`, { method: 'DELETE' })
}

// ---- laws ----
export function fetchArticle(lawId: string, articleNum: string) {
  return api<Article>(
    `/api/laws/${encodeURIComponent(lawId)}/articles/${encodeURIComponent(articleNum)}`,
  )
}

// ---- api keys ----
export function fetchKeys() {
  return api<ApiKey[]>('/api/keys')
}

export function createKey() {
  return api<{ id: string; prefix: string; key: string; created_at: string }>('/api/keys', {
    method: 'POST',
  })
}

export function revokeKey(id: string) {
  return api<void>(`/api/keys/${id}`, { method: 'DELETE' })
}
