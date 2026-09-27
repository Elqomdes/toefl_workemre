import { Link } from 'react-router-dom'
import { SECTION_NAMES, SECTIONS, tasksOf } from '../data/taskInfo'
import { cefr } from '../lib/scoring'
import { getAttempts, hasAIKey } from '../lib/storage'

export default function Home() {
  const lastFull = getAttempts()
    .filter((a) => a.mode === 'full' && a.overall !== null)
    .sort((a, b) => b.date.localeCompare(a.date))[0]
  const aiReady = hasAIKey()

  return (
    <div className="space-y-8">
      <section className="rounded-2xl bg-gradient-to-br from-brand-600 to-indigo-700 p-8 text-white shadow-lg">
        <h1 className="text-3xl font-extrabold md:text-4xl">TOEFL iBT pratiği, anında puan</h1>
        <p className="mt-3 max-w-2xl text-brand-100">
          Yeni formata (Ocak 2026) uygun görevleri çöz, her bölümde 1-6 band puanını ve ayrıntılı geri bildirimi gör. Listen and Repeat
          cevapların kelime kelime karşılaştırılır. Mülakat ve yazma cevapların yapay zeka tarafından ETS rubriğine göre puanlanır.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link to="/full-test" className="btn bg-white text-brand-700 hover:bg-brand-50">
            Tam deneme sınavına başla
          </Link>
          <Link to="/practice/speaking" className="btn border border-white/40 text-white hover:bg-white/10">
            Konuşma pratiği yap
          </Link>
          <Link to="/vocab" className="btn border border-white/40 text-white hover:bg-white/10">
            Kelime çalış
          </Link>
        </div>
        {lastFull && lastFull.overall !== null && (
          <p className="mt-6 text-sm text-brand-100">
            Son deneme puanın: <b className="text-lg text-white">{lastFull.overall.toFixed(1)}</b> (CEFR {cefr(lastFull.overall)}) ·{' '}
            <Link to={`/results/${lastFull.id}`} className="underline">
              detaylar
            </Link>
          </p>
        )}
      </section>

      {!aiReady && (
        <div className="card flex flex-wrap items-center justify-between gap-3 border-amber-200 bg-amber-50">
          <p className="text-sm text-amber-900">
            <b>Yazma ve konuşma puanlaması için API anahtarı gerekli.</b> Google AI Studio'dan ücretsiz Gemini anahtarı alıp Ayarlar'a
            yapıştırman yeterli.
          </p>
          <Link to="/settings" className="btn-primary">
            Ayarlara git
          </Link>
        </div>
      )}

      <section>
        <div className="mb-6 grid gap-4 md:grid-cols-2">
        <Link to="/vocab" className="card flex flex-wrap items-center justify-between gap-3 border-emerald-200 bg-emerald-50/70 hover:shadow-md">
          <div>
            <h2 className="text-lg font-bold text-emerald-900">Kelime Çalışması</h2>
            <p className="text-sm text-emerald-800">
              Reading’de yanlış yaptığın kelimeleri kart ve yazma alıştırmasıyla çalış. Complete the Words çözdükçe liste büyür.
            </p>
          </div>
          <span className="btn-primary">Aç</span>
        </Link>
        <Link to="/coach" className="card flex flex-wrap items-center justify-between gap-3 border-violet-200 bg-violet-50/70 hover:shadow-md">
          <div>
            <h2 className="text-lg font-bold text-violet-950">Yapay Zeka Önerileri</h2>
            <p className="text-sm text-violet-800">
              10 aktiviteden sonra hatalarına bakıp ne çalışman gerektiğini söyler.
            </p>
          </div>
          <span className="btn-primary">Aç</span>
        </Link>
        </div>
        <h2 className="mb-4 text-xl font-bold">Bölümler</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {SECTIONS.map((s) => (
            <Link key={s} to={`/practice/${s}`} className="card group transition hover:-translate-y-0.5 hover:shadow-md">
              <div className={`mb-3 h-1.5 w-12 rounded-full ${SECTION_NAMES[s].color}`} />
              <h3 className="text-lg font-bold group-hover:text-brand-700">{SECTION_NAMES[s].en}</h3>
              <p className="mb-3 text-sm text-slate-500">{SECTION_NAMES[s].tr}</p>
              <ul className="space-y-1 text-sm text-slate-600">
                {tasksOf(s).map((t) => (
                  <li key={t.type} className="flex items-center gap-1.5">
                    <span className="text-slate-400">•</span> {t.name}
                    {t.aiScored && <span className="rounded bg-violet-100 px-1 text-[10px] font-bold text-violet-700">AI</span>}
                  </li>
                ))}
              </ul>
            </Link>
          ))}
        </div>
      </section>

      <section className="card">
        <h2 className="mb-3 text-lg font-bold">Puanlama nasıl çalışıyor?</h2>
        <div className="grid gap-4 text-sm text-slate-600 md:grid-cols-3">
          <div>
            <p className="font-semibold text-slate-800">Okuma ve Dinleme</p>
            <p>Cevap anahtarıyla otomatik puanlanır. Yanlış cevaplarda doğru cevap ve açıklama gösterilir.</p>
          </div>
          <div>
            <p className="font-semibold text-slate-800">Listen and Repeat</p>
            <p>
              Söylediklerin metne çevrilir ve hedef cümleyle kelime kelime karşılaştırılır (0-5). Gemini açıksa ses kaydın dinlenip telaffuzuna da
              puan verilir.
            </p>
          </div>
          <div>
            <p className="font-semibold text-slate-800">Mülakat ve Yazma</p>
            <p>Yapay zeka ETS rubriğine göre 0-5 puan, güçlü ve zayıf yönler, düzeltilmiş örnek cevap ve ipuçları verir.</p>
          </div>
        </div>
        <p className="mt-4 text-xs text-slate-500">
          Her bölümün yüzdesi 1-6 band'e çevrilir. Genel puan, dört bölümün ortalamasının en yakın 0.5'e yuvarlanmasıyla hesaplanır. Band 6 ≈
          C2, 5 ≈ C1, 4 ≈ B2, 3 ≈ B1.
        </p>
      </section>
    </div>
  )
}
