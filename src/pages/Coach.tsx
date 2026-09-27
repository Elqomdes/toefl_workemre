import { useState } from 'react'
import { Link } from 'react-router-dom'
import { analyzeRecentActivities } from '../lib/ai'
import { activityCount, COACH_MIN_ACTIVITIES } from '../lib/progress'
import { getAttempts, getCoachAdvice, hasAIKey, saveCoachAdvice } from '../lib/storage'
import type { CoachAdvice } from '../types'

export default function Coach() {
  const attempts = getAttempts()
  const count = activityCount(attempts)
  const [coach, setCoach] = useState<CoachAdvice | null>(getCoachAdvice)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>()
  const ready = count >= COACH_MIN_ACTIVITIES
  const stale = !!(coach && count > coach.activityCount)

  const generate = async () => {
    setLoading(true)
    setError(undefined)
    try {
      const advice = await analyzeRecentActivities(attempts)
      saveCoachAdvice(advice)
      setCoach(advice)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Yapay Zeka Önerileri</h1>
        <p className="mt-1 text-sm text-slate-600">
          Son aktivitelerindeki hatalara bakıp hangi bölümü nasıl çalışman gerektiğini söyler. En az {COACH_MIN_ACTIVITIES} aktivite
          gerekir.
        </p>
      </div>

      <div className="card space-y-4 border-violet-200 bg-violet-50/50">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-violet-900">
            Tamamlanan aktivite: <b>{count}</b>
          </p>
          <span className="rounded-full bg-white px-3 py-1 text-sm font-semibold text-violet-800 shadow-sm">
            {Math.min(count, COACH_MIN_ACTIVITIES)} / {COACH_MIN_ACTIVITIES}
          </span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-violet-100">
          <div className="h-full bg-violet-600" style={{ width: `${Math.min(100, (count / COACH_MIN_ACTIVITIES) * 100)}%` }} />
        </div>

        {!ready && (
          <p className="text-sm text-violet-900">
            Öneriler için {COACH_MIN_ACTIVITIES - count} aktivite daha çöz.{' '}
            <Link to="/practice/reading" className="underline">
              Pratiğe git
            </Link>
          </p>
        )}

        {ready && !hasAIKey() && (
          <p className="text-sm text-amber-800">
            API anahtarı gerekli.{' '}
            <Link to="/settings" className="underline">
              Ayarlara git
            </Link>
          </p>
        )}

        {ready && hasAIKey() && (
          <div className="flex flex-wrap gap-2">
            <button className="btn-primary" onClick={generate} disabled={loading}>
              {loading ? 'Analiz ediliyor...' : coach ? 'Önerileri güncelle' : 'Önerileri oluştur'}
            </button>
            {stale && <span className="self-center text-xs text-violet-700">Yeni aktiviteler var, güncellemen iyi olur.</span>}
          </div>
        )}
        {error && <p className="text-sm text-rose-700">{error}</p>}
      </div>

      {coach && (
        <div className="card space-y-4">
          <p className="text-xs text-slate-400">
            {new Date(coach.date).toLocaleString('tr-TR')} · {coach.activityCount} aktiviteye göre
          </p>
          <p className="leading-relaxed text-slate-700">{coach.summary}</p>
          {coach.weakest.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {coach.weakest.map((w) => (
                <span key={w} className="rounded-full bg-rose-50 px-2.5 py-1 text-xs font-medium text-rose-700">
                  {w}
                </span>
              ))}
            </div>
          )}
          <div className="grid gap-3 md:grid-cols-2">
            {coach.recommendations.map((r, i) => (
              <div key={i} className="rounded-lg border border-slate-200 p-4">
                <p className="font-semibold">{r.title}</p>
                <p className="mt-1 text-sm text-slate-600">{r.why}</p>
                <p className="mt-2 text-sm text-slate-800">{r.action}</p>
                {r.href && (
                  <Link to={r.href} className="mt-3 inline-block text-sm font-medium text-brand-600 hover:underline">
                    Çalışmaya git →
                  </Link>
                )}
              </div>
            ))}
          </div>
          {coach.practicePlan.length > 0 && (
            <div>
              <p className="mb-2 font-semibold">Sıradaki plan</p>
              <ol className="list-decimal space-y-1 pl-5 text-sm text-slate-700">
                {coach.practicePlan.map((p, i) => (
                  <li key={i}>{p}</li>
                ))}
              </ol>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
