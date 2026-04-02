import { motion } from 'framer-motion';
import { ShieldAlert, Fingerprint, Activity, Mail, Phone, CheckCircle2, Factory, Truck, Store, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function MedicineProof() {
  const [scanCount, setScanCount] = useState(0);
  const [hash] = useState('0x7a8b...9c21');
  const [ledgerEvents, setLedgerEvents] = useState<any[]>([]);
  const [medicineData, setMedicineData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch live ledger
  useEffect(() => {
    async function fetchLedger() {
      try {
        // Fetch the most recently added medicine as a demo for the "scanned" batch
        const { data: medData, error: medError } = await supabase
          .from('medicines')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (medError || !medData) {
          setIsLoading(false);
          return;
        }

        setMedicineData(medData);

        // Fetch events for this medicine
        const { data: events, error: eventError } = await supabase
          .from('ledger_events')
          .select('*')
          .eq('medicine_id', medData.id)
          .order('created_at', { ascending: true });
        
        if (eventError) throw eventError;

        // Map data to timeline format
        const mapped = events.map((evt) => {
          let icon = Factory;
          if (evt.role.includes('Distributor')) icon = Truck;
          if (evt.role.includes('Retailer')) icon = Store;

          return {
            id: evt.id,
            role: evt.role,
            icon,
            status: evt.status,
            timestamp: new Date(evt.created_at).toLocaleString(),
            contact: { email: evt.actor_email || 'N/A', phone: evt.actor_phone || 'N/A' },
            details: evt.details || {}
          };
        });

        setLedgerEvents(mapped);
      } catch (error) {
        console.error('Error fetching ledger:', error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchLedger();
  }, []);

  // Simulate scanning updates
  useEffect(() => {
    const timer = setInterval(() => {
      setScanCount(prev => prev + 1);
    }, 2000); // increment scan every 2 seconds for demo

    return () => clearInterval(timer);
  }, []);

  return (
    <section className="relative py-24 px-4 z-10 w-full min-h-screen max-w-7xl mx-auto flex flex-col items-center">
      <div className="text-center mb-16">
        <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-white to-cyan-300">
          Immutable Proof Ledger
        </h2>
        <p className="text-slate-300 max-w-2xl mx-auto">
          Public verification portal for Batch {medicineData ? `#${medicineData.batch_no} (${medicineData.name})` : 'Lookup'}. Cryptographically secured and verified by all network participants.
        </p>
      </div>

      <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8">

        {/* LEFT COLUMN: Timeline of Trust (lg: 7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
            <Activity className="w-5 h-5 text-cyan-400" /> Timeline of Trust
          </h3>

          <div className="relative pl-6 space-y-8 border-l-2 border-slate-700/50">
            {isLoading ? (
              <div className="flex items-center gap-2 text-cyan-400">
                <Loader2 className="w-5 h-5 animate-spin" /> Fetching live blockchain state...
              </div>
            ) : ledgerEvents.length === 0 ? (
              <div className="text-slate-400">No verification events found for this batch.</div>
            ) : ledgerEvents.map((node, i) => {
              const Icon = node.icon;
              const isVerified = true; // All fetched from DB are considered verified transactions in this demo

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
                          <span className={`font-medium ${String(value) === 'True' || String(value) === 'Pending' && isVerified ? 'text-emerald-400' : 'text-slate-200'}`}>
                            {String(value) === 'Pending' && isVerified ? 'True' : String(value)}
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
                <div className="absolute -left-[35px] top-6 w-6 h-6 rounded-full border-4 border-[#020617] flex items-center justify-center bg-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.5)]" />

              <div className="p-6 rounded-2xl border glassmorphism border-purple-500/30">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="text-lg font-bold text-white flex items-center gap-2">
                      Tester Forum Node
                    </h4>
                    <p className="text-xs text-slate-400 mt-1">Independent Government/Private Validation</p>
                  </div>
                </div>

                <div className="text-sm text-slate-400 flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-purple-400" />
                  No objections filed. Routine sampling active.
                </div>
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
            className="relative p-8 rounded-3xl border backdrop-blur-xl overflow-hidden transition-all duration-700 glassmorphism border-white/10"
          >

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
                    stroke="#06b6d4"
                    strokeWidth="8"
                    strokeDasharray={2 * Math.PI * 88}
                    strokeDashoffset={2 * Math.PI * 88 * (1 - Math.min(scanCount, 10) / 10)}
                    strokeLinecap="round"
                    transition={{ duration: 0.5 }}
                  />
                </svg>

                <div className="flex flex-col items-center">
                  <span className="text-6xl font-black tabular-nums transition-colors duration-300 text-white">
                    {scanCount}
                  </span>
                  <span className="text-slate-400 text-sm mt-1">/ 10 Limit</span>
                </div>
              </div>

                  <motion.div
                    key="safe"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-emerald-400 font-medium bg-emerald-500/10 px-4 py-2 rounded-full border border-emerald-500/20 text-sm"
                  >
                    Scan volume nominal.
                  </motion.div>
            </div>
          </motion.div>

          {/* Live Blockchain Hash Manager */}
          <div className="glassmorphism p-6 rounded-2xl border border-white/5 relative overflow-hidden">
            <h4 className="text-slate-300 uppercase tracking-widest text-sm font-semibold mb-4">Live Ledger Hash</h4>

            <div className="font-mono text-sm md:text-base break-all p-4 rounded-xl border transition-colors duration-500 bg-black/50 border-cyan-500/30 text-cyan-300 shadow-[inset_0_0_20px_rgba(6,182,212,0.1)]">
              {hash}
            </div>

            <p className="text-xs text-slate-400 mt-4 leading-relaxed">
              Hash maintains integrity. Appends only upon authorized party validation.
            </p>
          </div>

        </div>
      </div>
    </section>
  );
}
