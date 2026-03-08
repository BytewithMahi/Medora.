import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { Canvas } from '@react-three/fiber';
import { Suspense } from 'react';
import DnaModel from './DnaModel';

export default function Hero() {
  return (
    <section className="relative h-screen flex items-center justify-between text-left px-8 md:px-16 z-10 w-full overflow-hidden">
      
      {/* LEFT: Frame Breaking Typography */}
      <div className="w-full lg:w-1/2 z-20 pt-20 relative">
        <motion.div
           initial={{ opacity: 0, x: -50 }}
           animate={{ opacity: 1, x: 0 }}
           transition={{ duration: 1, delay: 0.2 }}
        >
          <h1 className="text-[5rem] sm:text-[8rem] lg:text-[10rem] font-black leading-[0.85] tracking-tighter text-glow text-white mix-blend-difference mb-8">
            <span className="block text-primary/80">DECODE</span>
            <span className="block text-purple-400">THE</span>
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-primary">FUTURE.</span>
          </h1>
          
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 1 }}
            className="text-xl md:text-2xl text-slate-300 mb-12 max-w-lg font-light tracking-wide border-l-4 border-primary pl-6"
          >
            Pioneering the next era of immutable healthcare logistics through AI and Blockchain.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1, duration: 0.8 }}
            className="flex flex-col sm:flex-row gap-6"
          >
            <button className="group relative px-8 py-5 bg-white text-black font-bold text-lg rounded-full overflow-hidden transition-all hover:scale-105 hover:shadow-[0_0_30px_rgba(255,255,255,0.4)] flex items-center gap-3">
              <span className="relative z-10">Initialize Flow</span>
              <ArrowRight className="w-6 h-6 relative z-10 group-hover:translate-x-2 transition-transform" />
            </button>
          </motion.div>
        </motion.div>
      </div>

      {/* RIGHT: Big 3D DNA Model */}
      <div className="absolute lg:relative w-full lg:w-1/2 h-full right-0 top-0 opacity-40 lg:opacity-100 z-10 pointer-events-auto">
        <Canvas camera={{ position: [0, 0, 10], fov: 45 }}>
          <ambientLight intensity={1} />
          <directionalLight position={[10, 10, 10]} intensity={2} color="#06b6d4" />
          <directionalLight position={[-10, -10, -10]} intensity={1} color="#a855f7" />
          <Suspense fallback={null}>
            <DnaModel />
          </Suspense>
        </Canvas>
      </div>
      
    </section>
  );
}
