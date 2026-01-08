import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface ParticlesProps {
  count: number;
  isActive: boolean;
  isSpeaking: boolean;
}

// Fire/energy colored particles on sphere surface
const Particles = ({ count, isActive, isSpeaking }: ParticlesProps) => {
  const mesh = useRef<THREE.Points>(null);
  const originalPositions = useRef<Float32Array | null>(null);

  const [positions, colors, sizes] = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const radius = 2 + (Math.random() - 0.5) * 0.3;

      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = radius * Math.cos(phi);

      // Fire/orange/red color palette
      const colorChoice = Math.random();
      if (colorChoice < 0.35) {
        // Bright orange
        colors[i * 3] = 1.0;
        colors[i * 3 + 1] = 0.5 + Math.random() * 0.3;
        colors[i * 3 + 2] = 0.0;
      } else if (colorChoice < 0.65) {
        // Yellow/gold
        colors[i * 3] = 1.0;
        colors[i * 3 + 1] = 0.7 + Math.random() * 0.3;
        colors[i * 3 + 2] = 0.1 + Math.random() * 0.2;
      } else if (colorChoice < 0.85) {
        // Red/crimson
        colors[i * 3] = 0.9 + Math.random() * 0.1;
        colors[i * 3 + 1] = 0.2 + Math.random() * 0.2;
        colors[i * 3 + 2] = 0.0;
      } else {
        // White-hot core
        colors[i * 3] = 1.0;
        colors[i * 3 + 1] = 0.9 + Math.random() * 0.1;
        colors[i * 3 + 2] = 0.7 + Math.random() * 0.3;
      }

      sizes[i] = Math.random() * 0.04 + 0.015;
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

    // Rotation speed based on state
    const baseRotationSpeed = isActive ? 0.006 : 0.003;
    const speakingBoost = isSpeaking ? 0.012 : 0;
    mesh.current.rotation.y += baseRotationSpeed + speakingBoost;
    mesh.current.rotation.x += (baseRotationSpeed + speakingBoost) * 0.15;

    // Particle movement intensity
    const noiseIntensity = isSpeaking ? 0.25 : isActive ? 0.08 : 0.03;
    const pulseIntensity = isSpeaking ? 0.3 : 0.08;

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      const originalX = originalPositions.current[i3];
      const originalY = originalPositions.current[i3 + 1];
      const originalZ = originalPositions.current[i3 + 2];

      // Fire-like turbulent motion
      const noiseX =
        Math.sin(time * 3 + i * 0.1) * noiseIntensity +
        Math.sin(time * 5 + i * 0.05) * noiseIntensity * 0.5;
      const noiseY =
        Math.cos(time * 2.5 + i * 0.12) * noiseIntensity +
        Math.cos(time * 4 + i * 0.08) * noiseIntensity * 0.6;
      const noiseZ =
        Math.sin(time * 2.8 + i * 0.15) * noiseIntensity +
        Math.sin(time * 3.5 + i * 0.1) * noiseIntensity * 0.5;

      // Pulsing/breathing effect
      const pulse = Math.sin(time * 4) * pulseIntensity;
      const scale = 1 + pulse * (isSpeaking ? 1.2 : 0.4);

      positionsArray[i3] = originalX * scale + noiseX;
      positionsArray[i3 + 1] = originalY * scale + noiseY;
      positionsArray[i3 + 2] = originalZ * scale + noiseZ;
    }

    positionAttribute.needsUpdate = true;
  });

  return (
    <points ref={mesh}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
        <bufferAttribute attach="attributes-color" count={count} array={colors} itemSize={3} />
        <bufferAttribute attach="attributes-size" count={count} array={sizes} itemSize={1} />
      </bufferGeometry>
      <pointsMaterial
        size={0.04}
        vertexColors
        transparent
        opacity={0.95}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
};

// Fire orbital rings with flowing particles
const FireOrbitalRings = ({ isActive, isSpeaking }: { isActive: boolean; isSpeaking: boolean }) => {
  const ring1Ref = useRef<THREE.Group>(null);
  const ring2Ref = useRef<THREE.Group>(null);
  const ring3Ref = useRef<THREE.Group>(null);
  const particles1Ref = useRef<THREE.Points>(null);
  const particles2Ref = useRef<THREE.Points>(null);
  const particles3Ref = useRef<THREE.Points>(null);

  const createRingParticles = (radius: number, count: number) => {
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const speeds = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      positions[i * 3] = Math.cos(angle) * radius;
      positions[i * 3 + 1] = 0;
      positions[i * 3 + 2] = Math.sin(angle) * radius;
      speeds[i] = 0.3 + Math.random() * 1.2;

      // Fire colors
      const colorChoice = Math.random();
      if (colorChoice < 0.4) {
        colors[i * 3] = 1.0;
        colors[i * 3 + 1] = 0.4 + Math.random() * 0.4;
        colors[i * 3 + 2] = 0.0;
      } else if (colorChoice < 0.7) {
        colors[i * 3] = 1.0;
        colors[i * 3 + 1] = 0.6 + Math.random() * 0.4;
        colors[i * 3 + 2] = 0.1;
      } else {
        colors[i * 3] = 1.0;
        colors[i * 3 + 1] = 0.2 + Math.random() * 0.2;
        colors[i * 3 + 2] = 0.0;
      }
    }

    return { positions, colors, speeds };
  };

  const ring1Data = useMemo(() => createRingParticles(2.4, 100), []);
  const ring2Data = useMemo(() => createRingParticles(2.7, 120), []);
  const ring3Data = useMemo(() => createRingParticles(3.0, 140), []);

  useFrame((state) => {
    const time = state.clock.elapsedTime;
    const speedMultiplier = isSpeaking ? 3 : isActive ? 1.5 : 1;

    // Rotate ring groups
    if (ring1Ref.current) {
      ring1Ref.current.rotation.x = 0.4;
      ring1Ref.current.rotation.y = time * 0.5 * speedMultiplier;
      ring1Ref.current.rotation.z = 0.1;
    }

    if (ring2Ref.current) {
      ring2Ref.current.rotation.x = -0.6;
      ring2Ref.current.rotation.y = -time * 0.4 * speedMultiplier;
      ring2Ref.current.rotation.z = 0.9;
    }

    if (ring3Ref.current) {
      ring3Ref.current.rotation.x = 0.8;
      ring3Ref.current.rotation.y = time * 0.35 * speedMultiplier;
      ring3Ref.current.rotation.z = -0.5;
    }

    // Animate particles along rings
    const animateRingParticles = (
      ref: React.RefObject<THREE.Points>,
      data: { positions: Float32Array; speeds: Float32Array },
      radius: number,
      baseSpeed: number
    ) => {
      if (!ref.current) return;

      const positions = ref.current.geometry.attributes.position.array as Float32Array;
      const count = positions.length / 3;

      for (let i = 0; i < count; i++) {
        const speed = data.speeds[i] * baseSpeed * speedMultiplier;
        const angle = (i / count) * Math.PI * 2 + time * speed;

        // Add wobble/turbulence when speaking
        const wobble = isSpeaking ? Math.sin(time * 10 + i * 0.5) * 0.08 : 0;
        const currentRadius = radius + wobble;

        positions[i * 3] = Math.cos(angle) * currentRadius;
        positions[i * 3 + 2] = Math.sin(angle) * currentRadius;
        positions[i * 3 + 1] = Math.sin(angle * 4 + time * 3) * 0.1;
      }

      ref.current.geometry.attributes.position.needsUpdate = true;
    };

    animateRingParticles(particles1Ref, ring1Data, 2.4, 0.4);
    animateRingParticles(particles2Ref, ring2Data, 2.7, 0.35);
    animateRingParticles(particles3Ref, ring3Data, 3.0, 0.3);
  });

  const ringMaterial = useMemo(
    () => (
      <meshBasicMaterial color="#ff6600" transparent opacity={0.12} side={THREE.DoubleSide} />
    ),
    []
  );

  return (
    <group>
      {/* Ring 1 */}
      <group ref={ring1Ref}>
        <mesh>
          <torusGeometry args={[2.4, 0.012, 8, 120]} />
          {ringMaterial}
        </mesh>
        <points ref={particles1Ref}>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" count={100} array={ring1Data.positions} itemSize={3} />
            <bufferAttribute attach="attributes-color" count={100} array={ring1Data.colors} itemSize={3} />
          </bufferGeometry>
          <pointsMaterial
            size={0.06}
            vertexColors
            transparent
            opacity={0.9}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </points>
      </group>

      {/* Ring 2 */}
      <group ref={ring2Ref}>
        <mesh>
          <torusGeometry args={[2.7, 0.01, 8, 140]} />
          {ringMaterial}
        </mesh>
        <points ref={particles2Ref}>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" count={120} array={ring2Data.positions} itemSize={3} />
            <bufferAttribute attach="attributes-color" count={120} array={ring2Data.colors} itemSize={3} />
          </bufferGeometry>
          <pointsMaterial
            size={0.055}
            vertexColors
            transparent
            opacity={0.85}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </points>
      </group>

      {/* Ring 3 */}
      <group ref={ring3Ref}>
        <mesh>
          <torusGeometry args={[3.0, 0.008, 8, 160]} />
          {ringMaterial}
        </mesh>
        <points ref={particles3Ref}>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" count={140} array={ring3Data.positions} itemSize={3} />
            <bufferAttribute attach="attributes-color" count={140} array={ring3Data.colors} itemSize={3} />
          </bufferGeometry>
          <pointsMaterial
            size={0.05}
            vertexColors
            transparent
            opacity={0.8}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </points>
      </group>
    </group>
  );
};

// Energy streams flowing outward
const EnergyStreams = ({ isActive, isSpeaking }: { isActive: boolean; isSpeaking: boolean }) => {
  const streamsRef = useRef<THREE.Points>(null);
  const streamCount = 400;

  const [positions, velocities, colors, lifetimes] = useMemo(() => {
    const positions = new Float32Array(streamCount * 3);
    const velocities = new Float32Array(streamCount * 3);
    const colors = new Float32Array(streamCount * 3);
    const lifetimes = new Float32Array(streamCount);

    for (let i = 0; i < streamCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const radius = 1.8 + Math.random() * 0.5;

      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = radius * Math.cos(phi);

      velocities[i * 3] = (Math.random() - 0.5) * 0.02;
      velocities[i * 3 + 1] = (Math.random() - 0.5) * 0.02;
      velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.02;

      lifetimes[i] = Math.random();

      // Fire colors
      colors[i * 3] = 1.0;
      colors[i * 3 + 1] = 0.3 + Math.random() * 0.5;
      colors[i * 3 + 2] = 0.0;
    }

    return [positions, velocities, colors, lifetimes];
  }, []);

  useFrame((state) => {
    if (!streamsRef.current) return;

    const time = state.clock.elapsedTime;
    const posArray = streamsRef.current.geometry.attributes.position.array as Float32Array;
    const speedMultiplier = isSpeaking ? 3 : isActive ? 1.5 : 1;

    for (let i = 0; i < streamCount; i++) {
      lifetimes[i] += 0.012 * speedMultiplier;

      if (lifetimes[i] > 1) {
        lifetimes[i] = 0;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        const radius = 1.8;

        posArray[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
        posArray[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
        posArray[i * 3 + 2] = radius * Math.cos(phi);
      } else {
        const x = posArray[i * 3];
        const y = posArray[i * 3 + 1];
        const z = posArray[i * 3 + 2];

        const expansion = 0.004 * speedMultiplier * (isSpeaking ? 1.8 : 1);

        posArray[i * 3] = x * (1 + expansion) + Math.sin(time * 3 + i) * 0.006;
        posArray[i * 3 + 1] = y * (1 + expansion) + Math.cos(time * 4 + i) * 0.006;
        posArray[i * 3 + 2] = z * (1 + expansion);
      }
    }

    streamsRef.current.geometry.attributes.position.needsUpdate = true;
    streamsRef.current.rotation.y = time * 0.15;
  });

  return (
    <points ref={streamsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={streamCount} array={positions} itemSize={3} />
        <bufferAttribute attach="attributes-color" count={streamCount} array={colors} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial
        size={0.025}
        vertexColors
        transparent
        opacity={0.7}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
};

// Glowing core
const GlowingCore = ({ isActive, isSpeaking }: { isActive: boolean; isSpeaking: boolean }) => {
  const coreRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const time = state.clock.elapsedTime;

    if (coreRef.current) {
      // Pulsing scale
      const basePulse = isSpeaking ? 0.15 : isActive ? 0.08 : 0.03;
      const pulse = 1 + Math.sin(time * (isSpeaking ? 6 : 3)) * basePulse;
      coreRef.current.scale.setScalar(pulse);

      // Slow rotation
      coreRef.current.rotation.y = time * 0.5;
    }

    if (glowRef.current) {
      const glowPulse = 1.2 + Math.sin(time * 4) * (isSpeaking ? 0.2 : 0.1);
      glowRef.current.scale.setScalar(glowPulse);
    }
  });

  return (
    <group>
      {/* Inner core */}
      <mesh ref={coreRef}>
        <icosahedronGeometry args={[0.8, 1]} />
        <meshBasicMaterial color="#ff4400" transparent opacity={0.3} wireframe />
      </mesh>

      {/* Outer glow */}
      <mesh ref={glowRef}>
        <sphereGeometry args={[1.2, 24, 24]} />
        <meshBasicMaterial color="#ff6600" transparent opacity={0.08} side={THREE.BackSide} />
      </mesh>
    </group>
  );
};

interface ParticleSphereProps {
  isActive: boolean;
  isSpeaking: boolean;
  onClick?: () => void;
  size?: "normal" | "large";
}

const ParticleSphere = ({ isActive, isSpeaking, onClick, size = "normal" }: ParticleSphereProps) => {
  const sizeClasses =
    size === "large"
      ? "w-[400px] h-[400px] md:w-[500px] md:h-[500px] lg:w-[600px] lg:h-[600px]"
      : "w-72 h-72 md:w-80 md:h-80";

  const particleCount = size === "large" ? 8000 : 5000;

  return (
    <div
      className={`${sizeClasses} cursor-pointer relative`}
      onClick={onClick}
      style={{
        background: "transparent",
      }}
    >
      {/* Fire glow backdrop */}
      <div
        className="absolute inset-0 rounded-full transition-all duration-500"
        style={{
          background: `radial-gradient(circle, rgba(255, 100, 0, ${
            isSpeaking ? 0.4 : isActive ? 0.25 : 0.15
          }) 0%, rgba(255, 60, 0, ${isSpeaking ? 0.25 : 0.1}) 40%, transparent 70%)`,
          transform: `scale(${isSpeaking ? 1.3 : isActive ? 1.15 : 1.1})`,
          filter: "blur(40px)",
        }}
      />

      <Canvas camera={{ position: [0, 0, 7], fov: 45 }} style={{ background: "transparent" }} gl={{ alpha: true, antialias: true }}>
        <GlowingCore isActive={isActive} isSpeaking={isSpeaking} />
        <Particles count={particleCount} isActive={isActive} isSpeaking={isSpeaking} />
        <FireOrbitalRings isActive={isActive} isSpeaking={isSpeaking} />
        <EnergyStreams isActive={isActive} isSpeaking={isSpeaking} />
      </Canvas>
    </div>
  );
};

export default ParticleSphere;
