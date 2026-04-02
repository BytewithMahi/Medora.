import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, ShieldAlert, AlertTriangle, CheckCircle, FileText, Activity } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface VerificationPageProps {
    batch: string;
    token: string;
    currentUserRole?: 'Distributor' | 'Retailer' | 'Customer' | 'Manufacturer' | 'Admin' | null;
    currentEmail?: string;
    onBack: () => void;
}

export default function VerificationPage({ batch, token, currentUserRole, currentEmail, onBack }: VerificationPageProps) {
    const [loading, setLoading] = useState(true);
    const [isValid, setIsValid] = useState<boolean | null>(null);
    const [medicine, setMedicine] = useState<any>(null);
    const [scanCount, setScanCount] = useState(0);
    const [errorMsg, setErrorMsg] = useState('');
    const [verifying, setVerifying] = useState(false);
    const [verifiedSuccess, setVerifiedSuccess] = useState(false);

    const [checklist, setChecklist] = useState<{
        batchMatch: 'Yes' | 'No' | null,
        expiryMatch: 'Yes' | 'No' | null,
        compositionMatch: 'Yes' | 'No' | null
    }>({
        batchMatch: null,
        expiryMatch: null,
        compositionMatch: null
    });
    const [location, setLocation] = useState<{latitude: number, longitude: number} | null>(null);

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

    useEffect(() => {
        validateQR();
        // Capture Location
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => setLocation({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
                (err) => console.warn("Location capture failed", err)
            );
        }
    }, [batch, token]);

    const validateQR = async () => {
        setLoading(true);
        try {
            // 1. Fetch medicine
            const { data: medData, error: medError } = await supabase
                .from('medicines')
                .select('*')
                .eq('batch_no', batch)
                .single();

            if (medError || !medData) {
                setIsValid(false);
                setErrorMsg("This batch number does not exist on the MedChain ledger.");
                return;
            }

            // 2. Validate token
            if (medData.qr_token !== token) {
                setIsValid(false);
                setErrorMsg("Security Token Invalid! Possible counterfeit QR printed.");
                return;
            }

            // Valid QR token
            setIsValid(true);
            setMedicine(medData);
            setScanCount(medData.scan_count || 0);

            // 3. Increment scan count
            await supabase
                .from('medicines')
                .update({ scan_count: (medData.scan_count || 0) + 1 })
                .eq('id', medData.id);

        } catch (err) {
            console.error(err);
            setIsValid(false);
            setErrorMsg("Network or validation error. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyAction = async () => {
        if (!medicine || !currentUserRole) return;
        if (currentUserRole !== 'Distributor' && currentUserRole !== 'Retailer' && currentUserRole !== 'Customer') return;

        setVerifying(true);
        try {
            const roleString = currentUserRole === 'Distributor' ? 'Distributor Verification' : 
                               currentUserRole === 'Retailer' ? 'Retailer Verification' : 
                               'Consumer Scan';

            const payload = {
                batchId: medicine.batch_no,
                role: roleString,
                answers: checklist,
                location: location,
                actorEmail: currentEmail,
                actorPhone: '+1-555-SCAN'
            };

            const response = await fetch(`${API_URL}/api/verify-action`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const result = await response.json();

            if (result.success) {
                setVerifiedSuccess(true);
            }

        } catch (error) {
            console.error('Error verifying batch:', error);
            alert('Failed to submit verification to chain.');
        } finally {
            setVerifying(false);
        }
    };

    const isChecklistComplete = checklist.batchMatch !== null && checklist.expiryMatch !== null && checklist.compositionMatch !== null;

    return (
        <div className="flex flex-col items-center justify-center -mt-8 py-8 px-4 max-w-2xl mx-auto min-h-screen">
            <AnimatePresence mode="wait">
                {loading ? (
                    <motion.div key="loading" className="flex flex-col items-center">
                        <div className="w-16 h-16 border-4 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin mb-4" />
                        <p className="text-white/60 font-medium">Verifying Node Integrity...</p>
                    </motion.div>
                ) : isValid === false ? (
                    <motion.div key="invalid" className="glassmorphism-dark p-8 rounded-3xl border border-rose-500/50 shadow-[0_0_30px_rgba(244,63,94,0.3)] text-center w-full">
                        <div className="w-20 h-20 bg-rose-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                            <ShieldAlert className="w-10 h-10 text-rose-500" />
                        </div>
                        <h2 className="text-2xl font-black text-rose-500 mb-2">Authenticity Violation!</h2>
                        <p className="text-white/70 mb-6">{errorMsg}</p>
                        <button onClick={onBack} className="px-6 py-2 bg-white/10 text-white rounded-full font-semibold border border-white/20 hover:bg-white/20">
                            Dismiss Alert
                        </button>
                    </motion.div>
                ) : medicine && (
                    <motion.div key="valid" className="w-full space-y-6">
                        {/* Scan Count Warning if > 20 */}
                        {scanCount > 20 && (
                            <motion.div className="bg-amber-500/10 border border-amber-500/30 p-4 rounded-2xl flex gap-3 text-amber-200">
                                <AlertTriangle className="w-6 h-6 shrink-0 text-amber-400" />
                                <div>
                                    <h4 className="font-bold text-sm">Suspicious Activity Detected</h4>
                                    <p className="text-xs text-amber-200/80">This QR code has been scanned {scanCount} times. Possible counterfeit or multiple duplicates in circulation.</p>
                                </div>
                            </motion.div>
                        )}

                        {/* Status Guard Card */}
                        {verifiedSuccess && (
                            <div className="glassmorphism-dark p-6 rounded-3xl border border-emerald-500/50 shadow-[0_0_30px_rgba(52,211,153,0.3)] text-center relative overflow-hidden">
                                <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <ShieldCheck className="w-8 h-8 text-emerald-400" />
                                </div>
                                <h2 className="text-xl font-black text-emerald-400 mb-1">Authentic Batch Confirmed</h2>
                                <p className="text-white/60 text-xs">Token: {token} verified against MedChain Node.</p>
                            </div>
                        )}

                        {/* Medicine Data */}
                        <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
                            <p className="text-xs font-bold text-white/50 uppercase tracking-widest mb-4 flex items-center gap-2">
                                <FileText className="w-4 h-4 text-cyan-400" /> Batch Specifications
                            </p>
                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between border-b border-white/5 pb-2">
                                    <span className="text-white/50">Medicine Name</span>
                                    <span className="text-white font-semibold">{medicine.name}</span>
                                </div>
                                <div className="flex justify-between border-b border-white/5 pb-2">
                                    <span className="text-white/50">Composition</span>
                                    <span className="text-white font-semibold">{medicine.composition || 'N/A'}</span>
                                </div>
                                <div className="flex justify-between border-b border-white/5 pb-2">
                                    <span className="text-white/50">Batch Number</span>
                                    <span className="text-cyan-400 font-mono font-bold">{medicine.batch_no}</span>
                                </div>
                                <div className="flex justify-between border-b border-white/5 pb-2">
                                    <span className="text-white/50">Current Status</span>
                                    <span className={`font-semibold px-2 py-0.5 rounded text-xs ${medicine.status === 'created' ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                                        {medicine.status === 'created' ? 'Pending' : 'Verified'}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-white/50">Expiry Date</span>
                                    <span className="text-rose-400 font-semibold">{medicine.expiry_date ? new Date(medicine.expiry_date).toLocaleDateString() : 'N/A'}</span>
                                </div>
                            </div>
                        </div>

                        {/* Verification checklist FOR Distributor, Retailer, or Customer */}
                        {(currentUserRole === 'Distributor' || currentUserRole === 'Retailer' || currentUserRole === 'Customer') && !verifiedSuccess && (
                            <div className="glassmorphism p-6 rounded-2xl space-y-4">
                                <p className="text-xs font-bold text-cyan-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                                    <Activity className="w-4 h-4" /> Integrity Verification checklist
                                </p>
                                {[
                                    { id: 'batchMatch', label: 'Match batch text printed on node with standard display?' },
                                    { id: 'expiryMatch', label: 'Verify optimal temperature chain and conditions?' },
                                    { id: 'compositionMatch', label: 'Confirm packaging seal is intact/unbroken?' }
                                ].map((q) => (
                                    <div key={q.id} className="p-4 rounded-xl border bg-black/30 border-white/5">
                                        <p className="text-sm text-white/90 mb-3">{q.label}</p>
                                        <div className="flex gap-4">
                                            <label className={`flex-1 flex justify-center items-center gap-2 p-2 rounded-lg border cursor-pointer transition-all ${checklist[q.id as keyof typeof checklist] === 'Yes' ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400' : 'bg-black/50 border-white/10 text-white/50 hover:bg-white/5'}`}>
                                                <input
                                                    type="radio"
                                                    name={q.id}
                                                    value="Yes"
                                                    checked={checklist[q.id as keyof typeof checklist] === 'Yes'}
                                                    onChange={() => setChecklist({ ...checklist, [q.id]: 'Yes' })}
                                                    className="hidden"
                                                />
                                                <span className="font-semibold text-sm">Yes</span>
                                            </label>
                                            <label className={`flex-1 flex justify-center items-center gap-2 p-2 rounded-lg border cursor-pointer transition-all ${checklist[q.id as keyof typeof checklist] === 'No' ? 'bg-rose-500/20 border-rose-500/50 text-rose-400' : 'bg-black/50 border-white/10 text-white/50 hover:bg-white/5'}`}>
                                                <input
                                                    type="radio"
                                                    name={q.id}
                                                    value="No"
                                                    checked={checklist[q.id as keyof typeof checklist] === 'No'}
                                                    onChange={() => setChecklist({ ...checklist, [q.id]: 'No' })}
                                                    className="hidden"
                                                />
                                                <span className="font-semibold text-sm">No</span>
                                            </label>
                                        </div>
                                    </div>
                                ))}

                                <motion.button
                                    onClick={handleVerifyAction}
                                    disabled={!isChecklistComplete || verifying}
                                    className={`w-full py-4 rounded-xl font-bold transition-all ${isChecklistComplete ? 'bg-cyan-500 text-black hover:shadow-[0_0_20px_rgba(6,182,212,0.4)]' : 'bg-white/5 text-white/30 cursor-not-allowed'}`}
                                >
                                    {verifying ? "Syncing to Ledger..." : currentUserRole === 'Customer' ? "Authenticate Package" : `Confirm & Push ${currentUserRole} Sign-off`}
                                </motion.button>
                            </div>
                        )}

                        {verifiedSuccess && (
                            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="p-6 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-center">
                                <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-2" />
                                <h3 className="text-lg font-bold text-emerald-400">Node Synchronization Success</h3>
                                <p className="text-xs text-white/60">Verification block added to immutable ledger.</p>
                            </motion.div>
                        )}

                        {/* Back button */}
                        <button onClick={onBack} className="w-full py-3 bg-white/5 text-white/70 rounded-xl hover:bg-white/10 font-semibold border border-white/10 transition-colors">
                            Return to Hub Terminal
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
