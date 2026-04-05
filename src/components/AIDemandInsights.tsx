import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ThermometerSnowflake, Sun, Droplets, Flame } from 'lucide-react';

const seasonalData = [
  {
    id: 'winter',
    season: 'Winter',
    icon: <ThermometerSnowflake className="w-8 h-8 text-cyan-400" />,
    items: [
      { name: 'Paracetamol', type: 'High Demand' },
      { name: 'Cough Syrup', type: 'High Demand' }
    ],
    bg: 'bg-cyan-500/5',
    border: 'border-cyan-500/20',
    glow: 'shadow-[0_0_30px_rgba(6,182,212,0.15)]'
  },
  {
    id: 'summer',
    season: 'Summer',
    icon: <Sun className="w-8 h-8 text-yellow-400" />,
    items: [
      { name: 'ORS', type: 'High Demand' },
      { name: 'Glucose', type: 'High Demand' }
    ],
    bg: 'bg-yellow-500/5',
    border: 'border-yellow-500/20',
    glow: 'shadow-[0_0_30px_rgba(234,179,8,0.15)]'
  },
  {
    id: 'rainy',
    season: 'Rainy',
    icon: <Droplets className="w-8 h-8 text-blue-400" />,
    items: [
      { name: 'Antibiotics', type: 'High Demand' },
      { name: 'Cold & Flu', type: 'High Demand' }
    ],
    bg: 'bg-blue-500/5',
    border: 'border-blue-500/20',
    glow: 'shadow-[0_0_30px_rgba(59,130,246,0.15)]'
  }
];

const AIDemandInsights: React.FC = () => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % seasonalData.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const current = seasonalData[index];

  return (
    <section className="py-24 relative overflow-hidden w-full flex flex-col items-center justify-center">
      <div className="w-full max-w-4xl px-4 relative z-10 flex flex-col items-center">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-widest mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            Predictive AI
          </div>
          <h2 className="text-4xl md:text-5xl font-black text-white mb-4">
            🚀 AI Demand Insights
          </h2>
          <p className="text-white/40 max-w-xl mx-auto">
            Our neural engine analyzes global health trends to forecast seasonal pharmaceutical requirements.
          </p>
        </motion.div>

        <div className="relative h-[300px] flex items-center justify-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={current.id}
              initial={{ opacity: 0, scale: 0.9, x: 20 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.9, x: -20 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className={`w-full max-w-md ${current.bg} ${current.border} border backdrop-blur-xl rounded-3xl p-8 ${current.glow} relative group`}
            >
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-white/5 rounded-2xl border border-white/10 group-hover:scale-110 transition-transform">
                    {current.icon}
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-white">{current.season}</h3>
                    <p className="text-xs text-white/40 font-mono">SEASONAL FORECAST</p>
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-[10px] font-bold text-white/30 uppercase tracking-tighter">Confidence</span>
                  <span className="text-emerald-400 font-black text-xl">94%</span>
                </div>
              </div>

              <div className="space-y-4">
                {current.items.map((item: { name: string; type: string }, i: number) => (
                  <motion.div
                    key={item.name}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 + i * 0.1 }}
                    className="flex items-center justify-between p-4 bg-white/5 border border-white/5 rounded-2xl hover:bg-white/10 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Flame className="w-4 h-4 text-orange-500 animate-pulse" />
                      <span className="text-white font-semibold">{item.name}</span>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-1 bg-orange-500/10 text-orange-400 rounded-full border border-orange-500/20 uppercase">
                      {item.type}
                    </span>
                  </motion.div>
                ))}
              </div>

              {/* Decorative elements */}
              <div className="absolute -bottom-2 -right-2 w-24 h-24 bg-white/5 rounded-full blur-2xl pointer-events-none group-hover:bg-primary/10 transition-colors" />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Background Orbs */}
      <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-64 h-64 bg-primary/5 rounded-full blur-[100px] animate-pulse" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-[120px] animate-pulse delay-1000" />
    </section>
  );
};

export default AIDemandInsights;
