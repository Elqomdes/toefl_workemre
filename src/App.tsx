import { HashRouter, NavLink, Route, Routes } from 'react-router-dom'
import Home from './pages/Home'
import SectionPractice from './pages/SectionPractice'
import PracticeRun from './pages/PracticeRun'
import FullTest from './pages/FullTest'
import Results from './pages/Results'
import History from './pages/History'
import SettingsPage from './pages/Settings'
import Vocab from './pages/Vocab'
import Coach from './pages/Coach'

const navClass = ({ isActive }: { isActive: boolean }) =>
  `rounded-md px-3 py-2 text-sm font-medium ${isActive ? 'bg-brand-500 text-white' : 'text-slate-600 hover:bg-slate-100'}`

export default function App() {
  return (
    <HashRouter>
      <div className="flex min-h-screen flex-col">
        <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-2 px-4 py-3">
            <NavLink to="/" className="mr-4 flex items-center gap-2 text-lg font-bold text-brand-700">
              <span className="rounded-md bg-brand-500 px-2 py-0.5 text-white">TOEFL</span>
              Skor Pratik
            </NavLink>
            <nav className="flex flex-wrap gap-1">
              <NavLink to="/" end className={navClass}>
                Ana Sayfa
              </NavLink>
              <NavLink to="/full-test" className={navClass}>
                Tam Deneme
              </NavLink>
              <NavLink to="/practice/reading" className={navClass}>
                Bölüm Pratiği
              </NavLink>
              <NavLink to="/vocab" className={navClass}>
                Kelimeler
              </NavLink>
              <NavLink to="/coach" className={navClass}>
                Öneriler
              </NavLink>
              <NavLink to="/history" className={navClass}>
                Geçmiş
              </NavLink>
              <NavLink to="/settings" className={navClass}>
                Ayarlar
              </NavLink>
            </nav>
          </div>
        </header>
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/practice/:section" element={<SectionPractice />} />
            <Route path="/practice/:section/:taskType/:setId" element={<PracticeRun />} />
            <Route path="/full-test" element={<FullTest />} />
            <Route path="/results/:attemptId" element={<Results />} />
            <Route path="/vocab" element={<Vocab />} />
            <Route path="/coach" element={<Coach />} />
            <Route path="/history" element={<History />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        </main>
        <footer className="border-t border-slate-200 py-4 text-center text-xs text-slate-500">
          Puanlar tahminidir, resmi ETS puanı değildir. Yeni TOEFL iBT formatı (Ocak 2026) esas alınmıştır.
        </footer>
      </div>
    </HashRouter>
  )
}
