import type { ReactNode } from 'react'
import { formatTime } from '../lib/hooks'
import type { TaskResponse, TaskSet } from '../types'

export interface TaskProps<S extends TaskSet = TaskSet> {
  set: S
  onSubmit: (response: TaskResponse) => void
  /** Full-test mode: no replays, no live transcript, question text hidden like the real exam */
  strict?: boolean
}

export function TimerBadge({ seconds, warnAt = 30 }: { seconds: number; warnAt?: number }) {
  return (
    <span
      className={`rounded-md px-3 py-1 font-mono text-sm font-semibold ${seconds <= warnAt ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-700'}`}
    >
      ⏱ {formatTime(seconds)}
    </span>
  )
}

export function TaskHeader({ title, subtitle, right }: { title: string; subtitle?: ReactNode; right?: ReactNode }) {
  return (
    <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h2 className="text-xl font-bold">{title}</h2>
        {subtitle && <p className="mt-1 text-sm text-slate-600">{subtitle}</p>}
      </div>
      {right && <div className="flex items-center gap-2">{right}</div>}
    </div>
  )
}

export function VolumeMeter({ level }: { level: number }) {
  const bars = 8
  const active = Math.round(Math.min(1, Math.max(0, level)) * bars)
  return (
    <div className="flex h-8 items-end gap-0.5" title="Mikrofon seviyesi" aria-hidden>
      {Array.from({ length: bars }, (_, i) => (
        <span
          key={i}
          className={`w-1.5 rounded-sm ${i < active ? (i > 5 ? 'bg-emerald-500' : 'bg-brand-500') : 'bg-slate-200'}`}
          style={{ height: `${32 + i * 8}%` }}
        />
      ))}
    </div>
  )
}

export function SpeakingIndicator({ label, active = true, color = 'bg-brand-500' }: { label: string; active?: boolean; color?: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-8 items-end gap-1">
        {[0, 1, 2, 3, 4].map((i) => (
          <span
            key={i}
            className={`w-1.5 rounded-full ${color} ${active ? 'animate-pulse' : ''}`}
            style={{ height: active ? `${12 + ((i * 7) % 20)}px` : '6px', animationDelay: `${i * 120}ms` }}
          />
        ))}
      </div>
      <span className="text-sm font-medium text-slate-700">{label}</span>
    </div>
  )
}

export function ProgressDots({ total, current }: { total: number; current: number }) {
  return (
    <div className="flex gap-1.5">
      {Array.from({ length: total }, (_, i) => (
        <span key={i} className={`h-2 w-6 rounded-full ${i < current ? 'bg-brand-500' : i === current ? 'bg-sky-300' : 'bg-slate-200'}`} />
      ))}
    </div>
  )
}

export function OptionList({
  options,
  value,
  onChange,
  name,
}: {
  options: string[]
  value: number | null
  onChange: (i: number) => void
  name: string
}) {
  return (
    <div className="space-y-2">
      {options.map((o, i) => (
        <label
          key={i}
          className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 text-sm transition ${value === i ? 'border-brand-500 bg-brand-50' : 'border-slate-200 hover:bg-slate-50'}`}
        >
          <input type="radio" name={name} className="mt-0.5" checked={value === i} onChange={() => onChange(i)} />
          <span>
            <b className="mr-1">{String.fromCharCode(65 + i)}.</b>
            {o}
          </span>
        </label>
      ))}
    </div>
  )
}
