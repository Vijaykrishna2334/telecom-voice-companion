import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface ParticlesProps {
  count: number;
  isActive: boolean;
  isSpeaking: boolean;
}

const Particles = ({ count, isActive, isSpeaking }: ParticlesProps) => {
  const mesh = useRef<THREE.Points>(null);
  const originalPositions = useRef<Float32Array | null>(null);

  const [positions, colors, sizes] = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      // Distribute points on a sphere surface with some variation
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const radius = 2 + (Math.random() - 0.5) * 0.3;

      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = radius * Math.cos(phi);

      // White/light blue colors
      colors[i * 3] = 0.8 + Math.random() * 0.2;
      colors[i * 3 + 1] = 0.9 + Math.random() * 0.1;
      colors[i * 3 + 2] = 1;

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
    const positions = positionAttribute.array as Float32Array;

    // Rotation speed based on state
    const baseRotationSpeed = isActive ? 0.003 : 0.001;
    const speakingBoost = isSpeaking ? 0.005 : 0;
    mesh.current.rotation.y += baseRotationSpeed + speakingBoost;
    mesh.current.rotation.x += (baseRotationSpeed + speakingBoost) * 0.3;

    // Particle movement intensity
    const noiseIntensity = isSpeaking ? 0.15 : isActive ? 0.05 : 0.02;
    const pulseIntensity = isSpeaking ? 0.2 : 0.05;

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      const originalX = originalPositions.current[i3];
      const originalY = originalPositions.current[i3 + 1];
      const originalZ = originalPositions.current[i3 + 2];

      // Calculate distance from center
      const distance = Math.sqrt(
        originalX * originalX + originalY * originalY + originalZ * originalZ
      );

      // Noise-based displacement
      const noiseX =
        Math.sin(time * 2 + i * 0.1) * noiseIntensity +
        Math.sin(time * 4 + i * 0.05) * noiseIntensity * 0.5;
      const noiseY =
        Math.cos(time * 2.5 + i * 0.12) * noiseIntensity +
        Math.cos(time * 3 + i * 0.08) * noiseIntensity * 0.5;
      const noiseZ =
        Math.sin(time * 1.8 + i * 0.15) * noiseIntensity +
        Math.sin(time * 2.2 + i * 0.1) * noiseIntensity * 0.5;

      // Pulsing effect (expand/contract)
      const pulse = Math.sin(time * 3) * pulseIntensity;
      const scale = 1 + pulse * (isSpeaking ? 1 : 0.3);

      // Apply transformations
      positions[i3] = originalX * scale + noiseX;
      positions[i3 + 1] = originalY * scale + noiseY;
      positions[i3 + 2] = originalZ * scale + noiseZ;
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
        opacity={0.9}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
};

interface ParticleSphereProps {
  isActive: boolean;
  isSpeaking: boolean;
  onClick?: () => void;
}

const ParticleSphere = ({ isActive, isSpeaking, onClick }: ParticleSphereProps) => {
  return (
    <div
      className="w-72 h-72 md:w-80 md:h-80 rounded-[2.5rem] overflow-hidden cursor-pointer"
      onClick={onClick}
      style={{
        background: "linear-gradient(180deg, hsl(222 47% 8%) 0%, hsl(222 47% 4%) 100%)",
      }}
    >
      <Canvas
        camera={{ position: [0, 0, 6], fov: 45 }}
        style={{ background: "transparent" }}
      >
        <ambientLight intensity={0.5} />
        <Particles count={5000} isActive={isActive} isSpeaking={isSpeaking} />
      </Canvas>
    </div>
  );
};

export default ParticleSphere;
