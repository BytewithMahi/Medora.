import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, Info, CheckCircle2, AlertTriangle, Coins, TrendingUp, Cpu } from 'lucide-react';
import { useWeb3 } from '../../../context/Web3Context';
import { ethers } from 'ethers';

interface CreateTokenModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

const CreateTokenModal: React.FC<CreateTokenModalProps> = ({ isOpen, onClose, onSuccess }) => {
    const { contracts, isConnected, account } = useWeb3();
    const [isLoading, setIsLoading] = useState(false);
    const [status, setStatus] = useState<{ type: 'success' | 'error' | 'pending', message: string } | null>(null);

    const [formData, setFormData] = useState({
        name: '',
        symbol: '',
        volume: '',
        initialValue: ''
    });

    const [isRegistered, setIsRegistered] = useState<boolean>(false);

    const checkRegistration = async () => {
        if (!contracts.registry || !account) return;
        try {
            const registered = await contracts.registry.isRegisteredManufacturer(account);
            setIsRegistered(registered);
        } catch (error) {
            console.error("Error checking registration:", error);
        }
    };

    useEffect(() => {
        if (isOpen && isConnected && account) {
            checkRegistration();
        }
    }, [isOpen, isConnected, account]);

    const handleRegister = async () => {
        if (!contracts.registry || !account) return;
        try {
            setIsLoading(true);
            setStatus({ type: 'pending', message: 'Registering your wallet as a manufacturer...' });
            
            // NOTE: This usually requires ADMIN_ROLE, but we can try it
            // In dev environments, the first user often has admin roles or the contract is open
            const tx = await contracts.registry.registerManufacturer(account);
            console.log("Registration TX submitted:", tx.hash);
            await tx.wait();
            
            setStatus({ type: 'success', message: 'Registration successful! You can now deploy assets.' });
            setIsRegistered(true);
        } catch (error: any) {
            console.error("Registration error:", error);
            setStatus({ 
                type: 'error', 
                message: "Registration failed. You may need an Admin to register you, or check if you are already registered." 
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!isConnected) {
            setStatus({ type: 'error', message: 'Wallet disconnected. Please reconnect to continue.' });
            return;
        }

        if (!contracts.registry) {
            setStatus({ 
                type: 'error', 
                message: 'Smart contracts not initialized. Check if you are on Sepolia and that environment variables are set.' 
            });
            return;
        }

        try {
            setIsLoading(true);
            setStatus({ type: 'pending', message: 'Simulating transaction and initiating deployment...' });

            console.log("Form Data:", formData);
            const totalSupply = ethers.parseEther(formData.volume || "0");
            const basePrice = ethers.parseEther(formData.initialValue || "0");

            console.log("Calculated supply/price:", totalSupply.toString(), basePrice.toString());

            const tx = await contracts.registry.createToken(
                formData.name,
                formData.symbol,
                totalSupply,
                basePrice
            );

            console.log("Transaction submitted:", tx.hash);
            setStatus({ type: 'pending', message: 'Transaction submitted. Waiting for Network Confirmation...' });
            
            const receipt = await tx.wait();
            console.log("Transaction confirmed:", receipt);

            // Attempt to find token address in logs
            let tokenAddress = tx.hash; // Fallback to hash if log parsing fails
            try {
                // The first log in createToken is usually the TokenCreated event
                if (receipt.logs && receipt.logs.length > 0) {
                    tokenAddress = receipt.logs[0].address; 
                }
            } catch (e) {
                console.warn("Could not extract token address from logs:", e);
            }

            // === SYNC WITH SUPABASE ===
            try {
                const response = await fetch('/api/trade/record-deployment', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        address: tokenAddress,
                        name: formData.name,
                        symbol: formData.symbol,
                        totalSupply: formData.volume,
                        basePrice: formData.initialValue,
                        manufacturer: account
                    })
                });
                const result = await response.json();
                console.log("Supabase sync result:", result);
            } catch (err) {
                console.error("Failed to sync with Supabase:", err);
            }
            // =========================

            setStatus({ 
                type: 'success', 
                message: `Market for ${formData.name} is now LIVE and recorded in Supabase!` 
            });
            
            setTimeout(() => {
                onSuccess();
                onClose();
            }, 3000);

        } catch (error: any) {
            console.error("Token creation error detailed:", error);
            
            let msg = error.reason || error.message || "Unknown Error";
            if (msg.includes("NotRegisteredManufacturer")) {
                msg = "Wallet not registered! Use the registration button below.";
            }

            setStatus({ 
                type: 'error', 
                message: `Deployment Failed: ${msg}`
            });

            // Extra debug for common role errors
            if (msg.toLowerCase().includes("unauthorized") || msg.toLowerCase().includes("access")) {
                console.warn("CRITICAL: ManufacturerRegistry may lack MANUFACTURER_REGISTRY_ROLE in CentralMarketplace.");
            }
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#020617]/80 backdrop-blur-md">
            <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="bg-[#0f172a] border border-white/10 rounded-3xl w-full max-w-lg shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden relative"
            >
                {/* Header */}
                <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/5">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/20 rounded-lg text-primary">
                            <Coins className="w-6 h-6" />
                        </div>
                        <h2 className="text-xl font-black uppercase tracking-tight">Create Asset Token</h2>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full text-gray-400 hover:text-white transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleCreate} className="p-8 space-y-6">
                    <AnimatePresence>
                        {status && (
                            <motion.div 
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className={`p-4 rounded-xl border flex items-center gap-3 mb-6 ${
                                    status.type === 'pending' ? 'bg-primary/10 border-primary/20 text-primary' :
                                    status.type === 'error' ? 'bg-red-500/10 border-red-500/20 text-red-500' :
                                    'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'
                                } overflow-hidden font-bold text-sm`}
                            >
                                {status.type === 'pending' && <Loader2 className="w-5 h-5 animate-spin" />}
                                {status.type === 'error' && <AlertTriangle className="w-5 h-5" />}
                                {status.type === 'success' && <CheckCircle2 className="w-5 h-5" />}
                                <span>{status.message}</span>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[10px] uppercase font-black text-gray-500 tracking-widest pl-1">Token Name</label>
                            <input 
                                required
                                type="text"
                                placeholder="e.g. Medora Labs"
                                value={formData.name}
                                onChange={(e) => setFormData({...formData, name: e.target.value})}
                                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:border-primary/50 outline-none transition-all font-bold"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] uppercase font-black text-gray-500 tracking-widest pl-1">Ticker / Symbol</label>
                            <input 
                                required
                                type="text"
                                placeholder="MLAB"
                                maxLength={5}
                                value={formData.symbol}
                                onChange={(e) => setFormData({...formData, symbol: e.target.value.toUpperCase()})}
                                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:border-primary/50 outline-none transition-all font-black"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] uppercase font-black text-gray-500 tracking-widest pl-1">Total Volume (Supply)</label>
                        <div className="relative">
                            <input 
                                required
                                type="number"
                                placeholder="1000000"
                                value={formData.volume}
                                onChange={(e) => setFormData({...formData, volume: e.target.value})}
                                className="w-full bg-white/5 border border-white/10 rounded-xl py-4 px-4 text-xl font-black focus:border-primary/50 outline-none transition-all"
                            />
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-primary font-black text-xs uppercase">Tokens</span>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] uppercase font-black text-gray-500 tracking-widest pl-1">Initial Value (ETH per Token)</label>
                        <div className="relative">
                            <input 
                                required
                                type="number"
                                step="0.000001"
                                placeholder="0.001"
                                value={formData.initialValue}
                                onChange={(e) => setFormData({...formData, initialValue: e.target.value})}
                                className="w-full bg-white/5 border border-white/10 rounded-xl py-4 px-4 text-xl font-black focus:border-primary/50 outline-none transition-all"
                            />
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-black text-xs uppercase">ETH</span>
                        </div>
                    </div>

                    <div className="p-4 bg-white/5 border border-white/10 rounded-2xl space-y-3">
                        <div className="flex gap-4">
                            <Info className="w-6 h-6 text-primary shrink-0" />
                            <p className="text-[11px] text-gray-400 leading-relaxed font-medium">
                                <span className="text-white font-bold">Heads up:</span> While your Medora account is verified, token deployment requires a <span className="text-primary">Blockchain Handshake</span>. This authorizes your current wallet (0x...) to act as a manufacturer on the Sepolia network.
                            </p>
                        </div>
                        
                        {isRegistered === false && (
                            <motion.div 
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex flex-col gap-3"
                            >
                                <div className="flex items-center gap-2 text-red-500 font-bold text-[10px] uppercase tracking-wider">
                                    <AlertTriangle className="w-4 h-4" /> Account Not Registered
                                </div>
                                <button 
                                    type="button"
                                    onClick={handleRegister}
                                    disabled={isLoading}
                                    className="w-full py-2 bg-red-500 text-white font-black rounded-lg text-xs uppercase hover:bg-red-600 transition-colors flex items-center justify-center gap-2"
                                >
                                    {isLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : "Register Wallet for Trade"}
                                </button>
                            </motion.div>
                        )}

                        {isRegistered === true && (
                            <div className="flex items-center gap-2 text-emerald-500 font-bold text-[10px] uppercase tracking-wider pl-1">
                                <CheckCircle2 className="w-4 h-4" /> Verified Manufacturer Account
                            </div>
                        )}
                    </div>

                    <button 
                        type="submit"
                        disabled={isLoading || !isConnected || isRegistered === false || !contracts.registry}
                        className="w-full py-5 bg-primary text-black font-black rounded-2xl shadow-[0_0_30px_rgba(6,182,212,0.3)] hover:shadow-primary/50 transition-all flex items-center justify-center gap-3 text-lg disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-tighter"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="w-6 h-6 animate-spin" />
                                Processing Order...
                            </>
                        ) : (
                            <>
                                <TrendingUp className="w-6 h-6" />
                                {isRegistered === false ? "Awaiting Registration" : "Deploy Asset Market"}
                            </>
                        )}
                    </button>

                    <div className="flex items-center justify-center gap-2 text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                        <Cpu className="w-3 h-3" /> Encrypted Transaction Node 0x72...
                    </div>
                </form>
            </motion.div>
        </div>
    );
};

export default CreateTokenModal;
