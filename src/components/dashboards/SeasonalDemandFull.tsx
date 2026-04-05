import React from 'react';
import { motion } from 'framer-motion';
import { BarChart3, TrendingUp, AlertTriangle, Sun, Flame } from 'lucide-react';

const fullSeasonalData = [
  {
    season: 'Summer',
    icon: <Sun className="w-6 h-6 text-yellow-400" />,
    medicines: [
      'ORS (Oral Rehydration)', 
      'Glucose-D Powder', 
      'Sunscreen Pharma-Grade', 
      'Anti-Histamines', 
      'Multivitamins Plus',
      'Anti-Diarrheal'
    ],
    trend: 'High Persistence ↗',
    color: 'border-yellow-500/20 bg-yellow-500/5',
    reason: 'Elevated temperatures and heatwave conditions'
  }
];

const SeasonalDemandFull: React.FC = () => {
  return (
    <div className="mt-8 glassmorphism-dark p-6 rounded-2xl relative overflow-hidden group">
      <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/5 rounded-full blur-[100px] pointer-events-none group-hover:bg-primary/10 transition-colors" />
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <BarChart3 className="w-7 h-7 text-primary" />
            📊 Summer Demand Report
          </h2>
          <p className="text-white/40 text-sm mt-1">Detailed predictive analysis for the current summer season as per medicine report.</p>
        </div>
        <div className="px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-emerald-400" />
          <span className="text-emerald-400 text-xs font-bold uppercase tracking-wider">High Confidence Forecast</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-1 max-w-2xl mx-auto mb-8">
        {fullSeasonalData.map((data, idx) => (
          <motion.div
            key={data.season}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: idx * 0.1 }}
            className={`p-6 rounded-2xl border ${data.color} hover:scale-[1.01] transition-transform shadow-[0_0_40px_rgba(255,255,150,0.05)]`}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                {data.icon}
              </div>
              <div>
                <h3 className="font-bold text-white text-xl">{data.season} Forecast</h3>
                <p className="text-xs text-white/40 font-mono tracking-widest uppercase">Active Demand Peak</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
              {data.medicines.map((med) => (
                <motion.div 
                  key={med} 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center gap-3 p-4 bg-white/5 border border-white/5 rounded-xl text-sm text-white/80"
                >
                  <Flame className="w-4 h-4 text-orange-500" />
                  {med}
                </motion.div>
              ))}
            </div>

            <div className="pt-6 border-t border-white/5 flex justify-between items-center">
              <div>
                <span className="text-[10px] font-bold text-white/30 uppercase block mb-1">Projected Trend</span>
                <span className="text-emerald-400 font-mono text-sm font-bold">{data.trend}</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold text-white/30 uppercase block mb-1">Primary Driver</span>
                <span className="text-white/60 text-xs">{data.reason}</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 flex items-start gap-4">
          <div className="p-3 bg-cyan-400/10 rounded-xl border border-cyan-400/20 shrink-0">
            <AlertTriangle className="w-6 h-6 text-cyan-400" />
          </div>
          <div>
            <h4 className="text-white font-bold mb-1 uppercase text-xs tracking-widest text-cyan-400">Inventory Strategy</h4>
            <p className="text-white/80 leading-relaxed text-sm">
              Increase production of <span className="text-cyan-400 font-bold italic underline decoration-cyan-400/30">hydration essentials</span> by 25% to meet peak summer demand.
            </p>
          </div>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 flex items-start gap-4">
          <div className="p-3 bg-purple-400/10 rounded-xl border border-purple-400/20 shrink-0">
            <BarChart3 className="w-6 h-6 text-purple-400" />
          </div>
          <div>
            <h4 className="text-white font-bold mb-1 uppercase text-xs tracking-widest text-purple-400">Market Insight</h4>
            <p className="text-white/80 leading-relaxed text-sm">
              Retailer orders for <span className="text-purple-400 font-bold uppercase tracking-tighter">digestive health</span> and skin protection are trending upward.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SeasonalDemandFull;
