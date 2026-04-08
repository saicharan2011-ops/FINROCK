import React, { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTheme } from '../../../context/ThemeContext';
import { createSession, uploadDocument } from '../../../lib/backend';

const STORAGE_KEY = 'creditsense.session_id';

const DashboardLight = () => {
    const { toggleTheme } = useTheme();
    const navigate = useNavigate();

    const [companyName, setCompanyName] = useState('');
    const [regNumber, setRegNumber] = useState('');
    const [email, setEmail] = useState('');
    const [industry, setIndustry] = useState('');
    const [loanAmount, setLoanAmount] = useState('4200000');

    const [uploads, setUploads] = useState({ gst: null, bank: null, annual: null, itr: null });
    const [uploadStatus, setUploadStatus] = useState({});
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    const fileRefs = {
        gst: useRef(null),
        bank: useRef(null),
        annual: useRef(null),
        itr: useRef(null),
    };

    const handleFileSelect = (docType) => (e) => {
        const file = e.target.files?.[0];
        if (file) {
            setUploads((prev) => ({ ...prev, [docType]: file }));
            setUploadStatus((prev) => ({ ...prev, [docType]: 'selected' }));
        }
    };

    const handleSubmit = async () => {
        setSubmitting(true);
        setError('');
        try {
            // Create session
            const name = companyName || 'Nexus Global';
            const loan = parseFloat(loanAmount) || 4200000;
            const { session_id } = await createSession({ company_name: name, loan_amount: loan });
            localStorage.setItem(STORAGE_KEY, session_id);

            // Upload any selected docs
            for (const [docType, file] of Object.entries(uploads)) {
                if (file) {
                    setUploadStatus((prev) => ({ ...prev, [docType]: 'uploading' }));
                    try {
                        await uploadDocument(session_id, docType, file);
                        setUploadStatus((prev) => ({ ...prev, [docType]: 'done' }));
                    } catch {
                        setUploadStatus((prev) => ({ ...prev, [docType]: 'error' }));
                    }
                }
            }

            // Navigate to live agent and auto-start analysis
            navigate('/live-agent?autostart=1');
        } catch (e) {
            setError(e?.message || 'Failed to create session');
        } finally {
            setSubmitting(false);
        }
    };

    const docCards = [
        { key: 'gst', icon: 'receipt_long', label: 'GST Certificate', sub: 'PDF / JSON' },
        { key: 'bank', icon: 'account_balance', label: 'Bank Statement', sub: 'Last 12 Months' },
        { key: 'annual', icon: 'description', label: 'Annual Report', sub: 'FY 2023-24' },
        { key: 'itr', icon: 'history_edu', label: 'ITR Filing', sub: 'Verified Copy' },
    ];

    return (
        <div className="bg-background text-on-surface font-body min-h-screen flex flex-col antialiased">
            <style>{`
        .material-symbols-outlined {
            font-variation-settings: 'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 24;
            vertical-align: middle;
        }
        .floating-label-input:focus-within label,
        .floating-label-input input:not(:placeholder-shown) + label {
            transform: translateY(-1.5rem) scale(0.85);
            color: #3f6653;
        }
        .tonal-shift-bottom {
            box-shadow: 0 4px 20px -5px rgba(25, 28, 29, 0.05);
        }
`}</style>
            {/* TopNavBar */}
            <header className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-xl shadow-[0_12px_40px_rgba(25,28,29,0.06)]">
                <div className="flex justify-between items-center max-w-7xl mx-auto px-8 h-20">
                    <div className="text-xl font-bold tracking-tighter text-emerald-900 font-headline">
                        FINROCK
                    </div>
                    <nav className="hidden md:flex items-center gap-8">
                        <Link className="text-emerald-800/60 font-medium hover:text-emerald-900 transition-colors" to="/">Home</Link>
                        <Link className="text-emerald-900 font-bold border-b-2 border-emerald-900 pb-1" to="/dashboard">Dashboard</Link>
                        <Link className="text-emerald-800/60 font-medium hover:text-emerald-900 transition-colors" to="/audit">Audit</Link>
                        <Link className="text-emerald-800/60 font-medium hover:text-emerald-900 transition-colors" to="/results">Insights</Link>
                        <button onClick={toggleTheme} className="text-emerald-800/60 font-medium hover:text-emerald-900 transition-colors uppercase text-[10px] tracking-widest font-bold">Switch Theme</button>
                    </nav>
                    <Link to="/live-agent?autostart=1" className="bg-primary text-on-primary px-6 py-2.5 rounded-xl font-headline font-medium hover:opacity-90 transition-all active:scale-95 duration-200">
                        Run Analysis
                    </Link>
                </div>
            </header>
            <main className="pt-32 pb-24 flex-grow max-w-7xl mx-auto px-8 w-full">
                {/* 4-Step Stepper */}
                <div className="mb-16">
                    <div className="flex justify-between items-center relative">
                        <div className="absolute h-px bg-surface-container-high w-full top-1/2 -z-10"></div>
                        {[
                            { n: 1, label: 'Company Info', active: true },
                            { n: 2, label: 'Documentation', active: Object.values(uploads).some(Boolean) },
                            { n: 3, label: 'Verification', active: false },
                            { n: 4, label: 'Analysis', active: false },
                        ].map((step) => (
                            <div key={step.n} className="flex flex-col items-center gap-3">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-headline font-bold ${step.active ? 'bg-primary text-on-primary' : 'bg-surface-container-high text-outline'}`}>{step.n}</div>
                                <span className={`text-xs font-label uppercase tracking-widest ${step.active ? 'text-primary font-bold' : 'text-outline font-medium'}`}>{step.label}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                        {error}
                    </div>
                )}

                <div className="grid grid-cols-12 gap-8">
                    {/* Section 1: Company Info Form */}
                    <section className="col-span-12 lg:col-span-7 bg-surface-container-lowest rounded-xl p-8 shadow-[0_12px_40px_rgba(25,28,29,0.03)] border border-outline-variant/10">
                        <div className="mb-8">
                            <h2 className="text-2xl font-headline font-bold tracking-tight text-primary mb-2">Company Information</h2>
                            <p className="text-on-surface-variant text-sm">Please provide the core structural data for your organization.</p>
                        </div>
                        <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="relative floating-label-input">
                                    <input className="block w-full px-4 py-4 text-on-surface bg-surface-container-low rounded-xl border-none focus:ring-1 focus:ring-surface-tint focus:bg-white transition-all peer outline-none" id="legal_name" placeholder=" " type="text" value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
                                    <label className="absolute text-sm text-on-surface-variant duration-300 transform -translate-y-0 scale-100 top-4 left-4 z-10 origin-[0] peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-85 peer-focus:-translate-y-6 font-medium pointer-events-none" htmlFor="legal_name">Legal Entity Name</label>
                                </div>
                                <div className="relative floating-label-input">
                                    <input className="block w-full px-4 py-4 text-on-surface bg-surface-container-low rounded-xl border-none focus:ring-1 focus:ring-surface-tint focus:bg-white transition-all peer outline-none" id="reg_number" placeholder=" " type="text" value={regNumber} onChange={(e) => setRegNumber(e.target.value)} />
                                    <label className="absolute text-sm text-on-surface-variant duration-300 transform -translate-y-0 scale-100 top-4 left-4 z-10 origin-[0] peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-85 peer-focus:-translate-y-6 font-medium pointer-events-none" htmlFor="reg_number">Registration Number (CIN)</label>
                                </div>
                            </div>
                            <div className="relative floating-label-input">
                                <input className="block w-full px-4 py-4 text-on-surface bg-surface-container-low rounded-xl border-none focus:ring-1 focus:ring-surface-tint focus:bg-white transition-all peer outline-none" id="official_email" placeholder=" " type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                                <label className="absolute text-sm text-on-surface-variant duration-300 transform -translate-y-0 scale-100 top-4 left-4 z-10 origin-[0] peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-85 peer-focus:-translate-y-6 font-medium pointer-events-none" htmlFor="official_email">Official Correspondence Email</label>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="relative floating-label-input">
                                    <input className="block w-full px-4 py-4 text-on-surface bg-surface-container-low rounded-xl border-none focus:ring-1 focus:ring-surface-tint focus:bg-white transition-all peer outline-none" id="loan_amount" placeholder=" " type="text" value={loanAmount} onChange={(e) => setLoanAmount(e.target.value)} />
                                    <label className="absolute text-sm text-on-surface-variant duration-300 transform -translate-y-0 scale-100 top-4 left-4 z-10 origin-[0] peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-85 peer-focus:-translate-y-6 font-medium pointer-events-none" htmlFor="loan_amount">Loan Amount (USD)</label>
                                </div>
                                <div className="relative floating-label-input">
                                    <input className="block w-full px-4 py-4 text-on-surface bg-surface-container-low rounded-xl border-none focus:ring-1 focus:ring-surface-tint focus:bg-white transition-all peer outline-none" id="industry" placeholder=" " type="text" value={industry} onChange={(e) => setIndustry(e.target.value)} />
                                    <label className="absolute text-sm text-on-surface-variant duration-300 transform -translate-y-0 scale-100 top-4 left-4 z-10 origin-[0] peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-85 peer-focus:-translate-y-6 font-medium pointer-events-none" htmlFor="industry">Industry Sector</label>
                                </div>
                            </div>
                        </form>
                    </section>
                    {/* Section 2: Document Upload 2x2 Grid */}
                    <section className="col-span-12 lg:col-span-5 flex flex-col gap-8">
                        <div>
                            <h2 className="text-2xl font-headline font-bold tracking-tight text-primary mb-6">Verification Documents</h2>
                            <div className="grid grid-cols-2 gap-4">
                                {docCards.map(({ key, icon, label, sub }) => (
                                    <div
                                        key={key}
                                        onClick={() => fileRefs[key].current?.click()}
                                        className={`group bg-surface-container rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-secondary-container transition-all border aspect-square ${
                                            uploadStatus[key] === 'done'
                                                ? 'border-emerald-400 bg-emerald-50'
                                                : uploadStatus[key] === 'error'
                                                ? 'border-red-400 bg-red-50'
                                                : uploadStatus[key] === 'selected'
                                                ? 'border-primary/40 bg-primary/5'
                                                : 'border-transparent hover:border-surface-tint/20'
                                        }`}
                                    >
                                        <input ref={fileRefs[key]} type="file" className="hidden" onChange={handleFileSelect(key)} accept=".pdf,.json,.csv,.jpg,.jpeg,.png" />
                                        <span className="material-symbols-outlined text-3xl mb-3 text-surface-tint">{icon}</span>
                                        <span className="font-headline text-sm font-bold text-primary">{label}</span>
                                        {uploads[key] ? (
                                            <span className="text-[10px] uppercase tracking-widest text-emerald-600 mt-2 font-label font-bold truncate max-w-full px-2">
                                                {uploadStatus[key] === 'uploading' ? '⏳ Uploading...' : uploadStatus[key] === 'done' ? '✅ Uploaded' : uploadStatus[key] === 'error' ? '❌ Error' : `📎 ${uploads[key].name}`}
                                            </span>
                                        ) : (
                                            <span className="text-[10px] uppercase tracking-widest text-on-surface-variant mt-2 font-label font-bold">{sub}</span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                        {/* Section 3: Security Notice */}
                        <div className="bg-primary text-on-primary rounded-xl p-6 relative overflow-hidden">
                            <div className="relative z-10">
                                <div className="flex items-center gap-3 mb-4">
                                    <span className="material-symbols-outlined text-secondary-fixed">verified_user</span>
                                    <h3 className="font-headline font-bold text-lg">Security Protocol</h3>
                                </div>
                                <p className="text-sm text-on-primary-container leading-relaxed mb-6">
                                    All documents are processed using AES-256 end-to-end encryption. Each submission generates a unique blockchain hash for immutable verification of data integrity.
                                </p>
                                <div className="flex items-center gap-2 font-label text-[10px] uppercase tracking-[0.2em] opacity-80 font-bold">
                                    <span className="w-2 h-2 rounded-full bg-secondary-fixed animate-pulse"></span>
                                    Quantum-Resistant Hash Active
                                </div>
                            </div>
                            <div className="absolute -right-8 -bottom-8 opacity-10">
                                <span className="material-symbols-outlined text-[120px]">security</span>
                            </div>
                        </div>
                    </section>
                </div>
                {/* Call to Action */}
                <div className="mt-16 flex flex-col items-center gap-6">
                    <div className="w-full h-px bg-surface-container-high"></div>
                    <div className="flex flex-col md:flex-row items-center justify-between w-full gap-4">
                        <div className="flex items-center gap-2 text-on-surface-variant">
                            <span className="material-symbols-outlined text-sm">info</span>
                            <span className="text-xs italic font-medium">By proceeding, you agree to our automated audit terms and data handling policy.</span>
                        </div>
                        <button
                            onClick={handleSubmit}
                            disabled={submitting}
                            className={`group flex items-center gap-3 bg-primary text-on-primary px-10 py-4 rounded-xl font-headline font-bold text-lg hover:shadow-2xl hover:shadow-primary/20 transition-all ${submitting ? 'opacity-60 cursor-not-allowed' : ''}`}
                        >
                            {submitting ? 'Processing...' : 'Run Credit Analysis'}
                            <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">arrow_forward_ios</span>
                        </button>
                    </div>
                </div>
            </main>
            {/* Footer */}
            <footer className="w-full py-12 mt-auto bg-emerald-50 font-['Manrope'] text-sm antialiased border-t border-outline-variant/10">
                <div className="flex flex-col md:flex-row justify-between items-center max-w-7xl mx-auto px-8 gap-6 text-emerald-900">
                    <div className="flex flex-col gap-2 scale-90 origin-left">
                        <span className="font-headline font-bold text-emerald-900 text-lg">FINROCK</span>
                        <span className="text-emerald-800/70 font-medium">© 2024 FINROCK. Precision in Financial Engineering.</span>
                    </div>
                    <div className="flex gap-8 scale-90 origin-right">
                        <a className="text-emerald-800/70 hover:text-emerald-900 transition-all opacity-80 hover:opacity-100 font-bold" href="#">Privacy</a>
                        <a className="text-emerald-800/70 hover:text-emerald-900 transition-all opacity-80 hover:opacity-100 font-bold" href="#">Terms</a>
                        <a className="text-emerald-800/70 hover:text-emerald-900 transition-all opacity-80 hover:opacity-100 font-bold" href="#">Security</a>
                        <a className="text-emerald-800/70 hover:text-emerald-900 transition-all opacity-80 hover:opacity-100 font-bold" href="#">Contact</a>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default DashboardLight;
