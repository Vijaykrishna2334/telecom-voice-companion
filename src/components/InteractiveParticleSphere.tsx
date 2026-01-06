import { useRef, useMemo, useState, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface SphereProps {
  mousePosition: { x: number; y: number };
  isPressed: boolean;
}

// Main glowing sphere body
const GlowingSphere = ({ mousePosition, isPressed }: SphereProps) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const targetRotation = useRef({ x: 0, y: 0 });
  const currentScale = useRef(1);

  useFrame(() => {
    if (!meshRef.current) return;

    // Follow mouse smoothly
    targetRotation.current.x = mousePosition.y * 0.3;
    targetRotation.current.y = mousePosition.x * 0.5;

    meshRef.current.rotation.x += (targetRotation.current.x - meshRef.current.rotation.x) * 0.08;
    meshRef.current.rotation.y += (targetRotation.current.y - meshRef.current.rotation.y) * 0.08;

    // Zoom on press
    const targetScale = isPressed ? 1.12 : 1;
    currentScale.current += (targetScale - currentScale.current) * 0.12;
    meshRef.current.scale.setScalar(currentScale.current);
  });

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[1.5, 64, 64]} />
      <meshBasicMaterial
        color="#0a1628"
        transparent
        opacity={0.95}
      />
    </mesh>
  );
};

// Inner core glow
const InnerGlow = ({ mousePosition, isPressed }: SphereProps) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const targetRotation = useRef({ x: 0, y: 0 });
  const currentScale = useRef(1);

  useFrame((state) => {
    if (!meshRef.current) return;

    const time = state.clock.elapsedTime;

    targetRotation.current.x = mousePosition.y * 0.3;
    targetRotation.current.y = mousePosition.x * 0.5;

    meshRef.current.rotation.x += (targetRotation.current.x - meshRef.current.rotation.x) * 0.08;
    meshRef.current.rotation.y += (targetRotation.current.y - meshRef.current.rotation.y) * 0.08;

    const targetScale = isPressed ? 1.12 : 1;
    currentScale.current += (targetScale - currentScale.current) * 0.12;
    
    // Breathing effect
    const breathe = 1 + Math.sin(time * 1.5) * 0.03;
    meshRef.current.scale.setScalar(currentScale.current * breathe);
  });

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[1.35, 64, 64]} />
      <meshBasicMaterial
        color="#1e3a5f"
        transparent
        opacity={0.6}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
};

// Eyes that follow the mouse
const Eyes = ({ mousePosition, isPressed }: SphereProps) => {
  const leftEyeRef = useRef<THREE.Group>(null);
  const rightEyeRef = useRef<THREE.Group>(null);
  const currentScale = useRef(1);

  useFrame(() => {
    if (!leftEyeRef.current || !rightEyeRef.current) return;

    // Eyes follow mouse by rotating the entire eye group
    const eyeRotationX = mousePosition.y * 0.4;
    const eyeRotationY = mousePosition.x * 0.6;

    leftEyeRef.current.rotation.x = eyeRotationX;
    leftEyeRef.current.rotation.y = eyeRotationY;
    rightEyeRef.current.rotation.x = eyeRotationX;
    rightEyeRef.current.rotation.y = eyeRotationY;

    // Scale on press
    const targetScale = isPressed ? 1.12 : 1;
    currentScale.current += (targetScale - currentScale.current) * 0.12;
    leftEyeRef.current.scale.setScalar(currentScale.current);
    rightEyeRef.current.scale.setScalar(currentScale.current);
  });

  return (
    <>
      {/* Left Eye */}
      <group ref={leftEyeRef}>
        <mesh position={[-0.45, 0.2, 1.35]}>
          {/* Eye white/glow */}
          <sphereGeometry args={[0.22, 32, 32]} />
          <meshBasicMaterial
            color="#4fc3f7"
            transparent
            opacity={0.9}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
        {/* Pupil */}
        <mesh position={[-0.45, 0.2, 1.5]}>
          <sphereGeometry args={[0.1, 32, 32]} />
          <meshBasicMaterial
            color="#ffffff"
            transparent
            opacity={1}
          />
        </mesh>
        {/* Eye inner glow */}
        <mesh position={[-0.45, 0.2, 1.32]}>
          <sphereGeometry args={[0.28, 32, 32]} />
          <meshBasicMaterial
            color="#29b6f6"
            transparent
            opacity={0.4}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      </group>

      {/* Right Eye */}
      <group ref={rightEyeRef}>
        <mesh position={[0.45, 0.2, 1.35]}>
          <sphereGeometry args={[0.22, 32, 32]} />
          <meshBasicMaterial
            color="#4fc3f7"
            transparent
            opacity={0.9}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
        {/* Pupil */}
        <mesh position={[0.45, 0.2, 1.5]}>
          <sphereGeometry args={[0.1, 32, 32]} />
          <meshBasicMaterial
            color="#ffffff"
            transparent
            opacity={1}
          />
        </mesh>
        {/* Eye inner glow */}
        <mesh position={[0.45, 0.2, 1.32]}>
          <sphereGeometry args={[0.28, 32, 32]} />
          <meshBasicMaterial
            color="#29b6f6"
            transparent
            opacity={0.4}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      </group>
    </>
  );
};

// Outer particle cloud
const ParticleCloud = ({ count, mousePosition, isPressed }: SphereProps & { count: number }) => {
  const meshRef = useRef<THREE.Points>(null);
  const originalPositions = useRef<Float32Array | null>(null);
  const targetRotation = useRef({ x: 0, y: 0 });
  const currentScale = useRef(1);

  const [positions, colors, sizes] = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const radius = 1.6 + Math.random() * 0.5;

      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = radius * Math.cos(phi);

      // Blue color palette
      colors[i * 3] = 0.2 + Math.random() * 0.3;
      colors[i * 3 + 1] = 0.5 + Math.random() * 0.4;
      colors[i * 3 + 2] = 0.8 + Math.random() * 0.2;

      sizes[i] = Math.random() * 0.015 + 0.008;
    }

    originalPositions.current = positions.slice();
    return [positions, colors, sizes];
  }, [count]);

  useFrame((state) => {
    if (!meshRef.current || !originalPositions.current) return;

    const time = state.clock.elapsedTime;

    targetRotation.current.x = mousePosition.y * 0.3;
    targetRotation.current.y = mousePosition.x * 0.5;

    meshRef.current.rotation.x += (targetRotation.current.x - meshRef.current.rotation.x) * 0.06;
    meshRef.current.rotation.y += (targetRotation.current.y - meshRef.current.rotation.y) * 0.06;
    meshRef.current.rotation.y += 0.001;

    const targetScale = isPressed ? 1.12 : 1;
    currentScale.current += (targetScale - currentScale.current) * 0.12;
    meshRef.current.scale.setScalar(currentScale.current);

    const geometry = meshRef.current.geometry;
    const positionAttribute = geometry.attributes.position;
    const positionsArray = positionAttribute.array as Float32Array;

    const noiseIntensity = isPressed ? 0.025 : 0.012;

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      const originalX = originalPositions.current[i3];
      const originalY = originalPositions.current[i3 + 1];
      const originalZ = originalPositions.current[i3 + 2];

      const noiseX = Math.sin(time * 0.4 + i * 0.04) * noiseIntensity;
      const noiseY = Math.cos(time * 0.35 + i * 0.05) * noiseIntensity;
      const noiseZ = Math.sin(time * 0.3 + i * 0.06) * noiseIntensity;

      positionsArray[i3] = originalX + noiseX;
      positionsArray[i3 + 1] = originalY + noiseY;
      positionsArray[i3 + 2] = originalZ + noiseZ;
    }

    positionAttribute.needsUpdate = true;
  });

  return (
    <points ref={meshRef}>
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
        size={0.02}
        vertexColors
        transparent
        opacity={0.7}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
};

// Outer glow ring
const OuterGlow = ({ mousePosition, isPressed }: SphereProps) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const targetRotation = useRef({ x: 0, y: 0 });
  const currentScale = useRef(1);

  useFrame((state) => {
    if (!meshRef.current) return;

    const time = state.clock.elapsedTime;

    targetRotation.current.x = mousePosition.y * 0.3;
    targetRotation.current.y = mousePosition.x * 0.5;

    meshRef.current.rotation.x += (targetRotation.current.x - meshRef.current.rotation.x) * 0.06;
    meshRef.current.rotation.y += (targetRotation.current.y - meshRef.current.rotation.y) * 0.06;

    const targetScale = isPressed ? 1.15 : 1;
    currentScale.current += (targetScale - currentScale.current) * 0.1;
    
    const pulse = 1 + Math.sin(time * 2) * 0.02;
    meshRef.current.scale.setScalar(currentScale.current * pulse);
  });

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[1.8, 32, 32]} />
      <meshBasicMaterial
        color="#1565c0"
        transparent
        opacity={0.15}
        blending={THREE.AdditiveBlending}
        side={THREE.BackSide}
      />
    </mesh>
  );
};

interface InteractiveParticleSphereProps {
  size?: "small" | "normal" | "large";
}

const InteractiveParticleSphere = ({ size = "normal" }: InteractiveParticleSphereProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isPressed, setIsPressed] = useState(false);

  const sizeClasses = {
    small: "w-48 h-48 md:w-56 md:h-56",
    normal: "w-64 h-64 md:w-72 md:h-72",
    large: "w-80 h-80 md:w-96 md:h-96 lg:w-[420px] lg:h-[420px]",
  };

  const particleCounts = {
    small: 2000,
    normal: 3000,
    large: 4000,
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const x = (e.clientX - centerX) / (rect.width / 2);
      const y = (e.clientY - centerY) / (rect.height / 2);

      setMousePosition({
        x: Math.max(-1, Math.min(1, x)),
        y: Math.max(-1, Math.min(1, y)),
      });
    };

    const handleMouseDown = () => setIsPressed(true);
    const handleMouseUp = () => setIsPressed(false);

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={`${sizeClasses[size]} cursor-pointer relative`}
    >
      {/* Blue ambient glow */}
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background: "radial-gradient(circle, rgba(33, 150, 243, 0.4) 0%, rgba(21, 101, 192, 0.2) 40%, transparent 70%)",
          transform: isPressed ? "scale(1.25)" : "scale(1.1)",
          transition: "transform 0.3s ease-out",
          filter: "blur(20px)",
        }}
      />

      <Canvas
        camera={{ position: [0, 0, 4.5], fov: 45 }}
        style={{ background: "transparent" }}
        gl={{ alpha: true, antialias: true }}
      >
        <OuterGlow mousePosition={mousePosition} isPressed={isPressed} />
        <ParticleCloud count={particleCounts[size]} mousePosition={mousePosition} isPressed={isPressed} />
        <GlowingSphere mousePosition={mousePosition} isPressed={isPressed} />
        <InnerGlow mousePosition={mousePosition} isPressed={isPressed} />
        <Eyes mousePosition={mousePosition} isPressed={isPressed} />
      </Canvas>
    </div>
  );
};

export default InteractiveParticleSphere;
