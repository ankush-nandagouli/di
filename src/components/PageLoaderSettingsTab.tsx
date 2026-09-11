import React, { useState, useRef, useEffect } from 'react';
import { 
  Upload, Video, Sparkles, Play, CheckCircle2, AlertTriangle, 
  Trash2, Sliders, Eye, RefreshCw, Volume2, VolumeX, Link as LinkIcon, FileCheck 
} from 'lucide-react';
import { PageLoaderConfig } from '../types';
import { DakshyamDatabase } from '../utils/db';
import { uploadMediaToCloudinary } from '../utils/mediaUpload';
import { storeVideoBlob, deleteVideoBlob } from '../utils/videoStorage';

interface PageLoaderSettingsTabProps {
  theme?: 'light' | 'dark';
  onTestLoader: () => void;
  onConfigUpdated?: (newConfig: PageLoaderConfig) => void;
}

// Curated high-tech sample animated video loops for 1-click previewing/testing
const SAMPLE_ANIMATED_VIDEOS = [
  {
    name: 'Cybernetic Circuit Matrix',
    url: 'https://assets.mixkit.co/videos/preview/mixkit-circuit-board-microchip-computer-electronics-hardware-804-large.mp4',
    desc: 'High-tech microchip & golden circuit telemetry loop'
  },
  {
    name: 'Futuristic Grid & Particle Field',
    url: 'https://assets.mixkit.co/videos/preview/mixkit-tunnel-of-futuristic-neon-lights-and-lines-42998-large.mp4',
    desc: 'Neon cyan & amber data transmission corridor'
  },
  {
    name: 'Digital Neural Network',
    url: 'https://assets.mixkit.co/videos/preview/mixkit-glowing-lines-in-a-dark-background-43093-large.mp4',
    desc: 'Deep tech connection nodes and luminous data synapses'
  }
];

export default function PageLoaderSettingsTab({
  theme = 'dark',
  onTestLoader,
  onConfigUpdated
}: PageLoaderSettingsTabProps) {
  const isLight = theme === 'light';

  // Current config state
  const [config, setConfig] = useState<PageLoaderConfig>(() => {
    return DakshyamDatabase.getPageLoaderConfig();
  });

  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>('');
  const [urlInput, setUrlInput] = useState(config.videoUrl || '');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [activePreviewMuted, setActivePreviewMuted] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync state
  useEffect(() => {
    setUrlInput(config.videoUrl || '');
  }, [config.videoUrl]);

  // Handle saving configuration
  const handleSaveConfig = (updated: PageLoaderConfig) => {
    setConfig(updated);
    DakshyamDatabase.savePageLoaderConfig(updated);
    if (onConfigUpdated) {
      onConfigUpdated(updated);
    }
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  // Handle local video file upload (MP4, WebM, MOV, GIF)
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check mime type or extension
    const isVideo = file.type.startsWith('video/') || file.name.match(/\.(mp4|webm|mov|m4v|ogg)$/i);
    const isGif = file.type === 'image/gif' || file.name.endsWith('.gif');

    if (!isVideo && !isGif) {
      setErrorMessage('Please select a valid animated video file (.mp4, .webm, .mov) or animated .gif.');
      return;
    }

    setErrorMessage('');
    setIsUploading(true);
    setUploadProgress(`Processing ${file.name} (${(file.size / (1024 * 1024)).toFixed(2)} MB)...`);

    try {
      // 1. Store locally in IndexedDB first so it always works even without cloud credentials!
      await storeVideoBlob('page_loader_video', file);
      const localBlobUrl = URL.createObjectURL(file);

      setUploadProgress('Persisting video to local storage...');

      // 2. Attempt server-side upload to Cloudinary for cross-device sync if configured
      let finalUrl = localBlobUrl;
      try {
        setUploadProgress('Uploading to cloud storage (optional sync)...');
        const uploadRes = await uploadMediaToCloudinary(file, isVideo ? 'video' : 'image');
        if (uploadRes.isCloudinary && uploadRes.url) {
          finalUrl = uploadRes.url;
        }
      } catch (cloudErr) {
        console.warn('Cloud storage sync skipped, using high-speed local storage:', cloudErr);
      }

      const updatedConfig: PageLoaderConfig = {
        ...config,
        enabled: true,
        videoUrl: finalUrl,
        mediaType: isGif ? 'gif' : 'video',
        updatedAt: new Date().toISOString()
      };

      handleSaveConfig(updatedConfig);
      setUploadProgress('');
    } catch (err: any) {
      console.error('File upload error:', err);
      setErrorMessage(err.message || 'Failed to process animated video file.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Handle direct URL assignment
  const handleApplyUrl = () => {
    const cleanUrl = urlInput.trim();
    if (!cleanUrl) {
      setErrorMessage('Please enter a valid video or GIF URL.');
      return;
    }

    setErrorMessage('');
    const isGif = cleanUrl.toLowerCase().includes('.gif');

    const updated: PageLoaderConfig = {
      ...config,
      enabled: true,
      videoUrl: cleanUrl,
      mediaType: isGif ? 'gif' : 'video',
      updatedAt: new Date().toISOString()
    };

    handleSaveConfig(updated);
  };

  // Handle removal of custom video
  const handleRemoveVideo = async () => {
    if (confirm('Are you sure you want to remove your custom animated video? The app will revert to the Dakshyam Innovations logo with loading bar.')) {
      await deleteVideoBlob('page_loader_video');
      const updated: PageLoaderConfig = {
        ...config,
        videoUrl: '',
        mediaType: 'auto',
        updatedAt: new Date().toISOString()
      };
      setUrlInput('');
      handleSaveConfig(updated);
    }
  };

  // Handle sample selection
  const handleSelectSample = (sampleUrl: string) => {
    setUrlInput(sampleUrl);
    const updated: PageLoaderConfig = {
      ...config,
      enabled: true,
      videoUrl: sampleUrl,
      mediaType: 'video',
      updatedAt: new Date().toISOString()
    };
    handleSaveConfig(updated);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header Banner */}
      <div className={`p-5 rounded-2.5xl border transition-all ${
        isLight ? 'bg-amber-50/50 border-amber-900/15' : 'bg-gradient-to-r from-slate-950 via-[#071520] to-slate-950 border-cyan-500/20'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
                <Video className="w-5 h-5" />
              </span>
              <h2 className={`text-lg sm:text-xl font-black uppercase tracking-wide ${isLight ? 'text-slate-900' : 'text-white'}`}>
                Animated Video Page Loader Settings
              </h2>
            </div>
            <p className={`text-xs ${isLight ? 'text-slate-600' : 'text-slate-400'} max-w-2xl leading-relaxed`}>
              Upload your custom animated video (MP4, WebM, MOV, or GIF) to display as an immersive, branded lazy-loading screen whenever users navigate pages or open the platform.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onTestLoader}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all cursor-pointer shadow-lg active:scale-95 ${
                isLight 
                  ? 'bg-blue-950 hover:bg-blue-900 text-white' 
                  : 'bg-gradient-to-r from-cyan-400 to-sky-400 hover:from-cyan-300 hover:to-sky-300 text-slate-950 font-black shadow-cyan-500/20'
              }`}
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              Test Page Loader Now
            </button>
          </div>
        </div>
      </div>

      {/* Notifications */}
      {saveSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Page loader settings successfully saved and applied across all views!</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-3.5 rounded-xl bg-red-500/15 border border-red-500/40 text-red-300 text-xs flex items-center gap-2 animate-fadeIn">
          <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: UPLOAD & VIDEO PREVIEW (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* UPLOAD CARD */}
          <div className={`p-5 rounded-2xl border transition-all ${
            isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-950/70 border-cyan-500/15'
          }`}>
            <h3 className={`text-xs font-mono uppercase tracking-wider font-bold mb-3 flex items-center gap-2 ${
              isLight ? 'text-slate-800' : 'text-cyan-300'
            }`}>
              <Upload className="w-4 h-4 text-amber-400" />
              1. Upload Your Animated Video File
            </h3>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept="video/mp4,video/webm,video/quicktime,video/ogg,image/gif"
              className="hidden"
            />

            {/* Drag and Drop / Click Area */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-6 sm:p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-3 ${
                isUploading 
                  ? 'border-cyan-400 bg-cyan-950/30' 
                  : isLight 
                  ? 'border-slate-300 hover:border-amber-600 bg-slate-50 hover:bg-amber-50/40' 
                  : 'border-cyan-500/30 hover:border-cyan-400 bg-slate-900/40 hover:bg-slate-900/80 shadow-inner'
              }`}
            >
              <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-md">
                {isUploading ? (
                  <RefreshCw className="w-6 h-6 animate-spin text-amber-400" />
                ) : (
                  <Upload className="w-6 h-6" />
                )}
              </div>

              <div className="space-y-1">
                <p className={`text-sm font-bold ${isLight ? 'text-slate-800' : 'text-white'}`}>
                  {isUploading ? 'Uploading & Processing Video...' : 'Click to select or drag & drop your video'}
                </p>
                <p className="text-xs text-slate-400 font-mono">
                  Supported: MP4, WebM, MOV, Animated GIF (Up to 100MB)
                </p>
              </div>

              {uploadProgress && (
                <div className="w-full max-w-sm mt-2 text-3xs font-mono text-cyan-300 bg-cyan-950/60 py-1.5 px-3 rounded-lg border border-cyan-500/20 animate-pulse">
                  {uploadProgress}
                </div>
              )}
            </div>

            {/* OR URL INPUT */}
            <div className="mt-4 pt-4 border-t border-slate-700/30">
              <label className="block text-2xs font-mono uppercase text-slate-400 mb-1.5 font-bold flex items-center gap-1.5">
                <LinkIcon className="w-3.5 h-3.5 text-cyan-400" />
                Or Paste Hosted Video / GIF URL
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="https://your-domain.com/animated-loader.mp4"
                  className={`flex-grow text-xs px-3.5 py-2 rounded-xl border font-mono outline-hidden transition-all ${
                    isLight 
                      ? 'bg-slate-50 border-slate-300 focus:border-amber-600 text-slate-900' 
                      : 'bg-slate-900 border-slate-700 focus:border-cyan-400 text-white'
                  }`}
                />
                <button
                  type="button"
                  onClick={handleApplyUrl}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-mono font-bold text-xs cursor-pointer transition-all shrink-0"
                >
                  Apply URL
                </button>
              </div>
            </div>
          </div>

          {/* LIVE PREVIEW BOX */}
          <div className={`p-5 rounded-2xl border transition-all ${
            isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-950/70 border-cyan-500/15'
          }`}>
            <div className="flex items-center justify-between mb-3">
              <h3 className={`text-xs font-mono uppercase tracking-wider font-bold flex items-center gap-2 ${
                isLight ? 'text-slate-800' : 'text-cyan-300'
              }`}>
                <Eye className="w-4 h-4 text-amber-400" />
                2. Live Video Preview
              </h3>

              {config.videoUrl && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setActivePreviewMuted(!activePreviewMuted)}
                    className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white border border-slate-700 text-3xs flex items-center gap-1 cursor-pointer"
                    title={activePreviewMuted ? 'Unmute' : 'Mute'}
                  >
                    {activePreviewMuted ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3 text-cyan-400" />}
                    {activePreviewMuted ? 'Muted' : 'Sound On'}
                  </button>
                  <button
                    type="button"
                    onClick={handleRemoveVideo}
                    className="p-1.5 rounded-lg bg-red-950/40 text-red-400 hover:text-red-300 border border-red-500/30 text-3xs flex items-center gap-1 cursor-pointer"
                    title="Remove custom video and use default HUD"
                  >
                    <Trash2 className="w-3 h-3" />
                    Reset
                  </button>
                </div>
              )}
            </div>

            {/* Video Frame */}
            <div className="relative w-full aspect-video rounded-2xl overflow-hidden border border-cyan-500/30 bg-black flex items-center justify-center shadow-lg">
              {config.videoUrl ? (
                config.videoUrl.toLowerCase().includes('.gif') || config.mediaType === 'gif' ? (
                  <img
                    src={config.videoUrl}
                    alt="Preview"
                    className={`w-full h-full object-${config.videoFit || 'contain'}`}
                  />
                ) : (
                  <video
                    src={config.videoUrl}
                    autoPlay
                    loop
                    muted={activePreviewMuted}
                    playsInline
                    className={`w-full h-full object-${config.videoFit || 'contain'}`}
                  />
                )
              ) : (
                <div className="text-center p-6 space-y-3 flex flex-col items-center justify-center">
                  <div className="w-14 h-14 flex items-center justify-center filter drop-shadow-[0_0_15px_rgba(56,189,248,0.4)]">
                    <img
                      src="/logo.svg"
                      alt="Dakshyam Logo"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="space-y-0.5">
                    <div className="text-xs font-black tracking-[0.22em] text-white uppercase font-sans">
                      DAKSHYAM INNOVATIONS
                    </div>
                    <p className="text-[9px] text-sky-400 font-mono tracking-widest uppercase">
                      Logo & Loading Bar Mode
                    </p>
                  </div>
                  {/* Mini sample loading bar */}
                  <div className="w-44 h-2 bg-slate-900 rounded-full border border-cyan-500/30 overflow-hidden p-0.5">
                    <div className="h-full w-3/4 rounded-full bg-gradient-to-r from-cyan-400 via-sky-400 to-amber-400 animate-pulse" />
                  </div>
                </div>
              )}

              {/* Status Watermark */}
              <div className="absolute bottom-2 left-2 px-2 py-1 rounded bg-black/70 border border-slate-700/50 font-mono text-[9px] text-cyan-300">
                {config.videoUrl ? 'CUSTOM FULLSCREEN VIDEO' : 'DAKSHYAM LOGO & LOADING BAR'}
              </div>
            </div>
          </div>

          {/* SAMPLES LIBRARY */}
          <div className={`p-5 rounded-2xl border transition-all ${
            isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-950/70 border-cyan-500/15'
          }`}>
            <h4 className="text-xs font-mono uppercase tracking-wider font-bold text-slate-400 mb-3 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Quick-Test Sample Loops (Try One-Click)
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {SAMPLE_ANIMATED_VIDEOS.map((sample, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectSample(sample.url)}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    config.videoUrl === sample.url
                      ? 'border-cyan-400 bg-cyan-950/30 text-cyan-300'
                      : isLight 
                      ? 'border-slate-200 hover:border-amber-500 bg-slate-50 hover:bg-amber-50/30 text-slate-800' 
                      : 'border-slate-800 hover:border-cyan-500/40 bg-slate-900/50 hover:bg-slate-900 text-slate-300'
                  }`}
                >
                  <span className="font-bold text-2xs block truncate">{sample.name}</span>
                  <span className="text-[10px] text-slate-400 font-mono block mt-1 line-clamp-2">{sample.desc}</span>
                  <span className="text-[9px] font-mono text-amber-400 block mt-2 font-semibold">Load Sample →</span>
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: CONTROLS & TIMING (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className={`p-5 rounded-2xl border space-y-5 transition-all ${
            isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-950/70 border-cyan-500/15'
          }`}>
            <h3 className={`text-xs font-mono uppercase tracking-wider font-bold flex items-center gap-2 ${
              isLight ? 'text-slate-800' : 'text-cyan-300'
            }`}>
              <Sliders className="w-4 h-4 text-amber-400" />
              3. Behavior & Playback Controls
            </h3>

            {/* Toggle: Master Enable */}
            <div className="flex items-center justify-between pt-1">
              <div>
                <label className={`text-xs font-bold block ${isLight ? 'text-slate-800' : 'text-white'}`}>
                  Enable Lazy Loading
                </label>
                <span className="text-3xs text-slate-400 font-mono block">
                  Activate animated video loading screen
                </span>
              </div>
              <input
                type="checkbox"
                checked={config.enabled}
                onChange={(e) => handleSaveConfig({ ...config, enabled: e.target.checked })}
                className="w-5 h-5 accent-cyan-400 rounded cursor-pointer"
              />
            </div>

            {/* Toggle: Show on every Tab/Page navigation */}
            <div className="flex items-center justify-between border-t border-slate-700/20 pt-3">
              <div>
                <label className={`text-xs font-bold block ${isLight ? 'text-slate-800' : 'text-white'}`}>
                  Load on Every Page Change
                </label>
                <span className="text-3xs text-slate-400 font-mono block">
                  Show video transition on every tab click
                </span>
              </div>
              <input
                type="checkbox"
                checked={config.showOnTabChange}
                onChange={(e) => handleSaveConfig({ ...config, showOnTabChange: e.target.checked })}
                className="w-5 h-5 accent-cyan-400 rounded cursor-pointer"
              />
            </div>

            {/* Duration Slider */}
            <div className="space-y-2 border-t border-slate-700/20 pt-3">
              <div className="flex justify-between items-center text-xs">
                <label className={`font-bold ${isLight ? 'text-slate-800' : 'text-white'}`}>
                  Transition Display Duration
                </label>
                <span className="font-mono text-cyan-400 font-bold">{config.minDurationMs || 850} ms</span>
              </div>
              <input
                type="range"
                min="400"
                max="10000"
                step="100"
                value={config.minDurationMs || 850}
                onChange={(e) => handleSaveConfig({ ...config, minDurationMs: Number(e.target.value) })}
                className="w-full accent-cyan-400 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] font-mono text-slate-500">
                <span>Fast (400ms)</span>
                <span>Balanced (850ms)</span>
                <span>Cinematic (3000ms)</span>
              </div>
            </div>

            {/* Video Sizing Mode */}
            <div className="space-y-1.5 border-t border-slate-700/20 pt-3">
              <label className={`text-xs font-bold block ${isLight ? 'text-slate-800' : 'text-white'}`}>
                Video Fit Aspect
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleSaveConfig({ ...config, videoFit: 'contain' })}
                  className={`py-2 px-3 rounded-xl text-xs font-mono font-bold border transition-all cursor-pointer ${
                    config.videoFit === 'contain'
                      ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300'
                      : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white'
                  }`}
                >
                  Contain (Letterbox)
                </button>
                <button
                  type="button"
                  onClick={() => handleSaveConfig({ ...config, videoFit: 'cover' })}
                  className={`py-2 px-3 rounded-xl text-xs font-mono font-bold border transition-all cursor-pointer ${
                    config.videoFit === 'cover'
                      ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300'
                      : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white'
                  }`}
                >
                  Cover (Full-frame)
                </button>
              </div>
            </div>

            {/* Sound Default */}
            <div className="flex items-center justify-between border-t border-slate-700/20 pt-3">
              <div>
                <label className={`text-xs font-bold block ${isLight ? 'text-slate-800' : 'text-white'}`}>
                  Enable Video Audio
                </label>
                <span className="text-3xs text-slate-400 font-mono block">
                  (Note: Browsers require user interaction for unmuted autoplay)
                </span>
              </div>
              <input
                type="checkbox"
                checked={config.soundEnabled}
                onChange={(e) => handleSaveConfig({ ...config, soundEnabled: e.target.checked })}
                className="w-5 h-5 accent-cyan-400 rounded cursor-pointer"
              />
            </div>

            {/* Custom Brand Title */}
            <div className="space-y-1.5 border-t border-slate-700/20 pt-3">
              <label className={`text-xs font-bold block ${isLight ? 'text-slate-800' : 'text-white'}`}>
                Custom Brand Headline
              </label>
              <input
                type="text"
                value={config.title}
                onChange={(e) => handleSaveConfig({ ...config, title: e.target.value })}
                placeholder="DAKSHYAM INNOVATIONS"
                className={`w-full text-xs px-3 py-2 rounded-xl border font-mono outline-hidden ${
                  isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-700 text-white'
                }`}
              />
            </div>

            {/* Custom Subtitle */}
            <div className="space-y-1.5">
              <label className={`text-xs font-bold block ${isLight ? 'text-slate-800' : 'text-white'}`}>
                Custom Subtitle / Tagline
              </label>
              <input
                type="text"
                value={config.subtitle}
                onChange={(e) => handleSaveConfig({ ...config, subtitle: e.target.value })}
                placeholder="Initializing Advanced Engineering & Telemetry Platform..."
                className={`w-full text-xs px-3 py-2 rounded-xl border font-mono outline-hidden ${
                  isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-700 text-white'
                }`}
              />
            </div>

            {/* Action Bar */}
            <div className="pt-4 border-t border-slate-700/30 flex gap-2">
              <button
                type="button"
                onClick={onTestLoader}
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-xs font-mono uppercase tracking-wider transition-all cursor-pointer shadow-md flex items-center justify-center gap-2"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                Test Loader Now
              </button>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
