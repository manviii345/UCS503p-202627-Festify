import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, MeshWobbleMaterial } from '@react-three/drei';
import * as THREE from 'three';

function FloatingEnvelope({ mouse }: { mouse: React.MutableRefObject<{ x: number; y: number }> }) {
  const meshRef = useRef<THREE.Group>(null);

  useFrame((state, delta) => {
    if (!meshRef.current) return;
    // Smooth lerp rotation toward mouse position
    const targetX = (mouse.current.y * 0.4);
    const targetY = (mouse.current.x * 0.4);

    meshRef.current.rotation.x += (targetX - meshRef.current.rotation.x) * (delta * 3);
    meshRef.current.rotation.y += (targetY - meshRef.current.rotation.y) * (delta * 3);
    meshRef.current.rotation.z = Math.sin(state.clock.getElapsedTime() * 0.5) * 0.05;
  });

  return (
    <Float speed={2.5} rotationIntensity={0.6} floatIntensity={1.2}>
      <group ref={meshRef} scale={1.2}>
        {/* Envelope Base Body */}
        <mesh position={[0, 0, 0]} castShadow receiveShadow>
          <boxGeometry args={[2.8, 1.8, 0.15]} />
          <meshStandardMaterial color="#efe3c8" roughness={0.4} metalness={0.1} />
        </mesh>

        {/* Envelope Flap Accent Border */}
        <mesh position={[0, 0, 0.08]} castShadow>
          <planeGeometry args={[2.7, 1.7]} />
          <meshStandardMaterial color="#c23b32" roughness={0.3} />
        </mesh>

        {/* Envelope Center Seal Stamp (Crimson / Gold) */}
        <mesh position={[0, 0, 0.12]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.35, 0.35, 0.05, 32]} />
          <meshStandardMaterial color="#e8a63b" roughness={0.2} metalness={0.6} />
        </mesh>

        {/* Inner Stamp Perforation Dots */}
        <mesh position={[0, 0, 0.15]}>
          <ringGeometry args={[0.25, 0.32, 32]} />
          <meshStandardMaterial color="#152b38" roughness={0.5} />
        </mesh>

        {/* Floating Airmail Air Stripes (Navy & Red) */}
        <group position={[0, -0.75, 0.09]}>
          {[-1.1, -0.7, -0.3, 0.1, 0.5, 0.9].map((x, i) => (
            <mesh key={i} position={[x, 0, 0]} rotation={[0, 0, -Math.PI / 4]}>
              <planeGeometry args={[0.12, 0.25]} />
              <meshStandardMaterial color={i % 2 === 0 ? '#c23b32' : '#2f7a82'} />
            </mesh>
          ))}
        </group>
      </group>
    </Float>
  );
}

function VintageParticles({ count = 35 }) {
  const pointsRef = useRef<THREE.Points>(null);

  const [positions, colors] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const cols = new Float32Array(count * 3);
    const palette = [
      new THREE.Color('#c23b32'),
      new THREE.Color('#e8a63b'),
      new THREE.Color('#2f7a82'),
      new THREE.Color('#efe3c8'),
    ];

    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 12;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 8;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 6 - 1;

      const c = palette[Math.floor(Math.random() * palette.length)];
      cols[i * 3] = c.r;
      cols[i * 3 + 1] = c.g;
      cols[i * 3 + 2] = c.b;
    }
    return [pos, cols];
  }, [count]);

  useFrame((state) => {
    if (!pointsRef.current) return;
    pointsRef.current.rotation.y = state.clock.getElapsedTime() * 0.05;
    pointsRef.current.rotation.x = Math.sin(state.clock.getElapsedTime() * 0.03) * 0.05;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
        <bufferAttribute
          attach="attributes-color"
          args={[colors, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.12}
        vertexColors
        transparent
        opacity={0.7}
        sizeAttenuation
      />
    </points>
  );
}

function FloatingPostalBadge() {
  return (
    <Float speed={1.8} rotationIntensity={0.8} floatIntensity={0.9} position={[2.8, 1.2, -1]}>
      <mesh rotation={[0.2, -0.3, 0.1]}>
        <octahedronGeometry args={[0.7, 0]} />
        <MeshWobbleMaterial factor={0.3} speed={1.5} color="#e8a63b" roughness={0.3} metalness={0.4} />
      </mesh>
    </Float>
  );
}

export default function HeroCanvas() {
  const mouse = useRef({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { clientX, clientY } = e;
    const { innerWidth, innerHeight } = window;
    mouse.current = {
      x: (clientX / innerWidth) * 2 - 1,
      y: -(clientY / innerHeight) * 2 + 1,
    };
  };

  return (
    <div
      onMouseMove={handleMouseMove}
      className="absolute inset-0 pointer-events-auto z-0 overflow-hidden"
    >
      <Canvas
        camera={{ position: [0, 0, 5.5], fov: 45 }}
        dpr={[1, 1.5]}
        gl={{ alpha: true, antialias: true }}
      >
        {/* Lights */}
        <ambientLight intensity={0.9} />
        <directionalLight position={[5, 8, 5]} intensity={1.2} color="#fff8eb" />
        <pointLight position={[-4, -3, 2]} intensity={0.8} color="#c23b32" />
        <spotLight position={[0, 5, 4]} intensity={0.6} color="#e8a63b" angle={0.6} />

        {/* 3D Postal Objects */}
        <FloatingEnvelope mouse={mouse} />
        <FloatingPostalBadge />
        <VintageParticles count={40} />
      </Canvas>
    </div>
  );
}
