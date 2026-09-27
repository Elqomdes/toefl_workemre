import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useCountdown } from '../../lib/hooks'
import {
  acquireMic,
  beep,
  cancelSpeech,
  recordingSupported,
  releaseMic,
  speak,
  SpeechRecorder,
  speechRecognitionSupported,
} from '../../lib/speech'
import { getSettings } from '../../lib/storage'
import type { SpokenAnswer } from '../../types'
import { ProgressDots, SpeakingIndicator, TaskHeader, TimerBadge, VolumeMeter } from '../ui'

export interface SpeakingItem {
  speech: string
  /** Text shown while the prompt is being played (e.g. interview question) */
  display?: string
  voice: 'male' | 'female'
  responseSeconds: number
  /** Target sentence for Listen and Repeat alternative picking */
  hint?: string
}

type Phase = 'intro' | 'playing' | 'recording' | 'saving'

interface Props {
  title: string
  subtitle: string
  intro: ReactNode
  items: SpeakingItem[]
  showLiveTranscript: boolean
  onDone: (answers: SpokenAnswer[]) => void
}

export default function SpeakingSequence({ title, subtitle, intro, items, showLiveTranscript, onDone }: Props) {
  const [phase, setPhase] = useState<Phase>('intro')
  const [current, setCurrent] = useState(0)
  const [live, setLive] = useState('')
  const [level, setLevel] = useState(0)
  const [error, setError] = useState<string>()
  const answers = useRef<SpokenAnswer[]>([])
  const recorder = useRef<SpeechRecorder | null>(null)
  const stream = useRef<MediaStream | undefined>(undefined)
  const stopping = useRef(false)
  const item = items[current]

  useEffect(
    () => () => {
      cancelSpeech()
      recorder.current?.abort()
      if (stream.current) {
        releaseMic()
        stream.current = undefined
      }
    },
    [],
  )

  const ensureMic = async () => {
    if (stream.current?.active) return stream.current
    const mic = await acquireMic()
    stream.current = mic
    return mic
  }

  const runItem = async (index: number) => {
    const it = items[index]
    setCurrent(index)
    setLive('')
    setLevel(0)
    setPhase('playing')
    let mic: MediaStream | undefined
    try {
      mic = await ensureMic()
    } catch {
      setError('Mikrofona erişilemedi. Tarayıcıdan mikrofon izni verdiğinden emin ol.')
    }
    const ok = await speak(it.speech, it.voice, getSettings().voiceRate)
    if (!ok) return
    await beep()
    const rec = new SpeechRecorder()
    rec.onTranscript = setLive
    rec.onLevel = setLevel
    recorder.current = rec
    stopping.current = false
    await rec.start({ stream: mic, hint: it.hint })
    if (rec.error) setError(rec.error)
    setPhase('recording')
  }

  const stopRecording = async () => {
    if (stopping.current || !recorder.current) return
    stopping.current = true
    setPhase('saving')
    const rec = recorder.current
    const answer = await rec.stop()
    if (rec.error) setError(rec.error)
    answers.current[current] = answer
    recorder.current = null
    if (current < items.length - 1) {
      await new Promise((r) => setTimeout(r, 400))
      runItem(current + 1)
    } else {
      if (stream.current) {
        releaseMic()
        stream.current = undefined
      }
      onDone(items.map((_, i) => answers.current[i] ?? { transcript: '', durationSec: 0 }))
    }
  }

  const left = useCountdown(phase === 'recording' ? item.responseSeconds : undefined, phase === 'recording', stopRecording)

  if (phase === 'intro') {
    return (
      <div className="card">
        <TaskHeader title={title} subtitle={subtitle} />
        <div className="space-y-4">
          {intro}
          {!speechRecognitionSupported() && (
            <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
              Canlı konuşma tanıma bu tarayıcıda yok. Chrome veya Edge kullanırsan cümleyi anında görürsün. Ses yine kaydedilir; API
              anahtarın varsa puanlanırken metne çevrilir.
            </p>
          )}
          {!recordingSupported() && <p className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700">Bu tarayıcı ses kaydını desteklemiyor.</p>}
          <p className="text-sm text-slate-500">
            Soru/cümle bittikten sonra bir bip sesi duyacaksın. Bip sesinden sonra konuş. Süre bitince kayıt otomatik durur. Mikrofon izni
            istenirse "İzin ver"e tıkla.
          </p>
          <button
            className="btn-primary"
            onClick={async () => {
              try {
                await ensureMic()
              } catch {
                setError('Mikrofona erişilemedi. Tarayıcıdan mikrofon izni verdiğinden emin ol.')
              }
              runItem(0)
            }}
          >
            🎤 Başla
          </button>
        </div>
      </div>
    )
  }

  const hearing = level > 0.06

  return (
    <div className="card">
      <TaskHeader
        title={title}
        subtitle={`${current + 1} / ${items.length}`}
        right={
          <>
            <ProgressDots total={items.length} current={current} />
            {phase === 'recording' && <TimerBadge seconds={left} warnAt={5} />}
          </>
        }
      />
      <div className="flex min-h-64 flex-col items-center justify-center gap-6 rounded-lg bg-slate-50 p-6 text-center">
        {phase === 'playing' && (
          <>
            <SpeakingIndicator label="Dinle..." />
            {item.display && <p className="max-w-2xl text-lg font-medium">{item.display}</p>}
          </>
        )}
        {phase === 'recording' && (
          <>
            {item.display && <p className="max-w-2xl text-lg font-medium">{item.display}</p>}
            <div className="flex items-center gap-3">
              <span className={`h-4 w-4 rounded-full ${hearing ? 'animate-pulse bg-rose-600' : 'bg-slate-300'}`} />
              <span className={`font-semibold ${hearing ? 'text-rose-700' : 'text-slate-600'}`}>
                {hearing ? 'Sesin alınıyor, konuşmaya devam et' : 'Kayıt açık — biraz daha yüksek konuş'}
              </span>
              <VolumeMeter level={level} />
            </div>
            <div className="h-2 w-full max-w-md overflow-hidden rounded-full bg-slate-200">
              <div className="h-full bg-rose-500 transition-all" style={{ width: `${(left / item.responseSeconds) * 100}%` }} />
            </div>
            {showLiveTranscript && (
              <p className="min-h-6 max-w-2xl text-sm text-slate-500 italic">
                {live || (hearing ? 'Ses var, metin oluşuyor...' : 'Algılanan konuşma burada görünecek...')}
              </p>
            )}
            <button className="btn-danger" onClick={stopRecording}>
              ⏹ Bitir
            </button>
          </>
        )}
        {phase === 'saving' && <SpeakingIndicator label="Son kelimeler metne çevriliyor..." active={false} />}
      </div>
      {error && <p className="mt-3 text-sm text-rose-600">{error}</p>}
    </div>
  )
}
