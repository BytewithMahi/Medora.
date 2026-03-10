import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Factory, Truck, Store, User as UserIcon, ChevronLeft, ShieldCheck, Mail, Lock, Fingerprint, Activity } from 'lucide-react';

interface AuthModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialMode: 'login' | 'register';
}

type Role = 'Manufacturer' | 'Distributor' | 'Retailer' | 'Customer' | null;

const roles = [
    { id: 'Manufacturer', icon: Factory, color: 'text-cyan-400', shadow: 'hover:shadow-[0_0_30px_rgba(34,211,238,0.4)]', bg: 'bg-cyan-400/10' },
    { id: 'Distributor', icon: Truck, color: 'text-purple-400', shadow: 'hover:shadow-[0_0_30px_rgba(192,132,252,0.4)]', bg: 'bg-purple-400/10' },
    { id: 'Retailer', icon: Store, color: 'text-blue-400', shadow: 'hover:shadow-[0_0_30px_rgba(96,165,250,0.4)]', bg: 'bg-blue-400/10' },
    { id: 'Customer', icon: UserIcon, color: 'text-emerald-400', shadow: 'hover:shadow-[0_0_30px_rgba(52,211,153,0.4)]', bg: 'bg-emerald-400/10' },
];

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, initialMode }) => {
    const [currentMode, setCurrentMode] = useState<'login' | 'register'>(initialMode);
    const [selectedRole, setSelectedRole] = useState<Role>(null);
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

    // Reset state when modal opens
    useEffect(() => {
        if (isOpen) {
            setCurrentMode(initialMode);
            setSelectedRole(null);
        }
    }, [isOpen, initialMode]);

    // Handle subtle background mouse movement
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            setMousePosition({
                x: (e.clientX / window.innerWidth) * 20 - 10,
                y: (e.clientY / window.innerHeight) * 20 - 10,
            });
        };
        if (isOpen) {
            window.addEventListener('mousemove', handleMouseMove);
        }
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 overflow-hidden"
            >
                {/* Abstract Blockchain Background Overlay */}
                <div className="absolute inset-0 bg-black/80 backdrop-blur-xl" onClick={onClose} />

                {/* Animated Particles & Glows */}
                <motion.div
                    animate={{ x: mousePosition.x * -2, y: mousePosition.y * -2 }}
                    className="absolute inset-0 pointer-events-none opacity-50"
                >
                    <div className="absolute top-[20%] left-[10%] w-96 h-96 bg-primary/20 rounded-full blur-[120px]" />
                    <div className="absolute bottom-[20%] right-[10%] w-96 h-96 bg-purple-500/20 rounded-full blur-[120px]" />
                    <div className="absolute top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20 mix-blend-overlay" />
                </motion.div>

                {/* Modal Container */}
                <motion.div
                    initial={{ scale: 0.9, y: 20 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0.9, y: 20 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    className="relative w-full max-w-5xl aspect-auto md:aspect-[16/9] min-h-[600px] bg-black/40 border border-white/10 rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col items-center justify-center"
                    style={{ perspective: 1200 }}
                >
                    {/* Decorative Corner Borders */}
                    <div className="absolute top-0 left-0 w-16 h-16 border-t-2 border-l-2 border-primary/50 rounded-tl-3xl opacity-50" />
                    <div className="absolute top-0 right-0 w-16 h-16 border-t-2 border-r-2 border-primary/50 rounded-tr-3xl opacity-50" />
                    <div className="absolute bottom-0 left-0 w-16 h-16 border-b-2 border-l-2 border-primary/50 rounded-bl-3xl opacity-50" />
                    <div className="absolute bottom-0 right-0 w-16 h-16 border-b-2 border-r-2 border-primary/50 rounded-br-3xl opacity-50" />

                    {/* Close Button */}
                    <button
                        onClick={onClose}
                        className="absolute top-6 right-6 p-2 rounded-full bg-white/5 border border-white/10 hover:bg-white/20 text-white/70 hover:text-white transition-all z-50 hover:rotate-90"
                    >
                        <X className="w-6 h-6" />
                    </button>

                    {/* Main Content Area with 3D Flip capability */}
                    <AnimatePresence mode="wait">
                        {!selectedRole ? (
                            <motion.div
                                key="role-selection"
                                initial={{ opacity: 0, rotateY: -90, scale: 0.8 }}
                                animate={{ opacity: 1, rotateY: 0, scale: 1 }}
                                exit={{ opacity: 0, rotateY: 90, scale: 0.8 }}
                                transition={{ duration: 0.5, type: 'spring', bounce: 0.3 }}
                                className="w-full h-full flex flex-col items-center justify-center p-8 z-10"
                            >
                                <div className="text-center mb-12">
                                    <motion.div
                                        initial={{ y: -20, opacity: 0 }}
                                        animate={{ y: 0, opacity: 1 }}
                                        transition={{ delay: 0.2 }}
                                        className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/30 text-primary text-sm font-semibold mb-6 tracking-wide"
                                    >
                                        <ShieldCheck className="w-4 h-4" />
                                        SECURE MEDCHAIN NETWORK
                                    </motion.div>
                                    <motion.h2
                                        initial={{ y: -20, opacity: 0 }}
                                        animate={{ y: 0, opacity: 1 }}
                                        transition={{ delay: 0.3 }}
                                        className="text-4xl md:text-5xl font-black text-white mb-4 tracking-tight"
                                    >
                                        Select Your Node Role
                                    </motion.h2>
                                    <motion.p
                                        initial={{ y: -20, opacity: 0 }}
                                        animate={{ y: 0, opacity: 1 }}
                                        transition={{ delay: 0.4 }}
                                        className="text-white/60 text-lg md:text-xl max-w-2xl mx-auto"
                                    >
                                        Join the decentralized healthcare supply chain. Choose your participant type to {currentMode === 'login' ? 'access your dashboard.' : 'create an identity.'}
                                    </motion.p>
                                </div>

                                {/* Role Cards Grid */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 w-full max-w-6xl">
                                    {roles.map((role, idx) => {
                                        const Icon = role.icon;
                                        return (
                                            <motion.button
                                                key={role.id}
                                                initial={{ opacity: 0, y: 30 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: 0.4 + idx * 0.1, type: 'spring' }}
                                                whileHover={{ y: -10, scale: 1.05 }}
                                                whileTap={{ scale: 0.95 }}
                                                onClick={() => setSelectedRole(role.id as Role)}
                                                className={`group relative flex flex-col items-center justify-center p-8 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md transition-all duration-300 ${role.shadow}`}
                                            >
                                                <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl" />
                                                <div className={`w-20 h-20 rounded-2xl ${role.bg} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 border border-white/5`}>
                                                    <Icon className={`w-10 h-10 ${role.color} drop-shadow-[0_0_10px_currentColor]`} />
                                                </div>
                                                <h3 className="text-xl font-bold text-white mb-2 group-hover:text-glow transition-all">{role.id}</h3>
                                                <p className="text-white/50 text-sm text-center group-hover:text-white/80 transition-colors">
                                                    {role.id === 'Manufacturer' && 'Register medicine batches & generate hashes.'}
                                                    {role.id === 'Distributor' && 'Log logistics checkpoints & handling data.'}
                                                    {role.id === 'Retailer' && 'Verify authentic inventory & manage stock.'}
                                                    {role.id === 'Customer' && 'Scan & verify medicine authenticity.'}
                                                </p>

                                                {/* Hover Glowing Border Bottom */}
                                                <div className={`absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-1 rounded-t-full transition-all duration-300 group-hover:w-1/2 ${role.color.replace('text', 'bg')}`} />
                                            </motion.button>
                                        );
                                    })}
                                </div>

                                {/* Toggle Mode Button */}
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.8 }}
                                    className="mt-12 text-white/50"
                                >
                                    {currentMode === 'login' ? "Don't have an identity?" : "Already registered?"}{' '}
                                    <button
                                        onClick={() => setCurrentMode(currentMode === 'login' ? 'register' : 'login')}
                                        className="text-primary font-bold hover:text-white transition-colors hover:underline"
                                    >
                                        {currentMode === 'login' ? 'Register here' : 'Login here'}
                                    </button>
                                </motion.div>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="auth-form"
                                initial={{ opacity: 0, rotateY: 90, scale: 0.8 }}
                                animate={{ opacity: 1, rotateY: 0, scale: 1 }}
                                exit={{ opacity: 0, rotateY: -90, scale: 0.8 }}
                                transition={{ duration: 0.5, type: 'spring', bounce: 0.3 }}
                                className="w-full h-full flex flex-col md:flex-row items-center z-10"
                            >
                                {/* Left Side: Role Info Panel */}
                                <div className="hidden md:flex w-2/5 h-full bg-white/5 border-r border-white/10 flex-col justify-center p-10 relative overflow-hidden">
                                    <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] bg-[url('https://www.transparenttextures.com/patterns/microbial-mat.png')] opacity-10 animate-[spin_120s_linear_infinite]" />

                                    <button
                                        onClick={() => setSelectedRole(null)}
                                        className="absolute top-8 left-8 flex items-center gap-2 text-white/50 hover:text-white transition-colors"
                                    >
                                        <ChevronLeft className="w-5 h-5" />
                                        <span className="text-sm font-semibold">Change Role</span>
                                    </button>

                                    <div className="relative z-10 mt-12">
                                        <motion.div
                                            key={selectedRole}
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            transition={{ type: 'spring', bounce: 0.5 }}
                                            className={`w-24 h-24 rounded-3xl ${roles.find(r => r.id === selectedRole)?.bg} flex items-center justify-center mb-8 border border-white/10`}
                                        >
                                            {roles.map((r) => r.id === selectedRole && (
                                                <r.icon key={r.id} className={`w-12 h-12 ${r.color} shadow-[0_0_20px_currentColor] rounded-full drop-shadow-xl`} />
                                            ))}
                                        </motion.div>

                                        <h2 className="text-4xl font-black text-white mb-4">
                                            {selectedRole} <br />
                                            <span className="text-primary text-3xl opacity-80">{currentMode === 'login' ? 'Access' : 'Registration'}</span>
                                        </h2>

                                        <p className="text-white/60 leading-relaxed mb-8">
                                            Secure authentication via MedChain smart contracts. Your cryptographic keys are end-to-end encrypted.
                                        </p>

                                        <div className="space-y-4">
                                            {['End-to-end encryption', 'Smart contract verified', 'Decentralized identity'].map((feature, i) => (
                                                <div key={i} className="flex items-center gap-3 text-white/80">
                                                    <Activity className="w-5 h-5 text-primary" />
                                                    <span className="text-sm font-medium">{feature}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Right Side: Form Panel */}
                                <div className="w-full md:w-3/5 h-full flex flex-col justify-center p-8 md:p-16 relative">
                                    {/* Mobile Back Button */}
                                    <button
                                        onClick={() => setSelectedRole(null)}
                                        className="md:hidden flex items-center gap-2 text-white/50 hover:text-white transition-colors mb-8"
                                    >
                                        <ChevronLeft className="w-5 h-5" />
                                        <span>Back to Roles</span>
                                    </button>

                                    <h3 className="text-2xl font-bold text-white mb-8">
                                        {currentMode === 'login' ? `Welcome back, ${selectedRole}.` : `Initialize ${selectedRole} Node.`}
                                    </h3>

                                    <form className="space-y-6 w-full max-w-md mx-auto md:mx-0" onSubmit={(e) => e.preventDefault()}>

                                        {currentMode === 'register' && (
                                            <div className="space-y-2 relative group">
                                                <label className="text-xs font-bold text-white/70 uppercase tracking-wider pl-1">Organization / User Name</label>
                                                <div className="relative">
                                                    <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40 group-focus-within:text-primary transition-colors" />
                                                    <input
                                                        type="text"
                                                        className="w-full bg-black/50 border border-white/10 rounded-xl py-3.5 pl-12 pr-4 text-white placeholder-white/30 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all font-medium"
                                                        placeholder="Enter display name"
                                                    />
                                                </div>
                                            </div>
                                        )}

                                        <div className="space-y-2 relative group">
                                            <label className="text-xs font-bold text-white/70 uppercase tracking-wider pl-1">Network Email</label>
                                            <div className="relative">
                                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40 group-focus-within:text-primary transition-colors" />
                                                <input
                                                    type="email"
                                                    className="w-full bg-black/50 border border-white/10 rounded-xl py-3.5 pl-12 pr-4 text-white placeholder-white/30 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all font-medium"
                                                    placeholder={`${selectedRole?.toLowerCase()}@medchain.net`}
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2 relative group">
                                            <label className="text-xs font-bold text-white/70 uppercase tracking-wider pl-1">Crypto Passkey</label>
                                            <div className="relative">
                                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40 group-focus-within:text-primary transition-colors" />
                                                <input
                                                    type="password"
                                                    className="w-full bg-black/50 border border-white/10 rounded-xl py-3.5 pl-12 pr-4 text-white placeholder-white/30 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all font-medium"
                                                    placeholder="••••••••••••"
                                                />
                                            </div>
                                        </div>

                                        {currentMode === 'login' && (
                                            <div className="flex justify-end">
                                                <a href="#" className="text-sm font-semibold text-primary/80 hover:text-primary transition-colors">Forgot Passkey?</a>
                                            </div>
                                        )}

                                        <button className="w-full relative group overflow-hidden rounded-xl bg-white text-black font-bold py-4 mt-4 hover:scale-[1.02] transition-all shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:shadow-[0_0_30px_rgba(255,255,255,0.5)]">
                                            <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-purple-500/20 translate-y-full group-hover:translate-y-0 transition-transform ease-out" />
                                            <span className="relative z-10 flex items-center justify-center gap-2">
                                                {currentMode === 'login' ? (
                                                    <><Fingerprint className="w-5 h-5" /> Authenticate Handshake</>
                                                ) : (
                                                    <><ShieldCheck className="w-5 h-5" /> Mint Node Identity</>
                                                )}
                                            </span>
                                        </button>

                                    </form>

                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default AuthModal;
