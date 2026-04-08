import React, { useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTheme } from '../../../context/ThemeContext';
import { useAnalysis } from '../../../hooks/useAnalysis';
import { useSession } from '../../../hooks/useSession';

const LiveAgentDark = () => {
    const { toggleTheme } = useTheme();
    const { sessionId, loading: sessionLoading, error: sessionError, refreshSession } = useSession();
    const { logs, metrics, startAnalysis, canStart, socketError, socketState } = useAnalysis(sessionId);

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
        <div className="bg-[#0e0e0e] text-on-surface font-body min-h-screen flex flex-col overflow-hidden h-screen selection:bg-primary selection:text-black">
            <style>{`
        body {
            background-color: #0e0e0e;
            background-image: radial-gradient(circle at 50% 50%, #1a1a1a 0%, #0e0e0e 100%),
                               repeating-linear-gradient(0deg, rgba(255, 255, 255, 0.03) 0px, rgba(255, 255, 255, 0.03) 1px, transparent 1px, transparent 2px);
            background-size: cover, 100% 3px;
        }
        .glass-panel {
            background: rgba(38, 38, 38, 0.6);
            backdrop-filter: blur(20px);
            border-top: 1px solid rgba(73, 72, 71, 0.15);
        }
        .neon-glow {
            text-shadow: 0 0 10px rgba(133, 241, 202, 0.5);
        }
        .circular-gauge {
            transform: rotate(-90deg);
        }
        .custom-scrollbar::-webkit-scrollbar {
            width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
            background: rgba(255, 255, 255, 0.05);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
            background: rgba(133, 241, 202, 0.2);
            border-radius: 10px;
        }
`}</style>
            {/* Top Navigation Bar */}
            <nav className="fixed top-0 w-full z-50 bg-[#0e0e0e]/80 backdrop-blur-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] h-20">
                <div className="flex justify-between items-center w-full px-8 h-full max-w-[1920px] mx-auto">
                    <div className="flex items-center gap-12">
                        <span className="text-2xl font-bold tracking-tighter text-[#85f1ca] font-headline">FINROCK</span>
                        <div className="hidden md:flex items-center gap-8 font-headline tracking-tight uppercase text-[10px] tracking-widest font-black">
                            <Link className="text-zinc-400 hover:text-zinc-100 transition-colors" to="/">Markets</Link>
                            <Link className="text-[#85f1ca] border-b-2 border-[#85f1ca] pb-1" to="/live-agent">Analysis</Link>
                            <Link className="text-zinc-400 hover:text-zinc-100 transition-colors" to="/dashboard">Portfolio</Link>
                            <Link className="text-zinc-400 hover:text-zinc-100 transition-colors" to="/audit">Reports</Link>
                            <button onClick={toggleTheme} className="text-zinc-400 hover:text-primary transition-colors text-xs">Switch Theme</button>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="bg-[#262626]/50 px-4 py-2 rounded-full flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary text-sm">radio_button_checked</span>
                            <span className="text-xs font-bold tracking-widest uppercase">Session: {sessionId || '...'}</span>
                        </div>
                        <button
                            onClick={() => startAnalysis()}
                            disabled={!sessionId || !canStart || sessionLoading}
                            className={`bg-gradient-to-br from-primary to-primary-container text-on-primary px-6 py-2 rounded-full font-bold hover:shadow-[0_0_20px_rgba(133,241,202,0.3)] transition-all duration-300 active:scale-95 ${(!sessionId || !canStart || sessionLoading) ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            {sessionLoading ? 'Preparing Session...' : !canStart ? 'Connecting...' : 'Run Analysis'}
                        </button>
                    </div>
                </div>
            </nav>

            {/* Side Navigation Bar */}
            <aside className="h-screen w-64 fixed left-0 top-0 pt-24 bg-[#0e0e0e] flex flex-col py-6 z-40 border-r border-white/5">
                <div className="px-6 mb-8 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-surface-container-highest">
                        <img alt="Alpha Trader" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDVrcoyQhJsOcZXV3j2Mprce7fD-kX-1tiM8k8Hj9aLuictZrbi24OZNDaADaiGy6wHX8MaHlwPp1XDvpaDdZvbBTzaNNzt2eIFp8n-sxsZtuRhg1vxkguGoQz-vtJcY8Y_hjfQ_goLK_hmrEytYtkkwiIpHTWiSAZJNsyYKQRvrqQIHorj-zHz4epeDBDRJCIyJSzgF-QE5ZYpMWYQARuwveS0FfcVKVop2e_7s1jCCNqGaD1FkdnD2Z7Il7GvqU-4fdy-6KJetL0" />
                    </div>
                    <div>
                        <p className="text-sm font-bold font-headline">Alpha Trader</p>
                        <p className="text-[10px] uppercase tracking-widest text-[#85f1ca]">Premium Tier</p>
                    </div>
                </div>
                <nav className="flex-1 space-y-1">
                    <Link className="flex items-center gap-4 px-6 py-3 text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/30 transition-all" to="/dashboard">
                        <span className="material-symbols-outlined">dashboard</span>
                        <span className="font-medium text-sm">Dashboard</span>
                    </Link>
                    <Link className="flex items-center gap-4 px-6 py-3 text-[#85f1ca] bg-[#85f1ca]/10 rounded-r-full font-bold translate-x-1 duration-200" to="/live-agent">
                        <span className="material-symbols-outlined">query_stats</span>
                        <span className="font-medium text-sm">Live View</span>
                    </Link>
                    <Link className="flex items-center gap-4 px-6 py-3 text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/30 transition-all" to="/results">
                        <span className="material-symbols-outlined">analytics</span>
                        <span className="font-medium text-sm">Results</span>
                    </Link>
                </nav>
                <div className="mt-auto pb-8 px-6">
                    <Link className="flex items-center gap-4 py-3 text-zinc-600 hover:text-error transition-colors text-xs font-bold uppercase tracking-widest" to="/">
                        <span className="material-symbols-outlined">logout</span>
                        <span className="font-medium">Logout</span>
                    </Link>
                </div>
            </aside>

            {/* Main Content Canvas */}
            <main className="pl-64 pt-20 h-screen overflow-hidden">
                {(sessionError || socketError) && (
                    <div className="px-8 pt-4">
                        <div className="rounded-xl border border-red-500/40 bg-red-900/20 text-red-200 px-4 py-3 text-sm">
                            {sessionError || socketError}
                        </div>
                    </div>
                )}
                <div className="h-full flex gap-px bg-white/5">
                    {/* LEFT COLUMN: Agent Actions (Live Log) */}
                    <section className="w-[30%] bg-surface-container-low p-6 flex flex-col">
                        <div className="mb-6">
                            <h2 className="text-xs font-bold tracking-[0.2em] text-zinc-500 uppercase mb-1">System Orchestration</h2>
                            <h1 className="font-headline text-2xl font-bold">
                                Agent Actions
                                <span className="ml-3 text-xs font-medium text-zinc-500 uppercase tracking-widest">
                                    {sessionLoading ? 'Session Initializing' : socketState === 'open' ? 'Live' : socketState === 'error' ? 'Connection Error' : 'Connecting'}
                                </span>
                            </h1>
                        </div>
                        <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
                            {logs.map((log, i) => (
                                <div key={i} className="p-4 rounded-xl glass-panel relative overflow-hidden group">
                                    <div className={`absolute left-0 top-0 w-1 h-full ${log.type === 'VALIDATION_ERROR' ? 'bg-error shadow-[0_0_10px_#ff716c]' : 'bg-primary shadow-[0_0_10px_#85f1ca]'}`}></div>
                                    <div className="flex justify-between items-start mb-2">
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${log.type === 'VALIDATION_ERROR' ? 'text-error bg-error/10' : 'text-primary bg-primary/10'}`}>{log.action}</span>
                                        <span className="text-[10px] font-mono text-zinc-500">{new Date().toLocaleTimeString()}</span>
                                    </div>
                                    <p className="text-sm font-medium mb-2">{log.message}</p>
                                    <div className="flex gap-2">
                                        <div className="h-0.5 bg-primary/20 flex-1 rounded-full overflow-hidden">
                                            <div className="h-full bg-primary w-2/3 shadow-[0_0_8px_#85f1ca]"></div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {logs.length === 0 && (
                                <div className="flex flex-col items-center justify-center py-20 text-zinc-500 opacity-40">
                                    <span className="material-symbols-outlined text-4xl mb-2">inbox</span>
                                    <p className="text-xs uppercase tracking-widest font-bold">Waiting for feed...</p>
                                </div>
                            )}
                        </div>
                    </section>

                    {/* CENTER COLUMN: Live Metrics */}
                    <section className="flex-1 bg-surface p-8 overflow-y-auto custom-scrollbar">
                        <div className="flex justify-between items-end mb-12">
                            <div>
                                <h2 className="text-xs font-bold tracking-[0.2em] text-zinc-500 uppercase mb-1">Active File: #TRD-992-ALPHA</h2>
                                <h1 className="font-headline text-4xl font-bold tracking-tight">Intelligence Feed</h1>
                            </div>
                            <div className="text-right">
                                <span className="text-4xl font-headline font-bold text-primary neon-glow">{metrics.completionScore || 0}%</span>
                                <span className="text-xs text-zinc-500 block font-bold mt-1 uppercase tracking-widest">Confidence Score</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                            <div className="col-span-2 glass-panel p-6 rounded-xl">
                                <div className="flex justify-between mb-4">
                                    <h3 className="font-headline font-bold text-lg">Integrity Pipeline</h3>
                                    <span className="text-primary font-mono font-bold">{metrics.integrity || 0}% Total</span>
                                </div>
                                <div className="space-y-6">
                                    <div>
                                        <div className="flex justify-between text-[10px] uppercase font-bold tracking-widest mb-1">
                                            <span className="text-zinc-400">Document Integrity</span>
                                            <span className={metrics.integrity >= 90 ? 'text-secondary' : 'text-primary'}>{metrics.integrity}%</span>
                                        </div>
                                        <div className="h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
                                            <div className="h-full bg-primary transition-all duration-500 shadow-[0_0_10px_#85f1ca]" style={{ width: `${metrics.integrity}%` }}></div>
                                        </div>
                                    </div>
                                    <div>
                                        <div className="flex justify-between text-[10px] uppercase font-bold tracking-widest mb-1">
                                            <span className="text-zinc-400">Transparency Audit</span>
                                            <span className="text-tertiary">{metrics.transparency}%</span>
                                        </div>
                                        <div className="h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
                                            <div className="h-full bg-tertiary transition-all duration-500" style={{ width: `${metrics.transparency}%` }}></div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Ratio Cards */}
                            <div className="bg-surface-container-low p-6 rounded-xl relative overflow-hidden group hover:bg-surface-container-high transition-all border border-white/5">
                                <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] mb-4">Debt-to-Equity</h4>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-3xl font-headline font-bold">{metrics.ratios?.debtEquity || "0.00"}</span>
                                    <span className="text-primary text-xs font-bold">+0.42 Δ</span>
                                </div>
                            </div>
                            <div className="bg-surface-container-low p-6 rounded-xl relative overflow-hidden group hover:bg-surface-container-high transition-all border border-white/5">
                                <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] mb-4">Revenue Pulse</h4>
                                <div className="flex items-baseline gap-2 text-primary">
                                    <span className="text-3xl font-headline font-bold">{metrics.ratios?.revenue || "$0M"}</span>
                                    <span className="text-primary/60 text-xs font-bold">Stable</span>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* RIGHT COLUMN: Risk Gauges */}
                    <section className="w-[28%] bg-surface-container-low p-6 flex flex-col border-l border-white/5">
                        <div className="mb-8">
                            <h2 className="text-xs font-bold tracking-[0.2em] text-zinc-500 uppercase mb-1">Neural Risk Engine</h2>
                            <h1 className="font-headline text-2xl font-bold">Neural Gauges</h1>
                        </div>
                        <div className="grid grid-cols-2 gap-y-10 gap-x-6 flex-1 items-center">
                            {[
                                { label: 'Circular', val: metrics.gauges?.circular || 0, color: 'text-primary' },
                                { label: 'Shell', val: metrics.gauges?.shell || 0, color: 'text-secondary' },
                                { label: 'Lien', val: metrics.gauges?.lien || 0, color: 'text-tertiary' },
                                { label: 'PEP', val: metrics.gauges?.pep || 0, color: 'text-error' },
                            ].map((gauge, i) => (
                                <div key={i} className="flex flex-col items-center">
                                    <div className="relative w-28 h-28">
                                        <svg className="w-full h-full circular-gauge" viewBox="0 0 100 100">
                                            <circle className="text-zinc-800" cx="50" cy="50" fill="transparent" r="40" stroke="currentColor" strokeWidth="8"></circle>
                                            <circle className={`${gauge.color} transition-all duration-1000`} cx="50" cy="50" fill="transparent" r="40" stroke="currentColor" strokeDasharray="251.2" strokeDashoffset={251.2 - (251.2 * gauge.val / 100)} strokeLinecap="round" strokeWidth="8"></circle>
                                        </svg>
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <span className="text-xl font-headline font-bold">{gauge.val}%</span>
                                        </div>
                                    </div>
                                    <span className="mt-3 text-[10px] font-bold uppercase tracking-widest text-zinc-400">{gauge.label}</span>
                                </div>
                            ))}
                        </div>
                        <div className="mt-12 p-5 rounded-2xl bg-gradient-to-br from-primary/20 to-tertiary/20 backdrop-blur-md border border-white/5">
                            <h5 className="text-[10px] font-extrabold uppercase tracking-widest text-primary mb-2 italic">Agent Insight</h5>
                            <p className="text-xs leading-relaxed text-zinc-300 font-medium font-body opacity-80">
                                {metrics.insight || "System idle. Initiate scan for live audit logs."}
                            </p>
                        </div>
                    </section>
                </div>
            </main>
        </div>
    );
};

export default LiveAgentDark;
