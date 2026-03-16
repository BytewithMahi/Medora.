import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Environment, Lightformer, Stars, Sparkles, Float } from '@react-three/drei';
import { Suspense, useRef, useMemo } from 'react';
import * as THREE from 'three';

function Rig() {
  const { camera, pointer } = useThree();
  
  useFrame(() => {
    // Smoothly move the camera based on pointer position for a parallax effect
    camera.position.x = THREE.MathUtils.lerp(camera.position.x, pointer.x * 2, 0.05);
    camera.position.y = THREE.MathUtils.lerp(camera.position.y, pointer.y * 1, 0.05);
    camera.lookAt(0, 0, 0);
  });
  return null;
}

function AbstractCore() {
  const meshRef = useRef<THREE.Mesh>(null);
  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.x += 0.001;
      meshRef.current.rotation.y += 0.002;
    }
  });

  return (
    <Float speed={2} rotationIntensity={2} floatIntensity={1.5}>
      <mesh ref={meshRef} position={[0, 0, -5]}>
        <torusKnotGeometry args={[3, 0.4, 128, 32]} />
        <meshPhysicalMaterial 
          color="#06b6d4" 
          wireframe={true}
          emissive="#06b6d4"
          emissiveIntensity={0.5}
          transparent={true}
          opacity={0.3}
        />
      </mesh>
    </Float>
  );
}

function Asteroid({ position, scale, rotationSpeed }: { position: [number, number, number], scale: number, rotationSpeed: number }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const geom = useMemo(() => new THREE.IcosahedronGeometry(scale, 1), [scale]);
  // Randomize vertices to make it look like a rock
  useMemo(() => {
    const posAttribute = geom.attributes.position;
    for (let i = 0; i < posAttribute.count; i++) {
        posAttribute.setX(i, posAttribute.getX(i) + (Math.random() - 0.5) * 0.2 * scale);
        posAttribute.setY(i, posAttribute.getY(i) + (Math.random() - 0.5) * 0.2 * scale);
        posAttribute.setZ(i, posAttribute.getZ(i) + (Math.random() - 0.5) * 0.2 * scale);
    }
    geom.computeVertexNormals();
  }, [geom, scale]);

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.x += rotationSpeed;
      meshRef.current.rotation.y += rotationSpeed * 1.2;
    }
  });

  return (
    <Float speed={1} rotationIntensity={1} floatIntensity={2}>
      <mesh ref={meshRef} position={position} geometry={geom}>
        <meshStandardMaterial color="#334155" roughness={0.8} metalness={0.2} flatShading />
      </mesh>
    </Float>
  );
}

function FlyingRocket({ offset, speed, delay = 0 }: { offset: number, speed: number, delay?: number }) {
  const groupRef = useRef<THREE.Group>(null);
  
  useFrame(({ clock }) => {
    if (groupRef.current) {
      const t = clock.getElapsedTime();
      // Rocket flies from left to right, wrapping around
      const x = ((t * speed + delay) % 40) - 20;
      // Slight sinusoidal wave for Y
      const y = Math.sin(t * 2 + offset) * 2 + offset;
      
      groupRef.current.position.set(x, y, -15); // Far in the background
      groupRef.current.rotation.z = -Math.PI / 2; // Pointing right
      groupRef.current.rotation.x = Math.sin(t) * 0.2; // slight wobble
    }
  });

  return (
    <group ref={groupRef} scale={[0.5, 0.5, 0.5]}>
      {/* Body */}
      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[0.4, 0.4, 2, 16]} />
        <meshStandardMaterial color="#e2e8f0" metalness={0.5} roughness={0.2} />
      </mesh>
      {/* Nose */}
      <mesh position={[0, 1.2, 0]}>
        <coneGeometry args={[0.4, 0.8, 16]} />
        <meshStandardMaterial color="#06b6d4" />
      </mesh>
      {/* Fins */}
      <mesh position={[0.4, -0.6, 0]} rotation={[0, 0, -Math.PI / 6]}>
        <boxGeometry args={[0.1, 0.6, 0.4]} />
        <meshStandardMaterial color="#a855f7" />
      </mesh>
      <mesh position={[-0.4, -0.6, 0]} rotation={[0, 0, Math.PI / 6]}>
        <boxGeometry args={[0.1, 0.6, 0.4]} />
        <meshStandardMaterial color="#a855f7" />
      </mesh>
      {/* Thruster flame */}
      <mesh position={[0, -1.2, 0]}>
        <coneGeometry args={[0.3, 0.6, 8]} />
        <meshBasicMaterial color="#fcd34d" transparent opacity={0.8} />
      </mesh>
    </group>
  );
}

export default function Scene() {
  return (
    <div className="fixed inset-0 z-0 pointer-events-none">
      <Canvas camera={{ position: [0, 0, 15], fov: 45 }}>
        <fog attach="fog" args={['#020617', 15, 30]} />
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1.5} color="#06b6d4" />
        <directionalLight position={[-10, -10, -5]} intensity={1} color="#a855f7" />
        
        <Suspense fallback={null}>
          <Stars radius={50} depth={50} count={3000} factor={4} saturation={0} fade speed={1} />
          <Sparkles count={200} scale={20} size={2} speed={0.4} opacity={0.5} color="#a855f7" />
          
          <AbstractCore />

          {/* Asteroids in background */}
          <Asteroid position={[-8, 4, -8]} scale={0.8} rotationSpeed={0.005} />
          <Asteroid position={[6, -5, -6]} scale={1.2} rotationSpeed={0.003} />
          <Asteroid position={[-4, -6, -10]} scale={0.6} rotationSpeed={0.008} />
          <Asteroid position={[8, 5, -12]} scale={1.5} rotationSpeed={0.004} />

          {/* Distant flying rockets */}
          <FlyingRocket offset={2} speed={4} delay={0} />
          <FlyingRocket offset={-3} speed={6} delay={15} />

          <Environment preset="city">
            <Lightformer intensity={4} rotation-x={Math.PI / 2} position={[0, 5, -9]} scale={[10, 10, 1]} />
            <Lightformer intensity={2} rotation-y={Math.PI / 2} position={[-5, 1, -1]} scale={[20, 0.1, 1]} />
            <Lightformer rotation-y={Math.PI / 2} position={[28, 5, -10]} scale={[50, 50, 1]} />
          </Environment>
          <Rig />
        </Suspense>
      </Canvas>
    </div>
  );
}
