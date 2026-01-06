import { useRef, useMemo, useState, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

interface ParticlesProps {
  count: number;
  mousePosition: { x: number; y: number };
  isPressed: boolean;
}

const Particles = ({ count, mousePosition, isPressed }: ParticlesProps) => {
  const mesh = useRef<THREE.Points>(null);
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
      const radius = 1.8 + (Math.random() - 0.5) * 0.15;

      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = radius * Math.cos(phi);

      // Blue-white gradient colors
      const blueIntensity = 0.6 + Math.random() * 0.4;
      colors[i * 3] = 0.4 + Math.random() * 0.3; // R
      colors[i * 3 + 1] = 0.6 + Math.random() * 0.3; // G
      colors[i * 3 + 2] = blueIntensity; // B - more blue

      sizes[i] = Math.random() * 0.02 + 0.01;
    }

    originalPositions.current = positions.slice();
    return [positions, colors, sizes];
  }, [count]);

  useFrame((state) => {
    if (!mesh.current || !originalPositions.current) return;

    const time = state.clock.elapsedTime;
    
    // Follow mouse - smooth interpolation
    targetRotation.current.x = mousePosition.y * 0.5;
    targetRotation.current.y = mousePosition.x * 0.8;
    
    mesh.current.rotation.x += (targetRotation.current.x - mesh.current.rotation.x) * 0.05;
    mesh.current.rotation.y += (targetRotation.current.y - mesh.current.rotation.y) * 0.05;
    
    // Subtle continuous rotation
    mesh.current.rotation.y += 0.002;

    // Zoom effect on press
    const targetScale = isPressed ? 1.15 : 1;
    currentScale.current += (targetScale - currentScale.current) * 0.1;
    mesh.current.scale.setScalar(currentScale.current);

    // Particle animation
    const geometry = mesh.current.geometry;
    const positionAttribute = geometry.attributes.position;
    const positionsArray = positionAttribute.array as Float32Array;

    const noiseIntensity = isPressed ? 0.03 : 0.015;

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      const originalX = originalPositions.current[i3];
      const originalY = originalPositions.current[i3 + 1];
      const originalZ = originalPositions.current[i3 + 2];

      const noiseX = Math.sin(time * 0.5 + i * 0.05) * noiseIntensity;
      const noiseY = Math.cos(time * 0.4 + i * 0.06) * noiseIntensity;
      const noiseZ = Math.sin(time * 0.3 + i * 0.07) * noiseIntensity;

      const breathe = 1 + Math.sin(time * 0.8) * 0.02;

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

// Inner glow core
const GlowCore = ({ mousePosition, isPressed }: { mousePosition: { x: number; y: number }; isPressed: boolean }) => {
  const mesh = useRef<THREE.Mesh>(null);
  const targetRotation = useRef({ x: 0, y: 0 });
  const currentScale = useRef(1);

  useFrame(() => {
    if (!mesh.current) return;

    targetRotation.current.x = mousePosition.y * 0.5;
    targetRotation.current.y = mousePosition.x * 0.8;
    
    mesh.current.rotation.x += (targetRotation.current.x - mesh.current.rotation.x) * 0.05;
    mesh.current.rotation.y += (targetRotation.current.y - mesh.current.rotation.y) * 0.05;
    mesh.current.rotation.y += 0.002;

    const targetScale = isPressed ? 1.15 : 1;
    currentScale.current += (targetScale - currentScale.current) * 0.1;
    mesh.current.scale.setScalar(currentScale.current);
  });

  return (
    <mesh ref={mesh}>
      <sphereGeometry args={[1.4, 32, 32]} />
      <meshBasicMaterial
        color="#1a4a8a"
        transparent
        opacity={0.15}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
};

// Outer ring particles
const OuterRing = ({ count, mousePosition, isPressed }: ParticlesProps) => {
  const mesh = useRef<THREE.Points>(null);
  const originalPositions = useRef<Float32Array | null>(null);
  const targetRotation = useRef({ x: 0, y: 0 });
  const currentScale = useRef(1);

  const [positions, colors] = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const radius = 2.0 + Math.random() * 0.3;

      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = radius * Math.cos(phi);

      colors[i * 3] = 0.3 + Math.random() * 0.2;
      colors[i * 3 + 1] = 0.5 + Math.random() * 0.3;
      colors[i * 3 + 2] = 0.8 + Math.random() * 0.2;
    }

    originalPositions.current = positions.slice();
    return [positions, colors];
  }, [count]);

  useFrame((state) => {
    if (!mesh.current || !originalPositions.current) return;

    const time = state.clock.elapsedTime;

    targetRotation.current.x = mousePosition.y * 0.5;
    targetRotation.current.y = mousePosition.x * 0.8;
    
    mesh.current.rotation.x += (targetRotation.current.x - mesh.current.rotation.x) * 0.04;
    mesh.current.rotation.y += (targetRotation.current.y - mesh.current.rotation.y) * 0.04;
    mesh.current.rotation.y += 0.003;

    const targetScale = isPressed ? 1.15 : 1;
    currentScale.current += (targetScale - currentScale.current) * 0.1;
    mesh.current.scale.setScalar(currentScale.current);

    const geometry = mesh.current.geometry;
    const positionAttribute = geometry.attributes.position;
    const positionsArray = positionAttribute.array as Float32Array;

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      const originalX = originalPositions.current[i3];
      const originalY = originalPositions.current[i3 + 1];
      const originalZ = originalPositions.current[i3 + 2];

      const noiseX = Math.sin(time * 0.4 + i * 0.03) * 0.02;
      const noiseY = Math.cos(time * 0.35 + i * 0.04) * 0.02;
      const noiseZ = Math.sin(time * 0.3 + i * 0.05) * 0.02;

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
      </bufferGeometry>
      <pointsMaterial
        size={0.018}
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
    small: { main: 3000, outer: 1000 },
    normal: { main: 4500, outer: 1500 },
    large: { main: 6000, outer: 2000 },
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      
      const rect = containerRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      
      // Normalize mouse position relative to container center
      const x = (e.clientX - centerX) / (rect.width / 2);
      const y = (e.clientY - centerY) / (rect.height / 2);
      
      setMousePosition({ x: Math.max(-1, Math.min(1, x)), y: Math.max(-1, Math.min(1, y)) });
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
      {/* Blue glow background */}
      <div 
        className="absolute inset-0 rounded-full opacity-30 blur-3xl"
        style={{
          background: "radial-gradient(circle, rgba(59, 130, 246, 0.5) 0%, rgba(30, 64, 175, 0.3) 50%, transparent 70%)",
          transform: isPressed ? "scale(1.2)" : "scale(1)",
          transition: "transform 0.3s ease-out",
        }}
      />
      
      <Canvas
        camera={{ position: [0, 0, 5], fov: 45 }}
        style={{ background: "transparent" }}
        gl={{ alpha: true, antialias: true }}
      >
        <GlowCore mousePosition={mousePosition} isPressed={isPressed} />
        <Particles count={particleCounts[size].main} mousePosition={mousePosition} isPressed={isPressed} />
        <OuterRing count={particleCounts[size].outer} mousePosition={mousePosition} isPressed={isPressed} />
      </Canvas>
    </div>
  );
};

export default InteractiveParticleSphere;
