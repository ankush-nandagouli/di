import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import gsap from 'gsap';
import DakshyamLogo from './DakshyamLogo';

export default function ComingSoonHero() {
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [hasGyro, setHasGyro] = useState(false);

  // --- CUSTOM LOGO CONFIGURATION ---
  // If you want to use your own logo image file:
  // 1. Upload your logo file (e.g., logo.png or logo.svg) into the "/public/" directory of the project.
  // 2. Change the value below from null to your image path (for example: "/logo.png").
  // 3. The app will automatically render your custom image instead of the built-in vector shield.
  const CUSTOM_LOGO_PATH: string | null = null; // Example: "/logo.png" or "/logo.svg"

  // Gyroscope tracking on mobile & smooth mouse position tracking backup for desktop
  useEffect(() => {
    const handleDeviceOrientation = (event: DeviceOrientationEvent) => {
      const { beta, gamma } = event;
      if (beta !== null && gamma !== null) {
        setHasGyro(true);
        // Normalize: natural device holding angle is usually around beta = 55 degrees (slanted towards face)
        // Let's calibrate around beta = 55, and gamma = 0
        const calibratedBeta = beta - 55;
        const calibratedGamma = gamma;
        
        // Scale and damp angles to ensure beautiful, subtle high-fidelity tilt responses
        const xAngle = Math.max(-14, Math.min(14, calibratedBeta / 2.5));
        const yAngle = Math.max(-14, Math.min(14, calibratedGamma / 2.5));
        
        setTilt({ x: xAngle, y: yAngle });
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (hasGyro) return; // Gyroscopic telemetry holds precedence
      const { innerWidth, innerHeight } = window;
      const x = (e.clientX / innerWidth) - 0.5;
      const y = (e.clientY / innerHeight) - 0.5;
      setTilt({ x: -y * 14, y: x * 14 });
    };

    window.addEventListener('deviceorientation', handleDeviceOrientation);
    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('deviceorientation', handleDeviceOrientation);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [hasGyro]);

  // Handle Apple iOS context where orientation authorization context must be requested upon user click
  useEffect(() => {
    const requestPermission = async () => {
      if (
        typeof window !== 'undefined' &&
        typeof (DeviceOrientationEvent as any).requestPermission === 'function'
      ) {
        try {
          const permissionState = await (DeviceOrientationEvent as any).requestPermission();
          if (permissionState === 'granted') {
            console.log('Telemetry access granted.');
          }
        } catch (err) {
          console.warn('Orientation request error: ', err);
        }
      }
    };

    window.addEventListener('click', requestPermission, { once: true });
    window.addEventListener('touchstart', requestPermission, { once: true });

    return () => {
      window.removeEventListener('click', requestPermission);
      window.removeEventListener('touchstart', requestPermission);
    };
  }, []);

  // Premium Letter Reveal on Mount via GSAP
  useEffect(() => {
    gsap.fromTo('.incoming-letter', 
      { y: 35, opacity: 0 }, 
      { y: 0, opacity: 1, duration: 1.2, stagger: 0.04, delay: 0.3, ease: 'power3.out' }
    );
  }, []);

  const textToReveal = "COMING SOON";

  return (
    <section 
      id="home" 
      className="relative w-full flex flex-col items-center justify-center py-16 px-4 overflow-hidden"
    >
      {/* Absolute floating micro particles */}
      <div className="absolute inset-0 pointer-events-none select-none overflow-hidden">
        <div className="absolute top-[20%] left-[10%] w-2 h-2 rounded-full bg-cyan-400 opacity-25 animate-ping duration-[3000ms]" />
        <div className="absolute top-[80%] right-[15%] w-3.5 h-3.5 rounded-full bg-cyan-400 opacity-30 blur-[1px] animate-[pulse_4s_infinite_ease-in-out]" />
        <div className="absolute bottom-[30%] left-[18%] w-1.5 h-1.5 rounded-full bg-[#0ea5e9] opacity-30 animate-pulse duration-[2500ms]" />
      </div>

      {/* 3D Tilted Wrapper Container responding to Gyroscope or Mouse coordinates */}
      <div 
        className="w-full max-w-4xl mx-auto flex flex-col items-center justify-center text-center transition-all"
        style={{
          transform: `perspective(1000px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
          transformStyle: 'preserve-3d',
          transition: hasGyro ? 'transform 0.05s ease-out' : 'transform 0.15s ease-out',
        }}
      >
        
        {/* 1. Brand Logo (Renders your custom logo if set, or defaults to the Dakshyam logo) */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: 'easeOut' }}
          className="mb-6 scale-[0.85] sm:scale-100 flex flex-col items-center justify-center"
          style={{ transformStyle: 'preserve-3d', transform: 'translateZ(40px)' }}
        >
          {CUSTOM_LOGO_PATH ? (
            <div className="relative group select-none flex flex-col items-center justify-center">
              <div className="absolute -inset-10 bg-radial from-cyan-500/20 via-transparent to-transparent opacity-80 blur-3xl animate-[pulse_6s_infinite_ease-in-out] -z-10" />
              <img 
                src={CUSTOM_LOGO_PATH} 
                alt="Dakshyam Logo" 
                referrerPolicy="no-referrer"
                className="max-h-24 sm:max-h-32 object-contain filter drop-shadow-[0_0_20px_rgba(34,211,238,0.25)]" 
              />
              <h1 className="text-4xl md:text-5xl font-black tracking-[0.24em] text-white font-sans text-center mt-6" style={{ textShadow: '0 0 25px rgba(34,211,238,0.22)' }}>
                DAKSHYAM
              </h1>
              <p className="mt-2 text-xs md:text-sm font-mono text-cyan-400 tracking-[0.62em] font-medium uppercase translate-x-[0.31em]">
                INNOVATION
              </p>
            </div>
          ) : (
            <DakshyamLogo size="md" showText={true} interactive={true} pulseGlow={true} />
          )}
        </motion.div>

        {/* 2. Interactive Letter Scramble Header with Coming Soon */}
        <div 
          className="mt-2 mb-2 overflow-hidden py-1"
          style={{ transform: 'translateZ(30px)' }}
        >
          <span className="inline-flex gap-[0.18em] font-sans text-xs sm:text-sm md:text-base font-bold tracking-[0.6em] text-cyan-400/80 [text-shadow:0_0_12px_rgba(34,211,238,0.2)] uppercase">
            {textToReveal.split("").map((char, index) => (
              <span 
                key={index} 
                className="incoming-letter inline-block opacity-0 transform translate-y-6"
              >
                {char === " " ? "\u00A0" : char}
              </span>
            ))}
          </span>
        </div>

        {/* 3. Elegantly Styled "THIS AUGUST" Display Node */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.6, type: 'spring' }}
          className="relative px-8 py-5 rounded-2xl bg-[#050505]/45 border border-cyan-500/10 backdrop-blur-md flex flex-col items-center justify-center overflow-hidden group hover:border-cyan-400/40 hover:shadow-[0_0_25px_rgba(34,211,238,0.15)] transition-all duration-500 max-w-sm mt-3"
          style={{ transform: 'translateZ(50px)' }}
        >
          {/* Neon micro-corner accents */}
          <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-cyan-400/40" />
          <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-cyan-400/40" />
          <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-cyan-400/40" />
          <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-cyan-400/40" />
          
          <span className="text-3xl sm:text-4xl font-black tracking-[0.3em] text-transparent bg-clip-text bg-gradient-to-r from-white via-cyan-100 to-cyan-400 font-sans text-center drop-shadow-[0_0_15px_rgba(34,211,238,0.3)] select-none">
            THIS AUGUST
          </span>
          
          <div className="mt-2.5 flex items-center gap-1.5 text-[9px] font-mono tracking-[0.25em] text-cyan-400/80 uppercase">
            <span className="w-1 h-1 rounded-full bg-cyan-400 animate-ping" />
            
          </div>
        </motion.div>

      </div>
    </section>
  );
}
