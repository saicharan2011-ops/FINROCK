import React from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../../../context/ThemeContext';

const LandingLight = () => {
    const { toggleTheme } = useTheme();

    return (
<div className="bg-background text-on-surface font-body antialiased min-h-screen">
<style>{`
        .material-symbols-outlined {
            font-variation-settings: 'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 24;
        }
        .editorial-spacing {
            letter-spacing: -0.02em;
        }
        .perspective-card {
            transform: perspective(1000px) rotateX(4deg) rotateY(-8deg);
            transition: transform 0.4s ease;
        }
        .perspective-card:hover {
            transform: perspective(1000px) rotateX(0deg) rotateY(0deg);
        }
        .glass-header {
            background: rgba(255, 255, 255, 0.8);
            backdrop-filter: blur(24px);
        }
`}</style>
{/* TopNavBar */}
<nav className="fixed top-0 w-full z-50 glass-header shadow-[0_12px_40px_rgba(25,28,29,0.06)]">
<div className="flex justify-between items-center max-w-7xl mx-auto px-8 h-20">
<div className="text-xl font-headline font-bold tracking-tighter text-emerald-900">
                FINROCK
            </div>
<div className="hidden md:flex gap-10 items-center">
<Link className="text-emerald-900 font-headline font-bold border-b-2 border-emerald-900 pb-1" to="/">Home</Link>
<Link className="text-emerald-800/60 font-medium hover:text-emerald-900 transition-colors" to="/dashboard">Dashboard</Link>
<Link className="text-emerald-800/60 font-medium hover:text-emerald-900 transition-colors" to="/audit">Audit</Link>
<Link className="text-emerald-800/60 font-medium hover:text-emerald-900 transition-colors" to="/live-agent">Live Agent</Link>
<button onClick={toggleTheme} className="text-emerald-800/60 font-medium hover:text-emerald-900 transition-colors uppercase text-[10px] tracking-widest font-bold">Switch Theme</button>
</div>
<Link to="/dashboard" className="bg-primary text-on-primary px-6 py-2.5 rounded-xl font-headline font-semibold text-sm hover:opacity-90 transition-all scale-95 duration-200 ease-in-out text-center">
                Run Analysis
            </Link>
</div>
</nav>
<main className="pt-20">
{/* Hero Section */}
<section className="relative min-h-[921px] flex items-center overflow-hidden bg-surface">
<div className="max-w-7xl mx-auto px-8 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center w-full">
<div className="z-10">
<span className="inline-block py-1 px-3 bg-secondary-fixed text-on-secondary-fixed text-xs font-headline font-bold tracking-widest uppercase rounded mb-6">Automated Credit Risk</span>
<h1 className="font-headline font-bold text-5xl lg:text-7xl text-primary editorial-spacing leading-[1.1] mb-8">
                        Appraise Any Corporate Loan in <span className="text-on-primary-container">40 Seconds</span>
</h1>
<p className="text-on-surface-variant text-lg max-w-xl mb-10 leading-relaxed">
                        Precision in financial engineering. Leverage blockchain-verified datasets and neural risk models to audit corporate credit with unprecedented speed.
                    </p>
<div className="flex gap-4">
<Link to="/dashboard" className="bg-primary text-on-primary px-8 py-4 rounded-xl font-headline font-bold text-lg hover:shadow-xl transition-all">Start Audit</Link>
<button className="bg-surface-container-low text-primary px-8 py-4 rounded-xl font-headline font-bold text-lg hover:bg-surface-container transition-all">Book Demo</button>
</div>
</div>
<div className="relative flex justify-center lg:justify-end">
{/* 3D Visualization Placeholder */}
<div className="relative w-full aspect-square max-w-lg">
<div className="absolute inset-0 bg-gradient-to-tr from-primary-container to-secondary-container rounded-full blur-[120px] opacity-20"></div>
<img alt="3D Digital Credit Card" className="w-full h-full object-contain drop-shadow-2xl" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAdX7wXXuYqRA_vLwIpyqaHPHiFduWuXz2xVn0eRDzAGnTmWUroQnpLMzLAPaq4rjEzIXbBpaypQT2cq73WgXyBrW7aTo7kVxUFKvrpjo4XGtPjd9NTDQ7MZ5wwVreIBXQBPkM6dg2owrt7jJw9zmqegzBK3jgsW_lHuoxgnUZI4ltlmiLB70eagHFSm4f04XuymFobzIQpwpDwLCQ6iRRWYLqXboz5sPjA-K8GSE2HpvbEL2I1CshW801j1L8d983_aMyWGnkskAE"/>
</div>
</div>
</div>
</section>
{/* Stats Section (Tonal Shift) */}
<section className="py-24 bg-surface-container-low">
<div className="max-w-7xl mx-auto px-8">
<div className="grid grid-cols-2 md:grid-cols-4 gap-8">
<div className="flex flex-col items-start">
<span className="font-headline font-bold text-4xl text-primary editorial-spacing mb-2">₹32,000 Cr</span>
<span className="font-label text-xs uppercase tracking-widest text-on-surface-variant">Fraud Identified</span>
</div>
<div className="flex flex-col items-start">
<span className="font-headline font-bold text-4xl text-primary editorial-spacing mb-2">700+</span>
<span className="font-label text-xs uppercase tracking-widest text-on-surface-variant">Active Courts</span>
</div>
<div className="flex flex-col items-start">
<span className="font-headline font-bold text-4xl text-primary editorial-spacing mb-2">40s</span>
<span className="font-label text-xs uppercase tracking-widest text-on-surface-variant">Avg Appraisal Time</span>
</div>
<div className="flex flex-col items-start">
<span className="font-headline font-bold text-4xl text-primary editorial-spacing mb-2">100%</span>
<span className="font-label text-xs uppercase tracking-widest text-on-surface-variant">Blockchain Immutable</span>
</div>
</div>
</div>
</section>
{/* How It Works (Horizontal Timeline) */}
<section className="py-32 bg-surface">
<div className="max-w-7xl mx-auto px-8">
<div className="text-center mb-20">
<h2 className="font-headline font-bold text-4xl text-primary mb-4">Precision Workflow</h2>
<p className="text-on-surface-variant">The 5-step neural validation process.</p>
</div>
<div className="relative flex flex-col md:flex-row justify-between gap-8">
{/* Progress Line */}
<div className="absolute top-10 left-0 w-full h-[1px] bg-outline-variant/30 hidden md:block"></div>
{/* Step 1 */}
<div className="relative z-10 flex-1 group">
<div className="w-20 h-20 bg-surface-container-lowest rounded-full flex items-center justify-center mb-8 shadow-sm group-hover:bg-primary group-hover:text-on-primary transition-all duration-300">
<span className="material-symbols-outlined text-3xl">upload_file</span>
</div>
<h3 className="font-headline font-bold text-lg mb-2">Data Ingestion</h3>
<p className="text-sm text-on-surface-variant leading-relaxed">Secure upload of corporate financial statements and ledgers.</p>
</div>
{/* Step 2 */}
<div className="relative z-10 flex-1 group">
<div className="w-20 h-20 bg-surface-container-lowest rounded-full flex items-center justify-center mb-8 shadow-sm group-hover:bg-primary group-hover:text-on-primary transition-all duration-300">
<span className="material-symbols-outlined text-3xl">account_tree</span>
</div>
<h3 className="font-headline font-bold text-lg mb-2">Network Mapping</h3>
<p className="text-sm text-on-surface-variant leading-relaxed">Cross-referencing entities across global regulatory nodes.</p>
</div>
{/* Step 3 */}
<div className="relative z-10 flex-1 group">
<div className="w-20 h-20 bg-surface-container-lowest rounded-full flex items-center justify-center mb-8 shadow-sm group-hover:bg-primary group-hover:text-on-primary transition-all duration-300">
<span className="material-symbols-outlined text-3xl">query_stats</span>
</div>
<h3 className="font-headline font-bold text-lg mb-2">Neural Audit</h3>
<p className="text-sm text-on-surface-variant leading-relaxed">40-second AI appraisal of creditworthiness and risk scores.</p>
</div>
{/* Step 4 */}
<div className="relative z-10 flex-1 group">
<div className="w-20 h-20 bg-surface-container-lowest rounded-full flex items-center justify-center mb-8 shadow-sm group-hover:bg-primary group-hover:text-on-primary transition-all duration-300">
<span className="material-symbols-outlined text-3xl">security</span>
</div>
<h3 className="font-headline font-bold text-lg mb-2">Blockchain Seal</h3>
<p className="text-sm text-on-surface-variant leading-relaxed">Results are hashed onto an immutable distributed ledger.</p>
</div>
{/* Step 5 */}
<div className="relative z-10 flex-1 group">
<div className="w-20 h-20 bg-surface-container-lowest rounded-full flex items-center justify-center mb-8 shadow-sm group-hover:bg-primary group-hover:text-on-primary transition-all duration-300">
<span className="material-symbols-outlined text-3xl">task_alt</span>
</div>
<h3 className="font-headline font-bold text-lg mb-2">Final Verdict</h3>
<p className="text-sm text-on-surface-variant leading-relaxed">Generation of audit-ready compliance reports and scores.</p>
</div>
</div>
</div>
</section>
{/* Fraud Detection Feature Cards (Asymmetric Grid) */}
<section className="py-32 bg-surface-container">
<div className="max-w-7xl mx-auto px-8">
<div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
<div className="lg:col-span-5 self-center mb-12 lg:mb-0">
<h2 className="font-headline font-bold text-4xl text-primary mb-6">Advanced Fraud Detection Engine</h2>
<p className="text-on-surface-variant text-lg leading-relaxed mb-8">Our proprietary algorithms scan for anomalies that traditional banking software misses, identifying patterns of diversion and shell company structures in real-time.</p>
<img alt="Fraud Detection Pathways" className="rounded-xl shadow-lg w-full" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCBuKFhZeafxdQfIS6tH9TE7arhnQ8MsQepXYeTrkThqawokvWhvDrYSzxAaHij-KaGMR-e78AUZ_qWrtWooQBM1ItMbdz0Srbt9xjmbP15v1Z0g4MKf32BcOgX5cVuQoXU8rn8UeQ0uLfYARMm5bpq-TqwHRo5g6iben0xtn-Vknd18dbmuNkZoPIW0Q5ZPO9f6HkmRWBITNbS6UJEEZGuExkXTVJp2OUhi7FKnByXnMxAYYYdJHtfu73WpJajPP-WV4pEabaBXug"/>
</div>
<div className="lg:col-span-7 grid grid-cols-1 md:grid-cols-2 gap-6">
{/* Card 1 */}
<div className="perspective-card bg-surface-container-lowest p-8 rounded-xl shadow-sm">
<span className="material-symbols-outlined text-primary mb-4">account_balance</span>
<h4 className="font-headline font-bold text-xl mb-3">Lien Validation</h4>
<p className="text-sm text-on-surface-variant">Real-time verification of asset charges across 700+ regional court registries.</p>
</div>
{/* Card 2 */}
<div className="perspective-card bg-surface-container-lowest p-8 rounded-xl shadow-sm mt-0 md:mt-12">
<span className="material-symbols-outlined text-primary mb-4">hub</span>
<h4 className="font-headline font-bold text-xl mb-3">Circular Flow Mapping</h4>
<p className="text-sm text-on-surface-variant">Detecting funds moving between related parties to artificially inflate revenue.</p>
</div>
{/* Card 3 */}
<div className="perspective-card bg-surface-container-lowest p-8 rounded-xl shadow-sm">
<span className="material-symbols-outlined text-primary mb-4">fingerprint</span>
<h4 className="font-headline font-bold text-xl mb-3">KYB Provenance</h4>
<p className="text-sm text-on-surface-variant">Deep-dive structural analysis of ultimate beneficial owners (UBO).</p>
</div>
{/* Card 4 */}
<div className="perspective-card bg-surface-container-lowest p-8 rounded-xl shadow-sm mt-0 md:mt-12">
<span className="material-symbols-outlined text-primary mb-4">history_edu</span>
<h4 className="font-headline font-bold text-xl mb-3">Ledger Integrity</h4>
<p className="text-sm text-on-surface-variant">Mathematical validation of general ledger entries against bank statements.</p>
</div>
{/* Card 5 (Full width below) */}
<div className="perspective-card bg-primary-container text-on-primary-container p-8 rounded-xl shadow-sm md:col-span-2">
<div className="flex items-center gap-4">
<span className="material-symbols-outlined text-3xl">rocket_launch</span>
<div>
<h4 className="font-headline font-bold text-xl">Real-Time Risk Pulsing</h4>
<p className="text-sm opacity-80">Continuous monitoring of credit health with instant alerts on covenant breaches.</p>
</div>
</div>
</div>
</div>
</div>
</div>
</section>
</main>
{/* Footer */}
<footer className="w-full py-12 mt-auto bg-emerald-50 text-emerald-900">
<div className="flex flex-col md:flex-row justify-between items-center max-w-7xl mx-auto px-8 gap-6">
<div className="flex flex-col items-center md:items-start gap-2">
<span className="font-headline font-bold text-emerald-900 text-xl">FINROCK</span>
<p className="font-body text-sm antialiased text-emerald-800/70">© 2024 FINROCK. Precision in Financial Engineering.</p>
</div>
<div className="flex gap-8">
<a className="font-body text-sm text-emerald-800/70 hover:text-emerald-900 transition-all" href="#">Privacy</a>
<a className="font-body text-sm text-emerald-800/70 hover:text-emerald-900 transition-all" href="#">Terms</a>
<a className="font-body text-sm text-emerald-800/70 hover:text-emerald-900 transition-all" href="#">Security</a>
<a className="font-body text-sm text-emerald-800/70 hover:text-emerald-900 transition-all" href="#">Contact</a>
</div>
</div>
</footer>
</div>
    );
};

export default LandingLight;
