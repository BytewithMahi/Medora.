import React, { useEffect, useState } from 'react';
import { 
    Plus, 
    Users, 
    Coins, 
    TrendingUp, 
    Activity, 
    ArrowLeft, 
    Search, 
    ExternalLink, 
    MoreVertical,
    Wallet,
    Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useWeb3 } from '../../../context/Web3Context';
import CreateTokenModal from './CreateTokenModal';

interface TokenMetadata {
    address: string;
    name: string;
    symbol: string;
    total_supply: string;
    base_price: string;
    created_at: string;
}

interface HolderInfo {
    holder_address: string;
    balance: string;
}

const ManufacturerTradeDashboard = () => {
    const { account, isConnected } = useWeb3();
    const [tokens, setTokens] = useState<TokenMetadata[]>([]);
    const [selectedToken, setSelectedToken] = useState<TokenMetadata | null>(null);
    const [holders, setHolders] = useState<HolderInfo[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isHoldersLoading, setIsHoldersLoading] = useState(false);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isRegistered, setIsRegistered] = useState<boolean | null>(null);
    const [isRegistering, setIsRegistering] = useState(false);

    const { contracts } = useWeb3();

    useEffect(() => {
        if (isConnected && account) {
            fetchManufacturerData();
            checkRegistration();
        }
    }, [isConnected, account, contracts.registry]);

    const checkRegistration = async () => {
        if (!contracts.registry || !account) return;
        try {
            const registered = await contracts.registry.isRegisteredManufacturer(account);
            setIsRegistered(registered);
        } catch (error) {
            console.error("Error checking registration:", error);
        }
    };

    const handleRegister = async () => {
        if (!contracts.registry || !account) return;
        try {
            setIsRegistering(true);
            const tx = await contracts.registry.registerManufacturer(account);
            await tx.wait();
            setIsRegistered(true);
        } catch (error) {
            console.error("Registration error:", error);
            alert("Registration failed. Please ensure you have ETH on Sepolia.");
        } finally {
            setIsRegistering(false);
        }
    };

    const fetchManufacturerData = async () => {
        try {
            setIsLoading(true);
            const response = await fetch(`/api/trade/manufacturer-tokens/${account}`);
            const result = await response.json();
            if (result.success) {
                setTokens(result.data);
            }
        } catch (error) {
            console.error("Failed to fetch manufacturer tokens:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchTokenHolders = async (tokenAddress: string) => {
        try {
            setIsHoldersLoading(true);
            const response = await fetch(`/api/trade/token-holders/${tokenAddress}`);
            const result = await response.json();
            if (result.success) {
                setHolders(result.data);
            }
        } catch (error) {
            console.error("Failed to fetch token holders:", error);
        } finally {
            setIsHoldersLoading(false);
        }
    };

    const handleSelectToken = (token: TokenMetadata) => {
        setSelectedToken(token);
        fetchTokenHolders(token.address);
    };

    if (!isConnected) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-8 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-xl mt-12">
                <Wallet className="w-16 h-16 text-primary/20 mb-6" />
                <h3 className="text-2xl font-black mb-2">Wallet Connection Required</h3>
                <p className="text-gray-400 max-w-md mx-auto mb-8">
                    Connect your manufacturer-registered wallet to manage your asset pools.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-20">
            {/* Header / Stats Overlay */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="md:col-span-2 bg-gradient-to-br from-primary/20 to-transparent border border-primary/20 rounded-3xl p-8 backdrop-blur-xl relative overflow-hidden group">
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-2">
                            <h2 className="text-sm font-black text-primary uppercase tracking-[0.2em]">Manufacturer Portal</h2>
                            {isRegistered === true ? (
                                <div className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-[10px] text-emerald-400 font-black flex items-center gap-1">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                    BLOCKCHAIN VERIFIED
                                </div>
                            ) : isRegistered === false ? (
                                <div className="px-2 py-0.5 rounded-full bg-red-400/10 border border-red-400/30 text-[10px] text-red-400 font-black flex items-center gap-1">
                                    <div className="w-1.5 h-1.5 rounded-full bg-red-400" />
                                    NOT REGISTERED
                                </div>
                            ) : (
                                <div className="px-2 py-0.5 rounded-full bg-white/10 border border-white/20 text-[10px] text-white/50 font-black">
                                    CHECKING STATUS...
                                </div>
                            )}
                        </div>
                        <h1 className="text-4xl font-black text-white mb-4">Manage Your <br/><span className="italic">Public Assets</span></h1>
                        
                        {isRegistered === false ? (
                            <div className="space-y-4">
                                <p className="text-red-400/70 text-xs font-bold bg-red-400/5 p-3 rounded-xl border border-red-400/10 max-w-xs leading-relaxed">
                                    Your Medora account is verified, but your wallet needs a one-time blockchain registration.
                                </p>
                                <button 
                                    onClick={handleRegister}
                                    disabled={isRegistering}
                                    className="bg-red-500 text-white font-black px-6 py-3 rounded-xl flex items-center gap-2 hover:bg-red-600 transition-all"
                                >
                                    {isRegistering ? <Loader2 className="w-5 h-5 animate-spin" /> : <Activity className="w-5 h-5" />} 
                                    {isRegistering ? "Registering Node..." : "Register Wallet for Trade"}
                                </button>
                            </div>
                        ) : (
                            <>
                                <p className="text-gray-400 text-sm max-w-xs mb-6">Monitor your token distributions, price floor, and investor demographics.</p>
                                <button 
                                    onClick={() => setIsCreateModalOpen(true)}
                                    className="bg-primary text-black font-black px-6 py-3 rounded-xl flex items-center gap-2 hover:scale-105 transition-all shadow-[0_0_20px_rgba(6,182,212,0.4)]"
                                >
                                    <Plus className="w-5 h-5" /> Deploy New Market
                                </button>
                            </>
                        )}
                    </div>
                    <div className="absolute top-0 right-0 p-8 h-full flex items-center opacity-10 group-hover:opacity-20 transition-opacity">
                        <TrendingUp className="w-32 h-32 text-primary" />
                    </div>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-xl">
                    <div className="flex items-center gap-3 mb-4 text-gray-500">
                        <Coins className="w-5 h-5" />
                        <span className="text-xs font-bold uppercase tracking-widest">Active Tokens</span>
                    </div>
                    <p className="text-5xl font-black text-white">{tokens.length}</p>
                    <p className="text-xs text-gray-500 mt-2 font-medium">Minted on Sepolia Network</p>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-xl">
                    <div className="flex items-center gap-3 mb-4 text-gray-500">
                        <Users className="w-5 h-5" />
                        <span className="text-xs font-bold uppercase tracking-widest">Total Holders</span>
                    </div>
                    <p className="text-5xl font-black text-white">...</p>
                    <p className="text-xs text-gray-500 mt-2 font-medium">Across all deployed pools</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Tokens List (Left) */}
                <div className="lg:col-span-2 bg-white/5 border border-white/10 rounded-3xl overflow-hidden backdrop-blur-xl flex flex-col min-h-[500px]">
                    <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5">
                        <h3 className="text-xl font-bold flex items-center gap-2">
                           <Activity className="w-5 h-5 text-primary" /> Deployed Market Assets
                        </h3>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                            <input type="text" placeholder="Search tokens..." className="bg-black/40 border border-white/10 rounded-full py-1.5 pl-9 pr-4 text-xs focus:border-primary/50 transition-all outline-none" />
                        </div>
                    </div>

                    <div className="flex-grow">
                        {isLoading ? (
                            <div className="flex items-center justify-center h-full">
                                <Loader2 className="w-8 h-8 text-primary animate-spin" />
                            </div>
                        ) : tokens.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-center p-12">
                                <Coins className="w-16 h-16 text-white/10 mb-4" />
                                <h4 className="text-lg font-bold">No assets found</h4>
                                <p className="text-gray-500 text-sm max-w-xs mx-auto mt-2">You haven't tokenized any medicine batches yet. Click "Deploy New Market" to start.</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-white/5">
                                {tokens.map((token) => (
                                    <motion.div 
                                        key={token.address}
                                        onClick={() => handleSelectToken(token)}
                                        whileHover={{ backgroundColor: 'rgba(255,255,255,0.02)' }}
                                        className={`p-6 flex items-center justify-between cursor-pointer transition-colors ${selectedToken?.address === token.address ? 'bg-primary/5 border-l-4 border-l-primary' : 'border-l-4 border-l-transparent'}`}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10 group-hover:border-primary/50 transition-all">
                                                <span className="text-primary font-black uppercase">{token.symbol[0]}</span>
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-lg">{token.name}</h4>
                                                <p className="text-xs text-gray-500 font-mono">{token.address.slice(0, 18)}...</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-white font-black">{Number(token.base_price).toFixed(6)} ETH</p>
                                            <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Pool Floor Price</p>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Selected Token View / Holders (Right) */}
                <div className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden backdrop-blur-xl flex flex-col">
                    <div className="p-6 border-b border-white/10 bg-white/5">
                        <h3 className="text-xl font-bold flex items-center gap-2">
                           <Users className="w-5 h-5 text-purple-400" /> Holder Demographics
                        </h3>
                    </div>
                    
                    <div className="flex-grow p-6">
                        <AnimatePresence mode="wait">
                            {!selectedToken ? (
                                <motion.div 
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="flex flex-col items-center justify-center h-full text-center text-gray-500 py-20"
                                >
                                    <ArrowLeft className="w-10 h-10 mb-4 opacity-10" />
                                    <p className="text-sm">Select an asset from the list <br/>to view its holder distribution</p>
                                </motion.div>
                            ) : (
                                <motion.div 
                                    key={selectedToken.address}
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="space-y-6"
                                >
                                    <div className="bg-black/40 rounded-2xl p-4 border border-white/5">
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Current Pool Status</p>
                                                <h4 className="text-lg font-black">{selectedToken.name} Market</h4>
                                            </div>
                                            <a 
                                                href={`https://sepolia.etherscan.io/address/${selectedToken.address}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="p-2 bg-white/5 rounded-lg text-gray-400 hover:text-primary"
                                            >
                                                <ExternalLink className="w-4 h-4" />
                                            </a>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4 text-center">
                                            <div className="bg-white/5 p-3 rounded-xl">
                                                <p className="text-[10px] font-bold text-gray-500 uppercase">Supply</p>
                                                <p className="font-black text-sm">{Number(selectedToken.total_supply).toLocaleString()}</p>
                                            </div>
                                            <div className="bg-white/5 p-3 rounded-xl">
                                                <p className="text-[10px] font-bold text-gray-500 uppercase">Holders</p>
                                                <p className="font-black text-sm">{holders.length}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center px-1">
                                            <h5 className="text-xs font-black text-gray-500 uppercase tracking-widest">Active Holders</h5>
                                            {isHoldersLoading && <Loader2 className="w-3 h-3 animate-spin text-primary" />}
                                        </div>

                                        <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                            {holders.map((h, i) => (
                                                <div key={h.holder_address} className="bg-white/5 rounded-xl p-3 flex justify-between items-center hover:bg-white/10 transition-all">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-[10px] font-black text-gray-600 border border-white/10">
                                                            {i + 1}
                                                        </div>
                                                        <div>
                                                            <p className="text-xs font-bold text-white">{h.holder_address.slice(0, 8)}...{h.holder_address.slice(-4)}</p>
                                                            <p className="text-[10px] text-gray-500">{h.holder_address === account ? '(You)' : 'External Wallet'}</p>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-xs font-black text-emerald-400">{Number(h.balance).toLocaleString()} TKN</p>
                                                        <p className="text-[10px] text-gray-500">{((Number(h.balance) / Number(selectedToken.total_supply)) * 100).toFixed(1)}%</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>

            <CreateTokenModal 
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onSuccess={() => {
                    fetchManufacturerData();
                    setIsCreateModalOpen(false);
                }}
            />
        </div>
    );
};

export default ManufacturerTradeDashboard;
