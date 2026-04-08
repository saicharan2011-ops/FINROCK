import React from 'react'
import { Link } from 'react-router-dom'
import { useTheme } from '../../../context/ThemeContext'

export default function LandingDark() {
  const { toggleTheme } = useTheme()

  return (
    <div className="bg-background text-on-surface font-body antialiased min-h-screen">
      <style>{`
        .material-symbols-outlined { font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24; }
        .glass-card { background: rgba(38, 38, 38, 0.6); backdrop-filter: blur(20px); border-top: 1px solid rgba(133, 241, 202, 0.15); }
        .primary-gradient { background-image: linear-gradient(135deg, #85f1ca 0%, #43b38f 100%); }
        .neon-glow { box-shadow: 0 0 20px rgba(133, 241, 202, 0.3); }
        .kinetic-bg {
          background-image:
            radial-gradient(circle at 20% 30%, rgba(133, 241, 202, 0.05) 0%, transparent 50%),
            radial-gradient(circle at 80% 70%, rgba(108, 221, 255, 0.05) 0%, transparent 50%);
        }
      `}</style>

      <nav className="fixed top-0 w-full z-50 bg-[#0e0e0e]/80 backdrop-blur-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)]">
        <div className="flex justify-between items-center w-full px-8 h-20 max-w-[1920px] mx-auto">
          <div className="text-2xl font-bold tracking-tighter text-[#85f1ca] font-headline">FINROCK</div>
          <div className="hidden md:flex items-center space-x-10 font-headline tracking-tight">
            <Link className="text-zinc-400 hover:text-zinc-100 transition-colors" to="/">
              Markets
            </Link>
            <Link className="text-zinc-400 hover:text-zinc-100 transition-colors" to="/live-agent">
              Analysis
            </Link>
            <Link className="text-[#85f1ca] border-b-2 border-[#85f1ca] pb-1" to="/dashboard">
              Portfolio
            </Link>
            <Link className="text-zinc-400 hover:text-zinc-100 transition-colors" to="/audit">
              Reports
            </Link>
            <button onClick={toggleTheme} className="text-zinc-400 hover:text-[#85f1ca] transition-colors text-xs font-bold uppercase tracking-widest">
              Switch Theme
            </button>
          </div>
          <Link to="/dashboard" className="primary-gradient text-black px-8 py-3 rounded-full font-bold font-headline tracking-tight hover:scale-105 active:scale-95 transition-all neon-glow text-center">
            Run Analysis
          </Link>
        </div>
      </nav>

      <section className="relative pt-44 pb-24 kinetic-bg overflow-hidden">
        <div className="max-w-7xl mx-auto px-8 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7 z-10">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-primary/10 text-primary font-label text-[10px] uppercase tracking-widest mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
              <span>Live Institutional Engine</span>
            </div>
            <h1 className="text-6xl md:text-8xl font-headline font-bold leading-[0.95] tracking-tighter mb-8 text-on-surface">
              Appraise Any Corporate <br />
              <span className="text-transparent bg-clip-text primary-gradient">Loan in 40 Seconds.</span>
            </h1>
            <p className="text-xl text-on-surface-variant max-w-xl mb-10 leading-relaxed font-body">
              Harness high-stakes AI to stress-test debt instruments with the kinetic energy of global markets. Secure your assets in our digital vault.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link to="/dashboard" className="primary-gradient text-black px-10 py-5 rounded-full text-lg font-extrabold font-headline hover:scale-105 transition-all neon-glow uppercase tracking-tighter text-center">
                Get Started
              </Link>
              <Link to="/live-agent?autostart=1" className="glass-card text-on-surface px-10 py-5 rounded-full text-lg font-bold font-headline hover:bg-surface-variant/40 transition-all border border-outline-variant/20 text-center">
                View Demo
              </Link>
            </div>
          </div>
          <div className="lg:col-span-5 relative flex justify-center">
            <div className="relative w-full aspect-square max-w-md">
              <div className="absolute inset-0 bg-primary/20 blur-[120px] rounded-full"></div>
              <img
                alt="3D credit card"
                className="relative z-10 w-full h-full object-contain transform rotate-12"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCA7YNMtNyhe2okYKoKTzjaD5j_TTSEwAKXqgFj2e9lOqKqxgbELTl4NwQSx2uAXzJAk0wDVtIwrx9L7Hj1Sex2ePIISCpWGBajv-uVa3gLD8cX5kAYVLOWKp6ZjegrwM_k9fpxS6jHlQLnK6H6lX9UKoRwptU1XfFzvRHRk7mcH5kf7BGSaoxAOdYMHXXt4RTAcnd7Ab2RclAlqkdZMYrsXqegCSsXKqoQV_oLKyDtN5yKl_icy7uZRdFDPo8qC6Xro0oXlWxtF3E"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="bg-surface-container-low py-12">
        <div className="max-w-7xl mx-auto px-8 flex flex-wrap justify-between gap-12">
          <div className="flex flex-col">
            <span className="text-primary font-headline text-4xl font-bold">$4.2B+</span>
            <span className="text-zinc-500 font-label text-[10px] uppercase tracking-[0.2em] mt-1">Portfolio Under Management</span>
          </div>
          <div className="flex flex-col border-l border-outline-variant/10 pl-12">
            <span className="text-primary font-headline text-4xl font-bold">99.9%</span>
            <span className="text-zinc-500 font-label text-[10px] uppercase tracking-[0.2em] mt-1">Underwriting Accuracy</span>
          </div>
          <div className="flex flex-col border-l border-outline-variant/10 pl-12">
            <span className="text-primary font-headline text-4xl font-bold">40s</span>
            <span className="text-zinc-500 font-label text-[10px] uppercase tracking-[0.2em] mt-1">Mean Analysis Time</span>
          </div>
          <div className="flex flex-col border-l border-outline-variant/10 pl-12">
            <span className="text-primary font-headline text-4xl font-bold">500+</span>
            <span className="text-zinc-500 font-label text-[10px] uppercase tracking-[0.2em] mt-1">Institutional Clients</span>
          </div>
        </div>
      </section>

      <footer className="bg-[#0e0e0e] w-full py-12">
        <div className="max-w-7xl mx-auto px-8 flex flex-col md:flex-row justify-between items-center space-y-8 md:space-y-0">
          <div className="flex flex-col items-center md:items-start">
            <span className="text-[#85f1ca] font-bold text-2xl font-headline tracking-tighter">FINROCK</span>
            <span className="font-body text-[10px] uppercase tracking-[0.1em] text-zinc-600 mt-2">© 2024 FINROCK. ALL RIGHTS RESERVED.</span>
          </div>
          <div className="flex space-x-8">
            <a className="font-body text-[10px] uppercase tracking-[0.1em] text-zinc-600 hover:text-[#85f1ca] transition-colors" href="#">Privacy Policy</a>
            <a className="font-body text-[10px] uppercase tracking-[0.1em] text-zinc-600 hover:text-[#85f1ca] transition-colors" href="#">Terms of Service</a>
            <a className="font-body text-[10px] uppercase tracking-[0.1em] text-zinc-600 hover:text-[#85f1ca] transition-colors" href="#">Security</a>
          </div>
        </div>
      </footer>
    </div>
  )
}

