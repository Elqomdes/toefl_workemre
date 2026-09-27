import { taskInfo } from '../data/taskInfo'
import type { ItemFeedback, MCQ, TaskResponse, TaskResult, TaskSet } from '../types'
import { improveTranscripts, repeatPronunciation, scoreDiscussion, scoreEmail, scoreInterview } from './ai'
import { alignWords, repeatScore } from './scoring'

export type CWSegment = { kind: 'text'; text: string } | { kind: 'blank'; shown: string; missing: string; index: number }

export function parseCompleteWords(paragraph: string): CWSegment[] {
  const segs: CWSegment[] = []
  const re = /\[([^|\]]*)\|([^\]]+)\]/g
  let last = 0
  let index = 0
  let m: RegExpExecArray | null
  while ((m = re.exec(paragraph))) {
    if (m.index > last) segs.push({ kind: 'text', text: paragraph.slice(last, m.index) })
    segs.push({ kind: 'blank', shown: m[1], missing: m[2], index: index++ })
    last = m.index + m[0].length
  }
  if (last < paragraph.length) segs.push({ kind: 'text', text: paragraph.slice(last) })
  return segs
}

const normalizeSentence = (s: string) =>
  s
    .toLowerCase()
    .replace(/[’']/g, "'")
    .replace(/[^a-z0-9'\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim()

function mcqItems(questions: MCQ[], answers: (number | null)[], prompts?: string[]): ItemFeedback[] {
  return questions.map((q, i) => {
    const a = answers[i]
    return {
      label: `Soru ${i + 1}`,
      prompt: prompts?.[i] ?? q.q,
      earned: a === q.answer ? 1 : 0,
      possible: 1,
      userAnswer: a === null || a === undefined ? '(boş)' : q.options[a],
      correctAnswer: q.options[q.answer],
      explanation: q.explanation,
    }
  })
}

const audioUrl = (b?: Blob) => (b && b.size > 0 ? URL.createObjectURL(b) : undefined)

export async function evaluate(set: TaskSet, response: TaskResponse): Promise<TaskResult> {
  const info = taskInfo(set.type)
  const base = { section: info.section, taskType: set.type, setId: set.id, setTitle: set.title }
  let items: ItemFeedback[] = []
  let aiError: string | undefined

  switch (set.type) {
    case 'completeWords': {
      const answers = response.type === 'completeWords' ? response.answers : []
      const blanks = parseCompleteWords(set.paragraph).filter((s) => s.kind === 'blank')
      const plain = set.paragraph.replace(/\[([^|\]]*)\|([^\]]+)\]/g, '$1$2')
      items = blanks.map((b, i) => {
        const given = (answers[i] ?? '').trim()
        const word = b.shown + b.missing
        const sentence = (plain.match(/[^.!?]+[.!?]+|[^.!?]+$/g) ?? [plain]).find((s) => new RegExp(`\\b${word}\\b`, 'i').test(s))
        return {
          label: `Kelime ${i + 1}`,
          earned: given.toLowerCase() === b.missing.toLowerCase() ? 1 : 0,
          possible: 1,
          userAnswer: b.shown + (given || '___'),
          correctAnswer: word,
          prompt: (sentence ?? plain).replace(/\s+/g, ' ').trim(),
        }
      })
      break
    }
    case 'dailyLife':
    case 'academicReading':
    case 'conversation':
    case 'announcement':
    case 'academicTalk': {
      const answers = 'answers' in response ? (response.answers as (number | null)[]) : []
      items = mcqItems(set.questions, answers)
      break
    }
    case 'chooseResponse': {
      const answers = 'answers' in response ? (response.answers as (number | null)[]) : []
      items = mcqItems(
        set.items.map((it) => ({ q: it.prompt, options: it.options, answer: it.answer })),
        answers,
        set.items.map((it) => `"${it.prompt}"`),
      )
      break
    }
    case 'buildSentence': {
      const answers = response.type === 'buildSentence' ? response.answers : []
      items = set.items.map((it, i) => {
        const user = (answers[i] ?? []).join(' ')
        const correct = it.chunks.join(' ')
        return {
          label: `Cümle ${i + 1}`,
          prompt: it.context,
          earned: normalizeSentence(user) === normalizeSentence(correct) ? 1 : 0,
          possible: 1,
          userAnswer: user || '(boş)',
          correctAnswer: correct,
        }
      })
      break
    }
    case 'email':
    case 'discussion': {
      const text = response.type === 'email' || response.type === 'discussion' ? response.text : ''
      const item: ItemFeedback = { label: info.name, earned: 0, possible: 5, userAnswer: text }
      if (!text.trim()) {
        item.note = 'Cevap boş bırakıldı.'
      } else {
        try {
          item.ai = set.type === 'email' ? await scoreEmail(set, text) : await scoreDiscussion(set, text)
          item.earned = item.ai.score
        } catch (e) {
          aiError = (e as Error).message
          item.possible = 0
          item.note = 'Yapay zeka puanlaması yapılamadı, bu görev puana dahil edilmedi.'
        }
      }
      items = [item]
      break
    }
    case 'listenRepeat': {
      let answers = response.type === 'listenRepeat' ? response.answers : []
      answers = await improveTranscripts(answers, set.sentences)
      let pron: Awaited<ReturnType<typeof repeatPronunciation>> = null
      try {
        pron = await repeatPronunciation(set, answers)
      } catch (e) {
        aiError = `Telaffuz geri bildirimi alınamadı: ${(e as Error).message}`
      }
      items = set.sentences.map((sentence, i) => {
        const a = answers[i]
        const al = alignWords(sentence, a?.transcript ?? '')
        const wordScore = repeatScore(al.accuracy)
        const p = pron?.[i]
        const earned = p ? Math.round(((wordScore + p.score) / 2) * 2) / 2 : wordScore
        return {
          label: `Cümle ${i + 1}`,
          earned,
          possible: 5,
          correctAnswer: sentence,
          userAnswer: a?.transcript || '(ses algılanmadı)',
          diff: al.tokens,
          note: `Kelime doğruluğu: %${Math.round(al.accuracy * 100)} → ${wordScore}/5${p ? ` · Telaffuz (AI): ${p.score}/5 — ${p.comment}` : ''}`,
          audioUrl: audioUrl(a?.audio),
        }
      })
      break
    }
    case 'interview': {
      let answers = response.type === 'interview' ? response.answers : []
      answers = await improveTranscripts(answers)
      let feedback: Awaited<ReturnType<typeof scoreInterview>> | null = null
      const anySpeech = answers.some((a) => a.transcript.trim() || (a.audio && a.audio.size > 1000))
      if (anySpeech) {
        try {
          feedback = await scoreInterview(set, answers)
        } catch (e) {
          aiError = (e as Error).message
        }
      }
      items = set.questions.map((q, i) => {
        const a = answers[i]
        const empty = !a || (!a.transcript.trim() && !(a.audio && a.audio.size > 1000))
        const ai = feedback?.[i]
        return {
          label: `Soru ${i + 1}`,
          prompt: q,
          earned: empty ? 0 : (ai?.score ?? 0),
          possible: empty || ai ? 5 : 0,
          userAnswer: a?.transcript || '(ses algılanmadı)',
          ai,
          note: empty ? 'Cevap algılanmadı.' : !ai ? 'Yapay zeka puanlaması yapılamadı, bu soru puana dahil edilmedi.' : undefined,
          audioUrl: audioUrl(a?.audio),
        }
      })
      break
    }
  }

  const earned = items.reduce((a, i) => a + i.earned, 0)
  const possible = items.reduce((a, i) => a + i.possible, 0)
  return { ...base, items, earned, possible, aiError }
}
