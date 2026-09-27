import { useRef, useState } from 'react'
import { taskInfo } from '../../data/taskInfo'
import { useCountdown } from '../../lib/hooks'
import type { BuildSentenceSet } from '../../types'
import { ProgressDots, TaskHeader, TimerBadge, type TaskProps } from '../ui'

function shuffle<T>(arr: T[]): T[] {
  if (arr.length < 2) return [...arr]
  let out: T[]
  do {
    out = [...arr]
    for (let i = out.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[out[i], out[j]] = [out[j], out[i]]
    }
  } while (out.every((x, i) => x === arr[i]))
  return out
}

export default function BuildSentence({ set, onSubmit }: TaskProps<BuildSentenceSet>) {
  const [banks] = useState(() => set.items.map((it) => shuffle(it.chunks)))
  // placed[i] = indices into banks[i], in the order the user arranged them
  const [placed, setPlaced] = useState<number[][]>(() => set.items.map(() => []))
  const [current, setCurrent] = useState(0)
  const dragFrom = useRef<number | null>(null)
  const placedRef = useRef(placed)
  placedRef.current = placed

  const submit = () =>
    onSubmit({ type: 'buildSentence', answers: placedRef.current.map((p, i) => p.map((k) => banks[i][k])) })
  const left = useCountdown(taskInfo('buildSentence').timeLimit, true, submit)

  const item = set.items[current]
  const bank = banks[current]
  const mine = placed[current]

  const update = (fn: (p: number[]) => number[]) => setPlaced((prev) => prev.map((p, i) => (i === current ? fn(p) : p)))
  const add = (k: number) => update((p) => [...p, k])
  const remove = (pos: number) => update((p) => p.filter((_, i) => i !== pos))
  const move = (from: number, to: number) =>
    update((p) => {
      const copy = [...p]
      const [x] = copy.splice(from, 1)
      copy.splice(to, 0, x)
      return copy
    })

  return (
    <div className="card">
      <TaskHeader
        title="Build a Sentence"
        subtitle="Kelime gruplarına tıklayarak cevabı oluştur. Cevaptaki parçaları sürükleyerek yerini değiştirebilir, tıklayarak geri alabilirsin."
        right={
          <>
            <ProgressDots total={set.items.length} current={current} />
            <TimerBadge seconds={left} />
          </>
        }
      />

      <div className="space-y-5">
        <div className="flex items-start gap-3">
          <span className="text-2xl">🧑</span>
          <div className="rounded-2xl rounded-tl-none bg-slate-100 px-4 py-2">{item.context}</div>
        </div>
        <div className="flex items-start justify-end gap-3">
          <div
            className="flex min-h-14 min-w-[60%] flex-wrap items-center gap-2 rounded-2xl rounded-tr-none border-2 border-dashed border-brand-500 bg-brand-50 px-3 py-2"
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => {
              if (dragFrom.current !== null) move(dragFrom.current, mine.length - 1)
              dragFrom.current = null
            }}
          >
            {mine.length === 0 && <span className="text-sm text-slate-400">Cevabın burada oluşacak...</span>}
            {mine.map((k, pos) => (
              <button
                key={`${k}-${pos}`}
                draggable
                onDragStart={() => (dragFrom.current = pos)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.stopPropagation()
                  if (dragFrom.current !== null && dragFrom.current !== pos) move(dragFrom.current, pos)
                  dragFrom.current = null
                }}
                onClick={() => remove(pos)}
                className="cursor-grab rounded-md bg-brand-500 px-3 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-brand-600"
              >
                {bank[k]}
              </button>
            ))}
            {mine.length > 0 && <span className="text-lg">.</span>}
          </div>
          <span className="text-2xl">🙋</span>
        </div>

        <div className="flex flex-wrap justify-center gap-2 rounded-lg bg-slate-50 p-4">
          {bank.map((chunk, k) =>
            mine.includes(k) ? (
              <span key={k} className="rounded-md border border-dashed border-slate-300 px-3 py-1.5 text-sm text-transparent">
                {chunk}
              </span>
            ) : (
              <button
                key={k}
                onClick={() => add(k)}
                className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium shadow-sm hover:border-brand-500 hover:bg-brand-50"
              >
                {chunk}
              </button>
            ),
          )}
        </div>
      </div>

      <div className="mt-6 flex justify-between">
        <button className="btn-secondary" disabled={current === 0} onClick={() => setCurrent((c) => c - 1)}>
          ← Önceki
        </button>
        {current < set.items.length - 1 ? (
          <button className="btn-primary" onClick={() => setCurrent((c) => c + 1)}>
            Sonraki →
          </button>
        ) : (
          <button className="btn-primary" onClick={submit}>
            Gönder
          </button>
        )}
      </div>
    </div>
  )
}
