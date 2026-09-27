import { useState } from 'react'
import { Link, NavLink, useParams } from 'react-router-dom'
import { SECTION_NAMES, SECTIONS, tasksOf } from '../data/taskInfo'
import { generateSet } from '../lib/ai'
import { bandColor, percentToBand } from '../lib/scoring'
import { addCustomSet, deleteCustomSet, getAttempts, getCustomSets, getSetsOfType, hasAIKey } from '../lib/storage'
import type { Section, TaskType } from '../types'

export default function SectionPractice() {
  const { section = 'reading' } = useParams<{ section: Section }>()
  const [, force] = useState(0)
  const [generating, setGenerating] = useState<TaskType | null>(null)
  const [error, setError] = useState<string>()
  const aiReady = hasAIKey()
  const customIds = new Set(getCustomSets().map((s) => s.id))

  const bestBySet = new Map<string, number>()
  for (const a of getAttempts())
    for (const r of a.results) {
      if (!r.possible) continue
      const p = (r.earned / r.possible) * 100
      bestBySet.set(r.setId, Math.max(bestBySet.get(r.setId) ?? 0, p))
    }

  const generate = async (type: TaskType) => {
    setGenerating(type)
    setError(undefined)
    try {
      addCustomSet(await generateSet(type))
      force((x) => x + 1)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setGenerating(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {SECTIONS.map((s) => (
          <NavLink
            key={s}
            to={`/practice/${s}`}
            className={({ isActive }) =>
              `rounded-lg px-4 py-2 text-sm font-semibold ${isActive ? `${SECTION_NAMES[s].color} text-white` : 'bg-white text-slate-600 shadow-sm hover:bg-slate-100'}`
            }
          >
            {SECTION_NAMES[s].en} · {SECTION_NAMES[s].tr}
          </NavLink>
        ))}
      </div>

      {error && <p className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}

      <div className="grid gap-4 md:grid-cols-2">
        {tasksOf(section as Section).map((t) => {
          const sets = getSetsOfType(t.type)
          return (
            <div key={t.type} className="card flex flex-col">
              <div className="mb-3 flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-bold">{t.name}</h3>
                  <p className="text-xs text-slate-500">{t.nameTr}</p>
                </div>
                {t.aiScored && <span className="rounded-md bg-violet-100 px-2 py-0.5 text-xs font-semibold text-violet-700">AI puanlama</span>}
              </div>
              <p className="mb-4 text-sm text-slate-600">{t.description}</p>
              <ul className="mb-4 flex-1 space-y-1.5">
                {sets.map((s) => {
                  const best = bestBySet.get(s.id)
                  return (
                    <li key={s.id} className="flex items-center justify-between gap-2 rounded-lg bg-slate-50 px-3 py-2 text-sm">
                      <span className="flex items-center gap-2">
                        {customIds.has(s.id) && <span className="rounded bg-violet-100 px-1.5 text-[10px] font-bold text-violet-700">AI</span>}
                        {s.title}
                      </span>
                      <span className="flex items-center gap-2">
                        {best !== undefined && (
                          <span className={`text-xs font-semibold ${bandColor(percentToBand(best))}`}>En iyi: %{Math.round(best)}</span>
                        )}
                        {customIds.has(s.id) && (
                          <button
                            className="text-xs text-slate-400 hover:text-rose-600"
                            title="Sil"
                            onClick={() => {
                              deleteCustomSet(s.id)
                              force((x) => x + 1)
                            }}
                          >
                            ✕
                          </button>
                        )}
                        <Link to={`/practice/${section}/${t.type}/${s.id}`} className="btn-primary px-3 py-1 text-xs">
                          Başla
                        </Link>
                      </span>
                    </li>
                  )
                })}
              </ul>
              <button
                className="btn-secondary text-xs"
                disabled={!aiReady || generating !== null}
                title={aiReady ? '' : 'Ayarlar sayfasından API anahtarı ekle'}
                onClick={() => generate(t.type)}
              >
                {generating === t.type ? 'Üretiliyor...' : '✨ Yapay zeka ile yeni set üret'}
              </button>
            </div>
          )
        })}
      </div>
      {!aiReady && (
        <p className="text-sm text-slate-500">
          İpucu: Yazma ve konuşma görevlerinin puanlanması ve yeni soru üretimi için{' '}
          <Link to="/settings" className="text-brand-600 underline">
            Ayarlar
          </Link>{' '}
          sayfasından ücretsiz bir Gemini API anahtarı ekle.
        </p>
      )}
    </div>
  )
}
