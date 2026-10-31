// Optional dev mock of the backend contract (api-contract.md). Run: node mock-server.mjs
import http from 'node:http'
import { randomUUID } from 'node:crypto'

const PORT = Number(process.env.PORT ?? 8000)
const chats = new Map()
const keys = []
const user = { id: 'u1', email: 'demo@example.com', name: 'Demo' }
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const json = (res, code, body) => {
  res.writeHead(code, { 'Content-Type': 'application/json' })
  res.end(body === undefined ? '' : JSON.stringify(body))
}
const readBody = (req) => new Promise((r) => { const c = []; req.on('data', (d) => c.push(d)); req.on('end', () => r(Buffer.concat(c))) })

const REPLY = `**Overall: RED**

Analyzed your clause against the Civil Code and Consumer Contract Act.

### RED · Clause 7 — Unilateral amendment

The clause reserves a unilateral right to amend.

> いかなる理由においても，契約者の事前同意なく本契約の内容を変更することができる

Read against [民法 第1条](cite://129AC0000000089/1) and [消費者契約法 第10条](cite://412AC0000000061/10), it is likely void.

### YELLOW · Clause 12 — Termination for convenience

Acceptable but see [民法 第96条](cite://129AC0000000089/96).

### GREEN · Clause 3 — Governing law

Clear and aligned.

_Not legal advice · Verdicts are informational_
`

http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://x')
  const p = url.pathname
  const m = req.method
  if (p === '/api/health') return json(res, 200, { status: 'ok' })
  if (p === '/api/auth/register' || p === '/api/auth/login') {
    await readBody(req)
    return json(res, 200, { access_token: 'mock-jwt', user })
  }
  if (!req.headers.authorization) return json(res, 401, { detail: 'Not authenticated' })
  if (p === '/api/auth/me') return json(res, 200, user)
  if (p === '/api/chats' && m === 'GET')
    return json(res, 200, [...chats.values()].map(({ id, title, messages, updated_at }) => ({ id, title, preview: messages.at(-1)?.content.slice(0, 60) ?? '', updated_at })).reverse())
  let mm
  if (p !== '/api/chats/stream' && (mm = p.match(/^\/api\/chats\/([^/]+)$/))) {
    if (m === 'DELETE') { chats.delete(mm[1]); return json(res, 204) }
    const c = chats.get(mm[1])
    return c ? json(res, 200, c) : json(res, 404, { detail: 'Not found' })
  }
  if (p === '/api/chats/stream' && m === 'POST') {
    const raw = (await readBody(req)).toString('latin1')
    const message = /name="message"\r\n\r\n([\s\S]*?)\r\n--/.exec(raw)?.[1] ?? ''
    const chatId = /name="chat_id"\r\n\r\n([\s\S]*?)\r\n--/.exec(raw)?.[1]
    const hasFile = /name="file"/.test(raw)
    let chat = chatId && chats.get(chatId)
    if (!chat) { chat = { id: randomUUID(), title: message.slice(0, 40), messages: [], updated_at: new Date().toISOString() }; chats.set(chat.id, chat) }
    chat.messages.push({ id: randomUUID(), role: 'user', content: message, attachment: hasFile ? { filename: 'contract.txt', size: 1234 } : null, created_at: new Date().toISOString() })
    res.writeHead(200, { 'Content-Type': 'application/x-ndjson' })
    let closed = false
    res.on('close', () => { closed = true })
    const send = (o) => !closed && res.write(JSON.stringify(o) + '\n')
    send({ type: 'chat', chat_id: chat.id, title: chat.title })
    if (hasFile) {
      send({ type: 'stage', stage: 'uploaded', status: 'complete', label: 'Uploaded · 1 KB' })
      send({ type: 'stage', stage: 'reading_file', status: 'active', label: 'Reading file' }); await sleep(400)
      send({ type: 'stage', stage: 'reading_file', status: 'complete', label: 'Reading file' })
    }
    send({ type: 'stage', stage: 'fetching_statutes', status: 'active', label: 'Fetching statutes from e-Gov…' })
    send({ type: 'tool_call', id: 't1', name: 'search_law', args: { keyword: '民法' } }); await sleep(600)
    send({ type: 'tool_result', id: 't1', name: 'search_law', summary: '3 hits' })
    send({ type: 'stage', stage: 'fetching_statutes', status: 'complete', label: 'Fetching statutes from e-Gov…' })
    send({ type: 'stage', stage: 'analyzing', status: 'active', label: 'Analyzing against Japanese law' }); await sleep(600)
    send({ type: 'future_event', x: 1 })
    send({ type: 'stage', stage: 'analyzing', status: 'complete', label: 'Analyzing against Japanese law' })
    for (let i = 0; i < REPLY.length && !closed; i += 7) {
      send({ type: 'text_delta', delta: REPLY.slice(i, i + 7) }); await sleep(25)
    }
    chat.messages.push({ id: randomUUID(), role: 'assistant', content: REPLY, attachment: null, created_at: new Date().toISOString() })
    chat.updated_at = new Date().toISOString()
    send({ type: 'done', message_id: 'm1' })
    return res.end()
  }
  if ((mm = p.match(/^\/api\/laws\/([^/]+)\/articles\/([^/]+)$/)))
    return json(res, 200, { law_id: mm[1], law_title: '民法', article_num: mm[2], article_title: '（基本原則）', paragraphs: [{ num: '1', text: '私権は，公共の福祉に適合しなければならない。' }, { num: '2', text: '権利の行使及び義務の履行は，信義に従い誠実に行わなければならない。' }], source_url: `https://laws.e-gov.go.jp/law/${mm[1]}` })
  if (p === '/api/keys' && m === 'GET') return json(res, 200, keys)
  if (p === '/api/keys' && m === 'POST') {
    const k = { id: randomUUID(), prefix: 'jlca_' + randomUUID().slice(0, 4), created_at: new Date().toISOString(), last_used_at: null, revoked_at: null }
    keys.push(k)
    return json(res, 200, { id: k.id, prefix: k.prefix, key: 'jlca_' + randomUUID().replace(/-/g, ''), created_at: k.created_at })
  }
  if ((mm = p.match(/^\/api\/keys\/([^/]+)$/)) && m === 'DELETE') {
    const k = keys.find((x) => x.id === mm[1]); if (k) k.revoked_at = new Date().toISOString()
    return json(res, 204)
  }
  json(res, 404, { detail: 'Not found' })
}).listen(PORT, () => console.log('mock backend on :' + PORT))
