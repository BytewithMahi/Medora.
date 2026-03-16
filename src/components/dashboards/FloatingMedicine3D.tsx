import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Group } from 'three';
import { Float, Box, Cylinder, Sphere } from '@react-three/drei';

export default function FloatingMedicine3D() {
    const groupRef = useRef<Group>(null);

    useFrame((state) => {
        if (groupRef.current) {
            groupRef.current.rotation.y = state.clock.elapsedTime * 0.1;
            groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.5;
        }
    });

    return (
        <group ref={groupRef}>
            <ambientLight intensity={0.5} />
            <directionalLight position={[10, 10, 5]} intensity={1.5} color="#06b6d4" />
            <directionalLight position={[-10, -10, -5]} intensity={1.5} color="#a855f7" />

            {/* Floating Capsule */}
            <Float speed={2} rotationIntensity={1.5} floatIntensity={2} position={[-3, 1, -2]}>
                <group rotation={[Math.PI / 4, Math.PI / 4, 0]} scale={0.5}>
                    <Cylinder args={[1, 1, 2, 32]} position={[0, 1, 0]}>
                        <meshStandardMaterial color="#06b6d4" metalness={0.8} roughness={0.2} />
                    </Cylinder>
                    <Cylinder args={[1, 1, 2, 32]} position={[0, -1, 0]}>
                        <meshStandardMaterial color="#ffffff" metalness={0.5} roughness={0.2} />
                    </Cylinder>
                    <Sphere args={[1, 32, 32]} position={[0, 2, 0]}>
                        <meshStandardMaterial color="#06b6d4" metalness={0.8} roughness={0.2} />
                    </Sphere>
                    <Sphere args={[1, 32, 32]} position={[0, -2, 0]}>
                        <meshStandardMaterial color="#ffffff" metalness={0.5} roughness={0.2} />
                    </Sphere>
                </group>
            </Float>

            {/* Floating Medicine Box */}
            <Float speed={1.5} rotationIntensity={2} floatIntensity={1.5} position={[3, -1, -3]}>
                <Box args={[3, 4, 1.5]} rotation={[Math.PI / 6, -Math.PI / 4, 0]}>
                    <meshStandardMaterial color="#ffffff" metalness={0.3} roughness={0.4} />
                    <Box args={[2.8, 3.8, 1.6]}>
                        <meshStandardMaterial color="#a855f7" opacity={0.8} transparent />
                    </Box>
                </Box>
            </Float>

            {/* Another Small Pill */}
            <Float speed={3} rotationIntensity={1} floatIntensity={3} position={[0, -2, -1]}>
                <Cylinder args={[0.5, 0.5, 0.5, 32]} rotation={[Math.PI / 2, 0, 0]}>
                    <meshStandardMaterial color="#34d399" metalness={0.6} roughness={0.3} />
                </Cylinder>
            </Float>

            {/* Small floating particles */}
            {[...Array(10)].map((_, i) => (
                <Float key={i} speed={2} rotationIntensity={2} floatIntensity={2} position={[(Math.random() - 0.5) * 10, (Math.random() - 0.5) * 10, (Math.random() - 0.5) * 5 - 5]}>
                    <Sphere args={[0.1, 8, 8]}>
                        <meshStandardMaterial color={i % 2 === 0 ? "#06b6d4" : "#a855f7"} emissive={i % 2 === 0 ? "#06b6d4" : "#a855f7"} emissiveIntensity={2} />
                    </Sphere>
                </Float>
            ))}
        </group>
    );
}
