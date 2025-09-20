import React, { useRef, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, useGLTF } from '@react-three/drei';

function Model({ url }) {
  const { scene } = useGLTF(url);

  useEffect(() => {
    const root = getComputedStyle(document.documentElement);
    const primary = root.getPropertyValue('--primary-color') || '#ffffff';
    const secondary = root.getPropertyValue('--secondary-color') || '#cccccc';
    const accent = root.getPropertyValue('--accent-color') || '#999999';

    let i = 0;
    scene.traverse((child) => {
      if (child.isMesh && child.material) {
        // cycle through css colors
        if (i % 3 === 0) child.material.color.set(primary.trim());
        else if (i % 3 === 1) child.material.color.set(secondary.trim());
        else child.material.color.set(accent.trim());
        i++;
      }
    });
  }, [scene]);

  return <primitive object={scene} scale={[2.8, 2.8, 2.8]} position={[2, -3.5, 0]} />;
}

function Controls() {
  const controlsRef = useRef();
  
  useFrame(() => {
    if (controlsRef.current) {
      controlsRef.current.update();
    }
  });

  return (
    <OrbitControls
      ref={controlsRef}
      autoRotate
      autoRotateSpeed={1.0}
      enableDamping
      dampingFactor={0.05}
    />
  );
}

export default function ModelViewer() {
  return (
    <Canvas 
      style={{ height: '500px' }} 
      camera={{ position: [0, 5, 20], fov: 50, near: 0.1, far: 50 }}
    >
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} />
      <Controls />
      <Model url="scene.gltf" />
    </Canvas>
  );
}
