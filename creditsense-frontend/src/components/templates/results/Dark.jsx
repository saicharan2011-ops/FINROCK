import React from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../../../context/ThemeContext';
import { useSession } from '../../../hooks/useSession';
import { camDownloadUrl, getResults } from '../../../lib/backend';

const ResultsDark = () => {
    const { toggleTheme } = useTheme();
    const { sessionId } = useSession();
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState('');
    const [results, setResults] = React.useState(null);

    React.useEffect(() => {
        let cancelled = false;
        async function load() {
            if (!sessionId) return;
            setLoading(true);
            setError('');
            try {
                const data = await getResults(sessionId);
                if (!cancelled) setResults(data);
            } catch (e) {
                if (!cancelled) setError(e?.response?.data?.detail || e?.message || 'No results yet. Run analysis first.');
            } finally {
                if (!cancelled) setLoading(false);
            }
        }
        load();
        return () => { cancelled = true; };
    }, [sessionId]);

    return (
        <div className="bg-background text-zinc-100 font-body min-h-screen flex flex-col font-['Manrope'] antialiased">
            <style>{`
        .material-symbols-outlined {
            font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
        }
        .glass-panel {
            background: rgba(38, 38, 38, 0.6);
            backdrop-filter: blur(20px);
        }
`}</style>
            <nav className="fixed top-0 w-full z-50 bg-[#0e0e0e]/80 backdrop-blur-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)]">
                <div className="flex justify-between items-center w-full px-8 h-20 max-w-[1920px] mx-auto">
                    <div className="text-2xl font-bold tracking-tighter text-[#85f1ca] font-headline">KINETIC VAULT</div>
                    <div className="hidden md:flex items-center space-x-8 font-headline tracking-tight uppercase text-[10px] font-black">
                        <Link className="text-zinc-400 hover:text-zinc-100 transition-colors" to="/">Markets</Link>
                        <Link className="text-zinc-400 hover:text-zinc-100 transition-colors" to="/live-agent">Analysis</Link>
                        <Link className="text-zinc-400 hover:text-zinc-100 transition-colors" to="/dashboard">Portfolio</Link>
                        <Link className="text-[#85f1ca] border-b-2 border-[#85f1ca] pb-1" to="/results">Reports</Link>
                        <button onClick={toggleTheme} className="text-zinc-400 hover:text-primary transition-colors text-xs">Switch Theme</button>
                    </div>
                    <Link to="/live-agent" className="bg-gradient-to-r from-primary to-primary-container text-on-primary px-6 py-2.5 rounded-full font-bold hover:shadow-[0_0_20px_rgba(133,241,202,0.3)] transition-all active:scale-95 duration-200">
                        Run Analysis
                    </Link>
                </div>
            </nav>

            <aside className="h-screen w-64 fixed left-0 top-0 pt-24 bg-[#0e0e0e] z-40 hidden xl:flex flex-col py-6 border-r border-white/5">
                <div className="px-6 mb-8 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-surface-container-highest flex items-center justify-center border border-outline-variant/20">
                        <span className="material-symbols-outlined text-primary">account_circle</span>
                    </div>
                    <div>
                        <p className="text-sm font-bold">Alpha Trader</p>
                        <p className="text-[10px] uppercase tracking-wider text-zinc-500">Premium Tier</p>
                    </div>
                </div>
                <nav className="flex-1 space-y-1">
                    <Link className="flex items-center gap-4 px-6 py-3 text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/30 transition-all font-medium text-sm" to="/dashboard">
                        <span className="material-symbols-outlined">dashboard</span> Dashboard
                    </Link>
                    <Link className="flex items-center gap-4 px-6 py-3 text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/30 transition-all font-medium text-sm" to="/live-agent">
                        <span className="material-symbols-outlined">query_stats</span> Live View
                    </Link>
                    <Link className="flex items-center gap-4 px-6 py-3 text-[#85f1ca] bg-[#85f1ca]/10 rounded-r-full font-bold translate-x-1 duration-200 text-sm" to="/results">
                        <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>analytics</span> Results
                    </Link>
                </nav>
            </aside>

            <main className="xl:ml-64 pt-20 min-h-screen">
                <div className="sticky top-20 z-30 w-full bg-primary py-3 px-8 flex items-center justify-between shadow-[0_4px_20px_rgba(133,241,202,0.2)]">
                    <div className="flex items-center gap-3 text-black">
                        <span className="material-symbols-outlined font-bold">verified_user</span>
                        <span className="font-bold font-headline tracking-tight uppercase text-xs">
                            {results?.decision ? `AI RECOMMENDATION: ${String(results.decision).toUpperCase()}` : 'AI RECOMMENDATION: RUN ANALYSIS'}
                        </span>
                    </div>
                    <div className="hidden md:flex items-center gap-6">
                        <span className="text-black/80 text-xs font-bold uppercase tracking-widest">Session: {sessionId || '...'}</span>
                        <Link to="/live-agent" className="bg-black text-primary px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest hover:scale-105 transition-all">Go Live</Link>
                    </div>
                </div>

                <div className="max-w-[1600px] mx-auto p-8 space-y-8">
                    <header className="flex flex-col md:flex-row justify-between items-end gap-6 mb-12">
                        <div className="space-y-2">
                            <p className="text-primary font-bold text-xs tracking-[0.2em] uppercase">Analysis Engine v4.2</p>
                            <h1 className="text-6xl font-headline font-bold tracking-tighter leading-none">CreditSense AI <br /><span className="text-zinc-500">Global Assessment</span></h1>
                        </div>
                        <div className="bg-surface-container-low p-6 rounded-xl text-right border border-white/5 shadow-xl">
                            <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mb-1">Risk Index</p>
                            <p className="text-4xl font-headline font-bold text-primary">{results?.decision ? String(results.decision).toUpperCase() : '—'}</p>
                        </div>
                    </header>

                    {(loading || error) && (
                        <div className="bg-white/5 border border-white/10 rounded-xl p-6 text-sm text-zinc-300">
                            {loading ? 'Loading results…' : error}
                        </div>
                    )}

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        <section className="lg:col-span-4 bg-surface-container-low rounded-xl p-8 space-y-8 border border-white/5">
                            <h3 className="font-headline font-bold text-xl uppercase tracking-tight">Risk Heatmap</h3>
                            <div className="space-y-6">
                                {[
                                    { label: 'Circular Trading', val: results?.gauges?.circular ?? 0, color: 'from-primary to-primary-container' },
                                    { label: 'Lien Exposure', val: results?.gauges?.lien ?? 0, color: 'from-tertiary-dim to-tertiary' },
                                    { label: 'PEP Screening', val: results?.gauges?.pep ?? 0, color: 'from-secondary-dim to-secondary' },
                                ].map((item, i) => (
                                    <div key={i} className="space-y-2">
                                        <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                                            <span>{item.label}</span>
                                            <span>{item.val}%</span>
                                        </div>
                                        <div className="w-full bg-zinc-900 h-2 rounded-full overflow-hidden">
                                            <div className={`bg-gradient-to-r ${item.color} h-full transition-all duration-1000 shadow-[0_0_10px_rgba(133,241,202,0.3)]`} style={{ width: `${item.val}%` }}></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>

                        <section className="lg:col-span-8 bg-surface-container-low rounded-xl p-8 relative overflow-hidden flex items-center justify-center min-h-[450px] border border-white/5 shadow-2xl">
                            <div className="absolute inset-0 opacity-10 pointer-events-none bg-gradient-radial from-primary/10 to-transparent"></div>
                            <div className="relative z-10 w-full h-full">
                                <img alt="Network" className="w-full h-full object-contain mix-blend-lighten" src="https://lh3.googleusercontent.com/aida-public/AB6AXuC3AbQh0IVOJQkXB7D-NSuCCP4hwMczObtBINA12KmcM1mvEv-K0x8sA7ycgqMQ4PlJ4poCq1uDHEEnwxkhf7gd-jW2FqfpnFq5dejhNZgPrRF709fVGMXp_HMbnPGyS7U80C5xJzIG5HbOimFLoquWWKZR0xrwXQJ4_DfXkEnrkZi50ApNrrmkm8EetTiUPlgg6lrfPBaHjHzb2u5Av0yamHOp0HOtFL0hiEMtfyZ0dfnwtkJZuqCZSS-3r0JAJ2dfp8EZxnRm0IU" />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="glass-panel px-10 py-6 rounded-full border border-primary/20 shadow-2xl text-center">
                                        <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-black">Stability</p>
                                        <p className="text-2xl font-headline font-black text-primary">OPTIMAL</p>
                                    </div>
                                </div>
                            </div>
                        </section>

                        <section className="lg:col-span-12 bg-surface-container-low rounded-xl overflow-hidden border border-white/5">
                            <div className="p-8 flex justify-between items-center border-b border-white/5">
                                <h3 className="font-headline font-bold text-xl uppercase tracking-tight">Telemetry Ratios</h3>
                                <button className="bg-zinc-800 px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-zinc-700 transition-all">Export Archive</button>
                            </div>
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="bg-white/5 text-[10px] uppercase font-black tracking-widest text-zinc-500">
                                        <th className="px-8 py-4">Metric</th>
                                        <th className="px-8 py-4">Live</th>
                                        <th className="px-8 py-4">H2-2023</th>
                                        <th className="px-8 py-4">Variance</th>
                                    </tr>
                                </thead>
                                <tbody className="text-sm font-bold divide-y divide-white/5">
                                    {[
                                        { m: 'Debt-to-Equity', c: '0.45', p: '0.52', v: '-13.4%', s: 'Secure' },
                                        { m: 'Liquidity Ratio', c: '2.15', p: '1.8x', v: '+16.1%', s: 'Secure' },
                                    ].map((r, i) => (
                                        <tr key={i} className="hover:bg-white/5 transition-colors">
                                            <td className="px-8 py-6 font-headline">{r.m}</td>
                                            <td className="px-8 py-6 text-primary">{r.c}</td>
                                            <td className="px-8 py-6 text-zinc-500">{r.p}</td>
                                            <td className="px-8 py-6 text-secondary">{r.v}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </section>

                        <section className="lg:col-span-12 bg-gradient-to-r from-primary/10 to-transparent rounded-xl p-12 border border-primary/20 relative group hover:bg-primary/5 transition-all duration-500">
                            <div className="max-w-2xl">
                                <h2 className="text-4xl font-headline font-bold tracking-tight mb-4 uppercase">Appraisal Memo Ready</h2>
                                <p className="text-zinc-500 text-sm leading-relaxed mb-8 font-medium">
                                    {results?.blockchain?.enabled
                                        ? 'Blockchain logger enabled. Decision anchored when available.'
                                        : 'Blockchain logger not configured. CAM still generated locally.'}
                                </p>
                                <div className="flex gap-4">
                                    <a
                                        className="bg-primary text-black font-black px-10 py-5 rounded-full text-xs uppercase tracking-widest hover:scale-105 transition-all inline-flex items-center justify-center"
                                        href={sessionId ? camDownloadUrl(sessionId) : '#'}
                                        onClick={(e) => {
                                            if (!sessionId) e.preventDefault()
                                        }}
                                    >
                                        Download CAM (DOCX)
                                    </a>
                                    <Link to="/audit" className="bg-white/5 border border-white/10 text-white font-black px-10 py-5 rounded-full text-xs uppercase tracking-widest hover:bg-white/10 transition-all inline-flex items-center justify-center">
                                        View Audit Trail
                                    </Link>
                                </div>
                            </div>
                        </section>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default ResultsDark;
