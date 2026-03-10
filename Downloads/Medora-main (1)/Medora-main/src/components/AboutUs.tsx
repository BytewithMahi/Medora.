import { motion } from 'framer-motion';
import { Canvas } from '@react-three/fiber';
import { Suspense } from 'react';
import { Environment, Lightformer } from '@react-three/drei';
import PillBox from './PillBox';

export default function AboutUs() {
  return (
    <section className="relative min-h-screen flex items-center justify-center px-8 md:px-16 z-10 w-full overflow-hidden py-24">
      
      <div className="w-full max-w-7xl mx-auto flex flex-col-reverse lg:flex-row items-center gap-16">
        
        {/* LEFT: 3D Animated Pill Box */}
        <div className="w-full lg:w-1/2 h-[500px] relative pointer-events-auto">
          {/* Subtle background glow */}
          <div className="absolute inset-0 bg-cyan-500/20 rounded-full blur-[100px] -z-10" />
          
          <Canvas camera={{ position: [0, 0, 5], fov: 45 }}>
            <ambientLight intensity={0.5} />
            <directionalLight position={[10, 10, 5]} intensity={1.5} color="#ffffff" />
            <Suspense fallback={null}>
              <PillBox />
              
              <Environment preset="city">
                <Lightformer intensity={4} rotation-y={Math.PI / 2} position={[-5, 1, -1]} scale={[20, 0.1, 1]} />
                <Lightformer intensity={2} rotation-y={-Math.PI / 2} position={[10, 1, 0]} scale={[20, 1, 1]} />
              </Environment>
            </Suspense>
          </Canvas>
        </div>

        {/* RIGHT: About Us Text Reveal */}
        <div className="w-full lg:w-1/2 relative z-20">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, rotateX: 20 }}
            whileInView={{ opacity: 1, scale: 1, rotateX: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="glassmorphism-dark p-8 md:p-12 rounded-3xl border border-primary/20 shadow-[0_0_30px_rgba(168,85,247,0.2)] backdrop-blur-xl relative overflow-hidden"
          >
            {/* Inner dynamic light sweep */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-purple-500/10 to-transparent -translate-x-[100%] animate-[shimmer_3s_infinite]" />

            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-glow bg-clip-text text-transparent bg-gradient-to-r from-white via-purple-200 to-cyan-300">
              About Us
            </h2>
            
            <p className="text-lg md:text-xl text-slate-300 mb-6 font-light leading-relaxed">
              At <strong className="text-white">Medora</strong>, we believe the integrity of medicine should never be compromised. 
              We are a collective of rogue engineers, data scientists, and healthcare visionaries 
              building the unhackable ledger of life.
            </p>
            
            <p className="text-lg md:text-xl text-slate-300 font-light leading-relaxed">
              By merging hyper-advanced AI predictive models with an immutable blockchain foundation, 
              we ensure that every capsule, every vial, and every treatment arrives exactly as intended. 
              <strong>Absolute transparency. Zero counterfeit tolerance.</strong>
            </p>

            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.5, duration: 0.8 }}
              className="mt-10"
            >
              <button className="px-8 py-4 bg-white/5 border border-purple-500/30 hover:bg-purple-500/20 text-white font-semibold rounded-full backdrop-blur-md transition-all hover:border-purple-400 hover:scale-105">
                Our Mission &amp; Team
              </button>
            </motion.div>
          </motion.div>
        </div>

      </div>
    </section>
  );
}
