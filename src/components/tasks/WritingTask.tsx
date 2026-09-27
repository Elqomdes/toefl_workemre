import { useRef, useState } from 'react'
import { taskInfo } from '../../data/taskInfo'
import { useCountdown, wordCount } from '../../lib/hooks'
import type { DiscussionSet, EmailSet } from '../../types'
import { TaskHeader, TimerBadge, type TaskProps } from '../ui'

export default function WritingTask({ set, onSubmit }: TaskProps<EmailSet | DiscussionSet>) {
  const [text, setText] = useState('')
  const textRef = useRef(text)
  textRef.current = text
  const started = useRef(Date.now())
  const info = taskInfo(set.type)

  const submit = () =>
    onSubmit({ type: set.type, text: textRef.current, timeUsedSec: Math.round((Date.now() - started.current) / 1000) })
  const left = useCountdown(info.timeLimit, true, submit)
  const words = wordCount(text)
  const target = set.type === 'email' ? 80 : 100

  return (
    <div className="card">
      <TaskHeader title={info.name} subtitle={set.title} right={<TimerBadge seconds={left} warnAt={60} />} />
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4 text-[15px] leading-relaxed">
          {set.type === 'email' ? (
            <>
              <p>{set.scenario}</p>
              <div>
                <p className="font-semibold">Write an email to {set.to}. In your email, do the following:</p>
                <ul className="mt-2 list-disc space-y-1 pl-6">
                  {set.bullets.map((b) => (
                    <li key={b}>{b}</li>
                  ))}
                </ul>
              </div>
              <p className="text-sm text-slate-500">Write as much as you can and in complete sentences.</p>
            </>
          ) : (
            <>
              <p className="text-sm text-slate-500">
                Your professor is teaching a class. Write a post responding to the professor’s question. In your response, express and support
                your opinion and make a contribution to the discussion in your own words. An effective response will contain at least 100 words.
              </p>
              <div className="rounded-lg bg-slate-50 p-3">
                <p className="mb-1 font-semibold">🧑‍🏫 Professor</p>
                <p>{set.professor}</p>
                <p className="mt-2 font-medium">{set.question}</p>
              </div>
              {set.students.map((s) => (
                <div key={s.name} className="rounded-lg border border-slate-200 p-3">
                  <p className="mb-1 font-semibold">🧑‍🎓 {s.name}</p>
                  <p>{s.text}</p>
                </div>
              ))}
            </>
          )}
        </div>
        <div className="flex flex-col">
          {set.type === 'email' && (
            <div className="mb-2 rounded-t-lg border border-b-0 border-slate-300 bg-slate-50 px-3 py-2 text-sm">
              <b>To:</b> {set.to}
            </div>
          )}
          <textarea
            className={`input min-h-80 flex-1 resize-y font-[inherit] text-[15px] leading-relaxed ${set.type === 'email' ? 'rounded-t-none' : ''}`}
            value={text}
            onChange={(e) => setText(e.target.value)}
            spellCheck={false}
            autoCorrect="off"
            autoCapitalize="off"
            placeholder="Cevabını buraya yaz... (Gerçek sınavdaki gibi yazım denetimi kapalıdır)"
          />
          <div className="mt-2 flex items-center justify-between text-sm">
            <span className={words >= target ? 'text-emerald-600' : 'text-slate-500'}>
              Kelime sayısı: <b>{words}</b> (önerilen: {target}+)
            </span>
            <button className="btn-primary" onClick={submit}>
              Gönder ve Puanla
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
