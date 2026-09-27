import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import TaskResultView from '../components/TaskResultView'
import TaskRunner from '../components/TaskRunner'
import { taskInfo } from '../data/taskInfo'
import { evaluate } from '../lib/evaluate'
import { sectionScores } from '../lib/scoring'
import { getSetById, getSetsOfType, hasAIKey, newId, saveAttempt } from '../lib/storage'
import { vocabStats } from '../lib/vocab'
import type { TaskResponse, TaskResult, TaskType } from '../types'

export default function PracticeRun() {
  const { section, taskType, setId } = useParams<{ section: string; taskType: TaskType; setId: string }>()
  const navigate = useNavigate()
  const set = setId ? getSetById(setId) : undefined
  const [runKey, setRunKey] = useState(0)
  const [response, setResponse] = useState<TaskResponse>()
  const [result, setResult] = useState<TaskResult>()
  const [evaluating, setEvaluating] = useState(false)

  if (!set || !taskType) {
    return (
      <div className="card">
        Soru seti bulunamadı. <Link to={`/practice/${section ?? 'reading'}`}>Geri dön</Link>
      </div>
    )
  }
  const info = taskInfo(taskType)

  const runEvaluation = async (r: TaskResponse) => {
    setEvaluating(true)
    try {
      const res = await evaluate(set, r)
      setResult(res)
      saveAttempt({
        id: newId(),
        date: new Date().toISOString(),
        mode: 'practice',
        label: `${info.name}: ${set.title}`,
        results: [res],
        sections: sectionScores([res]),
        overall: null,
      })
    } finally {
      setEvaluating(false)
    }
  }

  const onSubmit = (r: TaskResponse) => {
    setResponse(r)
    runEvaluation(r)
  }

  const restart = () => {
    setResult(undefined)
    setResponse(undefined)
    setRunKey((k) => k + 1)
  }

  const sets = getSetsOfType(taskType)
  const nextSet = sets[(sets.findIndex((s) => s.id === set.id) + 1) % sets.length]

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
        <Link to={`/practice/${section}`} className="text-brand-600 hover:underline">
          ← {info.section.charAt(0).toUpperCase() + info.section.slice(1)} görevleri
        </Link>
        {info.aiScored && !hasAIKey() && (
          <span className="rounded-md bg-amber-50 px-3 py-1 text-amber-800">
            Bu görev yapay zeka ile puanlanır. <Link to="/settings" className="underline">API anahtarı ekle</Link>
          </span>
        )}
      </div>

      {!response && <TaskRunner key={runKey} set={set} onSubmit={onSubmit} />}

      {evaluating && (
        <div className="card flex items-center gap-3">
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
          {info.aiScored || taskType === 'listenRepeat' ? 'Cevapların değerlendiriliyor (yapay zeka birkaç saniye sürebilir)...' : 'Puanlanıyor...'}
        </div>
      )}

      {result && !evaluating && (
        <>
          <TaskResultView result={result} />
          {(result.taskType === 'completeWords' || result.taskType === 'dailyLife' || result.taskType === 'academicReading') && (
            <div className="card flex flex-wrap items-center justify-between gap-3 border-emerald-200 bg-emerald-50">
              <p className="text-sm text-emerald-900">
                {result.items.filter((i) => i.earned < i.possible).length} kelime / yanlış çalışma listesine işlendi. Listede şu an{' '}
                <b>{vocabStats().due}</b> çalışılacak kelime var.
              </p>
              <Link to="/vocab" className="btn-primary">
                Kelime çalış
              </Link>
            </div>
          )}
          <div className="flex flex-wrap gap-2">
            <button className="btn-secondary" onClick={restart}>
              ↻ Tekrar dene
            </button>
            {result.aiError && response && (
              <button className="btn-secondary" onClick={() => runEvaluation(response)}>
                Yapay zeka ile tekrar puanla
              </button>
            )}
            {nextSet && nextSet.id !== set.id && (
              <button
                className="btn-primary"
                onClick={() => {
                  restart()
                  navigate(`/practice/${section}/${taskType}/${nextSet.id}`)
                }}
              >
                Sonraki set →
              </button>
            )}
          </div>
        </>
      )}
    </div>
  )
}
