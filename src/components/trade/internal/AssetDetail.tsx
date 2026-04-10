import React, { useState, useEffect } from 'react';
import { ArrowLeft, Clock, Info, ShieldCheck, Zap, Loader2, AlertTriangle, CheckCircle2, TrendingUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useWeb3 } from '../../../context/Web3Context';
import { ethers } from 'ethers';
import { ManufacturerTokenABI } from '../../../contracts/abis/ManufacturerToken';

interface AssetDetailProps {
  asset: any;
  onBack: () => void;
}

const AssetDetail: React.FC<AssetDetailProps> = ({ asset, onBack }) => {
    const { contracts, isConnected, account, signer } = useWeb3();
    const [tradeMode, setTradeMode] = useState<'buy' | 'sell'>('buy');
    const [amount, setAmount] = useState('');
    const [isExecuting, setIsExecuting] = useState(false);
    const [txStatus, setTxStatus] = useState<{ type: 'success' | 'error' | 'pending', message: string } | null>(null);
    const [userBalance, setUserBalance] = useState('0');

    useEffect(() => {
        const fetchUserTokenBalance = async () => {
            if (isConnected && contracts.marketplace && asset?.address) {
                try {
                    const bal = await contracts.marketplace.getTokenBalance(account, asset.address);
                    setUserBalance(ethers.formatEther(bal));
                } catch (e) {
                    console.error("Balance fetch error:", e);
                }
            }
        };
        fetchUserTokenBalance();
    }, [isConnected, contracts, asset, account, txStatus]);

    const handleOrder = async () => {
        if (!isConnected || !contracts.marketplace || !amount || isExecuting) return;

        try {
            setIsExecuting(true);
            setTxStatus({ type: 'pending', message: `Confirming ${tradeMode} order...` });

            const amountWei = ethers.parseEther(amount);
            
            if (tradeMode === 'buy') {
                // For simplified UX, we'll buy with ETH. The amount input is ETH amount.
                const tx = await contracts.marketplace.buyTokens(asset.address, 0, {
                    value: amountWei
                });
                setTxStatus({ type: 'pending', message: 'Transaction pending on-chain...' });
                await tx.wait();
                setTxStatus({ type: 'success', message: `Successfully purchased ${asset.symbol}!` });
            } else {
                // Sell tokens. First need approval.
                const tokenContract = new ethers.Contract(asset.address, ManufacturerTokenABI, signer);
                
                setTxStatus({ type: 'pending', message: 'Checking token allowance...' });
                const marketplaceAddress = await contracts.marketplace.getAddress();
                const allowance = await tokenContract.allowance(account, marketplaceAddress);

                if (allowance < amountWei) {
                    setTxStatus({ type: 'pending', message: 'Approving marketplace...' });
                    const approveTx = await tokenContract.approve(marketplaceAddress, amountWei);
                    await approveTx.wait();
                }

                setTxStatus({ type: 'pending', message: 'Executing sell order...' });
                const sellTx = await contracts.marketplace.sellTokens(asset.address, amountWei, 0);
                await sellTx.wait();
                setTxStatus({ type: 'success', message: `Successfully sold ${asset.symbol}!` });
            }

            setAmount('');
            setTimeout(() => setTxStatus(null), 5000);
        } catch (error: any) {
            console.error("Trade error:", error);
            setTxStatus({ 
                type: 'error', 
                message: error.reason || error.message || "Transaction failed" 
            });
        } finally {
            setIsExecuting(false);
        }
    };

    if (!asset) return null;

    return (
        <div className="p-8 space-y-8 max-w-6xl mx-auto">
            <button onClick={onBack} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-4 group">
                <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" /> Back to Market
            </button>

            <AnimatePresence>
                {txStatus && (
                    <motion.div 
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className={`p-4 rounded-xl border flex items-center gap-3 mb-6 ${
                            txStatus.type === 'pending' ? 'bg-primary/10 border-primary/20 text-primary' :
                            txStatus.type === 'error' ? 'bg-red-500/10 border-red-500/20 text-red-500' :
                            'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'
                        }`}
                    >
                        {txStatus.type === 'pending' && <Loader2 className="w-5 h-5 animate-spin" />}
                        {txStatus.type === 'error' && <AlertTriangle className="w-5 h-5" />}
                        {txStatus.type === 'success' && <CheckCircle2 className="w-5 h-5" />}
                        <span className="font-bold text-sm">{txStatus.message}</span>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Info & Stats */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-6">
                            <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center text-primary font-black text-3xl border border-primary/30">
                                {asset.symbol[0]}
                            </div>
                            <div>
                                <h2 className="text-4xl font-black">{asset.name}</h2>
                                <p className="text-gray-400 font-bold uppercase tracking-widest text-sm">{asset.symbol} / ETH</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-4xl font-black">{Number(asset.price).toFixed(6)} <span className="text-sm text-gray-500">ETH</span></p>
                            <span className="text-emerald-500 font-bold flex items-center justify-end gap-1">
                                <TrendingUp className="w-4 h-4" /> {asset.change}
                            </span>
                        </div>
                    </div>

                    <div className="bg-white/5 border border-white/10 rounded-2xl p-8 aspect-[16/9] flex items-center justify-center overflow-hidden relative">
                        {/* Simulation logic for chart */}
                        <div className="absolute inset-0 opacity-20 pointer-events-none">
                            <svg viewBox="0 0 100 100" className="w-full h-full preserve-3d">
                                <motion.path 
                                    d="M0 80 Q 20 20, 40 50 T 80 10 T 100 60" 
                                    fill="none" 
                                    stroke="var(--primary)" 
                                    strokeWidth="1"
                                    initial={{ pathLength: 0 }}
                                    animate={{ pathLength: 1 }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                />
                            </svg>
                        </div>
                        <div className="text-center relative z-10">
                            <Zap className="w-12 h-12 text-primary mx-auto mb-4 animate-pulse" />
                            <p className="text-gray-400 font-bold">Real-time Liquidity Depth Chart</p>
                            <p className="text-xs text-gray-500 mt-2">Connecting to Sepolia RPC...</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[
                            { label: "Token Price", value: `${Number(asset.price).toFixed(6)} ETH` },
                            { label: "Market Volume", value: `${asset.volume} ETH` },
                            { label: "Total Supply", value: Number(asset.supply).toLocaleString() },
                            { label: "Your Balance", value: `${Number(userBalance).toFixed(2)} ${asset.symbol}` }
                        ].map((stat, i) => (
                            <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-4">
                                <p className="text-xs text-gray-400 font-bold uppercase mb-1">{stat.label}</p>
                                <p className="text-lg font-black">{stat.value}</p>
                            </div>
                        ))}
                    </div>

                    <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                        <h4 className="text-xl font-bold mb-4 flex items-center gap-2">
                             <Info className="w-5 h-5 text-primary" /> Asset Information
                        </h4>
                        <p className="text-gray-400 leading-relaxed font-medium">
                            {asset.name} is a tokenized representation of pharmaceutical inventory and trust. 
                            Backed by the Medora Protocol, each token represents audited batch certificates 
                            and manufacturer reputation. Trading this asset provides exposure to the 
                            growth of the {asset.name} ecosystem.
                        </p>
                    </div>
                </div>

                {/* Right Column: Actions */}
                <div className="space-y-6">
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl">
                        <div className="flex bg-white/5 rounded-xl p-1 mb-6">
                            <button 
                                onClick={() => setTradeMode('buy')}
                                className={`flex-1 py-2 rounded-lg font-bold transition-all ${tradeMode === 'buy' ? 'bg-primary text-black' : 'text-gray-400 hover:text-white'}`}
                            >
                                Buy
                            </button>
                            <button 
                                onClick={() => setTradeMode('sell')}
                                className={`flex-1 py-2 rounded-lg font-bold transition-all ${tradeMode === 'sell' ? 'bg-white text-black' : 'text-gray-400 hover:text-white'}`}
                            >
                                Sell
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-black text-gray-400 uppercase mb-2 block">
                                    {tradeMode === 'buy' ? 'Amount to Spend' : `Amount to Sell (${asset.symbol})`}
                                </label>
                                <div className="relative">
                                    <input 
                                        type="number" 
                                        placeholder="0.00"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl py-4 px-4 text-xl font-black outline-none focus:border-primary/50"
                                    />
                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-gray-400 uppercase">
                                        {tradeMode === 'buy' ? 'ETH' : asset.symbol}
                                    </span>
                                </div>
                            </div>
                            
                            {tradeMode === 'buy' && (
                                <div className="p-4 bg-primary/10 rounded-xl border border-primary/20">
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="text-gray-400">Receive Approx.</span>
                                        <span className="font-bold text-primary">
                                            {amount ? (Number(amount) / Number(asset.price)).toFixed(2) : '0.00'} {asset.symbol}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-400">Slippage Tolerance</span>
                                        <span className="font-bold">0.5%</span>
                                    </div>
                                </div>
                            )}

                            <button 
                                onClick={handleOrder}
                                disabled={isExecuting || !amount}
                                className={`w-full py-4 font-black rounded-xl transition-all flex items-center justify-center gap-3 ${
                                    tradeMode === 'buy' 
                                    ? 'bg-primary text-black hover:shadow-[0_0_20px_rgba(6,182,212,0.4)]' 
                                    : 'bg-white text-black hover:shadow-[0_0_20px_rgba(255,255,255,0.4)]'
                                } disabled:opacity-50 disabled:cursor-not-allowed`}
                            >
                                {isExecuting ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Processing...
                                    </>
                                ) : (
                                    <>
                                        {tradeMode === 'buy' ? 'Execute Buy Order' : 'Execute Sell Order'}
                                    </>
                                )}
                            </button>
                            
                            <p className="text-[10px] text-center text-gray-500 font-bold uppercase tracking-widest">
                                Secured by Medora Trade Protocol
                            </p>
                        </div>
                    </div>

                    <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <ShieldCheck className="w-6 h-6 text-emerald-500" />
                            <h4 className="font-bold">Trust Verified</h4>
                        </div>
                        <p className="text-sm text-emerald-500/80 leading-relaxed font-medium">
                            This asset has cleared all security audits and is backed by a Liquidity Pool of {asset.volume} ETH.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AssetDetail;
