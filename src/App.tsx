import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, AlertCircle, ShieldCheck } from 'lucide-react';
import Scene from './components/Scene';
import Hero from './components/Hero';
import AboutUs from './components/AboutUs';
import SupplyChainFlow from './components/SupplyChainFlow';
import Features from './components/Features';
import MedicineProof from './components/MedicineProof';
import AIDemandInsights from './components/AIDemandInsights';
import AuthModal from './components/AuthModal';
import ManufacturerDashboard from './components/dashboards/ManufacturerDashboard';
import DistributorDashboard from './components/dashboards/DistributorDashboard';
import RetailerDashboard from './components/dashboards/RetailerDashboard';
import CustomerDashboard from './components/dashboards/CustomerDashboard';
import AdminDashboard from './components/dashboards/AdminDashboard';

import VerificationPage from './components/VerificationPage';
import MedoraChat from './components/MedoraChat';

type Role = 'Manufacturer' | 'Distributor' | 'Retailer' | 'Customer' | 'Admin' | 'Verify' | null;

function App() {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [authInitialRole, setAuthInitialRole] = useState<Role>(null);
  const [activeRole, setActiveRole] = useState<Role>(null);

  const [verifyParams, setVerifyParams] = useState<{ batch: string; token: string } | null>(null);
  const [userEmail, setUserEmail] = useState<string>('');
  const [userPasskey, setUserPasskey] = useState<string>(''); // For chat encryption
  const [isChatView, setIsChatView] = useState(false);

  // Handle URL parsing for Verification Link on Load
  useEffect(() => {
    const pathname = window.location.pathname;
    const params = new URLSearchParams(window.location.search);
    const verify = params.get('verify') === 'true' || pathname === '/verify';
    const batch = params.get('batch');
    const token = params.get('token');
    const chat = params.get('chat');

    if (verify && batch && token) {
      setVerifyParams({ batch, token });
      setActiveRole('Verify');
    }

    if (chat === 'true') {
      setIsChatView(true);
      // Auto-open login if not authenticated
      setTimeout(() => {
        setIsAuthModalOpen(true);
      }, 500);
    }
  }, []);

  return (
    <main className="relative bg-background text-foreground min-h-screen overflow-hidden selection:bg-primary/30">
      {/* Only show global Scene if not in a dashboard / chat */}
      {(!activeRole && !isChatView) && <Scene />}

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
          <span className="text-2xl font-black tracking-widest text-white uppercase text-glow pointer-events-auto cursor-pointer" onClick={() => { setIsChatView(false); setActiveRole(null); }}>
            Medora
          </span>
        </div>

        <div className="flex items-center gap-4 pointer-events-auto">
          {/* Medora* Chat Link Button */}
          <a
            href="?chat=true"
            target="_blank"
            className="px-4 py-2 bg-primary/20 border border-primary/50 hover:bg-primary/30 text-primary font-black rounded-full shadow-[0_0_10px_rgba(6,182,212,0.4)] transition-all hover:scale-105 backdrop-blur-md flex items-center gap-1 text-sm md:text-base border-glow"
          >
            Medora*
          </a>

          {activeRole ? (
            <button
              onClick={() => { setActiveRole(null); setIsChatView(false); }}
              className="px-5 py-2 md:px-6 md:py-2.5 bg-white/5 border border-white/10 hover:bg-white/10 text-white font-semibold rounded-full backdrop-blur-md transition-all hover:border-white/20 hover:scale-105"
            >
              {activeRole === 'Customer' ? 'Home' : 'Log Out'}
            </button>
          ) : !isChatView && (
            <>
              <button
                title="Admin Control Panel"
                onClick={() => { setAuthMode('login'); setAuthInitialRole('Admin'); setIsAuthModalOpen(true); }}
                className="p-2 mr-2 text-white/30 hover:text-red-400 border border-transparent hover:border-red-500/30 rounded-full transition-all hover:bg-red-500/10"
              >
                <ShieldCheck className="w-5 h-5" />
              </button>
              <button
                onClick={() => { setAuthMode('login'); setAuthInitialRole(null); setIsAuthModalOpen(true); }}
                className="px-5 py-2 md:px-6 md:py-2.5 bg-white/5 border border-white/10 hover:bg-white/10 text-white font-semibold rounded-full backdrop-blur-md transition-all hover:border-white/20 hover:scale-105"
              >
                Sign In
              </button>
              <button
                onClick={() => { setAuthMode('register'); setAuthInitialRole(null); setIsAuthModalOpen(true); }}
                className="group relative px-5 py-2 md:px-6 md:py-2.5 bg-white text-black font-bold rounded-full overflow-hidden transition-all hover:scale-105 hover:shadow-[0_0_20px_rgba(255,255,255,0.4)]"
              >
                <span className="relative z-10">Register</span>
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform ease-out" />
              </button>
            </>
          )}
        </div>
      </motion.header>

      {/* Content wrapper */}
      {isChatView ? (
        <div className="relative z-10 w-full min-h-screen pt-24 text-white flex items-center justify-center p-4">
          {activeRole ? (
            <MedoraChat
              currentUserEmail={userEmail}
              currentUserRole={activeRole}
              currentUserPasskey={userPasskey}
              onBack={() => setIsChatView(false)}
            />
          ) : (
            <div className="text-center text-white/50">
              <AlertCircle className="w-12 h-12 text-primary mx-auto mb-4 animate-bounce" />
              <p className="text-xl font-bold text-white">Authentication Required</p>
              <p className="text-sm mt-1">Please log in to access the secure Medora* network.</p>
            </div>
          )}
        </div>
      ) : !activeRole ? (
        <div className="relative z-10 w-full overflow-y-auto h-screen snap-y snap-mandatory scroll-smooth">
          <div className="snap-start min-h-screen">
            <Hero onCheckBatch={() => setActiveRole('Customer')} />
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
          <div className="snap-start min-h-screen flex items-center justify-center shrink-0 w-full">
            <AIDemandInsights />
          </div>
        </div>
      ) : (
        <div className="relative z-10 w-full min-h-screen overflow-y-auto pt-24 text-white">
          <AnimatePresence mode="wait">
            {verifyParams ? (
              <motion.div key="verify" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <VerificationPage
                  batch={verifyParams.batch}
                  token={verifyParams.token}
                  currentUserRole={activeRole === 'Verify' || activeRole === null ? 'Customer' : activeRole}
                  currentEmail={userEmail}
                  onBack={() => {
                    setVerifyParams(null);
                    if (activeRole === 'Verify') {
                      setActiveRole(null);
                    }
                    // Clear URL params
                    const url = new URL(window.location.href);
                    url.search = '';
                    window.history.replaceState({}, '', url.toString());
                  }}
                />
              </motion.div>
            ) : (
              <>
                {activeRole === 'Manufacturer' && (
                  <motion.div key="manufacturer" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <ManufacturerDashboard userEmail={userEmail} />
                  </motion.div>
                )}
                {activeRole === 'Distributor' && (
                  <motion.div key="distributor" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <DistributorDashboard userEmail={userEmail} onScanVerify={(batch: string, token: string) => { setVerifyParams({ batch, token }); }} />
                  </motion.div>
                )}
                {activeRole === 'Retailer' && (
                  <motion.div key="retailer" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <RetailerDashboard userEmail={userEmail} onScanVerify={(batch: string, token: string) => { setVerifyParams({ batch, token }); }} />
                  </motion.div>
                )}
                {activeRole === 'Customer' && (
                  <motion.div key="customer" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <CustomerDashboard userEmail={userEmail} onScanVerify={(batch: string, token: string) => { setVerifyParams({ batch, token }); }} />
                  </motion.div>
                )}
                {activeRole === 'Admin' && (
                  <motion.div key="admin" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <AdminDashboard />
                  </motion.div>
                )}
              </>
            )}
          </AnimatePresence>
        </div>
      )}

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        initialMode={authMode}
        initialRole={authInitialRole as any}
        onLogin={(role: any, email, passkey) => {
          setActiveRole(role);
          setUserEmail(email);
          setUserPasskey(passkey || ''); // Save for crypto lookup
        }}
      />
    </main>
  );
}

export default App;
