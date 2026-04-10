import React, { useEffect, useState } from 'react';
import { Search, Filter, ChevronRight, Loader2, TrendingUp } from 'lucide-react';
import { useWeb3 } from '../../../context/Web3Context';
import { ethers } from 'ethers';

interface MarketToken {
  address: string;
  name: string;
  symbol: string;
  price: string;
  supply: string;
  volume: string;
  change: string;
}

const TradeMarketplace = ({ onSelect }: { onSelect: (asset: any) => void }) => {
    const { contracts, isConnected } = useWeb3();
    const [tokens, setTokens] = useState<MarketToken[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        const fetchTokens = async () => {
            if (!contracts.registry || !contracts.marketplace) {
                // If not connected, we could show mock data or empty
                setIsLoading(false);
                return;
            }

            try {
                setIsLoading(true);
                const manufacturers = await contracts.registry.getAllManufacturers();
                const fetchedTokens: MarketToken[] = [];

                for (const mAddr of manufacturers) {
                    const tAddr = await contracts.registry.getManufacturerToken(mAddr);
                    if (tAddr === ethers.ZeroAddress) continue;

                    const metadata = await contracts.registry.getTokenMetadata(tAddr);
                    const poolState = await contracts.marketplace.getPoolState(tAddr);

                    fetchedTokens.push({
                        address: tAddr,
                        name: metadata.name,
                        symbol: metadata.symbol,
                        price: ethers.formatEther(poolState.lastPrice),
                        supply: ethers.formatEther(metadata.totalSupply),
                        volume: ethers.formatEther(poolState.totalVolume),
                        change: "+0.0%", // Change calculation would require history
                    });
                }

                setTokens(fetchedTokens);
            } catch (error) {
                console.error("Error fetching tokens:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchTokens();
    }, [contracts]);

    const filteredTokens = tokens.filter(t => 
        t.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        t.symbol.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
                <Loader2 className="w-10 h-10 text-primary animate-spin" />
                <p className="text-gray-400 font-bold animate-pulse">Syncing with Sepolia...</p>
            </div>
        );
    }

    return (
        <div className="p-8 space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                   <h3 className="text-3xl font-black mb-1">Active Markets</h3>
                   <p className="text-gray-500 text-sm">Verified algorithmic supply-chain tokens</p>
                </div>
                <div className="flex gap-4 w-full md:w-auto">
                    <div className="relative flex-grow md:w-80">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input 
                            type="text" 
                            placeholder="Search assets..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-sm focus:border-primary/50 outline-none transition-all"
                        />
                    </div>
                    <button className="bg-white/5 border border-white/10 p-3 rounded-xl hover:bg-white/10 transition-all">
                        <Filter className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {!isConnected && (
                <div className="bg-primary/10 border border-primary/20 rounded-2xl p-6 text-center">
                    <TrendingUp className="w-8 h-8 text-primary mx-auto mb-3" />
                    <h4 className="text-lg font-bold mb-1">Connect your Wallet</h4>
                    <p className="text-sm text-gray-400">Connect MetaMask to see live market depth and start trading tokenized assets.</p>
                </div>
            )}

            <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-xl">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-white/10 bg-white/5">
                            <th className="p-6 text-xs font-black uppercase tracking-widest text-gray-400">Asset</th>
                            <th className="p-6 text-xs font-black uppercase tracking-widest text-gray-400">Price (ETH)</th>
                            <th className="p-6 text-xs font-black uppercase tracking-widest text-gray-400">24h Vol</th>
                            <th className="p-6 text-xs font-black uppercase tracking-widest text-gray-400">Total Supply</th>
                            <th className="p-6"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {filteredTokens.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="p-20 text-center text-gray-500 italic">
                                    No active markets found.
                                </td>
                            </tr>
                        ) : filteredTokens.map((t, i) => (
                            <tr 
                                key={i} 
                                onClick={() => onSelect(t)}
                                className="hover:bg-white/5 transition-colors cursor-pointer group"
                            >
                                <td className="p-6">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center font-bold text-primary">
                                            {t.symbol[0]}
                                        </div>
                                        <div>
                                            <p className="font-bold text-white mb-0.5">{t.name}</p>
                                            <p className="text-xs text-gray-400">{t.symbol}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="p-6 font-bold text-xl">{t.price}</td>
                                <td className="p-6 text-gray-400 font-medium">{t.volume} ETH</td>
                                <td className="p-6 text-gray-400 font-medium">{Number(t.supply).toLocaleString()}</td>
                                <td className="p-6 text-right">
                                    <button className="p-2 bg-white/5 rounded-lg group-hover:bg-primary group-hover:text-black transition-all">
                                        <ChevronRight className="w-5 h-5" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default TradeMarketplace;
