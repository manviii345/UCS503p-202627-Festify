import { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float } from '@react-three/drei';
import * as THREE from 'three';

function RubberStampModel() {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.getElapsedTime();
    groupRef.current.rotation.y = Math.sin(t * 0.8) * 0.4;
    groupRef.current.rotation.z = Math.cos(t * 0.6) * 0.15;
  });

  return (
    <Float speed={2} rotationIntensity={0.5} floatIntensity={0.6}>
      <group ref={groupRef} scale={1.1}>
        <mesh position={[0, 1.2, 0]} castShadow>
          <sphereGeometry args={[0.4, 32, 32]} />
          <meshStandardMaterial color="#8b4513" roughness={0.6} />
        </mesh>

        <mesh position={[0, 0.6, 0]} castShadow>
          <cylinderGeometry args={[0.2, 0.35, 0.8, 32]} />
          <meshStandardMaterial color="#a0522d" roughness={0.5} />
        </mesh>

        <mesh position={[0, 0.15, 0]}>
          <cylinderGeometry args={[0.42, 0.42, 0.1, 32]} />
          <meshStandardMaterial color="#e8a63b" metalness={0.8} roughness={0.2} />
        </mesh>

        <mesh position={[0, -0.1, 0]} castShadow>
          <cylinderGeometry args={[0.9, 0.9, 0.3, 32]} />
          <meshStandardMaterial color="#152b38" roughness={0.3} />
        </mesh>

        <mesh position={[0, -0.3, 0]}>
          <cylinderGeometry args={[0.85, 0.85, 0.1, 32]} />
          <meshStandardMaterial color="#c23b32" roughness={0.4} />
        </mesh>

        <mesh position={[0, -0.36, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.5, 0.75, 32]} />
          <meshStandardMaterial color="#efe3c8" roughness={0.2} />
        </mesh>
      </group>
    </Float>
  );
}

export default function RubberStamp3D() {
  return (
    <div className="w-48 h-48 sm:w-56 sm:h-56 relative mx-auto pointer-events-none">
      <Canvas
        camera={{ position: [0, 0.8, 3.8], fov: 40 }}
        dpr={[1, 1.5]}
        gl={{ alpha: true }}
      >
        <ambientLight intensity={0.9} />
        <directionalLight position={[4, 6, 4]} intensity={1.4} color="#fff6e5" />
        <pointLight position={[-3, -2, 2]} intensity={0.6} color="#e8a63b" />
        <RubberStampModel />
      </Canvas>
    </div>
  );
}
