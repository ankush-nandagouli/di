import React from 'react';
import ThreeBackground from './components/ThreeBackground';
import ComingSoonHero from './components/ComingSoonHero';

export default function App() {
  return (
    <div className="relative min-h-screen text-white bg-[#050505] font-sans antialiased selection:bg-cyan-500/35 selection:text-cyan-100 select-none overflow-hidden flex flex-col justify-between">
      
      {/* Immersive UI Fluid Mesh Background & Noise Overlay */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none -z-20">
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-[#1a1a3a] rounded-full blur-[120px] opacity-40"></div>
        <div className="absolute bottom-[10%] right-[-5%] w-[50%] h-[50%] bg-[#0f2a2e] rounded-full blur-[100px] opacity-30"></div>
        <div className="absolute top-[40%] left-[30%] w-[40%] h-[40%] bg-[#221035] rounded-full blur-[130px] opacity-25"></div>
        <div 
          className="absolute inset-0 opacity-[0.035] pointer-events-none" 
          style={{
            backgroundImage: `url('data:image/svg+xml,%3Csvg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"%3E%3Cfilter id="noiseFilter"%3E%3CfeTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch"/%3E%3C/filter%3E%3Crect width="100%25" height="100%25" filter="url(%23noiseFilter)"/%3E%3C/svg%3E')`
          }}
        />
      </div>

      {/* 1. Interactive 3D WebGL Background Mesh */}
      <ThreeBackground />

      {/* 2. Main Centered Coming Soon Area */}
      <main className="relative z-10 flex-grow flex items-center justify-center">
        <ComingSoonHero />
      </main>

      {/* 3. Simple elegant copyright credit */}
      <footer className="relative z-10 w-full py-6 text-center text-xs font-mono tracking-widest text-slate-500 border-t border-cyan-500/5 bg-[#050505]/20 backdrop-blur-sm">
        © 2026 Dakshyam Innovations
      </footer>

    </div>
  );
}
