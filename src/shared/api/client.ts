import type { StreamEvent, User } from './types'

const TOKEN = 'jlca_token'
const USER = 'jlca_user'
export const getToken = () => localStorage.getItem(TOKEN)
export const getUser = (): User | null => {
  try { return JSON.parse(localStorage.getItem(USER) ?? 'null') } catch { return null }
}
export function setSession(token: string, user: User) {
  localStorage.setItem(TOKEN, token)
  localStorage.setItem(USER, JSON.stringify(user))
}
export function logout() {
  localStorage.removeItem(TOKEN)
  localStorage.removeItem(USER)
  window.location.href = '/login'
}

function authHeaders(): Record<string, string> {
  const t = getToken()
  return t ? { Authorization: `Bearer ${t}` } : {}
}

async function errorOf(res: Response): Promise<string> {
  try {
    const j = await res.json()
    return typeof j.detail === 'string' ? j.detail : JSON.stringify(j.detail ?? j)
  } catch {
    return `${res.status} ${res.statusText}`
  }
}

export async function api<T = unknown>(
  path: string,
  opts: { method?: string; body?: unknown; noRedirect?: boolean } = {},
): Promise<T> {
  const res = await fetch(path, {
    method: opts.method ?? 'GET',
    headers: {
      ...authHeaders(),
      ...(opts.body !== undefined ? { 'Content-Type': 'application/json' } : {}),
    },
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
  })
  if (res.status === 401 && !opts.noRedirect) {
    logout()
    throw new Error('Unauthorized')
  }
  if (!res.ok) throw new Error(await errorOf(res))
  if (res.status === 204) return undefined as T
  return res.json()
}

export async function streamChat(
  form: FormData,
  signal: AbortSignal,
  onEvent: (e: StreamEvent) => void,
) {
  const res = await fetch('/api/chats/stream', {
    method: 'POST',
    headers: authHeaders(),
    body: form,
    signal,
  })
  if (res.status === 401) {
    logout()
    throw new Error('Unauthorized')
  }
  if (!res.ok || !res.body) throw new Error(await errorOf(res))
  const reader = res.body.getReader()
  const dec = new TextDecoder()
  let buf = ''
  const flush = (line: string) => {
    if (!line.trim()) return
    try { onEvent(JSON.parse(line)) } catch { /* ignore malformed line */ }
  }
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    buf += dec.decode(value, { stream: true })
    let i: number
    while ((i = buf.indexOf('\n')) >= 0) {
      flush(buf.slice(0, i))
      buf = buf.slice(i + 1)
    }
  }
  buf += dec.decode()
  flush(buf)
}
