import React, { useState, useRef } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Upload, Trash2, Sparkles, RefreshCw, Check, AlertCircle, 
  Settings2, Eye, Sun, Compass, Sliders, Palette, Zap, ArrowDownUp
} from 'lucide-react';
import { 
  save3DModel, saveObjModel, deleteObjModel, updateModelSettings,
  StoredModelMetadata, ModelDisplaySettings, DEFAULT_MODEL_SETTINGS 
} from '../utils/modelStorage';
import { SAMPLE_3D_MODELS } from '../utils/sampleModels';

interface Admin3DModelEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  metadata: StoredModelMetadata | null;
  onModelChanged: () => void;
  theme?: 'light' | 'dark';
  storageKey?: string;
}

const COLOR_SWATCHES = [
  { label: 'Cyber Cyan', hex: '#38bdf8' },
  { label: 'Royal Gold', hex: '#fbbf24' },
  { label: 'Crimson Ruby', hex: '#f43f5e' },
  { label: 'Bio Emerald', hex: '#10b981' },
  { label: 'Electric Purple', hex: '#a855f7' },
  { label: 'Studio White', hex: '#f8fafc' },
  { label: 'Stealth Slate', hex: '#475569' }
];

export default function Admin3DModelEditorModal({
  isOpen,
  onClose,
  metadata,
  onModelChanged,
  theme = 'dark',
  storageKey = 'home_custom_3d_obj'
}: Admin3DModelEditorModalProps) {
  const isLight = theme === 'light';
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Active Settings State
  const initialSettings: ModelDisplaySettings = metadata?.settings || {
    ...DEFAULT_MODEL_SETTINGS,
    materialColor: metadata?.materialColor || DEFAULT_MODEL_SETTINGS.materialColor,
    wireframe: metadata?.wireframe ?? DEFAULT_MODEL_SETTINGS.wireframe,
    autoRotate: metadata?.autoRotate ?? DEFAULT_MODEL_SETTINGS.autoRotate
  };

  const [settings, setSettings] = useState<ModelDisplaySettings>(initialSettings);
  const [activeTab, setActiveTab] = useState<'transform' | 'material' | 'lighting' | 'upload'>('transform');
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isDraggingOver, setIsDraggingOver] = useState<boolean>(false);

  if (!isOpen) return null;

  // Real-time update of settings to IndexedDB
  const handleSettingChange = async (updates: Partial<ModelDisplaySettings>) => {
    const updated = { ...settings, ...updates };
    setSettings(updated);
    if (metadata) {
      await updateModelSettings(storageKey, updates);
      onModelChanged();
    }
  };

  // Upload handler for custom 3D files (.obj, .glb, .gbl, .gltf)
  const processModelFile = async (file: File) => {
    const lowerName = file.name.toLowerCase();
    const isGlb = lowerName.endsWith('.glb') || lowerName.endsWith('.gbl');
    const isGltf = lowerName.endsWith('.gltf');
    const isObj = lowerName.endsWith('.obj');

    if (!isObj && !isGlb && !isGltf) {
      setStatusMessage({ type: 'error', text: 'Invalid file format. Please provide a 3D model (.glb, .obj, or .gltf).' });
      return;
    }

    setIsUploading(true);
    setStatusMessage(null);

    try {
      let vertexCount = 0;
      let faceCount = 0;
      let modelPayload: string | ArrayBuffer;

      if (isGlb || isGltf) {
        const buffer = await file.arrayBuffer();
        modelPayload = buffer;

        // Extract geometry telemetry via GLTFLoader
        await new Promise<void>((resolve, reject) => {
          const loader = new GLTFLoader();
          loader.parse(
            buffer,
            '',
            (gltf) => {
              gltf.scene.traverse((child) => {
                if ((child as THREE.Mesh).isMesh) {
                  const mesh = child as THREE.Mesh;
                  if (mesh.geometry) {
                    const pos = mesh.geometry.attributes.position;
                    if (pos) vertexCount += pos.count;
                    if (mesh.geometry.index) {
                      faceCount += Math.round(mesh.geometry.index.count / 3);
                    } else if (pos) {
                      faceCount += Math.round(pos.count / 3);
                    }
                  }
                }
              });
              resolve();
            },
            (err) => reject(new Error('Failed to parse 3D GLB/GLTF geometry.'))
          );
        });
      } else {
        // Standard .obj text
        const text = await file.text();
        modelPayload = text;

        const lines = text.split('\n');
        for (let i = 0; i < lines.length; i++) {
          const trimmed = lines[i].trim();
          if (trimmed.startsWith('v ')) vertexCount++;
          else if (trimmed.startsWith('f ')) faceCount++;
        }

        if (vertexCount === 0) {
          throw new Error('This .obj file contains no geometric vertices (v x y z).');
        }
      }

      const newMeta: StoredModelMetadata = {
        id: `model-${Date.now()}`,
        name: file.name,
        size: file.size,
        format: isGlb ? 'glb' : (isGltf ? 'gltf' : 'obj'),
        vertexCount,
        faceCount,
        updatedAt: new Date().toISOString(),
        settings: settings
      };

      await save3DModel(storageKey, modelPayload, newMeta);
      setStatusMessage({ 
        type: 'success', 
        text: `Successfully loaded "${file.name}" (${vertexCount.toLocaleString()} vertices, ${faceCount.toLocaleString()} faces).` 
      });
      onModelChanged();
      setTimeout(() => {
        setActiveTab('transform');
      }, 700);
    } catch (err: any) {
      console.error('Error reading 3D model file:', err);
      setStatusMessage({ type: 'error', text: err.message || 'Failed to parse 3D model file.' });
    } finally {
      setIsUploading(false);
    }
  };

  // Load sample model
  const handleLoadSample = async (sample: typeof SAMPLE_3D_MODELS[0]) => {
    setIsUploading(true);
    try {
      const objText = sample.generateObj();
      const lines = objText.split('\n');
      let vertexCount = 0;
      let faceCount = 0;
      for (const line of lines) {
        if (line.trim().startsWith('v ')) vertexCount++;
        else if (line.trim().startsWith('f ')) faceCount++;
      }

      const newMeta: StoredModelMetadata = {
        id: `sample-${Date.now()}`,
        name: `${sample.name}.obj`,
        size: objText.length,
        vertexCount,
        faceCount,
        updatedAt: new Date().toISOString(),
        settings: settings
      };

      await saveObjModel(storageKey, objText, newMeta);
      setStatusMessage({ type: 'success', text: `Loaded preset: "${sample.name}"` });
      onModelChanged();
      setTimeout(() => {
        setActiveTab('transform');
      }, 700);
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Failed loading preset' });
    } finally {
      setIsUploading(false);
    }
  };

  // Revert back to default logo
  const handleRevertToDefault = async () => {
    if (confirm('Revert home page 3D art back to the default Dakshyam Innovations logo?')) {
      await deleteObjModel(storageKey);
      setStatusMessage({ type: 'success', text: 'Reverted to default Dakshyam 3D Emblem' });
      onModelChanged();
      setTimeout(() => {
        onClose();
      }, 600);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className={`w-full max-w-2xl rounded-3xl border shadow-2xl overflow-hidden my-auto flex flex-col max-h-[92vh] ${
          isLight 
            ? 'bg-slate-50 border-blue-900/20 text-slate-900' 
            : 'bg-[#081220] border-cyan-500/30 text-white'
        }`}
      >
        {/* Header */}
        <div className={`p-4 sm:p-5 border-b flex items-center justify-between ${
          isLight ? 'border-slate-200 bg-white' : 'border-slate-800 bg-[#0c1829]'
        }`}>
          <div className="flex items-center gap-3">
            <span className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <Settings2 className="w-5 h-5" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black font-mono tracking-wide uppercase">
                  3D Art Admin Studio
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 border border-amber-500/30 text-amber-300 uppercase">
                  Admin Only
                </span>
              </div>
              <p className={`text-xs font-mono ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                {metadata ? `Configuring "${metadata.name}" (${metadata.vertexCount || 0} vertices)` : 'Active: Default Official Logo'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-slate-800/60 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sub-Tabs */}
        <div className={`flex border-b px-4 gap-2 text-xs font-mono uppercase font-bold overflow-x-auto scrollbar-none ${
          isLight ? 'border-slate-200 bg-slate-100' : 'border-slate-800 bg-slate-950/60'
        }`}>
          {[
            { id: 'transform', label: 'Transform & Axis', icon: Compass },
            { id: 'material', label: 'Material & Shader', icon: Palette },
            { id: 'lighting', label: 'Lighting & Motion', icon: Sun },
            { id: 'upload', label: 'Replace / Upload .OBJ', icon: Upload }
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-3 px-3 flex items-center gap-2 border-b-2 whitespace-nowrap transition-all cursor-pointer ${
                  active 
                    ? 'border-cyan-400 text-cyan-400' 
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Notification Status Banner */}
        {statusMessage && (
          <div className={`mx-4 mt-4 p-3 rounded-2xl text-xs font-mono flex items-center gap-2 ${
            statusMessage.type === 'success' 
              ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300' 
              : 'bg-rose-500/15 border border-rose-500/30 text-rose-300'
          }`}>
            {statusMessage.type === 'success' ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            <span>{statusMessage.text}</span>
          </div>
        )}

        {/* Body Content */}
        <div className="p-5 overflow-y-auto space-y-6 flex-1 text-xs font-mono">
          {/* TAB 1: TRANSFORM & AXIS FIX */}
          {activeTab === 'transform' && (
            <div className="space-y-5">
              {/* Orientation Presets (CAD Fixes) */}
              <div className="space-y-2">
                <label className="text-[11px] font-mono text-cyan-400 uppercase font-bold flex items-center gap-2">
                  <Compass className="w-3.5 h-3.5" />
                  CAD Orientation Fix Presets
                </label>
                <p className="text-[11px] text-slate-400">
                  Many CAD tools (Blender, Fusion 360, SolidWorks) export with Z-Up instead of Y-Up. Select a quick preset to correct the model:
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => handleSettingChange({ rotationX: 0, rotationY: 0, rotationZ: 0 })}
                    className="p-2.5 rounded-xl border border-slate-700 bg-slate-800/60 hover:bg-slate-700 text-slate-200 font-mono text-center hover:border-cyan-500/40 transition-all cursor-pointer"
                  >
                    Default (0, 0, 0)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSettingChange({ rotationX: -90, rotationY: 0, rotationZ: 0 })}
                    className="p-2.5 rounded-xl border border-cyan-500/30 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 font-mono text-center font-bold transition-all cursor-pointer"
                  >
                    Fix Z-Up (-90° X)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSettingChange({ rotationX: 0, rotationY: 90, rotationZ: 0 })}
                    className="p-2.5 rounded-xl border border-slate-700 bg-slate-800/60 hover:bg-slate-700 text-slate-200 font-mono text-center hover:border-cyan-500/40 transition-all cursor-pointer"
                  >
                    Turn 90° Y
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSettingChange({ rotationX: 0, rotationY: 180, rotationZ: 0 })}
                    className="p-2.5 rounded-xl border border-slate-700 bg-slate-800/60 hover:bg-slate-700 text-slate-200 font-mono text-center hover:border-cyan-500/40 transition-all cursor-pointer"
                  >
                    Invert 180° Y
                  </button>
                </div>
              </div>

              {/* Rotation Angle Sliders */}
              <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-300 font-bold">X-Axis Rotation (Pitch / Tilt)</span>
                    <span className="text-cyan-400 font-mono font-bold">{settings.rotationX}°</span>
                  </div>
                  <input
                    type="range"
                    min="-180"
                    max="180"
                    step="5"
                    value={settings.rotationX}
                    onChange={(e) => handleSettingChange({ rotationX: parseFloat(e.target.value) })}
                    className="w-full accent-cyan-400 cursor-pointer"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-300 font-bold">Y-Axis Rotation (Yaw / Turn)</span>
                    <span className="text-cyan-400 font-mono font-bold">{settings.rotationY}°</span>
                  </div>
                  <input
                    type="range"
                    min="-180"
                    max="180"
                    step="5"
                    value={settings.rotationY}
                    onChange={(e) => handleSettingChange({ rotationY: parseFloat(e.target.value) })}
                    className="w-full accent-cyan-400 cursor-pointer"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-300 font-bold">Z-Axis Rotation (Roll)</span>
                    <span className="text-cyan-400 font-mono font-bold">{settings.rotationZ}°</span>
                  </div>
                  <input
                    type="range"
                    min="-180"
                    max="180"
                    step="5"
                    value={settings.rotationZ}
                    onChange={(e) => handleSettingChange({ rotationZ: parseFloat(e.target.value) })}
                    className="w-full accent-cyan-400 cursor-pointer"
                  />
                </div>
              </div>

              {/* Scale & Elevation */}
              <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-300 font-bold">Scale Multiplier (Zoom)</span>
                    <div className="flex items-center gap-2">
                      <span className="text-amber-400 font-mono font-bold">{settings.scale.toFixed(2)}x</span>
                      <button
                        type="button"
                        onClick={() => handleSettingChange({ scale: 1.0 })}
                        className="px-2 py-0.5 rounded bg-slate-800 text-[10px] text-slate-300 hover:text-white border border-slate-700 cursor-pointer"
                      >
                        Reset 1.0x
                      </button>
                    </div>
                  </div>
                  <input
                    type="range"
                    min="0.2"
                    max="3.5"
                    step="0.05"
                    value={settings.scale}
                    onChange={(e) => handleSettingChange({ scale: parseFloat(e.target.value) })}
                    className="w-full accent-amber-400 cursor-pointer"
                  />
                  <p className="text-[10px] text-slate-500">
                    The viewer automatically normalizes any CAD scale to fit cleanly in the canvas. Use this slider to fine-tune the size.
                  </p>
                </div>

                <div className="space-y-1 pt-2">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-300 font-bold">Vertical Elevation (Y-Offset)</span>
                    <div className="flex items-center gap-2">
                      <span className="text-cyan-400 font-mono font-bold">{settings.offsetY.toFixed(2)}</span>
                      <button
                        type="button"
                        onClick={() => handleSettingChange({ offsetY: 0 })}
                        className="px-2 py-0.5 rounded bg-slate-800 text-[10px] text-slate-300 hover:text-white border border-slate-700 cursor-pointer"
                      >
                        Center
                      </button>
                    </div>
                  </div>
                  <input
                    type="range"
                    min="-3.0"
                    max="3.0"
                    step="0.1"
                    value={settings.offsetY}
                    onChange={(e) => handleSettingChange({ offsetY: parseFloat(e.target.value) })}
                    className="w-full accent-cyan-400 cursor-pointer"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: MATERIAL & SHADER */}
          {activeTab === 'material' && (
            <div className="space-y-5">
              {/* Shading Style Select */}
              <div className="space-y-2">
                <label className="text-[11px] font-mono text-cyan-400 uppercase font-bold">
                  Surface Shader & Render Technique
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    { id: 'metallic', name: 'Cyber Metallic', desc: 'PBR reflective metal with specular' },
                    { id: 'clay', name: 'Studio Matte Clay', desc: 'High-visibility industrial CAD clay' },
                    { id: 'hologram', name: 'Cyber Hologram', desc: 'Glow grid with inner luminescence' },
                    { id: 'chrome', name: 'Mirror Chrome', desc: 'Maximum reflectivity' },
                    { id: 'normals', name: 'Normal Vectors (RGB)', desc: 'Guaranteed 100% visible vectors' }
                  ].map((style) => {
                    const active = settings.style === style.id;
                    return (
                      <button
                        key={style.id}
                        type="button"
                        onClick={() => handleSettingChange({ style: style.id as any })}
                        className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                          active
                            ? 'bg-cyan-500/15 border-cyan-400 text-white shadow-md'
                            : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700'
                        }`}
                      >
                        <p className="font-bold text-xs">{style.name}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">{style.desc}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Color Swatches */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-[11px] font-mono text-cyan-400 uppercase font-bold">
                    Primary Accent Color
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={settings.materialColor}
                      onChange={(e) => handleSettingChange({ materialColor: e.target.value })}
                      className="w-6 h-6 rounded cursor-pointer border border-slate-700 bg-transparent"
                    />
                    <span className="font-mono text-xs text-slate-300 uppercase">{settings.materialColor}</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 pt-1">
                  {COLOR_SWATCHES.map((swatch) => {
                    const active = settings.materialColor.toLowerCase() === swatch.hex.toLowerCase();
                    return (
                      <button
                        key={swatch.hex}
                        type="button"
                        onClick={() => handleSettingChange({ materialColor: swatch.hex })}
                        className={`px-3 py-1.5 rounded-xl border text-[11px] font-mono flex items-center gap-2 transition-all cursor-pointer ${
                          active
                            ? 'border-white bg-slate-800 text-white shadow-sm font-bold'
                            : 'border-slate-800 bg-slate-900/80 text-slate-300 hover:border-slate-700'
                        }`}
                      >
                        <span 
                          className="w-3 h-3 rounded-full border border-black/40 shadow-xs" 
                          style={{ backgroundColor: swatch.hex }}
                        />
                        {swatch.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Wireframe Toggle */}
              <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
                <div>
                  <p className="font-bold text-slate-200">Wireframe Mesh Overlay</p>
                  <p className="text-[11px] text-slate-400">
                    Display the underlying CAD triangular and polygonal geometry edges.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleSettingChange({ wireframe: !settings.wireframe })}
                  className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                    settings.wireframe
                      ? 'bg-cyan-500 text-slate-950 shadow-md'
                      : 'bg-slate-800 text-slate-300 border border-slate-700'
                  }`}
                >
                  {settings.wireframe ? 'Active (ON)' : 'Disabled (OFF)'}
                </button>
              </div>

              {/* Roughness & Metalness Sliders (for metallic shaders) */}
              {settings.style === 'metallic' && (
                <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span className="text-slate-300 font-bold">Metallic Glossiness</span>
                      <span className="text-cyan-400 font-mono font-bold">{(settings.metalness * 100).toFixed(0)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={settings.metalness}
                      onChange={(e) => handleSettingChange({ metalness: parseFloat(e.target.value) })}
                      className="w-full accent-cyan-400 cursor-pointer"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span className="text-slate-300 font-bold">Surface Roughness</span>
                      <span className="text-cyan-400 font-mono font-bold">{(settings.roughness * 100).toFixed(0)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0.05"
                      max="1"
                      step="0.05"
                      value={settings.roughness}
                      onChange={(e) => handleSettingChange({ roughness: parseFloat(e.target.value) })}
                      className="w-full accent-cyan-400 cursor-pointer"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: LIGHTING & MOTION */}
          {activeTab === 'lighting' && (
            <div className="space-y-5">
              {/* Headlight & Ambient sliders */}
              <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-300 font-bold">Camera Headlight (Front Illuminator)</span>
                    <span className="text-cyan-400 font-mono font-bold">{settings.headlightIntensity.toFixed(1)}x</span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="4.5"
                    step="0.2"
                    value={settings.headlightIntensity}
                    onChange={(e) => handleSettingChange({ headlightIntensity: parseFloat(e.target.value) })}
                    className="w-full accent-cyan-400 cursor-pointer"
                  />
                  <p className="text-[10px] text-slate-500">
                    The camera headlight moves with the user perspective so dark spots or unlit geometry are always brightly visible.
                  </p>
                </div>

                <div className="space-y-1 pt-2">
                  <div className="flex justify-between">
                    <span className="text-slate-300 font-bold">Ambient Light Level</span>
                    <span className="text-cyan-400 font-mono font-bold">{settings.ambientLightIntensity.toFixed(1)}x</span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="3.5"
                    step="0.2"
                    value={settings.ambientLightIntensity}
                    onChange={(e) => handleSettingChange({ ambientLightIntensity: parseFloat(e.target.value) })}
                    className="w-full accent-cyan-400 cursor-pointer"
                  />
                </div>
              </div>

              {/* Auto-Rotation Controls */}
              <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold text-slate-200">Continuous 3D Auto-Rotation</p>
                    <p className="text-[11px] text-slate-400">Cinematic orbit animation when idle</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleSettingChange({ autoRotate: !settings.autoRotate })}
                    className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                      settings.autoRotate
                        ? 'bg-cyan-500 text-slate-950 shadow-md'
                        : 'bg-slate-800 text-slate-300 border border-slate-700'
                    }`}
                  >
                    {settings.autoRotate ? 'Enabled' : 'Paused'}
                  </button>
                </div>

                {settings.autoRotate && (
                  <>
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span className="text-slate-300 font-bold">Orbit Velocity</span>
                        <span className="text-cyan-400 font-mono font-bold">{settings.autoRotateSpeed.toFixed(1)}x</span>
                      </div>
                      <input
                        type="range"
                        min="0.5"
                        max="5.0"
                        step="0.2"
                        value={settings.autoRotateSpeed}
                        onChange={(e) => handleSettingChange({ autoRotateSpeed: parseFloat(e.target.value) })}
                        className="w-full accent-cyan-400 cursor-pointer"
                      />
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <span className="text-slate-300 font-bold">Direction:</span>
                      <button
                        type="button"
                        onClick={() => handleSettingChange({ autoRotateDirection: 1 })}
                        className={`px-3 py-1 rounded-lg border text-xs font-mono cursor-pointer ${
                          settings.autoRotateDirection === 1 
                            ? 'border-cyan-400 bg-cyan-500/20 text-cyan-300' 
                            : 'border-slate-700 bg-slate-800 text-slate-400'
                        }`}
                      >
                        Clockwise
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSettingChange({ autoRotateDirection: -1 })}
                        className={`px-3 py-1 rounded-lg border text-xs font-mono cursor-pointer ${
                          settings.autoRotateDirection === -1 
                            ? 'border-cyan-400 bg-cyan-500/20 text-cyan-300' 
                            : 'border-slate-700 bg-slate-800 text-slate-400'
                        }`}
                      >
                        Counter-Clockwise
                      </button>
                    </div>
                  </>
                )}
              </div>

              {/* Stage Glow Switch */}
              <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
                <div>
                  <p className="font-bold text-slate-200">Atmospheric Stage Glow</p>
                  <p className="text-[11px] text-slate-400">
                    Subtle radial aura behind the 3D model for cinematic contrast.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleSettingChange({ showGlow: !settings.showGlow })}
                  className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                    settings.showGlow
                      ? 'bg-cyan-500 text-slate-950 shadow-md'
                      : 'bg-slate-800 text-slate-300 border border-slate-700'
                  }`}
                >
                  {settings.showGlow ? 'Active' : 'Muted'}
                </button>
              </div>
            </div>
          )}

          {/* TAB 4: REPLACE / UPLOAD 3D MODEL */}
          {activeTab === 'upload' && (
            <div className="space-y-5">
              {/* Dropzone */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDraggingOver(true);
                }}
                onDragLeave={() => setIsDraggingOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDraggingOver(false);
                  if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                    processModelFile(e.dataTransfer.files[0]);
                  }
                }}
                onClick={() => fileInputRef.current?.click()}
                className={`p-8 rounded-3xl border-2 border-dashed text-center transition-all cursor-pointer ${
                  isDraggingOver
                    ? 'border-cyan-400 bg-cyan-500/15'
                    : 'border-slate-700 hover:border-cyan-500/40 bg-slate-900/50'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".obj,.glb,.gbl,.gltf"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      processModelFile(e.target.files[0]);
                    }
                  }}
                />

                <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center mx-auto mb-3">
                  <Upload className="w-6 h-6" />
                </div>

                <p className="font-bold text-slate-200 text-sm">
                  {isUploading ? 'Parsing & Normalizing 3D Geometry...' : 'Click or Drag & Drop 3D Model (.obj, .glb)'}
                </p>
                <p className="text-[11px] text-slate-400 mt-1">
                  Supports Wavefront (.obj) and Binary GLTF (.glb / .gltf) models from Blender, Fusion 360, SolidWorks, Maya, CAD, etc.
                </p>
              </div>

              {/* Sample Presets */}
              <div className="space-y-2">
                <label className="text-[11px] font-mono text-cyan-400 uppercase font-bold flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5" />
                  Or Try a High-Precision Procedural Preset
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {SAMPLE_3D_MODELS.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      disabled={isUploading}
                      onClick={() => handleLoadSample(preset)}
                      className="p-3.5 rounded-2xl border border-slate-800 bg-slate-900/70 hover:bg-slate-850 hover:border-cyan-500/30 text-left transition-all cursor-pointer space-y-1"
                    >
                      <p className="font-bold text-xs text-white">{preset.name}</p>
                      <p className="text-[10px] text-slate-400 leading-tight">{preset.description}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Delete / Revert to Default */}
              <div className="pt-4 border-t border-slate-800">
                <div className="flex items-center justify-between p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20">
                  <div>
                    <p className="font-bold text-rose-300">Revert to Official Logo</p>
                    <p className="text-[11px] text-rose-300/80">
                      Remove the custom 3D model and restore the official Dakshyam emblem.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleRevertToDefault}
                    className="px-4 py-2 rounded-xl text-xs font-mono font-bold bg-rose-600 hover:bg-rose-500 text-white transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Revert
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={`p-4 border-t flex items-center justify-between ${
          isLight ? 'border-slate-200 bg-white' : 'border-slate-800 bg-[#0c1829]'
        }`}>
          <div className="text-[11px] text-slate-400 font-mono">
            {metadata ? `Stored in IndexedDB: ${(metadata.size / 1024).toFixed(1)} KB` : 'No custom model active'}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-mono font-black text-xs uppercase tracking-wider transition-all cursor-pointer"
          >
            Apply & Close
          </button>
        </div>
      </motion.div>
    </div>
  );
}
