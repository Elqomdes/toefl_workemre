import type { Section, TaskType } from '../types'

export interface TaskInfo {
  type: TaskType
  section: Section
  name: string
  nameTr: string
  description: string
  /** Time limit in seconds for the whole task (undefined = no overall limit) */
  timeLimit?: number
  aiScored?: boolean
}

export const SECTION_NAMES: Record<Section, { en: string; tr: string; color: string }> = {
  reading: { en: 'Reading', tr: 'Okuma', color: 'bg-emerald-500' },
  listening: { en: 'Listening', tr: 'Dinleme', color: 'bg-sky-500' },
  writing: { en: 'Writing', tr: 'Yazma', color: 'bg-amber-500' },
  speaking: { en: 'Speaking', tr: 'Konuşma', color: 'bg-rose-500' },
}

export const SECTIONS: Section[] = ['reading', 'listening', 'writing', 'speaking']

export const TASKS: TaskInfo[] = [
  {
    type: 'completeWords',
    section: 'reading',
    name: 'Complete the Words',
    nameTr: 'Kelimeleri Tamamla',
    description: 'Paragraftaki kelimelerin eksik harflerini tamamla.',
    timeLimit: 3 * 60,
  },
  {
    type: 'dailyLife',
    section: 'reading',
    name: 'Read in Daily Life',
    nameTr: 'Günlük Hayatta Okuma',
    description: 'E-posta, duyuru, menü gibi kısa günlük metinleri oku ve soruları cevapla.',
    timeLimit: 5 * 60,
  },
  {
    type: 'academicReading',
    section: 'reading',
    name: 'Read an Academic Passage',
    nameTr: 'Akademik Metin Okuma',
    description: 'Kısa bir akademik metni oku ve soruları cevapla.',
    timeLimit: 8 * 60,
  },
  {
    type: 'chooseResponse',
    section: 'listening',
    name: 'Listen and Choose a Response',
    nameTr: 'Dinle ve Cevap Seç',
    description: 'Kısa bir cümle dinle ve en uygun cevabı seç.',
  },
  {
    type: 'conversation',
    section: 'listening',
    name: 'Listen to a Conversation',
    nameTr: 'Konuşma Dinleme',
    description: 'İki kişi arasındaki kısa bir konuşmayı dinle ve soruları cevapla.',
  },
  {
    type: 'announcement',
    section: 'listening',
    name: 'Listen to an Announcement',
    nameTr: 'Duyuru Dinleme',
    description: 'Kampüs veya sınıf duyurusunu dinle ve soruları cevapla.',
  },
  {
    type: 'academicTalk',
    section: 'listening',
    name: 'Listen to an Academic Talk',
    nameTr: 'Akademik Konuşma Dinleme',
    description: 'Kısa bir ders anlatımını dinle ve soruları cevapla.',
  },
  {
    type: 'buildSentence',
    section: 'writing',
    name: 'Build a Sentence',
    nameTr: 'Cümle Kur',
    description: 'Verilen kelime gruplarını doğru sıraya dizerek cümle kur.',
    timeLimit: 6 * 60,
  },
  {
    type: 'email',
    section: 'writing',
    name: 'Write an Email',
    nameTr: 'E-posta Yaz',
    description: 'Verilen duruma uygun bir e-posta yaz (7 dakika).',
    timeLimit: 7 * 60,
    aiScored: true,
  },
  {
    type: 'discussion',
    section: 'writing',
    name: 'Write for an Academic Discussion',
    nameTr: 'Akademik Tartışma',
    description: 'Online sınıf tartışmasına katkıda bulun (10 dakika).',
    timeLimit: 10 * 60,
    aiScored: true,
  },
  {
    type: 'listenRepeat',
    section: 'speaking',
    name: 'Listen and Repeat',
    nameTr: 'Dinle ve Tekrarla',
    description: 'Duyduğun cümleyi aynen tekrar et. Söylediklerin kelime kelime karşılaştırılır.',
  },
  {
    type: 'interview',
    section: 'speaking',
    name: 'Take an Interview',
    nameTr: 'Mülakat',
    description: 'Görüşmecinin sorularını 45 saniye içinde cevapla.',
    aiScored: true,
  },
]

export const taskInfo = (type: TaskType): TaskInfo => TASKS.find((t) => t.type === type)!

export const tasksOf = (section: Section) => TASKS.filter((t) => t.section === section)

/** Full test section time limits in seconds */
export const SECTION_TIME: Record<Section, number> = {
  reading: 27 * 60,
  listening: 27 * 60,
  writing: 23 * 60,
  speaking: 10 * 60,
}
