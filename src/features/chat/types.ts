import type { Attachment } from '../../shared/api/types'

export interface Stage {
  key: string
  status: 'active' | 'complete'
  label: string
}

export interface Tool {
  id: string
  name: string
  args?: unknown
  summary?: string
}

export interface Msg {
  id: string
  role: 'user' | 'assistant'
  content: string
  attachment?: Attachment | null
  stages?: Stage[]
  tools?: Tool[]
  streaming?: boolean
  error?: string
}

export const STAGE_ORDER = ['uploaded', 'reading_file', 'fetching_statutes', 'analyzing', 'grounding']

export const STAGE_DEFAULT: Record<string, string> = {
  uploaded: 'Uploaded',
  reading_file: 'Reading file',
  fetching_statutes: 'Fetching statutes from e-Gov…',
  analyzing: 'Analyzing against Japanese law',
  grounding: 'Grounding claims in citations…',
}

export const EXAMPLES = [
  'Review this NDA',
  'Check termination clause',
  'Find the governing-law section',
]

/** Human-readable attachment size. */
export function fmtSize(n: number): string {
  return n >= 1048576
    ? `${(n / 1048576).toFixed(1)} MB`
    : `${Math.max(1, Math.round(n / 1024))} KB`
}
