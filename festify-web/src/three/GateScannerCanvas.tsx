import { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float } from '@react-three/drei';
import * as THREE from 'three';

function ScannerTerminal({ isScanning }: { isScanning: boolean }) {
  const ticketRef = useRef<THREE.Group>(null);
  const laserRef = useRef<THREE.Mesh>(null);
  const scanProgress = useRef(0);

  useFrame((_, delta) => {
    if (!ticketRef.current) return;

    if (isScanning) {
      scanProgress.current += delta * 2.5;
      const yOffset = Math.sin(scanProgress.current * Math.PI) * 0.4;
      ticketRef.current.position.y = yOffset;
      ticketRef.current.rotation.y = scanProgress.current * Math.PI * 2;

      if (laserRef.current) {
        laserRef.current.position.y = -yOffset;
        (laserRef.current.material as THREE.MeshStandardMaterial).opacity = 0.85;
      }
    } else {
      scanProgress.current = 0;
      ticketRef.current.position.y += (0 - ticketRef.current.position.y) * 0.1;
      ticketRef.current.rotation.y += (0 - ticketRef.current.rotation.y) * 0.1;
      if (laserRef.current) {
        (laserRef.current.material as THREE.MeshStandardMaterial).opacity = 0.15;
      }
    }
  });

  return (
    <group position={[0, -0.2, 0]}>
      {/* Outer Terminal Housing Base (Navy & Brass) */}
      <mesh position={[0, -1.2, 0]} receiveShadow>
        <boxGeometry args={[3.2, 0.5, 2.2]} />
        <meshStandardMaterial color="#152b38" roughness={0.3} metalness={0.4} />
      </mesh>

      {/* Terminal Brass Pillars */}
      <mesh position={[-1.3, -0.3, 0]}>
        <cylinderGeometry args={[0.08, 0.08, 1.4, 16]} />
        <meshStandardMaterial color="#e8a63b" roughness={0.2} metalness={0.7} />
      </mesh>
      <mesh position={[1.3, -0.3, 0]}>
        <cylinderGeometry args={[0.08, 0.08, 1.4, 16]} />
        <meshStandardMaterial color="#e8a63b" roughness={0.2} metalness={0.7} />
      </mesh>

      {/* Laser Scanner Beam Bar */}
      <mesh ref={laserRef} position={[0, 0, 0]}>
        <boxGeometry args={[2.8, 0.04, 0.8]} />
        <meshStandardMaterial
          color={isScanning ? '#2f7a82' : '#c23b32'}
          emissive={isScanning ? '#2f7a82' : '#c23b32'}
          emissiveIntensity={2}
          transparent
          opacity={0.3}
        />
      </mesh>

      {/* Floating 3D QR Ticket Pass */}
      <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.4}>
        <group ref={ticketRef} position={[0, 0.2, 0]}>
          {/* Ticket Card Face */}
          <mesh castShadow>
            <boxGeometry args={[1.8, 2.4, 0.08]} />
            <meshStandardMaterial color="#efe3c8" roughness={0.4} />
          </mesh>

          {/* Ticket Header Crimson Bar */}
          <mesh position={[0, 0.9, 0.05]}>
            <planeGeometry args={[1.7, 0.45]} />
            <meshStandardMaterial color="#c23b32" roughness={0.3} />
          </mesh>

          {/* QR Code Placeholder Box (Deep Ink Navy) */}
          <mesh position={[0, -0.2, 0.05]}>
            <planeGeometry args={[1.1, 1.1]} />
            <meshStandardMaterial color="#152b38" roughness={0.2} />
          </mesh>
        </group>
      </Float>
    </group>
  );
}

export default function GateScannerCanvas({ isScanning }: { isScanning: boolean }) {
  return (
    <div className="w-full h-64 sm:h-72 relative rounded overflow-hidden">
      <Canvas
        camera={{ position: [0, 0.5, 4.2], fov: 42 }}
        dpr={[1, 1.5]}
        gl={{ alpha: true }}
      >
        <ambientLight intensity={0.9} />
        <directionalLight position={[3, 6, 4]} intensity={1.3} color="#fff6e5" />
        <pointLight position={[-3, 2, 2]} intensity={0.8} color="#2f7a82" />
        <ScannerTerminal isScanning={isScanning} />
      </Canvas>
    </div>
  );
}
