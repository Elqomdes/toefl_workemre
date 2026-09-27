export type Section = 'reading' | 'listening' | 'writing' | 'speaking'

export type TaskType =
  | 'completeWords'
  | 'dailyLife'
  | 'academicReading'
  | 'chooseResponse'
  | 'conversation'
  | 'announcement'
  | 'academicTalk'
  | 'buildSentence'
  | 'email'
  | 'discussion'
  | 'listenRepeat'
  | 'interview'

export interface MCQ {
  q: string
  options: string[]
  answer: number
  explanation?: string
}

/** Paragraph where missing letters are marked as [shown|missing], e.g. "pro[du|ce]" */
export interface CompleteWordsSet {
  id: string
  type: 'completeWords'
  title: string
  paragraph: string
}

export interface ReadingSet {
  id: string
  type: 'dailyLife' | 'academicReading'
  title: string
  text: string
  questions: MCQ[]
}

export interface ChooseResponseSet {
  id: string
  type: 'chooseResponse'
  title: string
  items: { prompt: string; speaker?: 'male' | 'female'; options: string[]; answer: number }[]
}

export interface ScriptLine {
  speaker: string
  voice: 'male' | 'female'
  text: string
}

export interface ListeningSet {
  id: string
  type: 'conversation' | 'announcement' | 'academicTalk'
  title: string
  script: ScriptLine[]
  questions: MCQ[]
}

export interface BuildSentenceSet {
  id: string
  type: 'buildSentence'
  title: string
  items: { context: string; chunks: string[] }[]
}

export interface EmailSet {
  id: string
  type: 'email'
  title: string
  scenario: string
  to: string
  bullets: string[]
}

export interface DiscussionSet {
  id: string
  type: 'discussion'
  title: string
  professor: string
  question: string
  students: { name: string; text: string }[]
}

export interface ListenRepeatSet {
  id: string
  type: 'listenRepeat'
  title: string
  context: string
  sentences: string[]
}

export interface InterviewSet {
  id: string
  type: 'interview'
  title: string
  intro: string
  questions: string[]
}

export type TaskSet =
  | CompleteWordsSet
  | ReadingSet
  | ChooseResponseSet
  | ListeningSet
  | BuildSentenceSet
  | EmailSet
  | DiscussionSet
  | ListenRepeatSet
  | InterviewSet

export interface SpokenAnswer {
  transcript: string
  /** Other Web Speech alternatives; used to pick the closest match for Listen and Repeat. */
  alternatives?: string[]
  audio?: Blob
  durationSec: number
  /** Peak microphone level 0-1 while recording; used to detect silence. */
  peakLevel?: number
}

export type TaskResponse =
  | { type: 'completeWords'; answers: string[] }
  | { type: 'dailyLife' | 'academicReading' | 'chooseResponse' | 'conversation' | 'announcement' | 'academicTalk'; answers: (number | null)[] }
  | { type: 'buildSentence'; answers: string[][] }
  | { type: 'email' | 'discussion'; text: string; timeUsedSec: number }
  | { type: 'listenRepeat' | 'interview'; answers: SpokenAnswer[] }

export interface AIFeedback {
  score: number
  strengths: string[]
  weaknesses: string[]
  corrected_version?: string
  tips: string[]
  subscores?: Record<string, number>
}

export interface DiffToken {
  word: string
  status: 'ok' | 'missing' | 'wrong' | 'extra'
  heard?: string
}

export interface ItemFeedback {
  label: string
  earned: number
  possible: number
  prompt?: string
  userAnswer?: string
  correctAnswer?: string
  explanation?: string
  diff?: DiffToken[]
  ai?: AIFeedback
  note?: string
  audioUrl?: string
}

export interface TaskResult {
  section: Section
  taskType: TaskType
  setId: string
  setTitle: string
  earned: number
  possible: number
  items: ItemFeedback[]
  aiError?: string
}

export interface SectionScore {
  section: Section
  percent: number
  band: number
}

export interface Attempt {
  id: string
  date: string
  mode: 'full' | 'practice'
  label: string
  results: TaskResult[]
  sections: SectionScore[]
  overall: number | null
}

export type AIProvider = 'gemini' | 'openai'

export interface CoachAdvice {
  date: string
  activityCount: number
  summary: string
  weakest: string[]
  recommendations: { title: string; why: string; action: string; href?: string }[]
  practicePlan: string[]
}

export interface Settings {
  provider: AIProvider
  geminiKey: string
  openaiKey: string
  geminiModel: string
  openaiModel: string
  voiceRate: number
  pronunciationFeedback: boolean
}
