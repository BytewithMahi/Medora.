import React, { useEffect, useState } from 'react';
import { Wallet, ArrowUpRight, ArrowDownLeft, Activity, TrendingUp, Loader2, PieChart, ExternalLink } from 'lucide-react';
import { useWeb3 } from '../../../context/Web3Context';
import { ethers } from 'ethers';

interface PortfolioAsset {
    address: string;
    balance: string;
    totalSpent: string;
    currentValue: string;
    symbol: string;
}

interface Transaction {
    tokenAddress: string;
    isBuy: boolean;
    amountIn: string;
    amountOut: string;
    price: string;
    timestamp: number;
}

const TradeDashboard = () => {
    const { isConnected, account, contracts, balance: ethBalance } = useWeb3();
    const [portfolio, setPortfolio] = useState<PortfolioAsset[]>([]);
    const [history, setHistory] = useState<Transaction[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            if (!isConnected || !contracts.marketplace || !contracts.registry) {
                setIsLoading(false);
                return;
            }

            try {
                setIsLoading(true);
                // 1. Fetch Portfolio
                const [tokens, balances, totalSpent, currentValue] = await contracts.marketplace.getUserPortfolio(account);
                const fetchedPortfolio: PortfolioAsset[] = [];

                for (let i = 0; i < tokens.length; i++) {
                    if (balances[i] > 0n) {
                        const metadata = await contracts.registry.getTokenMetadata(tokens[i]);
                        fetchedPortfolio.push({
                            address: tokens[i],
                            balance: ethers.formatEther(balances[i]),
                            totalSpent: ethers.formatEther(totalSpent[i]),
                            currentValue: ethers.formatEther(currentValue[i]),
                            symbol: metadata.symbol
                        });
                    }
                }
                setPortfolio(fetchedPortfolio);

                // 2. Fetch History
                const rawHistory = await contracts.marketplace.getUserTransactionHistory(account);
                const fetchedHistory: Transaction[] = rawHistory.map((h: any) => ({
                    tokenAddress: h.tokenAddress,
                    isBuy: h.isBuy,
                    amountIn: ethers.formatEther(h.amountIn),
                    amountOut: ethers.formatEther(h.amountOut),
                    price: ethers.formatEther(h.price),
                    timestamp: Number(h.timestamp)
                })).reverse(); // Newest first

                setHistory(fetchedHistory);
            } catch (error) {
                console.error("Dashboard fetch error:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchDashboardData();
    }, [isConnected, account, contracts]);

    const totalPortfolioValue = portfolio.reduce((acc, p) => acc + Number(p.currentValue), 0);
    const totalSpentValue = portfolio.reduce((acc, p) => acc + Number(p.totalSpent), 0);
    const overallPnL = totalPortfolioValue - totalSpentValue;

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
                <Loader2 className="w-10 h-10 text-primary animate-spin" />
                <p className="text-gray-400 font-bold">Loading Portfolio...</p>
            </div>
        );
    }

    if (!isConnected) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-8 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-xl mt-12">
                <Wallet className="w-16 h-16 text-primary/20 mb-6" />
                <h3 className="text-2xl font-black mb-2">Portfolio Locked</h3>
                <p className="text-gray-400 max-w-md mx-auto mb-8">
                    Connect your MetaMask wallet to view your active positions, trading history, and real-time PnL tracking.
                </p>
            </div>
        );
    }

    return (
        <div className="p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-primary/20 transition-all" />
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-primary/20 rounded-xl text-primary border border-primary/30">
                            <Wallet className="w-6 h-6" />
                        </div>
                        <span className="text-gray-400 font-bold uppercase tracking-widest text-xs">Net Worth</span>
                    </div>
                    <h3 className="text-4xl font-black text-white">{(totalPortfolioValue + Number(ethBalance)).toFixed(4)} <span className="text-lg text-gray-500">ETH</span></h3>
                    <p className={`text-sm mt-3 font-bold flex items-center gap-1 ${overallPnL >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                        {overallPnL >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingUp className="w-4 h-4 rotate-180" />}
                        {overallPnL >= 0 ? '+' : ''}{overallPnL.toFixed(4)} ETH PnL
                    </p>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl group">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-purple-500/20 rounded-xl text-purple-500 border border-purple-500/30">
                            <PieChart className="w-6 h-6" />
                        </div>
                        <span className="text-gray-400 font-bold uppercase tracking-widest text-xs">Token Balances</span>
                    </div>
                    <div className="space-y-3">
                        {portfolio.length === 0 ? (
                            <p className="text-gray-500 italic text-sm py-2">No tokens in portfolio yet.</p>
                        ) : (
                            portfolio.slice(0, 3).map((p, i) => (
                                <div key={i} className="flex justify-between items-center bg-white/5 rounded-lg p-2 px-3">
                                    <span className="text-sm font-bold text-gray-300">{p.symbol}</span>
                                    <span className="text-sm font-black">{Number(p.balance).toFixed(2)}</span>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl group">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-blue-500/20 rounded-xl text-blue-500 border border-blue-500/30">
                            <Activity className="w-6 h-6" />
                        </div>
                        <span className="text-gray-400 font-bold uppercase tracking-widest text-xs">Total Trades</span>
                    </div>
                    <h3 className="text-4xl font-black text-white">{history.length}</h3>
                    <p className="text-gray-400 text-sm mt-3">Verified on Sepolia Network</p>
                </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-xl">
                <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5">
                    <div>
                        <h4 className="text-xl font-bold">Trade History</h4>
                        <p className="text-gray-500 text-xs mt-1">Direct from Medora UserMarketplace</p>
                    </div>
                    <button className="text-primary text-sm font-bold flex items-center gap-2 hover:underline">
                        Export CSV <ExternalLink className="w-4 h-4" />
                    </button>
                </div>
                <div className="divide-y divide-white/10 overflow-x-auto">
                    {history.length === 0 ? (
                        <div className="p-20 text-center text-gray-500 italic">
                            No recent transactions found for this account.
                        </div>
                    ) : (
                        history.map((h, i) => (
                            <div key={i} className="p-6 flex items-center justify-between hover:bg-white/5 transition-colors min-w-[600px]">
                                <div className="flex items-center gap-4">
                                    <div className={`p-3 rounded-xl border ${h.isBuy ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-red-500/10 border-red-500/20 text-red-500'}`}>
                                        {h.isBuy ? <ArrowDownLeft className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                                    </div>
                                    <div>
                                        <p className="text-white font-bold">{h.isBuy ? 'Buy' : 'Sell'} Transaction</p>
                                        <p className="text-xs text-gray-400">
                                            {new Date(h.timestamp * 1000).toLocaleString()} • {h.tokenAddress.slice(0, 10)}...
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-12">
                                    <div className="text-right">
                                        <p className="text-gray-400 text-xs font-bold uppercase">Amount</p>
                                        <p className="text-white font-black">{h.isBuy ? h.amountOut : h.amountIn} Tokens</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-gray-400 text-xs font-bold uppercase">Price</p>
                                        <p className="text-white font-black">{Number(h.price).toFixed(6)} ETH</p>
                                    </div>
                                    <div className="text-right w-32">
                                        <p className="text-gray-400 text-xs font-bold uppercase">Value Paid</p>
                                        <p className={`font-black ${h.isBuy ? 'text-red-400' : 'text-emerald-400'}`}>
                                            {h.isBuy ? '-' : '+'}{Number(h.isBuy ? h.amountIn : h.amountOut).toFixed(4)} ETH
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default TradeDashboard;
