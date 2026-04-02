import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, QrCode, Search, ShieldCheck, ShieldAlert, AlertOctagon, Activity, CheckCircle2, MapPin, Factory, Truck, Store, Flag } from 'lucide-react';
import { Canvas } from '@react-three/fiber';
import FloatingMedicine3D from './FloatingMedicine3D';
import { supabase } from '../../lib/supabase';
import QRScanner from '../QRScanner';

type Status = 'verified' | 'pending' | 'suspicious' | null;

interface CustomerDashboardProps {
    onScanVerify?: (batch: string, token: string) => void;
    userEmail?: string;
}

export default function CustomerDashboard({ onScanVerify, userEmail }: CustomerDashboardProps) {
    const [scanInput, setScanInput] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [isScanning, setIsScanning] = useState(false);
    const [resultStatus, setResultStatus] = useState<Status>(null);
    const [showFeedbackModal, setShowFeedbackModal] = useState(false);
    const [medicineData, setMedicineData] = useState<any>(null);
    const [ledgerEvents, setLedgerEvents] = useState<any[]>([]);

    // Integrity Questionnaire
    const [questions, setQuestions] = useState({
        batchCorrect: '',
        sealIntact: '',
        expiryLegible: ''
    });

    const handleSearch = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!scanInput) return;

        setIsSearching(true);
        setResultStatus(null);
        setMedicineData(null);
        setLedgerEvents([]);

        try {
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
                    title: 'Verification Failed – Possible counterfeit product',
                    desc: 'This batch number does not exist on the MedChain ledger or has been flagged as compromised.',
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

                {/* Search Bar */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="w-full max-w-2xl mb-8 z-20"
                >
                    <form onSubmit={(e) => e.preventDefault()} className="relative group">
                        <div className={`absolute -inset-1 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200 ${isSearching ? 'bg-emerald-400 animate-pulse' : 'bg-white/20'}`}></div>
                        <div className="relative flex items-center bg-slate-950/80 backdrop-blur-xl border border-white/10 rounded-2xl p-2 shadow-2xl">
                            <button
                                type="button"
                                onClick={() => setIsScanning(true)}
                                className="p-4 text-white/50 hover:text-white transition-colors"
                            >
                                <QrCode className="w-6 h-6" />
                            </button>
                            <input
                                type="text"
                                value={scanInput}
                                onChange={(e) => {
                                    setScanInput(e.target.value);
                                    setResultStatus(null); // Reset on type
                                }}
                                placeholder="Enter Batch Number (e.g., AX-792)"
                                className="flex-grow bg-transparent text-white text-lg placeholder-white/30 px-2 focus:outline-none"
                            />
                            <div className="p-4 text-emerald-400">
                                <Search className="w-6 h-6" />
                            </div>
                        </div>
                    </form>
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
                                disabled={isSearching}
                                className={`w-full relative overflow-hidden rounded-xl font-bold py-4 mt-6 transition-all ${isSearching ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-500 text-white hover:shadow-[0_0_20px_rgba(52,211,153,0.5)]'}`}
                            >
                                {isSearching ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <Activity className="w-5 h-5 animate-spin" /> Verifying...
                                    </span>
                                ) : (
                                    <span className="flex items-center justify-center gap-2">
                                        Verify Product
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
                            className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-2 gap-6"
                        >
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

                                {/* Report Button for Suspicious or Missing Data */}
                                {(resultStatus === 'suspicious' || resultStatus === 'pending') && (
                                    <button
                                        onClick={() => setShowFeedbackModal(true)}
                                        className="w-full mt-6 py-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 font-bold hover:bg-rose-500/20 transition-colors flex items-center justify-center gap-2"
                                    >
                                        <Flag className="w-5 h-5" /> Report Suspicious Medicine
                                    </button>
                                )}
                            </div>

                            {/* Timeline Card */}
                            <div className="glassmorphism p-8 rounded-3xl flex flex-col relative overflow-hidden">
                                <h3 className="text-xl font-bold text-white mb-8 border-b border-white/10 pb-4">Immutable Journey</h3>

                                <div className="relative flex-grow flex flex-col justify-between pl-8">
                                    {/* Vertical Line */}
                                    <div className={`absolute top-4 bottom-4 left-[1.15rem] w-0.5 ${resultStatus === 'suspicious' ? 'bg-rose-500/20' : 'bg-emerald-500/20'}`} />

                                    {/* Manufacturer Node */}
                                    {(() => {
                                        const event = ledgerEvents.find(e => e.role === 'Producer Initialization');
                                        return (
                                            <div className="relative pb-8">
                                                <div className={`absolute -left-[2.1rem] w-10 h-10 rounded-full flex items-center justify-center border-4 border-slate-900 z-10 ${resultStatus === 'suspicious' ? 'bg-rose-500/20 text-rose-500' : 'bg-emerald-500 text-slate-900 shadow-[0_0_15px_rgba(52,211,153,0.5)]'}`}>
                                                    {resultStatus === 'suspicious' ? <AlertOctagon className="w-4 h-4" /> : <Factory className="w-5 h-5" />}
                                                </div>
                                                <div>
                                                    <h4 className={`text-lg font-bold ${resultStatus === 'suspicious' ? 'text-white/50' : 'text-emerald-400'}`}>Producer Check</h4>
                                                    {event ? (
                                                        <>
                                                            <p className="text-sm text-white/80 mt-1">{event.actor_email || 'Producer'}</p>
                                                            <p className="text-xs text-white/40 mt-1 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> {new Date(event.created_at).toLocaleString()}</p>
                                                        </>
                                                    ) : (
                                                        <p className="text-sm text-white/30 mt-1">{resultStatus === 'suspicious' ? 'Validation Failed' : 'Pending record'}</p>
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
                                                    <h4 className={`text-lg font-bold ${event ? 'text-emerald-400' : 'text-white/30'}`}>Pharmacy Arrival</h4>
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

                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Feedback Modal Stub */}
                <AnimatePresence>
                    {showFeedbackModal && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
                        >
                            <motion.div
                                initial={{ scale: 0.9, y: 20 }}
                                animate={{ scale: 1, y: 0 }}
                                exit={{ scale: 0.9, y: 20 }}
                                className="bg-slate-900 border border-white/10 p-8 rounded-3xl w-full max-w-md relative"
                            >
                                <button onClick={() => setShowFeedbackModal(false)} className="absolute top-4 right-4 text-white/50 hover:text-white">✕</button>
                                <h3 className="text-2xl font-bold text-white mb-4 flex items-center gap-2"><Flag className="text-rose-400" /> Report Issue</h3>
                                <p className="text-white/60 mb-6">Please provide details about where you purchased this unverified medicine so we can investigate.</p>

                                <textarea
                                    className="w-full bg-black/50 border border-white/10 rounded-xl p-4 text-white placeholder-white/30 h-32 mb-6"
                                    placeholder="Store name, location, and other details..."
                                ></textarea>

                                <button
                                    onClick={() => setShowFeedbackModal(false)}
                                    className="w-full bg-rose-500 text-white font-bold py-3 rounded-xl hover:bg-rose-400 transition-colors"
                                >
                                    Submit Report securely
                                </button>
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
