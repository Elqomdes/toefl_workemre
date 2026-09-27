import { TASKS, taskInfo } from '../data/taskInfo'
import type { Attempt, Section, TaskResult, TaskType } from '../types'

export const COACH_MIN_ACTIVITIES = 10

export function allTaskResults(attempts: Attempt[]): (TaskResult & { date: string; mode: Attempt['mode'] })[] {
  return attempts
    .slice()
    .sort((a, b) => b.date.localeCompare(a.date))
    .flatMap((a) => a.results.map((r) => ({ ...r, date: a.date, mode: a.mode })))
}

export function activityCount(attempts: Attempt[]) {
  return allTaskResults(attempts).length
}

export function taskAverages(attempts: Attempt[]) {
  return TASKS.map((t) => {
    const rs = allTaskResults(attempts).filter((r) => r.taskType === t.type && r.possible > 0)
    const percent = rs.length ? (rs.reduce((s, r) => s + r.earned / r.possible, 0) / rs.length) * 100 : null
    const wrong = rs.reduce((s, r) => s + r.items.filter((i) => i.possible > 0 && i.earned < i.possible).length, 0)
    return { ...t, count: rs.length, percent, wrong }
  }).filter((t) => t.count > 0)
}

export function recentMistakes(attempts: Attempt[], limit = 40) {
  const out: { task: string; section: Section; type: TaskType; label: string; user?: string; correct?: string; note?: string }[] = []
  for (const r of allTaskResults(attempts)) {
    const info = taskInfo(r.taskType)
    for (const it of r.items) {
      if (it.possible <= 0 || it.earned >= it.possible) continue
      out.push({
        task: `${info.name}: ${r.setTitle}`,
        section: r.section,
        type: r.taskType,
        label: it.label,
        user: it.userAnswer?.slice(0, 180),
        correct: it.correctAnswer?.slice(0, 180),
        note: it.ai?.weaknesses?.[0] ?? it.note ?? it.explanation,
      })
      if (out.length >= limit) return out
    }
  }
  return out
}

const HREF: Partial<Record<TaskType, string>> = {
  completeWords: '/practice/reading',
  dailyLife: '/practice/reading',
  academicReading: '/practice/reading',
  chooseResponse: '/practice/listening',
  conversation: '/practice/listening',
  announcement: '/practice/listening',
  academicTalk: '/practice/listening',
  buildSentence: '/practice/writing',
  email: '/practice/writing',
  discussion: '/practice/writing',
  listenRepeat: '/practice/speaking',
  interview: '/practice/speaking',
}

export const taskHref = (type: TaskType) => HREF[type] ?? '/practice/reading'
