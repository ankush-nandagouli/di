import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function ThreeBackground({ theme = 'dark' }: { theme?: 'light' | 'dark' }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const meshRef = useRef<THREE.Points | null>(null);
  const wireRef = useRef<THREE.LineSegments | null>(null);
  const mouseRef = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const isLight = theme === 'light';
    const clearColorVal = isLight ? 0xffffff : 0x050505;
    const fogColorVal = isLight ? 0xffffff : 0x050505;

    // 1. Create Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.fog = new THREE.FogExp2(fogColorVal, 0.015);

    // 2. Create Camera
    const camera = new THREE.PerspectiveCamera(
      60,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 15, 30);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // 3. Create WebGL Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance',
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setClearColor(clearColorVal, 1);
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 4. Create Waves Geometry (BufferGeometry)
    const width = 85;
    const depth = 85;
    const wSegments = 45;
    const dSegments = 45;
    
    const count = (wSegments + 1) * (dSegments + 1);
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    // Color definitions matching Immersive UI theme (Deep Slate-Indigo & Glowing Cyan for dark; Gold & Amber for light)
    const colorBlue = isLight ? new THREE.Color('#ea580c') : new THREE.Color('#0a1d37'); // Orange-red vs Indigo
    const colorGold = isLight ? new THREE.Color('#b45309') : new THREE.Color('#22d3ee'); // Deep Amber vs Teal cyan

    let idx = 0;
    for (let i = 0; i <= wSegments; i++) {
      const x = (i / wSegments) * width - width / 2;
      for (let j = 0; j <= dSegments; j++) {
        const z = (j / dSegments) * depth - depth / 2;
        positions[idx] = x;
        positions[idx + 1] = 0; // Y starts at 0
        positions[idx + 2] = z;

        // Mix colors based on position to create fluid gradients
        const lerpVal = Math.sin((i / wSegments) * Math.PI) * Math.cos((j / dSegments) * Math.PI) * 0.5 + 0.5;
        const vertexColor = new THREE.Color().copy(colorBlue).lerp(colorGold, lerpVal * 0.6);
        
        // Add variations
        colors[idx] = vertexColor.r;
        colors[idx + 1] = vertexColor.g;
        colors[idx + 2] = vertexColor.b;

        idx += 3;
      }
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    // Particle Shader-like material (using HTML5 Canvas particle Texture)
    const pCanvas = document.createElement('canvas');
    pCanvas.width = 16;
    pCanvas.height = 16;
    const ctx = pCanvas.getContext('2d')!;
    const grad = ctx.createRadialGradient(8, 8, 0, 8, 8, 8);
    
    if (isLight) {
      grad.addColorStop(0, 'rgba(180, 83, 9, 1)'); // Rich gold
      grad.addColorStop(0.3, 'rgba(217, 119, 6, 0.8)');
      grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
    } else {
      grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
      grad.addColorStop(0.3, 'rgba(255, 255, 255, 0.8)');
      grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
    }
    
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 16, 16);
    const particleTexture = new THREE.CanvasTexture(pCanvas);

    const pointsMaterial = new THREE.PointsMaterial({
      size: isLight ? 0.6 : 0.45,
      map: particleTexture,
      transparent: true,
      blending: isLight ? THREE.NormalBlending : THREE.AdditiveBlending,
      vertexColors: true,
      depthWrite: false,
    });

    const particles = new THREE.Points(geometry, pointsMaterial);
    scene.add(particles);
    meshRef.current = particles;

    // 5. Create delicate Wireframe Grid
    // Let's create lines linking the segments for a high-tech "mesh grid" appearance
    const lineIndices: number[] = [];
    for (let i = 0; i < wSegments; i++) {
      for (let j = 0; j < dSegments; j++) {
        const current = i * (dSegments + 1) + j;
        const right = (i + 1) * (dSegments + 1) + j;
        const bottom = i * (dSegments + 1) + (j + 1);

        lineIndices.push(current, right);
        lineIndices.push(current, bottom);
      }
    }

    const linesGeometry = new THREE.BufferGeometry();
    linesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    linesGeometry.setIndex(lineIndices);

    const linesMaterial = new THREE.LineBasicMaterial({
      color: isLight ? 0xd97706 : 0x113d4b,
      transparent: true,
      opacity: isLight ? 0.12 : 0.28,
      blending: isLight ? THREE.NormalBlending : THREE.AdditiveBlending,
    });

    const wireframe = new THREE.LineSegments(linesGeometry, linesMaterial);
    scene.add(wireframe);
    wireRef.current = wireframe;

    // 6. Interactive Floating Lights (Glow points)
    const keyLights: THREE.PointLight[] = [];
    const lightGlowGeometry = new THREE.SphereGeometry(0.2, 8, 8);
    
    const lightColors = isLight ? [0xd97706, 0xb45309, 0xfca5a5] : [0x22d3ee, 0x6366f1, 0x0ea5e9];
    lightColors.forEach((color, i) => {
      const light = new THREE.PointLight(color, isLight ? 1.2 : 2, 40);
      const glowMat = new THREE.MeshBasicMaterial({
        color: color,
        transparent: true,
        opacity: isLight ? 0.4 : 0.6,
      });
      const visual = new THREE.Mesh(lightGlowGeometry, glowMat);
      light.add(visual);
      scene.add(light);
      keyLights.push(light);
    });

    // Ambient illumination
    const ambientLight = new THREE.AmbientLight(isLight ? 0xfef3c7 : 0x081e26, isLight ? 1.2 : 0.8);
    scene.add(ambientLight);

    // 7. Track mouse movements
    const handleMouseMove = (event: MouseEvent) => {
      // Normalize coordinate: -1 to 1
      mouseRef.current.targetX = (event.clientX / window.innerWidth) * 2 - 1;
      mouseRef.current.targetY = -(event.clientY / window.innerHeight) * 2 + 1;
    };
    window.addEventListener('mousemove', handleMouseMove);

    // 8. Animation loop
    let animationFrameId: number;
    const startTime = performance.now();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      const time = ((performance.now() - startTime) / 1000) * 0.45;

      // Smooth lerp mouse coordinates
      const mouse = mouseRef.current;
      mouse.x += (mouse.targetX - mouse.x) * 0.08;
      mouse.y += (mouse.targetY - mouse.y) * 0.08;

      // Subtle camera pan based on mouse
      if (camera) {
        camera.position.x = mouse.x * 6;
        camera.position.y = 15 + mouse.y * 3;
        camera.lookAt(meshRef.current?.position || new THREE.Vector3(0, 0, 0));
      }

      // Deform wave heights (Y-axis) using sine & cosine combos
      const ptAttr = geometry.getAttribute('position') as THREE.BufferAttribute;
      const wireAttr = linesGeometry.getAttribute('position') as THREE.BufferAttribute;
      
      if (ptAttr && wireAttr) {
        let arrayIdx = 0;
        for (let i = 0; i <= wSegments; i++) {
          for (let j = 0; j <= dSegments; j++) {
            const x = ptAttr.getX(arrayIdx);
            const z = ptAttr.getZ(arrayIdx);

            // Mathematical fluid expression
            // Base ripple + secondary high-frequency ripple + mouse proximity pull
            let y = Math.sin(x * 0.12 + time) * Math.cos(z * 0.12 + time) * 2.2;
            y += Math.sin(x * 0.25 - time * 1.5) * 0.5;
            
            // Mouse distortion factor
            const distToMouse = Math.sqrt((x - mouse.x * 35) ** 2 + (z - mouse.y * 35) ** 2);
            if (distToMouse < 25) {
              const strength = (1 - distToMouse / 25) ** 2;
              y += strength * 4.0 * Math.sin(time * 3);
            }

            ptAttr.setY(arrayIdx, y);
            wireAttr.setY(arrayIdx, y);
            arrayIdx++;
          }
        }
        ptAttr.needsUpdate = true;
        wireAttr.needsUpdate = true;
      }

      // Move key lights in elegant orbits
      keyLights.forEach((light, i) => {
        const angle = time * 0.8 + (i * Math.PI * 2) / 3;
        const radius = 25 + Math.sin(time * 0.5 + i) * 6;
        light.position.x = Math.sin(angle) * radius;
        light.position.z = Math.cos(angle) * radius;
        light.position.y = Math.sin(time * 1.2 + i) * 4 + 3;
      });

      // Slowly rotate the entire mesh system
      if (particles) particles.rotation.y = time * 0.02;
      if (wireframe) wireframe.rotation.y = time * 0.02;

      renderer.render(scene, camera);
    };

    animate();

    // 9. RE-SIZE OBSERVER Implementation as constraint requirements
    const resizeObserver = new ResizeObserver((entries) => {
      if (!entries || entries.length === 0) return;
      const { width, height } = entries[0].contentRect;
      
      if (!rendererRef.current || !cameraRef.current) return;

      // Debounce-like safety or direct updates
      const activeWidth = Math.max(width, 100);
      const activeHeight = Math.max(height, 100);

      cameraRef.current.aspect = activeWidth / activeHeight;
      cameraRef.current.updateProjectionMatrix();
      
      rendererRef.current.setSize(activeWidth, activeHeight);
      rendererRef.current.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    });

    resizeObserver.observe(container);

    // 10. Clean-up logic
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();

      // Dispose Three objects
      geometry.dispose();
      linesGeometry.dispose();
      pointsMaterial.dispose();
      linesMaterial.dispose();
      particleTexture.dispose();
      lightGlowGeometry.dispose();

      if (rendererRef.current) {
        if (container.contains(rendererRef.current.domElement)) {
          container.removeChild(rendererRef.current.domElement);
        }
        rendererRef.current.dispose();
      }
    };
  }, [theme]);

  return (
    <div 
      id="3d-mesh-background"
      ref={containerRef} 
      className={`absolute inset-0 w-full h-full overflow-hidden -z-10 transition-colors duration-500 ${theme === 'light' ? 'bg-white' : 'bg-[#050505]'}`}
      style={{ touchAction: 'none' }}
    />
  );
}
