import { useRef, useState } from 'react'
import { taskInfo } from '../../data/taskInfo'
import { useCountdown } from '../../lib/hooks'
import type { ReadingSet } from '../../types'
import { OptionList, TaskHeader, TimerBadge, type TaskProps } from '../ui'

export default function ReadingMCQ({ set, onSubmit }: TaskProps<ReadingSet>) {
  const [answers, setAnswers] = useState<(number | null)[]>(() => set.questions.map(() => null))
  const [current, setCurrent] = useState(0)
  const answersRef = useRef(answers)
  answersRef.current = answers
  const info = taskInfo(set.type)

  const submit = () => onSubmit({ type: set.type, answers: answersRef.current })
  const left = useCountdown(info.timeLimit, true, submit)
  const q = set.questions[current]

  return (
    <div className="card">
      <TaskHeader title={info.name} subtitle={set.title} right={<TimerBadge seconds={left} />} />
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="max-h-[65vh] overflow-y-auto rounded-lg border border-slate-200 bg-slate-50 p-4 text-[15px] leading-relaxed whitespace-pre-line">
          {set.text}
        </div>
        <div>
          <div className="mb-3 flex flex-wrap gap-1.5">
            {set.questions.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={`h-8 w-8 rounded-md text-sm font-semibold ${i === current ? 'bg-brand-500 text-white' : answers[i] !== null ? 'bg-brand-100 text-brand-700' : 'bg-slate-100 text-slate-600'}`}
              >
                {i + 1}
              </button>
            ))}
          </div>
          <p className="mb-3 font-medium">
            {current + 1}. {q.q}
          </p>
          <OptionList
            name={`q${current}`}
            options={q.options}
            value={answers[current]}
            onChange={(v) => setAnswers((prev) => prev.map((a, j) => (j === current ? v : a)))}
          />
          <div className="mt-5 flex justify-between">
            <button className="btn-secondary" disabled={current === 0} onClick={() => setCurrent((c) => c - 1)}>
              ← Önceki
            </button>
            {current < set.questions.length - 1 ? (
              <button className="btn-primary" onClick={() => setCurrent((c) => c + 1)}>
                Sonraki →
              </button>
            ) : (
              <button className="btn-primary" onClick={submit}>
                Gönder
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
