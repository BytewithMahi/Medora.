import React from 'react';
import { motion } from 'framer-motion';
import { BarChart3, TrendingUp, AlertTriangle, Snowflake, Sun, CloudRain, Flame } from 'lucide-react';

const fullSeasonalData = [
  {
    season: 'Winter',
    icon: <Snowflake className="w-5 h-5 text-cyan-400" />,
    color: 'border-cyan-500/20 bg-cyan-500/5',
    medicines: ['Paracetamol', 'Cough Syrup', 'Vitamin C'],
    trend: '+24% increase expected'
  },
  {
    season: 'Summer',
    icon: <Sun className="w-5 h-5 text-yellow-400" />,
    color: 'border-yellow-500/20 bg-yellow-500/5',
    medicines: ['ORS', 'Glucose', 'Sunscreen Pharma'],
    trend: '+18% increase expected'
  },
  {
    season: 'Rainy',
    icon: <CloudRain className="w-5 h-5 text-blue-400" />,
    color: 'border-blue-500/20 bg-blue-500/5',
    medicines: ['Antibiotics', 'Antifungals', 'Anti-Cold'],
    trend: '+32% increase expected'
  }
];

const SeasonalDemandFull: React.FC = () => {
  return (
    <div className="mt-12 glassmorphism-dark p-8 rounded-3xl relative overflow-hidden group">
      <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/5 rounded-full blur-[100px] pointer-events-none group-hover:bg-primary/10 transition-colors" />
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <BarChart3 className="w-7 h-7 text-primary" />
            📊 Seasonal Demand Insights
          </h2>
          <p className="text-white/40 text-sm mt-1">AI-driven predictive analysis for strategic production planning.</p>
        </div>
        <div className="px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-emerald-400" />
          <span className="text-emerald-400 text-xs font-bold uppercase tracking-wider">High Confidence Forecast</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        {fullSeasonalData.map((data, idx) => (
          <motion.div
            key={data.season}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className={`p-6 rounded-2xl border ${data.color} hover:scale-[1.02] transition-transform`}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-white/5 rounded-lg border border-white/10">
                {data.icon}
              </div>
              <h3 className="font-bold text-white text-lg">{data.season}</h3>
            </div>
            
            <div className="space-y-2 mb-4">
              {data.medicines.map((med) => (
                <div key={med} className="flex items-center gap-2 text-sm text-white/70">
                  <Flame className="w-3.5 h-3.5 text-orange-400" />
                  {med}
                </div>
              ))}
            </div>

            <div className="pt-4 border-t border-white/5">
              <span className="text-[10px] font-bold text-white/30 uppercase block mb-1">Projected Trend</span>
              <span className="text-white font-mono text-xs font-bold">{data.trend}</span>
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
            <h4 className="text-white font-bold mb-1 uppercase text-xs tracking-widest text-cyan-400">Prediction Summary</h4>
            <p className="text-white/80 leading-relaxed">
              Overall demand is expected to fluctuate across categories. High vigilance recommended for <span className="text-cyan-400 font-bold italic underline decoration-cyan-400/30">seasonal spikes</span>.
            </p>
          </div>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 flex items-start gap-4">
          <div className="p-3 bg-purple-400/10 rounded-xl border border-purple-400/20 shrink-0">
            <BarChart3 className="w-6 h-6 text-purple-400" />
          </div>
          <div>
            <h4 className="text-white font-bold mb-1 uppercase text-xs tracking-widest text-purple-400">Insight Reason</h4>
            <p className="text-white/80 leading-relaxed">
              Historical data shows <span className="text-purple-400 font-bold uppercase tracking-tighter">significant variance</span> based on weather patterns. Maintain active inventory buffers.
            </p>
          </div>
        </div>
      </div>

      <div className="mt-10 pt-10 border-t border-white/5">
        <h3 className="text-sm font-bold text-white/50 uppercase tracking-widest mb-6 flex items-center gap-2">
            <TrendingUp className="w-4 h-4" /> 📈 Top Demand Medicines
        </h3>
        <div className="flex flex-wrap gap-3">
            {['Paracetamol', 'Amoxicillin', 'Azithromycin', 'Vitamin C 500mg', 'Cough-Relief Plus'].map((med) => (
                <span key={med} className="px-4 py-2 bg-black/40 border border-white/10 rounded-lg text-sm text-white/80 hover:border-primary/50 transition-colors cursor-default">
                    {med}
                </span>
            ))}
        </div>
      </div>
    </div>
  );
};

export default SeasonalDemandFull;
