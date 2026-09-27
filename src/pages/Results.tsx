import { Link, useParams } from 'react-router-dom'
import TaskResultView from '../components/TaskResultView'
import { SECTION_NAMES } from '../data/taskInfo'
import { bandColor, cefr, oldScaleEquivalent, oldSectionEquivalent } from '../lib/scoring'
import { getSessionAttempt } from '../lib/session'
import { getAttempt } from '../lib/storage'

const BAND_DESC: Record<string, string> = {
  C2: 'Üst düzey yetkin kullanıcı',
  C1: 'Yetkin kullanıcı: çoğu üniversitenin istediği seviye',
  B2: 'Bağımsız kullanıcı (üst orta)',
  B1: 'Bağımsız kullanıcı (orta)',
  A2: 'Temel kullanıcı',
  A1: 'Başlangıç',
}

export function BandGauge({ band }: { band: number }) {
  return (
    <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-200">
      <div
        className={`h-full rounded-full ${band >= 5 ? 'bg-emerald-500' : band >= 4 ? 'bg-sky-500' : band >= 3 ? 'bg-amber-500' : 'bg-rose-500'}`}
        style={{ width: `${(band / 6) * 100}%` }}
      />
    </div>
  )
}

export default function Results() {
  const { attemptId = '' } = useParams()
  const attempt = getSessionAttempt(attemptId) ?? getAttempt(attemptId)

  if (!attempt) {
    return (
      <div className="card">
        Sonuç bulunamadı. <Link to="/history" className="text-brand-600 underline">Geçmişe dön</Link>
      </div>
    )
  }

  const level = attempt.overall !== null ? cefr(attempt.overall) : null

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold">{attempt.label}</h1>
          <p className="text-sm text-slate-500">{new Date(attempt.date).toLocaleString('tr-TR')}</p>
        </div>
        <div className="flex gap-2">
          <Link to="/history" className="btn-secondary">
            Geçmiş
          </Link>
          <Link to="/full-test" className="btn-primary">
            Yeni deneme
          </Link>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="card flex flex-col items-center justify-center text-center">
          <p className="text-sm font-semibold tracking-wide text-slate-500 uppercase">Genel Puan</p>
          {attempt.overall !== null ? (
            <>
              <p className={`my-2 text-6xl font-extrabold ${bandColor(attempt.overall)}`}>{attempt.overall.toFixed(1)}</p>
              <p className="text-sm text-slate-500">/ 6.0 band</p>
              <p className="mt-3 rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold">
                CEFR {level} · {BAND_DESC[level!]}
              </p>
              <p className="mt-2 text-xs text-slate-500">Eski 0-120 ölçeğinde yaklaşık: {oldScaleEquivalent(attempt.overall)}</p>
            </>
          ) : (
            <p className="mt-3 text-sm text-slate-500">Genel puan için dört bölümün de puanlanmış olması gerekir.</p>
          )}
        </div>
        <div className="card lg:col-span-2">
          <p className="mb-4 text-sm font-semibold tracking-wide text-slate-500 uppercase">Bölüm Puanları</p>
          <div className="space-y-4">
            {attempt.sections.map((s) => (
              <div key={s.section}>
                <div className="mb-1 flex items-baseline justify-between">
                  <span className="font-semibold">
                    {SECTION_NAMES[s.section].en} <span className="text-sm font-normal text-slate-500">· {SECTION_NAMES[s.section].tr}</span>
                  </span>
                  <span>
                    <span className={`text-xl font-bold ${bandColor(s.band)}`}>{s.band.toFixed(1)}</span>
                    <span className="ml-2 text-xs text-slate-500">
                      %{Math.round(s.percent)} · CEFR {cefr(s.band)} · eski ≈ {oldSectionEquivalent(s.band)}/30
                    </span>
                  </span>
                </div>
                <BandGauge band={s.band} />
              </div>
            ))}
          </div>
        </div>
      </div>

      <h2 className="text-xl font-bold">Görev Detayları</h2>
      <div className="space-y-4">
        {attempt.results.map((r, i) => (
          <TaskResultView key={i} result={r} />
        ))}
      </div>
    </div>
  )
}
