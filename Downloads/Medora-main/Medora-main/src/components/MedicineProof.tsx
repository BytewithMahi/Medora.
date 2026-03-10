import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, Fingerprint, Activity, Clock, Mail, Phone, AlertTriangle, CheckCircle2, Factory, Truck, Store } from 'lucide-react';
import { useState, useEffect } from 'react';

// Simulated data for the Proof timeline
const timelineData = [
  {
    id: 'producer',
    role: 'Producer Initialization',
    icon: Factory,
    status: 'verified',
    timestamp: '2026-03-08 08:00:00 UTC',
    contact: { email: 'ops@medorapharma.com', phone: '+1-555-0192' },
    details: {
      'Medicine Name': 'Vax-Pro-2',
      'Composition': 'mRNA-1273, Lipids, Tromethamine',
      'Mfg Date': '2026-03-01',
      'Expiry Date': '2026-09-01',
      'Batch No': 'AX-792-B',
    }
  },
  {
    id: 'distributor',
    role: 'Distributor Verification',
    icon: Truck,
    status: 'verified',
    timestamp: '2026-03-08 14:30:22 UTC',
    contact: { email: 'logistics@globaldist.net', phone: '+1-555-8831' },
    details: {
      'Expiry Match': 'True',
      'ID Match': 'True',
      'Composition Check': 'True',
      'Cold Chain Intact': 'True',
    }
  },
  {
    id: 'retailer',
    role: 'Retailer Verification',
    icon: Store,
    status: 'pending', // Will animate to verified
    timestamp: '2026-03-09 09:15:00 UTC',
    contact: { email: 'rx@citypharmacy.local', phone: '+1-555-4429' },
    details: {
      'Expiry Match': 'Pending',
      'ID Match': 'Pending',
      'Product Sealed': 'Pending',
    }
  }
];

export default function MedicineProof() {
  const [scanCount, setScanCount] = useState(0);
  const [hash, setHash] = useState('0x7a8b...9c21');
  const [isFraud, setIsFraud] = useState(false);
  const [testerAlert, setTesterAlert] = useState(false);
  const [retailerVerified, setRetailerVerified] = useState(false);

  // Simulate scanning updates
  useEffect(() => {
    const timer = setInterval(() => {
      setScanCount(prev => {
        const next = prev + 1;
        if (next === 3) setRetailerVerified(true);
        if (next > 10 && !isFraud) {
          setIsFraud(true);
          setHash('0xDEAD...FRAUD');
        }
        return next;
      });
    }, 2000); // increment scan every 2 seconds for demo

    return () => clearInterval(timer);
  }, [isFraud]);

  return (
    <section className="relative py-24 px-4 z-10 w-full min-h-screen max-w-7xl mx-auto flex flex-col items-center">
      <div className="text-center mb-16">
        <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-white to-cyan-300">
          Immutable Proof Ledger
        </h2>
        <p className="text-slate-300 max-w-2xl mx-auto">
          Public verification portal for Batch #AX-792-B. Cryptographically secured and verified by all network participants.
        </p>
      </div>

      <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT COLUMN: Timeline of Trust (lg: 7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
            <Activity className="w-5 h-5 text-cyan-400" /> Timeline of Trust
          </h3>
          
          <div className="relative pl-6 space-y-8 border-l-2 border-slate-700/50">
            {timelineData.map((node, i) => {
              const Icon = node.icon;
              const isVerified = node.id === 'retailer' ? retailerVerified : true;
              
              return (
                <motion.div 
                  key={node.id}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.2 }}
                  className="relative group"
                >
                  {/* Timeline Dot */}
                  <div className={`absolute -left-[35px] top-4 w-6 h-6 rounded-full border-4 border-[#020617] flex items-center justify-center transition-colors duration-500
                    ${isVerified ? 'bg-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.8)]' : 'bg-slate-600'}`
                  }>
                    {isVerified && <CheckCircle2 className="w-3 h-3 text-[var(--background)]" />}
                  </div>

                  {/* Node Card */}
                  <div className="glassmorphism p-6 rounded-2xl border border-white/5 hover:border-cyan-500/30 transition-colors">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-white/5">
                          <Icon className="w-5 h-5 text-slate-300" />
                        </div>
                        <div>
                          <h4 className="text-lg font-bold text-white">{node.role}</h4>
                          <p className={`text-xs font-mono mt-1 ${isVerified ? 'text-cyan-400' : 'text-slate-500'}`}>
                            {isVerified ? node.timestamp : 'Awaiting confirmation...'}
                          </p>
                        </div>
                      </div>
                      {/* Status Badge */}
                      <div className={`px-3 py-1 rounded-full text-xs font-semibold border backdrop-blur-md transition-colors
                        ${isVerified 
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                          : 'bg-slate-500/10 text-slate-400 border-slate-500/20'}`}
                      >
                        {isVerified ? 'Verified' : 'Pending'}
                      </div>
                    </div>

                    {/* Contact Info */}
                    <div className="flex flex-wrap gap-4 mb-4 text-xs text-slate-400 bg-white/5 p-3 rounded-lg">
                      <div className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" /> {node.contact.email}</div>
                      <div className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" /> {node.contact.phone}</div>
                    </div>

                    {/* Details Grid */}
                    <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-sm">
                      {Object.entries(node.details).map(([key, value]) => (
                        <div key={key} className="flex justify-between items-center border-b border-white/5 pb-1">
                          <span className="text-slate-400">{key}:</span>
                          <span className={`font-medium ${value === 'True' || value === 'Pending' && isVerified ? 'text-emerald-400' : 'text-slate-200'}`}>
                            {value === 'Pending' && isVerified ? 'True' : value}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              );
            })}

            {/* Special Tester Provision Node */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="relative mt-12"
            >
              <div className={`absolute -left-[35px] top-6 w-6 h-6 rounded-full border-4 border-[#020617] flex items-center justify-center transition-colors duration-500
                ${testerAlert ? 'bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.8)]' : 'bg-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.5)]'}`
              } />
              
              <div className={`p-6 rounded-2xl border transition-all duration-500
                ${testerAlert 
                  ? 'bg-red-500/10 border-red-500/50 shadow-[0_0_30px_rgba(239,68,68,0.2)]' 
                  : 'glassmorphism border-purple-500/30'}`}
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="text-lg font-bold text-white flex items-center gap-2">
                       Tester Forum Node
                    </h4>
                    <p className="text-xs text-slate-400 mt-1">Independent Government/Private Validation</p>
                  </div>
                  <button 
                    onClick={() => setTesterAlert(!testerAlert)}
                    className="px-3 py-1 bg-white/10 hover:bg-white/20 rounded text-xs text-white transition-colors"
                  >
                    {testerAlert ? 'Reset Status' : 'Simulate Objection'}
                  </button>
                </div>

                <AnimatePresence mode="wait">
                  {testerAlert ? (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="bg-red-950/50 rounded-lg p-4 border border-red-500/20"
                    >
                      <div className="flex items-start gap-3 text-red-400">
                        <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                        <div>
                          <strong className="block mb-1 text-red-300">OBJECTION FILED: Suspicious Circumstances Detected</strong>
                          <p className="text-sm text-red-200/80 mb-3">Independent tester 'GovReg-094' has marked this batch as false.</p>
                          <div className="bg-red-500/20 px-3 py-2 rounded border border-red-500/30 text-xs text-red-100 flex items-center gap-2">
                            <Mail className="w-4 h-4" /> 
                            Auto-generated Warning Mails Dispatched to: Producer, Distributor, Retailer, & Consumer.
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="text-sm text-slate-400 flex items-center gap-2"
                    >
                      <ShieldAlert className="w-4 h-4 text-purple-400" />
                      No objections filed. Routine sampling active.
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </div>
        </div>

        {/* RIGHT COLUMN: Fraud Detection & Hash Data (lg: 5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-6 mt-12 lg:mt-0">
          <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
            <Fingerprint className="w-5 h-5 text-purple-400" /> Network Integrity
          </h3>

          {/* QR Scan Counter Dial */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`relative p-8 rounded-3xl border backdrop-blur-xl overflow-hidden transition-all duration-700
              ${isFraud || testerAlert 
                ? 'bg-red-900/20 border-red-500/50 shadow-[0_0_50px_rgba(239,68,68,0.3)]' 
                : 'glassmorphism border-white/10'}`}
          >
            {/* Background warning pulse if fraud */}
            {(isFraud || testerAlert) && (
              <div className="absolute inset-0 bg-red-500/10 animate-[pulse_1s_ease-in-out_infinite]" />
            )}

            <div className="relative z-10 flex flex-col items-center text-center">
              <h4 className="text-slate-300 uppercase tracking-widest text-sm font-semibold mb-6">Unique QR Scan Count</h4>
              
              {/* Dial Visial */}
              <div className="relative w-48 h-48 flex items-center justify-center mb-6">
                {/* Outer Ring */}
                <svg className="absolute inset-0 w-full h-full -rotate-90">
                  <circle 
                    cx="96" cy="96" r="88" 
                    fill="none" 
                    stroke="rgba(255,255,255,0.05)" 
                    strokeWidth="8" 
                  />
                  <motion.circle 
                    cx="96" cy="96" r="88" 
                    fill="none" 
                    stroke={isFraud || testerAlert ? '#ef4444' : '#06b6d4'} 
                    strokeWidth="8"
                    strokeDasharray={2 * Math.PI * 88}
                    strokeDashoffset={2 * Math.PI * 88 * (1 - Math.min(scanCount, 10) / 10)}
                    strokeLinecap="round"
                    transition={{ duration: 0.5 }}
                  />
                </svg>
                
                <div className="flex flex-col items-center">
                  <span className={`text-6xl font-black tabular-nums transition-colors duration-300 ${isFraud || testerAlert ? 'text-red-400' : 'text-white'}`}>
                    {scanCount}
                  </span>
                  <span className="text-slate-400 text-sm mt-1">/ 10 Limit</span>
                </div>
              </div>

              {/* Status Message */}
              <AnimatePresence mode="wait">
                {(isFraud || testerAlert) ? (
                  <motion.div
                    key="fraud"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-2 text-red-400 font-bold text-lg bg-red-500/10 px-6 py-3 rounded-full border border-red-500/20"
                  >
                    <AlertTriangle className="w-6 h-6 animate-bounce" /> TRYING OF FRAUDS
                  </motion.div>
                ) : (
                  <motion.div
                    key="safe"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-emerald-400 font-medium bg-emerald-500/10 px-4 py-2 rounded-full border border-emerald-500/20 text-sm"
                  >
                    Scan volume nominal.
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>

          {/* Live Blockchain Hash Manager */}
          <div className="glassmorphism p-6 rounded-2xl border border-white/5 relative overflow-hidden">
            <h4 className="text-slate-300 uppercase tracking-widest text-sm font-semibold mb-4">Live Ledger Hash</h4>
            
            <div className={`font-mono text-sm md:text-base break-all p-4 rounded-xl border transition-colors duration-500
              ${isFraud || testerAlert 
                ? 'bg-red-950/50 border-red-500/30 text-red-400 shadow-[inset_0_0_20px_rgba(239,68,68,0.2)]' 
                : 'bg-black/50 border-cyan-500/30 text-cyan-300 shadow-[inset_0_0_20px_rgba(6,182,212,0.1)]'}`}
            >
              {hash}
            </div>
            
            <p className="text-xs text-slate-400 mt-4 leading-relaxed">
              {(isFraud || testerAlert) 
                ? 'Hash appended and locked. Form proven FALSE due to fraud trigger.' 
                : 'Hash maintains integrity. Appends only upon authorized party validation.'}
            </p>
          </div>

        </div>
      </div>
    </section>
  );
}
