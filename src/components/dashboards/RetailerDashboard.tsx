import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Store, QrCode, AlertTriangle, CheckCircle2, PackageSearch, HardDrive, ShieldCheck } from 'lucide-react';
import { Canvas } from '@react-three/fiber';
import FloatingMedicine3D from './FloatingMedicine3D';
import { supabase } from '../../lib/supabase';
import QRScanner from '../QRScanner';

interface RetailerDashboardProps {
    onScanVerify?: (batch: string, token: string) => void;
}

export default function RetailerDashboard({ onScanVerify }: RetailerDashboardProps) {
    const [scanResult, setScanResult] = useState('');
    const [stockAmount, setStockAmount] = useState('');
    const [isVerifying, setIsVerifying] = useState(false);
    const [isVerified, setIsVerified] = useState(false);
    const [showWarning, setShowWarning] = useState(false);
    const [isScanning, setIsScanning] = useState(false);

    const [questions, setQuestions] = useState({
        batchCorrect: false,
        expiryMatching: false,
        compositionCorrect: false
    });

    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!scanResult || !stockAmount || !questions.batchCorrect || !questions.expiryMatching || !questions.compositionCorrect) return;

        setIsVerifying(true);
        // Simulate expiring soon warning for a specific dummy batch
        const willWarn = scanResult.includes('OLD') || scanResult.includes('EXP');

        try {
            // Find medicine
            const { data: medicine, error: findError } = await supabase
                .from('medicines')
                .select('id')
                .eq('batch_no', scanResult)
                .single();

            if (findError) throw new Error('Batch not found');

            // Insert ledger event
            const { error: eventError } = await supabase
                .from('ledger_events')
                .insert([{
                    medicine_id: medicine.id,
                    role: 'Retailer Verification',
                    status: 'verified',
                    details: {
                        'Expiry Match': questions.expiryMatching ? 'True' : 'False',
                        'ID Match': questions.batchCorrect ? 'True' : 'False',
                        'Product Sealed': questions.compositionCorrect ? 'True' : 'False',
                        'Stock Received': stockAmount
                    },
                    actor_email: 'rx@citypharmacy.local',
                    actor_phone: '+1-555-4429'
                }]);

            if (eventError) throw eventError;

            // Update medicine status
            await supabase.from('medicines').update({ status: 'in_stock' }).eq('id', medicine.id);

            setIsVerified(true);
            if (willWarn) setShowWarning(true);
        } catch (error) {
            console.error('Error reporting intake:', error);
            alert('Failed to report. Batch may not exist or network connection issue.');
        } finally {
            setIsVerifying(false);
        }
    };

    const allQuestionsChecked = questions.batchCorrect && questions.expiryMatching && questions.compositionCorrect;

    return (
        <div className="relative w-full min-h-screen bg-background text-foreground overflow-hidden pt-24 pb-12 px-4 sm:px-6 lg:px-8">
            <div className="absolute inset-0 z-0 opacity-40">
                <Canvas camera={{ position: [0, 0, 8], fov: 50 }}>
                    <FloatingMedicine3D />
                </Canvas>
            </div>

            <div className="relative z-10 max-w-7xl mx-auto">
                <div className="mb-10 text-center md:text-left">
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-400/10 border border-blue-400/30 text-blue-400 text-sm font-semibold mb-4"
                    >
                        <Store className="w-4 h-4" />
                        RETAILER NODE
                    </motion.div>
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-4xl md:text-5xl font-black text-white"
                    >
                        Inventory Intake
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="mt-4 text-white/60 max-w-2xl"
                    >
                        Final supply chain verification point. Validate authenticity before making inventory available to customers.
                    </motion.p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Main Verification Form */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.3 }}
                        className="glassmorphism-dark p-8 rounded-3xl flex flex-col h-full relative"
                    >
                        {/* Warning Overlay */}
                        <AnimatePresence>
                            {showWarning && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    className="absolute top-4 left-4 right-4 bg-orange-500/20 border border-orange-500/50 backdrop-blur-md p-4 rounded-2xl z-20 flex items-start gap-4"
                                >
                                    <AlertTriangle className="w-6 h-6 text-orange-400 flex-shrink-0 mt-1" />
                                    <div>
                                        <h4 className="font-bold text-orange-400">Near Expiry Warning</h4>
                                        <p className="text-sm text-orange-200/80 mt-1">This batch expires in less than 30 days. Stock has been flagged in your inventory system.</p>
                                    </div>
                                    <button onClick={() => setShowWarning(false)} className="ml-auto text-orange-400 hover:text-orange-300">×</button>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <h3 className="text-xl font-bold text-white mb-6 border-b border-white/10 pb-4 flex items-center gap-2">
                            <PackageSearch className="w-5 h-5 text-blue-400" />
                            Intake Scan
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                            <div>
                                <label className="text-xs font-bold text-white/70 uppercase mb-2 block">Batch QR Code</label>
                                <div className="relative flex items-center">
                                    <input
                                        type="text"
                                        value={scanResult}
                                        onChange={(e) => setScanResult(e.target.value)}
                                        placeholder="Scan QR..."
                                        className="w-full bg-black/50 border border-white/10 rounded-xl py-4 pl-4 pr-12 text-white placeholder-white/30 focus:border-blue-400/50 focus:ring-1 focus:ring-blue-400/50 transition-all font-medium"
                                    />
                                    <button 
                                        type="button"
                                        onClick={() => setIsScanning(true)} 
                                        className="absolute right-3 p-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/40 transition-colors"
                                    >
                                        <QrCode className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-white/70 uppercase mb-2 block">Stock Received (Units)</label>
                                <input
                                    type="number"
                                    value={stockAmount}
                                    onChange={(e) => setStockAmount(e.target.value)}
                                    placeholder="e.g. 500"
                                    className="w-full bg-black/50 border border-white/10 rounded-xl py-4 px-4 text-white placeholder-white/30 focus:border-blue-400/50 focus:ring-1 focus:ring-blue-400/50 transition-all font-medium"
                                />
                            </div>
                        </div>

                        <form onSubmit={handleVerify} className="space-y-6 flex-grow flex flex-col justify-between">
                            <div className="space-y-4">
                                <p className="text-sm font-semibold text-white/80 uppercase tracking-wider mb-4">Integrity Questionnaire</p>
                                {[
                                    { id: 'batchCorrect', label: 'Does physical batch match the recorded smart contract?' },
                                    { id: 'expiryMatching', label: 'Is the expiry date legible and un-tampered?' },
                                    { id: 'compositionCorrect', label: 'Are the package seals 100% intact?' }
                                ].map((q) => (
                                    <label key={q.id} className={`flex items-start gap-4 p-4 rounded-xl border cursor-pointer transition-all ${questions[q.id as keyof typeof questions] ? 'bg-blue-500/10 border-blue-500/50' : 'bg-black/30 border-white/5 hover:border-white/20'}`}>
                                        <div className="mt-0.5">
                                            <input
                                                type="checkbox"
                                                checked={questions[q.id as keyof typeof questions]}
                                                onChange={(e) => setQuestions({ ...questions, [q.id]: e.target.checked })}
                                                className="w-5 h-5 rounded border-white/20 text-blue-500 focus:ring-blue-500 focus:ring-offset-0 bg-black/50"
                                            />
                                        </div>
                                        <span className={`text-sm ${questions[q.id as keyof typeof questions] ? 'text-white' : 'text-white/70'}`}>{q.label}</span>
                                    </label>
                                ))}
                            </div>

                            <motion.button
                                whileHover={allQuestionsChecked && scanResult && stockAmount ? { scale: 1.02 } : {}}
                                whileTap={allQuestionsChecked && scanResult && stockAmount ? { scale: 0.98 } : {}}
                                disabled={!allQuestionsChecked || !scanResult || !stockAmount || isVerified || isVerifying}
                                type="submit"
                                className={`w-full relative overflow-hidden rounded-xl font-bold py-4 mt-8 transition-all ${isVerified ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50' : (allQuestionsChecked && scanResult && stockAmount ? 'bg-blue-500 text-white hover:shadow-[0_0_30px_rgba(59,130,246,0.5)]' : 'bg-white/5 text-white/30 cursor-not-allowed')}`}
                            >
                                {isVerifying ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Updating Ledger...
                                    </span>
                                ) : isVerified ? (
                                    <span className="flex items-center justify-center gap-2"><CheckCircle2 className="w-5 h-5" /> Added to Retail Inventory</span>
                                ) : (
                                    <span className="flex items-center justify-center gap-2"><HardDrive className="w-5 h-5" /> Confirm Intake & Stock</span>
                                )}
                            </motion.button>
                        </form>
                    </motion.div>

                    {/* Right Panel - Active Inventory */}
                    <motion.div
                        initial={{ opacity: 0, x: 30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4 }}
                        className="glassmorphism p-6 rounded-3xl h-full flex flex-col"
                    >
                        <h4 className="text-xl font-bold text-white mb-6 border-b border-white/10 pb-4 flex items-center justify-between">
                            <span>Verified Inventory</span>
                            <span className="text-sm font-semibold py-1 px-3 bg-blue-500/20 text-blue-400 rounded-full border border-blue-500/30">Live DB</span>
                        </h4>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-grow content-start overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-blue-500/50">

                            {isVerified && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    className="bg-blue-500/10 border border-blue-500/30 p-4 rounded-2xl relative overflow-hidden group hover:border-blue-500/60 transition-colors"
                                >
                                    <div className="absolute top-0 right-0 p-2 opacity-50"><ShieldCheck className="w-10 h-10 text-blue-400" /></div>
                                    <h5 className="font-bold text-white truncate w-[80%]">Batch: {scanResult}</h5>
                                    <p className="text-xs text-blue-300 mb-3">Added Just Now</p>
                                    <div className="flex justify-between items-end">
                                        <p className="text-2xl font-black text-white">{stockAmount} <span className="text-sm font-medium text-white/50">units</span></p>
                                        <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,1)]"></div>
                                    </div>
                                </motion.div>
                            )}

                            {/* Removed hardcoded Mock DB data, just show verified or empty state for now */}
                            {allQuestionsChecked && !isVerified && (
                                <div className="col-span-1 sm:col-span-2 p-6 text-center text-white/40 border border-white/5 bg-black/20 rounded-2xl">
                                    No active verified stock fetched from block yet.
                                </div>
                            )}
                        </div>

                        <div className="mt-6 pt-4 border-t border-white/10 flex justify-between items-center px-2">
                            <span className="text-sm text-white/50">Ledger Auto-Synced</span>
                            <button className="text-sm font-semibold text-blue-400 hover:text-blue-300">View Full Ledger →</button>
                        </div>
                    </motion.div>
                </div>
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
                                
                                if (batch) {
                                    setScanResult(batch);
                                    setIsVerified(false);
                                    setQuestions({
                                        batchCorrect: false,
                                        expiryMatching: false,
                                        compositionCorrect: false
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
