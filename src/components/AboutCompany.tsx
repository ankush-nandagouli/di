import React, { useState } from 'react';
import { motion } from 'motion/react';
import { CompanyAbout, CompanyFounder } from '../types';
import { DakshyamDatabase } from '../utils/db';
import { 
  Building2, Users, Compass, Eye, MapPin, 
  Github, Linkedin, Twitter, Youtube, Award, ExternalLink,
  Atom, Cpu, Wrench, Percent
} from 'lucide-react';

interface AboutCompanyProps {
  aboutState: CompanyAbout;
  theme?: 'dark' | 'light';
}

export default function AboutCompany({ aboutState, theme = 'dark' }: AboutCompanyProps) {
  const isLight = theme === 'light';

  // Aesthetic color maps
  const textTitle = isLight ? 'text-slate-900' : 'text-white';
  const textMuted = isLight ? 'text-slate-600 font-medium' : 'text-slate-400';
  const badgeClass = isLight ? 'border-amber-500/15 bg-amber-50 text-amber-700' : 'border-cyan-500/15 bg-cyan-950/20 text-cyan-400';
  const cardBg = isLight ? 'bg-white border-amber-500/15 hover:border-amber-500/25 hover:shadow-md' : 'bg-black/60 border-cyan-500/10 hover:border-cyan-500/20';

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-12 select-text text-left font-sans">
      
      {/* Banner / Title Header Section */}
      <div className={`p-8 rounded-3xl border relative overflow-hidden transition-all duration-300 ${
        isLight ? 'border-amber-500/20 bg-amber-500/5 shadow-md' : 'border-cyan-500/15 bg-[#050505]/75 shadow-2xl'
      }`}>
        <div className="max-w-2xl space-y-3 relative z-10">
          <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[9px] font-mono font-black uppercase tracking-widest ${badgeClass}`}>
            <Building2 className="w-3.5 h-3.5" /> Corporate Profile
          </div>
          <h1 className={`text-2xl sm:text-3xl font-black tracking-wide uppercase ${textTitle}`}>
            {aboutState.companyName}
          </h1>
          <p className="text-xs sm:text-sm text-slate-350 leading-relaxed font-sans font-medium">
            {aboutState.description}
          </p>
        </div>

        {/* Scanlines matrix layer */}
        <div className="absolute inset-0 bg-scanlines opacity-[0.025] pointer-events-none" />
      </div>

      {/* Corporate Pillars: Mission, Vision, Headquarters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Mission Card */}
        <div className={`p-6 rounded-2xl border transition-all space-y-3.5 ${cardBg}`}>
          <div className={`p-2.5 rounded-xl border w-fit ${isLight ? 'bg-amber-600/10 text-amber-750' : 'bg-cyan-950/30 border-cyan-500/10 text-cyan-400'}`}>
            <Compass className="w-5 h-5 animate-pulse" />
          </div>
          <h3 className={`text-xs font-bold uppercase tracking-wider ${textTitle}`}>Our Eternal Mission</h3>
          <p className="text-3xs leading-relaxed text-slate-350 font-sans">
            {aboutState.mission}
          </p>
        </div>

        {/* Vision Card */}
        <div className={`p-6 rounded-2xl border transition-all space-y-3.5 ${cardBg}`}>
          <div className={`p-2.5 rounded-xl border w-fit ${isLight ? 'bg-amber-600/10 text-amber-750' : 'bg-cyan-950/30 border-cyan-500/10 text-cyan-400'}`}>
            <Eye className="w-5 h-5" />
          </div>
          <h3 className={`text-xs font-bold uppercase tracking-wider ${textTitle}`}>Our Long-term Vision</h3>
          <p className="text-3xs leading-relaxed text-slate-350 font-sans">
            {aboutState.vision}
          </p>
        </div>

        {/* Office Location Card */}
        <div className={`p-6 rounded-2xl border transition-all space-y-3.5 ${cardBg}`}>
          <div className={`p-2.5 rounded-xl border w-fit ${isLight ? 'bg-amber-600/10 text-amber-750' : 'bg-cyan-950/30 border-cyan-500/10 text-cyan-400'}`}>
            <MapPin className="w-5 h-5 text-rose-400" />
          </div>
          <h3 className={`text-xs font-bold uppercase tracking-wider ${textTitle}`}>Global Headquarters</h3>
          <p className="text-3xs leading-relaxed text-slate-350 font-sans">
            {aboutState.officeLocation}
          </p>
          <div className="pt-1.5 border-t border-cyan-500/5 flex items-center justify-between text-2xs text-slate-400 font-mono">
            <span>Waraseoni, Balaghat District</span>
            <span className="text-cyan-400">MP, India</span>
          </div>
        </div>

      </div>

      {/* STEM Education Framework Section */}
      <div className="space-y-6">
        <div className={`border-l-2 pl-4 ${isLight ? 'border-amber-600' : 'border-cyan-400'}`}>
          <span className={`text-[10px] font-mono tracking-widest uppercase font-bold text-cyan-400`}>NEP 2020 Aligned</span>
          <h2 className={`text-base md:text-lg font-black tracking-wide uppercase ${textTitle}`}>Our STEM Education Framework</h2>
          <p className="text-xs text-slate-400 font-sans font-medium">
            We bridge Science, Technology, Engineering, and Mathematics through immersive, hands-on physical-digital modules. Students learn to calibrate real sensors, write production code, and debug mechanical systems.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 font-sans">
          
          {/* Science Card */}
          <div className={`p-5 rounded-2xl border transition-all duration-300 relative overflow-hidden flex gap-4 ${cardBg}`}>
            <div className={`p-3 rounded-xl border h-fit shrink-0 ${isLight ? 'bg-amber-600/10 text-amber-700' : 'bg-cyan-950/40 border-cyan-500/15 text-[#22d3ee]'}`}>
              <Atom className="w-5 h-5 animate-pulse" />
            </div>
            <div className="space-y-2">
              <h4 className={`text-xs font-black uppercase tracking-wide ${isLight ? 'text-slate-800' : 'text-slate-100'}`}>Science (Experiential)</h4>
              <p className="text-3xs text-slate-400 leading-relaxed font-sans font-medium">
                Hands-on validation of environmental physics. Students configure analog soil hygrometers, calibrate photo-resistors, and measure thermodynamic behavior on live microcontrollers.
              </p>
              <div className="text-[8px] font-mono text-cyan-400 uppercase tracking-widest pt-1">
                🔬 Live Telemetry & Calibration
              </div>
            </div>
          </div>

          {/* Technology Card */}
          <div className={`p-5 rounded-2xl border transition-all duration-300 relative overflow-hidden flex gap-4 ${cardBg}`}>
            <div className={`p-3 rounded-xl border h-fit shrink-0 ${isLight ? 'bg-amber-600/10 text-amber-700' : 'bg-cyan-950/40 border-cyan-500/15 text-[#22d3ee]'}`}>
              <Cpu className="w-5 h-5" />
            </div>
            <div className="space-y-2">
              <h4 className={`text-xs font-black uppercase tracking-wide ${isLight ? 'text-slate-800' : 'text-slate-100'}`}>Technology (Full-Stack Coding)</h4>
              <p className="text-3xs text-slate-400 leading-relaxed font-sans font-medium">
                Learning production software development. Programming ESP32 firmware in Embedded C, designing secure Django API controllers, and rendering high-speed real-time React web dashboards.
              </p>
              <div className="text-[8px] font-mono text-cyan-400 uppercase tracking-widest pt-1">
                💻 Embedded C, React, & Django
              </div>
            </div>
          </div>

          {/* Engineering Card */}
          <div className={`p-5 rounded-2xl border transition-all duration-300 relative overflow-hidden flex gap-4 ${cardBg}`}>
            <div className={`p-3 rounded-xl border h-fit shrink-0 ${isLight ? 'bg-amber-600/10 text-amber-700' : 'bg-cyan-950/40 border-cyan-500/15 text-[#22d3ee]'}`}>
              <Wrench className="w-5 h-5" />
            </div>
            <div className="space-y-2">
              <h4 className={`text-xs font-black uppercase tracking-wide ${isLight ? 'text-slate-800' : 'text-slate-100'}`}>Engineering (Robotics)</h4>
              <p className="text-3xs text-slate-400 leading-relaxed font-sans font-medium">
                Constructing autonomous mechanisms. Calibrating H-bridge dual-motor drivers, designing mechanical chassis structures, and tuning high-speed servo actuators over Bluetooth links.
              </p>
              <div className="text-[8px] font-mono text-cyan-400 uppercase tracking-widest pt-1">
                ⚙️ Kinematics & Circuit Assembly
              </div>
            </div>
          </div>

          {/* Mathematics Card */}
          <div className={`p-5 rounded-2xl border transition-all duration-300 relative overflow-hidden flex gap-4 ${cardBg}`}>
            <div className={`p-3 rounded-xl border h-fit shrink-0 ${isLight ? 'bg-amber-600/10 text-amber-700' : 'bg-cyan-950/40 border-cyan-500/15 text-[#22d3ee]'}`}>
              <Percent className="w-5 h-5" />
            </div>
            <div className="space-y-2">
              <h4 className={`text-xs font-black uppercase tracking-wide ${isLight ? 'text-slate-800' : 'text-slate-100'}`}>Mathematics (Algorithms)</h4>
              <p className="text-3xs text-slate-400 leading-relaxed font-sans font-medium">
                Applying math to code logic. Resolving obstacle avoidance avoidance vectors, calculating moving sensor value averages, evaluating solar conversion efficiency coefficients, and scaling telemetry ranges.
              </p>
              <div className="text-[8px] font-mono text-cyan-400 uppercase tracking-widest pt-1">
                📐 Algorithmic Pathfinding & Scaling
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Co-Founders Team Dashboard Section */}
      <div className="space-y-6">
        <div className={`border-l-2 pl-4 ${isLight ? 'border-amber-600' : 'border-cyan-400'}`}>
          <span className={`text-[10px] font-mono tracking-widest uppercase font-bold text-cyan-400`}>Directorship & Team</span>
          <h2 className={`text-base md:text-lg font-black tracking-wide uppercase ${textTitle}`}>Our Founders & Co-Founders</h2>
          <p className="text-xs text-slate-400 font-sans">
            Dakshyam Innovations is led by a collaborative team of hardware architects and full-stack software engineers dedicated to high-fidelity physical training models.
          </p>
        </div>

        {/* Founders Cards Rows Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 font-sans">
          {aboutState.founders.map((founder, idx) => (
            <div 
              key={idx}
              className={`p-5 rounded-2xl border flex flex-col justify-between space-y-4 transition-all duration-300 relative group overflow-hidden ${cardBg}`}
            >
              <div className="space-y-3">
                {/* Avatar Initial Slot */}
                <div className="flex items-center gap-3.5">
                  <div className={`w-11 h-11 rounded-full border flex items-center justify-center font-mono text-sm font-black tracking-wider shadow-lg ${
                    isLight 
                      ? 'bg-gradient-to-br from-amber-500 to-amber-600 text-white border-amber-500/20 shadow-amber-600/10' 
                      : 'bg-gradient-to-br from-cyan-950/60 to-black/80 text-cyan-400 border-cyan-500/25 shadow-cyan-950/30'
                  }`}>
                    {founder.avatarText || founder.name.split(' ').map(l => l[0]).join('')}
                  </div>
                  <div className="space-y-0.5">
                    <h4 className={`text-xs font-black uppercase text-white tracking-wide ${isLight ? 'text-slate-800' : 'text-slate-100'}`}>
                      {founder.name}
                    </h4>
                    <span className="bg-cyan-500/5 text-cyan-400 font-mono text-[9px] font-bold uppercase tracking-wider block">
                      {founder.role}
                    </span>
                  </div>
                </div>

                {/* Bio text block */}
                <p className="text-3xs text-slate-350 leading-relaxed font-sans p-0.5 min-h-[50px]">
                  {founder.bio}
                </p>
              </div>

              {/* Decorative base layout */}
              <div className="pt-2 border-t border-cyan-500/5 flex items-center justify-between text-4xs font-mono text-slate-500 uppercase tracking-widest">
                <span>Executive Council</span>
                <span className="text-emerald-400">✓ Active Seat</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Social Media Link Connect Section */}
      <div className={`p-6 rounded-2xl border text-center space-y-4 ${
        isLight ? 'bg-amber-500/5 border-amber-505/10' : 'bg-black/40 border-cyan-500/5'
      }`}>
        <h4 className={`text-2xs font-mono font-extrabold uppercase tracking-widest ${textTitle}`}>
          Join the Dakshyam Network
        </h4>
        <div className="flex flex-wrap items-center justify-center gap-4">
          
          <a
            href={aboutState.socialGithub}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 font-mono text-2xs uppercase tracking-wider bg-black/60 border border-slate-750 hover:bg-slate-900 px-3.5 py-2 rounded-xl text-slate-305 transition-all active:scale-95 cursor-pointer"
          >
            <Github className="w-3.5 h-3.5" />
            <span>GitHub</span>
            <ExternalLink className="w-3 h-3 text-slate-500" />
          </a>

          <a
            href={aboutState.socialLinkedin}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 font-mono text-2xs uppercase tracking-wider bg-[#0a66c2]/10 border border-[#0a66c2]/20 hover:bg-[#0a66c2] hover:text-white px-3.5 py-2 rounded-xl text-[#0a66c2] transition-all active:scale-95 cursor-pointer"
          >
            <Linkedin className="w-3.5 h-3.5" />
            <span>LinkedIn</span>
            <ExternalLink className="w-3 h-3 text-current" />
          </a>

          <a
            href={aboutState.socialTwitter}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 font-mono text-2xs uppercase tracking-wider bg-black/60 border border-slate-755 hover:bg-slate-900 px-3.5 py-2 rounded-xl text-slate-350 transition-all active:scale-95 cursor-pointer"
          >
            <Twitter className="w-4 h-4" />
            <span>Twitter</span>
            <ExternalLink className="w-3 h-3 text-slate-500" />
          </a>

          <a
            href={aboutState.socialYoutube}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 font-mono text-2xs uppercase tracking-wider bg-rose-550/10 border border-rose-500/20 hover:bg-rose-500 hover:text-white px-3.5 py-2 rounded-xl text-rose-500 transition-all active:scale-95 cursor-pointer"
          >
            <Youtube className="w-3.5 h-3.5" />
            <span>YouTube</span>
            <ExternalLink className="w-3 h-3 text-current" />
          </a>

        </div>
      </div>

    </div>
  );
}
