import type { SpokenAnswer } from '../types'
import { pickBestTranscript } from './scoring'

// ---------------- Text to speech ----------------

const MALE_HINTS = ['male', 'david', 'mark', 'guy', 'george', 'james', 'daniel', 'fred', 'alex', 'christopher', 'eric', 'roger', 'steffan', 'andrew', 'brian', 'ryan', 'thomas']
const FEMALE_HINTS = ['female', 'zira', 'aria', 'jenny', 'samantha', 'susan', 'hazel', 'libby', 'sonia', 'michelle', 'emma', 'ava', 'karen', 'moira', 'tessa', 'victoria', 'google us english', 'sara', 'natasha']

let voicesCache: SpeechSynthesisVoice[] = []

function loadVoices(): Promise<SpeechSynthesisVoice[]> {
  if (!('speechSynthesis' in window)) return Promise.resolve([])
  const v = speechSynthesis.getVoices()
  if (v.length) {
    voicesCache = v
    return Promise.resolve(v)
  }
  return new Promise((resolve) => {
    const done = () => {
      voicesCache = speechSynthesis.getVoices()
      resolve(voicesCache)
    }
    speechSynthesis.addEventListener('voiceschanged', done, { once: true })
    setTimeout(done, 1500)
  })
}

function pickVoice(gender: 'male' | 'female'): SpeechSynthesisVoice | undefined {
  const english = voicesCache.filter((v) => v.lang.toLowerCase().startsWith('en'))
  const pool = english.length ? english : voicesCache
  const hints = gender === 'male' ? MALE_HINTS : FEMALE_HINTS
  const byName = (v: SpeechSynthesisVoice) => hints.some((h) => v.name.toLowerCase().includes(h))
  const preferUS = pool.filter((v) => v.lang === 'en-US')
  // Natural/online voices sound much better, prefer them
  const natural = (list: SpeechSynthesisVoice[]) => list.find((v) => byName(v) && /natural|online|google/i.test(v.name))
  return natural(preferUS) ?? preferUS.find(byName) ?? natural(pool) ?? pool.find(byName) ?? preferUS[0] ?? pool[0]
}

// Keeps utterances referenced so Chrome doesn't garbage-collect them before onend fires
const alive: SpeechSynthesisUtterance[] = []
let speechToken = 0

function speakChunk(text: string, gender: 'male' | 'female', rate: number): Promise<void> {
  return new Promise((resolve) => {
    const u = new SpeechSynthesisUtterance(text)
    const voice = pickVoice(gender)
    if (voice) u.voice = voice
    u.lang = voice?.lang ?? 'en-US'
    u.rate = rate
    alive.push(u)
    const finish = () => {
      alive.splice(alive.indexOf(u), 1)
      resolve()
    }
    u.onend = finish
    u.onerror = finish
    speechSynthesis.speak(u)
  })
}

/** Chrome cuts off utterances longer than ~15 seconds, so long text is spoken sentence by sentence. */
function splitSentences(text: string): string[] {
  return text.match(/[^.!?]+[.!?]+["')\]]*|[^.!?]+$/g)?.map((s) => s.trim()).filter(Boolean) ?? [text]
}

export async function speak(text: string, gender: 'male' | 'female' = 'female', rate = 1): Promise<boolean> {
  if (!('speechSynthesis' in window)) return false
  await loadVoices()
  const token = ++speechToken
  for (const chunk of splitSentences(text)) {
    if (token !== speechToken) return false
    await speakChunk(chunk, gender, rate)
  }
  return token === speechToken
}

export async function speakLines(
  lines: { text: string; voice: 'male' | 'female' }[],
  rate = 1,
  onLine?: (index: number) => void,
): Promise<boolean> {
  await loadVoices()
  const token = ++speechToken
  for (let i = 0; i < lines.length; i++) {
    if (token !== speechToken) return false
    onLine?.(i)
    for (const chunk of splitSentences(lines[i].text)) {
      if (token !== speechToken) return false
      await speakChunk(chunk, lines[i].voice, rate)
    }
    await new Promise((r) => setTimeout(r, 350))
  }
  return token === speechToken
}

export function cancelSpeech() {
  speechToken++
  if ('speechSynthesis' in window) speechSynthesis.cancel()
}

// ---------------- Speech recognition ----------------

interface SpeechAlt {
  transcript: string
  confidence?: number
}
interface SpeechRecognitionResultLike {
  isFinal: boolean
  length: number
  [index: number]: SpeechAlt
}
interface SpeechRecognitionEventLike {
  resultIndex: number
  results: ArrayLike<SpeechRecognitionResultLike>
}
interface SpeechRecognitionLike {
  lang: string
  continuous: boolean
  interimResults: boolean
  maxAlternatives: number
  start(): void
  stop(): void
  abort(): void
  onresult: ((e: SpeechRecognitionEventLike) => void) | null
  onend: (() => void) | null
  onerror: ((e: { error: string }) => void) | null
}

type RecognitionCtor = new () => SpeechRecognitionLike

function getRecognitionCtor(): RecognitionCtor | undefined {
  const w = window as unknown as { SpeechRecognition?: RecognitionCtor; webkitSpeechRecognition?: RecognitionCtor }
  return w.SpeechRecognition ?? w.webkitSpeechRecognition
}

export const speechRecognitionSupported = () => !!getRecognitionCtor()
export const recordingSupported = () => typeof MediaRecorder !== 'undefined' && !!navigator.mediaDevices?.getUserMedia

const MIC_CONSTRAINTS: MediaTrackConstraints = {
  echoCancellation: true,
  noiseSuppression: true,
  autoGainControl: true,
  channelCount: 1,
}

/** Shared mic so the next sentence does not wait for a new permission / device open. */
let sharedMic: MediaStream | undefined
let sharedMicUsers = 0

export async function acquireMic(): Promise<MediaStream> {
  if (sharedMic && sharedMic.active && sharedMic.getAudioTracks().some((t) => t.readyState === 'live')) {
    sharedMicUsers++
    return sharedMic
  }
  sharedMic = await navigator.mediaDevices.getUserMedia({ audio: MIC_CONSTRAINTS })
  sharedMicUsers = 1
  return sharedMic
}

export function releaseMic() {
  sharedMicUsers = Math.max(0, sharedMicUsers - 1)
  if (sharedMicUsers === 0 && sharedMic) {
    sharedMic.getTracks().forEach((t) => t.stop())
    sharedMic = undefined
  }
}

const joinText = (...parts: string[]) => parts.join(' ').replace(/\s+/g, ' ').trim()

export interface RecorderOptions {
  /** Existing mic stream from acquireMic(); recorder will not stop its tracks. */
  stream?: MediaStream
  /** Target sentence (Listen and Repeat). Used only to pick the closest speech-recognition alternative. */
  hint?: string
}

/**
 * Records microphone audio and transcribes it with the Web Speech API at the same time.
 */
export class SpeechRecorder {
  private recognition?: SpeechRecognitionLike
  private mediaRecorder?: MediaRecorder
  private stream?: MediaStream
  private ownStream = false
  private chunks: Blob[] = []
  /** Final text from previous recognition sessions (Chrome restarts after silence). */
  private committed = ''
  private sessionFinal = ''
  private interimText = ''
  private alternatives = new Set<string>()
  private active = false
  private startedAt = 0
  private peakLevel = 0
  private recognitionEnded: Promise<void> = Promise.resolve()
  private resolveRecognitionEnded?: () => void
  private analyser?: AnalyserNode
  private audioCtx?: AudioContext
  private raf = 0
  private hint?: string
  public error?: string

  onTranscript?: (text: string) => void
  onLevel?: (level: number) => void

  async start(opts: RecorderOptions = {}) {
    this.chunks = []
    this.committed = ''
    this.sessionFinal = ''
    this.interimText = ''
    this.alternatives.clear()
    this.error = undefined
    this.active = true
    this.startedAt = performance.now()
    this.peakLevel = 0
    this.hint = opts.hint

    if (recordingSupported()) {
      try {
        if (opts.stream && opts.stream.active) {
          this.stream = opts.stream
          this.ownStream = false
        } else {
          this.stream = await acquireMic()
          this.ownStream = true
        }
        const mime = ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus', 'audio/mp4'].find((m) =>
          MediaRecorder.isTypeSupported(m),
        )
        this.mediaRecorder = new MediaRecorder(this.stream, mime ? { mimeType: mime, audioBitsPerSecond: 128000 } : undefined)
        this.mediaRecorder.ondataavailable = (e) => e.data.size && this.chunks.push(e.data)
        try {
          this.mediaRecorder.start(250)
        } catch {
          this.mediaRecorder.start()
        }
        this.startMeter(this.stream)
      } catch (err) {
        this.error = 'Mikrofona erişilemedi. Tarayıcıdan mikrofon izni verdiğinden emin ol.'
        console.error(err)
      }
    }

    const Ctor = getRecognitionCtor()
    if (Ctor) {
      this.recognitionEnded = new Promise((r) => (this.resolveRecognitionEnded = r))
      this.startRecognition(Ctor)
    }
  }

  private startMeter(stream: MediaStream) {
    try {
      this.audioCtx = new AudioContext()
      const source = this.audioCtx.createMediaStreamSource(stream)
      this.analyser = this.audioCtx.createAnalyser()
      this.analyser.fftSize = 256
      this.analyser.smoothingTimeConstant = 0.4
      source.connect(this.analyser)
      const data = new Uint8Array(this.analyser.fftSize)
      const tick = () => {
        if (!this.analyser || !this.active) return
        this.analyser.getByteTimeDomainData(data)
        let sum = 0
        for (let i = 0; i < data.length; i++) {
          const v = (data[i] - 128) / 128
          sum += v * v
        }
        const rms = Math.sqrt(sum / data.length)
        const level = Math.min(1, rms * 4)
        if (level > this.peakLevel) this.peakLevel = level
        this.onLevel?.(level)
        this.raf = requestAnimationFrame(tick)
      }
      void this.audioCtx.resume()
      this.raf = requestAnimationFrame(tick)
    } catch {
      /* analyser is optional */
    }
  }

  private startRecognition(Ctor: RecognitionCtor) {
    const rec = new Ctor()
    rec.lang = 'en-US'
    rec.continuous = true
    rec.interimResults = true
    rec.maxAlternatives = 5
    rec.onresult = (e) => {
      let sessionFinal = ''
      let interim = ''
      for (let i = 0; i < e.results.length; i++) {
        const r = e.results[i]
        const best = r[0]?.transcript ?? ''
        if (r.isFinal) sessionFinal += ' ' + best
        else interim += ' ' + best
        for (let a = 0; a < r.length; a++) {
          const t = r[a]?.transcript?.trim()
          if (t) this.alternatives.add(t)
        }
      }
      this.sessionFinal = sessionFinal
      this.interimText = interim
      this.onTranscript?.(this.transcript)
    }
    rec.onerror = (e) => {
      if (e.error === 'not-allowed') this.error = 'Mikrofon izni reddedildi.'
      else if (e.error === 'network') this.error = 'Konuşma tanıma için internet bağlantısı gerekli.'
      // no-speech / aborted / audio-capture: Chrome stops; onend restarts while active
    }
    rec.onend = () => {
      if (this.active) {
        this.committed = joinText(this.committed, this.sessionFinal, this.interimText)
        this.sessionFinal = ''
        this.interimText = ''
        this.onTranscript?.(this.transcript)
        window.setTimeout(() => {
          if (!this.active) {
            this.resolveRecognitionEnded?.()
            return
          }
          try {
            this.startRecognition(Ctor)
          } catch {
            this.resolveRecognitionEnded?.()
          }
        }, 80)
        return
      }
      this.committed = joinText(this.committed, this.sessionFinal, this.interimText)
      this.sessionFinal = ''
      this.interimText = ''
      this.resolveRecognitionEnded?.()
    }
    this.recognition = rec
    try {
      rec.start()
    } catch {
      this.resolveRecognitionEnded?.()
    }
  }

  get transcript() {
    return joinText(this.committed, this.sessionFinal, this.interimText)
  }

  private stopMeter() {
    if (this.raf) cancelAnimationFrame(this.raf)
    this.raf = 0
    this.analyser = undefined
    if (this.audioCtx) {
      void this.audioCtx.close()
      this.audioCtx = undefined
    }
  }

  async stop(): Promise<SpokenAnswer> {
    this.active = false
    const durationSec = (performance.now() - this.startedAt) / 1000
    this.stopMeter()

    const audioDone = new Promise<Blob | undefined>((resolve) => {
      const mr = this.mediaRecorder
      if (!mr || mr.state === 'inactive') return resolve(undefined)
      mr.onstop = () => resolve(new Blob(this.chunks, { type: mr.mimeType || 'audio/webm' }))
      try {
        mr.requestData()
      } catch {
        /* older browsers */
      }
      mr.stop()
    })

    try {
      this.recognition?.stop()
    } catch {
      /* already stopped */
    }
    await Promise.race([this.recognitionEnded, new Promise((r) => setTimeout(r, 2500))])
    // Last interim results sometimes arrive right after stop()
    await new Promise((r) => setTimeout(r, 120))
    const audio = await audioDone
    if (this.ownStream) releaseMic()
    this.stream = undefined

    const raw = this.transcript
    const alternatives = [...this.alternatives].filter((t) => t && t !== raw)
    const transcript = this.hint ? pickBestTranscript(this.hint, [raw, ...alternatives]) || raw : raw
    return { transcript, alternatives, audio, durationSec, peakLevel: this.peakLevel }
  }

  abort() {
    this.active = false
    this.stopMeter()
    try {
      this.recognition?.abort()
    } catch {
      /* ignore */
    }
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      try {
        this.mediaRecorder.stop()
      } catch {
        /* ignore */
      }
    }
    if (this.ownStream) releaseMic()
    this.stream = undefined
  }
}

export function beep(freq = 880, ms = 250): Promise<void> {
  return new Promise((resolve) => {
    try {
      const ctx = new AudioContext()
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.frequency.value = freq
      gain.gain.value = 0.15
      osc.connect(gain).connect(ctx.destination)
      osc.start()
      setTimeout(() => {
        osc.stop()
        ctx.close()
        resolve()
      }, ms)
    } catch {
      resolve()
    }
  })
}

/** Decodes any recorded audio and re-encodes it as 16 kHz mono 16-bit WAV. */
export async function toWav(blob: Blob, sampleRate = 16000): Promise<Blob> {
  const ctx = new AudioContext()
  try {
    const decoded = await ctx.decodeAudioData(await blob.arrayBuffer())
    const length = Math.ceil(decoded.duration * sampleRate)
    const offline = new OfflineAudioContext(1, length, sampleRate)
    const src = offline.createBufferSource()
    src.buffer = decoded
    src.connect(offline.destination)
    src.start()
    const rendered = await offline.startRendering()
    const samples = rendered.getChannelData(0)

    const buffer = new ArrayBuffer(44 + samples.length * 2)
    const view = new DataView(buffer)
    const writeStr = (off: number, str: string) => [...str].forEach((c, i) => view.setUint8(off + i, c.charCodeAt(0)))
    writeStr(0, 'RIFF')
    view.setUint32(4, 36 + samples.length * 2, true)
    writeStr(8, 'WAVE')
    writeStr(12, 'fmt ')
    view.setUint32(16, 16, true)
    view.setUint16(20, 1, true)
    view.setUint16(22, 1, true)
    view.setUint32(24, sampleRate, true)
    view.setUint32(28, sampleRate * 2, true)
    view.setUint16(32, 2, true)
    view.setUint16(34, 16, true)
    writeStr(36, 'data')
    view.setUint32(40, samples.length * 2, true)
    for (let i = 0; i < samples.length; i++) {
      const s = Math.max(-1, Math.min(1, samples[i]))
      view.setInt16(44 + i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true)
    }
    return new Blob([buffer], { type: 'audio/wav' })
  } finally {
    ctx.close()
  }
}

export function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result).split(',')[1] ?? '')
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}
