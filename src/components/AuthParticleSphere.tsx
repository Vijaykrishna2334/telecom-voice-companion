import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface ParticlesProps {
  count: number;
}

const Particles = ({ count }: ParticlesProps) => {
  const mesh = useRef<THREE.Points>(null);
  const originalPositions = useRef<Float32Array | null>(null);

  const [positions, sizes, opacities] = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const opacities = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      // Distribute points on sphere surface with slight variation
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      
      // Vary radius slightly for more organic look
      const baseRadius = 2;
      const radiusVariation = (Math.random() - 0.5) * 0.15;
      const radius = baseRadius + radiusVariation;

      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = radius * Math.cos(phi);

      // Vary particle sizes for depth effect
      sizes[i] = Math.random() * 0.015 + 0.008;
      
      // Vary opacity for more realistic look
      opacities[i] = Math.random() * 0.5 + 0.5;
    }

    originalPositions.current = positions.slice();
    return [positions, sizes, opacities];
  }, [count]);

  useFrame((state) => {
    if (!mesh.current || !originalPositions.current) return;

    const time = state.clock.elapsedTime;
    const geometry = mesh.current.geometry;
    const positionAttribute = geometry.attributes.position;
    const positionsArray = positionAttribute.array as Float32Array;

    // Very slow, smooth rotation
    mesh.current.rotation.y += 0.001;
    mesh.current.rotation.x = Math.sin(time * 0.1) * 0.05;

    // Subtle particle breathing/movement
    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      const originalX = originalPositions.current[i3];
      const originalY = originalPositions.current[i3 + 1];
      const originalZ = originalPositions.current[i3 + 2];

      // Very subtle noise movement
      const noiseScale = 0.008;
      const speed = 0.3;
      const noiseX = Math.sin(time * speed + i * 0.05) * noiseScale;
      const noiseY = Math.cos(time * speed * 0.8 + i * 0.06) * noiseScale;
      const noiseZ = Math.sin(time * speed * 0.6 + i * 0.07) * noiseScale;

      // Very subtle breathing effect
      const breathe = 1 + Math.sin(time * 0.5) * 0.01;

      positionsArray[i3] = originalX * breathe + noiseX;
      positionsArray[i3 + 1] = originalY * breathe + noiseY;
      positionsArray[i3 + 2] = originalZ * breathe + noiseZ;
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
          attach="attributes-size"
          count={count}
          array={sizes}
          itemSize={1}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.018}
        color="#ffffff"
        transparent
        opacity={0.9}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
};

// Inner denser particles for core effect
const CoreParticles = ({ count }: { count: number }) => {
  const mesh = useRef<THREE.Points>(null);
  const originalPositions = useRef<Float32Array | null>(null);

  const positions = useMemo(() => {
    const positions = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const radius = 1.85 + (Math.random() - 0.5) * 0.2;

      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = radius * Math.cos(phi);
    }

    originalPositions.current = positions.slice();
    return positions;
  }, [count]);

  useFrame((state) => {
    if (!mesh.current || !originalPositions.current) return;

    const time = state.clock.elapsedTime;
    const geometry = mesh.current.geometry;
    const positionAttribute = geometry.attributes.position;
    const positionsArray = positionAttribute.array as Float32Array;

    mesh.current.rotation.y += 0.0008;
    mesh.current.rotation.z = Math.sin(time * 0.08) * 0.03;

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      const originalX = originalPositions.current[i3];
      const originalY = originalPositions.current[i3 + 1];
      const originalZ = originalPositions.current[i3 + 2];

      const noiseScale = 0.005;
      const speed = 0.25;
      const noiseX = Math.sin(time * speed + i * 0.08) * noiseScale;
      const noiseY = Math.cos(time * speed * 0.7 + i * 0.09) * noiseScale;
      const noiseZ = Math.sin(time * speed * 0.5 + i * 0.1) * noiseScale;

      const breathe = 1 + Math.sin(time * 0.4) * 0.008;

      positionsArray[i3] = originalX * breathe + noiseX;
      positionsArray[i3 + 1] = originalY * breathe + noiseY;
      positionsArray[i3 + 2] = originalZ * breathe + noiseZ;
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
      </bufferGeometry>
      <pointsMaterial
        size={0.012}
        color="#ffffff"
        transparent
        opacity={0.7}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
};

// Outer scattered particles
const OuterParticles = ({ count }: { count: number }) => {
  const mesh = useRef<THREE.Points>(null);
  const originalPositions = useRef<Float32Array | null>(null);

  const positions = useMemo(() => {
    const positions = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const radius = 2.1 + Math.random() * 0.3;

      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = radius * Math.cos(phi);
    }

    originalPositions.current = positions.slice();
    return positions;
  }, [count]);

  useFrame((state) => {
    if (!mesh.current || !originalPositions.current) return;

    const time = state.clock.elapsedTime;
    const geometry = mesh.current.geometry;
    const positionAttribute = geometry.attributes.position;
    const positionsArray = positionAttribute.array as Float32Array;

    mesh.current.rotation.y += 0.0012;
    mesh.current.rotation.x = Math.sin(time * 0.12) * 0.04;

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      const originalX = originalPositions.current[i3];
      const originalY = originalPositions.current[i3 + 1];
      const originalZ = originalPositions.current[i3 + 2];

      const noiseScale = 0.012;
      const speed = 0.35;
      const noiseX = Math.sin(time * speed + i * 0.04) * noiseScale;
      const noiseY = Math.cos(time * speed * 0.9 + i * 0.05) * noiseScale;
      const noiseZ = Math.sin(time * speed * 0.7 + i * 0.06) * noiseScale;

      const breathe = 1 + Math.sin(time * 0.6) * 0.015;

      positionsArray[i3] = originalX * breathe + noiseX;
      positionsArray[i3 + 1] = originalY * breathe + noiseY;
      positionsArray[i3 + 2] = originalZ * breathe + noiseZ;
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
      </bufferGeometry>
      <pointsMaterial
        size={0.014}
        color="#ffffff"
        transparent
        opacity={0.5}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
};

const AuthParticleSphere = () => {
  return (
    <div className="w-[500px] h-[500px] lg:w-[550px] lg:h-[550px]">
      <Canvas
        camera={{ position: [0, 0, 5.5], fov: 45 }}
        style={{ background: "transparent" }}
        gl={{ alpha: true, antialias: true }}
      >
        {/* Multiple particle layers for depth */}
        <Particles count={6000} />
        <CoreParticles count={3000} />
        <OuterParticles count={2000} />
      </Canvas>
    </div>
  );
};

export default AuthParticleSphere;
