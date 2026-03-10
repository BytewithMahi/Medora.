import { motion } from 'framer-motion';
import { Activity, Thermometer, MapPin } from 'lucide-react';

export default function DashboardPreview() {
  return (
    <section className="relative py-24 px-4 z-10 w-full max-w-6xl mx-auto flex flex-col items-center">
      <div className="text-center mb-16">
        <h2 className="text-4xl font-bold mb-4 text-white">Real-Time Telemetry</h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">Live dashboard monitoring conditions of shipment #AX-792.</p>
      </div>

      <div className="w-full relative">
        {/* Glow effect behind dashboard */}
        <div className="absolute inset-0 bg-primary/20 blur-[100px] rounded-full scale-75 opacity-50 z-0"></div>

        <motion.div 
          initial={{ opacity: 0, y: 100, rotateX: 20 }}
          whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1, type: "spring" }}
          style={{ perspective: 1000 }}
          className="relative z-10 w-full rounded-2xl glassmorphism-dark border-t border-l border-white/10 shadow-2xl overflow-hidden p-6 md:p-10"
        >
          {/* Dashboard Header */}
          <div className="flex justify-between items-center border-b border-white/10 pb-6 mb-8">
            <div className="flex items-center gap-4">
              <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,1)] animate-pulse" />
              <h3 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-primary">
                Shipment: Vax-Pro-2
              </h3>
            </div>
            <div className="px-4 py-2 rounded-full bg-secondary/20 text-secondary text-sm font-semibold border border-secondary/30">
              In Transit
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Timeline Column */}
            <div className="lg:col-span-1 space-y-6">
              <h4 className="text-sm uppercase tracking-widest text-muted-foreground mb-4">Chain of Custody</h4>
              
              <div className="relative pl-6 space-y-8 border-l border-white/10 ml-3">
                {[
                  { title: "Produced at Facility A", time: "08:00 AM", active: false },
                  { title: "Validated onto Blockchain", time: "08:15 AM", active: false },
                  { title: "Loaded onto Transport", time: "10:30 AM", active: false },
                  { title: "Current Location: Checkpoint 4", time: "In progress", active: true },
                ].map((item, i) => (
                  <div key={i} className="relative">
                    <div className={`absolute -left-8 w-4 h-4 rounded-full border-4 border-slate-900 ${item.active ? 'bg-primary shadow-[0_0_10px_rgba(6,182,212,1)]' : 'bg-slate-500'}`} />
                    <p className={`font-medium ${item.active ? 'text-white' : 'text-slate-400'}`}>{item.title}</p>
                    <p className="text-xs text-muted-foreground mt-1">{item.time}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Metrics Column */}
            <div className="lg:col-span-2 grid grid-cols-2 gap-4">
              {/* Temperature Chart Placeholder */}
              <div className="col-span-2 glassmorphism p-6 rounded-2xl border border-white/5 relative overflow-hidden group">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="text-sm font-medium text-slate-400">Cold Chain Temperature</h4>
                    <p className="text-3xl font-bold text-white mt-1">-82.4°C</p>
                  </div>
                  <Thermometer className="text-secondary w-8 h-8 opacity-70 group-hover:scale-110 transition-transform" />
                </div>
                
                {/* SVG Chart representation */}
                <svg className="w-full h-24 mt-4" viewBox="0 0 100 30" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="rgba(168,85,247,0.5)" />
                      <stop offset="100%" stopColor="rgba(168,85,247,0)" />
                    </linearGradient>
                  </defs>
                  <motion.path 
                    d="M 0 20 Q 10 15, 20 20 T 40 10 T 60 25 T 80 15 T 100 20" 
                    fill="none" 
                    stroke="#a855f7" 
                    strokeWidth="2"
                    initial={{ pathLength: 0 }}
                    whileInView={{ pathLength: 1 }}
                    transition={{ duration: 2 }}
                  />
                  <path 
                    d="M 0 20 Q 10 15, 20 20 T 40 10 T 60 25 T 80 15 T 100 20 L 100 30 L 0 30 Z" 
                    fill="url(#gradient)" 
                  />
                </svg>
              </div>

              {/* Integrity Metric */}
              <div className="glassmorphism p-6 rounded-2xl border border-white/5 flex flex-col justify-between">
                <div className="flex justify-between">
                  <h4 className="text-sm font-medium text-slate-400">Box Integrity</h4>
                  <Activity className="text-emerald-400 w-5 h-5" />
                </div>
                <div className="mt-4">
                  <p className="text-3xl font-bold text-white">99.8%</p>
                  <p className="text-xs text-emerald-400 mt-1">Seal Intact ✓</p>
                </div>
              </div>

              {/* Location Metric */}
              <div className="glassmorphism p-6 rounded-2xl border border-white/5 flex flex-col justify-between">
                <div className="flex justify-between">
                  <h4 className="text-sm font-medium text-slate-400">ETA to Pharmacy</h4>
                  <MapPin className="text-cyan-400 w-5 h-5" />
                </div>
                <div className="mt-4">
                  <p className="text-3xl font-bold text-white">1h 42m</p>
                  <p className="text-xs text-slate-400 mt-1">Traffic optimal</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
