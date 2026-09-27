import type { DiffToken, Section, SectionScore, TaskResult } from '../types'

// ---------------- Text normalization ----------------

const ONES = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen']
const TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety']

function numberToWords(n: number): string[] {
  if (n < 20) return [ONES[n]]
  if (n < 100) return [TENS[Math.floor(n / 10)], ...(n % 10 ? [ONES[n % 10]] : [])]
  if (n < 1000) return [ONES[Math.floor(n / 100)], 'hundred', ...(n % 100 ? numberToWords(n % 100) : [])]
  if (n < 1_000_000) return [...numberToWords(Math.floor(n / 1000)), 'thousand', ...(n % 1000 ? numberToWords(n % 1000) : [])]
  return [String(n)]
}

const CONTRACTIONS: Record<string, string> = {
  "it's": 'it is',
  "that's": 'that is',
  "there's": 'there is',
  "here's": 'here is',
  "what's": 'what is',
  "where's": 'where is',
  "who's": 'who is',
  "he's": 'he is',
  "she's": 'she is',
  "let's": 'let us',
  "can't": 'can not',
  "won't": 'will not',
  "shan't": 'shall not',
  cannot: 'can not',
}

function expand(word: string): string[] {
  if (CONTRACTIONS[word]) return CONTRACTIONS[word].split(' ')
  let m = word.match(/^(\w+)n't$/)
  if (m) return [m[1], 'not']
  m = word.match(/^(\w+)'(re|ll|ve|m|d)$/)
  if (m) {
    const map: Record<string, string> = { re: 'are', ll: 'will', ve: 'have', m: 'am', d: 'would' }
    return [m[1], map[m[2]]]
  }
  return [word]
}

/** Lowercases, strips punctuation, expands contractions and spells out numbers. */
export function tokenize(text: string): string[] {
  const cleaned = text
    .toLowerCase()
    .replace(/[’‘`]/g, "'")
    .replace(/(\d+)\s*%/g, '$1 percent')
    .replace(/(\d),(\d{3})/g, '$1$2')
    .replace(/[^a-z0-9'\s-]/g, ' ')
    .replace(/-/g, ' ')
  const out: string[] = []
  for (const raw of cleaned.split(/\s+/)) {
    const w = raw.replace(/^'+|'+$/g, '')
    if (!w) continue
    if (/^\d+$/.test(w)) out.push(...numberToWords(parseInt(w, 10)))
    else out.push(...expand(w))
  }
  return out
}

/** Common English homophones / STT swaps. Same sound, so a recognition error should not cost a word. */
const HOMOPHONE: Record<string, string> = {}
for (const group of [
  ['to', 'too', 'two'],
  ['for', 'four', 'fore'],
  ['there', 'their'],
  ['one', 'won'],
  ['here', 'hear'],
  ['by', 'buy', 'bye'],
  ['see', 'sea'],
  ['right', 'write'],
  ['week', 'weak'],
  ['our', 'hour'],
  ['allowed', 'aloud'],
  ['piece', 'peace'],
  ['wait', 'weight'],
  ['sun', 'son'],
  ['which', 'witch'],
  ['where', 'wear', 'ware'],
  ['whether', 'weather'],
  ['brake', 'break'],
  ['mail', 'male'],
  ['plain', 'plane'],
  ['role', 'roll'],
  ['sale', 'sail'],
  ['scene', 'seen'],
  ['threw', 'through'],
  ['wood', 'would'],
]) {
  const key = group[0]
  for (const w of group) HOMOPHONE[w] = key
}

/** How Chrome often writes Turkish-accented English. Mapped to the intended word. */
const ACCENT: Record<string, string> = {}
for (const [canon, variants] of [
  ['the', ['da', 'de', 'ze', 'te', 'tha', 'di']],
  ['this', ['dis', 'zis', 'tis', 'dese', 'thees']],
  ['that', ['dat', 'zat', 'tat']],
  ['these', ['dese', 'zese', 'dees']],
  ['those', ['dose', 'zose']],
  ['they', ['dey', 'zey']],
  ['them', ['dem', 'zem']],
  ['then', ['den', 'zen']],
  ['than', ['dan']],
  ['there', ['dere', 'zere', 'der']],
  ['with', ['vit', 'wit', 'wid', 'vith', 'wif', 'wiv']],
  ['what', ['vat', 'wot', 'wat']],
  ['when', ['ven', 'wen']],
  ['where', ['ver', 'wher']],
  ['which', ['vich', 'wich']],
  ['who', ['hu', 'hoo']],
  ['why', ['vy', 'wai']],
  ['will', ['vil', 'veel']],
  ['would', ['vud', 'wud']],
  ['was', ['vas']],
  ['we', ['ve']],
  ['world', ['vorld']],
  ['work', ['vork']],
  ['want', ['vant']],
  ['think', ['tink', 'tingk', 'fink']],
  ['thought', ['tot', 'tought']],
  ['three', ['tree', 'tri']],
  ['through', ['tru', 'troo']],
  ['thank', ['tank']],
  ['something', ['samting', 'someting', 'somting']],
  ['nothing', ['nating', 'noting']],
  ['anything', ['eniting', 'anyting']],
  ['because', ['bikoz', 'becoz', 'becuz', 'coz']],
  ['about', ['abot', 'abaut']],
  ['other', ['oder']],
  ['another', ['anoder']],
  ['together', ['togeder']],
  ['paper', ['pepper', 'peper']],
  ['people', ['pipol', 'peopol']],
  ['eyes', ['ice', 'ays']],
  ['of', ['ov']],
  ['have', ['hev', 'hef']],
  ['is', ['iz']],
  ['as', ['az']],
  ['his', ['hiz']],
  ['very', ['veri', 'wery']],
  ['can', ['ken']],
  ['and', ['end']],
  ['to', ['tu']],
  ['you', ['yu', 'u']],
  ['your', ['yor']],
  ['usually', ['usuli', 'usualy']],
  ['actually', ['actualy', 'accuali']],
  ['interesting', ['intresting', 'interestin']],
] as [string, string[]][]) {
  ACCENT[canon] = canon
  for (const v of variants) ACCENT[v] = canon
}

/** Keeps a little vowel info so think≠thank, but paper≈pepper and think≈tink. */
function phoneticKey(word: string): string {
  return word
    .replace(/qu/g, 'k')
    .replace(/ph/g, 'f')
    .replace(/igh/g, 'i')
    .replace(/tion/g, 'sn')
    .replace(/sion/g, 'sn')
    .replace(/th/g, 't')
    .replace(/[ckq]/g, 'k')
    .replace(/x/g, 'ks')
    .replace(/z/g, 's')
    .replace(/w/g, 'v')
    .replace(/[ae]/g, 'a')
    .replace(/[iy]/g, 'i')
    .replace(/[ou]/g, 'o')
    .replace(/(.)\1+/g, '$1')
}

function sameWord(a: string, b: string) {
  if (a === b) return true
  if (HOMOPHONE[a] === b || HOMOPHONE[b] === a || (HOMOPHONE[a] && HOMOPHONE[a] === HOMOPHONE[b])) return true
  const ca = ACCENT[a]
  const cb = ACCENT[b]
  if (ca && cb && ca === cb) return true
  if (ca === b || cb === a) return true
  if (a.length >= 4 && b.length >= 4) {
    const pa = phoneticKey(a)
    const pb = phoneticKey(b)
    if (pa.length >= 3 && pa === pb) return true
  }
  return false
}

// ---------------- Word alignment (Levenshtein with backtrace) ----------------

export interface AlignmentResult {
  tokens: DiffToken[]
  matches: number
  extras: number
  accuracy: number
}

/** Compares what the user said with the target sentence word by word. */
export function alignWords(target: string, spoken: string): AlignmentResult {
  const displayWords = target.split(/\s+/).filter(Boolean)
  const t = tokenize(target)
  const s = tokenize(spoken)
  const n = t.length
  const m = s.length
  const dp: number[][] = Array.from({ length: n + 1 }, (_, i) => Array.from({ length: m + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0)))
  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      const cost = sameWord(t[i - 1], s[j - 1]) ? 0 : 1
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost)
    }
  }

  const ops: DiffToken[] = []
  let i = n
  let j = m
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && sameWord(t[i - 1], s[j - 1]) && dp[i][j] === dp[i - 1][j - 1]) {
      ops.push({ word: t[i - 1], status: 'ok' })
      i--
      j--
    } else if (i > 0 && j > 0 && dp[i][j] === dp[i - 1][j - 1] + 1) {
      ops.push({ word: t[i - 1], status: 'wrong', heard: s[j - 1] })
      i--
      j--
    } else if (i > 0 && dp[i][j] === dp[i - 1][j] + 1) {
      ops.push({ word: t[i - 1], status: 'missing' })
      i--
    } else {
      ops.push({ word: s[j - 1], status: 'extra' })
      j--
    }
  }
  ops.reverse()

  // Map normalized tokens back to the original written words when the counts line up
  const targetOps = ops.filter((o) => o.status !== 'extra')
  if (targetOps.length === displayWords.length) {
    let k = 0
    for (const o of ops) if (o.status !== 'extra') o.word = displayWords[k++]
  }

  const matches = ops.filter((o) => o.status === 'ok').length
  const extras = ops.filter((o) => o.status === 'extra').length
  const accuracy = n ? Math.max(0, (matches - 0.5 * extras) / n) : 0
  return { tokens: ops, matches, extras, accuracy }
}

/** Picks the candidate closest to the target sentence. */
export function pickBestTranscript(target: string, candidates: string[]): string {
  const unique = [...new Set(candidates.map((c) => c.replace(/\s+/g, ' ').trim()).filter(Boolean))]
  if (!unique.length) return ''
  let best = unique[0]
  let bestAcc = -1
  for (const c of unique) {
    const acc = alignWords(target, c).accuracy
    if (acc > bestAcc || (acc === bestAcc && c.length > best.length)) {
      best = c
      bestAcc = acc
    }
  }
  return best
}

/** ETS-style 0-5 score for one Listen and Repeat item. */
export function repeatScore(accuracy: number): number {
  if (accuracy >= 0.97) return 5
  if (accuracy >= 0.87) return 4
  if (accuracy >= 0.7) return 3
  if (accuracy >= 0.5) return 2
  if (accuracy > 0.15) return 1
  return 0
}

// ---------------- Band scale ----------------

const BAND_TABLE: [number, number][] = [
  [95, 6],
  [88, 5.5],
  [80, 5],
  [72, 4.5],
  [63, 4],
  [54, 3.5],
  [45, 3],
  [36, 2.5],
  [27, 2],
  [18, 1.5],
  [0, 1],
]

export function percentToBand(percent: number): number {
  return BAND_TABLE.find(([min]) => percent >= min)![1]
}

export function roundHalf(x: number) {
  return Math.round(x * 2) / 2
}

export function cefr(band: number): string {
  if (band >= 6) return 'C2'
  if (band >= 5) return 'C1'
  if (band >= 4) return 'B2'
  if (band >= 3) return 'B1'
  if (band >= 2) return 'A2'
  return 'A1'
}

/** Approximate equivalent on the old 0-120 total scale. */
const OLD_SCALE: Record<string, string> = {
  '6': '114-120',
  '5.5': '107-113',
  '5': '95-106',
  '4.5': '86-94',
  '4': '72-85',
  '3.5': '58-71',
  '3': '44-57',
  '2.5': '35-43',
  '2': '24-34',
  '1.5': '12-23',
  '1': '0-11',
}

export const oldScaleEquivalent = (band: number) => OLD_SCALE[String(band)] ?? '-'

/** Approximate equivalent on the old 0-30 section scale. */
const OLD_SECTION: Record<string, string> = {
  '6': '29-30',
  '5.5': '27-28',
  '5': '24-26',
  '4.5': '22-23',
  '4': '18-21',
  '3.5': '15-17',
  '3': '11-14',
  '2.5': '8-10',
  '2': '5-7',
  '1.5': '3-4',
  '1': '0-2',
}

export const oldSectionEquivalent = (band: number) => OLD_SECTION[String(band)] ?? '-'

export function bandColor(band: number) {
  if (band >= 5) return 'text-emerald-600'
  if (band >= 4) return 'text-sky-600'
  if (band >= 3) return 'text-amber-600'
  return 'text-rose-600'
}

export function sectionScores(results: TaskResult[]): SectionScore[] {
  const bySection = new Map<Section, { earned: number; possible: number }>()
  for (const r of results) {
    const cur = bySection.get(r.section) ?? { earned: 0, possible: 0 }
    cur.earned += r.earned
    cur.possible += r.possible
    bySection.set(r.section, cur)
  }
  const order: Section[] = ['reading', 'listening', 'writing', 'speaking']
  return order
    .filter((s) => (bySection.get(s)?.possible ?? 0) > 0)
    .map((s) => {
      const { earned, possible } = bySection.get(s)!
      const percent = possible ? (earned / possible) * 100 : 0
      return { section: s, percent, band: percentToBand(percent) }
    })
}

/** Overall score = average of the four section bands, rounded to the nearest 0.5. Needs all four sections. */
export function overallBand(sections: SectionScore[]): number | null {
  if (sections.length < 4) return null
  return roundHalf(sections.reduce((a, s) => a + s.band, 0) / sections.length)
}
