import React from 'react';
import { motion } from 'framer-motion';
import { Search, Wallet, User, ChevronDown, Bell, LogOut } from 'lucide-react';
import { useWeb3 } from '../../../context/Web3Context';

interface TradeNavbarProps {
  onNavigate: (view: any) => void;
  activeView: string;
}

const TradeNavbar: React.FC<TradeNavbarProps> = ({ onNavigate, activeView }) => {
  const { account, balance, isConnected, isConnecting, connect, disconnect } = useWeb3();

  const formatAddress = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  return (
    <nav className="fixed top-0 left-0 w-full z-[100] flex items-center justify-between px-6 py-4 bg-black/40 backdrop-blur-2xl border-b border-white/5">
      {/* Left: Brand & Search */}
      <div className="flex items-center gap-8">
        <div 
          className="flex items-center gap-2 cursor-pointer group"
          onClick={() => onNavigate('landing')}
        >
          <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center border border-primary/50 group-hover:shadow-[0_0_15px_rgba(6,182,212,0.4)] transition-all">
            <span className="text-primary font-black text-lg italic">M</span>
          </div>
          <span className="text-xl font-black tracking-tight text-white uppercase hidden md:block">
            Medora <span className="text-primary italic">Trade</span>
          </span>
        </div>

        <div className="relative hidden lg:block overflow-hidden">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <input 
            type="text" 
            placeholder="Search markets..." 
            className="w-80 bg-white/5 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-primary/50 transition-all text-white placeholder:text-white/20"
          />
        </div>
      </div>

      {/* Middle: Links */}
      <div className="hidden md:flex items-center gap-6">
        {[
          { id: 'marketplace', label: 'Markets' },
          { id: 'dashboard', label: 'Portfolio' },
          { id: 'analytics', label: 'Activity' },
        ].map((link) => (
          <button
            key={link.id}
            onClick={() => onNavigate(link.id as any)}
            className={`text-sm font-bold transition-all relative py-1 ${
              activeView === link.id ? 'text-primary' : 'text-gray-400 hover:text-white'
            }`}
          >
            {link.label}
            {activeView === link.id && (
              <motion.div layoutId="nav-underline" className="absolute bottom-0 left-0 w-full h-0.5 bg-primary shadow-[0_0_10px_rgba(6,182,212,0.8)]" />
            )}
          </button>
        ))}
      </div>

      {/* Right: Wallet & Account */}
      <div className="flex items-center gap-4">
        {isConnected && (
          <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-sm font-bold text-gray-300">{Number(balance).toFixed(4)} ETH</span>
          </div>
        )}

        <div className="flex items-center gap-2">
          <button className="p-2.5 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors text-white/60 hover:text-white">
            <Bell className="w-4 h-4" />
          </button>
          
          {!isConnected ? (
            <button
              onClick={connect}
              disabled={isConnecting}
              className="flex items-center gap-2 px-5 py-2.5 bg-primary text-black font-black rounded-xl hover:shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all disabled:opacity-50"
            >
              <Wallet className="w-4 h-4" />
              {isConnecting ? 'Connecting...' : 'Connect'}
            </button>
          ) : (
            <div className="group relative">
              <button
                className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/20 rounded-xl hover:bg-white/10 transition-all"
              >
                <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-primary to-purple-500 flex items-center justify-center text-[10px] font-black">
                  {account?.slice(2, 4).toUpperCase()}
                </div>
                <span className="text-sm font-bold hidden sm:block">{formatAddress(account!)}</span>
                <ChevronDown className="w-4 h-4 text-white/40 group-hover:text-white transition-colors" />
              </button>

              {/* Dropdown */}
              <div className="absolute top-full right-0 mt-2 w-48 py-2 bg-[#020617] border border-white/10 rounded-2xl shadow-3xl opacity-0 translate-y-2 pointer-events-none group-hover:opacity-100 group-hover:translate-y-0 group-hover:pointer-events-auto transition-all">
                <button 
                  onClick={() => onNavigate('dashboard')}
                  className="w-full px-4 py-2 flex items-center gap-3 hover:bg-white/5 text-sm text-gray-400 hover:text-white transition-colors"
                >
                  <User className="w-4 h-4" /> Profile
                </button>
                <div className="h-px bg-white/5 my-1 mx-2" />
                <button 
                  onClick={disconnect}
                  className="w-full px-4 py-2 flex items-center gap-3 hover:bg-red-500/10 text-sm text-red-500 transition-colors"
                >
                  <LogOut className="w-4 h-4" /> Disconnect
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default TradeNavbar;
