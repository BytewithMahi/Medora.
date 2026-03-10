import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Float } from '@react-three/drei';

function Pill({ position, delay }: { position: [number, number, number], delay: number }) {
  const ref = useRef<THREE.Mesh>(null);
  const initialY = position[1];
  
  useFrame(({ clock }) => {
    if (ref.current) {
      const t = clock.getElapsedTime() - delay;
      if (t > 0) {
        // Fall down animation
        const drop = (t * 2) % 4; // Reset after dropping 4 units
        ref.current.position.y = initialY - drop;
        ref.current.rotation.x = t * 2;
        ref.current.rotation.z = t;
        
        // Fade out as it drops
        const material = ref.current.material as THREE.MeshPhysicalMaterial;
        material.opacity = 1 - (drop / 4);
      } else {
        ref.current.position.y = initialY;
        const material = ref.current.material as THREE.MeshPhysicalMaterial;
        material.opacity = 0; // hidden until delay
      }
    }
  });

  return (
    <mesh ref={ref} position={position}>
      <capsuleGeometry args={[0.1, 0.4, 16, 16]} />
      <meshPhysicalMaterial 
        color="#06b6d4" 
        emissive="#06b6d4"
        emissiveIntensity={0.2}
        roughness={0.1}
        metalness={0.5}
        transparent={true}
      />
    </mesh>
  );
}

export default function PillBox() {
  const lidRef = useRef<THREE.Mesh>(null);
  const boxGroupRef = useRef<THREE.Group>(null);
  
  // Create an array of pills
  const pills = useMemo(() => Array.from({ length: 15 }).map((_, i) => ({
    id: i,
    position: [
      (Math.random() - 0.5) * 0.8,
      0,
      (Math.random() - 0.5) * 0.8
    ] as [number, number, number],
    delay: Math.random() * 2 // Stagger the spills
  })), []);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    // Slowly float and rotate the main box
    if (boxGroupRef.current) {
      boxGroupRef.current.rotation.y = Math.sin(t * 0.5) * 0.5;
      boxGroupRef.current.rotation.x = Math.PI / 8 + Math.sin(t * 0.5) * 0.1; // Tilted towards camera
    }
    // Keep lid open
    if (lidRef.current) {
      lidRef.current.rotation.x = -Math.PI / 1.5; 
    }
  });

  return (
    <Float speed={2} rotationIntensity={0.5} floatIntensity={1}>
      <group ref={boxGroupRef} scale={1.2}>
        
        {/* Box Base (Container) */}
        <mesh position={[0, -0.5, 0]}>
          <boxGeometry args={[1.5, 1, 1.5]} />
          <meshPhysicalMaterial 
            color="#a855f7" 
            emissive="#a855f7"
            emissiveIntensity={0.2}
            roughness={0}
            transmission={0.9}
            ior={1.5}
            transparent={true}
            opacity={0.8}
            clearcoat={1}
          />
        </mesh>

        {/* Box Lid (Opened) */}
        <group position={[0, 0, -0.75]}>
          <mesh ref={lidRef} position={[0, 0, 0.75]}>
            <boxGeometry args={[1.5, 0.1, 1.5]} />
            <meshPhysicalMaterial 
              color="#06b6d4" 
              roughness={0.2}
              transmission={0.5}
              transparent={true}
            />
          </mesh>
        </group>

        {/* Spilling Pills */}
        {pills.map((pill) => (
          <Pill key={pill.id} position={pill.position} delay={pill.delay} />
        ))}
      </group>
    </Float>
  );
}
