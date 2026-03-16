import { Float } from '@react-three/drei';
import { useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';

interface FloatingMedicineProps {
  position: [number, number, number];
  type: 'capsule' | 'box' | 'sphere';
  color: string;
  floatIntensity?: number;
  speed?: number;
}

export default function FloatingMedicine({ 
  position, 
  type, 
  color, 
  floatIntensity = 2, 
  speed = 1.5 
}: FloatingMedicineProps) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.x += 0.002 * speed;
      meshRef.current.rotation.y += 0.003 * speed;
    }
  });

  const getGeometry = () => {
    switch (type) {
      case 'capsule':
        return <capsuleGeometry args={[0.5, 1, 4, 16]} />;
      case 'box':
        return <boxGeometry args={[1.5, 1.5, 1.5]} />;
      case 'sphere':
        return <sphereGeometry args={[0.8, 32, 32]} />;
      default:
        return <boxGeometry args={[1, 1, 1]} />;
    }
  };

  const isGlass = type === 'box'; // Boxes will represent blockchain block/glass

  return (
    <Float
      position={position}
      speed={speed}
      rotationIntensity={1}
      floatIntensity={floatIntensity}
    >
      <mesh ref={meshRef} castShadow receiveShadow>
        {getGeometry()}
        {isGlass ? (
          <meshPhysicalMaterial 
            color={color}
            transmission={0.9}
            opacity={1}
            metalness={0.1}
            roughness={0.1}
            ior={1.5}
            thickness={2}
            specularIntensity={1}
          />
        ) : (
          <meshStandardMaterial 
            color={color} 
            roughness={0.2} 
            metalness={0.8}
            emissive={color}
            emissiveIntensity={0.2}
          />
        )}
      </mesh>
    </Float>
  );
}
