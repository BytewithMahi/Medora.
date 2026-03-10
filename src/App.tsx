import { motion } from 'framer-motion';
import { Activity } from 'lucide-react';
import Scene from './components/Scene';
import Hero from './components/Hero';
import AboutUs from './components/AboutUs';
import SupplyChainFlow from './components/SupplyChainFlow';
import Features from './components/Features';
import MedicineProof from './components/MedicineProof';

function App() {
  return (
    <main className="relative bg-background text-foreground min-h-screen overflow-hidden selection:bg-primary/30">
      <Scene />
      
      {/* Fixed Top Logo */}
      <motion.header 
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 1, type: "spring" }}
        className="fixed top-0 left-0 w-full p-6 z-50 flex items-center justify-between pointer-events-none"
      >
        <div className="flex items-center gap-3">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
            className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center border border-primary/50 shadow-[0_0_15px_rgba(6,182,212,0.6)]"
          >
            <Activity className="w-5 h-5 text-primary" />
          </motion.div>
          <span className="text-2xl font-black tracking-widest text-white uppercase text-glow pointer-events-auto cursor-pointer">
            Medora
          </span>
        </div>

        <div className="flex items-center gap-4 pointer-events-auto">
          <button className="px-5 py-2 md:px-6 md:py-2.5 bg-white/5 border border-white/10 hover:bg-white/10 text-white font-semibold rounded-full backdrop-blur-md transition-all hover:border-white/20 hover:scale-105">
            Sign In
          </button>
          <button className="group relative px-5 py-2 md:px-6 md:py-2.5 bg-white text-black font-bold rounded-full overflow-hidden transition-all hover:scale-105 hover:shadow-[0_0_20px_rgba(255,255,255,0.4)]">
            <span className="relative z-10">Register</span>
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform ease-out" />
          </button>
        </div>
      </motion.header>

      {/* Content wrapper with scrollable area */}
      <div className="relative z-10 w-full overflow-y-auto h-screen snap-y snap-mandatory scroll-smooth">
        <div className="snap-start min-h-screen">
          <Hero />
        </div>
        <div className="snap-start min-h-screen">
          <AboutUs />
        </div>
        <div className="snap-start min-h-screen flex items-center">
          <SupplyChainFlow />
        </div>
        <div className="snap-start min-h-screen flex items-center">
          <Features />
        </div>
        <div className="snap-start min-h-screen flex items-center">
          <MedicineProof />
        </div>
      </div>
    </main>
  );
}

export default App;
