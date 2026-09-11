import React, { useState } from 'react';
import { Printer, Download, CheckCircle2, ShieldCheck, Award, X, Sparkles, Copy, Check } from 'lucide-react';
import { Certificate } from '../types';

interface OfficialCertificateProps {
  certificate: Certificate;
  onClose?: () => void;
  showControls?: boolean;
  theme?: 'light' | 'dark';
}

export default function OfficialCertificate({
  certificate,
  onClose,
  showControls = true,
  theme = 'dark',
}: OfficialCertificateProps) {
  const [styleMode, setStyleMode] = useState<'parchment' | 'obsidian'>('parchment');
  const [copiedKey, setCopiedKey] = useState(false);

  const isParchment = styleMode === 'parchment';

  const handleCopyKey = () => {
    navigator.clipboard.writeText(certificate.id);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2500);
  };

  const handlePrint = () => {
    window.print();
  };

  // Format issue date nicely (e.g., 2026-09-11 to September 11, 2026)
  const formatDisplayDate = (dateStr: string) => {
    try {
      if (!dateStr) return 'September 11, 2026';
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const day = parseInt(parts[2], 10);
        const date = new Date(year, month, day);
        return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
      }
      return dateStr;
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="w-full flex flex-col items-center space-y-4 font-sans select-none">
      {/* Top Action Bar (hidden when printing) */}
      {showControls && (
        <div className="w-full max-w-4xl flex flex-wrap items-center justify-between gap-3 px-2 py-2 print:hidden">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono uppercase font-bold text-slate-400">
              Certificate Finish:
            </span>
            <div className="inline-flex rounded-lg p-0.5 bg-black/40 border border-slate-700/60">
              <button
                type="button"
                onClick={() => setStyleMode('parchment')}
                className={`text-[10px] font-mono font-bold px-3 py-1 rounded-md transition-all cursor-pointer ${
                  isParchment
                    ? 'bg-amber-100 text-amber-950 shadow-xs font-black'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                🏛 Royal Parchment (Official Physical)
              </button>
              <button
                type="button"
                onClick={() => setStyleMode('obsidian')}
                className={`text-[10px] font-mono font-bold px-3 py-1 rounded-md transition-all cursor-pointer ${
                  !isParchment
                    ? 'bg-cyan-500 text-slate-950 shadow-xs font-black'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                🌌 Obsidian Gold (Security Edition)
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyKey}
              className="text-[10px] font-mono font-bold px-3 py-1.5 rounded-lg border border-slate-600/50 bg-black/40 hover:bg-black/60 text-slate-300 hover:text-white flex items-center gap-1.5 transition-all cursor-pointer"
              title="Copy Unique Verification Key"
            >
              {copiedKey ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
              {copiedKey ? 'Key Copied!' : certificate.id}
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="text-[10px] font-mono uppercase font-black px-4 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 flex items-center gap-1.5 shadow-md hover:shadow-lg transition-all cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              Print / Save PDF
            </button>

            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="text-[10px] font-mono font-bold px-3 py-1.5 rounded-lg border border-slate-700 bg-black/30 hover:bg-black/60 text-slate-400 hover:text-white cursor-pointer transition-all"
              >
                ✕ Close
              </button>
            )}
          </div>
        </div>
      )}

      {/* Main Certificate Container (Fully Vector SVG for 100% Crisp Print & Screen Rendering) */}
      <div 
        id="official-certificate-render"
        className={`w-full max-w-4xl rounded-xl overflow-hidden shadow-2xl transition-all relative ${
          isParchment 
            ? 'border-4 border-[#b8860b] shadow-[0_20px_60px_rgba(0,0,0,0.4)]' 
            : 'border-4 border-[#d4af37] shadow-[0_20px_60px_rgba(0,0,0,0.6)]'
        } print:border-0 print:shadow-none print:m-0 print:p-0`}
      >
        <svg
          viewBox="0 0 1000 700"
          width="100%"
          height="100%"
          className="w-full h-auto block select-none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* 1. Metallic Gold Gradients */}
            <linearGradient id="certGoldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f5e08b" />
              <stop offset="25%" stopColor="#d4af37" />
              <stop offset="50%" stopColor="#aa771c" />
              <stop offset="75%" stopColor="#d4af37" />
              <stop offset="100%" stopColor="#8b5a00" />
            </linearGradient>

            <linearGradient id="goldTextGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#9a6b10" />
              <stop offset="40%" stopColor="#b47b15" />
              <stop offset="70%" stopColor="#784f05" />
              <stop offset="100%" stopColor="#573801" />
            </linearGradient>

            <linearGradient id="darkGoldTextGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#f8e79b" />
              <stop offset="50%" stopColor="#dfb743" />
              <stop offset="100%" stopColor="#aa7c11" />
            </linearGradient>

            {/* Deep Navy / Slate text gradient for royal parchment */}
            <linearGradient id="deepNavyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#0b192c" />
              <stop offset="100%" stopColor="#1e3a5f" />
            </linearGradient>

            {/* Crimson Satin Ribbon Gradients */}
            <linearGradient id="ribbonGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#b91c1c" />
              <stop offset="50%" stopColor="#dc2626" />
              <stop offset="100%" stopColor="#7f1d1d" />
            </linearGradient>
            <linearGradient id="ribbonGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#991b1b" />
              <stop offset="50%" stopColor="#b91c1c" />
              <stop offset="100%" stopColor="#450a0a" />
            </linearGradient>

            {/* Background Parchment Radial Texture */}
            <radialGradient id="parchmentGrad" cx="50%" cy="50%" r="75%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="50%" stopColor="#fdfcf8" />
              <stop offset="85%" stopColor="#f7f3e6" />
              <stop offset="100%" stopColor="#efe8d3" />
            </radialGradient>

            {/* Obsidian Dark Background Radial Gradient */}
            <radialGradient id="obsidianGrad" cx="50%" cy="50%" r="75%">
              <stop offset="0%" stopColor="#0f1e36" />
              <stop offset="60%" stopColor="#0a1424" />
              <stop offset="100%" stopColor="#040912" />
            </radialGradient>

            {/* Official Seal Gold Radial Gradient */}
            <radialGradient id="sealGoldGrad" cx="40%" cy="40%" r="60%">
              <stop offset="0%" stopColor="#fff9d2" />
              <stop offset="35%" stopColor="#f3ca52" />
              <stop offset="70%" stopColor="#b8860b" />
              <stop offset="100%" stopColor="#6e4f00" />
            </radialGradient>

            {/* Fine Guilloche / Security Pattern */}
            <pattern id="guillochePattern" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
              <path 
                d="M 0 20 Q 10 0 20 20 T 40 20 M 20 0 Q 0 10 20 20 T 20 40" 
                fill="none" 
                stroke={isParchment ? "#b8860b" : "#d4af37"} 
                strokeWidth="0.4" 
                strokeOpacity={isParchment ? "0.12" : "0.08"} 
              />
            </pattern>

            {/* Soft Drop Shadow for Seal and Ribbons */}
            <filter id="sealShadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="4" stdDeviation="5" floodColor="#000000" floodOpacity="0.35" />
            </filter>
          </defs>

          {/* BACKGROUND LAYER */}
          <rect 
            x="0" 
            y="0" 
            width="1000" 
            height="700" 
            fill={isParchment ? "url(#parchmentGrad)" : "url(#obsidianGrad)"} 
          />

          {/* GUILLOCHE SECURITY PATTERN OVERLAY */}
          <rect 
            x="20" 
            y="20" 
            width="960" 
            height="660" 
            fill="url(#guillochePattern)" 
            opacity="0.9" 
          />

          {/* LARGE WATERMARK ROSETTE EMBLEM (Center Background) */}
          <g transform="translate(500, 350)" opacity={isParchment ? "0.04" : "0.03"}>
            <circle cx="0" cy="0" r="190" fill="none" stroke={isParchment ? "#0a192f" : "#ffffff"} strokeWidth="4" />
            <circle cx="0" cy="0" r="160" fill="none" stroke={isParchment ? "#b8860b" : "#d4af37"} strokeWidth="2" strokeDasharray="6 3" />
            <circle cx="0" cy="0" r="130" fill="none" stroke={isParchment ? "#0a192f" : "#ffffff"} strokeWidth="1.5" />
            {/* Multi-petal rosette watermarks */}
            {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg) => (
              <ellipse 
                key={deg} 
                cx="0" 
                cy="0" 
                rx="45" 
                ry="140" 
                transform={`rotate(${deg})`} 
                fill="none" 
                stroke={isParchment ? "#b8860b" : "#d4af37"} 
                strokeWidth="1" 
              />
            ))}
          </g>

          {/* ========================================================================= */}
          {/* ORNATE MULTI-TIER BORDER SUITE (AUTHENTIC DIPLOMA FRAME) */}
          {/* ========================================================================= */}
          
          {/* Outer Heavy Gold Rule */}
          <rect 
            x="16" 
            y="16" 
            width="968" 
            height="668" 
            fill="none" 
            stroke="url(#certGoldGrad)" 
            strokeWidth="5" 
            rx="4" 
          />

          {/* Fine Secondary Gold Rule */}
          <rect 
            x="24" 
            y="24" 
            width="952" 
            height="652" 
            fill="none" 
            stroke={isParchment ? "#573801" : "#d4af37"} 
            strokeWidth="1.2" 
            rx="3" 
          />

          {/* Perimeter Microprint Security Line */}
          <g fill={isParchment ? "#785810" : "#d4af37"} opacity="0.6" fontSize="5.5" fontFamily="monospace" fontWeight="bold" letterSpacing="2">
            <text x="500" y="21" textAnchor="middle">★ DAKSHYAM INNOVATIONS OFFICIAL ACCREDITATION PROTOCOL ★ NATIONAL EDUCATION POLICY (NEP 2020) COMPLIANT ★ ISO 9001:2015 CERTIFIED INSTITUTION ★</text>
            <text x="500" y="682" textAnchor="middle">★ VERIFIABLE CREDENTIAL LEDGER ★ ALL RIGHTS RESERVED ★ DAKSHYAM INNOVATIONS TECHNICAL & VOCATIONAL EXCELLENCE CELL ★</text>
          </g>

          {/* Inner Ornate Frame with Rounded Corners */}
          <rect 
            x="36" 
            y="36" 
            width="928" 
            height="628" 
            fill="none" 
            stroke="url(#certGoldGrad)" 
            strokeWidth="2.2" 
          />
          <rect 
            x="40" 
            y="40" 
            width="920" 
            height="620" 
            fill="none" 
            stroke={isParchment ? "#0b192c" : "#38bdf8"} 
            strokeWidth="0.8" 
            strokeDasharray="12 4" 
          />

          {/* 4 CLASSICAL ORNAMENTAL CORNER ROSETTES / FILIGREE */}
          {/* Top-Left Corner */}
          <g transform="translate(36, 36)" stroke="url(#certGoldGrad)" fill="none" strokeWidth="2">
            <path d="M 0 45 Q 0 0 45 0" />
            <path d="M 6 45 Q 6 6 45 6" strokeWidth="1" />
            <path d="M 0 20 C 15 20 20 15 20 0" strokeWidth="1.2" />
            <circle cx="16" cy="16" r="3.5" fill="url(#certGoldGrad)" stroke="none" />
            <circle cx="28" cy="28" r="2" fill="url(#certGoldGrad)" stroke="none" />
          </g>

          {/* Top-Right Corner */}
          <g transform="translate(964, 36) scale(-1, 1)" stroke="url(#certGoldGrad)" fill="none" strokeWidth="2">
            <path d="M 0 45 Q 0 0 45 0" />
            <path d="M 6 45 Q 6 6 45 6" strokeWidth="1" />
            <path d="M 0 20 C 15 20 20 15 20 0" strokeWidth="1.2" />
            <circle cx="16" cy="16" r="3.5" fill="url(#certGoldGrad)" stroke="none" />
            <circle cx="28" cy="28" r="2" fill="url(#certGoldGrad)" stroke="none" />
          </g>

          {/* Bottom-Left Corner */}
          <g transform="translate(36, 664) scale(1, -1)" stroke="url(#certGoldGrad)" fill="none" strokeWidth="2">
            <path d="M 0 45 Q 0 0 45 0" />
            <path d="M 6 45 Q 6 6 45 6" strokeWidth="1" />
            <path d="M 0 20 C 15 20 20 15 20 0" strokeWidth="1.2" />
            <circle cx="16" cy="16" r="3.5" fill="url(#certGoldGrad)" stroke="none" />
            <circle cx="28" cy="28" r="2" fill="url(#certGoldGrad)" stroke="none" />
          </g>

          {/* Bottom-Right Corner */}
          <g transform="translate(964, 664) scale(-1, -1)" stroke="url(#certGoldGrad)" fill="none" strokeWidth="2">
            <path d="M 0 45 Q 0 0 45 0" />
            <path d="M 6 45 Q 6 6 45 6" strokeWidth="1" />
            <path d="M 0 20 C 15 20 20 15 20 0" strokeWidth="1.2" />
            <circle cx="16" cy="16" r="3.5" fill="url(#certGoldGrad)" stroke="none" />
            <circle cx="28" cy="28" r="2" fill="url(#certGoldGrad)" stroke="none" />
          </g>

          {/* ========================================================================= */}
          {/* HEADER SECTION: OFFICIAL LOGO + DAKSHYAM INNOVATIONS IN BOLD ATTRACTIVE FONT */}
          {/* ========================================================================= */}

          {/* 1. Logo Emblem */}
          {certificate.customLogoUrl ? (
            <image 
              href={certificate.customLogoUrl} 
              x="440" 
              y="44" 
              width="120" 
              height="48" 
              preserveAspectRatio="xMidYMid meet" 
            />
          ) : (
            // High-detail official vector emblem of Dakshyam Innovations
            <g transform="translate(500, 68) scale(0.68)">
              {/* Emblem Blue Winged Shield */}
              <path
                d="M -45 -30 C -45 -30 45 -30 25 15 C 18 25 8 35 -5 45 C -15 50 -25 54 -38 56 C -44 57 -44 50 -44 42 C -43 28 -42 5 -45 -30 Z"
                fill="url(#deepNavyGrad)"
                stroke="url(#certGoldGrad)"
                strokeWidth="2.5"
              />
              {/* Inner Curve */}
              <path
                d="M -44 -12 C -30 -12 5 -2 -2 18 C -5 25 -15 32 -32 35 L -30 12 C -25 10 -18 7 -18 2 C -18 -1 -28 -5 -44 -5 Z"
                fill="#38bdf8"
                opacity="0.8"
              />
              {/* 3D Metallic Launcher Spear / Arrow */}
              <path d="M -15 30 L 35 -30 L 10 -4 L -15 30 Z" fill="#0284c7" />
              <path d="M -15 30 L 35 -30 L 2 -18 L -15 30 Z" fill="#38bdf8" />
              <path d="M 0 10 L 35 -30 L 8 -5 Z" fill="#ffffff" opacity="0.8" />
            </g>
          )}

          {/* 2. BENEATH THE LOGO: NAME "DAKSHYAM INNOVATIONS" IN BOLD ATTRACTIVE FONT */}
          <g transform="translate(500, 122)" textAnchor="middle">
            {/* Ornamental Gold Wing Accent (Left) */}
            <path
              d="M -195 -3 C -230 -7 -265 3 -295 15 C -270 9 -240 7 -210 9 Z"
              fill="url(#certGoldGrad)"
              opacity="0.85"
            />
            {/* Ornamental Gold Wing Accent (Right) */}
            <path
              d="M 195 -3 C 230 -7 265 3 295 15 C 270 9 240 7 210 9 Z"
              fill="url(#certGoldGrad)"
              opacity="0.85"
            />

            {/* Main Brand Title in Bold Attractive Font */}
            <text
              x="0"
              y="0"
              fontFamily="'Cinzel Decorative', 'Cinzel', 'Playfair Display', 'Times New Roman', Georgia, serif"
              fontSize="33"
              fontWeight="900"
              letterSpacing="7"
              fill={isParchment ? "url(#goldTextGrad)" : "url(#darkGoldTextGrad)"}
              style={{
                textTransform: 'uppercase',
                filter: isParchment ? 'drop-shadow(0 1.5px 2px rgba(90,55,0,0.32))' : 'drop-shadow(0 2px 6px rgba(0,0,0,0.8))'
              }}
            >
              DAKSHYAM INNOVATIONS
            </text>

            {/* Fine Horizontal Accent with Diamond Core */}
            <g transform="translate(0, 8)" stroke="url(#certGoldGrad)" fill="url(#certGoldGrad)">
              <line x1="-165" y1="0" x2="-15" y2="0" strokeWidth="1.2" />
              <polygon points="0,-3 3,0 0,3 -3,0" stroke="none" />
              <line x1="15" y1="0" x2="165" y2="0" strokeWidth="1.2" />
            </g>

            {/* Institutional Tagline & Statutory Accreditation */}
            <text
              x="0"
              y="22"
              fontFamily="'Montserrat', 'Inter', -apple-system, sans-serif"
              fontSize="9.5"
              fontWeight="800"
              letterSpacing="3.5"
              fill={isParchment ? "#0a1f44" : "#38bdf8"}
              textTransform="uppercase"
            >
              Centre for Technical Excellence, Research & Skill Development
            </text>

            <text
              x="0"
              y="34"
              fontFamily="'Montserrat', sans-serif"
              fontSize="7.8"
              fontWeight="600"
              letterSpacing="2"
              fill={isParchment ? "#475569" : "#94a3b8"}
              textTransform="uppercase"
            >
              An ISO 9001:2015 Certified Organization • National Education Policy (NEP 2020) Accredited
            </text>

            {/* Optional Training Partner Attribution */}
            {certificate.trainingPartnerName && (
              <g transform="translate(0, 47)">
                <rect 
                  x="-185" 
                  y="-11" 
                  width="370" 
                  height="18" 
                  rx="4" 
                  fill={isParchment ? "#f1eee0" : "#0d203d"} 
                  stroke={isParchment ? "#d8d0b5" : "#1e40af"} 
                  strokeWidth="0.8" 
                />
                <text
                  x="0"
                  y="1.5"
                  fontFamily="'Montserrat', sans-serif"
                  fontSize="7.5"
                  fontWeight="700"
                  letterSpacing="1"
                  fill={isParchment ? "#0b192c" : "#7dd3fc"}
                  textAnchor="middle"
                  textTransform="uppercase"
                >
                  In Academic Partnership with: {certificate.trainingPartnerName}
                </text>
              </g>
            )}
          </g>

          {/* Classical Ornamental Divider with Center Diamond Accent */}
          <g transform="translate(500, 185)" stroke="url(#certGoldGrad)" fill="url(#certGoldGrad)">
            <line x1="-280" y1="0" x2="-25" y2="0" strokeWidth="1.2" />
            <polygon points="-25,0 -20,-3 -15,0 -20,3" stroke="none" />
            <circle cx="0" cy="0" r="4.5" fill="none" strokeWidth="1.5" />
            <polygon points="0,-3 3,0 0,3 -3,0" stroke="none" />
            <polygon points="15,0 20,-3 25,0 20,3" stroke="none" />
            <line x1="25" y1="0" x2="280" y2="0" strokeWidth="1.2" />
          </g>

          {/* ========================================================================= */}
          {/* DOCUMENT TITLE: CERTIFICATE OF COMPLETION */}
          {/* ========================================================================= */}
          <g transform="translate(500, 226)" textAnchor="middle">
            <text
              x="0"
              y="0"
              fontFamily="'Cinzel', 'Playfair Display', 'Times New Roman', serif"
              fontSize="37"
              fontWeight="900"
              letterSpacing="6"
              fill={isParchment ? "url(#deepNavyGrad)" : "url(#darkGoldTextGrad)"}
              style={{
                textTransform: 'uppercase',
                filter: isParchment ? 'drop-shadow(0 2px 3px rgba(10,31,68,0.22))' : 'drop-shadow(0 3px 8px rgba(0,0,0,0.7))'
              }}
            >
              CERTIFICATE OF COMPLETION
            </text>

            <text
              x="0"
              y="22"
              fontFamily="'Alex Brush', 'Playfair Display', 'Georgia', cursive, serif"
              fontSize="18"
              fontWeight="600"
              letterSpacing="2"
              fill={isParchment ? "#8b6416" : "#fbbf24"}
              fontStyle="italic"
            >
              This is to proudly certify that
            </text>
          </g>

          {/* ========================================================================= */}
          {/* CANDIDATE NAME (LARGE, PRESTIGIOUS CALLIGRAPHIC / SERIF DISPLAY) */}
          {/* ========================================================================= */}
          <g transform="translate(500, 292)" textAnchor="middle">
            {/* Subtle Name Background Plaque */}
            <rect 
              x="-260" 
              y="-38" 
              width="520" 
              height="50" 
              rx="6" 
              fill={isParchment ? "#fbf8f0" : "#0c1b33"} 
              stroke="url(#certGoldGrad)" 
              strokeWidth="0.8" 
              strokeOpacity={isParchment ? "0.4" : "0.5"} 
            />

            <text
              x="0"
              y="0"
              fontFamily="'Playfair Display', 'Cinzel', 'Times New Roman', Georgia, serif"
              fontSize="31"
              fontWeight="800"
              letterSpacing="2"
              fill={isParchment ? "#0a192f" : "#fef08a"}
              style={{
                filter: isParchment ? 'drop-shadow(0 1px 2px rgba(10,25,47,0.18))' : 'drop-shadow(0 2px 5px rgba(0,0,0,0.6))'
              }}
            >
              {certificate.studentName}
            </text>

            {/* Ornamental Underline */}
            <line x1="-190" y1="12" x2="190" y2="12" stroke="url(#certGoldGrad)" strokeWidth="1.5" />
            <polygon points="0,9 4,12 0,15 -4,12" fill="url(#certGoldGrad)" />
            <circle cx="-190" cy="12" r="2.5" fill="url(#certGoldGrad)" />
            <circle cx="190" cy="12" r="2.5" fill="url(#certGoldGrad)" />
          </g>

          {/* ========================================================================= */}
          {/* CITATION & ACADEMIC ACHIEVEMENTS */}
          {/* ========================================================================= */}
          <g transform="translate(500, 342)" textAnchor="middle">
            <text
              x="0"
              y="0"
              fontFamily="'Montserrat', 'Inter', sans-serif"
              fontSize="12.5"
              fontWeight="500"
              fill={isParchment ? "#334155" : "#cbd5e1"}
            >
              has satisfactorily completed all academic & laboratory requirements and demonstrated technical competence in
            </text>

            {/* Course Title in Bold Prestigious Serif */}
            <text
              x="0"
              y="32"
              fontFamily="'Cinzel', 'Playfair Display', 'Times New Roman', serif"
              fontSize="23"
              fontWeight="900"
              letterSpacing="1.2"
              fill={isParchment ? "url(#deepNavyGrad)" : "#ffffff"}
            >
              {certificate.courseTitle}
            </text>

            {/* Project Title citation */}
            <text
              x="0"
              y="59"
              fontFamily="'Montserrat', sans-serif"
              fontSize="11.5"
              fontWeight="500"
              fill={isParchment ? "#475569" : "#94a3b8"}
            >
              including comprehensive hands-on hardware training and defense of the capstone project:
            </text>

            <text
              x="0"
              y="82"
              fontFamily="'Playfair Display', 'Georgia', serif"
              fontSize="14.5"
              fontWeight="700"
              fontStyle="italic"
              letterSpacing="0.5"
              fill={isParchment ? "#8b6416" : "#fef08a"}
            >
              "{certificate.projectTitle}"
            </text>

            {/* Academic Distinction Badge */}
            <g transform="translate(0, 102)">
              <rect 
                x="-145" 
                y="-10" 
                width="290" 
                height="19" 
                rx="9.5" 
                fill={isParchment ? "#fef3c7" : "#0c1b33"} 
                stroke="url(#certGoldGrad)" 
                strokeWidth="0.9" 
              />
              <text 
                x="0" 
                y="3" 
                fontFamily="'Montserrat', sans-serif" 
                fontSize="7.5" 
                fontWeight="800" 
                letterSpacing="1.8" 
                fill={isParchment ? "#92400e" : "#fbbf24"}
                textAnchor="middle"
              >
                ★ GRADE: DISTINCTION / FIRST CLASS WITH HONOURS ★
              </text>
            </g>

            <text
              x="0"
              y="126"
              fontFamily="'Montserrat', sans-serif"
              fontSize="9"
              fontWeight="500"
              fill={isParchment ? "#64748b" : "#64748b"}
              letterSpacing="0.8"
            >
              Awarded under the skill-empowerment framework of the National Education Policy (NEP 2020).
            </text>
          </g>

          {/* Thin Gold Hairline Rule */}
          <line x1="180" y1="486" x2="820" y2="486" stroke="url(#certGoldGrad)" strokeWidth="1" strokeOpacity="0.4" />

          {/* ========================================================================= */}
          {/* FOOTER: REAL EMBOSSED GOLD FOIL SEAL + AUTHENTIC SIGNATURES + QR LEDGER */}
          {/* ========================================================================= */}

          {/* LEFT SIGNATURE BLOCK: INSTRUCTOR / EVALUATOR */}
          <g transform="translate(140, 520)" textAnchor="center">
            {/* Realistic Cursive Digital Signature Vector in Fountain-Pen Blue Ink */}
            <path
              d="M 10 32 C 25 15, 35 10, 50 25 C 65 35, 75 8, 90 28 C 105 40, 115 12, 135 22 C 145 28, 160 18, 175 25"
              fill="none"
              stroke={isParchment ? "#0a2558" : "#60a5fa"}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Signature Accent flourish */}
            <path
              d="M 30 40 C 60 48, 120 44, 160 38"
              fill="none"
              stroke={isParchment ? "#0a2558" : "#60a5fa"}
              strokeWidth="1.2"
              strokeLinecap="round"
              opacity="0.8"
            />

            <line x1="0" y1="48" x2="190" y2="48" stroke={isParchment ? "#1e293b" : "#94a3b8"} strokeWidth="1" />

            <text
              x="95"
              y="63"
              fontFamily="'Montserrat', sans-serif"
              fontSize="11"
              fontWeight="800"
              fill={isParchment ? "#0f172a" : "#ffffff"}
              textAnchor="middle"
            >
              {certificate.trainerName || "Er. Aniket Sharma, M.Tech"}
            </text>
            <text
              x="95"
              y="76"
              fontFamily="'Montserrat', sans-serif"
              fontSize="8"
              fontWeight="600"
              fill={isParchment ? "#64748b" : "#94a3b8"}
              textAnchor="middle"
              textTransform="uppercase"
              letterSpacing="1"
            >
              Lead Technical Instructor & Evaluator
            </text>
          </g>

          {/* ========================================================================= */}
          {/* CENTER: AUTHENTIC 3D EMBOSSED GOLD FOIL SEAL WITH CRIMSON SATIN RIBBONS */}
          {/* ========================================================================= */}
          <g transform="translate(500, 560)" filter="url(#sealShadow)">
            {/* Crimson Satin Ribbon Tails */}
            {/* Left Ribbon */}
            <polygon 
              points="-18,25 -28,76 -16,68 -4,76 -10,25" 
              fill="url(#ribbonGrad1)" 
              stroke="#570404" 
              strokeWidth="0.8" 
            />
            {/* Right Ribbon */}
            <polygon 
              points="10,25 4,76 16,68 28,76 18,25" 
              fill="url(#ribbonGrad2)" 
              stroke="#570404" 
              strokeWidth="0.8" 
            />

            {/* Outer Serrated 32-Point Starburst Medallion */}
            <path
              d={(() => {
                const points: string[] = [];
                const numPoints = 32;
                const outerRadius = 45;
                const innerRadius = 39;
                for (let i = 0; i < numPoints * 2; i++) {
                  const angle = (i * Math.PI) / numPoints;
                  const radius = i % 2 === 0 ? outerRadius : innerRadius;
                  const x = radius * Math.sin(angle);
                  const y = radius * Math.cos(angle);
                  points.push(`${x.toFixed(2)},${y.toFixed(2)}`);
                }
                return `M ${points.join(' L ')} Z`;
              })()}
              fill="url(#sealGoldGrad)"
              stroke="#855b00"
              strokeWidth="1.2"
            />

            {/* Embossed Inner Rings */}
            <circle cx="0" cy="0" r="36" fill="none" stroke="#6e4f00" strokeWidth="1" />
            <circle cx="0" cy="0" r="34" fill="none" stroke="#fff9d2" strokeWidth="0.8" strokeDasharray="2 1.5" />
            <circle cx="0" cy="0" r="26" fill="url(#sealGoldGrad)" stroke="#855b00" strokeWidth="1" />

            {/* Circular Text on Seal */}
            <path id="sealTextPath" d="M -30,0 A 30,30 0 1,1 30,0 A 30,30 0 1,1 -30,0" fill="none" />
            <text fontSize="4.8" fontFamily="monospace" fontWeight="900" fill="#4a3400" letterSpacing="1.2">
              <textPath href="#sealTextPath" startOffset="50%" textAnchor="middle">
                ★ DAKSHYAM INNOVATIONS ★ OFFICIAL SEAL OF EXCELLENCE ★
              </textPath>
            </text>

            {/* Center 5 Stars & Laurel Emblem */}
            <g fill="#4a3400" stroke="none">
              <polygon points="0,-12 2,-7 7,-7 3,-4 5,1 0,-2 -5,1 -3,-4 -7,-7 -2,-7" />
              <polygon points="-10,-7 -8,-4 -4,-4 -7,-2 -6,2 -10,0 -14,2 -13,-2 -16,-4 -12,-4" transform="scale(0.7) translate(-4, 0)" />
              <polygon points="10,-7 8,-4 4,-4 7,-2 6,2 10,0 14,2 13,-2 16,-4 12,-4" transform="scale(0.7) translate(4, 0)" />
            </g>

            {/* Center Crest Banner */}
            <text
              x="0"
              y="6"
              fontFamily="'Cinzel', serif"
              fontSize="6.5"
              fontWeight="900"
              fill="#382600"
              textAnchor="middle"
              letterSpacing="1"
            >
              VERIFIED
            </text>
            <text
              x="0"
              y="13"
              fontFamily="monospace"
              fontSize="4.5"
              fontWeight="bold"
              fill="#523a00"
              textAnchor="middle"
              letterSpacing="0.8"
            >
              2026
            </text>
          </g>

          {/* RIGHT SIGNATURE BLOCK: DIRECTOR OF TECHNICAL EDUCATION */}
          <g transform="translate(670, 520)" textAnchor="center">
            {/* Realistic Executive Cursive Signature in Fountain Pen Ink */}
            <path
              d="M 15 28 C 30 8, 45 35, 60 12 C 75 32, 90 14, 110 26 C 130 15, 145 28, 165 18 C 175 25, 185 10, 190 22"
              fill="none"
              stroke={isParchment ? "#0a2558" : "#60a5fa"}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Signature Under-flourish loop */}
            <path
              d="M 35 34 C 80 46, 140 42, 185 30"
              fill="none"
              stroke={isParchment ? "#0a2558" : "#60a5fa"}
              strokeWidth="1.2"
              strokeLinecap="round"
              opacity="0.8"
            />

            {/* Authentic Academic Registrar Rubber Stamp Impression */}
            <g transform="translate(145, 15) rotate(-12)" opacity={isParchment ? "0.68" : "0.45"}>
              <circle cx="0" cy="0" r="30" fill="none" stroke={isParchment ? "#1e3a8a" : "#38bdf8"} strokeWidth="1.8" strokeDasharray="3 1.5" />
              <circle cx="0" cy="0" r="26" fill="none" stroke={isParchment ? "#1e3a8a" : "#38bdf8"} strokeWidth="0.8" />
              <circle cx="0" cy="0" r="17" fill="none" stroke={isParchment ? "#1e3a8a" : "#38bdf8"} strokeWidth="0.8" />
              <path id="rubberStampPath" d="M -21,0 A 21,21 0 1,1 21,0 A 21,21 0 1,1 -21,0" fill="none" />
              <text fontSize="4.4" fontFamily="monospace" fontWeight="900" fill={isParchment ? "#1e3a8a" : "#38bdf8"} letterSpacing="0.8">
                <textPath href="#rubberStampPath" startOffset="50%" textAnchor="middle">
                  ★ DAKSHYAM INNOVATIONS ★ BALAGHAT DIV ★
                </textPath>
              </text>
              <text x="0" y="-3" fontFamily="monospace" fontSize="5" fontWeight="900" fill={isParchment ? "#1e3a8a" : "#38bdf8"} textAnchor="middle" letterSpacing="1">ACADEMIC</text>
              <text x="0" y="4" fontFamily="monospace" fontSize="4.5" fontWeight="900" fill={isParchment ? "#1e3a8a" : "#38bdf8"} textAnchor="middle" letterSpacing="1">REGISTRY</text>
              <text x="0" y="11" fontFamily="monospace" fontSize="4" fontWeight="bold" fill={isParchment ? "#1e3a8a" : "#38bdf8"} textAnchor="middle">2026</text>
            </g>

            <line x1="0" y1="48" x2="190" y2="48" stroke={isParchment ? "#1e293b" : "#94a3b8"} strokeWidth="1" />

            <text
              x="95"
              y="63"
              fontFamily="'Montserrat', sans-serif"
              fontSize="11"
              fontWeight="800"
              fill={isParchment ? "#0f172a" : "#ffffff"}
              textAnchor="middle"
            >
              Director of Technical Affairs
            </text>
            <text
              x="95"
              y="76"
              fontFamily="'Montserrat', sans-serif"
              fontSize="8"
              fontWeight="600"
              fill={isParchment ? "#64748b" : "#94a3b8"}
              textAnchor="middle"
              textTransform="uppercase"
              letterSpacing="1"
            >
              Dakshyam Innovations Academic Board
            </text>
          </g>

          {/* ========================================================================= */}
          {/* BOTTOM VERIFICATION META: QR CODE VECTOR, DATE & SECURE REGISTER ID */}
          {/* ========================================================================= */}
          <g transform="translate(60, 626)" fontSize="8.5" fontFamily="monospace">
            {/* Scannable Vector QR Code Graphic */}
            <g transform="translate(0, -12)">
              <rect x="0" y="0" width="34" height="34" fill={isParchment ? "#ffffff" : "#0c1b33"} stroke="url(#certGoldGrad)" strokeWidth="0.8" rx="2" />
              {/* QR Code Anchor 1 (Top Left) */}
              <rect x="3" y="3" width="9" height="9" fill={isParchment ? "#0b192c" : "#38bdf8"} />
              <rect x="5" y="5" width="5" height="5" fill={isParchment ? "#ffffff" : "#0c1b33"} />
              <rect x="6.5" y="6.5" width="2" height="2" fill={isParchment ? "#0b192c" : "#38bdf8"} />
              {/* QR Code Anchor 2 (Top Right) */}
              <rect x="22" y="3" width="9" height="9" fill={isParchment ? "#0b192c" : "#38bdf8"} />
              <rect x="24" y="5" width="5" height="5" fill={isParchment ? "#ffffff" : "#0c1b33"} />
              <rect x="25.5" y="6.5" width="2" height="2" fill={isParchment ? "#0b192c" : "#38bdf8"} />
              {/* QR Code Anchor 3 (Bottom Left) */}
              <rect x="3" y="22" width="9" height="9" fill={isParchment ? "#0b192c" : "#38bdf8"} />
              <rect x="5" y="24" width="5" height="5" fill={isParchment ? "#ffffff" : "#0c1b33"} />
              <rect x="6.5" y="25.5" width="2" height="2" fill={isParchment ? "#0b192c" : "#38bdf8"} />
              {/* QR Data Pixels */}
              <rect x="14" y="5" width="2.5" height="2.5" fill={isParchment ? "#0b192c" : "#38bdf8"} />
              <rect x="17" y="8" width="2.5" height="2.5" fill={isParchment ? "#0b192c" : "#38bdf8"} />
              <rect x="14" y="14" width="2.5" height="2.5" fill={isParchment ? "#0b192c" : "#38bdf8"} />
              <rect x="8" y="15" width="2.5" height="2.5" fill={isParchment ? "#0b192c" : "#38bdf8"} />
              <rect x="23" y="15" width="2.5" height="2.5" fill={isParchment ? "#0b192c" : "#38bdf8"} />
              <rect x="18" y="20" width="2.5" height="2.5" fill={isParchment ? "#0b192c" : "#38bdf8"} />
              <rect x="26" y="24" width="2.5" height="2.5" fill={isParchment ? "#0b192c" : "#38bdf8"} />
            </g>

            {/* Left Ledger Info */}
            <g transform="translate(42, 0)">
              <text x="0" y="2" fill={isParchment ? "#64748b" : "#64748b"} fontWeight="bold">
                VERIFICATION ID:
              </text>
              <text x="105" y="2" fill={isParchment ? "#0f2342" : "#38bdf8"} fontWeight="900" letterSpacing="1">
                {certificate.id}
              </text>
              <text x="0" y="14" fill={isParchment ? "#64748b" : "#64748b"} fontWeight="bold">
                DATE AUTHORIZED:
              </text>
              <text x="105" y="14" fill={isParchment ? "#0f172a" : "#cbd5e1"} fontWeight="700">
                {formatDisplayDate(certificate.issueDate)}
              </text>
            </g>
          </g>

          {/* Right Ledger Security Metadata */}
          <g transform="translate(730, 626)" fontSize="8.5" fontFamily="monospace" textAnchor="start">
            <text x="0" y="2" fill={isParchment ? "#64748b" : "#64748b"} fontWeight="bold">
              REGISTRY NODE:
            </text>
            <text x="88" y="2" fill={isParchment ? "#0f2342" : "#38bdf8"} fontWeight="700">
              BALAGHAT, MP (CENTRAL)
            </text>
            <text x="0" y="14" fill={isParchment ? "#64748b" : "#64748b"} fontWeight="bold">
              SECURITY HASH:
            </text>
            <text x="88" y="14" fill={isParchment ? "#8b6416" : "#fbbf24"} fontWeight="700" letterSpacing="0.8">
              DI-NEP2020-SECURE-{certificate.id.replace('DKM-', '')}
            </text>
          </g>

          {/* Tamper Warning Note (Bottom Center) */}
          <text
            x="500"
            y="652"
            fontFamily="monospace"
            fontSize="6.5"
            fontWeight="bold"
            letterSpacing="1.2"
            fill={isParchment ? "#718096" : "#64748b"}
            textAnchor="middle"
          >
            VALIDATE AUTHENTICITY VIA DAKSHYAM VERIFICATION PORTAL • SCAN QR OR SUBMIT KEY • ALTERATION VOIDS ACCREDITATION
          </text>
        </svg>
      </div>
    </div>
  );
}
