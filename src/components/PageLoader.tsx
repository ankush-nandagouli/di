import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Volume2, VolumeX, FastForward, Upload } from 'lucide-react';
import { PageLoaderConfig } from '../types';
import DakshyamLogo from './DakshyamLogo';

interface PageLoaderProps {
  isLoading: boolean;
  targetTab?: string;
  config: PageLoaderConfig;
  onFinish?: () => void;
  onOpenUploadSettings?: () => void;
  theme?: 'light' | 'dark';
}

export default function PageLoader({
  isLoading,
  config,
  onFinish,
  onOpenUploadSettings,
}: PageLoaderProps) {
  const [progress, setProgress] = useState(15);
  const [isMuted, setIsMuted] = useState(!config.soundEnabled);
  const [videoError, setVideoError] = useState(false);
  const [logoImgError, setLogoImgError] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Smooth progressive loading bar animation
  useEffect(() => {
    if (!isLoading) {
      setProgress(100);
      return;
    }

    setProgress(15);
    setVideoError(false);

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 95) return prev;
        const jump = Math.floor(Math.random() * 12) + 5;
        return Math.min(prev + jump, 96);
      });
    }, 110);

    return () => clearInterval(interval);
  }, [isLoading]);

  // Sync mute state to video element
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = isMuted;
    }
  }, [isMuted]);

  const hasCustomVideo = Boolean(config.videoUrl && config.videoUrl.trim().length > 0 && !videoError);
  const isGif = config.videoUrl?.toLowerCase().includes('.gif') || config.mediaType === 'gif';

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          key="dakshyam-page-loader"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.01 }}
          transition={{ duration: 0.35, ease: 'easeInOut' }}
          className="fixed inset-0 z-[9999] w-screen h-screen overflow-hidden select-none"
        >
          {/* ========================================================================= */}
          {/* CASE 1: FULL-SCREEN VIDEO ONLY (As per device screen size)                 */}
          {/* ========================================================================= */}
          {hasCustomVideo ? (
            <div className="relative w-full h-full bg-black flex items-center justify-center">
              {isGif ? (
                <img
                  src={config.videoUrl}
                  alt="Dakshyam Animated Loader"
                  className={`w-full h-full ${config.videoFit === 'contain' ? 'object-contain' : 'object-cover'}`}
                  onError={() => setVideoError(true)}
                />
              ) : (
                <video
                  ref={videoRef}
                  src={config.videoUrl}
                  autoPlay
                  loop
                  muted={isMuted}
                  playsInline
                  disablePictureInPicture
                  className={`w-full h-full ${config.videoFit === 'contain' ? 'object-contain' : 'object-cover'}`}
                  onError={(e) => {
                    console.warn('Video failed to play, switching to Dakshyam logo:', e);
                    setVideoError(true);
                  }}
                />
              )}

              {/* Minimalist Floating Overlay Controls (Sound & Skip) */}
              <div className="absolute top-4 right-4 sm:top-6 sm:right-6 flex items-center gap-2 z-30 pointer-events-auto">
                {!isGif && (
                  <button
                    type="button"
                    onClick={() => setIsMuted(!isMuted)}
                    className="p-2 sm:p-2.5 rounded-full bg-black/60 hover:bg-black/85 text-white/80 hover:text-white border border-white/20 backdrop-blur-md transition-all cursor-pointer shadow-lg active:scale-95"
                    title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
                  >
                    {isMuted ? (
                      <VolumeX className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-300" />
                    ) : (
                      <Volume2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-cyan-400" />
                    )}
                  </button>
                )}

                {onFinish && (
                  <button
                    type="button"
                    onClick={onFinish}
                    className="flex items-center gap-1.5 px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-full bg-black/60 hover:bg-black/85 text-white/90 hover:text-white border border-white/20 backdrop-blur-md font-mono text-[11px] sm:text-xs font-bold tracking-wider transition-all cursor-pointer shadow-lg active:scale-95"
                    title="Skip"
                  >
                    <FastForward className="w-3.5 h-3.5 text-amber-400" />
                    <span>SKIP</span>
                  </button>
                )}
              </div>
            </div>
          ) : (
            /* ======================================================================= */
            /* CASE 2: VIDEO NOT UPLOADED - DAKSHYAM INNOVATION LOGO WITH LOADING BAR   */
            /* ======================================================================= */
            <div className="relative w-full h-full bg-[#030712] flex flex-col items-center justify-center px-4 overflow-hidden">
              
              {/* Subtle Ambient Radial Lighting */}
              <div className="absolute inset-0 pointer-events-none opacity-20 bg-[linear-gradient(to_right,#0284c710_1px,transparent_1px),linear-gradient(to_bottom,#0284c710_1px,transparent_1px)] bg-[size:4rem_4rem]" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 sm:w-96 h-80 sm:h-96 bg-sky-500/15 rounded-full blur-3xl pointer-events-none animate-pulse" />
              <div className="absolute bottom-12 left-1/2 -translate-x-1/2 w-72 h-32 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

              {/* Minimal Top-Right Skip & Admin Upload Link */}
              <div className="absolute top-4 right-4 sm:top-6 sm:right-6 flex items-center gap-2 z-30 pointer-events-auto">
                {onOpenUploadSettings && (
                  <button
                    type="button"
                    onClick={onOpenUploadSettings}
                    className="hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-slate-900/80 hover:bg-cyan-950/80 text-cyan-300 border border-cyan-500/30 font-mono text-[11px] font-semibold transition-all cursor-pointer shadow-lg"
                    title="Upload custom animated video"
                  >
                    <Upload className="w-3.5 h-3.5 text-amber-400" />
                    <span>Upload Video</span>
                  </button>
                )}

                {onFinish && (
                  <button
                    type="button"
                    onClick={onFinish}
                    className="flex items-center gap-1 px-3.5 py-1.5 rounded-full bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/60 font-mono text-[11px] font-bold transition-all cursor-pointer shadow-lg active:scale-95"
                    title="Skip"
                  >
                    <FastForward className="w-3.5 h-3.5 text-amber-400" />
                    <span>SKIP</span>
                  </button>
                )}
              </div>

              {/* Center Presentation: DAKSHYAM INNOVATION LOGO */}
              <motion.div
                initial={{ opacity: 0, scale: 0.94 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className="relative z-10 flex flex-col items-center justify-center text-center max-w-md w-full"
              >
                {/* Logo Mark with Subtle Aura */}
                <div className="relative w-28 h-28 sm:w-36 sm:h-36 md:w-44 md:h-44 flex items-center justify-center mb-5 filter drop-shadow-[0_0_35px_rgba(56,189,248,0.35)]">
                  {!logoImgError ? (
                    <img
                      src="/logo.svg"
                      alt="Dakshyam Innovations"
                      onError={() => setLogoImgError(true)}
                      className="w-full h-full object-contain select-none transition-transform duration-500 hover:scale-105"
                    />
                  ) : (
                    <DakshyamLogo size="sm" showText={false} interactive={false} pulseGlow={false} />
                  )}
                </div>

                {/* Bold Display Brand Title */}
                <div className="space-y-1 mb-7 select-none">
                  <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-[0.25em] text-white font-sans uppercase">
                    DAKSHYAM
                  </h1>
                  <p className="text-[10px] sm:text-xs md:text-sm font-mono tracking-[0.55em] font-bold text-sky-400 uppercase translate-x-[0.25em]">
                    INNOVATIONS
                  </p>
                </div>

                {/* LOADING BAR */}
                <div className="w-full max-w-xs sm:max-w-sm space-y-2.5 px-2">
                  <div className="flex justify-between items-center text-xs font-mono">
                    <span className="text-slate-400 font-semibold tracking-wider flex items-center gap-1.5 text-[11px] sm:text-xs">
                      <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse inline-block" />
                      Loading...
                    </span>
                    <span className="text-amber-300 font-mono font-bold tracking-wider text-xs sm:text-sm">
                      {progress}%
                    </span>
                  </div>

                  {/* High-Tech Glowing Progress Bar Track */}
                  <div className="w-full h-2.5 sm:h-3 bg-slate-950/90 rounded-full p-0.5 border border-cyan-500/30 shadow-[0_0_20px_rgba(34,211,238,0.25)] overflow-hidden">
                    <motion.div
                      className="h-full rounded-full bg-gradient-to-r from-cyan-500 via-sky-400 to-amber-400 shadow-[0_0_15px_rgba(34,211,238,0.85)]"
                      style={{ width: `${progress}%` }}
                      transition={{ ease: 'easeOut', duration: 0.15 }}
                    />
                  </div>

                  <p className="text-[10px] sm:text-[11px] font-mono text-slate-500 tracking-widest uppercase text-center pt-2">
                    Centre for Technical Excellence & Research
                  </p>
                </div>
              </motion.div>

              {/* Bottom Subtle Footer */}
              <div className="absolute bottom-4 inset-x-0 text-center font-mono text-[10px] text-slate-500/70 pointer-events-none">
                DAKSHYAM INNOVATIONS • EMBEDDED COMPUTING & VOCATIONAL STEM
              </div>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
