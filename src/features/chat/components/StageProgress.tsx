import { STAGE_DEFAULT, STAGE_ORDER, type Stage } from '../types'

export default function StageProgress({ stages, hasFile }: { stages: Stage[]; hasFile: boolean }) {
  const seen = new Set(stages.map((s) => s.key))
  const list = STAGE_ORDER.filter(
    (k) => seen.has(k) || (hasFile ? true : k !== 'uploaded' && k !== 'reading_file'),
  ).map((k) => stages.find((s) => s.key === k) ?? { key: k, status: 'pending' as const, label: STAGE_DEFAULT[k] })
  const extras = stages.filter((s) => !STAGE_ORDER.includes(s.key))

  return (
    <div className="progress-block" data-testid="stage-progress">
      <div className="progress-title">Analyzing</div>
      <div className="stages">
        {[...list, ...extras].map((s) => (
          <div key={s.key} className={`stage ${s.status}`}>
            <div className="dot" />
            {s.label}
          </div>
        ))}
      </div>
    </div>
  )
}
