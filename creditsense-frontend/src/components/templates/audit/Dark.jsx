import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../../../context/ThemeContext';
import { useSession } from '../../../hooks/useSession';
import { getResults } from '../../../lib/backend';

const AuditDark = () => {
    const { toggleTheme } = useTheme();
    const { sessionId } = useSession();
    const [txs, setTxs] = useState([]);
    const [blockchainEnabled, setBlockchainEnabled] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!sessionId) return;
        let cancelled = false;
        setLoading(true);
        getResults(sessionId)
            .then((data) => {
                if (cancelled) return;
                const bc = data?.blockchain || {};
                setBlockchainEnabled(!!bc.enabled);
                setTxs(bc.txs || []);
            })
            .catch(() => {
                // No results yet — that's fine, show placeholder
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });
        return () => { cancelled = true; };
    }, [sessionId]);

    const placeholderRows = [
        { time: '—', type: 'DOC_HASH', actor: 'Awaiting Analysis', color: 'text-primary bg-primary/10 border-primary/20' },
        { time: '—', type: 'DECISION', actor: 'Run analysis first', color: 'text-secondary bg-secondary/10 border-secondary/20' },
    ];

    const displayRows = txs.length > 0
        ? txs.map((tx, i) => ({
            time: new Date().toISOString().replace('T', ' ').slice(0, 19),
            type: tx.kind || 'UNKNOWN',
            actor: tx.doc_type || tx.tx_hash?.slice(0, 16) || '—',
            txHash: tx.tx_hash || null,
            blockNo: tx.block_number || null,
            color: tx.kind === 'DECISION'
                ? 'text-secondary bg-secondary/10 border-secondary/20'
                : tx.kind === 'VERIFICATION'
                    ? 'text-tertiary bg-tertiary/10 border-tertiary/20'
                    : 'text-primary bg-primary/10 border-primary/20',
        }))
        : placeholderRows;

    return (
        <div className="bg-[#0e0e0e] text-on-surface font-body antialiased min-h-screen flex flex-col">
            <style>{`
        .material-symbols-outlined {
            font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
        }
        .neon-glow {
            text-shadow: 0 0 10px rgba(133, 241, 202, 0.5);
        }
`}</style>
            <nav className="fixed top-0 w-full z-50 bg-[#0e0e0e]/80 backdrop-blur-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] h-20">
                <div className="flex justify-between items-center w-full px-8 h-full max-w-[1920px] mx-auto">
                    <div className="text-2xl font-bold tracking-tighter text-primary font-headline">FINROCK</div>
                    <div className="hidden md:flex items-center space-x-8 font-headline tracking-tight uppercase text-[10px] font-black">
                        <Link className="text-zinc-400 hover:text-zinc-100 transition-colors" to="/">Markets</Link>
                        <Link className="text-zinc-400 hover:text-zinc-100 transition-colors" to="/live-agent">Analysis</Link>
                        <Link className="text-zinc-400 hover:text-zinc-100 transition-colors" to="/dashboard">Portfolio</Link>
                        <Link className="text-primary border-b-2 border-primary pb-1" to="/audit">Audit Trail</Link>
                        <button onClick={toggleTheme} className="text-zinc-400 hover:text-primary transition-colors text-xs">Switch Theme</button>
                    </div>
                    <Link to="/live-agent?autostart=1" className="bg-gradient-to-r from-primary to-primary-container text-on-primary px-6 py-2.5 rounded-full font-bold hover:shadow-[0_0_20px_rgba(133,241,202,0.3)] transition-all active:scale-95 duration-200">
                        Run Analysis
                    </Link>
                </div>
            </nav>
            <main className="pt-32 pb-20 px-8 max-w-7xl mx-auto flex-grow overflow-y-auto custom-scrollbar">
                <section className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center mb-24">
                    <div>
                        <span className="inline-block font-label text-primary font-bold tracking-widest uppercase text-xs mb-4">Immutable Ledger</span>
                        <h1 className="font-headline text-5xl font-bold tracking-tight text-on-surface mb-6 leading-tight">
                            Blockchain-Verified <br />Audit Intelligence.
                        </h1>
                        <p className="text-zinc-400 text-lg max-w-lg mb-8 leading-relaxed font-body font-medium">
                            FINROCK leverages decentralized ledgers to ensure every model decision, agent action, and document hash is permanently anchored for regulatory compliance.
                        </p>
                        <div className="flex gap-4">
                            <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full border border-primary/20">
                                <span className="material-symbols-outlined text-primary scale-75" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                                <span className="font-label font-bold text-xs text-primary">{blockchainEnabled ? 'BLOCKCHAIN ACTIVE' : 'NETWORK STANDBY'}</span>
                            </div>
                            <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full border border-white/10">
                                <span className="font-label font-bold text-xs text-zinc-500 tracking-tighter uppercase font-black">TXs Logged: {txs.length}</span>
                            </div>
                        </div>
                    </div>
                    <div className="relative h-[400px] flex items-center justify-center">
                        <div className="flex items-center gap-4 relative">
                            <div className="w-24 h-24 bg-surface-container-low shadow-xl rounded-xl border border-white/5 flex flex-col items-center justify-center gap-2 group hover:-translate-y-2 transition-transform cursor-pointer">
                                <span className="material-symbols-outlined text-primary/40 text-3xl">database</span>
                                <div className="w-12 h-1 bg-primary/20 rounded-full"></div>
                            </div>
                            <div className="w-8 h-0.5 bg-gradient-to-r from-primary/20 to-primary/40"></div>
                            <div className="w-28 h-28 bg-primary/20 border border-primary/30 shadow-2xl rounded-xl flex flex-col items-center justify-center gap-2 group hover:-translate-y-2 transition-transform cursor-pointer">
                                <span className="material-symbols-outlined text-primary text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>link</span>
                                <div className="w-14 h-1.5 bg-primary/40 rounded-full"></div>
                            </div>
                            <div className="w-8 h-0.5 bg-gradient-to-r from-primary/40 to-primary/60"></div>
                            <div className="w-24 h-24 bg-surface-container-low shadow-xl rounded-xl border border-white/5 flex flex-col items-center justify-center gap-2 group hover:-translate-y-2 transition-transform cursor-pointer">
                                <span className="material-symbols-outlined text-primary/40 text-3xl">history_edu</span>
                                <div className="w-12 h-1 bg-primary/20 rounded-full"></div>
                            </div>
                        </div>
                        <div className="absolute -z-10 w-full h-full bg-primary/5 rounded-full blur-3xl scale-125"></div>
                    </div>
                </section>
                <section className="mb-24">
                    <h2 className="font-headline text-3xl font-bold tracking-tight text-on-surface mb-10">Audit Log Feed</h2>
                    <div className="overflow-x-auto rounded-2xl border border-white/5 shadow-2xl bg-white/5">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-white/5 bg-white/5 text-[10px] uppercase font-black tracking-widest text-zinc-500">
                                    <th className="px-8 py-5">Event Type</th>
                                    <th className="px-8 py-5">Detail</th>
                                    <th className="px-8 py-5">TX Hash</th>
                                    <th className="px-8 py-5 text-right">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5 text-sm font-bold">
                                {displayRows.map((item, i) => (
                                    <tr key={i} className="hover:bg-white/5 transition-colors">
                                        <td className="px-8 py-6">
                                            <span className={`px-4 py-1.5 rounded-full border ${item.color} text-[10px] tracking-widest uppercase`}>{item.type}</span>
                                        </td>
                                        <td className="px-8 py-6 text-on-surface font-headline">{item.actor}</td>
                                        <td className="px-8 py-6 text-zinc-400 font-mono text-xs">
                                            {item.txHash ? `${item.txHash.slice(0, 10)}…${item.txHash.slice(-6)}` : '—'}
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>
                                                {item.txHash ? 'check_circle' : 'pending'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>
            </main>
            <footer className="w-full py-12 bg-black border-t border-white/5">
                <div className="max-w-7xl mx-auto px-8 flex justify-between items-center text-[10px] uppercase font-black tracking-widest text-zinc-600">
                    <div className="text-primary">FINROCK</div>
                    <div>© 2024 FINROCK. PERFORMANCE AUDIT ACTIVE.</div>
                </div>
            </footer>
        </div>
    );
};

export default AuditDark;
