import { motion, AnimatePresence } from 'framer-motion';
import { Microchip, Link, BarChart3, ShieldAlert, Rocket } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';

const features = [
  {
    icon: ShieldAlert,
    title: 'AI Counterfeit Detection',
    description: 'Computer vision algorithms verify packaging integrity and detect micro-anomalies instantly.',
    color: 'from-red-500/20 to-orange-500/5',
    borderColor: 'border-red-500/50'
  },
  {
    icon: Link,
    title: 'Blockchain Tracking',
    description: 'Every handoff is permanently recorded on an immutable ledger, ensuring 100% transparent history.',
    color: 'from-blue-500/20 to-cyan-500/5',
    borderColor: 'border-blue-500/50'
  },
  {
    icon: BarChart3,
    title: 'Smart Demand Prediction',
    description: 'ML models analyze localized health data to predict medicine shortages before they happen.',
    color: 'from-purple-500/20 to-pink-500/5',
    borderColor: 'border-purple-500/50'
  },
  {
    icon: Microchip,
    title: 'IoT Real-time Monitoring',
    description: 'Live telemetry data for temperature-sensitive biologics ensuring cold-chain compliance.',
    color: 'from-emerald-500/20 to-teal-500/5',
    borderColor: 'border-emerald-500/50'
  }
];

// Stack coordinates (messy pile)
const stackPositions = [
  { rotate: -4, x: -10, y: 10, zIndex: 4 },
  { rotate: 3, x: 5, y: -5, zIndex: 3 },
  { rotate: -2, x: 8, y: 5, zIndex: 2 },
  { rotate: 5, x: -5, y: -8, zIndex: 1 },
];

// Fan out coordinates
const fanPositions = [
  { rotate: -15, x: -350, y: 0, zIndex: 4 },
  { rotate: -5, x: -120, y: -20, zIndex: 4 },
  { rotate: 5, x: 120, y: -20, zIndex: 4 },
  { rotate: 15, x: 350, y: 0, zIndex: 4 },
];

export default function Features() {
  const [isHovered, setIsHovered] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [trail, setTrail] = useState<{ x: number, y: number, id: number }[]>([]);
  const sectionRef = useRef<HTMLElement>(null);
  const trailId = useRef(0);

  useEffect(() => {
    let interval: any;
    if (isHovered) {
      interval = setInterval(() => {
        setTrail((prev) => {
          const newTrail = [...prev, { x: mousePos.x, y: mousePos.y, id: trailId.current++ }];
          if (newTrail.length > 15) newTrail.shift();
          return newTrail;
        });
      }, 50);
    } else {
      setTrail([]); // Clear trail when leaving
    }
    return () => clearInterval(interval);
  }, [isHovered, mousePos]);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (sectionRef.current) {
      const rect = sectionRef.current.getBoundingClientRect();
      setMousePos({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    }
  };

  return (
    <section 
      ref={sectionRef}
      className={`relative min-h-screen py-24 px-4 z-10 w-full overflow-hidden flex flex-col items-center justify-center ${isHovered ? 'cursor-none' : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onMouseMove={handleMouseMove}
    >
      
      {/* Custom Rocket Cursor */}
      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute z-50 pointer-events-none flex items-center justify-center"
            style={{ 
              left: mousePos.x, 
              top: mousePos.y, 
              x: '-50%', 
              y: '-50%' 
            }}
          >
            <Rocket className="w-8 h-8 text-orange-400 rotate-45 filter drop-shadow-[0_0_10px_rgba(251,146,60,0.8)]" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Fuel Trail */}
      {isHovered && trail.map((pt, i) => (
        <motion.div
          key={pt.id}
          initial={{ opacity: 0.8, scale: 1 }}
          animate={{ opacity: 0, scale: 0 }}
          transition={{ duration: 0.8 }}
          className="absolute z-40 pointer-events-none rounded-full blur-[2px]"
          style={{
            left: pt.x,
            top: pt.y,
            width: 8 + (i % 4),
            height: 8 + (i % 4),
            backgroundColor: i % 2 === 0 ? '#f97316' : '#fef08a', // orange / yellow mix
            transform: 'translate(-50%, -50%)',
            boxShadow: '0 0 10px #fb923c'
          }}
        />
      ))}

      <div className="text-center mb-20 pointer-events-none">
        <h2 className="text-5xl font-bold mb-4 text-glow bg-clip-text text-transparent bg-gradient-to-r from-white to-cyan-200">
          Platform Capabilities
        </h2>
        <p className="text-lg text-slate-300 max-w-2xl mx-auto">
          Hover over the module stack to fan out our next-generation technologies.
        </p>
      </div>

      {/* Card Pile */}
      <div 
        className="relative w-full max-w-[300px] h-[400px] mx-auto flex items-center justify-center pointer-events-auto cursor-none group"
      >
        {features.map((feature, index) => {
          const Icon = feature.icon;
          const pos = isHovered ? fanPositions[index] : stackPositions[index];
          
          return (
            <motion.div
              key={index}
              animate={{ 
                x: pos.x, 
                y: pos.y, 
                rotate: pos.rotate,
                zIndex: isHovered ? pos.zIndex + 10 : pos.zIndex // bring to front on hover
              }}
              transition={{ type: "spring", stiffness: 70, damping: 15 }}
              whileHover={isHovered ? { scale: 1.05, zIndex: 50, rotate: 0 } : {}}
              className={`absolute w-[280px] h-[350px] p-8 rounded-3xl glassmorphism border shadow-2xl ${feature.borderColor} overflow-hidden`}
              style={{
                boxShadow: isHovered ? '0 20px 40px rgba(0,0,0,0.5)' : '0 10px 20px rgba(0,0,0,0.3)'
              }}
            >
              {/* Animated background gradient */}
              <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-80 pointer-events-none`} />
              
              <div className="relative z-10 flex flex-col h-full bg-background/50 backdrop-blur-sm p-4 rounded-xl border border-white/10">
                <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center mb-6 shadow-inner">
                  <Icon className="w-7 h-7 text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-white">
                  {feature.title}
                </h3>
                <p className="text-slate-300 leading-relaxed text-sm font-light">
                  {feature.description}
                </p>
                <div className="mt-auto pt-4 flex items-center text-xs font-semibold text-primary uppercase tracking-wider">
                  Module Data <Microchip className="w-3 h-3 ml-2" />
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
