import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../../../context/ThemeContext';
import { getResults, camDownloadUrl } from '../../../lib/backend';

const STORAGE_KEY = 'creditsense.session_id';

const ResultsLight = () => {
    const { toggleTheme } = useTheme();
    const [results, setResults] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const sessionId = localStorage.getItem(STORAGE_KEY) || '';

    useEffect(() => {
        if (!sessionId) {
            setLoading(false);
            setError('No active session. Please run an analysis from the Dashboard first.');
            return;
        }
        let cancelled = false;
        async function fetchResults() {
            try {
                const data = await getResults(sessionId);
                if (!cancelled) setResults(data);
            } catch {
                if (!cancelled) setError('Results not ready yet. Run an analysis first.');
            } finally {
                if (!cancelled) setLoading(false);
            }
        }
        fetchResults();
        return () => { cancelled = true; };
    }, [sessionId]);

    const decision = results?.decision || 'pending';
    const decisionLabel = decision === 'approve' ? 'Approved' : decision === 'partial' ? 'Partial Sanction' : decision === 'reject' ? 'Rejected' : 'Pending';
    const decisionColor = decision === 'approve' ? 'bg-emerald-100 text-emerald-800' : decision === 'partial' ? 'bg-amber-100 text-amber-800' : decision === 'reject' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-600';

    const circularVal = results?.gauges?.circular || 0;
    const shellVal = results?.gauges?.shell || 0;
    const lienVal = results?.gauges?.lien || 0;
    const pepVal = results?.gauges?.pep || 0;

    const riskFactors = [
        { label: 'Circular Trading', val: circularVal, severity: circularVal >= 70 ? 'Critical' : circularVal >= 40 ? 'Warning' : 'Stable', color: circularVal >= 70 ? 'bg-error text-error' : circularVal >= 40 ? 'bg-tertiary text-tertiary' : 'bg-primary-container text-primary-container' },
        { label: 'Shell Company Network', val: shellVal, severity: shellVal >= 70 ? 'Critical' : shellVal >= 40 ? 'Warning' : 'Stable', color: shellVal >= 70 ? 'bg-error text-error' : shellVal >= 40 ? 'bg-tertiary text-tertiary' : 'bg-primary-container text-primary-container' },
        { label: 'Lien Exposure', val: lienVal, severity: lienVal >= 70 ? 'Critical' : lienVal >= 40 ? 'Warning' : 'Stable', color: lienVal >= 70 ? 'bg-error text-error' : lienVal >= 40 ? 'bg-tertiary text-tertiary' : 'bg-primary-container text-primary-container' },
        { label: 'PEP / Diversion Signal', val: pepVal, severity: pepVal >= 70 ? 'Critical' : pepVal >= 40 ? 'Warning' : 'Stable', color: pepVal >= 70 ? 'bg-error text-error' : pepVal >= 40 ? 'bg-tertiary text-tertiary' : 'bg-primary-container text-primary-container' },
        { label: 'Debt-to-Equity Ratio', val: 18, severity: 'Stable', color: 'bg-primary-container text-primary-container' },
        { label: 'Liquidity Depth', val: 12, severity: 'Low Risk', color: 'bg-primary-container text-primary-container' },
    ];

    return (
        <div className="bg-background font-body text-on-surface antialiased flex flex-col min-h-screen">
            <style>{`
        .material-symbols-outlined {
            font-variation-settings: 'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 24;
        }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .tonal-shift-bottom { box-shadow: 0 4px 20px -5px rgba(25, 28, 29, 0.05); }
`}</style>

            {/* Sticky Sanction Banner */}
            {results && (
                <div className={`sticky top-20 z-40 py-3 px-8 text-center font-label tracking-wide flex items-center justify-center gap-3 ${decision === 'approve' ? 'bg-emerald-600 text-white' : decision === 'partial' ? 'bg-tertiary text-on-tertiary' : decision === 'reject' ? 'bg-red-600 text-white' : 'bg-gray-400 text-white'}`}>
                    <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>
                        {decision === 'approve' ? 'check_circle' : decision === 'reject' ? 'cancel' : 'warning'}
                    </span>
                    {decision === 'approve' && 'Full Sanction Recommended: All Risk Signals Within Acceptable Bounds'}
                    {decision === 'partial' && 'Partial Sanction Recommended: High-Risk Anomalies Detected'}
                    {decision === 'reject' && 'Loan Rejected: Critical Risk Signals Detected'}
                    {decision === 'pending' && 'Analysis Pending — Run Credit Analysis First'}
                </div>
            )}

            {/* TopNavBar */}
            <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-xl shadow-[0_12px_40px_rgba(25,28,29,0.06)]">
                <div className="flex justify-between items-center max-w-7xl mx-auto px-8 h-20">
                    <div className="text-xl font-bold tracking-tighter text-emerald-900 font-headline">
                        FINROCK
                    </div>
                    <div className="hidden md:flex items-center gap-8">
                        <Link className="text-emerald-800/60 font-medium font-headline tracking-tight hover:text-emerald-900 transition-colors" to="/">Home</Link>
                        <Link className="text-emerald-800/60 font-medium font-headline tracking-tight hover:text-emerald-900 transition-colors" to="/dashboard">Dashboard</Link>
                        <Link className="text-emerald-900 font-bold border-b-2 border-emerald-900 pb-1 font-headline tracking-tight" to="/results">Results</Link>
                        <Link className="text-emerald-800/60 font-medium font-headline tracking-tight hover:text-emerald-900 transition-colors" to="/audit">Audit</Link>
                        <button onClick={toggleTheme} className="text-emerald-800/60 font-medium hover:text-emerald-900 transition-colors uppercase text-[10px] tracking-widest font-bold">Switch Theme</button>
                    </div>
                    <Link to="/live-agent?autostart=1" className="bg-primary text-on-primary px-6 py-2.5 rounded-xl font-label text-sm font-bold scale-95 duration-200 ease-in-out hover:opacity-90">
                        Run Analysis
                    </Link>
                </div>
            </nav>

            <main className="flex-grow max-w-7xl mx-auto w-full px-8 pt-44 pb-24">
                {loading && (
                    <div className="flex items-center justify-center py-32">
                        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
                        <span className="ml-4 text-on-surface-variant">Loading results...</span>
                    </div>
                )}

                {error && !loading && (
                    <div className="flex flex-col items-center justify-center py-32 gap-6">
                        <span className="material-symbols-outlined text-6xl text-on-surface-variant/40">analytics</span>
                        <p className="text-on-surface-variant text-lg">{error}</p>
                        <Link to="/dashboard" className="bg-primary text-on-primary px-8 py-3 rounded-xl font-headline font-bold">Go to Dashboard</Link>
                    </div>
                )}

                {results && !loading && (
                    <>
                        {/* Hero Summary Section */}
                        <header className="mb-16">
                            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                                <div>
                                    <p className="font-label text-xs uppercase tracking-[0.2em] text-primary/60 mb-2">Technical Audit Report #{sessionId?.slice(0, 6)?.toUpperCase()}</p>
                                    <h1 className="font-headline text-5xl font-bold tracking-tighter text-primary">Analysis Results</h1>
                                </div>
                                <div className="flex gap-4">
                                    <div className="bg-surface-container-low p-6 rounded-xl min-w-[200px]">
                                        <p className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant mb-1">Decision</p>
                                        <p className={`font-headline text-2xl font-bold px-3 py-1 rounded-lg inline-block ${decisionColor}`}>{decisionLabel}</p>
                                    </div>
                                    <div className="bg-surface-container-low p-6 rounded-xl min-w-[200px]">
                                        <p className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant mb-1">Completion</p>
                                        <p className="font-headline text-3xl font-bold text-primary">{results.completionScore}%</p>
                                    </div>
                                </div>
                            </div>
                        </header>

                        {/* Risk Factor Heatmap & Visualization Grid */}
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-16">
                            {/* Risk Factor Breakdown */}
                            <div className="lg:col-span-5 bg-surface-container-lowest rounded-xl p-8">
                                <h3 className="font-headline text-xl font-bold mb-8 flex items-center justify-between">
                                    Risk Factor Breakdown
                                    <span className="material-symbols-outlined text-primary/40">bar_chart</span>
                                </h3>
                                <div className="space-y-6">
                                    {riskFactors.map((rf, i) => (
                                        <div key={i} className="space-y-2">
                                            <div className="flex justify-between items-center">
                                                <span className="font-label text-xs font-medium">{rf.label}</span>
                                                <span className={`font-label text-xs font-bold ${rf.color.split(' ')[1]}`}>{rf.val}% {rf.severity}</span>
                                            </div>
                                            <div className="h-3 w-full bg-surface-container rounded-full overflow-hidden">
                                                <div className={`h-full ${rf.color.split(' ')[0]} transition-all duration-700`} style={{ width: `${rf.val}%` }}></div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Summary Panel */}
                            <div className="lg:col-span-7 bg-primary rounded-xl p-8 text-on-primary overflow-hidden relative">
                                <div className="relative z-10">
                                    <h3 className="font-headline text-xl font-bold mb-2">Analysis Summary</h3>
                                    <p className="font-body text-sm text-on-primary-container mb-8 max-w-md">{results.insight || 'Analysis complete.'}</p>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-white/10 backdrop-blur-md p-4 rounded-xl">
                                            <p className="font-label text-[10px] uppercase tracking-widest opacity-60 mb-1">Revenue</p>
                                            <p className="font-headline text-2xl font-bold">{results.ratios?.revenue || '$0'}</p>
                                        </div>
                                        <div className="bg-white/10 backdrop-blur-md p-4 rounded-xl">
                                            <p className="font-label text-[10px] uppercase tracking-widest opacity-60 mb-1">EBITDA</p>
                                            <p className="font-headline text-2xl font-bold">{results.ratios?.ebitda || '$0'}</p>
                                        </div>
                                        <div className="bg-white/10 backdrop-blur-md p-4 rounded-xl">
                                            <p className="font-label text-[10px] uppercase tracking-widest opacity-60 mb-1">Debt/Equity</p>
                                            <p className="font-headline text-2xl font-bold">{results.ratios?.debtEquity || '0.00'}</p>
                                        </div>
                                        <div className="bg-white/10 backdrop-blur-md p-4 rounded-xl">
                                            <p className="font-label text-[10px] uppercase tracking-widest opacity-60 mb-1">Integrity</p>
                                            <p className="font-headline text-2xl font-bold">{results.integrity}%</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* CAM Download Section */}
                        <section className="bg-surface-container rounded-2xl p-12 flex flex-col md:flex-row items-center justify-between gap-8">
                            <div className="max-w-xl text-center md:text-left">
                                <h3 className="font-headline text-3xl font-bold mb-4">Credit Assessment Memorandum</h3>
                                <p className="font-body text-on-surface-variant leading-relaxed">Download the comprehensive engineering report including the algorithmic proof of sanction recommendation and risk-weighted data tables.</p>
                            </div>
                            <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
                                <a href={camDownloadUrl(sessionId)} download className="bg-primary text-on-primary px-8 py-4 rounded-xl font-headline font-bold flex items-center justify-center gap-3 hover:opacity-90 transition-opacity">
                                    <span className="material-symbols-outlined">description</span>
                                    Download CAM (.docx)
                                </a>
                                <Link to="/audit" className="bg-white text-primary border border-primary/10 px-8 py-4 rounded-xl font-headline font-bold flex items-center justify-center gap-3 hover:bg-surface-container-lowest transition-all">
                                    <span className="material-symbols-outlined">verified_user</span>
                                    Blockchain Audit
                                </Link>
                            </div>
                        </section>
                    </>
                )}
            </main>

            <footer className="w-full py-12 mt-auto bg-emerald-50">
                <div className="flex flex-col md:flex-row justify-between items-center max-w-7xl mx-auto px-8 gap-6">
                    <div className="flex flex-col items-center md:items-start gap-2">
                        <span className="font-headline font-bold text-emerald-900 text-lg">FINROCK</span>
                        <p className="font-body text-sm antialiased text-emerald-800/70">© 2024 FINROCK. Precision in Financial Engineering.</p>
                    </div>
                    <div className="flex gap-8">
                        <a className="text-emerald-800/70 font-body text-sm hover:text-emerald-900 transition-all opacity-80 hover:opacity-100" href="#">Privacy</a>
                        <a className="text-emerald-800/70 font-body text-sm hover:text-emerald-900 transition-all opacity-80 hover:opacity-100" href="#">Terms</a>
                        <a className="text-emerald-800/70 font-body text-sm hover:text-emerald-900 transition-all opacity-80 hover:opacity-100" href="#">Security</a>
                        <a className="text-emerald-800/70 font-body text-sm hover:text-emerald-900 transition-all opacity-80 hover:opacity-100" href="#">Contact</a>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default ResultsLight;
