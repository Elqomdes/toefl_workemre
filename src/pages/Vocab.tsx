import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { gloss } from '../data/glossary'
import { speak } from '../lib/speech'
import {
  blankContext,
  clearVocab,
  deleteVocab,
  dueWords,
  getVocab,
  markReview,
  seedBankWords,
  setLearned,
  vocabStats,
  type VocabItem,
} from '../lib/vocab'

type Mode = 'home' | 'cards' | 'type'
type Filter = 'due' | 'missed' | 'learned' | 'all'

function shuffle<T>(arr: T[]) {
  const out = [...arr]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

function Meaning({ word }: { word: string }) {
  const g = gloss(word)
  if (!g) return <p className="text-sm text-slate-500">Cümledeki anlamına bakarak öğren. Sözlükte henüz Türkçe karşılık yok.</p>
  return (
    <div className="text-sm">
      <p className="text-lg font-semibold text-slate-800">{g.tr}</p>
      <p className="text-slate-500">{g.hint}</p>
    </div>
  )
}

export default function Vocab() {
  const [, force] = useState(0)
  const refresh = () => force((n) => n + 1)

  useEffect(() => {
    if (getVocab().length === 0) {
      seedBankWords()
      refresh()
    }
  }, [])
  const [mode, setMode] = useState<Mode>('home')
  const [filter, setFilter] = useState<Filter>('due')
  const [queue, setQueue] = useState<VocabItem[]>([])
  const [idx, setIdx] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [typed, setTyped] = useState('')
  const [checked, setChecked] = useState<null | boolean>(null)

  const items = getVocab()
  const stats = vocabStats(items)
  const current = queue[idx]

  const listed = useMemo(() => {
    if (filter === 'missed') return items.filter((i) => i.misses > 0)
    if (filter === 'learned') return items.filter((i) => i.learned)
    if (filter === 'due') return items.filter((i) => !i.learned)
    return items
  }, [items, filter])

  const start = (kind: Mode, onlyMissed = false) => {
    seedBankWords()
    const q = shuffle(dueWords(onlyMissed))
    if (!q.length) return
    setQueue(q)
    setIdx(0)
    setFlipped(false)
    setTyped('')
    setChecked(null)
    setMode(kind)
  }

  const next = () => {
    setFlipped(false)
    setTyped('')
    setChecked(null)
    if (idx + 1 >= queue.length) {
      setMode('home')
      refresh()
      return
    }
    setIdx((i) => i + 1)
  }

  const answerCard = (knew: boolean) => {
    if (!current) return
    markReview(current.word, knew)
    next()
  }

  const checkType = () => {
    if (!current) return
    const ok = typed.trim().toLowerCase() === current.word
    setChecked(ok)
    markReview(current.word, ok)
  }

  if (mode !== 'home' && current) {
    return (
      <div className="mx-auto max-w-2xl space-y-4">
        <div className="flex items-center justify-between text-sm">
          <button
            className="text-brand-600 hover:underline"
            onClick={() => {
              setMode('home')
              refresh()
            }}
          >
            ← Listeye dön
          </button>
          <span className="text-slate-500">
            {idx + 1} / {queue.length}
          </span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-slate-200">
          <div className="h-full bg-brand-500" style={{ width: `${(idx / queue.length) * 100}%` }} />
        </div>

        <div className="card space-y-5">
          <p className="text-xs font-semibold tracking-wide text-slate-400 uppercase">{current.source}</p>
          <p className="text-lg leading-relaxed">{blankContext(current)}</p>

          {mode === 'cards' && (
            <>
              {!flipped ? (
                <button className="btn-primary w-full" onClick={() => setFlipped(true)}>
                  Cevabı göster
                </button>
              ) : (
                <div className="space-y-4 rounded-lg bg-slate-50 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-2xl font-bold text-brand-700">{current.word}</p>
                    <button className="btn-secondary text-xs" onClick={() => speak(current.word, 'female', 0.9)}>
                      🔊 Dinle
                    </button>
                  </div>
                  <Meaning word={current.word} />
                  <div className="flex gap-2">
                    <button className="btn flex-1 bg-rose-100 text-rose-800 hover:bg-rose-200" onClick={() => answerCard(false)}>
                      Tekrar et
                    </button>
                    <button className="btn flex-1 bg-emerald-600 text-white hover:bg-emerald-700" onClick={() => answerCard(true)}>
                      Biliyorum
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

          {mode === 'type' && (
            <>
              <input
                className="input text-center text-lg"
                value={typed}
                onChange={(e) => setTyped(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && checked === null && checkType()}
                placeholder="Kelimeyi yaz"
                autoFocus
                disabled={checked !== null}
                spellCheck={false}
              />
              {checked === null ? (
                <button className="btn-primary w-full" onClick={checkType} disabled={!typed.trim()}>
                  Kontrol et
                </button>
              ) : (
                <div className={`space-y-3 rounded-lg p-4 ${checked ? 'bg-emerald-50' : 'bg-rose-50'}`}>
                  <p className={`font-semibold ${checked ? 'text-emerald-700' : 'text-rose-700'}`}>
                    {checked ? 'Doğru' : `Yanlış · doğru: ${current.word}`}
                  </p>
                  <Meaning word={current.word} />
                  <button className="btn-primary w-full" onClick={next}>
                    {idx + 1 >= queue.length ? 'Bitir' : 'Sonraki'}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Kelime Çalışması</h1>
        <p className="mt-1 text-sm text-slate-600">
          Reading’de Complete the Words çözerken yanlış yaptığın kelimeler buraya düşer. Soru bankasındaki kelimelerle de çalışabilirsin.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="card">
          <p className="text-xs text-slate-500">Çalışılacak</p>
          <p className="text-3xl font-bold text-brand-700">{stats.due}</p>
        </div>
        <div className="card">
          <p className="text-xs text-slate-500">Yanlış yapılan</p>
          <p className="text-3xl font-bold text-rose-600">{stats.missed}</p>
        </div>
        <div className="card">
          <p className="text-xs text-slate-500">Öğrenildi</p>
          <p className="text-3xl font-bold text-emerald-600">{stats.learned}</p>
        </div>
      </div>

      <div className="card flex flex-wrap gap-2">
        <button className="btn-primary" onClick={() => start('cards', stats.missed > 0)} disabled={stats.due === 0 && stats.missed === 0}>
          Kartlarla çalış
        </button>
        <button className="btn-secondary" onClick={() => start('type', stats.missed > 0)} disabled={stats.due === 0 && stats.missed === 0}>
          Yazarak çalış
        </button>
        <button
          className="btn-secondary"
          onClick={() => {
            seedBankWords()
            refresh()
          }}
        >
          Bankadaki kelimeleri ekle
        </button>
        <Link to="/practice/reading" className="btn-secondary">
          Reading’e git
        </Link>
        {items.length > 0 && (
          <button
            className="btn-secondary ml-auto text-xs"
            onClick={() => {
              if (confirm('Kelime listen silinsin mi?')) {
                clearVocab()
                refresh()
              }
            }}
          >
            Listeyi temizle
          </button>
        )}
      </div>

      <div className="card">
        <div className="mb-3 flex flex-wrap gap-2">
          {(
            [
              ['due', 'Çalışılacak'],
              ['missed', 'Yanlışların'],
              ['learned', 'Öğrenilenler'],
              ['all', 'Tümü'],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              onClick={() => setFilter(id)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium ${filter === id ? 'bg-brand-500 text-white' : 'bg-slate-100 text-slate-600'}`}
            >
              {label}
            </button>
          ))}
        </div>
        {listed.length === 0 && (
          <p className="text-sm text-slate-500">
            Burada henüz kelime yok. Complete the Words çöz veya “Bankadaki kelimeleri ekle”ye bas.
          </p>
        )}
        <ul className="divide-y divide-slate-100">
          {listed.map((it) => {
            const g = gloss(it.word)
            return (
              <li key={it.word} className="flex flex-wrap items-start justify-between gap-3 py-3">
                <div>
                  <p className="font-semibold">
                    {it.word}{' '}
                    {it.misses > 0 && <span className="text-xs font-normal text-rose-600">· {it.misses} yanlış</span>}
                    {it.learned && <span className="ml-1 rounded bg-emerald-100 px-1.5 text-[10px] font-bold text-emerald-700">öğrenildi</span>}
                  </p>
                  <p className="text-sm text-slate-500">{g ? g.tr : it.context}</p>
                  <p className="text-xs text-slate-400">{it.source}</p>
                </div>
                <div className="flex gap-2">
                  <button className="btn-secondary px-2 py-1 text-xs" onClick={() => speak(it.word, 'female', 0.9)}>
                    🔊
                  </button>
                  <button
                    className="btn-secondary px-2 py-1 text-xs"
                    onClick={() => {
                      setLearned(it.word, !it.learned)
                      refresh()
                    }}
                  >
                    {it.learned ? 'Geri al' : 'Biliyorum'}
                  </button>
                  <button
                    className="text-xs text-slate-400 hover:text-rose-600"
                    onClick={() => {
                      deleteVocab(it.word)
                      refresh()
                    }}
                  >
                    Sil
                  </button>
                </div>
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}
