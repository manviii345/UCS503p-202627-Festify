import { useRef } from 'react';
import { motion } from 'framer-motion';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float } from '@react-three/drei';
import * as THREE from 'three';

function Pass3DModel() {
  const passRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!passRef.current) return;
    const t = state.clock.getElapsedTime();
    passRef.current.rotation.y = Math.sin(t * 0.8) * 0.4;
    passRef.current.rotation.x = Math.cos(t * 0.5) * 0.15;
  });

  return (
    <Float speed={2} rotationIntensity={0.6} floatIntensity={0.8}>
      <group ref={passRef} scale={1.2}>
        {/* Pass Main Base */}
        <mesh castShadow receiveShadow>
          <boxGeometry args={[2.2, 3.2, 0.1]} />
          <meshStandardMaterial color="#F7F2E7" roughness={0.3} metalness={0.1} />
        </mesh>

        {/* Top Header Bar Pink */}
        <mesh position={[0, 1.25, 0.06]}>
          <planeGeometry args={[2.1, 0.55]} />
          <meshStandardMaterial color="#EC6484" roughness={0.3} />
        </mesh>

        {/* Gold Circular Stamp Seal */}
        <mesh position={[0, 0.5, 0.08]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.35, 0.35, 0.04, 32]} />
          <meshStandardMaterial color="#F4C430" roughness={0.2} metalness={0.7} />
        </mesh>

        {/* Inner QR Code Box */}
        <mesh position={[0, -0.6, 0.08]}>
          <planeGeometry args={[1.2, 1.2]} />
          <meshStandardMaterial color="#1E1E1E" roughness={0.2} />
        </mesh>
      </group>
    </Float>
  );
}

export default function InteractivePassModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        className="bg-[#F7F2E7] border-4 border-[#1A1A1A] rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-[8px_8px_0px_#1A1A1A] relative"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-[#1A1A1A] text-white font-bold text-xs flex items-center justify-center hover:bg-[#F06E38] transition-colors"
        >
          ✕
        </button>

        <div className="text-center mb-4">
          <span className="px-3 py-1 bg-[#F4C430] text-[#1A1A1A] font-bold text-xs rounded-full border border-[#1A1A1A] uppercase tracking-wider">
            3D OFFLINE DIGITAL PASS
          </span>
          <h3 className="text-2xl font-black text-[#1A1A1A] mt-2">Interactive Festival Pass</h3>
          <p className="text-xs text-[#1A1A1A]/70 font-semibold">Rotate pass in 3D WebGL space. Works 100% offline.</p>
        </div>

        {/* 3D Canvas Pass Container */}
        <div className="w-full h-64 bg-[#EFE8D8] rounded-2xl border-2 border-[#1A1A1A] relative overflow-hidden mb-6">
          <Canvas camera={{ position: [0, 0, 5], fov: 45 }} dpr={[1, 1.5]} gl={{ alpha: true }}>
            <ambientLight intensity={0.9} />
            <directionalLight position={[4, 6, 4]} intensity={1.4} color="#fff" />
            <Pass3DModel />
          </Canvas>
        </div>

        <div className="flex items-center justify-between bg-[#1E1E1E] text-white p-4 rounded-xl mb-6">
          <div>
            <div className="text-xs text-[#F4C430] font-bold uppercase">TICKET HOLDER</div>
            <div className="text-sm font-black">Aarav Kapoor · IIT BOMBAY</div>
          </div>
          <div className="text-right">
            <div className="text-xs text-gray-400 font-bold uppercase">ACCESS CODE</div>
            <div className="text-xs font-mono font-bold text-[#EC6484]">№ FST-9048-2026</div>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 bg-[#F06E38] text-white font-bold text-xs rounded-xl border-2 border-[#1A1A1A] shadow-[2px_2px_0px_#1A1A1A] hover:bg-[#EC6484] transition-colors"
          >
            SAVE TICKET PASS ➔
          </button>
        </div>
      </motion.div>
    </div>
  );
}
