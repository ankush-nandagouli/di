import React, { useState, useEffect } from 'react';
import { 
  Box, Upload, Trash2, Sparkles, Check, AlertCircle, 
  Info, RefreshCw, Settings2, Sliders, Palette, Compass, Sun 
} from 'lucide-react';
import Home3DArtViewer from './Home3DArtViewer';
import Admin3DModelEditorModal from './Admin3DModelEditorModal';
import { loadObjModel, deleteObjModel, StoredModelMetadata } from '../utils/modelStorage';
import { SAMPLE_3D_MODELS } from '../utils/sampleModels';

interface Home3DArtSettingsTabProps {
  theme?: 'light' | 'dark';
}

const STORAGE_KEY = 'home_custom_3d_obj';

export default function Home3DArtSettingsTab({ theme = 'dark' }: Home3DArtSettingsTabProps) {
  const isLight = theme === 'light';
  const [metadata, setMetadata] = useState<StoredModelMetadata | null>(null);
  const [hasModel, setHasModel] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshKey, setRefreshKey] = useState<number>(0);
  const [showEditorModal, setShowEditorModal] = useState<boolean>(false);

  const fetchMetadata = async () => {
    setLoading(true);
    try {
      const stored = await loadObjModel(STORAGE_KEY);
      if (stored && stored.meta) {
        setMetadata(stored.meta);
        setHasModel(true);
      } else {
        setMetadata(null);
        setHasModel(false);
      }
    } catch (e) {
      console.warn('Could not read 3D model metadata:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetadata();
  }, [refreshKey]);

  const handleRemove = async () => {
    if (confirm('Revert home page 3D art back to the default Dakshyam Innovations logo?')) {
      await deleteObjModel(STORAGE_KEY);
      setRefreshKey(prev => prev + 1);
    }
  };

  const formatSize = (bytes?: number) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header Banner */}
      <div className={`p-6 rounded-3xl border transition-all ${
        isLight ? 'bg-white border-blue-900/15 shadow-sm' : 'bg-slate-900/70 border-cyan-500/20'
      }`}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
                <Box className="w-5 h-5" />
              </span>
              <h2 className={`text-xl font-black font-mono tracking-wide uppercase ${isLight ? 'text-slate-900' : 'text-white'}`}>
                Home Page 3D Art & OBJ Model Studio
              </h2>
            </div>
            <p className={`text-xs font-mono ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
              Full administrative authority to upload, orient, scale, shade, and customize the interactive 3D model on the public home page.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setShowEditorModal(true)}
              className="px-4 py-2 rounded-xl border text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-2 bg-cyan-500 text-slate-950 hover:bg-cyan-400 border-cyan-400 shadow-md"
            >
              <Settings2 className="w-4 h-4" />
              {hasModel ? 'Configure 3D Settings' : 'Upload .OBJ Model'}
            </button>

            <button
              type="button"
              onClick={() => setRefreshKey(prev => prev + 1)}
              className="px-3 py-2 rounded-xl border text-xs font-mono font-semibold transition-all cursor-pointer flex items-center gap-1.5 bg-slate-800/80 hover:bg-slate-700 text-slate-300 border-slate-700"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Refresh
            </button>

            {hasModel && (
              <button
                type="button"
                onClick={handleRemove}
                className="px-3 py-2 rounded-xl border text-xs font-mono font-semibold transition-all cursor-pointer flex items-center gap-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border-rose-500/30"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Revert to Default Logo
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Model Metadata Information Card */}
      <div className={`p-6 rounded-3xl border ${
        isLight ? 'bg-white border-blue-900/15' : 'bg-[#0a192f]/60 border-slate-800'
      }`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-black font-mono tracking-wider uppercase text-cyan-400 flex items-center gap-2">
            <Info className="w-4 h-4" />
            Active 3D Art Telemetry & Settings
          </h3>
          {hasModel && (
            <button
              type="button"
              onClick={() => setShowEditorModal(true)}
              className="text-xs font-mono text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer font-bold"
            >
              <Sliders className="w-3.5 h-3.5" />
              Edit Transform & Shaders
            </button>
          )}
        </div>

        {hasModel && metadata ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-1">
                <span className="text-[10px] font-mono uppercase text-slate-400">File Name</span>
                <p className="text-xs font-mono font-bold text-white truncate">{metadata.name}</p>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-1">
                <span className="text-[10px] font-mono uppercase text-slate-400">Geometry Size</span>
                <p className="text-xs font-mono font-bold text-cyan-300">{formatSize(metadata.size)}</p>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-1">
                <span className="text-[10px] font-mono uppercase text-slate-400">Vertex Count</span>
                <p className="text-xs font-mono font-bold text-amber-300">
                  {metadata.vertexCount ? metadata.vertexCount.toLocaleString() : 'N/A'}
                </p>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-1">
                <span className="text-[10px] font-mono uppercase text-slate-400">Polygonal Faces</span>
                <p className="text-xs font-mono font-bold text-emerald-300">
                  {metadata.faceCount ? metadata.faceCount.toLocaleString() : 'N/A'}
                </p>
              </div>
            </div>

            {/* Configured Settings Summary */}
            {metadata.settings && (
              <div className="p-4 rounded-2xl bg-slate-950/40 border border-slate-800/60 flex flex-wrap gap-4 text-xs font-mono">
                <div className="flex items-center gap-1.5 text-slate-300">
                  <Compass className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Rotation:</span>
                  <span className="text-white font-bold font-mono">
                    X: {metadata.settings.rotationX}°, Y: {metadata.settings.rotationY}°, Z: {metadata.settings.rotationZ}°
                  </span>
                </div>

                <div className="flex items-center gap-1.5 text-slate-300">
                  <Palette className="w-3.5 h-3.5 text-purple-400" />
                  <span>Shader:</span>
                  <span className="text-white font-bold uppercase">{metadata.settings.style}</span>
                </div>

                <div className="flex items-center gap-1.5 text-slate-300">
                  <Sun className="w-3.5 h-3.5 text-amber-400" />
                  <span>Scale:</span>
                  <span className="text-white font-bold">{metadata.settings.scale}x</span>
                </div>

                <div className="flex items-center gap-1.5 text-slate-300">
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: metadata.settings.materialColor }} />
                  <span>Color:</span>
                  <span className="text-white font-bold uppercase">{metadata.settings.materialColor}</span>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-mono flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Sparkles className="w-5 h-5 shrink-0 text-amber-400" />
              <div>
                <p className="font-bold">Official Dakshyam Innovations 3D Art Active</p>
                <p className="text-[11px] text-amber-300/80">
                  No custom .obj file is currently active. The home page is presenting the official high-tech vector emblem.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowEditorModal(true)}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold font-mono text-xs cursor-pointer uppercase tracking-wider shrink-0"
            >
              Upload First .OBJ Model
            </button>
          </div>
        )}
      </div>

      {/* Live Interactive 3D Stage Preview */}
      <div className={`p-6 rounded-3xl border ${
        isLight ? 'bg-white border-blue-900/15' : 'bg-[#0a192f]/80 border-cyan-500/20'
      }`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-black font-mono tracking-wider uppercase text-slate-200 flex items-center gap-2">
            <Box className="w-4 h-4 text-cyan-400" />
            Live Home Page Display Preview
          </h3>
          <span className="text-[11px] font-mono text-slate-400">
            Click & drag to test interactive orbit
          </span>
        </div>

        {/* Embedded 3D Art Viewer (Admin Mode) */}
        <div key={refreshKey} className="py-2">
          <Home3DArtViewer 
            theme={theme} 
            isAdmin={true} 
            onNavigateToAdmin={() => {}} 
          />
        </div>
      </div>

      {/* Admin 3D Customizer Modal */}
      <Admin3DModelEditorModal
        isOpen={showEditorModal}
        onClose={() => setShowEditorModal(false)}
        metadata={metadata}
        onModelChanged={() => {
          setRefreshKey(prev => prev + 1);
        }}
        theme={theme}
        storageKey={STORAGE_KEY}
      />
    </div>
  );
}
