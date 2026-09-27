import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { SECTION_NAMES, SECTIONS, taskInfo } from '../data/taskInfo'
import { activityCount, allTaskResults, recentMistakes, taskAverages } from '../lib/progress'
import { bandColor, percentToBand } from '../lib/scoring'
import { clearAttempts, deleteAttempt, getAttempts } from '../lib/storage'
import type { Section } from '../types'

const LINE_COLORS: Record<string, string> = {
  overall: '#1e293b',
  reading: '#10b981',
  listening: '#0ea5e9',
  writing: '#f59e0b',
  speaking: '#f43f5e',
}

export default function History() {
  const [, force] = useState(0)
  const refresh = () => force((n) => n + 1)
  const attempts = getAttempts().sort((a, b) => b.date.localeCompare(a.date))
  const full = attempts.filter((a) => a.mode === 'full').reverse()
  const activities = allTaskResults(attempts)
  const count = activityCount(attempts)
  const [filter, setFilter] = useState<Section | 'all' | 'full'>('all')

  const chartData = full.map((a) => {
    const row: Record<string, number | string | null> = {
      name: new Date(a.date).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit' }),
      overall: a.overall,
    }
    for (const s of a.sections) row[s.section] = s.band
    return row
  })

  const practiceAvg = SECTIONS.map((section) => {
    const rs = activities.filter((r) => r.section === section && r.possible > 0).slice(0, 10)
    const percent = rs.length ? (rs.reduce((a, r) => a + r.earned / r.possible, 0) / rs.length) * 100 : null
    return { section, percent, count: rs.length }
  })

  const typeStats = taskAverages(attempts)
  const barData = typeStats.map((t) => ({ name: t.nameTr, percent: t.percent !== null ? Math.round(t.percent) : 0, wrong: t.wrong }))
  const mistakes = recentMistakes(attempts, 40).slice(0, 8)

  const visible = useMemo(() => {
    if (filter === 'full') return attempts.filter((a) => a.mode === 'full')
    if (filter === 'all') return attempts
    return attempts.filter((a) => a.results.some((r) => r.section === filter))
  }, [attempts, filter])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Geçmiş ve İlerleme</h1>
          <p className="text-sm text-slate-500">{count} aktivite · {attempts.length} kayıt</p>
        </div>
        {attempts.length > 0 && (
          <button
            className="btn-secondary text-xs"
            onClick={() => {
              if (confirm('Tüm geçmiş silinsin mi?')) {
                clearAttempts()
                refresh()
              }
            }}
          >
            Tümünü sil
          </button>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {practiceAvg.map((p) => (
          <div key={p.section} className="card">
            <p className="text-sm text-slate-500">{SECTION_NAMES[p.section].en} ortalaması</p>
            {p.percent !== null ? (
              <p className={`text-3xl font-bold ${bandColor(percentToBand(p.percent))}`}>
                {percentToBand(p.percent).toFixed(1)} <span className="text-sm font-normal text-slate-500">band · %{Math.round(p.percent)}</span>
              </p>
            ) : (
              <p className="text-lg text-slate-400">Henüz yok</p>
            )}
            <p className="text-xs text-slate-400">{p.count} aktivite</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="card">
          <h2 className="mb-4 font-semibold">Deneme sınavı band puanları</h2>
          {chartData.length ? (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" fontSize={12} />
                  <YAxis domain={[1, 6]} ticks={[1, 2, 3, 4, 5, 6]} fontSize={12} />
                  <Tooltip />
                  <Legend />
                  {['overall', ...SECTIONS].map((k) => (
                    <Line
                      key={k}
                      type="monotone"
                      dataKey={k}
                      name={k === 'overall' ? 'Genel' : SECTION_NAMES[k as keyof typeof SECTION_NAMES].en}
                      stroke={LINE_COLORS[k]}
                      strokeWidth={k === 'overall' ? 3 : 2}
                      dot
                      connectNulls
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-sm text-slate-500">
              Henüz deneme sınavı yok.{' '}
              <Link to="/full-test" className="text-brand-600 underline">
                İlk denemeni çöz
              </Link>
            </p>
          )}
        </div>

        <div className="card">
          <h2 className="mb-4 font-semibold">Görev türü başarısı</h2>
          {barData.length ? (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} layout="vertical" margin={{ left: 24 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis type="number" domain={[0, 100]} fontSize={12} />
                  <YAxis type="category" dataKey="name" width={110} fontSize={11} />
                  <Tooltip />
                  <Bar dataKey="percent" name="%" fill="#2563eb" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-sm text-slate-500">Görev çözdükçe burası dolacak.</p>
          )}
        </div>
      </div>

      {mistakes.length > 0 && (
        <div className="card">
          <h2 className="mb-3 font-semibold">Son hatalar</h2>
          <ul className="space-y-2 text-sm">
            {mistakes.map((m, i) => (
              <li key={i} className="rounded-lg bg-slate-50 px-3 py-2">
                <p className="font-medium">
                  {m.task} <span className="font-normal text-slate-500">· {m.label}</span>
                </p>
                {m.user && (
                  <p className="text-rose-700">
                    Sen: {m.user}
                    {m.correct ? <span className="text-emerald-700"> · Doğru: {m.correct}</span> : null}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="card">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-semibold">Tüm kayıtlar</h2>
          <div className="flex flex-wrap gap-1">
            {(['all', ...SECTIONS, 'full'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`rounded-md px-2.5 py-1 text-xs font-medium ${filter === f ? 'bg-brand-500 text-white' : 'bg-slate-100 text-slate-600'}`}
              >
                {f === 'all' ? 'Tümü' : f === 'full' ? 'Deneme' : SECTION_NAMES[f].en}
              </button>
            ))}
          </div>
        </div>
        {visible.length === 0 && <p className="text-sm text-slate-500">Bu filtrede kayıt yok.</p>}
        <ul className="divide-y divide-slate-100">
          {visible.map((a) => {
            const r = a.results[0]
            const pct = a.mode === 'practice' && r?.possible ? (r.earned / r.possible) * 100 : null
            return (
              <li key={a.id} className="py-3 text-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <Link to={`/results/${a.id}`} className="font-medium text-brand-700 hover:underline">
                      {a.label}
                    </Link>
                    <p className="text-xs text-slate-500">
                      {new Date(a.date).toLocaleString('tr-TR')} · {a.mode === 'full' ? 'Deneme sınavı' : `Pratik · ${taskInfo(r.taskType).name}`}
                    </p>
                    {a.results.length > 1 && (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {a.results.map((res, i) => {
                          const p = res.possible ? Math.round((res.earned / res.possible) * 100) : 0
                          return (
                            <span key={i} className="rounded bg-slate-100 px-1.5 py-0.5 text-[11px] text-slate-600">
                              {taskInfo(res.taskType).nameTr} %{p}
                            </span>
                          )
                        })}
                      </div>
                    )}
                    {a.mode === 'practice' && r && (
                      <p className="mt-1 text-xs text-slate-500">
                        {r.items.filter((i) => i.possible > 0 && i.earned < i.possible).length} yanlış madde / {r.items.length}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    {a.mode === 'full' ? (
                      a.overall !== null ? (
                        <span className={`font-bold ${bandColor(a.overall)}`}>Genel {a.overall.toFixed(1)}</span>
                      ) : (
                        <span className="text-slate-500">
                          {a.sections.map((s) => `${SECTION_NAMES[s.section].en[0]} ${s.band}`).join(' · ')}
                        </span>
                      )
                    ) : pct !== null ? (
                      <span className={`font-semibold ${bandColor(percentToBand(pct))}`}>
                        %{Math.round(pct)} · Band {percentToBand(pct)}
                      </span>
                    ) : (
                      <span className="text-slate-400">puanlanmadı</span>
                    )}
                    <button
                      className="text-slate-400 hover:text-rose-600"
                      title="Sil"
                      onClick={() => {
                        deleteAttempt(a.id)
                        refresh()
                      }}
                    >
                      ✕
                    </button>
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}
