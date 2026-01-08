import { useRef, useMemo, useState, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface SphereProps {
  mousePosition: { x: number; y: number };
  isPressed: boolean;
  isUserSpeaking: boolean;
  isBotSpeaking: boolean;
}

// Iridescent gradient sphere using custom shader
const GradientSphere = ({ mousePosition, isPressed, isUserSpeaking, isBotSpeaking }: SphereProps) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const targetRotation = useRef({ x: 0, y: 0 });
  const currentScale = useRef(1);
  const waveIntensity = useRef(0);

  const shaderMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        mouseX: { value: 0 },
        mouseY: { value: 0 },
        waveIntensity: { value: 0 },
        isBotSpeaking: { value: 0 },
      },
      vertexShader: `
        uniform float time;
        uniform float waveIntensity;
        uniform float isBotSpeaking;
        
        varying vec3 vNormal;
        varying vec3 vPosition;
        varying vec2 vUv;
        
        void main() {
          vNormal = normalize(normalMatrix * normal);
          vUv = uv;
          
          vec3 pos = position;
          
          // Wave displacement when bot speaks
          if (isBotSpeaking > 0.0) {
            float wave1 = sin(pos.x * 3.0 + time * 4.0) * waveIntensity * 0.08;
            float wave2 = sin(pos.y * 4.0 + time * 3.5) * waveIntensity * 0.06;
            float wave3 = cos(pos.z * 2.5 + time * 5.0) * waveIntensity * 0.07;
            float wave4 = sin(length(pos.xy) * 5.0 - time * 6.0) * waveIntensity * 0.05;
            
            pos += normal * (wave1 + wave2 + wave3 + wave4);
          }
          
          vPosition = pos;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
      `,
      fragmentShader: `
        uniform float time;
        uniform float mouseX;
        uniform float mouseY;
        uniform float waveIntensity;
        uniform float isBotSpeaking;
        
        varying vec3 vNormal;
        varying vec3 vPosition;
        varying vec2 vUv;
        
        void main() {
          // Base gradient colors - teal to blue to pink
          vec3 teal = vec3(0.0, 0.8, 0.7);
          vec3 blue = vec3(0.2, 0.5, 1.0);
          vec3 pink = vec3(0.9, 0.3, 0.5);
          vec3 coral = vec3(1.0, 0.5, 0.4);
          
          // Create flowing gradient based on position and time
          float timeSpeed = isBotSpeaking > 0.0 ? 0.8 : 0.3;
          float angle = atan(vPosition.y, vPosition.x) + time * timeSpeed;
          
          // Mix colors based on angle and position
          float t1 = sin(angle * 2.0 + time * 0.5) * 0.5 + 0.5;
          float t2 = cos(angle * 1.5 - time * 0.3 + vPosition.z) * 0.5 + 0.5;
          float t3 = sin(vPosition.z * 2.0 + time * 0.4) * 0.5 + 0.5;
          
          // Mouse influence on colors
          float mouseInfluence = mouseX * 0.3;
          
          vec3 color1 = mix(teal, blue, t1 + mouseInfluence);
          vec3 color2 = mix(blue, pink, t2);
          vec3 color3 = mix(pink, coral, t3);
          
          vec3 finalColor = mix(color1, color2, t2);
          finalColor = mix(finalColor, color3, t3 * 0.5);
          
          // Enhanced color shift when speaking
          if (isBotSpeaking > 0.0) {
            float speakPulse = sin(time * 8.0) * 0.5 + 0.5;
            finalColor = mix(finalColor, finalColor * 1.3, speakPulse * waveIntensity * 0.3);
          }
          
          // Add rim lighting effect
          float rim = 1.0 - abs(dot(vNormal, vec3(0.0, 0.0, 1.0)));
          rim = pow(rim, 2.0);
          finalColor += rim * vec3(0.3, 0.5, 0.8) * 0.5;
          
          // Add subtle shine
          float shine = pow(max(0.0, dot(vNormal, normalize(vec3(0.5, 0.5, 1.0)))), 8.0);
          finalColor += shine * vec3(1.0) * 0.3;
          
          gl_FragColor = vec4(finalColor, 0.95);
        }
      `,
      transparent: true,
    });
  }, []);

  useFrame((state) => {
    if (!meshRef.current || !materialRef.current) return;

    const time = state.clock.elapsedTime;
    materialRef.current.uniforms.time.value = time;
    materialRef.current.uniforms.mouseX.value = mousePosition.x;
    materialRef.current.uniforms.mouseY.value = mousePosition.y;

    // Wave intensity for bot speaking
    const targetWave = isBotSpeaking ? 1 : 0;
    waveIntensity.current += (targetWave - waveIntensity.current) * 0.1;
    materialRef.current.uniforms.waveIntensity.value = waveIntensity.current;
    materialRef.current.uniforms.isBotSpeaking.value = isBotSpeaking ? 1 : 0;

    // Follow mouse smoothly
    targetRotation.current.x = mousePosition.y * 0.25;
    targetRotation.current.y = mousePosition.x * 0.4;

    meshRef.current.rotation.x += (targetRotation.current.x - meshRef.current.rotation.x) * 0.06;
    meshRef.current.rotation.y += (targetRotation.current.y - meshRef.current.rotation.y) * 0.06;

    // Rotation speed based on state
    const baseRotation = 0.002;
    const userSpeakingRotation = isUserSpeaking ? 0.015 : 0;
    meshRef.current.rotation.y += baseRotation + userSpeakingRotation;
    
    if (isUserSpeaking) {
      meshRef.current.rotation.x += Math.sin(time * 3) * 0.003;
    }

    // Zoom on press
    const targetScale = isPressed ? 1.1 : 1;
    currentScale.current += (targetScale - currentScale.current) * 0.1;
    meshRef.current.scale.setScalar(currentScale.current);
  });

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[1.5, 64, 64]} />
      <primitive object={shaderMaterial} ref={materialRef} attach="material" />
    </mesh>
  );
};

// Animated eyes with blinking and emotions
const Eyes = ({ mousePosition, isPressed, isUserSpeaking, isBotSpeaking }: SphereProps) => {
  const leftEyeRef = useRef<THREE.Group>(null);
  const rightEyeRef = useRef<THREE.Group>(null);
  const leftEyeMeshRef = useRef<THREE.Mesh>(null);
  const rightEyeMeshRef = useRef<THREE.Mesh>(null);
  const currentScale = useRef(1);
  const blinkProgress = useRef(0);
  const lastBlinkTime = useRef(0);
  const isBlinking = useRef(false);
  const emotionState = useRef<"normal" | "happy" | "curious" | "sleepy" | "attentive">("normal");
  const emotionTimer = useRef(0);

  useFrame((state) => {
    if (!leftEyeRef.current || !rightEyeRef.current) return;
    if (!leftEyeMeshRef.current || !rightEyeMeshRef.current) return;

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

    // Blinking logic - blink every 3-5 seconds (less when attentive)
    const blinkInterval = emotionState.current === "attentive" ? 5 : 3;
    if (!isBlinking.current && time - lastBlinkTime.current > blinkInterval + Math.random() * 2) {
      isBlinking.current = true;
      lastBlinkTime.current = time;
    }

    // Blink animation
    if (isBlinking.current) {
      blinkProgress.current += 0.18;
      if (blinkProgress.current >= Math.PI) {
        blinkProgress.current = 0;
        isBlinking.current = false;
      }
    }

    const blinkScale = 1 - Math.sin(blinkProgress.current) * 0.9;

    // Eye shape based on emotion
    let eyeScaleY = blinkScale;
    let eyeOffsetY = 0;
    let eyeRotation = 0;

    switch (emotionState.current) {
      case "happy":
        eyeScaleY *= 0.7;
        eyeOffsetY = 0.05;
        break;
      case "curious":
        eyeScaleY *= 1.1;
        eyeRotation = Math.sin(time * 2) * 0.1;
        break;
      case "sleepy":
        eyeScaleY *= 0.5;
        eyeOffsetY = -0.03;
        break;
      case "attentive":
        eyeScaleY *= 1.15; // Wide open, alert
        eyeRotation = Math.sin(time * 4) * 0.02; // Slight movement
        break;
      default:
        eyeScaleY *= 1 + Math.sin(time * 1.5) * 0.05;
    }

    // Apply eye transformations
    leftEyeMeshRef.current.scale.y = eyeScaleY;
    rightEyeMeshRef.current.scale.y = eyeScaleY;
    leftEyeMeshRef.current.position.y = 0.1 + eyeOffsetY;
    rightEyeMeshRef.current.position.y = 0.1 + eyeOffsetY;

    // Eyes follow mouse with slight delay
    const eyeRotationX = mousePosition.y * 0.25;
    const eyeRotationY = mousePosition.x * 0.4;

    // When user speaks, eyes are more focused (less movement)
    const eyeMovementDamping = isUserSpeaking ? 0.5 : 1;

    leftEyeRef.current.rotation.x = eyeRotationX * eyeMovementDamping + eyeRotation;
    leftEyeRef.current.rotation.y = eyeRotationY * eyeMovementDamping + 0.002;
    rightEyeRef.current.rotation.x = eyeRotationX * eyeMovementDamping - eyeRotation;
    rightEyeRef.current.rotation.y = eyeRotationY * eyeMovementDamping + 0.002;

    // Bot speaking - subtle eye pulse
    if (isBotSpeaking) {
      const speakPulse = Math.sin(time * 6) * 0.03;
      leftEyeMeshRef.current.scale.x = 1 + speakPulse;
      rightEyeMeshRef.current.scale.x = 1 + speakPulse;
    } else {
      leftEyeMeshRef.current.scale.x = 1;
      rightEyeMeshRef.current.scale.x = 1;
    }

    // Scale on press - "surprised" reaction
    const targetScale = isPressed ? 1.15 : 1;
    currentScale.current += (targetScale - currentScale.current) * 0.15;
    leftEyeRef.current.scale.setScalar(currentScale.current);
    rightEyeRef.current.scale.setScalar(currentScale.current);

    if (isPressed) {
      leftEyeMeshRef.current.scale.y = 1.2;
      rightEyeMeshRef.current.scale.y = 1.2;
    }
  });

  // Create rounded rectangle shape for eyes
  const eyeShape = useMemo(() => {
    const shape = new THREE.Shape();
    const width = 0.12;
    const height = 0.35;
    const radius = 0.06;

    shape.moveTo(-width / 2 + radius, -height / 2);
    shape.lineTo(width / 2 - radius, -height / 2);
    shape.quadraticCurveTo(width / 2, -height / 2, width / 2, -height / 2 + radius);
    shape.lineTo(width / 2, height / 2 - radius);
    shape.quadraticCurveTo(width / 2, height / 2, width / 2 - radius, height / 2);
    shape.lineTo(-width / 2 + radius, height / 2);
    shape.quadraticCurveTo(-width / 2, height / 2, -width / 2, height / 2 - radius);
    shape.lineTo(-width / 2, -height / 2 + radius);
    shape.quadraticCurveTo(-width / 2, -height / 2, -width / 2 + radius, -height / 2);

    return shape;
  }, []);

  const extrudeSettings = useMemo(
    () => ({
      depth: 0.05,
      bevelEnabled: true,
      bevelThickness: 0.02,
      bevelSize: 0.02,
      bevelSegments: 8,
    }),
    []
  );

  return (
    <>
      <group ref={leftEyeRef}>
        <mesh ref={leftEyeMeshRef} position={[-0.35, 0.1, 1.42]}>
          <extrudeGeometry args={[eyeShape, extrudeSettings]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>
        <mesh position={[-0.35, 0.1, 1.38]}>
          <planeGeometry args={[0.25, 0.5]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.3} blending={THREE.AdditiveBlending} />
        </mesh>
      </group>

      <group ref={rightEyeRef}>
        <mesh ref={rightEyeMeshRef} position={[0.35, 0.1, 1.42]}>
          <extrudeGeometry args={[eyeShape, extrudeSettings]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>
        <mesh position={[0.35, 0.1, 1.38]}>
          <planeGeometry args={[0.25, 0.5]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.3} blending={THREE.AdditiveBlending} />
        </mesh>
      </group>
    </>
  );
};

// Outer particle cloud with wave effect
const ParticleCloud = ({ count, mousePosition, isPressed, isUserSpeaking, isBotSpeaking }: SphereProps & { count: number }) => {
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
      const radius = 1.7 + Math.random() * 0.6;

      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = radius * Math.cos(phi);

      const colorChoice = Math.random();
      if (colorChoice < 0.4) {
        colors[i * 3] = 0.0 + Math.random() * 0.2;
        colors[i * 3 + 1] = 0.7 + Math.random() * 0.3;
        colors[i * 3 + 2] = 0.7 + Math.random() * 0.3;
      } else if (colorChoice < 0.7) {
        colors[i * 3] = 0.2 + Math.random() * 0.2;
        colors[i * 3 + 1] = 0.4 + Math.random() * 0.3;
        colors[i * 3 + 2] = 0.9 + Math.random() * 0.1;
      } else {
        colors[i * 3] = 0.9 + Math.random() * 0.1;
        colors[i * 3 + 1] = 0.4 + Math.random() * 0.2;
        colors[i * 3 + 2] = 0.4 + Math.random() * 0.2;
      }

      sizes[i] = Math.random() * 0.012 + 0.006;
    }

    originalPositions.current = positions.slice();
    return [positions, colors, sizes];
  }, [count]);

  useFrame((state) => {
    if (!meshRef.current || !originalPositions.current) return;

    const time = state.clock.elapsedTime;

    targetRotation.current.x = mousePosition.y * 0.25;
    targetRotation.current.y = mousePosition.x * 0.4;

    meshRef.current.rotation.x += (targetRotation.current.x - meshRef.current.rotation.x) * 0.05;
    meshRef.current.rotation.y += (targetRotation.current.y - meshRef.current.rotation.y) * 0.05;
    
    // Faster rotation when user speaks
    const baseRotation = 0.002;
    const userSpeakingRotation = isUserSpeaking ? 0.012 : 0;
    meshRef.current.rotation.y += baseRotation + userSpeakingRotation;

    const targetScale = isPressed ? 1.1 : 1;
    currentScale.current += (targetScale - currentScale.current) * 0.1;
    meshRef.current.scale.setScalar(currentScale.current);

    const geometry = meshRef.current.geometry;
    const positionAttribute = geometry.attributes.position;
    const positionsArray = positionAttribute.array as Float32Array;

    // Noise intensity based on state
    const baseNoise = 0.01;
    const speakingNoise = isBotSpeaking ? 0.04 : 0;
    const noiseIntensity = baseNoise + speakingNoise + (isPressed ? 0.01 : 0);

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      const originalX = originalPositions.current[i3];
      const originalY = originalPositions.current[i3 + 1];
      const originalZ = originalPositions.current[i3 + 2];

      // Base noise
      let noiseX = Math.sin(time * 0.3 + i * 0.03) * noiseIntensity;
      let noiseY = Math.cos(time * 0.25 + i * 0.04) * noiseIntensity;
      let noiseZ = Math.sin(time * 0.2 + i * 0.05) * noiseIntensity;

      // Wave effect when bot speaks - particles ripple outward
      if (isBotSpeaking) {
        const dist = Math.sqrt(originalX * originalX + originalY * originalY + originalZ * originalZ);
        const wavePhase = dist * 3 - time * 8;
        const waveAmplitude = Math.sin(wavePhase) * 0.06;
        
        const nx = originalX / dist;
        const ny = originalY / dist;
        const nz = originalZ / dist;
        
        noiseX += nx * waveAmplitude;
        noiseY += ny * waveAmplitude;
        noiseZ += nz * waveAmplitude;
      }

      positionsArray[i3] = originalX + noiseX;
      positionsArray[i3 + 1] = originalY + noiseY;
      positionsArray[i3 + 2] = originalZ + noiseZ;
    }

    positionAttribute.needsUpdate = true;
  });

  return (
    <points ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
        <bufferAttribute attach="attributes-color" count={count} array={colors} itemSize={3} />
        <bufferAttribute attach="attributes-size" count={count} array={sizes} itemSize={1} />
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
    small: 1500,
    normal: 2500,
    large: 3500,
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

  // Dynamic glow based on speaking state
  const glowIntensity = isBotSpeaking ? 1.4 : isUserSpeaking ? 1.2 : 1.15;

  return (
    <div ref={containerRef} className={`${sizeClasses[size]} cursor-pointer relative`}>
      {/* Ambient glow - intensifies when speaking */}
      <div
        className="absolute inset-0 rounded-full transition-transform duration-300"
        style={{
          background: `radial-gradient(circle, rgba(0, 200, 180, ${isBotSpeaking ? 0.5 : 0.3}) 0%, rgba(50, 120, 220, ${isBotSpeaking ? 0.35 : 0.2}) 40%, rgba(255, 100, 100, ${isBotSpeaking ? 0.2 : 0.1}) 60%, transparent 75%)`,
          transform: `scale(${isPressed ? 1.3 : glowIntensity})`,
          filter: "blur(25px)",
        }}
      />

      <Canvas
        camera={{ position: [0, 0, 4.5], fov: 45 }}
        style={{ background: "transparent" }}
        gl={{ alpha: true, antialias: true }}
      >
        <ParticleCloud 
          count={particleCounts[size]} 
          mousePosition={mousePosition} 
          isPressed={isPressed}
          isUserSpeaking={isUserSpeaking}
          isBotSpeaking={isBotSpeaking}
        />
        <GradientSphere 
          mousePosition={mousePosition} 
          isPressed={isPressed}
          isUserSpeaking={isUserSpeaking}
          isBotSpeaking={isBotSpeaking}
        />
        <Eyes 
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
