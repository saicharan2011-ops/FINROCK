import React from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../../../context/ThemeContext';
import { useSession } from '../../../hooks/useSession';
import { uploadDocument } from '../../../lib/backend';

const DashboardDark = () => {
    const { toggleTheme } = useTheme();
    const { sessionId } = useSession();
    const [docs, setDocs] = React.useState({
        gst: null,
        bank: null,
        annual: null,
        itr: null,
    });
    const [uploading, setUploading] = React.useState('');

    const pickAndUpload = async (docType, accept) => {
        if (!sessionId) return;
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = accept;
        input.onchange = async () => {
            const file = input.files?.[0];
            if (!file) return;
            setUploading(docType);
            try {
                await uploadDocument(sessionId, docType, file);
                setDocs((d) => ({ ...d, [docType]: file.name }));
            } finally {
                setUploading('');
            }
        };
        input.click();
    };

    return (
        <div className="bg-surface text-on-surface font-body selection:bg-primary selection:text-on-primary min-h-screen flex flex-col">
            <style>{`
        .material-symbols-outlined {
            font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
        }
        .glass-panel {
            background: rgba(38, 38, 38, 0.6);
            backdrop-filter: blur(20px);
            border-top: 1px solid rgba(73, 72, 71, 0.15);
        }
        .neon-glow:hover {
            box-shadow: 0 0 15px rgba(133, 241, 202, 0.3);
        }
`}</style>
            {/* Top Navigation Bar */}
            <nav className="fixed top-0 w-full z-50 bg-[#0e0e0e]/80 backdrop-blur-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] h-20">
                <div className="flex justify-between items-center w-full px-8 h-full max-w-[1920px] mx-auto">
                    <div className="flex items-center gap-12">
                        <span className="text-2xl font-bold tracking-tighter text-[#85f1ca] font-headline">KINETIC VAULT</span>
                        <div className="hidden md:flex items-center gap-8 font-headline tracking-tight uppercase text-[10px] tracking-widest font-black">
                            <Link className="text-zinc-400 hover:text-zinc-100 transition-colors" to="/">Markets</Link>
                            <Link className="text-zinc-400 hover:text-zinc-100 transition-colors" to="/live-agent">Analysis</Link>
                            <Link className="text-zinc-100 border-b-2 border-[#85f1ca] pb-1" to="/dashboard">Portfolio</Link>
                            <Link className="text-zinc-400 hover:text-zinc-100 transition-colors" to="/audit">Reports</Link>
                            <button onClick={toggleTheme} className="text-zinc-400 hover:text-primary transition-colors text-xs">Switch Theme</button>
                        </div>
                    </div>
                    <Link to="/live-agent" className="bg-gradient-to-br from-primary to-primary-container text-on-primary px-6 py-2.5 rounded-full font-bold text-sm tracking-tight hover:scale-105 active:scale-95 transition-all neon-glow">
                        Run Analysis
                    </Link>
                </div>
            </nav>

            {/* Side Navigation Bar */}
            <aside className="h-screen w-64 fixed left-0 top-0 pt-24 bg-[#0e0e0e] flex flex-col py-6 z-40 border-r border-[var(--outline)]/10">
                <div className="px-6 mb-8">
                    <div className="flex items-center gap-3 p-3 bg-surface-container-low rounded-xl">
                        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>account_circle</span>
                        </div>
                        <div>
                            <p className="font-bold text-sm text-on-surface">Alpha Trader</p>
                            <p className="text-[10px] uppercase tracking-widest text-zinc-500">Premium Tier</p>
                        </div>
                    </div>
                </div>
                <nav className="flex-1 space-y-1">
                    <Link className="flex items-center gap-3 px-6 py-3 text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/30 transition-all font-medium text-sm" to="/dashboard">
                        <span className="material-symbols-outlined">dashboard</span> Dashboard
                    </Link>
                    <Link className="flex items-center gap-3 px-6 py-3 text-[#85f1ca] bg-[#85f1ca]/10 rounded-r-full font-bold translate-x-1 duration-200 text-sm" to="/live-agent">
                        <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>query_stats</span> Live View
                    </Link>
                    <Link className="flex items-center gap-3 px-6 py-3 text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/30 transition-all font-medium text-sm" to="/results">
                        <span className="material-symbols-outlined">analytics</span> Results
                    </Link>
                    <Link className="flex items-center gap-3 px-6 py-3 text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/30 transition-all font-medium text-sm" to="#">
                        <span className="material-symbols-outlined">settings</span> Settings
                    </Link>
                </nav>
                <div className="px-6 pt-6 mt-auto">
                    <div className="relative group cursor-pointer overflow-hidden rounded-xl aspect-square bg-surface-container-highest mb-6 flex items-center justify-center">
                        <img className="w-32 h-32 object-contain group-hover:scale-110 transition-transform duration-500" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAXe3B0IluuQ9egpIaoO1hLIf4qDa-BWmzzvw7OD_uuURPnCXt3CRgKZO15rpbrpbmaf6JVVJc-0aU3oIGgX1GJx3O_99DIVu-G6HoRl6x4AG2WvHBUGVLa40uk9xWGQAm830CF1iUeCE722FSisCGuxywHbd07_ZVNoLjXXNFRP6w40IyGCUMEmMowU4HlGuashX3CC4eIVYCB285qo7RTjwQZVHG9ow1R8KIaGMmKg5lPXjPKLwDjwq9FJmtyePREmGyFiAcvHKM" />
                        <div className="absolute bottom-2 text-[10px] text-primary font-bold tracking-tighter">SECURE VAULT ACTIVE</div>
                    </div>
                    <a className="flex items-center gap-3 text-zinc-600 hover:text-[#85f1ca] transition-colors text-xs font-bold uppercase tracking-widest" href="#">
                        <span className="material-symbols-outlined">logout</span> Logout
                    </a>
                </div>
            </aside>

            {/* Main Content Canvas */}
            <main className="ml-64 pt-28 pb-12 px-12 min-h-screen bg-surface">
                <header className="max-w-6xl mx-auto mb-16">
                    <div className="flex justify-between items-end mb-12">
                        <div>
                            <h1 className="text-5xl font-headline font-bold tracking-tighter text-on-surface mb-2">CreditSense AI</h1>
                            <p className="text-zinc-500 max-w-md">Proprietary risk assessment engine. Upload institutional data to generate an immediate credit score volatility report.</p>
                        </div>
                        <div className="text-right">
                            <span className="label-sm block text-primary font-bold text-xs uppercase tracking-[0.2em] mb-1">Current Session</span>
                            <span className="text-2xl font-headline font-light tracking-tight text-on-surface">{sessionId || 'Creating...'}</span>
                        </div>
                    </div>
                    {/* 4-Step Stepper */}
                    <div className="grid grid-cols-4 gap-4 relative">
                        <div className="absolute top-1/2 left-0 w-full h-[1px] bg-zinc-800 -translate-y-1/2 z-0"></div>
                        <div className="relative z-10 flex flex-col items-center group">
                            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-on-primary font-bold shadow-[0_0_15px_rgba(133,241,202,0.4)] mb-3">
                                <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>check</span>
                            </div>
                            <span className="text-[10px] font-bold uppercase tracking-widest text-primary">Company Info</span>
                        </div>
                        <div className="relative z-10 flex flex-col items-center group">
                            <div className="w-10 h-10 rounded-full bg-primary border-4 border-surface flex items-center justify-center text-on-primary font-bold shadow-[0_0_15px_rgba(133,241,202,0.2)] mb-3">
                                2
                            </div>
                            <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface font-bold">Upload</span>
                        </div>
                        <div className="relative z-10 flex flex-col items-center group">
                            <div className="w-10 h-10 rounded-full bg-surface-container-highest border border-zinc-700 flex items-center justify-center text-zinc-500 font-bold mb-3">
                                3
                            </div>
                            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-600 font-bold">Run Analysis</span>
                        </div>
                        <div className="relative z-10 flex flex-col items-center group">
                            <div className="w-10 h-10 rounded-full bg-surface-container-highest border border-zinc-700 flex items-center justify-center text-zinc-500 font-bold mb-3">
                                4
                            </div>
                            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-600 font-bold">Results</span>
                        </div>
                    </div>
                </header>

                <section className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
                    {[
                        {
                            key: 'gst',
                            icon: 'receipt_long',
                            title: 'GST Filings',
                            desc: 'Submit the last 12 months of GSTR-3B filings for verification of revenue consistency and tax compliance.',
                            accept: '.json,.pdf',
                        },
                        {
                            key: 'bank',
                            icon: 'account_balance',
                            title: 'Bank Statements',
                            desc: 'Integrated e-statements from primary business accounts. Necessary for cash-flow pattern recognition.',
                            accept: '.csv,.xlsx,.xls',
                        },
                        {
                            key: 'annual',
                            icon: 'description',
                            title: 'Annual Report',
                            desc: 'Audited financial statements including Balance Sheet and P&L for the preceding financial year.',
                            accept: '.pdf',
                        },
                        {
                            key: 'itr',
                            icon: 'history_edu',
                            title: 'ITR Acknowledgement',
                            desc: 'Income Tax Return acknowledgements (ITR-V) for last 2 assessment years to verify official income.',
                            accept: '.pdf',
                        },
                    ].map((card) => {
                        const name = docs[card.key];
                        const verified = Boolean(name);
                        return (
                            <div key={card.key} className={`group relative bg-surface-container-low p-8 rounded-xl border-l-4 transition-all duration-300 hover:bg-surface-container-high ${verified ? 'border-primary' : 'border-zinc-800 border-dashed'}`}>
                                <div className="flex justify-between items-start mb-6">
                                    <div className={`p-3 rounded-lg ${verified ? 'bg-primary/10 text-primary' : 'bg-zinc-800 text-zinc-500'}`}>
                                        <span className="material-symbols-outlined text-3xl">{card.icon}</span>
                                    </div>
                                    <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${verified ? 'bg-primary/20 text-primary' : 'bg-zinc-800 text-zinc-400'}`}>
                                        {verified ? (
                                            <>
                                                <span className="material-symbols-outlined text-[12px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                                                Verified
                                            </>
                                        ) : (
                                            <>Required</>
                                        )}
                                    </div>
                                </div>
                                <h3 className="text-xl font-headline font-bold text-on-surface mb-2">{card.title}</h3>
                                <p className="text-sm text-zinc-500 mb-8 leading-relaxed font-medium">{card.desc}</p>
                                <div className="flex items-center justify-between gap-4">
                                    <span className="text-[11px] font-mono text-zinc-400 truncate">{name || 'No file uploaded'}</span>
                                    <button
                                        onClick={() => pickAndUpload(card.key, card.accept)}
                                        disabled={uploading === card.key}
                                        className="text-primary hover:underline text-xs font-black uppercase tracking-widest disabled:opacity-40"
                                    >
                                        {uploading === card.key ? 'Uploading…' : (verified ? 'Replace' : 'Upload')}
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </section>

                {/* Footer Call to Action (Glass Widget) */}
                <div className="max-w-6xl mx-auto flex justify-center">
                    <div className="glass-panel p-10 rounded-2xl w-full flex flex-col md:flex-row items-center justify-between gap-8 border border-outline-variant/10">
                        <div className="flex items-center gap-6">
                            <div className="w-16 h-16 rounded-full bg-tertiary/10 flex items-center justify-center text-tertiary">
                                <span className="material-symbols-outlined text-4xl">shutter_speed</span>
                            </div>
                            <div>
                                <h4 className="text-2xl font-headline font-bold text-on-surface tracking-tight uppercase">Ready for Analysis?</h4>
                                <p className="text-zinc-400 font-medium">Once all 4 documents are verified, the AI engine can produce a report in &lt; 180s.</p>
                            </div>
                        </div>
                        <Link to="/live-agent?autostart=1" className="px-10 py-5 rounded-full bg-gradient-to-r from-primary to-primary-container text-on-primary font-black uppercase tracking-widest text-sm shadow-[0_10px_40px_rgba(133,241,202,0.2)] hover:shadow-[0_15px_50px_rgba(133,241,202,0.4)] hover:-translate-y-1 transition-all">
                            Initiate Final Scan
                        </Link>
                    </div>
                </div>
            </main>
            {/* Site Footer */}
            <footer className="w-full py-12 bg-[#0e0e0e] mt-auto">
                <div className="max-w-7xl mx-auto px-8 flex justify-between items-center font-['Manrope'] text-[10px] uppercase tracking-[0.1em]">
                    <span className="text-[#85f1ca] font-bold">KINETIC VAULT</span>
                    <div className="flex gap-8 text-zinc-600">
                        <a className="hover:text-[#85f1ca] transition-colors" href="#">Privacy Policy</a>
                        <a className="hover:text-[#85f1ca] transition-colors" href="#">Terms of Service</a>
                        <a className="hover:text-[#85f1ca] transition-colors" href="#">Security</a>
                    </div>
                    <p className="text-zinc-600 font-bold opacity-60">© 2024 KINETIC VAULT. ALL RIGHTS RESERVED.</p>
                </div>
            </footer>
        </div>
    );
};

export default DashboardDark;
