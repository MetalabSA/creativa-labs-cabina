import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

const ParticleSwarm = () => {
  const { mouse, camera } = useThree();
  const count = 5000;

  // Initialize particles
  const [positions, velocities] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const vel = new Float32Array(count * 3);
    for (let i = 0; i < count * 3; i++) {
      pos[i] = (Math.random() - 0.5) * 30;
      vel[i] = 0;
    }
    return [pos, vel];
  }, []);

  const particlesRef = useRef<THREE.Points>(null);

  // Reusing vectors to avoid garbage collection
  const mouseWorldPos = useRef(new THREE.Vector3());
  const plane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 0, 1), 0), []);
  const raycaster = useMemo(() => new THREE.Raycaster(), []);

  useFrame((state, delta) => {
    if (!particlesRef.current) return;

    // Update mouse world position
    raycaster.setFromCamera(mouse, camera);
    raycaster.ray.intersectPlane(plane, mouseWorldPos.current);

    const posAttr = particlesRef.current.geometry.attributes.position as THREE.BufferAttribute;
    const time = state.clock.getElapsedTime();

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      let px = posAttr.array[i3];
      let py = posAttr.array[i3 + 1];
      let pz = posAttr.array[i3 + 2];

      const dx = mouseWorldPos.current.x - px;
      const dy = mouseWorldPos.current.y - py;
      const dz = mouseWorldPos.current.z - pz;

      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

      // Vortex Physics
      if (dist < 10.0) {
        const force = (10.0 - dist) * 15.0;

        // Attraction
        velocities[i3] += (dx / dist) * force * delta;
        velocities[i3 + 1] += (dy / dist) * force * delta;
        velocities[i3 + 2] += (dz / dist) * force * delta;

        // Swirl (tangential force)
        velocities[i3] += -dy * 5.0 * delta;
        velocities[i3 + 1] += dx * 5.0 * delta;
      }

      // Friction
      velocities[i3] *= 0.92;
      velocities[i3 + 1] *= 0.92;
      velocities[i3 + 2] *= 0.92;

      // Ambient drift
      velocities[i3] += (Math.sin(py * 2 + time) * 0.2) * delta;
      velocities[i3 + 1] += (Math.cos(px * 2 + time) * 0.2) * delta;

      // Update positions
      px += velocities[i3] * delta;
      py += velocities[i3 + 1] * delta;
      pz += velocities[i3 + 2] * delta;

      // Boundary Wrap
      if (px > 20) px = -20; if (px < -20) px = 20;
      if (py > 15) py = -15; if (py < -15) py = 15;

      posAttr.array[i3] = px;
      posAttr.array[i3 + 1] = py;
      posAttr.array[i3 + 2] = pz;
    }

    posAttr.needsUpdate = true;
  });

  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.06}
        color="white"
        transparent
        opacity={0.7}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
};

const RotatingTorus = () => {
  const meshRef = useRef<THREE.Mesh>(null);
  const { mouse } = useThree();

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.x += 0.005 + mouse.y * 0.05;
      meshRef.current.rotation.y += 0.01 + mouse.x * 0.05;
    }
  });

  return (
    <group position={[0, 0, 2.5]}>
      <mesh ref={meshRef} rotation={[0, 0, Math.PI]}>
        <torusGeometry args={[1.8, 0.3, 16, 3]} />
        <meshPhysicalMaterial
          color="#111111"
          metalness={0.9}
          roughness={0.2}
          clearcoat={1.0}
          clearcoatRoughness={0.1}
          emissive="#111111"
          emissiveIntensity={0.1}
        />
        {/* Wireframe Overlay */}
        <lineSegments>
          <wireframeGeometry args={[new THREE.TorusGeometry(1.8, 0.3, 16, 3)]} />
          <lineBasicMaterial color="white" transparent opacity={0.15} />
        </lineSegments>
      </mesh>
    </group>
  );
};

const Background3D: React.FC = () => {
  return (
    <div className="fixed inset-0 z-[-1] pointer-events-none">
      <Canvas
        camera={{ position: [0, 0, 6], fov: 75 }}
        gl={{ antialias: true, alpha: true }}
        dpr={[1, 2]}
      >
        <fog attach="fog" args={[0x050505, 0.003]} />
        <ambientLight intensity={3} color={0x333333} />
        <spotLight position={[10, 10, 10]} angle={Math.PI / 6} penumbra={1} intensity={10} />
        <pointLight position={[-5, -2, 5]} color={0xaaccff} intensity={5} distance={50} />

        <RotatingTorus />
        <ParticleSwarm />
      </Canvas>
      {/* Vignette Overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_30%,#050505_100%)] z-[2]" />
    </div>
  );
};

export default Background3D;