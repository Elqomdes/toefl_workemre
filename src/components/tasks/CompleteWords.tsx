import { useMemo, useRef, useState } from 'react'
import { taskInfo } from '../../data/taskInfo'
import { parseCompleteWords } from '../../lib/evaluate'
import { useCountdown } from '../../lib/hooks'
import type { CompleteWordsSet } from '../../types'
import { TaskHeader, TimerBadge, type TaskProps } from '../ui'

export default function CompleteWords({ set, onSubmit }: TaskProps<CompleteWordsSet>) {
  const segments = useMemo(() => parseCompleteWords(set.paragraph), [set.paragraph])
  const blanks = segments.filter((s) => s.kind === 'blank')
  const [answers, setAnswers] = useState<string[]>(() => blanks.map(() => ''))
  const inputs = useRef<(HTMLInputElement | null)[]>([])
  const answersRef = useRef(answers)
  answersRef.current = answers

  const submit = () => onSubmit({ type: 'completeWords', answers: answersRef.current })
  const left = useCountdown(taskInfo('completeWords').timeLimit, true, submit)

  const setAnswer = (i: number, v: string, max: number) => {
    const clean = v.replace(/[^a-zA-Z'’-]/g, '').slice(0, max)
    setAnswers((prev) => prev.map((a, j) => (j === i ? clean : a)))
    if (clean.length === max) inputs.current[i + 1]?.focus()
  }

  return (
    <div className="card">
      <TaskHeader
        title="Complete the Words"
        subtitle="Paragraftaki eksik harfleri doldur. Her kutu eksik harf sayısı kadar uzunluktadır."
        right={<TimerBadge seconds={left} />}
      />
      <p className="text-lg leading-[2.6rem]">
        {segments.map((s, k) =>
          s.kind === 'text' ? (
            <span key={k}>{s.text}</span>
          ) : (
            <span key={k} className="whitespace-nowrap">
              {s.shown}
              <input
                ref={(el) => {
                  inputs.current[s.index] = el
                }}
                value={answers[s.index]}
                onChange={(e) => setAnswer(s.index, e.target.value, s.missing.length)}
                onKeyDown={(e) => {
                  if (e.key === 'Backspace' && !answers[s.index] && s.index > 0) inputs.current[s.index - 1]?.focus()
                }}
                maxLength={s.missing.length}
                spellCheck={false}
                autoComplete="off"
                className="mx-0.5 rounded border-b-2 border-brand-500 bg-brand-50 px-1 text-center font-mono tracking-[0.3em] outline-none focus:bg-brand-100"
                style={{ width: `${s.missing.length * 1.05 + 1}em` }}
                placeholder={'_'.repeat(s.missing.length)}
              />
            </span>
          ),
        )}
      </p>
      <div className="mt-6 flex justify-end">
        <button className="btn-primary" onClick={submit}>
          Cevapları Gönder
        </button>
      </div>
    </div>
  )
}
