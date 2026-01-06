import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface GlowingOrbProps {
  isHovered: boolean;
}

const GlowingOrb = ({ isHovered }: GlowingOrbProps) => {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.002;
      meshRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.5) * 0.1;
    }
  });

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[1.2, 64, 64]} />
      <meshBasicMaterial
        color={new THREE.Color("hsl(183, 100%, 55%)")}
        transparent
        opacity={0.9}
      />
    </mesh>
  );
};

const InnerGlow = () => {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      const scale = 1 + Math.sin(state.clock.elapsedTime * 2) * 0.05;
      meshRef.current.scale.set(scale, scale, scale);
    }
  });

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[1.5, 32, 32]} />
      <meshBasicMaterial
        color={new THREE.Color("hsl(183, 100%, 60%)")}
        transparent
        opacity={0.15}
      />
    </mesh>
  );
};

interface ParticlesProps {
  count: number;
}

const Particles = ({ count }: ParticlesProps) => {
  const mesh = useRef<THREE.Points>(null);
  const originalPositions = useRef<Float32Array | null>(null);

  const [positions, colors, sizes] = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      // Particles orbit around the orb at varying distances
      const radius = 1.8 + Math.random() * 0.8;

      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = radius * Math.cos(phi);

      // Cyan-white gradient colors
      const intensity = 0.7 + Math.random() * 0.3;
      colors[i * 3] = intensity * 0.6;
      colors[i * 3 + 1] = intensity;
      colors[i * 3 + 2] = intensity;

      sizes[i] = Math.random() * 0.03 + 0.01;
    }

    originalPositions.current = positions.slice();
    return [positions, colors, sizes];
  }, [count]);

  useFrame((state) => {
    if (!mesh.current || !originalPositions.current) return;

    const time = state.clock.elapsedTime;
    const geometry = mesh.current.geometry;
    const positionAttribute = geometry.attributes.position;
    const positionsArray = positionAttribute.array as Float32Array;

    // Rotate particles
    mesh.current.rotation.y += 0.003;
    mesh.current.rotation.x += 0.001;

    // Subtle particle movement
    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      const originalX = originalPositions.current[i3];
      const originalY = originalPositions.current[i3 + 1];
      const originalZ = originalPositions.current[i3 + 2];

      const noiseScale = 0.03;
      const noiseX = Math.sin(time * 1.5 + i * 0.1) * noiseScale;
      const noiseY = Math.cos(time * 1.8 + i * 0.12) * noiseScale;
      const noiseZ = Math.sin(time * 1.2 + i * 0.15) * noiseScale;

      positionsArray[i3] = originalX + noiseX;
      positionsArray[i3 + 1] = originalY + noiseY;
      positionsArray[i3 + 2] = originalZ + noiseZ;
    }

    positionAttribute.needsUpdate = true;
  });

  return (
    <points ref={mesh}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={count}
          array={colors}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-size"
          count={count}
          array={sizes}
          itemSize={1}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.025}
        vertexColors
        transparent
        opacity={0.8}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
};

// Outer ring particles
const RingParticles = () => {
  const mesh = useRef<THREE.Points>(null);
  const count = 200;

  const [positions, colors] = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const radius = 2.5 + (Math.random() - 0.5) * 0.2;
      
      positions[i * 3] = Math.cos(angle) * radius;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 0.3;
      positions[i * 3 + 2] = Math.sin(angle) * radius;

      // Gradient from cyan to purple
      const t = i / count;
      colors[i * 3] = 0.3 + t * 0.5;
      colors[i * 3 + 1] = 0.8 - t * 0.3;
      colors[i * 3 + 2] = 1;
    }

    return [positions, colors];
  }, []);

  useFrame((state) => {
    if (mesh.current) {
      mesh.current.rotation.y += 0.005;
      mesh.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.3) * 0.2;
    }
  });

  return (
    <points ref={mesh}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={count}
          array={colors}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.02}
        vertexColors
        transparent
        opacity={0.6}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
};

const AuthParticleSphere = () => {
  return (
    <div className="w-80 h-80 md:w-96 md:h-96">
      <Canvas
        camera={{ position: [0, 0, 5], fov: 50 }}
        style={{ background: "transparent" }}
        gl={{ alpha: true, antialias: true }}
      >
        <ambientLight intensity={0.5} />
        <pointLight position={[5, 5, 5]} intensity={0.5} />
        
        {/* Central glowing orb */}
        <GlowingOrb isHovered={false} />
        
        {/* Inner glow effect */}
        <InnerGlow />
        
        {/* Orbiting particles */}
        <Particles count={3000} />
        
        {/* Ring particles */}
        <RingParticles />
      </Canvas>
    </div>
  );
};

export default AuthParticleSphere;
