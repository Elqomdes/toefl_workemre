import { useEffect, useState } from 'react'
import { cancelSpeech, speak } from '../../lib/speech'
import { getSettings } from '../../lib/storage'
import type { ChooseResponseSet } from '../../types'
import { OptionList, ProgressDots, SpeakingIndicator, TaskHeader, type TaskProps } from '../ui'

export default function ChooseResponse({ set, onSubmit, strict }: TaskProps<ChooseResponseSet>) {
  const [started, setStarted] = useState(false)
  const [current, setCurrent] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [answers, setAnswers] = useState<(number | null)[]>(() => set.items.map(() => null))
  const rate = getSettings().voiceRate
  const item = set.items[current]

  const play = async () => {
    setPlaying(true)
    await speak(item.prompt, item.speaker ?? 'female', rate)
    setPlaying(false)
  }

  useEffect(() => {
    if (started) play()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [started, current])

  useEffect(() => () => cancelSpeech(), [])

  const next = () => {
    cancelSpeech()
    if (current < set.items.length - 1) setCurrent((c) => c + 1)
    else onSubmit({ type: 'chooseResponse', answers })
  }

  if (!started) {
    return (
      <div className="card text-center">
        <TaskHeader title="Listen and Choose a Response" subtitle={set.title} />
        <p className="mb-6 text-slate-600">
          Bir kişinin söylediği kısa bir cümleyi duyacaksın. Cümle ekranda yazmayacak. Dinledikten sonra en uygun cevabı seç. Toplam{' '}
          {set.items.length} soru var.
        </p>
        <button className="btn-primary" onClick={() => setStarted(true)}>
          🔊 Başla
        </button>
      </div>
    )
  }

  return (
    <div className="card">
      <TaskHeader
        title="Listen and Choose a Response"
        subtitle={`Soru ${current + 1} / ${set.items.length}`}
        right={<ProgressDots total={set.items.length} current={current} />}
      />
      <div className="mb-5 flex items-center justify-between rounded-lg bg-slate-50 p-4">
        <SpeakingIndicator label={playing ? 'Dinle...' : 'Cevabını seç'} active={playing} />
        {!strict && (
          <button className="btn-secondary" onClick={play} disabled={playing}>
            ↻ Tekrar dinle
          </button>
        )}
      </div>
      {!playing && (
        <OptionList
          name={`cr${current}`}
          options={item.options}
          value={answers[current]}
          onChange={(v) => setAnswers((prev) => prev.map((a, j) => (j === current ? v : a)))}
        />
      )}
      <div className="mt-5 flex justify-end">
        <button className="btn-primary" onClick={next} disabled={playing || answers[current] === null}>
          {current < set.items.length - 1 ? 'Sonraki →' : 'Bitir'}
        </button>
      </div>
    </div>
  )
}
