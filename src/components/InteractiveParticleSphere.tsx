import { useRef, useMemo, useState, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface SphereProps {
  mousePosition: { x: number; y: number };
  isPressed: boolean;
  isUserSpeaking: boolean;
  isBotSpeaking: boolean;
}

// JARVIS-style holographic core with energy glow
const HolographicCore = ({ mousePosition, isPressed, isUserSpeaking, isBotSpeaking }: SphereProps) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const targetRotation = useRef({ x: 0, y: 0 });
  const currentScale = useRef(1);
  const pulsePhase = useRef(0);

  const shaderMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        pulseIntensity: { value: 0 },
        isActive: { value: 0 },
      },
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vPosition;
        varying vec2 vUv;
        
        void main() {
          vNormal = normalize(normalMatrix * normal);
          vPosition = position;
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float time;
        uniform float pulseIntensity;
        uniform float isActive;
        
        varying vec3 vNormal;
        varying vec3 vPosition;
        varying vec2 vUv;
        
        void main() {
          // JARVIS cyan/blue holographic colors
          vec3 coreColor = vec3(0.0, 0.8, 1.0);
          vec3 glowColor = vec3(0.2, 0.9, 1.0);
          vec3 accentColor = vec3(0.0, 0.6, 0.8);
          
          // Fresnel effect for holographic rim
          float fresnel = pow(1.0 - abs(dot(vNormal, vec3(0.0, 0.0, 1.0))), 3.0);
          
          // Hexagonal grid pattern
          float scale = 15.0;
          vec2 uv = vUv * scale;
          float hex = abs(sin(uv.x * 3.14159) * sin(uv.y * 3.14159));
          hex = smoothstep(0.85, 0.95, hex);
          
          // Scanning lines
          float scanLine = sin(vPosition.y * 20.0 + time * 3.0) * 0.5 + 0.5;
          scanLine = pow(scanLine, 4.0) * 0.3;
          
          // Pulse effect
          float pulse = sin(time * 4.0 + pulseIntensity * 3.0) * 0.5 + 0.5;
          pulse = 0.7 + pulse * 0.3 * (1.0 + isActive * 0.5);
          
          // Combine effects
          vec3 finalColor = coreColor * 0.3;
          finalColor += fresnel * glowColor * 1.5;
          finalColor += hex * accentColor * 0.4;
          finalColor += scanLine * coreColor;
          finalColor *= pulse;
          
          // Alpha with holographic transparency
          float alpha = 0.6 + fresnel * 0.4 + hex * 0.1;
          alpha *= 0.85;
          
          gl_FragColor = vec4(finalColor, alpha);
        }
      `,
      transparent: true,
      side: THREE.DoubleSide,
    });
  }, []);

  useFrame((state) => {
    if (!meshRef.current || !materialRef.current) return;

    const time = state.clock.elapsedTime;
    materialRef.current.uniforms.time.value = time;
    
    // Pulse intensity based on speaking
    const targetPulse = isBotSpeaking ? 1.5 : isUserSpeaking ? 0.8 : 0;
    pulsePhase.current += (targetPulse - pulsePhase.current) * 0.1;
    materialRef.current.uniforms.pulseIntensity.value = pulsePhase.current;
    materialRef.current.uniforms.isActive.value = (isBotSpeaking || isUserSpeaking) ? 1 : 0;

    // Follow mouse smoothly
    targetRotation.current.x = mousePosition.y * 0.2;
    targetRotation.current.y = mousePosition.x * 0.3;

    meshRef.current.rotation.x += (targetRotation.current.x - meshRef.current.rotation.x) * 0.04;
    meshRef.current.rotation.y += (targetRotation.current.y - meshRef.current.rotation.y) * 0.04;

    // Base rotation
    meshRef.current.rotation.y += 0.003;

    // Scale on press or when active
    const baseScale = isBotSpeaking ? 1.05 + Math.sin(time * 6) * 0.03 : 1;
    const targetScale = isPressed ? 1.15 : baseScale;
    currentScale.current += (targetScale - currentScale.current) * 0.1;
    meshRef.current.scale.setScalar(currentScale.current);

    // Glow mesh
    if (glowRef.current) {
      glowRef.current.scale.setScalar(currentScale.current * (1.1 + pulsePhase.current * 0.1));
    }
  });

  return (
    <group>
      {/* Inner core */}
      <mesh ref={meshRef}>
        <icosahedronGeometry args={[1, 2]} />
        <primitive object={shaderMaterial} ref={materialRef} attach="material" />
      </mesh>
      
      {/* Outer glow */}
      <mesh ref={glowRef}>
        <sphereGeometry args={[1.15, 32, 32]} />
        <meshBasicMaterial 
          color="#00d4ff" 
          transparent 
          opacity={0.08} 
          side={THREE.BackSide}
        />
      </mesh>
    </group>
  );
};

// Rotating orbital rings with energy particles - JARVIS style
const OrbitalRings = ({ mousePosition, isPressed, isUserSpeaking, isBotSpeaking }: SphereProps) => {
  const ring1Ref = useRef<THREE.Group>(null);
  const ring2Ref = useRef<THREE.Group>(null);
  const ring3Ref = useRef<THREE.Group>(null);
  const particles1Ref = useRef<THREE.Points>(null);
  const particles2Ref = useRef<THREE.Points>(null);
  const particles3Ref = useRef<THREE.Points>(null);

  // Create ring particle positions
  const createRingParticles = (radius: number, count: number) => {
    const positions = new Float32Array(count * 3);
    const speeds = new Float32Array(count);
    
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      positions[i * 3] = Math.cos(angle) * radius;
      positions[i * 3 + 1] = 0;
      positions[i * 3 + 2] = Math.sin(angle) * radius;
      speeds[i] = 0.5 + Math.random() * 1.5;
    }
    
    return { positions, speeds };
  };

  const ring1Data = useMemo(() => createRingParticles(1.6, 80), []);
  const ring2Data = useMemo(() => createRingParticles(1.85, 100), []);
  const ring3Data = useMemo(() => createRingParticles(2.1, 120), []);

  useFrame((state) => {
    const time = state.clock.elapsedTime;
    
    // Speed multiplier based on state
    const speedMultiplier = isBotSpeaking ? 2.5 : isUserSpeaking ? 1.8 : 1;
    
    // Rotate rings
    if (ring1Ref.current) {
      ring1Ref.current.rotation.x = 0.3 + mousePosition.y * 0.1;
      ring1Ref.current.rotation.y = time * 0.5 * speedMultiplier;
      ring1Ref.current.rotation.z = 0.1;
    }
    
    if (ring2Ref.current) {
      ring2Ref.current.rotation.x = -0.5 + mousePosition.y * 0.15;
      ring2Ref.current.rotation.y = -time * 0.4 * speedMultiplier;
      ring2Ref.current.rotation.z = 0.8;
    }
    
    if (ring3Ref.current) {
      ring3Ref.current.rotation.x = 0.7 + mousePosition.x * 0.1;
      ring3Ref.current.rotation.y = time * 0.3 * speedMultiplier;
      ring3Ref.current.rotation.z = -0.4;
    }

    // Animate particles along rings
    const animateParticles = (
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
        
        // Add some wobble when speaking
        const wobble = isBotSpeaking ? Math.sin(time * 8 + i) * 0.05 : 0;
        const currentRadius = radius + wobble;
        
        positions[i * 3] = Math.cos(angle) * currentRadius;
        positions[i * 3 + 2] = Math.sin(angle) * currentRadius;
        
        // Slight vertical oscillation
        positions[i * 3 + 1] = Math.sin(angle * 3 + time * 2) * 0.08;
      }
      
      ref.current.geometry.attributes.position.needsUpdate = true;
    };

    animateParticles(particles1Ref, ring1Data, 1.6, 0.3);
    animateParticles(particles2Ref, ring2Data, 1.85, 0.25);
    animateParticles(particles3Ref, ring3Data, 2.1, 0.2);
  });

  const ringMaterial = useMemo(() => (
    <meshBasicMaterial 
      color="#00d4ff" 
      transparent 
      opacity={0.15}
      side={THREE.DoubleSide}
    />
  ), []);

  const particleMaterial = useMemo(() => (
    <pointsMaterial
      size={0.04}
      color="#00ffff"
      transparent
      opacity={0.9}
      blending={THREE.AdditiveBlending}
      depthWrite={false}
    />
  ), []);

  return (
    <group>
      {/* Ring 1 */}
      <group ref={ring1Ref}>
        <mesh>
          <torusGeometry args={[1.6, 0.008, 8, 100]} />
          {ringMaterial}
        </mesh>
        <points ref={particles1Ref}>
          <bufferGeometry>
            <bufferAttribute 
              attach="attributes-position" 
              count={80} 
              array={ring1Data.positions} 
              itemSize={3} 
            />
          </bufferGeometry>
          {particleMaterial}
        </points>
      </group>

      {/* Ring 2 */}
      <group ref={ring2Ref}>
        <mesh>
          <torusGeometry args={[1.85, 0.006, 8, 120]} />
          {ringMaterial}
        </mesh>
        <points ref={particles2Ref}>
          <bufferGeometry>
            <bufferAttribute 
              attach="attributes-position" 
              count={100} 
              array={ring2Data.positions} 
              itemSize={3} 
            />
          </bufferGeometry>
          {particleMaterial}
        </points>
      </group>

      {/* Ring 3 */}
      <group ref={ring3Ref}>
        <mesh>
          <torusGeometry args={[2.1, 0.004, 8, 140]} />
          {ringMaterial}
        </mesh>
        <points ref={particles3Ref}>
          <bufferGeometry>
            <bufferAttribute 
              attach="attributes-position" 
              count={120} 
              array={ring3Data.positions} 
              itemSize={3} 
            />
          </bufferGeometry>
          {particleMaterial}
        </points>
      </group>
    </group>
  );
};

// Energy streams flowing around the sphere
const EnergyStreams = ({ isUserSpeaking, isBotSpeaking }: Pick<SphereProps, 'isUserSpeaking' | 'isBotSpeaking'>) => {
  const streamsRef = useRef<THREE.Points>(null);
  const streamCount = 500;

  const [positions, velocities, lifetimes] = useMemo(() => {
    const positions = new Float32Array(streamCount * 3);
    const velocities = new Float32Array(streamCount * 3);
    const lifetimes = new Float32Array(streamCount);

    for (let i = 0; i < streamCount; i++) {
      // Random position on sphere surface
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const radius = 1.3 + Math.random() * 0.4;

      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = radius * Math.cos(phi);

      // Tangent velocity for spiral motion
      velocities[i * 3] = (Math.random() - 0.5) * 0.02;
      velocities[i * 3 + 1] = (Math.random() - 0.5) * 0.02;
      velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.02;

      lifetimes[i] = Math.random();
    }

    return [positions, velocities, lifetimes];
  }, []);

  useFrame((state) => {
    if (!streamsRef.current) return;

    const time = state.clock.elapsedTime;
    const posArray = streamsRef.current.geometry.attributes.position.array as Float32Array;
    const speedMultiplier = isBotSpeaking ? 3 : isUserSpeaking ? 2 : 1;

    for (let i = 0; i < streamCount; i++) {
      lifetimes[i] += 0.01 * speedMultiplier;
      
      if (lifetimes[i] > 1) {
        lifetimes[i] = 0;
        // Reset to new position on sphere
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        const radius = 1.3;

        posArray[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
        posArray[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
        posArray[i * 3 + 2] = radius * Math.cos(phi);
      } else {
        // Spiral outward motion
        const x = posArray[i * 3];
        const y = posArray[i * 3 + 1];
        const z = posArray[i * 3 + 2];
        
        const dist = Math.sqrt(x * x + y * y + z * z);
        const expansion = 0.003 * speedMultiplier * (isBotSpeaking ? 1.5 : 1);
        
        // Expand outward with spiral
        posArray[i * 3] = x * (1 + expansion) + Math.sin(time * 2 + i) * 0.005;
        posArray[i * 3 + 1] = y * (1 + expansion) + Math.cos(time * 3 + i) * 0.005;
        posArray[i * 3 + 2] = z * (1 + expansion);
      }
    }

    streamsRef.current.geometry.attributes.position.needsUpdate = true;
    streamsRef.current.rotation.y = time * 0.1;
  });

  return (
    <points ref={streamsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={streamCount} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial
        size={0.02}
        color="#00ffff"
        transparent
        opacity={0.6}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
};

// Animated eyes with JARVIS-style glowing effect
const Eyes = ({ mousePosition, isPressed, isUserSpeaking, isBotSpeaking }: SphereProps) => {
  const leftEyeRef = useRef<THREE.Group>(null);
  const rightEyeRef = useRef<THREE.Group>(null);
  const leftGlowRef = useRef<THREE.Mesh>(null);
  const rightGlowRef = useRef<THREE.Mesh>(null);
  const currentScale = useRef(1);
  const blinkProgress = useRef(0);
  const lastBlinkTime = useRef(0);
  const isBlinking = useRef(false);
  const emotionState = useRef<"normal" | "happy" | "curious" | "sleepy" | "attentive">("normal");
  const emotionTimer = useRef(0);

  useFrame((state) => {
    if (!leftEyeRef.current || !rightEyeRef.current) return;

    const time = state.clock.elapsedTime;

    // Set emotion based on state
    if (isUserSpeaking) {
      emotionState.current = "attentive";
    } else if (isBotSpeaking) {
      emotionState.current = "happy";
    } else if (time - emotionTimer.current > 5 + Math.random() * 3) {
      emotionTimer.current = time;
      const emotions: Array<"normal" | "happy" | "curious" | "sleepy"> = ["normal", "happy", "curious", "sleepy"];
      emotionState.current = emotions[Math.floor(Math.random() * emotions.length)];
    }

    // Blinking logic
    const blinkInterval = emotionState.current === "attentive" ? 5 : 3;
    if (!isBlinking.current && time - lastBlinkTime.current > blinkInterval + Math.random() * 2) {
      isBlinking.current = true;
      lastBlinkTime.current = time;
    }

    if (isBlinking.current) {
      blinkProgress.current += 0.2;
      if (blinkProgress.current >= Math.PI) {
        blinkProgress.current = 0;
        isBlinking.current = false;
      }
    }

    const blinkScale = 1 - Math.sin(blinkProgress.current) * 0.9;

    // Eye shape based on emotion
    let eyeScaleY = blinkScale;

    switch (emotionState.current) {
      case "happy":
        eyeScaleY *= 0.7;
        break;
      case "curious":
        eyeScaleY *= 1.1;
        break;
      case "sleepy":
        eyeScaleY *= 0.5;
        break;
      case "attentive":
        eyeScaleY *= 1.15;
        break;
      default:
        eyeScaleY *= 1 + Math.sin(time * 1.5) * 0.05;
    }

    // Apply transformations
    leftEyeRef.current.scale.y = eyeScaleY;
    rightEyeRef.current.scale.y = eyeScaleY;

    // Eyes follow mouse
    const eyeRotationX = mousePosition.y * 0.2;
    const eyeRotationY = mousePosition.x * 0.35;

    leftEyeRef.current.rotation.x = eyeRotationX;
    leftEyeRef.current.rotation.y = eyeRotationY;
    rightEyeRef.current.rotation.x = eyeRotationX;
    rightEyeRef.current.rotation.y = eyeRotationY;

    // Glow intensity
    const glowIntensity = isBotSpeaking ? 0.8 : isUserSpeaking ? 0.6 : 0.4;
    const pulse = Math.sin(time * 4) * 0.1;
    
    if (leftGlowRef.current && rightGlowRef.current) {
      (leftGlowRef.current.material as THREE.MeshBasicMaterial).opacity = glowIntensity + pulse;
      (rightGlowRef.current.material as THREE.MeshBasicMaterial).opacity = glowIntensity + pulse;
    }

    // Scale on press
    const targetScale = isPressed ? 1.15 : 1;
    currentScale.current += (targetScale - currentScale.current) * 0.15;
    leftEyeRef.current.scale.x = currentScale.current;
    rightEyeRef.current.scale.x = currentScale.current;
  });

  return (
    <>
      {/* Left Eye */}
      <group ref={leftEyeRef} position={[-0.35, 0.1, 0.95]}>
        {/* Eye core */}
        <mesh>
          <capsuleGeometry args={[0.08, 0.2, 8, 16]} />
          <meshBasicMaterial color="#00ffff" />
        </mesh>
        {/* Eye glow */}
        <mesh ref={leftGlowRef} scale={1.4}>
          <capsuleGeometry args={[0.08, 0.2, 8, 16]} />
          <meshBasicMaterial 
            color="#00d4ff" 
            transparent 
            opacity={0.4}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      </group>

      {/* Right Eye */}
      <group ref={rightEyeRef} position={[0.35, 0.1, 0.95]}>
        <mesh>
          <capsuleGeometry args={[0.08, 0.2, 8, 16]} />
          <meshBasicMaterial color="#00ffff" />
        </mesh>
        <mesh ref={rightGlowRef} scale={1.4}>
          <capsuleGeometry args={[0.08, 0.2, 8, 16]} />
          <meshBasicMaterial 
            color="#00d4ff" 
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
const ParticleCloud = ({ count, mousePosition, isPressed, isUserSpeaking, isBotSpeaking }: SphereProps & { count: number }) => {
  const meshRef = useRef<THREE.Points>(null);
  const originalPositions = useRef<Float32Array | null>(null);
  const targetRotation = useRef({ x: 0, y: 0 });
  const currentScale = useRef(1);

  const [positions] = useMemo(() => {
    const positions = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const radius = 2.3 + Math.random() * 0.8;

      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = radius * Math.cos(phi);
    }

    originalPositions.current = positions.slice();
    return [positions];
  }, [count]);

  useFrame((state) => {
    if (!meshRef.current || !originalPositions.current) return;

    const time = state.clock.elapsedTime;

    targetRotation.current.x = mousePosition.y * 0.2;
    targetRotation.current.y = mousePosition.x * 0.3;

    meshRef.current.rotation.x += (targetRotation.current.x - meshRef.current.rotation.x) * 0.04;
    meshRef.current.rotation.y += (targetRotation.current.y - meshRef.current.rotation.y) * 0.04;
    
    const baseRotation = 0.002;
    const speedBoost = isUserSpeaking ? 0.008 : isBotSpeaking ? 0.005 : 0;
    meshRef.current.rotation.y += baseRotation + speedBoost;

    const targetScale = isPressed ? 1.1 : isBotSpeaking ? 1.05 : 1;
    currentScale.current += (targetScale - currentScale.current) * 0.1;
    meshRef.current.scale.setScalar(currentScale.current);

    const posArray = meshRef.current.geometry.attributes.position.array as Float32Array;

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      const ox = originalPositions.current[i3];
      const oy = originalPositions.current[i3 + 1];
      const oz = originalPositions.current[i3 + 2];

      const noise = isBotSpeaking ? 0.03 : 0.01;
      posArray[i3] = ox + Math.sin(time * 0.5 + i * 0.05) * noise;
      posArray[i3 + 1] = oy + Math.cos(time * 0.4 + i * 0.06) * noise;
      posArray[i3 + 2] = oz + Math.sin(time * 0.3 + i * 0.07) * noise;
    }

    meshRef.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial
        size={0.015}
        color="#00d4ff"
        transparent
        opacity={0.4}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
};

interface InteractiveParticleSphereProps {
  size?: "small" | "normal" | "large";
  isUserSpeaking?: boolean;
  isBotSpeaking?: boolean;
}

const InteractiveParticleSphere = ({ 
  size = "normal", 
  isUserSpeaking = false, 
  isBotSpeaking = false 
}: InteractiveParticleSphereProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isPressed, setIsPressed] = useState(false);

  const sizeClasses = {
    small: "w-48 h-48 md:w-56 md:h-56",
    normal: "w-64 h-64 md:w-72 md:h-72",
    large: "w-80 h-80 md:w-96 md:h-96 lg:w-[420px] lg:h-[420px]",
  };

  const particleCounts = {
    small: 800,
    normal: 1200,
    large: 1600,
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

  const glowIntensity = isBotSpeaking ? 0.6 : isUserSpeaking ? 0.4 : 0.25;

  return (
    <div ref={containerRef} className={`${sizeClasses[size]} cursor-pointer relative`}>
      {/* JARVIS-style cyan glow */}
      <div
        className="absolute inset-0 rounded-full transition-all duration-500"
        style={{
          background: `radial-gradient(circle, rgba(0, 212, 255, ${glowIntensity}) 0%, rgba(0, 180, 220, ${glowIntensity * 0.6}) 30%, rgba(0, 150, 200, ${glowIntensity * 0.3}) 50%, transparent 70%)`,
          transform: `scale(${isPressed ? 1.4 : isBotSpeaking ? 1.3 : 1.2})`,
          filter: "blur(30px)",
        }}
      />

      {/* Outer pulse ring */}
      <div
        className="absolute inset-0 rounded-full border border-cyan-400/20"
        style={{
          transform: `scale(${isBotSpeaking ? 1.5 : 1.35})`,
          animation: isBotSpeaking ? 'pulse 1.5s ease-in-out infinite' : 'none',
        }}
      />

      <Canvas
        camera={{ position: [0, 0, 5], fov: 45 }}
        style={{ background: "transparent" }}
        gl={{ alpha: true, antialias: true }}
      >
        <HolographicCore 
          mousePosition={mousePosition} 
          isPressed={isPressed}
          isUserSpeaking={isUserSpeaking}
          isBotSpeaking={isBotSpeaking}
        />
        <OrbitalRings 
          mousePosition={mousePosition} 
          isPressed={isPressed}
          isUserSpeaking={isUserSpeaking}
          isBotSpeaking={isBotSpeaking}
        />
        <EnergyStreams 
          isUserSpeaking={isUserSpeaking}
          isBotSpeaking={isBotSpeaking}
        />
        <Eyes 
          mousePosition={mousePosition} 
          isPressed={isPressed}
          isUserSpeaking={isUserSpeaking}
          isBotSpeaking={isBotSpeaking}
        />
        <ParticleCloud 
          count={particleCounts[size]} 
          mousePosition={mousePosition} 
          isPressed={isPressed}
          isUserSpeaking={isUserSpeaking}
          isBotSpeaking={isBotSpeaking}
        />
      </Canvas>
    </div>
  );
};

export default InteractiveParticleSphere;
