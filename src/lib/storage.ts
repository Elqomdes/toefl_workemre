import { QUESTION_BANK } from '../data/questions'
import type { Attempt, CoachAdvice, Settings, TaskSet, TaskType } from '../types'
import { harvestFromResults } from './vocab'

const KEYS = {
  settings: 'toefl.settings',
  attempts: 'toefl.attempts',
  customSets: 'toefl.customSets',
  coach: 'toefl.coach',
}

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

function write(key: string, value: unknown) {
  localStorage.setItem(key, JSON.stringify(value))
}

export const DEFAULT_SETTINGS: Settings = {
  provider: 'gemini',
  geminiKey: '',
  openaiKey: '',
  geminiModel: 'gemini-2.5-flash',
  openaiModel: 'gpt-4o-mini',
  voiceRate: 0.95,
  pronunciationFeedback: true,
}

export function getSettings(): Settings {
  return { ...DEFAULT_SETTINGS, ...read<Partial<Settings>>(KEYS.settings, {}) }
}

export function saveSettings(s: Settings) {
  write(KEYS.settings, s)
}

export function hasAIKey(s: Settings = getSettings()) {
  return s.provider === 'gemini' ? !!s.geminiKey.trim() : !!s.openaiKey.trim()
}

// ---------- Attempts ----------
export function getAttempts(): Attempt[] {
  return read<Attempt[]>(KEYS.attempts, [])
}

export function getAttempt(id: string): Attempt | undefined {
  return getAttempts().find((a) => a.id === id)
}

export function saveAttempt(a: Attempt) {
  // audio blob URLs are only valid for this session, so they are not persisted
  const clean: Attempt = {
    ...a,
    results: a.results.map((r) => ({ ...r, items: r.items.map(({ audioUrl: _audioUrl, ...rest }) => rest) })),
  }
  const all = getAttempts().filter((x) => x.id !== a.id)
  all.push(clean)
  write(KEYS.attempts, all)
  harvestFromResults(a.results)
}

export function deleteAttempt(id: string) {
  write(
    KEYS.attempts,
    getAttempts().filter((a) => a.id !== id),
  )
}

export function clearAttempts() {
  write(KEYS.attempts, [])
}

// ---------- Question bank ----------
export function getCustomSets(): TaskSet[] {
  return read<TaskSet[]>(KEYS.customSets, [])
}

export function addCustomSet(set: TaskSet) {
  write(KEYS.customSets, [...getCustomSets(), set])
}

export function deleteCustomSet(id: string) {
  write(
    KEYS.customSets,
    getCustomSets().filter((s) => s.id !== id),
  )
}

export function getAllSets(): TaskSet[] {
  return [...QUESTION_BANK, ...getCustomSets()]
}

export function getSetsOfType(type: TaskType): TaskSet[] {
  return getAllSets().filter((s) => s.type === type)
}

export function getSetById(id: string): TaskSet | undefined {
  return getAllSets().find((s) => s.id === id)
}

export const newId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`

export function getCoachAdvice(): CoachAdvice | null {
  return read<CoachAdvice | null>(KEYS.coach, null)
}

export function saveCoachAdvice(advice: CoachAdvice) {
  write(KEYS.coach, advice)
}

export function clearCoachAdvice() {
  localStorage.removeItem(KEYS.coach)
}
