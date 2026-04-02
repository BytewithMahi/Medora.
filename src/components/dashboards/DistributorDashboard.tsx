import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Truck, QrCode, MapPin, Clock, ListChecks, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { Canvas } from '@react-three/fiber';
import FloatingMedicine3D from './FloatingMedicine3D';
import { supabase } from '../../lib/supabase';
import QRScanner from '../QRScanner';

interface DistributorDashboardProps {
    onScanVerify?: (batch: string, token: string) => void;
    userEmail?: string;
}

export default function DistributorDashboard({ userEmail }: DistributorDashboardProps) {
    const [scanResult, setScanResult] = useState('');
    const [isVerifying, setIsVerifying] = useState(false);
    const [isVerified, setIsVerified] = useState(false);
    const [location, setLocation] = useState('Fetching location...');
    const [timestamp, setTimestamp] = useState('');
    const [isScanning, setIsScanning] = useState(false);

    const [questions, setQuestions] = useState({
        batchCorrect: '',
        expiryMatching: '',
        compositionCorrect: ''
    });

    useEffect(() => {
        // Mock fetching location
        setTimeout(() => setLocation('Distributor Hub - NY (Lat: 40.71, Long: -74.00)'), 1500);
        // Set timestamp
        setTimestamp(new Date().toLocaleString());
    }, []);

    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!scanResult) return;
        
        setIsVerifying(true);
        
        try {
            // Find medicine by batch_no
            const { error: findError } = await supabase
                .from('medicines')
                .select('id')
                .eq('batch_no', scanResult)
                .single();

            if (findError) throw new Error('Batch not found');

            const payload = {
                batchId: scanResult,
                role: 'Distributor Verification',
                answers: {
                    'Expiry Match': questions.expiryMatching === 'yes' ? 'True' : (questions.expiryMatching === 'no' ? 'False' : 'N/A'),
                    'ID Match': questions.batchCorrect === 'yes' ? 'True' : (questions.batchCorrect === 'no' ? 'False' : 'N/A'),
                    'Composition Check': questions.compositionCorrect === 'yes' ? 'True' : (questions.compositionCorrect === 'no' ? 'False' : 'N/A'),
                    'Cold Chain Intact': 'True', // From mock UI
                },
                location: { latitude: 40.71, longitude: -74.00 }, // Mock
                actorEmail: userEmail || 'logistics@globaldist.net',
                actorPhone: '+1-555-8831'
            };

            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
            const response = await fetch(`${API_URL}/api/verify-action`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const result = await response.json();

            if (!result.success) throw new Error(result.error || 'Verification failed');


            setIsVerified(true);
            setTimestamp(new Date().toLocaleString());
        } catch (error) {
            console.error('Error verifying shipment:', error);
            alert('Failed to verify shipment. Batch may not exist or network error.');
        } finally {
            setIsVerifying(false);
        }
    };

    const isFormValid = !!scanResult;

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
                        className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-400/10 border border-purple-400/30 text-purple-400 text-sm font-semibold mb-4"
                    >
                        <Truck className="w-4 h-4" />
                        DISTRIBUTOR NODE
                    </motion.div>
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-4xl md:text-5xl font-black text-white"
                    >
                        Logistics Verification
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="mt-4 text-white/60 max-w-2xl"
                    >
                        Scan inbound shipments and verify package integrity before distributing to retail nodes.
                    </motion.p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Main Verification Form */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.3 }}
                        className="glassmorphism-dark p-8 rounded-3xl flex flex-col h-full"
                    >
                        <h3 className="text-xl font-bold text-white mb-6 border-b border-white/10 pb-4 flex items-center gap-2">
                            <QrCode className="w-5 h-5 text-purple-400" />
                            Scan & Verify Shipment
                        </h3>

                        <div className="mb-8">
                            <label className="text-xs font-bold text-white/70 uppercase mb-2 block">Batch QR Code / Number</label>
                            <div className="relative flex items-center">
                                <input
                                    type="text"
                                    value={scanResult}
                                    onChange={(e) => setScanResult(e.target.value)}
                                    placeholder="Scan QR or enter batch manually"
                                    className="w-full bg-black/50 border border-white/10 rounded-xl py-4 pl-4 pr-12 text-white placeholder-white/30 focus:border-purple-400/50 focus:ring-1 focus:ring-purple-400/50 transition-all font-medium"
                                />
                                <button 
                                    type="button"
                                    onClick={() => setIsScanning(true)} 
                                    className="absolute right-3 p-2 bg-purple-500/20 text-purple-400 rounded-lg hover:bg-purple-500/40 transition-colors"
                                >
                                    <QrCode className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        <form onSubmit={handleVerify} className="space-y-6 flex-grow flex flex-col justify-between">
                            <div className="space-y-4">
                                <p className="text-sm font-semibold text-white/80 uppercase tracking-wider mb-4 flex items-center gap-2">
                                    <ListChecks className="w-4 h-4" /> Integrity Questionnaire
                                </p>
                                {[
                                    { id: 'batchCorrect', label: 'Is the physical batch number matching the digital record?' },
                                    { id: 'expiryMatching', label: 'Is the expiry date clearly printed and matching?' },
                                    { id: 'compositionCorrect', label: 'Are the storage temperature and composition stable?' }
                                ].map((q) => (
                                    <div key={q.id} className={`flex flex-col gap-3 p-4 rounded-xl border transition-all ${questions[q.id as keyof typeof questions] ? 'bg-purple-500/10 border-purple-500/50' : 'bg-black/30 border-white/5'}`}>
                                        <span className={`text-sm ${questions[q.id as keyof typeof questions] ? 'text-white' : 'text-white/70'}`}>{q.label}</span>
                                        <div className="flex gap-4">
                                            <label className="flex items-center gap-2 cursor-pointer text-sm text-white/80 hover:text-white">
                                                <input
                                                    type="radio"
                                                    name={q.id}
                                                    value="yes"
                                                    checked={questions[q.id as keyof typeof questions] === 'yes'}
                                                    onChange={(e) => setQuestions({ ...questions, [q.id]: e.target.value })}
                                                    className="w-4 h-4 text-purple-500 bg-black/50 border-white/20 focus:ring-purple-500 focus:ring-offset-0"
                                                /> Yes
                                            </label>
                                            <label className="flex items-center gap-2 cursor-pointer text-sm text-white/80 hover:text-white">
                                                <input
                                                    type="radio"
                                                    name={q.id}
                                                    value="no"
                                                    checked={questions[q.id as keyof typeof questions] === 'no'}
                                                    onChange={(e) => setQuestions({ ...questions, [q.id]: e.target.value })}
                                                    className="w-4 h-4 text-purple-500 bg-black/50 border-white/20 focus:ring-purple-500 focus:ring-offset-0"
                                                /> No
                                            </label>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <motion.button
                                whileHover={isFormValid ? { scale: 1.02 } : {}}
                                whileTap={isFormValid ? { scale: 0.98 } : {}}
                                disabled={!isFormValid || isVerified || isVerifying}
                                type="submit"
                                className={`w-full relative overflow-hidden rounded-xl font-bold py-4 mt-8 transition-all ${isVerified ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50' : (isFormValid ? 'bg-purple-500 text-white hover:shadow-[0_0_30px_rgba(168,85,247,0.5)]' : 'bg-white/5 text-white/30 cursor-not-allowed')}`}
                            >
                                {isVerifying ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Committing to Block...
                                    </span>
                                ) : isVerified ? (
                                    <span className="flex items-center justify-center gap-2"><CheckCircle2 className="w-5 h-5" /> Verification Block Mined</span>
                                ) : (
                                    <span className="flex items-center justify-center gap-2"><ShieldCheck className="w-5 h-5" /> Sign & Push Verification</span>
                                )}
                            </motion.button>
                        </form>
                    </motion.div>

                    {/* Right Panel - Info & History */}
                    <div className="flex flex-col gap-8 h-full">
                        {/* Context Data */}
                        <motion.div
                            initial={{ opacity: 0, x: 30 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.4 }}
                            className="glassmorphism p-6 rounded-3xl"
                        >
                            <h4 className="text-sm font-bold text-white/50 uppercase tracking-widest mb-6">Current Block Context</h4>
                            <div className="space-y-4">
                                <div className="flex items-center gap-4 bg-black/30 p-4 rounded-xl border border-white/5">
                                    <MapPin className="w-6 h-6 text-purple-400" />
                                    <div>
                                        <p className="text-xs text-white/50 uppercase">Active Geo-Node</p>
                                        <p className="text-sm font-semibold text-white">{location}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 bg-black/30 p-4 rounded-xl border border-white/5">
                                    <Clock className="w-6 h-6 text-purple-400" />
                                    <div>
                                        <p className="text-xs text-white/50 uppercase">Timestamp Signature</p>
                                        <p className="text-sm font-semibold text-white">{timestamp || 'Loading...'}</p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>

                        {/* History Table */}
                        <motion.div
                            initial={{ opacity: 0, x: 30 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.5 }}
                            className="glassmorphism p-6 rounded-3xl flex-grow overflow-hidden flex flex-col"
                        >
                            <h4 className="text-sm font-bold text-white/50 uppercase tracking-widest mb-4">Verification History</h4>

                            <div className="relative flex-grow min-h-[200px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-purple-500/50 scrollbar-track-transparent">
                                <div className="space-y-3">
                                    {isVerified && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="border-l-2 border-emerald-500 pl-4 py-2 bg-emerald-500/5 rounded-r-lg"
                                        >
                                            <p className="text-sm font-bold text-white flex justify-between">
                                                <span>Batch: {scanResult}</span>
                                                <span className="text-emerald-400 text-xs flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> VERIFIED</span>
                                            </p>
                                            <p className="text-xs text-white/50 mt-1">{timestamp} • {location.split(' ')[0]}</p>
                                        </motion.div>
                                    )}

                                    {[
                                        { batch: 'Vax-Pro-2 (AX-792)', time: 'Yesterday, 14:30', status: 'VERIFIED', color: 'text-emerald-400' },
                                        { batch: 'Bio-Gene-X (BX-102)', time: 'Mon, 09:15', status: 'VERIFIED', color: 'text-emerald-400' },
                                        { batch: 'Neuro-Synergy (NS-55)', time: 'Last Week', status: 'FLAGGED', color: 'text-rose-400' },
                                    ].map((item, i) => (
                                        <div key={i} className={`border-l-2 ${item.status === 'VERIFIED' ? 'border-purple-500/50' : 'border-rose-500/50'} pl-4 py-2 bg-black/20 rounded-r-lg`}>
                                            <p className="text-sm font-semibold text-white/80 flex justify-between">
                                                <span>{item.batch}</span>
                                                <span className={`${item.color} text-xs font-bold`}>{item.status}</span>
                                            </p>
                                            <p className="text-xs text-white/40 mt-1">{item.time}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    </div>
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
                                        batchCorrect: '',
                                        expiryMatching: '',
                                        compositionCorrect: ''
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
