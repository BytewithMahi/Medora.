import { useRef, useMemo } from 'react';
import { useFrame, useLoader } from '@react-three/fiber';
import { Float, MeshDistortMaterial, MeshWobbleMaterial, Sparkles, useTexture, Text } from '@react-three/drei';
import * as THREE from 'three';

const OrbitingParticles = ({ count = 20 }: { count?: number }) => {
  const points = useMemo(() => {
    const p = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const radius = 2.5 + Math.random() * 0.5;
      p[i * 3] = Math.cos(angle) * radius;
      p[i * 3 + 1] = (Math.random() - 0.5) * 0.5;
      p[i * 3 + 2] = Math.sin(angle) * radius;
    }
    return p;
  }, [count]);

  const ref = useRef<THREE.Points>(null);
  useFrame((state) => {
    if (ref.current) {
      ref.current.rotation.y = state.clock.getElapsedTime() * 0.5;
    }
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={points.length / 3}
          array={points}
          itemSize={3}
          args={[points, 3]}
        />
      </bufferGeometry>
      <pointsMaterial size={0.05} color="#06b6d4" transparent opacity={0.6} />
    </points>
  );
};

const MedoraCoin = () => {
  const coinRef = useRef<THREE.Group>(null);
  const texture = useTexture('/medora/medoracoin_logo.png'); 

  useFrame((state) => {
    if (coinRef.current) {
      // Rotation
      coinRef.current.rotation.y += 0.01;
      // Hover tilt based on mouse
      coinRef.current.rotation.x = THREE.MathUtils.lerp(
        coinRef.current.rotation.x,
        state.pointer.y * 0.2,
        0.1
      );
      coinRef.current.rotation.z = THREE.MathUtils.lerp(
        coinRef.current.rotation.z,
        -state.pointer.x * 0.2,
        0.1
      );
    }
  });

  return (
    <Float speed={2} rotationIntensity={0.5} floatIntensity={1}>
      <group ref={coinRef}>
        {/* Main Coin Body */}
        <mesh>
          <cylinderGeometry args={[1.5, 1.5, 0.2, 64]} />
          <meshStandardMaterial 
            color="#1e293b" 
            metalness={0.9} 
            roughness={0.1}
            emissive="#06b6d4"
            emissiveIntensity={0.2}
          />
        </mesh>
        
        {/* Front Face with Logo */}
        <mesh position={[0, 0, 0.11]}>
          <circleGeometry args={[1.4, 64]} />
          <meshStandardMaterial 
            map={texture} 
            transparent={true}
            metalness={0.8}
            roughness={0.2}
          />
        </mesh>

        {/* Back Face */}
        <mesh position={[0, 0, -0.11]} rotation={[0, Math.PI, 0]}>
          <circleGeometry args={[1.4, 64]} />
          <meshStandardMaterial 
            map={texture} 
            transparent={true}
            metalness={0.8}
            roughness={0.2}
          />
        </mesh>

        {/* Outer Glow Ring */}
        <mesh rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[1.55, 0.02, 16, 100]} />
            <meshBasicMaterial color="#06b6d4" transparent opacity={0.8} />
        </mesh>

        <OrbitingParticles count={40} />
        <Sparkles count={50} scale={4} size={2} speed={0.4} opacity={0.5} color="#06b6d4" />
      </group>
    </Float>
  );
};

export default MedoraCoin;
