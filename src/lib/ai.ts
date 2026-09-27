import type {
  AIFeedback,
  Attempt,
  CoachAdvice,
  DiscussionSet,
  EmailSet,
  InterviewSet,
  ListenRepeatSet,
  Settings,
  SpokenAnswer,
  TaskSet,
  TaskType,
} from '../types'
import { activityCount, allTaskResults, recentMistakes, taskAverages, taskHref } from './progress'
import { pickBestTranscript } from './scoring'
import { blobToBase64, toWav } from './speech'
import { getSettings, hasAIKey, newId } from './storage'

interface AudioPart {
  base64: string
  mime: string
}

interface AIRequest {
  system: string
  user: string
  audio?: AudioPart[]
}

async function callGemini(s: Settings, req: AIRequest): Promise<string> {
  const parts: unknown[] = [{ text: req.user }]
  for (const a of req.audio ?? []) parts.push({ inlineData: { mimeType: a.mime, data: a.base64 } })
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(s.geminiModel)}:generateContent?key=${encodeURIComponent(s.geminiKey.trim())}`
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: req.system }] },
      contents: [{ role: 'user', parts }],
      generationConfig: { responseMimeType: 'application/json', temperature: 0.2 },
    }),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data?.error?.message ?? `Gemini hatası (${res.status})`)
  const text = data?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text ?? '').join('') ?? ''
  if (!text) throw new Error('Gemini boş yanıt döndürdü.')
  return text
}

async function callOpenAI(s: Settings, req: AIRequest): Promise<string> {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${s.openaiKey.trim()}` },
    body: JSON.stringify({
      model: s.openaiModel,
      temperature: 0.2,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: req.system },
        { role: 'user', content: req.user },
      ],
    }),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data?.error?.message ?? `OpenAI hatası (${res.status})`)
  return data?.choices?.[0]?.message?.content ?? ''
}

const ACCENT_TRANSCRIBE =
  'The speaker is a Turkish learner of English. They often have a Turkish accent. Browser speech-to-text frequently mishears this accent (th as t/d, w as v, paper as pepper, think as tink, the as da/de, with as vit, eyes as ice). Listen to the AUDIO and write the English words they said or clearly intended. Do not invent extra sentences. Do not "fix" grammar. If the audio is silent, return an empty transcript.'

export async function transcribeWithOpenAI(audio: Blob, s: Settings = getSettings()): Promise<string> {
  const ext = audio.type.includes('ogg') ? 'ogg' : audio.type.includes('mp4') ? 'mp4' : 'webm'
  const form = new FormData()
  form.append('file', audio, `answer.${ext}`)
  form.append('model', 'whisper-1')
  form.append('language', 'en')
  form.append('prompt', ACCENT_TRANSCRIBE)
  const res = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${s.openaiKey.trim()}` },
    body: form,
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data?.error?.message ?? `Whisper hatası (${res.status})`)
  return data.text ?? ''
}

function parseJSON<T>(text: string): T {
  const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim()
  try {
    return JSON.parse(cleaned) as T
  } catch {
    const start = cleaned.search(/[[{]/)
    const end = Math.max(cleaned.lastIndexOf('}'), cleaned.lastIndexOf(']'))
    if (start >= 0 && end > start) return JSON.parse(cleaned.slice(start, end + 1)) as T
    throw new Error('Yapay zeka yanıtı JSON olarak okunamadı.')
  }
}

async function askJSON<T>(req: AIRequest): Promise<T> {
  const s = getSettings()
  if (!hasAIKey(s)) throw new Error('API anahtarı girilmemiş. Ayarlar sayfasından ekleyebilirsin.')
  const text = s.provider === 'gemini' ? await callGemini(s, req) : await callOpenAI(s, { ...req, audio: undefined })
  return parseJSON<T>(text)
}

const clampScore = (x: unknown) => {
  const n = typeof x === 'number' ? x : parseFloat(String(x))
  return Number.isFinite(n) ? Math.max(0, Math.min(5, Math.round(n * 2) / 2)) : 0
}

function normalizeFeedback(raw: Partial<AIFeedback> | undefined): AIFeedback {
  const arr = (v: unknown) => (Array.isArray(v) ? v.map(String) : v ? [String(v)] : [])
  return {
    score: clampScore(raw?.score),
    strengths: arr(raw?.strengths),
    weaknesses: arr(raw?.weaknesses),
    tips: arr(raw?.tips),
    corrected_version: raw?.corrected_version ? String(raw.corrected_version) : undefined,
    subscores: raw?.subscores && typeof raw.subscores === 'object' ? raw.subscores : undefined,
  }
}

const FEEDBACK_FORMAT = `Respond ONLY with JSON in this exact shape:
{
  "score": number from 0 to 5 (half points allowed),
  "subscores": { "<criterion>": number 0-5, ... },
  "strengths": ["..."],
  "weaknesses": ["..."],
  "corrected_version": "an improved version of the response in English, keeping the test taker's ideas",
  "tips": ["concrete, actionable tips"]
}
Write "strengths", "weaknesses" and "tips" in TURKISH (the learner is Turkish), but quote English words/phrases from the response when pointing out errors, e.g. "\\"I am agree\\" yerine \\"I agree\\" demelisin".
Be a strict but fair ETS rater. Do not inflate scores.`

const SYSTEM_RATER = `You are an experienced, certified TOEFL iBT rater. You score responses using the official ETS rubrics for the TOEFL iBT format introduced in January 2026, where each task is scored on a 0-5 scale.`

// ---------------- Writing ----------------

const EMAIL_RUBRIC = `ETS "Write an Email" rubric (0-5):
5 - Fully successful: effective, clearly expressed, elaborated; addresses all required points; consistently appropriate tone and register for the recipient; consistent facility in language use with precise vocabulary and varied syntax; almost no errors.
4 - Generally successful: addresses the task well; mostly appropriate conventions; adequate elaboration; a few minor errors that don't obscure meaning.
3 - Partially successful: addresses the task but some points are underdeveloped or unclear; some inappropriate tone; noticeable errors in grammar/vocabulary.
2 - Mostly unsuccessful: limited development, missing required points, frequent errors that sometimes obscure meaning.
1 - Unsuccessful: very little relevant content, serious language problems.
0 - Blank, off topic, not in English, or copied from the prompt.
Use subscores: "task_completion", "organization", "tone_register", "language_use".`

export async function scoreEmail(set: EmailSet, text: string): Promise<AIFeedback> {
  const raw = await askJSON<Partial<AIFeedback>>({
    system: `${SYSTEM_RATER}\n\n${EMAIL_RUBRIC}\n\n${FEEDBACK_FORMAT}`,
    user: `TASK (7 minutes):\nScenario: ${set.scenario}\nRecipient: ${set.to}\nIn your email, do the following:\n${set.bullets.map((b) => `- ${b}`).join('\n')}\n\nTEST TAKER'S EMAIL (${text.trim().split(/\s+/).length} words):\n"""${text}"""`,
  })
  return normalizeFeedback(raw)
}

const DISCUSSION_RUBRIC = `ETS "Write for an Academic Discussion" rubric (0-5):
5 - Fully successful: relevant and very clearly expressed contribution to the online discussion; well-elaborated explanations, exemplifications and/or details; effective use of a variety of syntactic structures and precise, idiomatic word choice; almost no lexical or grammatical errors.
4 - Generally successful: relevant contribution, ideas easily understood; adequate elaboration; variety of structures and appropriate vocabulary; few errors.
3 - Partially successful: mostly relevant contribution; some parts missing, unclear or irrelevant elaboration; some variety of structures and vocabulary; noticeable errors.
2 - Mostly unsuccessful: attempt to contribute but limited development; ideas may be poorly connected; limited range; accumulation of errors.
1 - Unsuccessful: few or no coherent ideas relevant to the topic; severe language limitations.
0 - Blank, off topic, not in English, or entirely copied.
An effective response is typically at least 100 words and adds a new idea rather than just repeating the other students.
Use subscores: "relevance", "elaboration", "language_variety", "accuracy".`

export async function scoreDiscussion(set: DiscussionSet, text: string): Promise<AIFeedback> {
  const raw = await askJSON<Partial<AIFeedback>>({
    system: `${SYSTEM_RATER}\n\n${DISCUSSION_RUBRIC}\n\n${FEEDBACK_FORMAT}`,
    user: `TASK (10 minutes):\nProfessor: ${set.professor}\nQuestion: ${set.question}\n${set.students.map((s) => `${s.name}: ${s.text}`).join('\n')}\n\nTEST TAKER'S RESPONSE (${text.trim().split(/\s+/).length} words):\n"""${text}"""`,
  })
  return normalizeFeedback(raw)
}

// ---------------- Speaking ----------------

const INTERVIEW_RUBRIC = `ETS "Take an Interview" rubric (0-5), 45 seconds per answer:
5 - Fully addresses the question; well developed with relevant details; fluent, sustained speech with minor hesitation; highly intelligible pronunciation and intonation; effective use of vocabulary and grammar with only minor errors.
4 - Addresses the question clearly; generally well developed; mostly fluent with some hesitation; generally intelligible; good control of grammar and vocabulary with some errors.
3 - Addresses the question but development is limited; noticeable pauses or choppy delivery; some pronunciation problems require listener effort; limited range or frequent errors.
2 - Minimally addresses the question; very limited content; frequent pauses; pronunciation often unclear; basic grammar and vocabulary with many errors.
1 - Very little relevant content; mostly unintelligible or fragmentary.
0 - No response or completely unrelated.
Use subscores: "delivery", "language_use", "topic_development".`

interface MultiFeedback {
  items: Partial<AIFeedback>[]
}

async function audioPart(a: SpokenAnswer): Promise<AudioPart | undefined> {
  if (!a.audio || a.audio.size < 1000) return undefined
  try {
    const wav = await toWav(a.audio)
    return { base64: await blobToBase64(wav), mime: 'audio/wav' }
  } catch {
    return { base64: await blobToBase64(a.audio), mime: (a.audio.type || 'audio/webm').split(';')[0] }
  }
}

export async function transcribeWithGemini(audio: Blob, unreliableStt?: string): Promise<string> {
  const dummy: SpokenAnswer = { transcript: '', audio, durationSec: 0 }
  const part = await audioPart(dummy)
  if (!part) throw new Error('Ses kaydı okunamadı.')
  const raw = await askJSON<{ transcript?: string }>({
    system: `${ACCENT_TRANSCRIBE} Do not copy a suggested sentence. Respond ONLY with JSON: { "transcript": "..." }`,
    user: unreliableStt?.trim()
      ? `A US-English browser transcript (often WRONG for this accent) was: "${unreliableStt.trim()}"\nIgnore that if it disagrees with the audio. Transcribe the audio.`
      : 'Transcribe this English speech from the audio.',
    audio: [part],
  })
  return String(raw.transcript ?? '').trim()
}

/**
 * Replaces the browser transcript with an accent-aware audio transcript when possible.
 * For Listen and Repeat, the candidate closest to the target (including accent-tolerant matches) is kept.
 */
export async function improveTranscripts(answers: SpokenAnswer[], targets?: string[]): Promise<SpokenAnswer[]> {
  const s = getSettings()
  return Promise.all(
    answers.map(async (a, i) => {
      const target = targets?.[i]
      const candidates = [a.transcript, ...(a.alternatives ?? [])]
      const silent = (a.peakLevel ?? 1) < 0.03 && !a.transcript.trim()
      const hasAudio = !!a.audio && a.audio.size > 2000 && (a.durationSec ?? 0) > 0.6
      let fromAudio = ''
      if (hasAIKey(s) && hasAudio && !silent) {
        try {
          fromAudio =
            s.provider === 'openai'
              ? await transcribeWithOpenAI(a.audio!, s)
              : await transcribeWithGemini(a.audio!, a.transcript)
          if (fromAudio.trim()) candidates.push(fromAudio.trim())
        } catch {
          /* keep browser transcript */
        }
      }
      const transcript = target
        ? pickBestTranscript(target, candidates) || a.transcript
        : fromAudio.trim() || a.transcript
      return { ...a, transcript }
    }),
  )
}

export async function scoreInterview(set: InterviewSet, answers: SpokenAnswer[]): Promise<AIFeedback[]> {
  const s = getSettings()
  const withAudio = s.provider === 'gemini'
  const audio: AudioPart[] = []
  const lines: string[] = []
  for (let i = 0; i < set.questions.length; i++) {
    const a = answers[i]
    const part = withAudio && a ? await audioPart(a) : undefined
    if (part) audio.push(part)
    lines.push(
      `QUESTION ${i + 1}: ${set.questions[i]}\nTRANSCRIPT (automatic speech recognition, may contain recognition errors): "${a?.transcript || '(no speech detected)'}"\nSpeaking time: ${Math.round(a?.durationSec ?? 0)} s${part ? `\nAUDIO: audio clip #${audio.length} attached` : ''}`,
    )
  }
  const raw = await askJSON<MultiFeedback>({
    system: `${SYSTEM_RATER}\n\n${INTERVIEW_RUBRIC}\n\n${
      withAudio
        ? 'Audio recordings are attached in order. The test taker is a Turkish speaker of English. Browser transcripts often mishear this accent — trust the AUDIO over the transcript. Do not treat a transcript typo (pepper/paper, tink/think, da/the) as a language error if the audio is clear.'
        : 'Only transcripts are available; they may mishear a Turkish accent. Judge content cautiously and do not over-penalize likely recognition errors.'
    }\n\nScore EACH answer separately. Respond with JSON: { "items": [ <one object per question, in order> ] } where each object has the shape below.\n\n${FEEDBACK_FORMAT}\nFor "corrected_version", give a model answer of about 80-100 words based on the test taker's ideas.`,
    user: `Interview context: ${set.intro}\n\n${lines.join('\n\n')}`,
    audio,
  })
  return set.questions.map((_, i) => normalizeFeedback(raw.items?.[i]))
}

export interface PronunciationItem {
  score: number
  comment: string
}

/** Pronunciation comments for Listen and Repeat (Gemini only, needs audio). */
export async function repeatPronunciation(set: ListenRepeatSet, answers: SpokenAnswer[]): Promise<PronunciationItem[] | null> {
  const s = getSettings()
  if (s.provider !== 'gemini' || !hasAIKey(s) || !s.pronunciationFeedback) return null
  const audio: AudioPart[] = []
  const lines: string[] = []
  for (let i = 0; i < set.sentences.length; i++) {
    const part = answers[i] ? await audioPart(answers[i]) : undefined
    if (part) audio.push(part)
    lines.push(`SENTENCE ${i + 1}: "${set.sentences[i]}"${part ? ` -> audio clip #${audio.length}` : ' -> (no audio)'}`)
  }
  if (!audio.length) return null
  const raw = await askJSON<{ items: { score: unknown; comment: unknown }[] }>({
    system: `${SYSTEM_RATER}
Task: "Listen and Repeat". The test taker heard a sentence and had to repeat it exactly. ETS scores each item 0-5:
5 = exact repetition, fully intelligible, natural pronunciation and intonation.
4 = minor deviation or slight pronunciation issues, fully intelligible.
3 = some words missing/changed or pronunciation problems, mostly intelligible.
2 = significant parts missing or hard to understand.
1 = only a few words, largely unintelligible.
0 = no response.
Listen to each audio clip and compare it to the target sentence. Respond with JSON: { "items": [ { "score": number, "comment": "short TURKISH comment on pronunciation, stress and missing words, quoting English words" } ] } with one item per sentence in order (use score 0 for sentences with no audio).`,
    user: lines.join('\n'),
    audio,
  })
  return set.sentences.map((_, i) => ({
    score: clampScore(raw.items?.[i]?.score),
    comment: String(raw.items?.[i]?.comment ?? ''),
  }))
}

// ---------------- Question generation ----------------

const SCHEMAS: Partial<Record<TaskType, string>> = {
  completeWords: `{ "title": string, "paragraph": string }  // ~70-word academic paragraph. The first sentence is complete. Afterwards, mark exactly 10 words as [shown|missing] where "shown" is the first half of the word and "missing" is the rest, e.g. "[pol|len]" for pollen. Only mark words of 3+ letters.`,
  dailyLife: `{ "title": string, "text": string, "questions": [{ "q": string, "options": [4 strings], "answer": index 0-3, "explanation": string }] } // text is a realistic email, notice, schedule or ad of 120-180 words; 3 questions`,
  academicReading: `{ "title": string, "text": string, "questions": [{ "q": string, "options": [4 strings], "answer": index 0-3, "explanation": string }] } // 3 paragraphs, ~250 words, university-level; 5 questions (detail, vocabulary, inference, purpose, negative factual)`,
  chooseResponse: `{ "title": string, "items": [{ "prompt": string, "speaker": "male"|"female", "options": [4 strings], "answer": index 0-3 }] } // 8 items, prompt is one spoken sentence on campus/daily life; distractors reuse words from the prompt`,
  conversation: `{ "title": string, "script": [{ "speaker": string, "voice": "male"|"female", "text": string }], "questions": [{ "q": string, "options": [4 strings], "answer": index 0-3 }] } // 6-8 turns between a student and another person; 3 questions`,
  announcement: `{ "title": string, "script": [{ "speaker": string, "voice": "male"|"female", "text": string }], "questions": [{ "q": string, "options": [4 strings], "answer": index 0-3 }] } // one speaker, ~120-word campus or class announcement; 3 questions`,
  academicTalk: `{ "title": string, "script": [{ "speaker": "Professor", "voice": "male"|"female", "text": string }], "questions": [{ "q": string, "options": [4 strings], "answer": index 0-3 }] } // ~200-word mini lecture; 4 questions`,
  buildSentence: `{ "title": string, "items": [{ "context": string, "chunks": [strings in the CORRECT order] }] } // 6 items; context is a question; chunks (4-6) form a natural reply sentence when joined with spaces`,
  email: `{ "title": string, "scenario": string, "to": string, "bullets": [3 strings] }`,
  discussion: `{ "title": string, "professor": string, "question": string, "students": [{ "name": string, "text": string }, { "name": string, "text": string }] } // two students with different views, 40-60 words each`,
  listenRepeat: `{ "title": string, "context": string, "sentences": [7 strings] } // sentences get progressively longer, from ~4 to ~18 words, all fitting the context`,
  interview: `{ "title": string, "intro": string, "questions": [4 strings] } // questions progress from personal experience to opinion/hypothetical`,
}

export async function generateSet(type: TaskType): Promise<TaskSet> {
  const schema = SCHEMAS[type]
  if (!schema) throw new Error('Bu görev türü için üretim desteklenmiyor.')
  const raw = await askJSON<Record<string, unknown>>({
    system: `You write original practice material for the TOEFL iBT format introduced in January 2026. Content must be accurate, natural American English and similar in difficulty to the real test. Respond ONLY with JSON.`,
    user: `Create one new "${type}" task set. JSON schema:\n${schema}\nChoose a fresh topic (vary between sciences, humanities, campus life and daily life). Make sure correct answers are distributed across option positions.`,
  })
  const set = { ...raw, id: `ai-${type}-${newId()}`, type } as unknown as TaskSet
  validateSet(set)
  return set
}

export async function analyzeRecentActivities(attempts: Attempt[]): Promise<CoachAdvice> {
  const count = activityCount(attempts)
  const recent = allTaskResults(attempts).slice(0, 12)
  const avgs = taskAverages(attempts)
  const mistakes = recentMistakes(attempts, 40)
  const raw = await askJSON<Partial<CoachAdvice>>({
    system: `You are a TOEFL iBT coach for a Turkish learner using the new (2026) exam format. Study the last activities and the mistakes. Be specific, honest and practical. Write ALL text in TURKISH. Respond ONLY with JSON:
{
  "summary": "4-6 sentence overview of the current level and main pattern of errors",
  "weakest": ["short area names, e.g. Listen and Repeat / akademik kelime"],
  "recommendations": [
    { "title": "short title", "why": "why this matters for this student", "action": "what to do in the next 2-3 sessions", "href": "/practice/speaking" }
  ],
  "practicePlan": ["day-by-day or session-by-session next steps, 4-6 items"]
}
Use only these href values when relevant: /practice/reading, /practice/listening, /practice/writing, /practice/speaking, /vocab, /full-test.
Give 3 to 5 recommendations. Quote real mistakes (English words/phrases) when useful.`,
    user: `Activity count: ${count}

Task averages:
${avgs.map((t) => `- ${t.name}: ${t.count} deneme, %${t.percent !== null ? Math.round(t.percent) : '-'}, ${t.wrong} yanlış madde`).join('\n')}

Last ${recent.length} activities:
${recent
  .map((r) => {
    const pct = r.possible ? Math.round((r.earned / r.possible) * 100) : 0
    return `- ${r.date.slice(0, 10)} ${r.section}/${r.taskType} "${r.setTitle}" ${Math.round(r.earned * 10) / 10}/${r.possible} (%${pct})`
  })
  .join('\n')}

Recent mistakes:
${mistakes
  .slice(0, 24)
  .map((m) => `- [${m.section}/${m.type}] ${m.task} · ${m.label} · said="${m.user ?? ''}" correct="${m.correct ?? ''}" ${m.note ? `note=${m.note}` : ''}`)
  .join('\n') || '(no item-level mistakes recorded)'}`,
  })
  const recs = (Array.isArray(raw.recommendations) ? raw.recommendations : []).map((r) => ({
    title: String(r?.title ?? 'Öneri'),
    why: String(r?.why ?? ''),
    action: String(r?.action ?? ''),
    href: typeof r?.href === 'string' && r.href.startsWith('/') ? r.href : taskHref((recent[0]?.taskType ?? 'completeWords') as TaskType),
  }))
  return {
    date: new Date().toISOString(),
    activityCount: count,
    summary: String(raw.summary ?? ''),
    weakest: Array.isArray(raw.weakest) ? raw.weakest.map(String) : [],
    recommendations: recs,
    practicePlan: Array.isArray(raw.practicePlan) ? raw.practicePlan.map(String) : [],
  }
}

function validateSet(set: TaskSet) {
  const fail = () => {
    throw new Error('Üretilen soru seti beklenen formatta değil, tekrar dene.')
  }
  if (!set.title) (set as { title: string }).title = 'AI Set'
  switch (set.type) {
    case 'completeWords':
      if (typeof set.paragraph !== 'string' || !/\[[^|\]]+\|[^\]]+\]/.test(set.paragraph)) fail()
      break
    case 'dailyLife':
    case 'academicReading':
      if (!set.text || !Array.isArray(set.questions) || !set.questions.length) fail()
      break
    case 'conversation':
    case 'announcement':
    case 'academicTalk':
      if (!Array.isArray(set.script) || !Array.isArray(set.questions) || !set.questions.length) fail()
      set.script.forEach((l) => (l.voice = l.voice === 'male' ? 'male' : 'female'))
      break
    case 'chooseResponse':
      if (!Array.isArray(set.items) || !set.items.length) fail()
      break
    case 'buildSentence':
      if (!Array.isArray(set.items) || set.items.some((i) => !Array.isArray(i.chunks) || i.chunks.length < 2)) fail()
      break
    case 'email':
      if (!set.scenario || !Array.isArray(set.bullets)) fail()
      break
    case 'discussion':
      if (!set.question || !Array.isArray(set.students)) fail()
      break
    case 'listenRepeat':
      if (!Array.isArray(set.sentences) || set.sentences.length < 3) fail()
      break
    case 'interview':
      if (!Array.isArray(set.questions) || set.questions.length < 2) fail()
      break
  }
}
