import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import TaskRunner from '../components/TaskRunner'
import { SECTION_NAMES, SECTIONS, taskInfo, tasksOf } from '../data/taskInfo'
import { evaluate } from '../lib/evaluate'
import { overallBand, sectionScores } from '../lib/scoring'
import { cancelSpeech } from '../lib/speech'
import { getSetsOfType, hasAIKey, newId, saveAttempt } from '../lib/storage'
import { rememberSessionAttempt } from '../lib/session'
import type { Section, TaskResponse, TaskResult, TaskSet } from '../types'

type Phase = 'setup' | 'break' | 'running' | 'evaluating'

interface Step {
  section: Section
  set: TaskSet
}

const pick = <T,>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)]

function buildSteps(sections: Section[]): Step[] {
  return sections.flatMap((section) =>
    tasksOf(section)
      .map((t) => getSetsOfType(t.type))
      .filter((sets) => sets.length)
      .map((sets) => ({ section, set: pick(sets) })),
  )
}

export default function FullTest() {
  const navigate = useNavigate()
  const [selected, setSelected] = useState<Section[]>([...SECTIONS])
  const [phase, setPhase] = useState<Phase>('setup')
  const [steps, setSteps] = useState<Step[]>([])
  const [index, setIndex] = useState(0)
  const evaluations = useRef<{ step: Step; response: TaskResponse; promise: Promise<TaskResult> }[]>([])
  const [evalDone, setEvalDone] = useState(0)
  const [results, setResults] = useState<TaskResult[] | null>(null)

  useEffect(() => () => cancelSpeech(), [])

  // Warn before leaving mid-test
  useEffect(() => {
    if (phase !== 'running' && phase !== 'break') return
    const h = (e: BeforeUnloadEvent) => e.preventDefault()
    window.addEventListener('beforeunload', h)
    return () => window.removeEventListener('beforeunload', h)
  }, [phase])

  const start = () => {
    evaluations.current = []
    setSteps(buildSteps(selected))
    setIndex(0)
    setResults(null)
    setPhase('break')
  }

  const onSubmit = (response: TaskResponse) => {
    const step = steps[index]
    evaluations.current.push({ step, response, promise: evaluate(step.set, response) })
    const next = index + 1
    if (next >= steps.length) {
      finish()
      return
    }
    setIndex(next)
    setPhase(steps[next].section !== step.section ? 'break' : 'running')
  }

  const finish = async () => {
    setPhase('evaluating')
    setEvalDone(0)
    const out = await Promise.all(
      evaluations.current.map((e) =>
        e.promise.then((r) => {
          setEvalDone((d) => d + 1)
          return r
        }),
      ),
    )
    setResults(out)
  }

  const retryFailed = async () => {
    const current = results ?? []
    setResults(null)
    setEvalDone(current.filter((r) => !r.aiError).length)
    const out = await Promise.all(
      evaluations.current.map(async (e, i) => {
        if (!current[i]?.aiError) return current[i]
        const r = await evaluate(e.step.set, e.response)
        setEvalDone((d) => d + 1)
        return r
      }),
    )
    setResults(out)
  }

  const save = (res: TaskResult[]) => {
    const sections = sectionScores(res)
    const attempt = {
      id: newId(),
      date: new Date().toISOString(),
      mode: 'full' as const,
      label: selected.length === 4 ? 'Tam Deneme Sınavı' : `Deneme: ${selected.map((s) => SECTION_NAMES[s].en).join(', ')}`,
      results: res,
      sections,
      overall: overallBand(sections),
    }
    rememberSessionAttempt(attempt)
    saveAttempt(attempt)
    navigate(`/results/${attempt.id}`)
  }

  useEffect(() => {
    if (results && !results.some((r) => r.aiError)) save(results)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [results])

  if (phase === 'setup') {
    return (
      <div className="mx-auto max-w-3xl space-y-5">
        <h1 className="text-2xl font-bold">Tam Deneme Sınavı</h1>
        <div className="card space-y-4">
          <p className="text-slate-600">
            Yeni TOEFL iBT formatındaki tüm görevler sırayla gelir. Her görev için soru bankasından rastgele bir set seçilir. Gerçek sınav gibi
            dinlemeleri tekrar oynatamazsın ve konuşma sırasında canlı metin gösterilmez.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {SECTIONS.map((s) => (
              <label
                key={s}
                className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 ${selected.includes(s) ? 'border-brand-500 bg-brand-50' : 'border-slate-200'}`}
              >
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={selected.includes(s)}
                  onChange={(e) => setSelected((prev) => (e.target.checked ? SECTIONS.filter((x) => x === s || prev.includes(x)) : prev.filter((x) => x !== s)))}
                />
                <div>
                  <div className="font-semibold">
                    {SECTION_NAMES[s].en} <span className="font-normal text-slate-500">· {SECTION_NAMES[s].tr}</span>
                  </div>
                  <ul className="mt-1 text-xs text-slate-500">
                    {tasksOf(s).map((t) => (
                      <li key={t.type}>• {t.name}</li>
                    ))}
                  </ul>
                </div>
              </label>
            ))}
          </div>
          {!hasAIKey() && (selected.includes('writing') || selected.includes('speaking')) && (
            <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
              API anahtarı girilmemiş. E-posta, Akademik Tartışma ve Mülakat puanlanamaz. Bu yüzden genel puan hesaplanmayabilir.{' '}
              <Link to="/settings" className="underline">
                Ayarlara git
              </Link>
            </p>
          )}
          <p className="text-sm text-slate-500">
            Genel puan (1-6 band) ancak 4 bölüm de seçildiğinde hesaplanır. Konuşma bölümü için mikrofon ve Chrome/Edge gerekir. Tahmini süre:
            yaklaşık 1,5 saat.
          </p>
          <button className="btn-primary" disabled={!selected.length} onClick={start}>
            Sınava Başla
          </button>
        </div>
      </div>
    )
  }

  if (phase === 'evaluating') {
    const total = evaluations.current.length
    const failed = results?.filter((r) => r.aiError) ?? []
    return (
      <div className="mx-auto max-w-xl">
        <div className="card space-y-4 text-center">
          {!results ? (
            <>
              <span className="mx-auto block h-10 w-10 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
              <p className="font-semibold">Cevapların değerlendiriliyor...</p>
              <p className="text-sm text-slate-500">
                {evalDone} / {total} görev tamamlandı
              </p>
              <div className="h-2 overflow-hidden rounded-full bg-slate-200">
                <div className="h-full bg-brand-500 transition-all" style={{ width: `${(evalDone / Math.max(1, total)) * 100}%` }} />
              </div>
            </>
          ) : (
            <>
              <p className="font-semibold text-amber-700">{failed.length} görev yapay zeka ile puanlanamadı.</p>
              <ul className="text-left text-sm text-slate-600">
                {failed.map((r, i) => (
                  <li key={i}>
                    • <b>{taskInfo(r.taskType).name}</b>: {r.aiError}
                  </li>
                ))}
              </ul>
              <div className="flex justify-center gap-2">
                <button className="btn-primary" onClick={retryFailed}>
                  Tekrar dene
                </button>
                <button className="btn-secondary" onClick={() => save(results)}>
                  Bunlar olmadan sonuçları göster
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    )
  }

  const step = steps[index]
  const sectionSteps = steps.filter((s) => s.section === step.section)
  const posInSection = sectionSteps.indexOf(step)

  if (phase === 'break') {
    return (
      <div className="mx-auto max-w-xl">
        <div className="card space-y-4 text-center">
          <span className={`mx-auto inline-block rounded-full px-4 py-1 text-sm font-semibold text-white ${SECTION_NAMES[step.section].color}`}>
            Bölüm {selected.indexOf(step.section) + 1} / {selected.length}
          </span>
          <h2 className="text-2xl font-bold">
            {SECTION_NAMES[step.section].en} · {SECTION_NAMES[step.section].tr}
          </h2>
          <ul className="text-sm text-slate-600">
            {sectionSteps.map((s) => (
              <li key={s.set.id}>
                {taskInfo(s.set.type).name}
                {taskInfo(s.set.type).timeLimit ? ` (${Math.round(taskInfo(s.set.type).timeLimit! / 60)} dk)` : ''}
              </li>
            ))}
          </ul>
          <button className="btn-primary" onClick={() => setPhase('running')}>
            Bölüme Başla
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-white px-4 py-2 text-sm shadow-sm">
        <span className="font-semibold">
          <span className={`mr-2 inline-block h-2.5 w-2.5 rounded-full ${SECTION_NAMES[step.section].color}`} />
          {SECTION_NAMES[step.section].en} · Görev {posInSection + 1}/{sectionSteps.length}
        </span>
        <div className="flex items-center gap-3">
          <div className="h-2 w-40 overflow-hidden rounded-full bg-slate-200">
            <div className="h-full bg-brand-500" style={{ width: `${(index / steps.length) * 100}%` }} />
          </div>
          <span className="text-slate-500">
            {index + 1}/{steps.length}
          </span>
        </div>
      </div>
      <TaskRunner key={index} set={step.set} onSubmit={onSubmit} strict />
    </div>
  )
}
