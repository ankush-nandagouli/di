import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { motion, AnimatePresence } from 'motion/react';
import { 
  RotateCw, Pause, Play, RefreshCw, Eye, Sparkles, 
  Settings2, ShieldAlert, Box, Layers
} from 'lucide-react';
import DakshyamLogo from './DakshyamLogo';
import Admin3DModelEditorModal from './Admin3DModelEditorModal';
import { 
  loadObjModel, StoredModelMetadata, ModelDisplaySettings, DEFAULT_MODEL_SETTINGS 
} from '../utils/modelStorage';

interface Home3DArtViewerProps {
  theme?: 'light' | 'dark';
  isAdmin?: boolean;
  onNavigateToAdmin?: () => void;
}

const STORAGE_KEY = 'home_custom_3d_obj';

export default function Home3DArtViewer({ 
  theme = 'dark', 
  isAdmin = false,
  onNavigateToAdmin
}: Home3DArtViewerProps) {
  const isLight = theme === 'light';

  // Model & State
  const [hasCustomModel, setHasCustomModel] = useState<boolean>(false);
  const [modelData, setModelData] = useState<string | ArrayBuffer | null>(null);
  const [metadata, setMetadata] = useState<StoredModelMetadata | null>(null);
  const [settings, setSettings] = useState<ModelDisplaySettings>(DEFAULT_MODEL_SETTINGS);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [parseError, setParseError] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);

  // Viewer interactive overlay states
  const [isRotatingLocally, setIsRotatingLocally] = useState<boolean>(true);
  const [isWireframeLocally, setIsWireframeLocally] = useState<boolean>(false);
  const [showAdminModal, setShowAdminModal] = useState<boolean>(false);

  // Three.js Canvas Refs
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const rootGroupRef = useRef<THREE.Group | null>(null);
  const animationFrameIdRef = useRef<number | null>(null);

  // 1. Fetch Model and Settings from IndexedDB
  const fetchModel = useCallback(async () => {
    setIsLoading(true);
    try {
      const stored = await loadObjModel(STORAGE_KEY);
      if (stored && stored.objText && stored.meta) {
        setModelData(stored.objText);
        setMetadata(stored.meta);
        setHasCustomModel(true);

        const loadedSettings: ModelDisplaySettings = {
          ...DEFAULT_MODEL_SETTINGS,
          ...(stored.meta.settings || {}),
          materialColor: stored.meta.settings?.materialColor || stored.meta.materialColor || DEFAULT_MODEL_SETTINGS.materialColor,
          wireframe: stored.meta.settings?.wireframe ?? stored.meta.wireframe ?? DEFAULT_MODEL_SETTINGS.wireframe,
          autoRotate: stored.meta.settings?.autoRotate ?? stored.meta.autoRotate ?? DEFAULT_MODEL_SETTINGS.autoRotate
        };

        setSettings(loadedSettings);
        setIsRotatingLocally(loadedSettings.autoRotate);
        setIsWireframeLocally(loadedSettings.wireframe);
      } else {
        setHasCustomModel(false);
        setModelData(null);
        setMetadata(null);
      }
    } catch (err) {
      console.warn('Could not load custom 3D model:', err);
      setHasCustomModel(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchModel();
  }, [fetchModel, refreshTrigger]);

  // 2. Initialize Three.js Scene and Render Normalized Model
  useEffect(() => {
    if (!hasCustomModel || !modelData || !containerRef.current) return;

    const container = containerRef.current;
    const width = container.clientWidth || 500;
    const height = container.clientHeight || 450;

    // Clean up previous instance
    if (animationFrameIdRef.current) {
      cancelAnimationFrame(animationFrameIdRef.current);
    }
    if (rendererRef.current && rendererRef.current.domElement) {
      if (container.contains(rendererRef.current.domElement)) {
        container.removeChild(rendererRef.current.domElement);
      }
      rendererRef.current.dispose();
    }

    // A. Create Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // B. Create Camera with wide frustum to prevent clipping
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.01, 2000);
    camera.position.set(0, 1.2, 6.0);
    cameraRef.current = camera;
    scene.add(camera);

    // C. Create WebGL Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.setClearColor(0x000000, 0); // Transparent background
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.35;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // D. OrbitControls (Smooth mouse/touch rotation for everyone)
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.autoRotate = isRotatingLocally;
    controls.autoRotateSpeed = (settings.autoRotateSpeed || 2.0) * (settings.autoRotateDirection || 1);
    controls.enableZoom = true;
    controls.minDistance = 1.0;
    controls.maxDistance = 25.0;
    controls.target.set(0, 0, 0);
    controls.update();
    controlsRef.current = controls;

    // E. Lighting System (Camera Headlight + Hemisphere + Ambient + Accents)
    // 1. Camera Headlight: attached to camera so facing surfaces are ALWAYS lit
    const headlight = new THREE.DirectionalLight(0xffffff, settings.headlightIntensity || 2.5);
    camera.add(headlight);

    // 2. Hemisphere ambient fill
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x1e293b, (settings.ambientLightIntensity || 1.8) * 0.65);
    scene.add(hemiLight);

    // 3. Global ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, (settings.ambientLightIntensity || 1.8) * 0.7);
    scene.add(ambientLight);

    // 4. Cyan Rim / Accent Light for specular edges
    const rimLight = new THREE.DirectionalLight(0x38bdf8, 1.8);
    rimLight.position.set(-10, 12, -8);
    scene.add(rimLight);

    // 5. Warm accent light from bottom
    const warmBottomLight = new THREE.DirectionalLight(0xfbbf24, 1.0);
    warmBottomLight.position.set(8, -10, 8);
    scene.add(warmBottomLight);

    // F. Parse 3D Model (Supports both .obj and .glb / .gltf / .gbl)
    const renderSceneObject = (rawObject: THREE.Object3D) => {
      // Create material based on active settings
      const hexColor = parseInt(settings.materialColor.replace('#', ''), 16) || 0x38bdf8;
      const wireframeActive = isWireframeLocally || settings.wireframe;

      let activeMaterial: THREE.Material;

      if (settings.style === 'clay') {
        activeMaterial = new THREE.MeshStandardMaterial({
          color: 0xf1f5f9,
          roughness: 0.75,
          metalness: 0.05,
          wireframe: wireframeActive,
          side: THREE.DoubleSide
        });
      } else if (settings.style === 'hologram') {
        activeMaterial = new THREE.MeshStandardMaterial({
          color: hexColor,
          emissive: hexColor,
          emissiveIntensity: 0.45,
          roughness: 0.2,
          metalness: 0.8,
          wireframe: true,
          transparent: true,
          opacity: 0.9,
          side: THREE.DoubleSide
        });
      } else if (settings.style === 'chrome') {
        activeMaterial = new THREE.MeshStandardMaterial({
          color: 0xffffff,
          roughness: 0.08,
          metalness: 0.95,
          wireframe: wireframeActive,
          side: THREE.DoubleSide
        });
      } else if (settings.style === 'normals') {
        activeMaterial = new THREE.MeshNormalMaterial({
          wireframe: wireframeActive,
          side: THREE.DoubleSide
        });
      } else {
        // Default Metallic PBR
        activeMaterial = new THREE.MeshStandardMaterial({
          color: hexColor,
          emissive: hexColor,
          emissiveIntensity: 0.12,
          roughness: settings.roughness ?? 0.25,
          metalness: settings.metalness ?? 0.75,
          wireframe: wireframeActive,
          side: THREE.DoubleSide
        });
      }

      // Apply material and compute normals on every child mesh
      rawObject.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const mesh = child as THREE.Mesh;
          if (mesh.geometry) {
            mesh.geometry.computeVertexNormals();
            mesh.geometry.computeBoundingBox();
            mesh.geometry.computeBoundingSphere();
          }
          // If the model had no textures/materials or style is overridden, assign activeMaterial
          mesh.material = activeMaterial;
          mesh.castShadow = true;
          mesh.receiveShadow = true;
        }
      });

      // --- MATHEMATICAL AUTO-NORMALIZATION ---
      const rawBox = new THREE.Box3().setFromObject(rawObject);
      const rawCenter = rawBox.getCenter(new THREE.Vector3());
      const rawSize = rawBox.getSize(new THREE.Vector3());

      // Center the raw object at (0, 0, 0)
      rawObject.position.set(-rawCenter.x, -rawCenter.y, -rawCenter.z);

      // Wrap inside a root transformation group
      const rootGroup = new THREE.Group();
      rootGroup.add(rawObject);

      // Normalize scale so largest dimension fits cleanly in viewport
      const maxDim = Math.max(rawSize.x, rawSize.y, rawSize.z);
      const baseScale = maxDim > 0.0001 ? (4.2 / maxDim) : 1.0;
      const finalScale = baseScale * (settings.scale || 1.0);
      rootGroup.scale.set(finalScale, finalScale, finalScale);

      // Apply orientation angles (degrees to radians)
      rootGroup.rotation.x = THREE.MathUtils.degToRad(settings.rotationX || 0);
      rootGroup.rotation.y = THREE.MathUtils.degToRad(settings.rotationY || 0);
      rootGroup.rotation.z = THREE.MathUtils.degToRad(settings.rotationZ || 0);

      // Apply vertical elevation
      rootGroup.position.y = settings.offsetY || 0;

      scene.add(rootGroup);
      rootGroupRef.current = rootGroup;
    };

    try {
      setParseError(null);
      const isGlbOrGltf = 
        metadata?.format === 'glb' || 
        metadata?.format === 'gltf' || 
        metadata?.name?.toLowerCase().endsWith('.glb') || 
        metadata?.name?.toLowerCase().endsWith('.gbl') || 
        metadata?.name?.toLowerCase().endsWith('.gltf') ||
        modelData instanceof ArrayBuffer;

      if (isGlbOrGltf) {
        const gltfLoader = new GLTFLoader();
        gltfLoader.parse(
          modelData,
          '',
          (gltf) => {
            renderSceneObject(gltf.scene);
          },
          (err) => {
            console.error('Error parsing GLB/GLTF model:', err);
            setParseError('Unable to parse 3D GLB model.');
          }
        );
      } else {
        const objLoader = new OBJLoader();
        const rawObject = objLoader.parse(modelData as string);
        renderSceneObject(rawObject);
      }
    } catch (err: any) {
      console.error('Error constructing 3D scene:', err);
      setParseError(err.message || 'Unable to display 3D model. Restoring default art.');
    }

    // G. Animation loop
    const animate = () => {
      animationFrameIdRef.current = requestAnimationFrame(animate);
      if (controlsRef.current) {
        controlsRef.current.update();
      }
      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    };
    animate();

    // H. Responsive Resize Observer
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width: newW, height: newH } = entry.contentRect;
        if (newW > 0 && newH > 0 && cameraRef.current && rendererRef.current) {
          cameraRef.current.aspect = newW / newH;
          cameraRef.current.updateProjectionMatrix();
          rendererRef.current.setSize(newW, newH);
        }
      }
    });
    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
      if (controlsRef.current) {
        controlsRef.current.dispose();
      }
      if (rendererRef.current && rendererRef.current.domElement) {
        if (container.contains(rendererRef.current.domElement)) {
          container.removeChild(rendererRef.current.domElement);
        }
        rendererRef.current.dispose();
      }
    };
  }, [hasCustomModel, modelData, settings, isWireframeLocally, isRotatingLocally]);

  // Reset Camera View (Admin tool)
  const handleResetCamera = () => {
    if (cameraRef.current && controlsRef.current) {
      cameraRef.current.position.set(0, 1.2, 6.0);
      controlsRef.current.target.set(0, 0, 0);
      cameraRef.current.lookAt(0, 0, 0);
      controlsRef.current.update();
    }
  };

  // Toggle local rotation (Admin tool)
  const handleToggleRotation = () => {
    setIsRotatingLocally(prev => {
      const next = !prev;
      if (controlsRef.current) {
        controlsRef.current.autoRotate = next;
      }
      return next;
    });
  };

  // Toggle wireframe (Admin tool)
  const handleToggleWireframe = () => {
    setIsWireframeLocally(prev => !prev);
  };

  // --- FALLBACK: DEFAULT DAKSHYAM 3D VECTOR EMBLEM ---
  if (!hasCustomModel || parseError) {
    return (
      <div className="flex flex-col items-center justify-center relative w-full">
        <div className="scale-90 md:scale-100 transition-all">
          <DakshyamLogo size="lg" pulseGlow={true} interactive={true} showText={true} theme={theme} />
        </div>

        {/* Error notification if parsing failed */}
        {parseError && (
          <div className="mt-3 p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-mono max-w-md text-center">
            {parseError}
          </div>
        )}

        {/* ONLY ADMIN CAN ADD OR CHANGE THE MODEL */}
        {isAdmin && (
          <div className="mt-4 flex flex-col items-center space-y-2">
            <button
              onClick={() => setShowAdminModal(true)}
              className="px-4 py-2 rounded-xl text-xs font-mono font-bold bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/40 text-cyan-300 transition-all cursor-pointer flex items-center gap-2 shadow-sm group"
            >
              <Settings2 className="w-4 h-4 text-cyan-400 group-hover:rotate-45 transition-transform" />
              <span>Admin 3D Studio: Upload Custom 3D Model</span>
            </button>
            <p className="text-[10px] font-mono text-slate-400">
              Only visible to administrators. Visitors see the official logo.
            </p>
          </div>
        )}

        {/* Admin 3D Customizer Modal */}
        {isAdmin && (
          <Admin3DModelEditorModal
            isOpen={showAdminModal}
            onClose={() => setShowAdminModal(false)}
            metadata={metadata}
            onModelChanged={() => {
              setRefreshTrigger(prev => prev + 1);
            }}
            theme={theme}
            storageKey={STORAGE_KEY}
          />
        )}
      </div>
    );
  }

  // --- ACTIVE CUSTOM 3D MODEL STAGE ---
  return (
    <div className="relative w-full max-w-4xl mx-auto flex flex-col items-center">
      {/* 3D Canvas Stage Container - Clean, uninterrupted viewport */}
      <div 
        className={`relative w-full h-[380px] sm:h-[460px] md:h-[500px] rounded-3xl overflow-hidden transition-all duration-300 select-none ${
          isLight ? 'bg-blue-50/20' : 'bg-transparent'
        }`}
      >
        {/* Atmospheric Radial Backdrop Glow */}
        {settings.showGlow && (
          <div 
            className="absolute inset-0 pointer-events-none opacity-40 blur-3xl"
            style={{
              background: `radial-gradient(circle at 50% 50%, ${settings.materialColor}33 0%, transparent 68%)`
            }}
          />
        )}

        {/* Three.js Container - Only the pure 3D model */}
        <div 
          ref={containerRef} 
          className="w-full h-full cursor-grab active:cursor-grabbing outline-none"
        />

        {/* CONTROLS AND BADGES: STRICTLY RESTRICTED TO ADMIN USERS ONLY */}
        {/* Regular users see ONLY the 3D model - NO file name, NO pause, NO options */}
        {isAdmin && (
          <>
            {/* Top-Right: Admin Interactive Tools (Pause, Reset, Wireframe) */}
            <div className="absolute top-4 right-4 flex items-center gap-1.5 z-10">
              <button
                onClick={handleToggleRotation}
                title={isRotatingLocally ? 'Pause Auto-Rotation' : 'Resume Auto-Rotation'}
                className="p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/80 backdrop-blur-md transition-all cursor-pointer"
              >
                {isRotatingLocally ? <Pause className="w-4 h-4 text-cyan-400" /> : <Play className="w-4 h-4 text-emerald-400" />}
              </button>

              <button
                onClick={handleResetCamera}
                title="Reset Perspective to Front Center"
                className="p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/80 backdrop-blur-md transition-all cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
              </button>

              <button
                onClick={handleToggleWireframe}
                title={isWireframeLocally ? 'Switch to Solid Surface' : 'Switch to Wireframe Mode'}
                className={`p-2 rounded-xl border backdrop-blur-md transition-all cursor-pointer ${
                  isWireframeLocally 
                    ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300' 
                    : 'bg-slate-900/80 hover:bg-slate-800 text-slate-300 border-slate-700/80'
                }`}
              >
                <Layers className="w-4 h-4" />
              </button>
            </div>

            {/* Top-Left: Admin File Name & Telemetry Badge */}
            <div className="absolute top-4 left-4 z-10 pointer-events-none">
              <div className="px-3 py-1 rounded-full bg-slate-900/70 border border-slate-700/60 backdrop-blur-md text-[11px] font-mono text-slate-300 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="font-bold text-white truncate max-w-[160px] sm:max-w-[220px]">
                  {metadata?.name || 'Custom 3D Art'}
                </span>
                <span className="text-slate-400 text-[10px]">
                  {metadata?.vertexCount ? `${metadata.vertexCount.toLocaleString()} pts` : ''}
                </span>
              </div>
            </div>

            {/* Bottom Orbit Guidance (Admin Preview indicator) */}
            <div className="absolute bottom-3 inset-x-0 flex justify-center pointer-events-none z-10">
              <div className="px-3 py-1 rounded-full bg-slate-950/60 backdrop-blur-md border border-slate-800/80 text-[10px] font-mono text-slate-400">
                Admin Mode • Orbit & Zoom Active
              </div>
            </div>
          </>
        )}
      </div>

      {/* BENEATH 3D MODEL SEPARATELY WRITE DAKSHYAM INNOVATIONS */}
      <div className="mt-5 sm:mt-6 flex flex-col items-center justify-center text-center space-y-1 select-none">
        <h1 className={`text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold font-mono tracking-wider uppercase transition-colors duration-300 ${
          isLight ? 'text-slate-900' : 'text-white'
        }`}>
          Dakshyam{' '}
          <span className={`transition-colors duration-300 ${isLight ? 'text-blue-900 font-black' : 'text-sky-400 font-black'}`}>
            Innovations
          </span>
        </h1>
      </div>

      {/* ADMIN CONTROLS BAR: ONLY VISIBLE IF USER IS ADMIN */}
      {isAdmin && (
        <div className="mt-4 flex items-center justify-center gap-3">
          <button
            onClick={() => setShowAdminModal(true)}
            className="px-4 py-2 rounded-xl text-xs font-mono font-bold bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/40 text-cyan-300 transition-all cursor-pointer flex items-center gap-2 shadow-sm group"
          >
            <Settings2 className="w-4 h-4 text-cyan-400 group-hover:rotate-45 transition-transform" />
            <span>Admin 3D Studio (Scale, Rotate, Shaders, Replace)</span>
          </button>

          {onNavigateToAdmin && (
            <button
              onClick={onNavigateToAdmin}
              className="px-3 py-2 rounded-xl text-xs font-mono font-semibold bg-slate-800/60 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer"
            >
              Open in Dashboard
            </button>
          )}
        </div>
      )}

      {/* Admin 3D Customizer Modal */}
      {isAdmin && (
        <Admin3DModelEditorModal
          isOpen={showAdminModal}
          onClose={() => setShowAdminModal(false)}
          metadata={metadata}
          onModelChanged={() => {
            setRefreshTrigger(prev => prev + 1);
          }}
          theme={theme}
          storageKey={STORAGE_KEY}
        />
      )}
    </div>
  );
}
