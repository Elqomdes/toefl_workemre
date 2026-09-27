import { QUESTION_BANK } from '../data/questions'
import type { TaskResult } from '../types'
import { parseCompleteWords } from './evaluate'

export interface VocabItem {
  word: string
  context: string
  source: string
  misses: number
  reviews: number
  streak: number
  learned: boolean
  addedAt: string
  lastReviewedAt?: string
}

const KEY = 'toefl.vocab'

function read(): VocabItem[] {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as VocabItem[]) : []
  } catch {
    return []
  }
}

function write(items: VocabItem[]) {
  localStorage.setItem(KEY, JSON.stringify(items))
}

export function getVocab(): VocabItem[] {
  return read().sort((a, b) => {
    if (a.learned !== b.learned) return a.learned ? 1 : -1
    if (b.misses !== a.misses) return b.misses - a.misses
    return a.word.localeCompare(b.word)
  })
}

export const vocabStats = (items = getVocab()) => ({
  total: items.length,
  due: items.filter((i) => !i.learned).length,
  missed: items.filter((i) => i.misses > 0).length,
  learned: items.filter((i) => i.learned).length,
})

function sentenceAround(text: string, word: string) {
  const parts = text.match(/[^.!?]+[.!?]+|[^.!?]+$/g) ?? [text]
  const found = parts.find((s) => new RegExp(`\\b${word}\\b`, 'i').test(s))
  return (found ?? text).replace(/\s+/g, ' ').trim()
}

function plainParagraph(paragraph: string) {
  return paragraph.replace(/\[([^|\]]*)\|([^\]]+)\]/g, '$1$2')
}

function upsert(wordRaw: string, context: string, source: string, missed: boolean) {
  const word = wordRaw.replace(/[^a-zA-Z'-]/g, '').toLowerCase()
  if (word.length < 3) return
  const items = read()
  const prev = items.find((i) => i.word === word)
  if (!prev) {
    items.push({
      word,
      context: context || word,
      source,
      misses: missed ? 1 : 0,
      reviews: 0,
      streak: 0,
      learned: false,
      addedAt: new Date().toISOString(),
    })
  } else {
    if (context && context.length > prev.context.length) prev.context = context
    if (source && !prev.source.includes(source)) prev.source = `${prev.source} · ${source}`
    if (missed) {
      prev.misses += 1
      prev.learned = false
      prev.streak = 0
    }
  }
  write(items)
}

export function harvestFromResults(results: TaskResult[]) {
  for (const r of results) {
    if (r.taskType === 'completeWords') {
      for (const it of r.items) {
        if (!it.correctAnswer) continue
        upsert(it.correctAnswer, it.prompt ?? it.correctAnswer, r.setTitle, it.earned < it.possible)
      }
    }
    if (r.taskType === 'dailyLife' || r.taskType === 'academicReading') {
      for (const it of r.items) {
        if (it.earned >= it.possible) continue
        const quoted = it.prompt?.match(/[“"]([A-Za-z][A-Za-z'-]+)[”"]/)
        if (quoted) upsert(quoted[1], it.prompt ?? '', r.setTitle, true)
      }
    }
  }
}

/** Adds every Complete-the-Words item from the built-in bank so the page is never empty. */
export function seedBankWords() {
  for (const set of QUESTION_BANK) {
    if (set.type !== 'completeWords') continue
    const plain = plainParagraph(set.paragraph)
    for (const seg of parseCompleteWords(set.paragraph)) {
      if (seg.kind !== 'blank') continue
      const word = seg.shown + seg.missing
      upsert(word, sentenceAround(plain, word), set.title, false)
    }
  }
}

export function markReview(word: string, correct: boolean) {
  const items = read()
  const it = items.find((i) => i.word === word)
  if (!it) return
  it.reviews += 1
  it.lastReviewedAt = new Date().toISOString()
  if (correct) {
    it.streak += 1
    if (it.streak >= 2) it.learned = true
  } else {
    it.misses += 1
    it.streak = 0
    it.learned = false
  }
  write(items)
}

export function setLearned(word: string, learned: boolean) {
  const items = read()
  const it = items.find((i) => i.word === word)
  if (!it) return
  it.learned = learned
  it.streak = learned ? Math.max(it.streak, 2) : 0
  write(items)
}

export function deleteVocab(word: string) {
  write(read().filter((i) => i.word !== word))
}

export function clearVocab() {
  write([])
}

export function dueWords(onlyMissed = false): VocabItem[] {
  return getVocab().filter((i) => !i.learned && (!onlyMissed || i.misses > 0))
}

export function blankContext(item: VocabItem) {
  const re = new RegExp(`\\b${item.word}\\b`, 'i')
  if (re.test(item.context)) return item.context.replace(re, '______')
  return `______ (${item.source})`
}
