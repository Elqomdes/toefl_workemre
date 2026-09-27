import { useState } from 'react'
import { taskInfo } from '../data/taskInfo'
import { bandColor, percentToBand } from '../lib/scoring'
import { getSetById } from '../lib/storage'
import type { AIFeedback, DiffToken, ItemFeedback, TaskResult } from '../types'

export function DiffView({ tokens }: { tokens: DiffToken[] }) {
  return (
    <p className="flex flex-wrap gap-x-1.5 gap-y-1 leading-relaxed">
      {tokens.map((t, i) => {
        if (t.status === 'ok') return <span key={i} className="text-emerald-700">{t.word}</span>
        if (t.status === 'missing')
          return (
            <span key={i} className="rounded bg-rose-100 px-1 text-rose-700 line-through" title="Söylenmedi">
              {t.word}
            </span>
          )
        if (t.status === 'wrong')
          return (
            <span key={i} className="rounded bg-amber-100 px-1 text-amber-800" title={`Duyulan: "${t.heard}"`}>
              {t.word} <span className="text-xs text-amber-600">({t.heard})</span>
            </span>
          )
        return (
          <span key={i} className="rounded bg-slate-200 px-1 text-xs text-slate-500" title="Fazladan söylendi">
            +{t.word}
          </span>
        )
      })}
    </p>
  )
}

const SUBSCORE_TR: Record<string, string> = {
  task_completion: 'Görev tamamlama',
  organization: 'Organizasyon',
  tone_register: 'Üslup',
  language_use: 'Dil kullanımı',
  relevance: 'Konuya uygunluk',
  elaboration: 'Detaylandırma',
  language_variety: 'Dil çeşitliliği',
  accuracy: 'Doğruluk',
  delivery: 'Akıcılık ve telaffuz',
  topic_development: 'Konu gelişimi',
}

export function AIFeedbackView({ fb }: { fb: AIFeedback }) {
  return (
    <div className="mt-3 space-y-3 rounded-lg border border-violet-200 bg-violet-50/50 p-4 text-sm">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-md bg-violet-600 px-2 py-0.5 text-xs font-semibold text-white">AI Değerlendirme</span>
        <span className="font-bold">{fb.score} / 5</span>
        {fb.subscores &&
          Object.entries(fb.subscores).map(([k, v]) => (
            <span key={k} className="rounded-md bg-white px-2 py-0.5 text-xs text-slate-600 shadow-sm">
              {SUBSCORE_TR[k] ?? k}: <b>{v}</b>
            </span>
          ))}
      </div>
      {fb.strengths.length > 0 && (
        <div>
          <p className="font-semibold text-emerald-700">Güçlü yönler</p>
          <ul className="list-disc pl-5">
            {fb.strengths.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </div>
      )}
      {fb.weaknesses.length > 0 && (
        <div>
          <p className="font-semibold text-rose-700">Geliştirilmesi gerekenler</p>
          <ul className="list-disc pl-5">
            {fb.weaknesses.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </div>
      )}
      {fb.tips.length > 0 && (
        <div>
          <p className="font-semibold text-sky-700">İpuçları</p>
          <ul className="list-disc pl-5">
            {fb.tips.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </div>
      )}
      {fb.corrected_version && (
        <details className="rounded-md bg-white p-3">
          <summary className="cursor-pointer font-semibold text-slate-700">Geliştirilmiş örnek cevap</summary>
          <p className="mt-2 whitespace-pre-line text-slate-700">{fb.corrected_version}</p>
        </details>
      )}
    </div>
  )
}

function ItemRow({ item }: { item: ItemFeedback }) {
  const [open, setOpen] = useState(!!item.ai || !!item.diff)
  const ok = item.possible > 0 && item.earned === item.possible
  const partial = item.possible > 0 && item.earned > 0 && !ok
  return (
    <div className="rounded-lg border border-slate-200">
      <button onClick={() => setOpen((o) => !o)} className="flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left text-sm">
        <span className="flex items-center gap-2">
          <span
            className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold text-white ${item.possible === 0 ? 'bg-slate-400' : ok ? 'bg-emerald-500' : partial ? 'bg-amber-500' : 'bg-rose-500'}`}
          >
            {item.possible === 0 ? '–' : ok ? '✓' : partial ? '~' : '✗'}
          </span>
          <span className="font-medium">{item.label}</span>
          {item.prompt && <span className="line-clamp-1 text-slate-500">{item.prompt}</span>}
        </span>
        <span className="shrink-0 font-semibold">{item.possible > 0 ? `${item.earned}/${item.possible}` : 'puanlanmadı'}</span>
      </button>
      {open && (
        <div className="space-y-2 border-t border-slate-100 px-4 py-3 text-sm">
          {item.prompt && item.prompt.length > 60 && <p className="text-slate-600">{item.prompt}</p>}
          {item.diff ? (
            <>
              <p className="text-slate-500">
                Hedef cümle: <span className="text-slate-800">{item.correctAnswer}</span>
              </p>
              <p className="text-slate-500">
                Algılanan: <span className="text-slate-800 italic">{item.userAnswer}</span>
              </p>
              <DiffView tokens={item.diff} />
            </>
          ) : (
            <>
              {item.userAnswer !== undefined && !item.ai && (
                <p>
                  <span className="text-slate-500">Senin cevabın: </span>
                  <span className={ok ? 'text-emerald-700' : 'text-rose-700'}>{item.userAnswer}</span>
                </p>
              )}
              {item.ai && item.userAnswer && (
                <details>
                  <summary className="cursor-pointer text-slate-500">Senin cevabın</summary>
                  <p className="mt-1 whitespace-pre-line rounded bg-slate-50 p-2">{item.userAnswer}</p>
                </details>
              )}
              {item.correctAnswer && !ok && (
                <p>
                  <span className="text-slate-500">Doğru cevap: </span>
                  <span className="text-emerald-700">{item.correctAnswer}</span>
                </p>
              )}
            </>
          )}
          {item.explanation && <p className="text-slate-500">💡 {item.explanation}</p>}
          {item.audioUrl && <audio controls src={item.audioUrl} className="h-9" />}
          {item.note && <p className="text-slate-500">{item.note}</p>}
          {item.ai && <AIFeedbackView fb={item.ai} />}
        </div>
      )}
    </div>
  )
}

export default function TaskResultView({ result }: { result: TaskResult }) {
  const info = taskInfo(result.taskType)
  const percent = result.possible ? (result.earned / result.possible) * 100 : 0
  const band = percentToBand(percent)
  const set = getSetById(result.setId)
  const transcript = set && 'script' in set ? set.script : null

  return (
    <div className="card space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold">{info.name}</h3>
          <p className="text-sm text-slate-500">{result.setTitle}</p>
        </div>
        {result.possible > 0 ? (
          <div className="text-right">
            <div className={`text-2xl font-bold ${bandColor(band)}`}>Band {band}</div>
            <div className="text-sm text-slate-500">
              {Math.round(result.earned * 10) / 10} / {result.possible} puan (%{Math.round(percent)})
            </div>
          </div>
        ) : (
          <div className="text-sm text-slate-500">Puanlanmadı</div>
        )}
      </div>
      {result.aiError && (
        <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
          ⚠ {result.aiError}
        </p>
      )}
      <div className="space-y-2">
        {result.items.map((it, i) => (
          <ItemRow key={i} item={it} />
        ))}
      </div>
      {transcript && (
        <details className="rounded-lg bg-slate-50 p-3 text-sm">
          <summary className="cursor-pointer font-semibold">Dinleme metni (transcript)</summary>
          <div className="mt-2 space-y-1">
            {transcript.map((l, i) => (
              <p key={i}>
                <b>{l.speaker}:</b> {l.text}
              </p>
            ))}
          </div>
        </details>
      )}
    </div>
  )
}
