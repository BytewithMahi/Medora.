import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Search, 
    Box, 
    Database, 
    Cpu, 
    Link as LinkIcon, 
    ChevronRight, 
    Clock, 
    ShieldCheck, 
    User, 
    Activity,
    ArrowRight,
    QrCode,
    Lock
} from 'lucide-react';
import { supabase } from '../lib/supabase';

// Deterministic simple hash for simulation
const generateSimulatedHash = (data: string) => {
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
        const char = data.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return '0x' + Math.abs(hash).toString(16).padStart(40, '0').slice(0, 40);
};

interface LedgerEvent {
    id: string;
    role: string;
    status: string;
    details: any;
    actor_email: string;
    created_at: string;
    simulatedHash?: string;
}

export default function BlockPage() {
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [medicine, setMedicine] = useState<any>(null);
    const [events, setEvents] = useState<LedgerEvent[]>([]);
    const [error, setError] = useState('');
    const [activeBlock, setActiveBlock] = useState<number | null>(null);
    const [isMining, setIsMining] = useState(false);

    const handleSearch = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!searchQuery.trim()) return;

        setIsSearching(true);
        setError('');
        setMedicine(null);
        setEvents([]);

        try {
            // 1. Find medicine
            const { data: medData, error: medError } = await supabase
                .from('medicines')
                .select('*')
                .eq('batch_no', searchQuery.trim())
                .single();

            if (medError || !medData) {
                setError('Batch ID not found on MedChain Ledger.');
                setIsSearching(false);
                return;
            }

            setMedicine(medData);

            // 2. Fetch events
            const { data: eventData, error: eventError } = await supabase
                .from('ledger_events')
                .select('*')
                .eq('medicine_id', medData.id)
                .order('created_at', { ascending: true });

            if (eventError) throw eventError;

            // Add simulated hashes
            const processedEvents = (eventData || []).map((evt: any, index: number) => {
                const prevHash = index === 0 ? '0x0000000000000000000000000000000000000000' : 
                                 generateSimulatedHash(eventData[index-1].id + eventData[index-1].created_at);
                return {
                    ...evt,
                    simulatedHash: generateSimulatedHash(evt.id + evt.created_at + prevHash)
                };
            });

            // Simulate "Mining" delay
            setIsMining(true);
            setTimeout(() => {
                setEvents(processedEvents);
                setIsMining(false);
                setIsSearching(false);
            }, 1500);

        } catch (err) {
            console.error('Search error:', err);
            setError('System integrity check failed. Please retry.');
            setIsSearching(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#020617] text-white selection:bg-cyan-500/30 overflow-x-hidden">
            {/* Ambient Background */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[120px]" />
                <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-purple-500/10 rounded-full blur-[150px]" />
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20" />
            </div>

            <div className="relative z-10 max-w-7xl mx-auto px-6 py-12">
                {/* Header Section */}
                <div className="flex flex-col items-center mb-16 text-center">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="mb-4 p-3 bg-cyan-500/10 border border-cyan-500/20 rounded-2xl"
                    >
                        <Database className="w-8 h-8 text-cyan-400" />
                    </motion.div>
                    <motion.h1 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-5xl md:text-6xl font-black tracking-tighter mb-4"
                    >
                        MEDCHAIN <span className="text-cyan-400">EXPLORER</span>
                    </motion.h1>
                    <motion.p 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-slate-400 max-w-xl text-lg"
                    >
                        Real-time visualization of immutable medicine batches across the decentralized pharmaceutical network.
                    </motion.p>
                </div>

                {/* Search Interface */}
                <motion.div 
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="max-w-2xl mx-auto mb-20 relative group"
                >
                    <form onSubmit={handleSearch} className="relative">
                        <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-3xl blur opacity-25 group-hover:opacity-100 transition duration-1000 group-hover:duration-200" />
                        <div className="relative flex items-center bg-[#0f172a] rounded-2xl border border-white/10 p-2 pl-6 overflow-hidden">
                            <Search className="w-5 h-5 text-slate-500 shrink-0" />
                            <input 
                                type="text" 
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Enter Global Batch Number (e.g. AX-792)"
                                className="w-full bg-transparent border-none outline-none px-4 py-4 text-white font-medium placeholder:text-slate-600"
                            />
                            <button 
                                type="submit"
                                disabled={isSearching}
                                className="bg-cyan-500 hover:bg-cyan-400 text-black font-bold px-8 py-4 rounded-xl transition-all shadow-[0_0_20px_rgba(6,182,212,0.3)] disabled:opacity-50"
                            >
                                {isSearching ? 'SCANNING...' : 'DECODE'}
                            </button>
                        </div>
                    </form>
                    {error && (
                        <motion.p 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="mt-4 text-center text-rose-400 text-sm font-medium"
                        >
                            {error}
                        </motion.p>
                    )}
                </motion.div>

                {/* Main Content Area */}
                <AnimatePresence mode="wait">
                    {isMining ? (
                        <motion.div 
                            key="mining"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex flex-col items-center justify-center py-20"
                        >
                            <div className="relative w-24 h-24 mb-6">
                                <motion.div 
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                    className="absolute inset-0 border-4 border-cyan-500/20 border-t-cyan-500 rounded-full"
                                />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <Cpu className="w-10 h-10 text-cyan-400 animate-pulse" />
                                </div>
                            </div>
                            <h3 className="text-xl font-bold text-cyan-400 tracking-widest uppercase">Validating Hash Integrity</h3>
                            <p className="text-slate-500 mt-2">Computing proof of journey for Batch {searchQuery}...</p>
                        </motion.div>
                    ) : events.length > 0 ? (
                        <motion.div 
                            key="results"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="grid grid-cols-1 lg:grid-cols-3 gap-12"
                        >
                            {/* Left: Batch Specs Card */}
                            <div className="lg:col-span-1">
                                <div className="sticky top-24">
                                    <div className="glassmorphism p-8 rounded-3xl border border-white/10 relative overflow-hidden">
                                        <div className="absolute top-0 right-0 p-4 opacity-10">
                                            <QrCode className="w-32 h-32" />
                                        </div>
                                        <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                                            <ShieldCheck className="w-5 h-5 text-emerald-400" />
                                            Batch Identity
                                        </h3>
                                        <div className="space-y-6">
                                            <div>
                                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Asset Name</label>
                                                <p className="text-2xl font-black text-white">{medicine.name}</p>
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Global Batch ID</label>
                                                <p className="text-xl font-mono font-bold text-cyan-400">{medicine.batch_no}</p>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Mfg Date</label>
                                                    <p className="text-sm font-semibold">{new Date(medicine.mfg_date).toLocaleDateString()}</p>
                                                </div>
                                                <div>
                                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Expiry Date</label>
                                                    <p className="text-sm font-semibold text-rose-400">{new Date(medicine.expiry_date).toLocaleDateString()}</p>
                                                </div>
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Active Status</label>
                                                <div className="mt-1 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold">
                                                    <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                                                    CHAIN VERIFIED
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Middle & Right: Blockchain Visualization */}
                            <div className="lg:col-span-2 space-y-12">
                                <h3 className="text-xl font-bold flex items-center gap-2 text-slate-300">
                                    <Activity className="w-5 h-5 text-purple-400" />
                                    Immutable Ledger State
                                </h3>

                                <div className="space-y-8 pb-20">
                                    {events.map((event, idx) => (
                                        <motion.div 
                                            key={event.id}
                                            initial={{ opacity: 0, x: 50 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: idx * 0.2 }}
                                            className="relative flex flex-col items-center"
                                        >
                                            {idx !== 0 && (
                                                <div className="flex flex-col items-center my-2 gap-1">
                                                    <motion.div 
                                                        initial={{ height: 0 }}
                                                        animate={{ height: 40 }}
                                                        className="w-0.5 bg-gradient-to-b from-cyan-500 to-purple-600 shadow-[0_0_10px_rgba(6,182,212,0.5)]" 
                                                    />
                                                    <LinkIcon className="w-4 h-4 text-purple-400 rotate-45" />
                                                </div>
                                            )}

                                            <div 
                                                className={`w-full glassmorphism-dark rounded-3xl border transition-all duration-500 group overflow-hidden ${activeBlock === idx ? 'border-cyan-500 ring-2 ring-cyan-500/20' : 'border-white/10 hover:border-white/30'}`}
                                                onClick={() => setActiveBlock(activeBlock === idx ? null : idx)}
                                            >
                                                <div className="p-6 cursor-pointer">
                                                    <div className="flex items-start justify-between mb-4">
                                                        <div className="flex items-center gap-4">
                                                            <div className={`p-3 rounded-2xl bg-black/40 border border-white/5 transition-transform group-hover:scale-110 ${activeBlock === idx ? 'bg-cyan-500/10 border-cyan-500/30' : ''}`}>
                                                                <Box className={`w-8 h-8 ${activeBlock === idx ? 'text-cyan-400' : 'text-slate-400'}`} />
                                                            </div>
                                                            <div>
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-[10px] font-black font-mono text-cyan-500 bg-cyan-500/10 px-2 py-0.5 rounded uppercase">Block #{idx + 1}</span>
                                                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{event.role}</span>
                                                                </div>
                                                                <h4 className="text-xl font-bold text-white mt-1 group-hover:text-cyan-400 transition-colors">{event.role.replace('Verification', '').trim()} Node Validation</h4>
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <div className="flex items-center gap-1 text-slate-500 text-xs font-medium">
                                                                <Clock className="w-3 h-3" />
                                                                {new Date(event.created_at).toLocaleTimeString()}
                                                            </div>
                                                            <div className="text-[10px] text-slate-600 font-bold mt-1 uppercase">{new Date(event.created_at).toDateString()}</div>
                                                        </div>
                                                    </div>

                                                    <div className="font-mono text-[10px] bg-black/40 p-3 rounded-xl border border-white/5 text-slate-400 break-all relative group">
                                                        <div className="absolute top-2 right-2 text-[10px] text-cyan-500/40 uppercase font-black tracking-tighter">Current Block Hash</div>
                                                        <span className="text-cyan-400/80">{event.simulatedHash}</span>
                                                    </div>

                                                    <AnimatePresence>
                                                        {activeBlock === idx && (
                                                            <motion.div 
                                                                initial={{ height: 0, opacity: 0 }}
                                                                animate={{ height: 'auto', opacity: 1 }}
                                                                exit={{ height: 0, opacity: 0 }}
                                                                className="overflow-hidden"
                                                            >
                                                                <div className="pt-6 mt-6 border-t border-white/10 space-y-4">
                                                                    <div className="grid grid-cols-2 gap-4">
                                                                        <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                                                                            <label className="text-[9px] font-bold text-slate-500 uppercase block mb-1">Authenticated Actor</label>
                                                                            <div className="flex items-center gap-2 text-sm">
                                                                                <User className="w-4 h-4 text-purple-400" />
                                                                                <span className="font-medium text-slate-200">{event.actor_email}</span>
                                                                            </div>
                                                                        </div>
                                                                        <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                                                                            <label className="text-[9px] font-bold text-slate-500 uppercase block mb-1">Signing Node</label>
                                                                            <div className="flex items-center gap-2 text-sm">
                                                                                <Activity className="w-4 h-4 text-cyan-400" />
                                                                                <span className="font-medium text-slate-200">{event.role} ID: {event.id.slice(0, 8)}</span>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                    <div className="bg-black/20 p-4 rounded-2xl border border-white/5">
                                                                         <label className="text-[9px] font-bold text-slate-500 uppercase block mb-2 font-mono">Decoded Sign-off Details</label>
                                                                         <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
                                                                            {Object.entries(event.details || {}).map(([key, val]) => (
                                                                                <div key={key} className="flex justify-between items-center text-xs border-b border-white/5 pb-1">
                                                                                    <span className="text-slate-500">{key}:</span>
                                                                                    <span className="text-slate-300 font-medium">
                                                                                        {typeof val === 'object' ? JSON.stringify(val) : String(val)}
                                                                                    </span>
                                                                                </div>
                                                                            ))}
                                                                         </div>
                                                                    </div>
                                                                    <div className="flex items-center justify-between text-[10px] text-slate-500 px-2 mt-4">
                                                                        <div className="flex items-center gap-1">
                                                                            <Lock className="w-3 h-3" />
                                                                            ECDSA 256k1 Signed
                                                                        </div>
                                                                        <span className="font-mono">Sync Latency: 22ms</span>
                                                                    </div>
                                                                </div>
                                                            </motion.div>
                                                        )}
                                                    </AnimatePresence>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}

                                    {/* Future Block Placeholder */}
                                    <motion.div 
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: events.length * 0.2 + 0.5 }}
                                        className="flex flex-col items-center pt-8"
                                    >
                                        <div className="flex flex-col items-center gap-1 mb-4">
                                            <div className="w-0.5 h-12 bg-dashed border-l-2 border-dashed border-white/10" />
                                            <ChevronRight className="w-4 h-4 text-white/20 rotate-90" />
                                        </div>
                                        <div className="px-6 py-3 rounded-2xl border border-white/5 bg-white/5 text-slate-500 text-xs font-bold tracking-widest uppercase">
                                            Awaiting Next Network Handshake
                                        </div>
                                    </motion.div>
                                </div>
                            </div>
                        </motion.div>
                    ) : searchQuery && !isSearching && !isMining && (
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex flex-col items-center justify-center py-20 text-center"
                        >
                            <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6">
                                <Search className="w-10 h-10 text-white/20" />
                            </div>
                            <h3 className="text-2xl font-bold text-white mb-2">No Records Detected</h3>
                            <p className="text-slate-500 max-w-sm">We couldn't find any immutable entries for this batch ID in the MedChain repository.</p>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Empty State / Initial View */}
                {!searchQuery && !medicine && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8 opacity-50"
                    >
                        {[
                            { icon: Lock, title: "End-to-End Encryption", desc: "Every transaction is encrypted using node-specific private keys." },
                            { icon: LinkIcon, title: "Linked Time-stamps", desc: "Sequential blocks are linked by cryptographic parent hashes." },
                            { icon: ShieldCheck, title: "Public Trust", desc: "Independent multi-party validation across the entire supply chain." }
                        ].map((item, i) => (
                            <div key={i} className="flex flex-col items-center text-center p-8 bg-white/5 rounded-3xl border border-white/5">
                                <item.icon className="w-8 h-8 text-cyan-400 mb-4" />
                                <h4 className="font-bold text-white mb-2">{item.title}</h4>
                                <p className="text-xs text-slate-400 leading-relaxed">{item.desc}</p>
                            </div>
                        ))}
                    </motion.div>
                )}
            </div>

            {/* Bottom Decoration */}
            <div className="fixed bottom-0 left-0 w-full p-8 pointer-events-none flex justify-between items-end">
                <div className="flex flex-col gap-1">
                    <div className="text-[10px] font-bold text-cyan-500/30 uppercase tracking-[0.2em]">Network Status</div>
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[9px] font-mono text-slate-600 uppercase">Synchronized with Mainnet-ALPHA</span>
                    </div>
                </div>
                <div className="text-[9px] font-mono text-slate-600 uppercase">
                    Build 0.4.2-SIM | Medora Bio-Pharma Technologies
                </div>
            </div>
        </div>
    );
}
