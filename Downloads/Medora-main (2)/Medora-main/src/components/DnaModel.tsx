import { useRef, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { Float } from '@react-three/drei';

export default function DnaModel() {
  const groupRef = useRef<THREE.Group>(null);
  const { pointer } = useThree();

  // Create DNA points
  const points = 40;
  const height = 10;
  const radius = 1.5;

  const helix1 = useMemo(() => {
    return Array.from({ length: points }).map((_, i) => {
      const t = i / points;
      const angle = t * Math.PI * 4;
      const y = (t - 0.5) * height;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      return new THREE.Vector3(x, y, z);
    });
  }, []);

  const helix2 = useMemo(() => {
    return Array.from({ length: points }).map((_, i) => {
      const t = i / points;
      const angle = t * Math.PI * 4 + Math.PI;
      const y = (t - 0.5) * height;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      return new THREE.Vector3(x, y, z);
    });
  }, []);

  useFrame((_, delta) => {
    if (groupRef.current) {
      // Base rotation
      groupRef.current.rotation.y += delta * 0.5;

      // Interactive rotation based on mouse
      const targetRotationX = (pointer.y * Math.PI) / 8;
      const targetRotationZ = -(pointer.x * Math.PI) / 8;

      groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, targetRotationX, 0.1);
      groupRef.current.rotation.z = THREE.MathUtils.lerp(groupRef.current.rotation.z, targetRotationZ, 0.1);
    }
  });

  return (
    <Float speed={2} rotationIntensity={0.5} floatIntensity={1}>
      <group ref={groupRef} scale={[0.6, 0.6, 0.6]}>
        {/* Helix 1 */}
        {helix1.map((pos, i) => (
          <mesh key={`h1-${i}`} position={pos}>
            <sphereGeometry args={[0.3, 16, 16]} />
            <meshPhysicalMaterial
              color="#06b6d4"
              emissive="#06b6d4"
              emissiveIntensity={0.5}
              roughness={0.2}
              metalness={0.8}
              clearcoat={1}
            />
          </mesh>
        ))}
        {/* Helix 2 */}
        {helix2.map((pos, i) => (
          <mesh key={`h2-${i}`} position={pos}>
            <sphereGeometry args={[0.3, 16, 16]} />
            <meshPhysicalMaterial
              color="#a855f7"
              emissive="#a855f7"
              emissiveIntensity={0.5}
              roughness={0.2}
              metalness={0.8}
              clearcoat={1}
            />
          </mesh>
        ))}
        {/* Connections */}
        {helix1.map((pos, i) => {
          if (i % 2 !== 0) return null; // Connect every other node
          const distance = pos.distanceTo(helix2[i]);
          return (
            <mesh key={`conn-${i}`} position={pos.clone().lerp(helix2[i], 0.5)} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.05, 0.05, distance, 8]} />
              <meshPhysicalMaterial
                color="#ffffff"
                transparent
                opacity={0.3}
                emissive="#ffffff"
                emissiveIntensity={0.2}
              />
              {/* Rotate cylinder to bridge exactly across the gap */}
              <primitive object={new THREE.Mesh()} />
            </mesh>
          );
        })}
      </group>
    </Float>
  );
}
