import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Factory, Truck, Store, HeartPulse, X, ChevronLeft, ShieldCheck, Mail, Lock } from 'lucide-react';

interface AuthOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode: 'login' | 'register';
}

type Role = 'manufacturer' | 'distributor' | 'retailer' | 'customer' | null;

const roles = [
  {
    id: 'manufacturer',
    title: 'Manufacturer',
    description: 'Factory and medical production',
    icon: Factory,
    color: 'from-blue-500/20 to-blue-600/5',
    borderColor: 'border-blue-500/50',
    glowColor: 'shadow-[0_0_30px_rgba(59,130,246,0.3)]',
  },
  {
    id: 'distributor',
    title: 'Distributor',
    description: 'Logistics and supply chain',
    icon: Truck,
    color: 'from-teal-500/20 to-teal-600/5',
    borderColor: 'border-teal-500/50',
    glowColor: 'shadow-[0_0_30px_rgba(20,184,166,0.3)]',
  },
  {
    id: 'retailer',
    title: 'Retailer',
    description: 'Pharmacy stores and clinics',
    icon: Store,
    color: 'from-purple-500/20 to-purple-600/5',
    borderColor: 'border-purple-500/50',
    glowColor: 'shadow-[0_0_30px_rgba(168,85,247,0.3)]',
  },
  {
    id: 'customer',
    title: 'Customer',
    description: 'Patients and end users',
    icon: HeartPulse,
    color: 'from-pink-500/20 to-pink-600/5',
    borderColor: 'border-pink-500/50',
    glowColor: 'shadow-[0_0_30px_rgba(236,72,153,0.3)]',
  },
] as const;

export default function AuthOverlay({ isOpen, onClose, initialMode }: AuthOverlayProps) {
  const [selectedRole, setSelectedRole] = useState<Role>(null);
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);

  // Update mode when initialMode changes
  React.useEffect(() => {
    setMode(initialMode);
    setSelectedRole(null);
  }, [initialMode, isOpen]);

  const handleClose = () => {
    setSelectedRole(null);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden bg-black/80 backdrop-blur-xl"
        >
          {/* Animated Background Elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-[100px] animate-pulse" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '1s' }} />
            
            {/* Grid overlay */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_50%,#000_20%,transparent_100%)]" />
          </div>

          <button
            onClick={handleClose}
            className="absolute top-6 right-6 p-2 rounded-full bg-white/5 border border-white/10 text-white hover:bg-white/10 hover:scale-110 transition-all z-50"
          >
            <X className="w-6 h-6" />
          </button>

          <div className="relative z-10 w-full max-w-6xl px-4 perspective-[2000px]">
            <motion.div
              layout
              className="text-center mb-12"
              initial={{ y: -50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <h2 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-teal-400 to-purple-400 uppercase tracking-wider mb-4">
                {selectedRole ? 'Secure Access' : 'Select Your Role'}
              </h2>
              <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                {selectedRole 
                  ? `Enter your credentials to access the ${selectedRole} portal.`
                  : 'Join our blockchain-secured medical supply chain network. Choose your segment to continue.'}
              </p>
            </motion.div>

            <div className="relative h-[450px] w-full max-w-5xl mx-auto flex items-center justify-center">
              <AnimatePresence mode="wait">
                {!selectedRole ? (
                  <motion.div
                    key="role-selection"
                    initial={{ opacity: 0, rotateX: -20, scale: 0.9 }}
                    animate={{ opacity: 1, rotateX: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9, filter: 'blur(10px)' }}
                    transition={{ duration: 0.5, type: 'spring' }}
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full"
                  >
                    {roles.map((role, idx) => {
                      const Icon = role.icon;
                      return (
                        <motion.div
                          key={role.id}
                          initial={{ opacity: 0, y: 50 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.1 * idx + 0.3, type: 'spring' }}
                          whileHover={{ y: -10, scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setSelectedRole(role.id as Role)}
                          className={`relative group cursor-pointer h-full border ${role.borderColor} rounded-3xl bg-gradient-to-br ${role.color} backdrop-blur-md p-6 flex flex-col items-center justify-center text-center transition-all duration-300 hover:${role.glowColor}`}
                        >
                          <div className="absolute inset-0 bg-white/5 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
                          <div className={`w-20 h-20 rounded-2xl bg-black/30 border border-white/10 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:shadow-[0_0_20px_rgba(255,255,255,0.2)] transition-all duration-300`}>
                            <Icon className="w-10 h-10 text-white" />
                          </div>
                          <h3 className="text-2xl font-bold text-white mb-2">{role.title}</h3>
                          <p className="text-gray-400 text-sm">{role.description}</p>
                          
                          <div className="absolute bottom-6 opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
                            <span className="text-xs font-semibold uppercase tracking-wider text-white/70 border border-white/20 rounded-full py-1 px-3">
                              Select
                            </span>
                          </div>
                        </motion.div>
                      );
                    })}
                  </motion.div>
                ) : (
                  <motion.div
                    key="auth-form"
                    initial={{ opacity: 0, rotateY: 90, scale: 0.9 }}
                    animate={{ opacity: 1, rotateY: 0, scale: 1 }}
                    exit={{ opacity: 0, rotateY: -90, scale: 0.9 }}
                    transition={{ duration: 0.6, type: 'spring', bounce: 0.3 }}
                    className="absolute inset-0 flex items-center justify-center"
                  >
                    <div className="w-full max-w-md bg-black/40 border border-white/10 backdrop-blur-2xl rounded-3xl p-8 relative shadow-[0_0_50px_rgba(0,0,0,0.5)]">
                      <button
                        onClick={() => setSelectedRole(null)}
                        className="absolute top-6 left-6 p-2 rounded-full bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 transition-colors flex items-center gap-2"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>

                      <div className="text-center mb-8 mt-2">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/5 border border-white/10 mb-4">
                          {React.createElement(
                            roles.find((r) => r.id === selectedRole)?.icon || ShieldCheck,
                            { className: "w-8 h-8 text-primary" }
                          )}
                        </div>
                        <h3 className="text-2xl font-bold text-white capitalize">
                          {selectedRole} {mode === 'login' ? 'Login' : 'Registration'}
                        </h3>
                      </div>

                      <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
                        <div className="space-y-4">
                          {mode === 'register' && (
                            <div className="relative">
                              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <ShieldCheck className="w-5 h-5 text-gray-500" />
                              </div>
                              <input
                                type="text"
                                placeholder="Organization Name"
                                className="w-full bg-black/50 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white placeholder:text-gray-500 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                              />
                            </div>
                          )}
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                              <Mail className="w-5 h-5 text-gray-500" />
                            </div>
                            <input
                              type="email"
                              placeholder="Email Address"
                              className="w-full bg-black/50 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white placeholder:text-gray-500 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                            />
                          </div>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                              <Lock className="w-5 h-5 text-gray-500" />
                            </div>
                            <input
                              type="password"
                              placeholder="Password"
                              className="w-full bg-black/50 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white placeholder:text-gray-500 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                            />
                          </div>
                        </div>

                        <button className="w-full relative group mt-6 px-6 py-3 bg-gradient-to-r from-blue-600 to-teal-600 text-white font-bold rounded-xl overflow-hidden transition-all hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(20,184,166,0.4)]">
                          <span className="relative z-10">{mode === 'login' ? 'Authenticate' : 'Complete Registration'}</span>
                          <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform ease-out" />
                        </button>
                      </form>

                      <div className="mt-6 text-center">
                        <button 
                          onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
                          className="text-gray-400 hover:text-white transition-colors text-sm"
                        >
                          {mode === 'login' 
                            ? "Don't have an account? Register instead" 
                            : "Already have an account? Sign in"}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
