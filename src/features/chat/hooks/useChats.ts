import { useCallback, useEffect, useMemo, useState } from 'react'
import { deleteChat, fetchChats } from '../../../shared/api/endpoints'
import type { ChatSummary } from '../../../shared/api/types'

export interface ChatGroup {
  label: string
  items: ChatSummary[]
}

/** Group chats into Today / Yesterday / Earlier buckets. */
export function groupChats(chats: ChatSummary[]): ChatGroup[] {
  const start = new Date()
  start.setHours(0, 0, 0, 0)
  const t0 = start.getTime()
  const g: Record<string, ChatSummary[]> = { Today: [], Yesterday: [], Earlier: [] }
  for (const c of chats) {
    const t = new Date(c.updated_at).getTime()
    g[t >= t0 ? 'Today' : t >= t0 - 86400000 ? 'Yesterday' : 'Earlier'].push(c)
  }
  return Object.entries(g)
    .filter(([, v]) => v.length)
    .map(([label, items]) => ({ label, items }))
}

/**
 * Chat history state: the list, the search filter, and deletion.
 */
export function useChats() {
  const [chats, setChats] = useState<ChatSummary[]>([])
  const [query, setQuery] = useState('')

  const refreshChats = useCallback(
    () => fetchChats().then(setChats).catch(() => {}),
    [],
  )

  useEffect(() => {
    refreshChats()
  }, [refreshChats])

  const removeChat = useCallback(
    async (id: string) => {
      await deleteChat(id).catch(() => {})
      refreshChats()
    },
    [refreshChats],
  )

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return q ? chats.filter((c) => (c.title + ' ' + c.preview).toLowerCase().includes(q)) : chats
  }, [chats, query])

  const groups = useMemo(() => groupChats(filtered), [filtered])

  return { chats, query, setQuery, groups, refreshChats, removeChat }
}
