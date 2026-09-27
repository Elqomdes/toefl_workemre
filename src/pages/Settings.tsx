import { useState } from 'react'
import { scoreEmail } from '../lib/ai'
import { DEFAULT_SETTINGS, getSettings, saveSettings } from '../lib/storage'
import { speak, speechRecognitionSupported, recordingSupported } from '../lib/speech'
import type { Settings } from '../types'

export default function SettingsPage() {
  const [s, setS] = useState<Settings>(getSettings())
  const [saved, setSaved] = useState(false)
  const [testMsg, setTestMsg] = useState<string>()
  const [testing, setTesting] = useState(false)

  const update = <K extends keyof Settings>(k: K, v: Settings[K]) => {
    setS((prev) => ({ ...prev, [k]: v }))
    setSaved(false)
  }

  const save = () => {
    saveSettings(s)
    setSaved(true)
  }

  const testKey = async () => {
    saveSettings(s)
    setTesting(true)
    setTestMsg(undefined)
    try {
      const fb = await scoreEmail(
        { id: 't', type: 'email', title: 't', to: 'Professor', scenario: 'Ask for an extension.', bullets: ['Ask for more time'] },
        'Dear Professor, could I please have two more days for my essay? I was sick last week. Thank you, Emre',
      )
      setTestMsg(`Bağlantı başarılı. Test e-postası ${fb.score}/5 aldı.`)
    } catch (e) {
      setTestMsg(`Hata: ${(e as Error).message}`)
    } finally {
      setTesting(false)
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="text-2xl font-bold">Ayarlar</h1>

      <section className="card space-y-4">
        <h2 className="text-lg font-semibold">Yapay Zeka Puanlaması</h2>
        <p className="text-sm text-slate-600">
          Mülakat (Take an Interview), E-posta ve Akademik Tartışma cevapların TOEFL rubriğine göre yapay zeka tarafından puanlanır. API
          anahtarın sadece bu tarayıcıda (localStorage) saklanır ve doğrudan sağlayıcıya gönderilir. Tarayıcı konuşmayı kaçırırsa kayıt
          Gemini veya Whisper ile yeniden metne çevrilir; iyi bir tarayıcı transkripti ezilmez.
        </p>

        <div className="flex gap-3">
          {(['gemini', 'openai'] as const).map((p) => (
            <label
              key={p}
              className={`flex flex-1 cursor-pointer items-center gap-2 rounded-lg border p-3 ${s.provider === p ? 'border-brand-500 bg-brand-50' : 'border-slate-200'}`}
            >
              <input type="radio" checked={s.provider === p} onChange={() => update('provider', p)} />
              <div>
                <div className="font-semibold">{p === 'gemini' ? 'Google Gemini' : 'OpenAI'}</div>
                <div className="text-xs text-slate-500">
                  {p === 'gemini'
                    ? 'Ücretsiz kotası var; ses kaydını dinler, transkripti tamamlar ve telaffuzu da değerlendirir.'
                    : 'Whisper ile kaydı metne çevirir, metin üzerinden puanlar.'}
                </div>
              </div>
            </label>
          ))}
        </div>

        {s.provider === 'gemini' ? (
          <div className="space-y-3">
            <label className="block text-sm font-medium">
              Gemini API anahtarı
              <input className="input mt-1" type="password" value={s.geminiKey} onChange={(e) => update('geminiKey', e.target.value)} placeholder="AIza..." />
            </label>
            <p className="text-xs text-slate-500">
              Ücretsiz anahtar almak için:{' '}
              <a className="text-brand-600 underline" href="https://aistudio.google.com/apikey" target="_blank" rel="noreferrer">
                aistudio.google.com/apikey
              </a>{' '}
              adresine Google hesabınla gir ve "Create API key" butonuna tıkla.
            </p>
            <label className="block text-sm font-medium">
              Model
              <input className="input mt-1" value={s.geminiModel} onChange={(e) => update('geminiModel', e.target.value)} />
            </label>
          </div>
        ) : (
          <div className="space-y-3">
            <label className="block text-sm font-medium">
              OpenAI API anahtarı
              <input className="input mt-1" type="password" value={s.openaiKey} onChange={(e) => update('openaiKey', e.target.value)} placeholder="sk-..." />
            </label>
            <label className="block text-sm font-medium">
              Model
              <input className="input mt-1" value={s.openaiModel} onChange={(e) => update('openaiModel', e.target.value)} />
            </label>
          </div>
        )}

        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={s.pronunciationFeedback} onChange={(e) => update('pronunciationFeedback', e.target.checked)} />
          Listen and Repeat için yapay zeka telaffuz değerlendirmesi (sadece Gemini)
        </label>

        <div className="flex flex-wrap items-center gap-3">
          <button className="btn-primary" onClick={save}>
            Kaydet
          </button>
          <button className="btn-secondary" onClick={testKey} disabled={testing}>
            {testing ? 'Test ediliyor...' : 'Bağlantıyı test et'}
          </button>
          <button
            className="btn-secondary"
            onClick={() => {
              setS({ ...DEFAULT_SETTINGS, geminiKey: s.geminiKey, openaiKey: s.openaiKey })
              setSaved(false)
            }}
          >
            Varsayılan modeller
          </button>
          {saved && <span className="text-sm text-emerald-600">Kaydedildi.</span>}
        </div>
        {testMsg && <p className={`text-sm ${testMsg.startsWith('Hata') ? 'text-rose-600' : 'text-emerald-600'}`}>{testMsg}</p>}
      </section>

      <section className="card space-y-4">
        <h2 className="text-lg font-semibold">Ses</h2>
        <label className="block text-sm font-medium">
          Dinleme konuşma hızı: {s.voiceRate.toFixed(2)}x
          <input
            type="range"
            min={0.7}
            max={1.2}
            step={0.05}
            value={s.voiceRate}
            onChange={(e) => update('voiceRate', parseFloat(e.target.value))}
            className="mt-2 w-full"
          />
        </label>
        <div className="flex gap-2">
          <button className="btn-secondary" onClick={() => speak('Welcome to the TOEFL practice test. This is a female voice.', 'female', s.voiceRate)}>
            Kadın sesi dene
          </button>
          <button className="btn-secondary" onClick={() => speak('This is a male voice for the listening section.', 'male', s.voiceRate)}>
            Erkek sesi dene
          </button>
        </div>
        <ul className="space-y-1 text-sm">
          <li>
            Konuşma tanıma:{' '}
            {speechRecognitionSupported() ? (
              <span className="text-emerald-600">destekleniyor</span>
            ) : (
              <span className="text-rose-600">desteklenmiyor. Chrome veya Edge kullan.</span>
            )}
          </li>
          <li>
            Ses kaydı: {recordingSupported() ? <span className="text-emerald-600">destekleniyor</span> : <span className="text-rose-600">desteklenmiyor</span>}
          </li>
        </ul>
        <p className="text-xs text-slate-500">Kaydet butonuna basmayı unutma. Konuşma hızı Kaydet'ten sonra dinleme bölümlerine uygulanır.</p>
      </section>
    </div>
  )
}
