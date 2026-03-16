import { motion } from 'framer-motion';
import { Factory, Truck, Activity, UserCircle } from 'lucide-react';

const steps = [
  { id: 1, title: 'Manufacturer', icon: Factory, x: 20, y: 50 },
  { id: 2, title: 'Distributor', icon: Truck, x: 40, y: 50 },
  { id: 3, title: 'Pharmacy', icon: Activity, x: 60, y: 50 },
  { id: 4, title: 'Patient', icon: UserCircle, x: 80, y: 50 },
];

export default function SupplyChainFlow() {
  return (
    <section className="relative min-h-[80vh] flex flex-col items-center justify-center py-20 px-4 overflow-hidden z-10 w-full">
      <div className="absolute inset-0 bg-background mix-blend-multiply opacity-50 z-0"></div>
      
      <div className="relative z-10 w-full max-w-6xl mx-auto flex flex-col items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-20"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-glow bg-clip-text text-transparent bg-gradient-to-r from-blue-300 to-primary">
            Immutable Verification Flow
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Blockchain-backed nodes verifying authenticity at every step.
          </p>
        </motion.div>

        <div className="relative h-[400px] w-full mt-20 max-w-7xl mx-auto flex items-center justify-center">
          {/* Animated Line connecting the nodes */}
          <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 100">
            {/* Base faded line */}
            <path
              d="M 20 50 L 40 50 L 60 50 L 80 50"
              fill="transparent"
              stroke="rgba(6, 182, 212, 0.2)"
              strokeWidth="0.5"
            />
            {/* Animated drawing line on load */}
            <motion.path
              d="M 20 50 L 40 50 L 60 50 L 80 50"
              fill="transparent"
              stroke="rgba(6, 182, 212, 0.5)"
              strokeWidth="0.5"
              initial={{ pathLength: 0 }}
              whileInView={{ pathLength: 1 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 2.5, ease: "easeInOut" }}
            />
            {/* Continuous flowing data effect */}
            <motion.path
              d="M 20 50 L 40 50 L 60 50 L 80 50"
              fill="transparent"
              stroke="#06b6d4"
              strokeWidth="1"
              strokeDasharray="5 10"
              animate={{
                strokeDashoffset: [0, -15] 
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
                ease: "linear"
              }}
              style={{
                filter: 'drop-shadow(0 0 8px rgba(6,182,212,0.8))'
              }}
            />
          </svg>

          {/* Nodes */}
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={step.id}
                initial={{ opacity: 0, scale: 0 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.6 + 0.5 }}
                className="absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-6"
                style={{ left: `${step.x}%`, top: `${step.y}%` }}
              >
                <div className="relative group">
                  <div className="absolute -inset-6 bg-primary/20 rounded-full blur-2xl group-hover:bg-primary/40 transition-colors"></div>
                  <div className="relative w-24 h-24 sm:w-32 sm:h-32 rounded-full glassmorphism flex items-center justify-center border-primary/50 text-white shadow-[0_0_30px_rgba(6,182,212,0.5)] group-hover:scale-110 transition-transform cursor-pointer overflow-hidden backdrop-blur-3xl">
                    <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/10 to-purple-500/10" />
                    <Icon className="w-10 h-10 sm:w-14 sm:h-14 relative z-10" />
                  </div>
                </div>
                <span className="font-bold text-white tracking-widest uppercase text-lg sm:text-xl glassmorphism px-6 py-2 rounded-full whitespace-nowrap border-white/10 shadow-lg">
                  {step.title}
                </span>
                
                {/* Floating particles around node */}
                <motion.div
                  animate={{ y: [0, -15, 0], opacity: [0, 1, 0] }}
                  transition={{ duration: 2, repeat: Infinity, delay: index * 0.3 }}
                  className="absolute -top-10 w-3 h-3 bg-purple-400 rounded-full blur-[2px]"
                />
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
