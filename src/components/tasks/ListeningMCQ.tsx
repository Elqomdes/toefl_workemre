import { useEffect, useState } from 'react'
import { taskInfo } from '../../data/taskInfo'
import { cancelSpeech, speakLines } from '../../lib/speech'
import { getSettings } from '../../lib/storage'
import type { ListeningSet } from '../../types'
import { OptionList, SpeakingIndicator, TaskHeader, type TaskProps } from '../ui'

type Phase = 'intro' | 'listening' | 'questions'

export default function ListeningMCQ({ set, onSubmit, strict }: TaskProps<ListeningSet>) {
  const [phase, setPhase] = useState<Phase>('intro')
  const [speakerIdx, setSpeakerIdx] = useState(0)
  const [answers, setAnswers] = useState<(number | null)[]>(() => set.questions.map(() => null))
  const [current, setCurrent] = useState(0)
  const info = taskInfo(set.type)

  useEffect(() => () => cancelSpeech(), [])

  const listen = async () => {
    setPhase('listening')
    const finished = await speakLines(set.script, getSettings().voiceRate, setSpeakerIdx)
    if (finished) setPhase('questions')
  }

  const speakers = [...new Set(set.script.map((l) => l.speaker))]

  if (phase === 'intro') {
    return (
      <div className="card text-center">
        <TaskHeader title={info.name} subtitle={set.title} />
        <p className="mb-6 text-slate-600">
          Kaydı dinle, ardından {set.questions.length} soruyu cevapla. {strict ? 'Kayıt sadece bir kez çalınır.' : 'Not alabilirsin.'}
        </p>
        <button className="btn-primary" onClick={listen}>
          🔊 Dinlemeye Başla
        </button>
      </div>
    )
  }

  if (phase === 'listening') {
    const line = set.script[speakerIdx]
    return (
      <div className="card">
        <TaskHeader title={info.name} subtitle={set.title} />
        <div className="flex flex-col items-center gap-6 py-10">
          <div className="flex gap-6">
            {speakers.map((sp) => (
              <div
                key={sp}
                className={`flex h-28 w-28 flex-col items-center justify-center rounded-full border-4 text-sm font-semibold transition ${line?.speaker === sp ? 'scale-110 border-brand-500 bg-brand-50' : 'border-slate-200 bg-white text-slate-400'}`}
              >
                <span className="text-3xl">{sp === 'Professor' ? '🧑‍🏫' : sp === 'Announcer' ? '📢' : sp === 'Student' ? '🧑‍🎓' : '🧑‍💼'}</span>
                {sp}
              </div>
            ))}
          </div>
          <SpeakingIndicator label={`${line?.speaker ?? ''} konuşuyor...`} />
          {!strict && (
            <button
              className="btn-secondary"
              onClick={() => {
                cancelSpeech()
                setPhase('questions')
              }}
            >
              Atla ve sorulara geç
            </button>
          )}
        </div>
      </div>
    )
  }

  const q = set.questions[current]
  return (
    <div className="card">
      <TaskHeader
        title={info.name}
        subtitle={`Soru ${current + 1} / ${set.questions.length}`}
        right={
          !strict && (
            <button className="btn-secondary" onClick={listen}>
              ↻ Tekrar dinle
            </button>
          )
        }
      />
      <p className="mb-3 font-medium">
        {current + 1}. {q.q}
      </p>
      <OptionList
        name={`lq${current}`}
        options={q.options}
        value={answers[current]}
        onChange={(v) => setAnswers((prev) => prev.map((a, j) => (j === current ? v : a)))}
      />
      <div className="mt-5 flex justify-between">
        <button className="btn-secondary" disabled={current === 0 || strict} onClick={() => setCurrent((c) => c - 1)}>
          ← Önceki
        </button>
        {current < set.questions.length - 1 ? (
          <button className="btn-primary" disabled={answers[current] === null} onClick={() => setCurrent((c) => c + 1)}>
            Sonraki →
          </button>
        ) : (
          <button className="btn-primary" disabled={answers[current] === null} onClick={() => onSubmit({ type: set.type, answers })}>
            Bitir
          </button>
        )}
      </div>
    </div>
  )
}
