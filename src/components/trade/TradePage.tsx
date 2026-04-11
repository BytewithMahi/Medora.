import React, { Suspense, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import { 
  TrendingUp, 
  Shield, 
  Cpu, 
  Layers, 
  ArrowUpRight, 
  Wallet,
  PieChart,
  Home,
  LayoutDashboard,
  ShoppingBag
} from 'lucide-react';
import MedoraCoin from './elements/MedoraCoin';
import TradeBackground from './elements/TradeBackground';
import TradeDashboard from './internal/TradeDashboard';
import TradeMarketplace from './internal/TradeMarketplace';
import AssetDetail from './internal/AssetDetail';
import TradeNavbar from './elements/TradeNavbar';
import { useWeb3 } from '../../context/Web3Context';
import { ethers } from 'ethers';

// --- Components ---

const GlassCard = ({ children, className = "", onClick }: { children: React.ReactNode, className?: string, onClick?: () => void }) => (
  <motion.div 
    whileHover={{ y: -5, scale: 1.02 }}
    onClick={onClick}
    className={`bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl transition-all duration-300 hover:border-primary/50 hover:shadow-primary/20 cursor-pointer ${className}`}
  >
    {children}
  </motion.div>
);

const SectionTitle = ({ title, subtitle }: { title: string, subtitle?: string }) => (
  <div className="mb-12 text-center pt-20">
    <motion.h2 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      className="text-4xl md:text-5xl font-black bg-gradient-to-r from-white via-white to-primary/50 bg-clip-text text-transparent mb-4"
    >
      {title}
    </motion.h2>
    {subtitle && (
      <motion.p 
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="text-gray-400 max-w-2xl mx-auto"
      >
        {subtitle}
      </motion.p>
    )}
  </div>
);

// --- Sections ---

const HeroSection = ({ onExplore }: { onExplore: () => void }) => {
  const { isConnected, connect, isConnecting } = useWeb3();

  return (
    <section className="relative h-[90vh] w-full flex items-center justify-center overflow-hidden">
      {/* 3D Scene Background */}
      <div className="absolute inset-0 z-0 opacity-60">
        <Canvas>
          <PerspectiveCamera makeDefault position={[0, 0, 8]} />
          <ambientLight intensity={0.5} />
          <pointLight position={[10, 10, 10]} intensity={2} color="#06b6d4" />
          <Suspense fallback={null}>
            <MedoraCoin />
            <TradeBackground />
            <OrbitControls enableZoom={false} enablePan={false} rotateSpeed={0.5} />
          </Suspense>
        </Canvas>
      </div>

      {/* Content Overlay */}
      <div className="relative z-10 container mx-auto px-6 text-center pt-20">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 border border-primary/20 rounded-full text-primary text-xs font-black uppercase tracking-widest mb-8">
            <TrendingUp className="w-3 h-3" /> Live on Sepolia Testnet
          </div>
          
          <h1 className="text-6xl md:text-8xl font-black tracking-tighter mb-6 bg-gradient-to-b from-white to-white/40 bg-clip-text text-transparent leading-[0.9]">
            Simplifying Crypto <br /> <span className="text-primary italic">For Everyone</span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-400 mb-10 max-w-3xl mx-auto font-medium">
            Trade, invest, and own tokenized trust. The world's first hybrid supply-chain liquidity platform.
          </p>
          
          <div className="flex flex-col md:flex-row items-center justify-center gap-6">
            {!isConnected ? (
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={connect}
                className="px-10 py-4 bg-primary text-black font-black rounded-2xl shadow-[0_0_30px_rgba(6,182,212,0.4)] hover:shadow-primary/60 transition-all text-lg flex items-center gap-3"
              >
                <Wallet className="w-5 h-5" />
                {isConnecting ? 'Connecting...' : 'Connect Wallet'}
              </motion.button>
            ) : (
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onExplore()}
                className="px-10 py-4 bg-primary text-black font-black rounded-2xl shadow-[0_0_30px_rgba(6,182,212,0.4)] hover:shadow-primary/60 transition-all text-lg flex items-center gap-3"
              >
                <ShoppingBag className="w-5 h-5" /> Enter Markets
              </motion.button>
            )}
            <motion.button 
              whileHover={{ scale: 1.05 }}
              onClick={onExplore}
              className="px-10 py-4 bg-white/5 backdrop-blur-md border border-white/20 text-white font-bold rounded-2xl hover:bg-white/10 transition-all text-lg"
            >
              Explore Assets
            </motion.button>
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => window.open('/medora/trade?portal=manufacturer', '_blank')}
              className="px-10 py-4 bg-purple-500/20 border border-purple-500/50 text-purple-400 font-bold rounded-2xl hover:bg-purple-500/30 transition-all text-lg flex items-center gap-2 border-glow"
            >
              <Cpu className="w-5 h-5" />
              For Manufacturers
            </motion.button>
          </div>
        </motion.div>
      </div>

      {/* Scroll Indicator */}
      <motion.div 
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="absolute bottom-10 left-1/2 -translate-x-1/2 text-white/20"
      >
        <div className="w-6 h-10 border-2 border-white/20 rounded-full flex justify-center p-1">
          <div className="w-1 h-2 bg-primary rounded-full" />
        </div>
      </motion.div>
    </section>
  );
};

const FeaturesSection = () => {
  const features = [
    { icon: <TrendingUp className="w-8 h-8 text-primary" />, title: "Decentralized Trading", desc: "Pure peer-to-peer liquidity without intermediaries." },
    { icon: <Shield className="w-8 h-8 text-purple-500" />, title: "Secure Transactions", desc: "Multi-sig protection and E2EE verification." },
    { icon: <Cpu className="w-8 h-8 text-blue-500" />, title: "AI Matching", desc: "Predictive algorithms for best available trade pairs." },
    { icon: <Layers className="w-8 h-8 text-emerald-500" />, title: "Tokenized Trust", desc: "Convert reputation into tradeable yield-bearing assets." }
  ];

  return (
    <section className="py-24 container mx-auto px-6">
      <SectionTitle title="The Future of Liquidity" subtitle="Next-generation tools designed for both institutional and individual traders." />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {features.map((f, i) => (
          <GlassCard key={i} className="group overflow-hidden">
            <div className="mb-6 p-4 bg-white/5 rounded-xl inline-block group-hover:bg-primary/20 transition-colors">
              {f.icon}
            </div>
            <h3 className="text-xl font-bold mb-3">{f.title}</h3>
            <p className="text-gray-400 text-sm leading-relaxed">{f.desc}</p>
          </GlassCard>
        ))}
      </div>
    </section>
  );
};

const MarketplaceSection = ({ onSelect }: { onSelect: (asset?: any) => void }) => {
  const { contracts, isConnected } = useWeb3();
  const [tokens, setTokens] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const mockTokens = [
    { name: "Medora Labs", symbol: "MLAB", price: "0.0012", change: "+5.2%", color: "text-primary" },
    { name: "Trust Pharma", symbol: "TRST", price: "0.0450", change: "-1.8%", color: "text-red-500" },
    { name: "SupplyCore", symbol: "SULT", price: "0.0089", change: "+12.4%", color: "text-emerald-500" },
    { name: "BioGen", symbol: "BGN", price: "0.0002", change: "+0.2%", color: "text-blue-500" }
  ];

  useEffect(() => {
    const fetchLandingTokens = async () => {
      if (!contracts.registry || !contracts.marketplace) {
        setTokens(mockTokens);
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const manufacturers = await contracts.registry.getAllManufacturers();
        const fetched: any[] = [];

        // Fetch top 4 tokens
        for (const mAddr of manufacturers.slice(0, 4)) {
          const tAddr = await contracts.registry.getManufacturerToken(mAddr);
          if (tAddr === ethers.ZeroAddress) continue;

          const metadata = await contracts.registry.getTokenMetadata(tAddr);
          const poolState = await contracts.marketplace.getPoolState(tAddr);

          fetched.push({
            address: tAddr,
            name: metadata.name,
            symbol: metadata.symbol,
            price: ethers.formatEther(poolState.lastPrice),
            change: "+0.0%",
            color: "text-primary",
            isLive: true
          });
        }

        if (fetched.length > 0) {
          setTokens(fetched);
        } else {
          setTokens(mockTokens);
        }
      } catch (error) {
        console.error("Error fetching landing tokens:", error);
        setTokens(mockTokens);
      } finally {
        setIsLoading(false);
      }
    };

    if (isConnected) {
      fetchLandingTokens();
    } else {
      setTokens(mockTokens);
      setIsLoading(false);
    }
  }, [contracts, isConnected]);

  return (
    <section className="py-24 bg-primary/5 backdrop-blur-3xl border-y border-white/5">
      <div className="container mx-auto px-6">
        <SectionTitle title="Active Marketplace" subtitle="Real-time tokenized assets directly from the Medora supply chain ecosystem." />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {tokens.map((t, i) => (
            <GlassCard key={i} onClick={() => onSelect(t.isLive ? t : null)}>
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center border border-white/10">
                    <span className="text-xs font-bold text-primary">{t.symbol[0]}</span>
                  </div>
                  {t.isLive && (
                    <div className="px-2 py-0.5 rounded-full bg-primary/20 border border-primary/30 text-[8px] font-black uppercase text-primary animate-pulse">
                      Live
                    </div>
                  )}
                </div>
                <div className={`px-2 py-1 rounded-lg bg-white/5 text-xs font-bold ${t.color || 'text-primary'}`}>
                  {t.change}
                </div>
              </div>
              <h4 className="text-white font-bold text-lg mb-1">{t.name}</h4>
              <p className="text-3xl font-black mb-6">{Number(t.price).toFixed(4)} <span className="text-sm text-gray-500">ETH</span></p>
              <button className="w-full py-3 bg-white text-black font-bold rounded-xl hover:bg-white/80 transition-all flex items-center justify-center gap-2">
                {t.isLive ? 'Trade Asset' : 'View Detail'} <ArrowUpRight className="w-4 h-4" />
              </button>
            </GlassCard>
          ))}
        </div>
      </div>
    </section>
  );
};

const InvestmentSection = () => {
    const projects = [
        { name: "Apex Labs", score: 98, price: "$450.00", status: "High Growth" },
        { name: "GreenPharma", score: 92, price: "$120.50", status: "Stable" },
        { name: "SwiftLog", score: 85, price: "$32.10", status: "Emerging" }
    ];

    return (
        <section className="py-24 container mx-auto px-6">
            <SectionTitle title="Trust Investments" subtitle="Invest in verified entities with the highest trust scores in the network." />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {projects.map((p, i) => (
                    <GlassCard key={i} className="relative overflow-hidden">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-16 h-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin-slow flex items-center justify-center p-1">
                                <div className="w-full h-full bg-white/10 rounded-full flex items-center justify-center text-primary font-black">
                                    {p.score}
                                </div>
                            </div>
                            <div>
                                <h4 className="text-xl font-bold">{p.name}</h4>
                                <span className="text-xs font-bold text-primary uppercase tracking-widest">{p.status}</span>
                            </div>
                        </div>
                        <div className="space-y-4 mb-8">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-400">Current Token Price</span>
                                <span className="font-bold">{p.price}</span>
                            </div>
                            <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                                <motion.div 
                                    initial={{ width: 0 }}
                                    whileInView={{ width: `${p.score}%` }}
                                    className="h-full bg-gradient-to-r from-primary to-purple-500"
                                />
                            </div>
                        </div>
                        <button className="w-full py-4 border border-white/20 rounded-xl font-bold hover:bg-white/5 transition-colors">
                            View Deep Analytics
                        </button>
                    </GlassCard>
                ))}
            </div>
        </section>
    );
}

import ManufacturerTradeDashboard from './internal/ManufacturerTradeDashboard';

interface TradePageProps {
  userEmail?: string;
  userRole?: string;
}

const TradePage = ({ userEmail, userRole }: TradePageProps) => {
  const [activeView, setActiveView] = useState<'landing' | 'dashboard' | 'marketplace' | 'detail' | 'analytics' | 'manufacturer-portal'>('landing');
  const [selectedAsset, setSelectedAsset] = useState<any>(null);
  const { isConnected } = useWeb3();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('portal') === 'manufacturer' && userRole === 'Manufacturer') {
      setActiveView('manufacturer-portal');
    }
  }, [userRole]);

  const handleSelectAsset = (asset: any) => {
    if (asset) {
      setSelectedAsset(asset);
      setActiveView('detail');
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] text-white selection:bg-primary/50 relative overflow-x-hidden pt-16">
      <TradeNavbar onNavigate={(v: any) => setActiveView(v)} activeView={activeView} />

      <AnimatePresence mode="wait">
        {activeView === 'landing' && (
          <motion.div
            key="landing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <HeroSection onExplore={() => setActiveView('marketplace')} />
            <div className="relative">
              <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] -z-10" />
              <div className="absolute bottom-1/4 right-0 w-[600px] h-[600px] bg-purple-500/10 rounded-full blur-[150px] -z-10" />
              <FeaturesSection />
              <MarketplaceSection onSelect={handleSelectAsset} />
              <InvestmentSection />
            </div>
          </motion.div>
        )}

        <div className="pb-20 container mx-auto px-6 min-h-screen">
          {activeView === 'dashboard' && (
            <motion.div key="dashboard" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="pt-10">
              <TradeDashboard />
            </motion.div>
          )}
          {activeView === 'marketplace' && (
            <motion.div key="marketplace" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="pt-10">
              <TradeMarketplace onSelect={handleSelectAsset} userRole={userRole} />
            </motion.div>
          )}
          {activeView === 'detail' && (
            <motion.div key="detail" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.02 }} className="pt-10">
              <AssetDetail asset={selectedAsset} onBack={() => setActiveView('marketplace')} />
            </motion.div>
          )}
          {activeView === 'manufacturer-portal' && (
            <motion.div key="manufacturer-portal" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="pt-10">
              <ManufacturerTradeDashboard />
            </motion.div>
          )}
          {activeView === 'analytics' && (
             <motion.div key="analytics" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pt-10 flex items-center justify-center min-h-[60vh]">
                <div className="text-center">
                  <PieChart className="w-16 h-16 text-primary mx-auto mb-4 opacity-20" />
                  <h3 className="text-2xl font-bold">Network Activity</h3>
                  <p className="text-gray-500">Analytics dashboard coming soon in v2.1</p>
                </div>
             </motion.div>
          )}
        </div>
      </AnimatePresence>

      <footer className="py-12 border-t border-white/5 text-center text-gray-500">
        <p className="text-sm">© 2026 Medora Trade Protocol. All rights reserved.</p>
        <div className="flex justify-center gap-6 mt-4">
          <span className="hover:text-primary cursor-pointer transition-colors">Twitter</span>
          <span className="hover:text-primary cursor-pointer transition-colors">Discord</span>
          <span className="hover:text-primary cursor-pointer transition-colors">Docs</span>
        </div>
      </footer>
    </div>
  );
};

export default TradePage;
