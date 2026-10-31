import { useCallback, useEffect, useRef, useState } from 'react'
import { streamChat } from '../../../shared/api/client'
import { fetchChat } from '../../../shared/api/endpoints'
import type { StreamEvent } from '../../../shared/api/types'
import type { Msg } from '../types'

/**
 * Chat streaming state.
 *
 * The NDJSON buffering itself lives in `shared/api/client.ts` (`streamChat`)
 * and is byte-identical to the original implementation — this hook only
 * interprets the events it emits.
 */
export function useChatStream(routeId: string | undefined, onChatCreated: (id: string) => void) {
  const [messages, setMessages] = useState<Msg[]>([])
  const [title, setTitle] = useState('')
  const [busy, setBusy] = useState(false)
  const [loadErr, setLoadErr] = useState('')

  const abortRef = useRef<AbortController | null>(null)
  const ownChat = useRef<string | null>(null) // chat id created by the running stream
  const stick = useRef(true)

  /** Apply a transform to the last message in the thread. */
  const patchLast = useCallback((fn: (m: Msg) => Msg) => {
    setMessages((ms) => (ms.length ? [...ms.slice(0, -1), fn(ms[ms.length - 1])] : ms))
  }, [])

  const handleEvent = useCallback(
    (e: StreamEvent) => {
      switch (e.type) {
        case 'chat': {
          const ev = e as Extract<StreamEvent, { type: 'chat' }>
          ownChat.current = ev.chat_id
          setTitle(ev.title)
          onChatCreated(ev.chat_id)
          break
        }
        case 'stage': {
          const ev = e as Extract<StreamEvent, { type: 'stage' }>
          patchLast((m) => {
            const stages = [...(m.stages ?? [])]
            const i = stages.findIndex((s) => s.key === ev.stage)
            const s = {
              key: ev.stage,
              status: ev.status,
              label: ev.label || STAGE_FALLBACK[ev.stage] || ev.stage,
            }
            if (i >= 0) stages[i] = s
            else stages.push(s)
            return { ...m, stages }
          })
          break
        }
        case 'tool_call': {
          const ev = e as Extract<StreamEvent, { type: 'tool_call' }>
          patchLast((m) => ({
            ...m,
            tools: [...(m.tools ?? []), { id: ev.id, name: ev.name, args: ev.args }],
          }))
          break
        }
        case 'tool_result': {
          const ev = e as Extract<StreamEvent, { type: 'tool_result' }>
          patchLast((m) => ({
            ...m,
            tools: (m.tools ?? []).map((t) =>
              t.id === ev.id ? { ...t, summary: ev.summary } : t,
            ),
          }))
          break
        }
        case 'text_delta': {
          const ev = e as Extract<StreamEvent, { type: 'text_delta' }>
          patchLast((m) => ({ ...m, content: m.content + ev.delta }))
          break
        }
        case 'error': {
          const ev = e as Extract<StreamEvent, { type: 'error' }>
          patchLast((m) => ({ ...m, error: ev.message, streaming: false }))
          break
        }
        case 'done':
          patchLast((m) => ({ ...m, streaming: false }))
          break
        default:
          break // citations + unknown types ignored (cite:// links carry the data)
      }
    },
    [patchLast, onChatCreated],
  )

  // Load the chat on route change (skip when it is the chat we are streaming into).
  useEffect(() => {
    if (routeId && routeId === ownChat.current) return
    abortRef.current?.abort()
    ownChat.current = null
    setBusy(false)
    setLoadErr('')
    if (!routeId) {
      setMessages([])
      setTitle('')
      return
    }
    let live = true
    fetchChat(routeId)
      .then((c) => {
        if (!live) return
        setTitle(c.title)
        setMessages(
          c.messages.map((m) => ({
            id: m.id,
            role: m.role,
            content: m.content,
            attachment: m.attachment,
          })),
        )
        stick.current = true
      })
      .catch((e) => live && setLoadErr((e as Error).message))
    return () => {
      live = false
    }
  }, [routeId])

  /** Send a message, optionally with a file attachment. */
  const send = useCallback(
    async (text: string, file: File | null) => {
      text = text.trim()
      if (!text || busy) return
      const fd = new FormData()
      fd.append('message', text)
      if (routeId) fd.append('chat_id', routeId)
      if (file) fd.append('file', file)
      stick.current = true
      setMessages((ms) => [
        ...ms,
        {
          id: `u${Date.now()}`,
          role: 'user',
          content: text,
          attachment: file ? { filename: file.name, size: file.size } : null,
        },
        { id: `a${Date.now()}`, role: 'assistant', content: '', streaming: true, stages: [] },
      ])
      if (routeId) ownChat.current = routeId
      const ac = new AbortController()
      abortRef.current = ac
      setBusy(true)
      try {
        await streamChat(fd, ac.signal, handleEvent)
      } catch (e) {
        if ((e as Error).name !== 'AbortError') {
          patchLast((m) => ({ ...m, error: (e as Error).message }))
        }
      } finally {
        if (abortRef.current === ac) {
          patchLast((m) => ({ ...m, streaming: false }))
          setBusy(false)
        }
      }
    },
    [busy, routeId, handleEvent, patchLast],
  )

  const stop = useCallback(() => abortRef.current?.abort(), [])

  /** Reset the thread when navigating to a new chat. */
  const reset = useCallback(() => {
    abortRef.current?.abort()
    ownChat.current = null
    setBusy(false)
    setLoadErr('')
    setMessages([])
    setTitle('')
  }, [])

  return {
    messages,
    setMessages,
    title,
    setTitle,
    busy,
    loadErr,
    send,
    stop,
    reset,
    stick,
    refreshStick: () => {
      stick.current = true
    },
  }
}

/** Fallback labels for stages the backend does not label. */
const STAGE_FALLBACK: Record<string, string> = {
  uploaded: 'Uploaded',
  reading_file: 'Reading file',
  fetching_statutes: 'Fetching statutes from e-Gov…',
  analyzing: 'Analyzing against Japanese law',
  grounding: 'Grounding claims in citations…',
}
