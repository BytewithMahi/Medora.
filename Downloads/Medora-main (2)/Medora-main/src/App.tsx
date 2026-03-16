import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity } from 'lucide-react';
import Scene from './components/Scene';
import Hero from './components/Hero';
import AboutUs from './components/AboutUs';
import SupplyChainFlow from './components/SupplyChainFlow';
import Features from './components/Features';
import MedicineProof from './components/MedicineProof';
import AuthModal from './components/AuthModal';
import ManufacturerDashboard from './components/dashboards/ManufacturerDashboard';
import DistributorDashboard from './components/dashboards/DistributorDashboard';
import RetailerDashboard from './components/dashboards/RetailerDashboard';
import CustomerDashboard from './components/dashboards/CustomerDashboard';
import AdminDashboard from './components/dashboards/AdminDashboard';

import VerificationPage from './components/VerificationPage';

type Role = 'Manufacturer' | 'Distributor' | 'Retailer' | 'Customer' | 'Admin' | 'Verify' | null;

function App() {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [activeRole, setActiveRole] = useState<Role>(null);
  
  const [verifyParams, setVerifyParams] = useState<{ batch: string; token: string } | null>(null);
  const [userEmail, setUserEmail] = useState<string>('');

  // Handle URL parsing for Verification Link on Load
  useState(() => {
    const params = new URLSearchParams(window.location.search);
    const verify = params.get('verify');
    const batch = params.get('batch');
    const token = params.get('token');

    if (verify === 'true' && batch && token) {
      setVerifyParams({ batch, token });
      setActiveRole('Verify');
    }
  });

  return (
    <main className="relative bg-background text-foreground min-h-screen overflow-hidden selection:bg-primary/30">
      {/* Only show global Scene if not in a dashboard (dashboards have their own 3D background) */}
      {!activeRole && <Scene />}

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
          {activeRole ? (
            <button
              onClick={() => setActiveRole(null)}
              className="px-5 py-2 md:px-6 md:py-2.5 bg-white/5 border border-white/10 hover:bg-white/10 text-white font-semibold rounded-full backdrop-blur-md transition-all hover:border-white/20 hover:scale-105"
            >
              {activeRole === 'Customer' ? 'Home' : 'Log Out'}
            </button>
          ) : (
            <>
              <button
                onClick={() => { setAuthMode('login'); setIsAuthModalOpen(true); }}
                className="px-5 py-2 md:px-6 md:py-2.5 bg-white/5 border border-white/10 hover:bg-white/10 text-white font-semibold rounded-full backdrop-blur-md transition-all hover:border-white/20 hover:scale-105"
              >
                Sign In
              </button>
              <button
                onClick={() => { setAuthMode('register'); setIsAuthModalOpen(true); }}
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
      {!activeRole ? (
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
        </div>
      ) : (
        <div className="relative z-10 w-full min-h-screen overflow-y-auto pt-24 text-white">
          <AnimatePresence mode="wait">
            {activeRole === 'Manufacturer' && (
              <motion.div key="manufacturer" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <ManufacturerDashboard />
              </motion.div>
            )}
            {activeRole === 'Distributor' && (
              <motion.div key="distributor" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <DistributorDashboard onScanVerify={(batch: string, token: string) => { setVerifyParams({ batch, token }); setActiveRole('Verify'); }} />
              </motion.div>
            )}
            {activeRole === 'Retailer' && (
              <motion.div key="retailer" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <RetailerDashboard onScanVerify={(batch: string, token: string) => { setVerifyParams({ batch, token }); setActiveRole('Verify'); }} />
              </motion.div>
            )}
            {activeRole === 'Customer' && (
              <motion.div key="customer" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <CustomerDashboard onScanVerify={(batch: string, token: string) => { setVerifyParams({ batch, token }); setActiveRole('Verify'); }} />
              </motion.div>
            )}
            {activeRole === 'Admin' && (
              <motion.div key="admin" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <AdminDashboard />
              </motion.div>
            )}
            {activeRole === 'Verify' && verifyParams && (
              <motion.div key="verify" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <VerificationPage 
                  batch={verifyParams.batch} 
                  token={verifyParams.token} 
                  currentUserRole={activeRole === 'Verify' ? 'Customer' : activeRole} // Default view
                  currentEmail={userEmail}
                  onBack={() => {
                    setVerifyParams(null);
                    setActiveRole(null);
                    // Clear URL params
                    const url = new URL(window.location.href);
                    url.search = '';
                    window.history.replaceState({}, '', url.toString());
                  }} 
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        initialMode={authMode}
        onLogin={(role, email) => {
          setActiveRole(role);
          setUserEmail(email);
        }}
      />
    </main>
  );
}

export default App;
