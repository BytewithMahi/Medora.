import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, QrCode, Search, ShieldCheck, ShieldAlert, AlertOctagon, Activity, CheckCircle2, MapPin, Factory, Truck, Store, Flag, Fingerprint } from 'lucide-react';
import { Canvas } from '@react-three/fiber';
import FloatingMedicine3D from './FloatingMedicine3D';
import { supabase } from '../../lib/supabase';
import QRScanner from '../QRScanner';

type Status = 'verified' | 'pending' | 'suspicious' | null;

interface CustomerDashboardProps {
    onScanVerify?: (batch: string, token: string) => void;
    onAuthRequired?: () => void;
    userEmail?: string;
}

export default function CustomerDashboard({ onScanVerify, onAuthRequired, userEmail }: CustomerDashboardProps) {
    const [scanInput, setScanInput] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [isScanning, setIsScanning] = useState(false);
    const [resultStatus, setResultStatus] = useState<Status>(null);
    const [showFeedbackModal, setShowFeedbackModal] = useState(false);
    const [medicineData, setMedicineData] = useState<any>(null);
    const [ledgerEvents, setLedgerEvents] = useState<any[]>([]);
    const [uidInput, setUidInput] = useState('');
    const [hasConsent, setHasConsent] = useState(false);
    const [authError, setAuthError] = useState('');
    
    // Reporting System States
    const [reportIssueType, setReportIssueType] = useState('other');
    const [reportDescription, setReportDescription] = useState('');
    const [isReporting, setIsReporting] = useState(false);
    const [reportSuccess, setReportSuccess] = useState('');

    // Integrity Questionnaire
    const [questions, setQuestions] = useState({
        batchCorrect: '',
        sealIntact: '',
        expiryLegible: ''
    });

    const handleSearch = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!scanInput) return;

        if (!uidInput || !hasConsent) {
            setAuthError("UID and Ownership Consent are required to access the ledger.");
            return;
        }

        setIsSearching(true);
        setAuthError('');
        setResultStatus(null);
        setMedicineData(null);
        setLedgerEvents([]);

        try {
            // Verify UID first
            const { data: userData, error: userError } = await supabase
                .from('users')
                .select('*')
                .eq('request_id', uidInput)
                .eq('role', 'Customer')
                .single();

            if (userError || !userData) {
                setAuthError("Access Denied: Invalid Secure UID. Please register to obtain a node identity.");
                setIsSearching(false);
                return;
            }

            const { data: medData, error: medError } = await supabase
                .from('medicines')
                .select('*')
                .eq('batch_no', scanInput)
                .single();

            if (medError || !medData) {
                // Not found
                await supabase.from('medicines').insert({
                    name: 'Unknown Medicine',
                    batch_no: scanInput,
                    status: 'suspicious'
                });
                setResultStatus('suspicious');
            } else if (medData.status === 'suspicious') {
                setMedicineData(medData);
                setResultStatus('suspicious');
            } else {
                setMedicineData(medData);
                const { data: evData } = await supabase
                    .from('ledger_events')
                    .select('*')
                    .eq('medicine_id', medData.id)
                    .order('created_at', { ascending: true });

                const events = evData || [];

                // Record the search to the ledger so Chat graph can find it!
                if (userEmail) {
                    await supabase.from('ledger_events').insert([{
                         medicine_id: medData.id,
                         role: 'Consumer Scan',
                         status: 'verified',
                         details: {
                             'Batch Correct': questions.batchCorrect === 'yes' ? 'True' : (questions.batchCorrect === 'no' ? 'False' : 'N/A'),
                             'Seal Intact': questions.sealIntact === 'yes' ? 'True' : (questions.sealIntact === 'no' ? 'False' : 'N/A'),
                             'Expiry Legible': questions.expiryLegible === 'yes' ? 'True' : (questions.expiryLegible === 'no' ? 'False' : 'N/A'),
                         },
                         actor_email: userEmail,
                         actor_phone: 'N/A'
                    }]);
                }

                setLedgerEvents(events);

                const hasRetailer = events.some((e: any) => e.role === 'Retailer Verification');
                const hasDistributor = events.some((e: any) => e.role === 'Distributor Verification');

                if (hasRetailer) setResultStatus('verified');
                else if (hasDistributor || events.length > 0) setResultStatus('pending');
                else setResultStatus('pending');
            }
        } catch (err) {
            console.error(err);
        } finally {
            setIsSearching(false);
        }
    };

    const getStatusConfig = () => {
        // PRIORITY: If flagged_reasons exist, override with a High Alert status
        if (medicineData && medicineData.flagged_reasons) {
            return {
                icon: AlertOctagon,
                color: 'text-rose-500',
                bg: 'bg-rose-500/10',
                border: 'border-rose-500/50',
                title: 'High Alert: Suspicious Batch Detected',
                desc: 'This product has been flagged due to security protocol violations. It may be counterfeit or compromised.',
                glow: 'shadow-[0_0_30px_rgba(244,63,94,0.4)]'
            };
        }

        switch (resultStatus) {
            case 'verified':
                return {
                    icon: ShieldCheck,
                    color: 'text-emerald-400',
                    bg: 'bg-emerald-500/10',
                    border: 'border-emerald-500/50',
                    title: 'Medicine Verified Successfully',
                    desc: 'This product has been cryptographically verified across all supply chain nodes.',
                    glow: 'shadow-[0_0_30px_rgba(52,211,153,0.3)]'
                };
            case 'suspicious':
                return {
                    icon: AlertOctagon,
                    color: 'text-rose-500',
                    bg: 'bg-rose-500/10',
                    border: 'border-rose-500/50',
                    title: 'Verification Failed – Unauthorized Record',
                    desc: 'This batch number does not exist on the MedChain ledger or is completely unrecognized.',
                    glow: 'shadow-[0_0_30px_rgba(244,63,94,0.3)]'
                };
            case 'pending':
                return {
                    icon: ShieldAlert,
                    color: 'text-amber-400',
                    bg: 'bg-amber-500/10',
                    border: 'border-amber-500/50',
                    title: 'Verification Incomplete',
                    desc: 'This product is registered but hasn\'t completed its full journey to the retail node yet.',
                    glow: 'shadow-[0_0_30px_rgba(251,191,36,0.3)]'
                };
            default:
                return null;
        }
    };

    const handleReportSubmit = async () => {
        if (!scanInput || !reportDescription) return;
        setIsReporting(true);
        setReportSuccess('');
        try {
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
            const response = await fetch(`${API_URL}/api/report`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    batchNo: scanInput,
                    issueType: reportIssueType,
                    description: reportDescription,
                    reporterEmail: userEmail || 'anonymous-customer@medora.net'
                })
            });

            const result = await response.json();
            if (result.success) {
                setReportSuccess(`Report submitted successfully! The ${reportIssueType === 'other' ? 'Admin' : 'responsible party'} has been notified.`);
                setTimeout(() => {
                    setShowFeedbackModal(false);
                    setReportSuccess('');
                    setReportDescription('');
                }, 3000);
            } else {
                alert(result.error || 'Failed to submit report');
            }
        } catch (error) {
            console.error('Report error:', error);
            alert('A network error occurred while submitting the report.');
        } finally {
            setIsReporting(false);
        }
    };

    const statusConfig = getStatusConfig();
    const StatusIcon = statusConfig?.icon as any;

    return (
        <div className="relative w-full min-h-screen bg-background text-foreground overflow-hidden pt-24 pb-12 px-4 sm:px-6 lg:px-8">
            <div className="absolute inset-0 z-0 opacity-40">
                <Canvas camera={{ position: [0, 0, 8], fov: 50 }}>
                    <FloatingMedicine3D />
                </Canvas>
            </div>

            <div className="relative z-10 max-w-4xl mx-auto flex flex-col items-center">

                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="w-full text-center mb-12"
                >
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-400/10 border border-emerald-400/30 text-emerald-400 text-sm font-semibold mb-6">
                        <User className="w-4 h-4" />
                        CONSUMER VERIFICATION PORTAL
                    </div>
                    <h1 className="text-4xl md:text-6xl font-black text-white mb-6">Verify Your Medicine</h1>
                    <p className="text-white/60 text-lg max-w-2xl mx-auto">
                        Ensure the authenticity and safety of your pharmaceuticals. Scan the QR code or enter the batch number below.
                    </p>
                </motion.div>

                {/* Search Panel: UID, Batch, and Consent */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="w-full max-w-2xl mb-8 z-20"
                >
                    <div className="glassmorphism-dark p-8 rounded-[2rem] border border-white/10 shadow-2xl relative overflow-hidden group">
                        <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
                        
                        <div className="relative space-y-6">
                            {/* Row 1: Batch & UID */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest ml-1">Medicine Batch Number</label>
                                    <div className="relative flex items-center bg-black/40 border border-white/10 rounded-xl px-4 py-3 focus-within:border-emerald-500/50 transition-all">
                                        <Search className="w-4 h-4 text-white/30 mr-3" />
                                        <input
                                            type="text"
                                            value={scanInput}
                                            onChange={(e) => {
                                                setScanInput(e.target.value);
                                                setResultStatus(null);
                                            }}
                                            placeholder="e.g. AX-792"
                                            className="bg-transparent text-white placeholder-white/20 focus:outline-none w-full font-medium"
                                        />
                                        <button type="button" onClick={() => setIsScanning(true)} className="ml-2 hover:text-emerald-400 transition-colors">
                                            <QrCode className="w-5 h-5 opacity-50 hover:opacity-100" />
                                        </button>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest ml-1">Secure Node UID</label>
                                    <div className="relative flex items-center bg-black/40 border border-white/10 rounded-xl px-4 py-3 focus-within:border-emerald-500/50 transition-all">
                                        <Fingerprint className="w-4 h-4 text-white/30 mr-3" />
                                        <input
                                            type="text"
                                            value={uidInput}
                                            onChange={(e) => {
                                                setUidInput(e.target.value);
                                                setAuthError('');
                                            }}
                                            placeholder="6-char code"
                                            className="bg-transparent text-white placeholder-white/20 focus:outline-none w-full font-mono"
                                        />
                                    </div>
                                    <div className="flex justify-end pr-1">
                                        <button 
                                            type="button" 
                                            onClick={onAuthRequired}
                                            className="text-[10px] text-emerald-400/70 hover:text-emerald-400 font-bold uppercase tracking-tighter transition-colors"
                                        >
                                            Don't have a UID? Mint Secure Identity
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Row 2: Consent */}
                            <div className="flex items-start gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-white/10 transition-colors group/consent">
                                <div className="pt-1">
                                    <input
                                        type="checkbox"
                                        id="consent-tick"
                                        checked={hasConsent}
                                        onChange={(e) => setHasConsent(e.target.checked)}
                                        className="w-5 h-5 rounded border-white/10 bg-black/40 text-emerald-500 focus:ring-emerald-500/50 focus:ring-offset-0 cursor-pointer"
                                    />
                                </div>
                                <label htmlFor="consent-tick" className="text-xs text-white/50 leading-relaxed cursor-pointer group-hover/consent:text-white/70 transition-colors">
                                    <span className="text-emerald-400 font-bold block mb-1 uppercase tracking-tighter">Ownership Affirmation</span>
                                    I affirm that I am the legal owner/possessor of this medicine and am accessing this ledger for authenticity verification purposes.
                                    <span className="block mt-1 text-[10px] opacity-60 italic">Note: This tick mark serves as the cryptographic record of consent for node verification.</span>
                                </label>
                            </div>

                            {authError && (
                                <motion.div 
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-[11px] text-rose-300 flex items-center gap-2"
                                >
                                    <AlertOctagon className="w-4 h-4 shrink-0" />
                                    {authError}
                                </motion.div>
                            )}
                        </div>
                    </div>
                </motion.div>

                {/* Integrity Questionnaire */}
                <AnimatePresence>
                    {scanInput && !resultStatus && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="w-full max-w-2xl mb-12 glassmorphism-dark p-6 rounded-3xl border border-white/10 shadow-2xl z-20"
                        >
                            <p className="text-sm font-semibold text-white/80 uppercase tracking-wider mb-4">Integrity Questionnaire</p>
                            <div className="space-y-3">
                                {[
                                    { id: 'batchCorrect', label: 'Does the batch number on the package match your input?' },
                                    { id: 'expiryLegible', label: 'Is the expiration date clearly legible on the packaging?' },
                                    { id: 'sealIntact', label: 'Is the safety seal completely untampered and intact?' }
                                ].map((q) => (
                                    <div key={q.id} className={`flex flex-col gap-3 p-4 rounded-xl border transition-all ${questions[q.id as keyof typeof questions] ? 'bg-emerald-500/10 border-emerald-500/50' : 'bg-black/30 border-white/5'}`}>
                                        <span className={`text-sm ${questions[q.id as keyof typeof questions] ? 'text-white' : 'text-white/70'}`}>{q.label}</span>
                                        <div className="flex gap-4">
                                            <label className="flex items-center gap-2 cursor-pointer text-sm text-white/80 hover:text-white">
                                                <input
                                                    type="radio"
                                                    name={q.id}
                                                    value="yes"
                                                    checked={questions[q.id as keyof typeof questions] === 'yes'}
                                                    onChange={(e) => setQuestions({ ...questions, [q.id]: e.target.value })}
                                                    className="w-4 h-4 text-emerald-500 bg-black/50 border-white/20 focus:ring-emerald-500 focus:ring-offset-0"
                                                /> Yes
                                            </label>
                                            <label className="flex items-center gap-2 cursor-pointer text-sm text-white/80 hover:text-white">
                                                <input
                                                    type="radio"
                                                    name={q.id}
                                                    value="no"
                                                    checked={questions[q.id as keyof typeof questions] === 'no'}
                                                    onChange={(e) => setQuestions({ ...questions, [q.id]: e.target.value })}
                                                    className="w-4 h-4 text-emerald-500 bg-black/50 border-white/20 focus:ring-emerald-500 focus:ring-offset-0"
                                                /> No
                                            </label>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <motion.button
                                onClick={() => handleSearch()}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                disabled={isSearching || !uidInput || !hasConsent}
                                className={`w-full relative overflow-hidden rounded-xl font-bold py-4 mt-6 transition-all ${isSearching || !uidInput || !hasConsent ? 'bg-emerald-500/10 text-emerald-400/50 cursor-not-allowed' : 'bg-emerald-500 text-white hover:shadow-[0_0_20px_rgba(52,211,153,0.5)]'}`}
                            >
                                {isSearching ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <Activity className="w-5 h-5 animate-spin" /> Verifying...
                                    </span>
                                ) : (
                                    <span className="flex items-center justify-center gap-2">
                                        {(!uidInput || !hasConsent) ? 'Unlock Ledger Access' : 'Verify Product'}
                                    </span>
                                )}
                            </motion.button>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Results Area */}
                <AnimatePresence mode="wait">
                    {resultStatus && statusConfig && (
                        <motion.div
                            key="results"
                            initial={{ opacity: 0, y: 40, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ type: "spring", stiffness: 200, damping: 20 }}
                            className="w-full max-w-4xl"
                        >
                            {/* --- SUSPICIOUS BATCH ALERT START --- */}
                            {medicineData && medicineData.flagged_reasons && typeof medicineData.flagged_reasons === 'string' && (
                                <motion.div 
                                    initial={{ opacity: 0, y: -20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="w-full mb-6 p-6 rounded-3xl border border-rose-500/30 bg-rose-500/5 backdrop-blur-xl flex flex-col md:flex-row items-center gap-6 shadow-[0_0_50px_rgba(244,63,94,0.15)]"
                                >
                                    <div className="w-16 h-16 rounded-2xl bg-rose-500/20 flex items-center justify-center shrink-0 border border-rose-500/40">
                                        <ShieldAlert className="w-10 h-10 text-rose-500 animate-pulse" />
                                    </div>
                                    <div className="flex-1 text-center md:text-left">
                                        <h3 className="text-xl font-black text-rose-500 uppercase tracking-tighter mb-1">Security Flag Alert</h3>
                                        <p className="text-white/80 font-medium mb-3 text-sm">This batch has been flagged as suspicious by the MedChain network due to security protocol violations.</p>
                                        <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                                            {medicineData.flagged_reasons.split(' | ').filter(Boolean).slice(0, 1).map((reason: string, i: number) => (
                                                <span key={i} className="px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[10px] font-bold font-mono">
                                                    {reason}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                            {/* --- SUSPICIOUS BATCH ALERT END --- */}

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
                            {/* Status Card */}
                            <div className={`glassmorphism-dark p-8 rounded-3xl border flex flex-col items-center text-center relative overflow-hidden ${statusConfig.border} ${statusConfig.glow}`}>
                                <div className={`absolute top-0 w-full h-2 ${statusConfig.bg.split('/')[0].replace('bg-', 'bg-')}`} />

                                <div className={`w-24 h-24 rounded-full flex items-center justify-center mb-6 mt-4 ${statusConfig.bg}`}>
                                    {StatusIcon && <StatusIcon className={`w-12 h-12 ${statusConfig.color}`} />}
                                </div>

                                <h2 className={`text-2xl font-black mb-2 ${statusConfig.color}`}>{statusConfig.title}</h2>
                                <p className="text-white/70 mb-8">{statusConfig.desc}</p>

                                <div className="w-full bg-black/40 rounded-2xl p-6 text-left border border-white/5">
                                    <h4 className="text-xs font-bold text-white/40 uppercase tracking-wider mb-4 border-b border-white/10 pb-2">Registered Details</h4>

                                    {resultStatus !== 'suspicious' && medicineData ? (
                                        <div className="space-y-3">
                                            <div className="flex justify-between">
                                                <span className="text-white/60">Medicine Name</span>
                                                <span className="text-white font-semibold">{medicineData.name}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-white/60">Composition</span>
                                                <span className="text-white font-semibold text-right max-w-[60%] truncate">{medicineData.composition || 'N/A'}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-white/60">Mfg Date</span>
                                                <span className="text-white font-semibold">{medicineData.mfg_date ? new Date(medicineData.mfg_date).toLocaleDateString() : 'N/A'}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-white/60">Expiry Date</span>
                                                <span className="text-white font-semibold">{medicineData.expiry_date ? new Date(medicineData.expiry_date).toLocaleDateString() : 'N/A'}</span>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-center py-4">
                                            <p className="text-rose-400 font-semibold text-xl">No Records found!</p>
                                            <p className="text-sm text-white/50 mt-2">This batch has been flagged as suspicious. Do not consume this product.</p>
                                        </div>
                                    )}
                                </div>

                                {/* Universal Reporting Option */}
                                <button
                                    onClick={() => setShowFeedbackModal(true)}
                                    className={`w-full mt-6 py-4 rounded-xl border font-bold transition-all flex items-center justify-center gap-2 ${
                                        resultStatus === 'verified' 
                                        ? 'bg-white/5 border-white/10 text-white/50 hover:bg-white/10 hover:text-white' 
                                        : 'bg-rose-500/10 border-rose-500/30 text-rose-400 hover:bg-rose-500/20'
                                    }`}
                                >
                                    <Flag className="w-5 h-5" /> {resultStatus === 'verified' ? 'Report a Concern' : 'Report Suspicious Medicine'}
                                </button>
                            </div>

                            {/* Timeline Card */}
                            <div className="glassmorphism p-8 rounded-3xl flex flex-col relative overflow-hidden">
                                <h3 className="text-xl font-bold text-white mb-8 border-b border-white/10 pb-4">Immutable Journey</h3>

                                <div className="relative flex-grow flex flex-col justify-between pl-8">
                                    {medicineData && medicineData.flagged_reasons ? (
                                        <div className="flex flex-col items-center justify-center h-full text-center py-12 px-4 border-2 border-dashed border-rose-500/20 rounded-2xl bg-rose-500/5">
                                            <AlertOctagon className="w-16 h-16 text-rose-500/40 mb-4 animate-pulse" />
                                            <h4 className="text-lg font-bold text-rose-500 mb-2">Chain Integrity Compromised</h4>
                                            <p className="text-xs text-white/50 max-w-[200px]">The cryptographic chain for this batch has been broken or contains critical sequence violations. Journey data is hidden for safety.</p>
                                        </div>
                                    ) : (
                                        <>
                                            {/* Vertical Line */}
                                            <div className="absolute top-4 bottom-4 left-[1.15rem] w-0.5 bg-emerald-500/20" />

                                            {/* Manufacturer Node */}
                                            {(() => {
                                                const event = ledgerEvents.find(e => e.role === 'Producer Initialization');
                                                return (
                                                    <div className="relative pb-8">
                                                        <div className={`absolute -left-[2.1rem] w-10 h-10 rounded-full flex items-center justify-center border-4 border-slate-900 z-10 ${event ? 'bg-emerald-500 text-slate-900 shadow-[0_0_15px_rgba(52,211,153,0.5)]' : 'bg-slate-800 text-slate-500'}`}>
                                                            {event ? <Factory className="w-5 h-5" /> : <AlertOctagon className="w-4 h-4" />}
                                                        </div>
                                                        <div>
                                                            <h4 className={`text-lg font-bold ${event ? 'text-emerald-400' : 'text-white/30'}`}>Producer Check</h4>
                                                            {event ? (
                                                                <>
                                                                    <p className="text-sm text-white/80 mt-1">{event.actor_email || 'Producer'}</p>
                                                                    <p className="text-xs text-white/40 mt-1 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> {new Date(event.created_at).toLocaleString()}</p>
                                                                </>
                                                            ) : (
                                                                <p className="text-sm text-white/30 mt-1 text-white/50">Pending record</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })()}

                                            {/* Distributor Node */}
                                            {(() => {
                                                const event = ledgerEvents.find(e => e.role === 'Distributor Verification');
                                                return (
                                                    <div className="relative pb-8">
                                                        <div className={`absolute -left-[2.1rem] w-10 h-10 rounded-full flex items-center justify-center border-4 border-slate-900 z-10 ${event ? 'bg-emerald-500 text-slate-900' : 'bg-slate-800 text-slate-500'}`}>
                                                            <Truck className="w-5 h-5" />
                                                        </div>
                                                        <div>
                                                            <h4 className={`text-lg font-bold ${event ? 'text-emerald-400' : 'text-white/30'}`}>Logistics Verified</h4>
                                                            {event ? (
                                                                <>
                                                                    <p className="text-sm text-white/80 mt-1">{event.actor_email || 'Distributor'}</p>
                                                                    <p className="text-xs text-white/40 mt-1 flex items-center gap-1"><Activity className="w-3 h-3" /> {new Date(event.created_at).toLocaleString()}</p>
                                                                </>
                                                            ) : (
                                                                <p className="text-sm text-white/30 mt-1">Pending scan</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })()}

                                            {/* Retailer Node */}
                                            {(() => {
                                                const event = ledgerEvents.find(e => e.role === 'Retailer Verification');
                                                return (
                                                    <div className="relative">
                                                        <div className={`absolute -left-[2.1rem] w-10 h-10 rounded-full flex items-center justify-center border-4 border-slate-900 z-10 ${event ? 'bg-emerald-500 text-slate-900' : 'bg-slate-800 text-slate-500'}`}>
                                                            <Store className="w-5 h-5" />
                                                        </div>
                                                        <div>
                                                            <h4 className={`text-lg font-bold ${event ? 'text-emerald-400' : 'text-white/s30'}`}>Pharmacy Arrival</h4>
                                                            {event ? (
                                                                <>
                                                                    <p className="text-sm text-white/80 mt-1">{event.actor_email || 'Retailer'}</p>
                                                                    <p className="text-xs text-white/40 mt-1 flex items-center gap-1"><MapPin className="w-3 h-3" /> {new Date(event.created_at).toLocaleString()}</p>
                                                                </>
                                                            ) : (
                                                                <p className="text-sm text-white/30 mt-1">Pending arrival</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })()}
                                        </>
                                    )}
                                </div>
                            </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Professional Reporting Modal */}
                <AnimatePresence>
                    {showFeedbackModal && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md"
                        >
                            <motion.div
                                initial={{ scale: 0.9, y: 20 }}
                                animate={{ scale: 1, y: 0 }}
                                exit={{ scale: 0.9, y: 20 }}
                                className="bg-slate-900 border border-white/10 p-8 rounded-[2rem] w-full max-w-lg shadow-[0_0_100px_rgba(0,0,0,0.5)] relative overflow-hidden"
                            >
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-rose-500 via-amber-500 to-rose-500" />
                                
                                <button onClick={() => setShowFeedbackModal(false)} className="absolute top-6 right-6 text-white/30 hover:text-white transition-colors">
                                    <Activity className="w-6 h-6 rotate-45" />
                                </button>

                                <div className="mb-8">
                                    <h3 className="text-3xl font-black text-white mb-2 flex items-center gap-3">
                                        <Flag className="text-rose-500 w-8 h-8" /> Report Issue
                                    </h3>
                                    <p className="text-white/50 text-sm">
                                        Your report will be routed to the appropriate node authority for immediate investigation.
                                    </p>
                                </div>

                                {reportSuccess ? (
                                    <motion.div 
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="py-12 text-center"
                                    >
                                        <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                                            <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                                        </div>
                                        <p className="text-emerald-400 font-bold">{reportSuccess}</p>
                                    </motion.div>
                                ) : (
                                    <div className="space-y-6">
                                        <div>
                                            <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2 block ml-1">Issue Category</label>
                                            <select 
                                                value={reportIssueType}
                                                onChange={(e) => setReportIssueType(e.target.value)}
                                                className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-white focus:border-rose-500/50 transition-all outline-none appearance-none"
                                            >
                                                <option value="fake" className="bg-slate-900">Fake/Counterfeit Medicine</option>
                                                <option value="supply" className="bg-slate-900">Supply Chain / Logistic Error</option>
                                                <option value="tampering" className="bg-slate-900">Tampering / Damaged Seal</option>
                                                <option value="other" className="bg-slate-900">Other Discrepancy</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2 block ml-1">Detailed Description</label>
                                            <textarea
                                                value={reportDescription}
                                                onChange={(e) => setReportDescription(e.target.value)}
                                                className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-white placeholder-white/20 h-32 focus:border-rose-500/50 transition-all outline-none resize-none"
                                                placeholder="Please explain the issue... include location, date, and specific observations."
                                            ></textarea>
                                        </div>

                                        <button
                                            onClick={handleReportSubmit}
                                            disabled={isReporting || !reportDescription}
                                            className={`w-full font-black py-4 rounded-xl transition-all flex items-center justify-center gap-2 ${
                                                isReporting || !reportDescription 
                                                ? 'bg-rose-500/10 text-rose-500/30' 
                                                : 'bg-rose-500 text-white hover:bg-rose-600 shadow-[0_0_30px_rgba(244,63,94,0.3)]'
                                            }`}
                                        >
                                            {isReporting ? (
                                                <>
                                                    <Activity className="w-5 h-5 animate-spin" /> Routing to Node Authority...
                                                </>
                                            ) : (
                                                <>
                                                    <Flag className="w-5 h-5" /> Submit Official Report
                                                </>
                                            )}
                                        </button>
                                        
                                        <p className="text-[10px] text-center text-white/30 italic">
                                            This report will be cryptographically linked to batch ${scanInput}.
                                        </p>
                                    </div>
                                )}
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

            </div>

            <AnimatePresence>
                {isScanning && (
                    <QRScanner
                        onClose={() => setIsScanning(false)}
                        onScanSuccess={(decodedText) => {
                            setIsScanning(false);
                            try {
                                const url = new URL(decodedText);
                                const batch = url.searchParams.get('batch');
                                const token = url.searchParams.get('token');

                                if (batch) {
                                    setScanInput(batch);
                                    setResultStatus(null); // Show form
                                    setQuestions({
                                        batchCorrect: '',
                                        sealIntact: '',
                                        expiryLegible: ''
                                    });
                                } else {
                                    alert('Invalid QR formulation. No batch found.');
                                }
                            } catch (e) {
                                alert('Invalid QR: Standard URL structure mismatch.');
                            }
                        }}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}
