import React, { useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTheme } from '../../../context/ThemeContext';
import { useAnalysis } from '../../../hooks/useAnalysis';
import { useSession } from '../../../hooks/useSession';

const LiveAgentLight = () => {
    const { toggleTheme } = useTheme();
    const { sessionId, loading: sessionLoading, error: sessionError, refreshSession } = useSession();
    const { logs, metrics, startAnalysis, canStart, socketState, socketError } = useAnalysis(sessionId);

    const location = useLocation();
    const autoStartAttemptedRef = useRef(false);
    const unknownSessionRecoveredRef = useRef(false);
    const startAnalysisRef = useRef(startAnalysis);
    const refreshSessionRef = useRef(refreshSession);

    // Keep the latest callback without re-running the auto-start effect.
    useEffect(() => {
        startAnalysisRef.current = startAnalysis;
    }, [startAnalysis]);
    useEffect(() => {
        refreshSessionRef.current = refreshSession;
    }, [refreshSession]);

    useEffect(() => {
        autoStartAttemptedRef.current = false;
    }, [sessionId]);
    useEffect(() => {
        unknownSessionRecoveredRef.current = false;
    }, [sessionId]);

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        if (params.get('autostart') === '1' && sessionId && !autoStartAttemptedRef.current) {
            autoStartAttemptedRef.current = true;
            startAnalysisRef.current();
        }
    }, [location.search, sessionId]);

    useEffect(() => {
        const msg = (socketError || '').toLowerCase();
        if (msg.includes('unknown session_id') && !unknownSessionRecoveredRef.current) {
            unknownSessionRecoveredRef.current = true;
            refreshSessionRef.current();
        }
    }, [socketError]);

    return (
        <div className="bg-background font-body text-on-surface antialiased scan-line-bg min-h-screen flex flex-col">
            <style>{`
        .scan-line-bg {
            background-image: linear-gradient(to bottom, transparent 50%, rgba(1, 45, 29, 0.02) 50%);
            background-size: 100% 4px;
        }
        .arc-gauge {
            stroke-dashoffset: 0;
            transition: stroke-dashoffset 1s ease-out;
        }
        .tonal-shift-bottom {
            box-shadow: 0 10px 30px -15px rgba(1, 45, 29, 0.08);
        }
`}</style>
            {/* Top Navigation */}
            <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-xl shadow-[0_12px_40px_rgba(25,28,29,0.06)] tonal-shift-bottom">
                <div className="flex justify-between items-center max-w-7xl mx-auto px-8 h-20">
                    <div className="text-xl font-bold tracking-tighter text-emerald-900 font-headline">FINROCK</div>
                    <div className="hidden md:flex items-center gap-8">
                        <Link className="text-emerald-800/60 font-medium font-headline tracking-tight hover:text-emerald-900 transition-colors" to="/">Home</Link>
                        <Link className="text-emerald-900 font-bold border-b-2 border-emerald-900 pb-1 font-headline tracking-tight" to="/dashboard">Dashboard</Link>
                        <Link className="text-emerald-800/60 font-medium font-headline tracking-tight hover:text-emerald-900 transition-colors" to="/audit">Audit</Link>
                        <Link className="text-emerald-800/60 font-medium font-headline tracking-tight hover:text-emerald-900 transition-colors" to="/results">Insights</Link>
                        <button onClick={toggleTheme} className="text-emerald-800/60 font-medium hover:text-emerald-900 transition-colors uppercase text-[10px] tracking-widest font-bold">Switch Theme</button>
                    </div>
                    <button
                        onClick={() => startAnalysis()}
                        disabled={!sessionId || !canStart || sessionLoading}
                        className={`bg-primary text-on-primary px-6 py-2.5 rounded-xl font-headline font-bold text-sm hover:opacity-90 transition-all active:scale-95 duration-200 ${(!sessionId || !canStart || sessionLoading) ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        {sessionLoading ? 'Preparing Session...' : !canStart ? 'Connecting...' : 'Run Analysis'}
                    </button>
                </div>
            </nav>

            <main className="mt-24 px-8 max-w-7xl mx-auto w-full flex-grow pb-20 overflow-y-auto custom-scrollbar">
                {(sessionError || socketError) && (
                    <div className="mb-6 rounded-xl border border-red-200 bg-red-50 text-red-700 px-4 py-3 text-sm">
                        {sessionError || socketError}
                    </div>
                )}
                {/* Live Agent Header Area */}
                <header className="flex justify-between items-end mb-10">
                    <div className="space-y-1">
                        <span className="font-label text-xs uppercase tracking-[0.2em] text-primary/60 font-bold">Neural Monitor</span>
                        <h1 className="font-headline text-4xl font-bold tracking-tighter text-primary">Live Agent View</h1>
                    </div>
                    <div className="flex gap-4">
                        <div className="bg-surface-container-lowest px-4 py-2 rounded-lg flex items-center gap-3 border border-outline-variant/10 shadow-sm">
                            <span className={`w-2 h-2 rounded-full ${socketState === 'open' ? 'bg-secondary animate-pulse' : socketState === 'error' ? 'bg-red-500' : 'bg-zinc-300'}`}></span>
                            <span className="font-label text-xs font-bold uppercase">
                                {sessionLoading ? 'Session: Initializing' : socketState === 'open' ? (logs.length > 0 ? 'System: Processing' : 'System: Ready') : socketState === 'error' ? 'System: Connection Error' : 'System: Connecting'}
                            </span>
                        </div>
                    </div>
                </header>

                <div className="grid grid-cols-12 gap-8 mb-12">
                    {/* Column 1: Agent Actions Log */}
                    <section className="col-span-12 lg:col-span-4 space-y-6">
                        <div className="flex items-center justify-between mb-2">
                            <h2 className="font-headline text-xl font-bold tracking-tight text-primary/80">Agent Actions</h2>
                            <span className="material-symbols-outlined text-primary/40 text-sm">history</span>
                        </div>
                        <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                            {logs.map((log, i) => (
                                <div key={i} className={`p-5 rounded-xl shadow-sm border-l-4 transition-all duration-300 ${log.type === 'VALIDATION_ERROR' ? 'bg-error-container/20 border-error' : (i === 0 ? 'bg-primary-container border-primary ring-1 ring-white/10' : 'bg-surface-container-lowest border-secondary-fixed shadow-sm')}`}>
                                    <div className="flex justify-between items-start mb-3">
                                        <span className={`font-label text-[10px] uppercase font-black tracking-widest ${log.type === 'VALIDATION_ERROR' ? 'text-on-error-container' : (i === 0 ? 'text-on-primary-container/80' : 'text-secondary/60')}`}>
                                            {log.action}
                                        </span>
                                        {i === 0 && <span className="material-symbols-outlined text-primary animate-spin text-sm">sync</span>}
                                    </div>
                                    <h3 className={`font-headline font-bold mb-1 ${log.type === 'VALIDATION_ERROR' ? 'text-on-error-container' : (i === 0 ? 'text-on-primary-container' : 'text-primary')}`}>
                                        {log.message}
                                    </h3>
                                    <p className={`font-body text-xs leading-relaxed ${log.type === 'VALIDATION_ERROR' ? 'text-on-error-container/70' : (i === 0 ? 'text-on-primary-container/70' : 'text-on-surface-variant')}`}>
                                        {log.details || "Validated by Neural Engine"}
                                    </p>
                                </div>
                            ))}
                            {logs.length === 0 && (
                                <div className="bg-surface-container-lowest p-8 rounded-xl border border-dashed border-outline-variant/30 text-center opacity-40">
                                    <span className="material-symbols-outlined text-4xl mb-2 text-primary/40">cloud_sync</span>
                                    <p className="text-[10px] font-bold uppercase tracking-widest">Connect stream...</p>
                                </div>
                            )}
                        </div>
                    </section>

                    {/* Column 2: Live Metrics */}
                    <section className="col-span-12 lg:col-span-4 space-y-8">
                        <div className="bg-surface-container-low p-6 rounded-xl space-y-6 shadow-sm">
                            <h2 className="font-headline text-xl font-bold tracking-tight text-primary/80">Live Metrics</h2>
                            <div className="space-y-5">
                                <div className="space-y-2">
                                    <div className="flex justify-between font-label text-[10px] uppercase font-bold text-primary/60">
                                        <span>Completion Score</span>
                                        <span>{metrics.completionScore}%</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-surface-container-highest rounded-full overflow-hidden">
                                        <div className="h-full bg-primary rounded-full transition-all duration-1000" style={{ width: `${metrics.completionScore}%` }}></div>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between font-label text-[10px] uppercase font-bold text-primary/60">
                                        <span>Transparency Level</span>
                                        <span>{metrics.transparency}%</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-surface-container-highest rounded-full overflow-hidden">
                                        <div className="h-full bg-secondary rounded-full transition-all duration-1000" style={{ width: `${metrics.transparency}%` }}></div>
                                    </div>
                                </div>
                            </div>
                            <div className="pt-4 overflow-hidden rounded-lg">
                                <table className="w-full text-left bg-white/30">
                                    <thead>
                                        <tr className="font-label text-[10px] uppercase text-primary/40 tracking-wider">
                                            <th className="pb-3 px-3 font-bold">Metric</th>
                                            <th className="pb-3 px-3 font-bold text-right">Value</th>
                                            <th className="pb-3 px-3 font-bold text-right">Trend</th>
                                        </tr>
                                    </thead>
                                    <tbody className="font-headline text-sm font-bold text-primary/80">
                                        <tr className="border-t border-outline-variant/10">
                                            <td className="py-3 px-3 opacity-60 font-medium">Revenue</td>
                                            <td className="py-3 px-3 text-right">{metrics.ratios?.revenue || "$0M"}</td>
                                            <td className="py-3 px-3 text-right text-emerald-600"><span className="material-symbols-outlined text-xs align-middle">trending_up</span></td>
                                        </tr>
                                        <tr className="border-t border-outline-variant/10">
                                            <td className="py-3 px-3 opacity-60 font-medium">Debt Ratio</td>
                                            <td className="py-3 px-3 text-right">{metrics.ratios?.debtEquity || "0.00"}</td>
                                            <td className="py-3 px-3 text-right text-rose-500"><span className="material-symbols-outlined text-xs align-middle">trending_down</span></td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </section>

                    {/* Column 3: Risk Assessment Gauges */}
                    <section className="col-span-12 lg:col-span-4 space-y-6">
                        <div className="flex justify-between items-center">
                            <h2 className="font-headline text-xl font-bold tracking-tight text-primary/80">Risk Assessment</h2>
                            <span className="bg-error/10 text-error px-3 py-1 rounded-full font-label text-[10px] font-black uppercase tracking-tighter">High Variance</span>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            {[
                                { label: 'Circular', val: metrics.gauges?.circular || 0, color: '#ba1a1a' },
                                { label: 'Shell Net', val: metrics.gauges?.shell || 0, color: '#4c6452' },
                                { label: 'Lien Exp', val: metrics.gauges?.lien || 0, color: '#012d1d' },
                                { label: 'PEP Screener', val: metrics.gauges?.pep || 0, color: '#4c6452' },
                            ].map((gauge, i) => (
                                <div key={i} className="bg-surface-container-lowest p-4 rounded-xl shadow-sm text-center border border-outline-variant/10">
                                    <div className="relative w-24 h-24 mx-auto mb-2">
                                        <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                                            <path className="stroke-surface-container-highest fill-none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" strokeWidth="2.5"></path>
                                            <path className="arc-gauge fill-none" style={{ stroke: gauge.color }} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" strokeDasharray={`${gauge.val}, 100`} strokeWidth="2.5" strokeLinecap="round"></path>
                                        </svg>
                                        <span className="absolute inset-0 flex items-center justify-center font-headline text-lg font-black text-primary/90">{gauge.val}%</span>
                                    </div>
                                    <span className="font-label text-[10px] uppercase font-bold text-primary/60 leading-tight block">{gauge.label}</span>
                                </div>
                            ))}
                        </div>
                        <div className="bg-gradient-to-br from-primary/5 to-emerald-50 p-6 rounded-2xl border border-primary/10 shadow-sm mt-8">
                            <h3 className="text-[10px] font-black uppercase tracking-widest text-primary/60 mb-2">Agent Context</h3>
                            <p className="text-xs font-headline font-bold text-primary/80 italic">
                                "{metrics.insight || "Connecting to FINROCK backend for live risk appraisal telemetry..."}"
                            </p>
                        </div>
                    </section>
                </div>
            </main>

            <footer className="w-full py-12 mt-auto bg-white border-t border-outline-variant/10">
                <div className="flex flex-col md:flex-row justify-between items-center max-w-7xl mx-auto px-8 gap-6 text-emerald-900/60">
                    <div className="font-headline font-bold text-emerald-900 opacity-100">FINROCK</div>
                    <p className="font-body text-xs font-bold uppercase tracking-wider">© 2024 FINROCK. ALL RIGHTS RESERVED.</p>
                </div>
            </footer>
        </div>
    );
};

export default LiveAgentLight;
