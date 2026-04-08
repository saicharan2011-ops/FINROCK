import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../../../context/ThemeContext';
import { getResults, verifyDocumentIntegrity } from '../../../lib/backend';

const STORAGE_KEY = 'creditsense.session_id';

const AuditLight = () => {
    const { toggleTheme } = useTheme();
    const [blockchain, setBlockchain] = useState({ enabled: false, txs: [] });
    const [loading, setLoading] = useState(true);
    const [selectedFile, setSelectedFile] = useState(null);
    const [fileHash, setFileHash] = useState('');
    const [verifyResult, setVerifyResult] = useState(null);
    const [verifying, setVerifying] = useState(false);
    const [verifyError, setVerifyError] = useState('');
    const fileInputRef = useRef(null);
    const sessionId = localStorage.getItem(STORAGE_KEY) || '';

    useEffect(() => {
        if (!sessionId) { setLoading(false); return; }
        let cancelled = false;
        async function load() {
            try {
                const data = await getResults(sessionId);
                if (!cancelled && data?.blockchain) setBlockchain(data.blockchain);
            } catch { /* no results yet */ }
            finally { if (!cancelled) setLoading(false); }
        }
        load();
        return () => { cancelled = true; };
    }, [sessionId]);

    const txs = blockchain.txs || [];

    const formatBytes = (bytes) => {
        if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';
        const units = ['B', 'KB', 'MB', 'GB'];
        let size = bytes;
        let idx = 0;
        while (size >= 1024 && idx < units.length - 1) {
            size /= 1024;
            idx += 1;
        }
        return `${size.toFixed(size >= 10 || idx === 0 ? 0 : 1)} ${units[idx]}`;
    };

    const hashFile = async (file) => {
        const buffer = await file.arrayBuffer();
        const digest = await crypto.subtle.digest('SHA-256', buffer);
        const hashArray = Array.from(new Uint8Array(digest));
        return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
    };

    const handleFileSelect = async (event) => {
        const file = event.target.files?.[0];
        if (!file) return;
        setVerifyError('');
        setVerifyResult(null);
        setSelectedFile(file);
        setFileHash('');
        try {
            const hash = await hashFile(file);
            setFileHash(hash);
        } catch {
            setVerifyError('Failed to compute file hash. Please try another file.');
        }
    };

    const eventTypeColor = (kind) => {
        if (kind === 'DOC_HASH') return 'bg-secondary-container text-on-secondary-container';
        if (kind === 'DECISION') return 'bg-primary-container text-on-primary-container';
        if (kind === 'VERIFICATION') return 'bg-tertiary text-on-tertiary';
        return 'bg-surface-container-high text-on-surface-variant';
    };

    const handleVerifyIntegrity = async () => {
        if (!sessionId) {
            setVerifyError('No active session found. Please run analysis from dashboard first.');
            return;
        }
        if (!selectedFile) {
            setVerifyError('Please select a document first.');
            return;
        }
        setVerifying(true);
        setVerifyError('');
        try {
            const result = await verifyDocumentIntegrity(sessionId, selectedFile);
            setVerifyResult(result);
            // Refresh audit feed to show verification event in table.
            const data = await getResults(sessionId);
            if (data?.blockchain) setBlockchain(data.blockchain);
        } catch (e) {
            setVerifyError(e?.message || 'Failed to verify document integrity.');
        } finally {
            setVerifying(false);
        }
    };

    return (
        <div className="bg-background text-on-surface font-body antialiased min-h-screen flex flex-col">
            <style>{`
        .material-symbols-outlined {
            font-variation-settings: 'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 24;
        }
        .glass-header {
            background: rgba(255, 255, 255, 0.8);
            backdrop-filter: blur(24px);
        }
`}</style>
            {/* TopNavBar */}
            <header className="fixed top-0 w-full z-50 glass-header shadow-[0_12px_40px_rgba(25,28,29,0.06)]">
                <div className="flex justify-between items-center max-w-7xl mx-auto px-8 h-20">
                    <div className="text-xl font-headline font-bold tracking-tighter text-primary">
                        FINROCK
                    </div>
                    <nav className="hidden md:flex items-center gap-8">
                        <Link className="text-emerald-800/60 font-medium font-headline hover:text-primary transition-colors uppercase text-[10px] tracking-widest font-black" to="/">Home</Link>
                        <Link className="text-emerald-800/60 font-medium font-headline hover:text-primary transition-colors uppercase text-[10px] tracking-widest font-black" to="/dashboard">Dashboard</Link>
                        <Link className="text-primary font-bold font-headline border-b-2 border-primary pb-1 uppercase text-[10px] tracking-widest font-black" to="/audit">Audit</Link>
                        <Link className="text-emerald-800/60 font-medium font-headline hover:text-primary transition-colors uppercase text-[10px] tracking-widest font-black" to="/results">Insights</Link>
                        <button onClick={toggleTheme} className="text-emerald-800/60 font-medium hover:text-emerald-900 transition-colors uppercase text-[10px] tracking-widest font-black">Switch Theme</button>
                    </nav>
                    <Link to="/live-agent?autostart=1" className="bg-primary text-on-primary px-6 py-2.5 rounded-xl font-headline font-bold scale-95 hover:scale-100 duration-200 ease-in-out text-center">
                        Run Analysis
                    </Link>
                </div>
            </header>
            <main className="pt-32 pb-20 px-8 max-w-7xl mx-auto flex-grow">
                {/* Hero Section: Blockchain Visualization */}
                <section className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center mb-24">
                    <div>
                        <span className="inline-block font-label text-primary font-bold tracking-widest uppercase text-xs mb-4">Immutable Ledger</span>
                        <h1 className="font-headline text-5xl font-bold tracking-tight text-primary mb-6 leading-tight">
                            Blockchain-Verified <br />Audit Intelligence.
                        </h1>
                        <p className="text-on-surface-variant text-lg max-w-lg mb-8 leading-relaxed">
                            FINROCK leverages decentralized ledgers to ensure every model decision, agent action, and document hash is permanently anchored for regulatory compliance.
                        </p>
                        <div className="flex gap-4">
                            <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${blockchain.enabled ? 'bg-emerald-100' : 'bg-surface-container'}`}>
                                <span className="material-symbols-outlined text-primary scale-75" style={{ fontVariationSettings: "'FILL' 1" }}>{blockchain.enabled ? 'verified' : 'cloud_off'}</span>
                                <span className="font-label font-bold text-xs">{blockchain.enabled ? 'NETWORK ACTIVE' : 'OFFLINE MODE'}</span>
                            </div>
                            <div className="flex items-center gap-2 px-4 py-2 bg-surface-container rounded-full">
                                <span className="font-label font-bold text-xs text-on-surface-variant tracking-tighter uppercase">
                                    {txs.length} Transaction{txs.length !== 1 ? 's' : ''} Logged
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="relative h-[400px] flex items-center justify-center">
                        <div className="flex items-center gap-4 relative">
                            <div className="w-24 h-24 bg-surface-container-lowest shadow-xl rounded-xl border border-primary/5 flex flex-col items-center justify-center gap-2 group hover:-translate-y-2 transition-transform cursor-pointer">
                                <span className="material-symbols-outlined text-primary/40 text-3xl">database</span>
                                <div className="w-12 h-1 bg-primary/20 rounded-full"></div>
                            </div>
                            <div className="w-8 h-0.5 bg-gradient-to-r from-primary/20 to-primary/40"></div>
                            <div className="w-28 h-28 bg-primary-container shadow-2xl rounded-xl flex flex-col items-center justify-center gap-2 group hover:-translate-y-2 transition-transform cursor-pointer">
                                <span className="material-symbols-outlined text-on-primary-container text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>link</span>
                                <div className="w-14 h-1.5 bg-on-primary-container/40 rounded-full"></div>
                            </div>
                            <div className="w-8 h-0.5 bg-gradient-to-r from-primary/40 to-primary/60"></div>
                            <div className="w-24 h-24 bg-surface-container-lowest shadow-xl rounded-xl border border-primary/5 flex flex-col items-center justify-center gap-2 group hover:-translate-y-2 transition-transform cursor-pointer">
                                <span className="material-symbols-outlined text-primary/40 text-3xl">history_edu</span>
                                <div className="w-12 h-1 bg-primary/20 rounded-full"></div>
                            </div>
                            <div className="w-8 h-0.5 bg-gradient-to-r from-primary/60 to-primary/40"></div>
                            <div className="flex -space-x-4 opacity-50">
                                <div className="w-16 h-16 bg-surface-container rounded-xl border border-primary/5"></div>
                                <div className="w-16 h-16 bg-surface-container rounded-xl border border-primary/5"></div>
                                <div className="w-16 h-16 bg-surface-container rounded-xl border border-primary/5"></div>
                            </div>
                        </div>
                        <div className="absolute -z-10 w-full h-full bg-primary/5 rounded-full blur-3xl"></div>
                    </div>
                </section>

                {/* Audit Explorer */}
                <section className="mb-24">
                    <div className="flex flex-col md:flex-row justify-between items-end mb-10 gap-6">
                        <div>
                            <h2 className="font-headline text-3xl font-bold tracking-tight text-primary">Audit Log</h2>
                            <p className="text-on-surface-variant font-body mt-2">Real-time immutable tracking of agentic financial operations.</p>
                        </div>
                    </div>

                    {loading && (
                        <div className="flex items-center justify-center py-16">
                            <div className="animate-spin w-6 h-6 border-3 border-primary border-t-transparent rounded-full"></div>
                            <span className="ml-3 text-on-surface-variant text-sm">Loading audit data...</span>
                        </div>
                    )}

                    {!loading && txs.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-16 gap-4 bg-surface-container-lowest rounded-xl">
                            <span className="material-symbols-outlined text-5xl text-on-surface-variant/30">receipt_long</span>
                            <p className="text-on-surface-variant">No blockchain transactions yet. Run an analysis to generate audit entries.</p>
                            <Link to="/dashboard" className="bg-primary text-on-primary px-6 py-2 rounded-xl font-headline font-bold text-sm">Go to Dashboard</Link>
                        </div>
                    )}

                    {!loading && txs.length > 0 && (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="border-b border-primary/5">
                                        <th className="pb-6 font-label font-bold text-[10px] uppercase tracking-widest text-on-surface-variant">#</th>
                                        <th className="pb-6 font-label font-bold text-[10px] uppercase tracking-widest text-on-surface-variant">Event Type</th>
                                        <th className="pb-6 font-label font-bold text-[10px] uppercase tracking-widest text-on-surface-variant">Document / Action</th>
                                        <th className="pb-6 font-label font-bold text-[10px] uppercase tracking-widest text-on-surface-variant">Transaction Hash</th>
                                        <th className="pb-6 font-label font-bold text-[10px] uppercase tracking-widest text-on-surface-variant text-right">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-primary/5">
                                    {txs.map((tx, i) => (
                                        <tr key={i} className="group hover:bg-surface-container-low transition-colors">
                                            <td className="py-5 font-body text-sm font-medium">{i + 1}</td>
                                            <td className="py-5">
                                                <span className={`px-3 py-1 rounded-full font-label font-bold text-[10px] ${eventTypeColor(tx.kind)}`}>{tx.kind}</span>
                                            </td>
                                            <td className="py-5 font-label font-bold text-xs text-primary">{tx.doc_type || tx.kind}</td>
                                            <td className="py-5 font-label text-xs text-on-surface-variant tracking-tighter truncate max-w-[200px]">{tx.tx_hash || 'N/A'}</td>
                                            <td className="py-5 text-right">
                                                <span className="material-symbols-outlined text-primary text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>

                {/* Document Verification & Technical Details Bento */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 bg-surface-container-lowest rounded-xl p-10 border border-primary/5 shadow-sm">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-12 h-12 bg-secondary-fixed flex items-center justify-center rounded-xl">
                                <span className="material-symbols-outlined text-primary">shield</span>
                            </div>
                            <div>
                                <h3 className="font-headline text-xl font-bold text-primary">Document Verification</h3>
                                <p className="text-on-surface-variant text-sm">Instant SHA-256 hash validation against the mainnet.</p>
                            </div>
                        </div>
                        <div className="border-2 border-dashed border-outline-variant/30 rounded-2xl p-12 flex flex-col items-center justify-center text-center hover:border-primary/20 transition-all group">
                            <div className="w-16 h-16 bg-surface-container flex items-center justify-center rounded-full mb-6 group-hover:scale-110 transition-transform">
                                <span className="material-symbols-outlined text-on-surface-variant text-3xl">upload_file</span>
                            </div>
                            <p className="font-body text-on-surface-variant mb-2">Drag and drop file to verify its integrity</p>
                            <p className="font-label font-bold text-[10px] text-outline-variant uppercase tracking-widest">PDF, JSON, or CSV (MAX 25MB)</p>
                            <input
                                ref={fileInputRef}
                                type="file"
                                className="hidden"
                                accept=".pdf,.json,.csv"
                                onChange={handleFileSelect}
                            />
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="mt-8 px-8 py-3 bg-primary text-on-primary rounded-xl font-headline font-bold text-sm"
                            >
                                Select Document
                            </button>
                            {selectedFile && (
                                <div className="mt-6 w-full max-w-2xl bg-surface-container-low rounded-xl p-4 text-left">
                                    <p className="text-sm font-semibold text-primary truncate">{selectedFile.name}</p>
                                    <p className="text-xs text-on-surface-variant mt-1">Size: {formatBytes(selectedFile.size)}</p>
                                    <p className="text-xs text-on-surface-variant mt-1 break-all">
                                        SHA-256: {fileHash || 'Computing...'}
                                    </p>
                                </div>
                            )}
                            {verifyError && (
                                <p className="mt-4 text-xs text-red-600 font-medium">{verifyError}</p>
                            )}
                            {verifyResult && (
                                <div className={`mt-4 w-full max-w-2xl rounded-xl p-4 text-left border ${verifyResult.matched ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'}`}>
                                    <p className={`text-sm font-bold ${verifyResult.matched ? 'text-emerald-700' : 'text-amber-700'}`}>
                                        {verifyResult.matched ? 'Match Found' : 'Mismatch'}
                                    </p>
                                    <p className="text-xs text-on-surface-variant mt-1 break-all">
                                        Uploaded hash: {verifyResult.uploaded_hash}
                                    </p>
                                    <p className="text-xs text-on-surface-variant mt-1">
                                        Matched docs: {verifyResult.matched_doc_types?.length ? verifyResult.matched_doc_types.join(', ') : 'None'}
                                    </p>
                                    {verifyResult.blockchain_tx_hash && (
                                        <p className="text-xs text-on-surface-variant mt-1 break-all">
                                            Blockchain tx: {verifyResult.blockchain_tx_hash}
                                        </p>
                                    )}
                                </div>
                            )}
                            <button
                                onClick={handleVerifyIntegrity}
                                disabled={!selectedFile || !fileHash || verifying}
                                className={`mt-4 px-8 py-3 rounded-xl font-headline font-bold text-sm ${(!selectedFile || !fileHash || verifying) ? 'bg-surface-container text-on-surface-variant cursor-not-allowed' : 'bg-primary text-on-primary'}`}
                            >
                                {verifying ? 'Verifying...' : 'Upload + Compare Hash'}
                            </button>
                        </div>
                    </div>

                    <div className="bg-surface-container p-8 rounded-xl">
                        <h3 className="font-headline text-lg font-bold text-primary mb-6">Network Specifications</h3>
                        <div className="space-y-4">
                            <div className="bg-surface-container-lowest rounded-lg p-4 cursor-pointer group">
                                <div className="flex justify-between items-center">
                                    <span className="font-label font-bold text-xs uppercase tracking-tight text-primary">Smart Contract ABI</span>
                                    <span className="material-symbols-outlined text-sm text-on-surface-variant transition-transform group-hover:rotate-90">chevron_right</span>
                                </div>
                            </div>

                            <div className="bg-surface-container-lowest rounded-lg p-4">
                                <div className="flex justify-between items-center mb-4">
                                    <span className="font-label font-bold text-xs uppercase tracking-tight text-primary">Session Info</span>
                                </div>
                                <div className="text-xs text-on-surface-variant leading-relaxed space-y-2">
                                    <p><span className="font-bold">Session:</span> {sessionId || 'N/A'}</p>
                                    <p><span className="font-bold">Blockchain:</span> {blockchain.enabled ? 'Active' : 'Offline (Local Mode)'}</p>
                                    <p><span className="font-bold">TX Count:</span> {txs.length}</p>
                                </div>
                            </div>

                            <div className="bg-secondary-fixed rounded-xl p-4 mt-8">
                                <div className="flex justify-between items-start mb-2">
                                    <span className="font-label text-[10px] font-bold text-primary tracking-widest uppercase">Network Health</span>
                                    <span className="text-primary font-headline font-bold text-lg">99.9%</span>
                                </div>
                                <div className="h-10 flex items-end gap-1">
                                    {[6, 8, 5, 9, 7, 10, 6, 4, 9, 10].map((h, i) => (
                                        <div key={i} className={`flex-1 bg-primary/${10 + i * 5} rounded-t-sm`} style={{ height: `${h * 10}%` }}></div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <footer className="w-full py-12 mt-auto bg-secondary-fixed/30">
                <div className="flex flex-col md:flex-row justify-between items-center max-w-7xl mx-auto px-8 gap-6">
                    <div className="font-headline font-bold text-primary text-lg">
                        FINROCK
                    </div>
                    <p className="font-body text-sm antialiased text-on-surface-variant">
                        © 2024 FINROCK. Precision in Financial Engineering.
                    </p>
                    <div className="flex gap-8">
                        <a className="text-emerald-800/70 hover:text-primary transition-all text-sm font-medium" href="#">Privacy</a>
                        <a className="text-emerald-800/70 hover:text-primary transition-all text-sm font-medium" href="#">Terms</a>
                        <a className="text-emerald-800/70 hover:text-primary transition-all text-sm font-medium" href="#">Security</a>
                        <a className="text-emerald-800/70 hover:text-primary transition-all text-sm font-medium" href="#">Contact</a>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default AuditLight;
