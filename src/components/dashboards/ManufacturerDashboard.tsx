import { useState } from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Hash, QrCode, UploadCloud, CheckCircle2, Package, Activity } from 'lucide-react';
import { Canvas } from '@react-three/fiber';
import { QRCodeSVG } from 'qrcode.react';
import FloatingMedicine3D from './FloatingMedicine3D';
import { supabase } from '../../lib/supabase';
import SeasonalDemandFull from './SeasonalDemandFull';

// Helper to generate a random 8-character hex token
const generateToken = () => {
    return Math.random().toString(16).substring(2, 10).toUpperCase();
};

export default function ManufacturerDashboard({ userEmail }: { userEmail?: string }) {
    const [isGenerated, setIsGenerated] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        composition: '',
        batch: '',
        mfgDate: '',
        expDate: ''
    });

    const [isGenerating, setIsGenerating] = useState(false);
    const [qrUrl, setQrUrl] = useState('');

    const handleGenerate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (Object.values(formData).some(val => !val)) return;
        
        setIsGenerating(true);

        try {
            const token = generateToken();
            const BASE_URL = import.meta.env.VITE_BASE_URL || window.location.origin;
            const verificationUrl = `${BASE_URL}/verify?batch=${formData.batch}&token=${token}`;

            // 1. Insert medicine record
            const { data: medicine, error: medError } = await supabase
                .from('medicines')
                .insert([{
                    name: formData.name,
                    batch_no: formData.batch,
                    mfg_date: formData.mfgDate,
                    expiry_date: formData.expDate,
                    composition: formData.composition,
                    status: 'created',
                    qr_token: token
                }])
                .select()
                .single();

            if (medError) {
                if (medError.code === '23505') { // Postgres code for unique violation
                    alert('Error: Batch number "' + formData.batch + '" already exists on the MedChain ledger. Please use a unique batch number.');
                    setIsGenerating(false);
                    return;
                }
                throw medError;
            }

            // 2. Insert initial ledger event
            const { error: eventError } = await supabase
                .from('ledger_events')
                .insert([{
                    medicine_id: medicine.id,
                    role: 'Producer Initialization',
                    status: 'verified',
                    details: {
                        'Medicine Name': formData.name,
                        'Composition': formData.composition,
                        'Mfg Date': formData.mfgDate,
                        'Expiry Date': formData.expDate,
                        'Batch No': formData.batch,
                    },
                    actor_email: userEmail || 'ops@medorapharma.com', 
                    actor_phone: '+1-555-0192'
                }]);

            if (eventError) throw eventError;

            setQrUrl(verificationUrl);
            setIsGenerated(true);
        } catch (error) {
            console.error('Error generating blockchain record:', error);
            alert('Failed to register batch. Please check console for details.');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleDownloadQR = () => {
        const svg = document.getElementById("batch-qr-code");
        if (!svg) return;
        
        const svgData = new XMLSerializer().serializeToString(svg);
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        const img = new Image();
        img.onload = () => {
            canvas.width = img.width;
            canvas.height = img.height;
            if (ctx) {
                ctx.fillStyle = "white"; // Background
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(img, 0, 0);
            }
            const pngFile = canvas.toDataURL("image/png");
            const downloadLink = document.createElement("a");
            downloadLink.download = `QR_${formData.batch}.png`;
            downloadLink.href = `${pngFile}`;
            downloadLink.click();
        };
        img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
    };

    return (
        <div className="relative w-full min-h-screen bg-background text-foreground overflow-hidden pt-24 pb-12 px-4 sm:px-6 lg:px-8">
            {/* 3D Background */}
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
                        className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-400/10 border border-cyan-400/30 text-cyan-400 text-sm font-semibold mb-4"
                    >
                        <ShieldCheck className="w-4 h-4" />
                        MANUFACTURER NODE
                    </motion.div>
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-4xl md:text-5xl font-black text-white"
                    >
                        Register Medicine Batch
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="mt-4 text-white/60 max-w-2xl"
                    >
                        Create immutable records on the blockchain for new pharmaceutical production batches.
                    </motion.p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Form */}
                    <motion.div
                        initial={{ opacity: 0, x: -30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 }}
                        className="lg:col-span-2 glassmorphism-dark p-8 rounded-3xl"
                    >
                        <form onSubmit={handleGenerate} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2 group">
                                    <label className="text-xs font-bold text-white/70 uppercase">Medicine Name</label>
                                    <input type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full bg-black/50 border border-white/10 rounded-xl py-3 px-4 text-white focus:border-cyan-400/50 focus:ring-1 focus:ring-cyan-400/50 transition-all font-medium" placeholder="e.g. Vax-Pro-2" required />
                                </div>
                                <div className="space-y-2 group">
                                    <label className="text-xs font-bold text-white/70 uppercase">Composition</label>
                                    <input type="text" value={formData.composition} onChange={e => setFormData({ ...formData, composition: e.target.value })} className="w-full bg-black/50 border border-white/10 rounded-xl py-3 px-4 text-white focus:border-cyan-400/50 focus:ring-1 focus:ring-cyan-400/50 transition-all font-medium" placeholder="Active ingredients" required />
                                </div>
                                <div className="space-y-2 group">
                                    <label className="text-xs font-bold text-white/70 uppercase">Batch Number</label>
                                    <input type="text" value={formData.batch} onChange={e => setFormData({ ...formData, batch: e.target.value })} className="w-full bg-black/50 border border-white/10 rounded-xl py-3 px-4 text-white focus:border-cyan-400/50 focus:ring-1 focus:ring-cyan-400/50 transition-all font-medium" placeholder="e.g. AX-792" required />
                                </div>
                                <div className="space-y-2 group">
                                    <label className="text-xs font-bold text-white/70 uppercase">Medicine Image</label>
                                    <div className="relative overflow-hidden w-full bg-black/50 border border-white/10 border-dashed rounded-xl py-3 px-4 text-white hover:border-cyan-400/50 transition-all cursor-pointer flex items-center justify-center gap-2">
                                        <UploadCloud className="w-5 h-5 text-white/50" />
                                        <span className="text-sm text-white/50 font-medium">Upload Image</span>
                                        <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" />
                                    </div>
                                </div>
                                <div className="space-y-2 group">
                                    <label className="text-xs font-bold text-white/70 uppercase">Mfg Date</label>
                                    <input type="date" value={formData.mfgDate} onChange={e => setFormData({ ...formData, mfgDate: e.target.value })} className="w-full bg-black/50 border border-white/10 rounded-xl py-3 px-4 text-white focus:border-cyan-400/50 focus:ring-1 focus:ring-cyan-400/50 transition-all font-medium [color-scheme:dark]" required />
                                </div>
                                <div className="space-y-2 group">
                                    <label className="text-xs font-bold text-white/70 uppercase">Expiry Date</label>
                                    <input type="date" value={formData.expDate} onChange={e => setFormData({ ...formData, expDate: e.target.value })} className="w-full bg-black/50 border border-white/10 rounded-xl py-3 px-4 text-white focus:border-cyan-400/50 focus:ring-1 focus:ring-cyan-400/50 transition-all font-medium [color-scheme:dark]" required />
                                </div>
                            </div>

                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                type="submit"
                                disabled={isGenerated || isGenerating}
                                className={`w-full relative overflow-hidden rounded-xl font-bold py-4 mt-6 transition-all ${isGenerated ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 cursor-default' : 'bg-cyan-400 text-black hover:shadow-[0_0_30px_rgba(6,182,212,0.5)]'}`}
                            >
                                {isGenerating ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                                        Syncing with Ledger...
                                    </span>
                                ) : isGenerated ? (
                                    <span className="flex items-center justify-center gap-2"><CheckCircle2 className="w-5 h-5" /> Batch Registered on Blockchain</span>
                                ) : (
                                    <span className="flex items-center justify-center gap-2"><Hash className="w-5 h-5" /> Generate Blockchain Hash</span>
                                )}
                            </motion.button>
                        </form>
                    </motion.div>

                    {/* Right Panel - Status & QR */}
                    <motion.div
                        initial={{ opacity: 0, x: 30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4 }}
                        className="space-y-6"
                    >
                        {/* QR Code Card */}
                        <div className="glassmorphism-dark p-6 rounded-3xl flex flex-col items-center justify-center text-center relative overflow-hidden group">
                            <div className={`absolute inset-0 bg-cyan-400/5 transition-opacity duration-500 ${isGenerated ? 'opacity-100' : 'opacity-0'}`} />

                            <h3 className="text-lg font-bold text-white mb-6 relative z-10 w-full flex justify-between items-center">
                                <span>Batch QR</span>
                                <QrCode className="w-5 h-5 text-cyan-400" />
                            </h3>

                            <div className={`w-40 h-40 bg-white rounded-xl flex items-center justify-center mb-6 relative z-10 transition-all duration-700 ${isGenerated ? 'scale-100 opacity-100' : 'scale-90 opacity-10 filter blur-sm'}`}>
                                {isGenerated && qrUrl ? (
                                    <QRCodeSVG 
                                        id="batch-qr-code"
                                        value={qrUrl} 
                                        size={140} 
                                        level="H" 
                                        includeMargin={false} 
                                    />
                                ) : (
                                    <QrCode className="w-16 h-16 text-black/20" />
                                )}
                            </div>

                            {isGenerated && qrUrl && (
                                <p className="text-[10px] text-white/40 mb-4 px-2 max-w-full break-all font-mono relative z-10">
                                    {qrUrl}
                                </p>
                            )}

                            <button onClick={handleDownloadQR} disabled={!isGenerated} className={`relative z-10 px-6 py-2 rounded-full font-semibold transition-all ${isGenerated ? 'bg-white/10 text-white hover:bg-white/20 border border-white/20 hover:scale-105' : 'bg-white/5 text-white/30 cursor-not-allowed'}`}>
                                Download QR PNG
                            </button>
                            
                            {isGenerated && (
                                <button 
                                    onClick={() => {
                                        navigator.clipboard.writeText(qrUrl);
                                        alert("Verification Link copied!");
                                    }} 
                                    className="mt-4 relative z-10 px-4 py-1.5 text-xs rounded-full font-medium transition-all bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 border border-cyan-500/20"
                                >
                                    Copy Verification Link
                                </button>
                            )}
                        </div>

                        {/* Batch Status Panel */}
                        <div className="glassmorphism p-6 rounded-3xl relative overflow-hidden">
                            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                <Activity className="w-5 h-5 text-cyan-400" />
                                Traceability Status
                            </h3>

                            <div className="space-y-4">
                                <div className="flex items-center gap-4 border-b border-white/10 pb-4">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isGenerated ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 box-shadow-[0_0_15px_rgba(16,185,129,0.3)]' : 'bg-white/5 text-white/30'}`}>
                                        <Package className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className={`font-semibold ${isGenerated ? 'text-white' : 'text-white/50'}`}>Production</p>
                                        <p className="text-xs text-white/40">{isGenerated ? 'Verified ' + new Date().toLocaleDateString() : 'Awaiting registration'}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 border-b border-white/10 pb-4 opacity-50">
                                    <div className="w-10 h-10 rounded-full bg-white/5 text-white/30 flex items-center justify-center border border-white/10">
                                        <ShieldCheck className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-white/50">Distributor</p>
                                        <p className="text-xs text-white/40">Pending handover</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 opacity-50">
                                    <div className="w-10 h-10 rounded-full bg-white/5 text-white/30 flex items-center justify-center border border-white/10">
                                        <ShieldCheck className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-white/50">Retailer</p>
                                        <p className="text-xs text-white/40">Pending arrival</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
                
                {/* AI Seasonal Demand Insights Section */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                >
                    <SeasonalDemandFull />
                </motion.div>
            </div>
        </div>
    );
}
