import { useRef, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Stars, Sparkles, Float } from '@react-three/drei';
import * as THREE from 'three';

const BlockchainNodes = ({ count = 15 }) => {
  const points = useMemo(() => {
    const p = [];
    for (let i = 0; i < count; i++) {
      p.push(new THREE.Vector3(
        (Math.random() - 0.5) * 20,
        (Math.random() - 0.5) * 15,
        (Math.random() - 0.5) * 10 - 10
      ));
    }
    return p;
  }, [count]);

  const groupRef = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.getElapsedTime() * 0.05;
      groupRef.current.rotation.x = state.clock.getElapsedTime() * 0.02;
    }
  });

  const lineGeometry = useMemo(() => {
    const l = [];
    for (let i = 0; i < count; i++) {
      for (let j = i + 1; j < count; j++) {
        const dist = points[i].distanceTo(points[j]);
        if (dist < 8) {
          l.push(points[i].x, points[i].y, points[i].z);
          l.push(points[j].x, points[j].y, points[j].z);
        }
      }
    }
    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.Float32BufferAttribute(l, 3));
    return geom;
  }, [points, count]);

  return (
    <group ref={groupRef}>
      {points.map((p, i) => (
        <mesh key={i} position={p}>
          <sphereGeometry args={[0.08, 16, 16]} />
          <meshBasicMaterial color="#06b6d4" />
        </mesh>
      ))}
      <lineSegments geometry={lineGeometry}>
        <lineBasicMaterial color="#06b6d4" transparent opacity={0.15} />
      </lineSegments>
    </group>
  );
};

const TradeBackground = () => {
  return (
    <>
      <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
      <Sparkles count={100} scale={20} size={2} speed={0.2} opacity={0.3} color="#06b6d4" />
      <BlockchainNodes count={20} />
      
      {/* Dynamic ambient fog */}
      <fog attach="fog" args={['#020617', 5, 25]} />
    </>
  );
};

export default TradeBackground;
