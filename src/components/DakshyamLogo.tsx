import React, { useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import gsap from 'gsap';

interface DakshyamLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  interactive?: boolean;
  pulseGlow?: boolean;
  theme?: 'light' | 'dark';
}

export default function DakshyamLogo({
  size = 'md',
  showText = true,
  interactive = true,
  pulseGlow = true,
  theme = 'dark',
}: DakshyamLogoProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const arrowRef = useRef<SVGGElement>(null);
  const shieldRef = useRef<SVGGElement>(null);

  // Determine size scale factors
  const dimensions = {
    sm: { width: 140, height: 120 },
    md: { width: 260, height: 230 },
    lg: { width: 380, height: 340 },
    xl: { width: 520, height: 460 },
  }[size];

  // Micro-interactions via GSAP and Anime.js combined
  useEffect(() => {
    if (!interactive || !containerRef.current) return;

    const el = containerRef.current;
    const arrow = arrowRef.current;
    const shield = shieldRef.current;

    let hoverTimeline: gsap.core.Timeline | null = null;

    const onMouseEnter = () => {
      // 1. GSAP slides the metallic gold arrow forward (up-right @ 45 degrees)
      hoverTimeline = gsap.timeline();
      hoverTimeline.to(arrow, {
        x: 14,
        y: -14,
        scale: 1.05,
        duration: 0.4,
        ease: 'power2.out',
      });

      // 2. GSAP gives the blue "D" shield an organic, flexible rubber bounce
      gsap.fromTo(shield,
        { scale: 1, rotation: 0 },
        { 
          scale: 1.02, 
          rotation: -1, 
          duration: 0.8, 
          ease: 'elastic.out(1.2, 0.5)',
          yoyo: true,
          repeat: 1
        }
      );
    };

    const onMouseLeave = () => {
      if (hoverTimeline) {
        hoverTimeline.kill();
      }
      
      // GSAP animate back to rest position with spring-back rebound
      gsap.to(arrow, {
        x: 0,
        y: 0,
        scale: 1,
        duration: 0.5,
        ease: 'elastic.out(1, 0.5)',
      });
    };

    const onMouseDown = () => {
      // Squash on click
      gsap.to(arrow, {
        scale: 0.9,
        x: 6,
        y: -6,
        duration: 0.1,
      });
      gsap.to(shield, {
        scale: 0.94,
        duration: 0.1,
      });
    };

    const onMouseUp = () => {
      gsap.to(arrow, {
        scale: 1.05,
        x: 14,
        y: -14,
        duration: 0.2,
        ease: 'power1.out',
      });
      gsap.to(shield, {
        scale: 1.02,
        duration: 0.2,
        ease: 'power1.out',
      });
    };

    el.addEventListener('mouseenter', onMouseEnter);
    el.addEventListener('mouseleave', onMouseLeave);
    el.addEventListener('mousedown', onMouseDown);
    el.addEventListener('mouseup', onMouseUp);

    return () => {
      el.removeEventListener('mouseenter', onMouseEnter);
      el.removeEventListener('mouseleave', onMouseLeave);
      el.removeEventListener('mousedown', onMouseDown);
      el.removeEventListener('mouseup', onMouseUp);
    };
  }, [interactive]);

  // Entrance animations config via Framer Motion (motion)
  const logoEntrance = {
    hidden: { scale: 0.6, opacity: 0 },
    visible: { 
      scale: 1, 
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 85,
        damping: 15,
        staggerChildren: 0.12,
        delayChildren: 0.1,
      }
    }
  };

  const shieldEntrance = {
    hidden: { pathLength: 0, opacity: 0 },
    visible: { 
      pathLength: 1, 
      opacity: 1,
      transition: { duration: 1.6, ease: "easeInOut" }
    }
  };

  const textLettersEntrance = {
    hidden: { opacity: 0, y: 18 },
    visible: { 
      opacity: 1, 
      y: 0, 
      transition: { type: "spring", stiffness: 100, damping: 10 }
    }
  };

  return (
    <div 
      ref={containerRef}
      className={`relative inline-flex flex-col items-center justify-center transition-all duration-300 ${
        interactive ? 'cursor-pointer hover:shadow-2xl hover:shadow-cyan-500/5' : ''
      }`}
    >
      {/* 1. Pulse glowing background elements if prompted */}
      {pulseGlow && (
        <div className={`absolute -inset-10 bg-radial via-transparent to-transparent opacity-80 blur-3xl animate-[pulse_6s_infinite_ease-in-out] -z-10 ${
          theme === 'light' ? 'from-amber-500/15' : 'from-cyan-500/20'
        }`} />
      )}
      
      {/* 2. Main High-Fidelity SVG Vector Logo */}
      <motion.svg
        width={dimensions.width}
        height={dimensions.height}
        viewBox="0 0 500 450"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        initial="hidden"
        animate="visible"
        variants={logoEntrance}
        className="w-full h-auto select-none"
      >
        <defs>
          {/* Deep Space Cyan/Teal Gradients for Shield */}
          <linearGradient id="shieldGrad" x1="80" y1="50" x2="380" y2="350" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#052e3d" />
            <stop offset="35%" stopColor="#0891b2" />
            <stop offset="70%" stopColor="#22d3ee" />
            <stop offset="100%" stopColor="#022e3c" />
          </linearGradient>

          <linearGradient id="innerShieldGrad" x1="100" y1="80" x2="320" y2="300" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#22d3ee" />
            <stop offset="100%" stopColor="#083344" />
          </linearGradient>

          {/* Ice Blue Gradients for Spear Arrow */}
          <linearGradient id="arrowGoldLight" x1="180" y1="320" x2="360" y2="40" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#0ea5e9" />
            <stop offset="50%" stopColor="#38bdf8" />
            <stop offset="100%" stopColor="#e0f2fe" />
          </linearGradient>

          <linearGradient id="arrowGoldShadow" x1="200" y1="360" x2="380" y2="80" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#0369a1" />
            <stop offset="60%" stopColor="#025a7a" />
            <stop offset="100%" stopColor="#0072e1" />
          </linearGradient>

          {/* Specular highlights & reflections */}
          <linearGradient id="specularGlow" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="white" stopOpacity="0.4" />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </linearGradient>

          <filter id="softGlowFilter" x="-10%" y="-10%" width="120%" height="120%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>

          <filter id="shadowFilter" x="-5%" y="-5%" width="115%" height="115%">
            <feDropShadow dx="0" dy="8" stdDeviation="12" floodColor="#010617" floodOpacity="0.45" />
          </filter>
        </defs>

        {/* Dynamic Shadow Layer */}
        <g filter="url(#shadowFilter)">
          
          {/* A. Vector Blue "D" Shield */}
          <g ref={shieldRef}>
            {/* Outer Blue Wing Wrapper */}
            <path
              d="M 140 60 C 140 60 410 60 330 190 C 310 220 280 250 240 280 C 220 295 195 305 160 310 C 140 315 140 295 141 270 C 142 225 150 160 140 60 Z"
              fill="url(#shieldGrad)"
              stroke="#0891b2"
              strokeWidth="2.5"
            />
            {/* Swoosh Inner Wave (Making the stylized D glyph curve inside) */}
            <path
              d="M 141 120 C 180 120 280 150 260 210 C 250 230 220 250 170 260 L 175 190 C 190 185 210 175 210 160 C 210 150 180 140 141 140 Z"
              fill="url(#innerShieldGrad)"
              opacity="0.9"
            />
            {/* Blue Shield Highlight Accent */}
            <path
              d="M 143 75 C 143 75 295 75 305 130 C 275 120 180 100 143 105 Z"
              fill="url(#specularGlow)"
              opacity="0.65"
            />
          </g>

          {/* B. Metallic-Glow Launcher Arrow Spear (Rotated at 45° intersecting the D) */}
          <g ref={arrowRef}>
            {/* Arrow Rear tail section - Chevron 1 (Intersecting lower left area) */}
            <path
              d="M 175 245 L 210 270 L 195 295 L 155 265 Z"
              fill="url(#arrowGoldShadow)"
              stroke="#0369a1"
              strokeWidth="1.5"
            />
            <path
              d="M 175 245 L 140 275 L 155 295 L 195 295 Z"
              fill="url(#arrowGoldLight)"
              stroke="#0284c7"
              strokeWidth="1.5"
            />

            {/* Arrow Mid section - Chevron 2 (Passing through inner shield) */}
            <path
              d="M 215 195 L 255 225 L 245 250 L 200 215 Z"
              fill="url(#arrowGoldShadow)"
            />
            <path
              d="M 215 195 L 175 225 L 190 250 L 200 215 Z"
              fill="url(#arrowGoldLight)"
            />

            {/* Spearhead: dynamic triangular points split symmetrically with reflection */}
            {/* Symmetrical Left half (Light Highlight) */}
            <path
              d="M 245 165 L 350 60 L 280 135 L 245 165 Z"
              fill="url(#arrowGoldLight)"
              stroke="#22d3ee"
              strokeWidth="1"
            />
            {/* Symmetrical Right half (Dark Shaded Shadow side for high contrast 3D effect) */}
            <path
              d="M 245 165 L 350 60 V 95 L 285 165 Z"
              fill="url(#arrowGoldShadow)"
              stroke="#015570"
              strokeWidth="1"
            />
            
            {/* Dynamic Arrowhead core light stream overlay */}
            <path
              d="M 245 165 L 350 60 L 273 145 Z"
              fill="url(#specularGlow)"
              opacity="0.5"
            />
          </g>

        </g>
      </motion.svg>

      {/* 3. Text block: Custom branding typography */}
      {showText && (
        <motion.div 
          className="mt-6 flex flex-col items-center select-none"
          variants={logoEntrance}
        >
          {/* Main heading DAKSHYAM in elegant modern geometric style */}
          <motion.h1 
            variants={textLettersEntrance}
            className={`text-4xl md:text-5xl font-black tracking-[0.24em] font-sans text-center transition-all duration-300 ${
              theme === 'light' ? 'text-amber-950' : 'text-white'
            }`}
            style={{ 
              textShadow: theme === 'light' 
                ? '0 0 25px rgba(217,119,6,0.15)' 
                : '0 0 25px rgba(34,211,238,0.22)' 
            }}
          >
            DAKSHYAM
          </motion.h1>

          {/* Slogan spacing mono for INNOVATION */}
          <motion.p 
            variants={textLettersEntrance}
            className={`mt-2 text-xs md:text-sm font-mono tracking-[0.62em] font-black uppercase translate-x-[0.31em] transition-all duration-300 ${
              theme === 'light' ? 'text-[#b45309]' : 'text-cyan-400'
            }`}
          >
            INNOVATION
          </motion.p>
        </motion.div>
      )}
    </div>
  );
}
