import React from 'react';
import { CompanyAbout } from '../types';
import { 
  Building2, Compass, Eye, MapPin, 
  Github, Linkedin, Twitter, Youtube, ExternalLink,
  Atom, Cpu, Wrench, Percent, Code2, Globe, Smartphone, Laptop, Sparkles, CheckCircle2
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
  const badgeClass = isLight ? 'border-blue-900/15 bg-blue-50 text-blue-950 font-bold' : 'border-blue-700/40 bg-blue-950/40 text-sky-300';
  const cardBg = isLight ? 'bg-white border-blue-900/10 hover:border-blue-900/25 hover:shadow-md' : 'bg-[#0d1f38]/60 border-blue-800/30 hover:border-blue-500/30';

  const servicesList = aboutState.services && aboutState.services.length > 0 
    ? aboutState.services 
    : [];

  const getServiceIcon = (category: string) => {
    switch (category) {
      case 'PROGRAMMING':
        return <Code2 className="w-5 h-5" />;
      case 'WEB DEVELOPMENT':
        return <Globe className="w-5 h-5" />;
      case 'APP DEVELOPMENT':
        return <Smartphone className="w-5 h-5" />;
      case 'IOT & ROBOTICS':
      case 'ROBOTICS':
        return <Cpu className="w-5 h-5" />;
      case 'INTEGRATED TECH':
        return <Cpu className="w-5 h-5" />;
      case 'COMPUTER TRAINING':
        return <Laptop className="w-5 h-5" />;
      default:
        return <Sparkles className="w-5 h-5" />;
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-12 select-text text-left font-sans">
      
      {/* Banner / Title Header Section */}
      <div className={`p-8 rounded-3xl border relative overflow-hidden transition-all duration-300 ${
        isLight ? 'border-blue-900/15 bg-blue-50/40 shadow-xs' : 'border-blue-800/30 bg-[#0a192f]/90 shadow-2xl'
      }`}>
        <div className="max-w-3xl space-y-3.5 relative z-10">
          <div className="flex flex-wrap items-center gap-2">
            <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[9px] font-mono font-black uppercase tracking-widest ${badgeClass}`}>
              <Building2 className="w-3.5 h-3.5" /> Corporate Profile
            </div>
            <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[9px] font-mono font-black uppercase tracking-widest ${
              isLight ? 'bg-amber-500/10 border-amber-600/30 text-amber-900 font-extrabold' : 'bg-amber-400/10 border-amber-400/30 text-amber-300'
            }`}>
              <Sparkles className="w-3 h-3 text-current" /> {aboutState.tagline || 'Learn • Build • Innovate'}
            </div>
          </div>

          <h1 className={`text-2xl sm:text-3xl font-black tracking-wide uppercase ${textTitle}`}>
            {aboutState.companyName}
          </h1>

          <p className={`text-xs sm:text-sm leading-relaxed font-sans font-medium ${isLight ? 'text-slate-750' : 'text-slate-300'}`}>
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
          <div className={`p-2.5 rounded-xl border w-fit ${isLight ? 'bg-blue-900/10 text-blue-950 border-blue-900/15' : 'bg-blue-950/60 border-blue-700/40 text-sky-400'}`}>
            <Compass className="w-5 h-5 animate-pulse" />
          </div>
          <h3 className={`text-xs font-bold uppercase tracking-wider ${textTitle}`}>Our Mission</h3>
          <p className={`text-3xs leading-relaxed font-sans ${textMuted}`}>
            {aboutState.mission}
          </p>
        </div>

        {/* Vision Card */}
        <div className={`p-6 rounded-2xl border transition-all space-y-3.5 ${cardBg}`}>
          <div className={`p-2.5 rounded-xl border w-fit ${isLight ? 'bg-blue-900/10 text-blue-950 border-blue-900/15' : 'bg-blue-950/60 border-blue-700/40 text-sky-400'}`}>
            <Eye className="w-5 h-5" />
          </div>
          <h3 className={`text-xs font-bold uppercase tracking-wider ${textTitle}`}>Our Vision</h3>
          <p className={`text-3xs leading-relaxed font-sans ${textMuted}`}>
            {aboutState.vision}
          </p>
        </div>

        {/* Office Location Card */}
        <div className={`p-6 rounded-2xl border transition-all space-y-3.5 ${cardBg}`}>
          <div className={`p-2.5 rounded-xl border w-fit ${isLight ? 'bg-blue-900/10 text-blue-950 border-blue-900/15' : 'bg-blue-950/60 border-blue-700/40 text-sky-400'}`}>
            <MapPin className="w-5 h-5 text-rose-400" />
          </div>
          <h3 className={`text-xs font-bold uppercase tracking-wider ${textTitle}`}>Headquarters & Hub</h3>
          <p className={`text-3xs leading-relaxed font-sans ${textMuted}`}>
            {aboutState.officeLocation}
          </p>
          <div className={`pt-1.5 border-t flex items-center justify-between text-2xs font-mono ${
            isLight ? 'border-slate-200 text-slate-500' : 'border-blue-900/20 text-slate-400'
          }`}>
            <span>Waraseoni, Balaghat</span>
            <span className={isLight ? 'text-blue-950 font-bold' : 'text-sky-400'}>PIN: 481331</span>
          </div>
        </div>

      </div>

      {/* COMPREHENSIVE VOCATIONAL & TECHNICAL SERVICES SECTION */}
      <div className="space-y-6">
        <div className={`border-l-2 pl-4 ${isLight ? 'border-blue-900' : 'border-sky-400'}`}>
          <span className={`text-[10px] font-mono tracking-widest uppercase font-bold ${
            isLight ? 'text-blue-950' : 'text-sky-400'
          }`}>Specialized Tracks</span>
          <h2 className={`text-base md:text-lg font-black tracking-wide uppercase ${textTitle}`}>Our Technical & Vocational Services</h2>
          <p className={`text-xs font-sans ${textMuted}`}>
            Industry-oriented skill development spanning foundational programming, full-stack web and mobile engineering, AI, and physical IoT hardware.
          </p>
        </div>

        {/* Dynamic Services Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-sans">
          {servicesList.map((srv) => (
            <div 
              key={srv.id}
              className={`p-6 rounded-2xl border flex flex-col justify-between space-y-4 transition-all duration-300 relative group overflow-hidden ${cardBg}`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div className={`p-2.5 rounded-xl border w-fit ${
                    isLight ? 'bg-blue-900/10 text-blue-950 border-blue-900/15' : 'bg-blue-950/60 border-blue-700/40 text-sky-400'
                  }`}>
                    {getServiceIcon(srv.category)}
                  </div>
                  {srv.badge && (
                    <span className={`text-[9px] font-mono font-black uppercase tracking-wider px-2 py-0.5 rounded border ${badgeClass}`}>
                      {srv.badge}
                    </span>
                  )}
                </div>

                <div>
                  <span className={`text-[9px] font-mono font-bold tracking-widest uppercase block ${
                    isLight ? 'text-blue-900' : 'text-sky-400'
                  }`}>
                    {srv.category}
                  </span>
                  <h3 className={`text-sm font-black uppercase tracking-wide mt-0.5 ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>
                    {srv.title}
                  </h3>
                </div>

                <p className={`text-3xs leading-relaxed font-sans ${textMuted}`}>
                  {srv.description}
                </p>

                {srv.technologies && srv.technologies.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {srv.technologies.map((tech, tIdx) => (
                      <span 
                        key={tIdx}
                        className={`text-[9px] font-mono font-semibold px-2 py-0.5 rounded-md border ${
                          isLight 
                            ? 'bg-slate-100 text-slate-800 border-slate-200' 
                            : 'bg-black/40 text-slate-300 border-slate-700/40'
                        }`}
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className={`pt-2 border-t flex items-center justify-between text-4xs font-mono uppercase tracking-widest ${
                isLight ? 'border-slate-200 text-slate-500' : 'border-blue-900/20 text-slate-500'
              }`}>
                <span>NEP 2020 Aligned</span>
                <span className={`font-bold flex items-center gap-1 ${isLight ? 'text-emerald-700' : 'text-emerald-400'}`}>
                  <CheckCircle2 className="w-3 h-3 text-current" /> Practical Learning
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* STEM Education Framework Section */}
      <div className="space-y-6">
        <div className={`border-l-2 pl-4 ${isLight ? 'border-blue-900' : 'border-sky-400'}`}>
          <span className={`text-[10px] font-mono tracking-widest uppercase font-bold ${
            isLight ? 'text-blue-950' : 'text-sky-400'
          }`}>Experiential Pedagogy</span>
          <h2 className={`text-base md:text-lg font-black tracking-wide uppercase ${textTitle}`}>Our STEM Education Framework</h2>
          <p className={`text-xs font-sans font-medium ${textMuted}`}>
            We bridge Science, Technology, Engineering, and Mathematics through immersive, hands-on physical-digital modules. Students learn to calibrate real sensors, write production code, and debug mechanical systems.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 font-sans">
          
          {/* Science Card */}
          <div className={`p-5 rounded-2xl border transition-all duration-300 relative overflow-hidden flex gap-4 ${cardBg}`}>
            <div className={`p-3 rounded-xl border h-fit shrink-0 ${isLight ? 'bg-blue-900/10 text-blue-950 border-blue-900/15' : 'bg-blue-950/60 border-blue-700/40 text-sky-400'}`}>
              <Atom className="w-5 h-5 animate-pulse" />
            </div>
            <div className="space-y-2">
              <h4 className={`text-xs font-black uppercase tracking-wide ${isLight ? 'text-slate-800' : 'text-slate-100'}`}>Science (Experiential)</h4>
              <p className={`text-3xs leading-relaxed font-sans font-medium ${textMuted}`}>
                Hands-on validation of environmental physics. Students configure analog soil hygrometers, calibrate photo-resistors, and measure thermodynamic behavior on live microcontrollers.
              </p>
              <div className={`text-[8px] font-mono uppercase tracking-widest pt-1 ${isLight ? 'text-blue-950 font-bold' : 'text-sky-300'}`}>
                🔬 Live Telemetry & Calibration
              </div>
            </div>
          </div>

          {/* Technology Card */}
          <div className={`p-5 rounded-2xl border transition-all duration-300 relative overflow-hidden flex gap-4 ${cardBg}`}>
            <div className={`p-3 rounded-xl border h-fit shrink-0 ${isLight ? 'bg-blue-900/10 text-blue-950 border-blue-900/15' : 'bg-blue-950/60 border-blue-700/40 text-sky-400'}`}>
              <Cpu className="w-5 h-5" />
            </div>
            <div className="space-y-2">
              <h4 className={`text-xs font-black uppercase tracking-wide ${isLight ? 'text-slate-800' : 'text-slate-100'}`}>Technology (Full-Stack Coding)</h4>
              <p className={`text-3xs leading-relaxed font-sans font-medium ${textMuted}`}>
                Learning production software development. Programming ESP32 firmware in Embedded C, designing secure Django API controllers, and rendering high-speed real-time React web dashboards.
              </p>
              <div className={`text-[8px] font-mono uppercase tracking-widest pt-1 ${isLight ? 'text-blue-950 font-bold' : 'text-sky-300'}`}>
                💻 Embedded C, React, & Django
              </div>
            </div>
          </div>

          {/* Engineering Card */}
          <div className={`p-5 rounded-2xl border transition-all duration-300 relative overflow-hidden flex gap-4 ${cardBg}`}>
            <div className={`p-3 rounded-xl border h-fit shrink-0 ${isLight ? 'bg-blue-900/10 text-blue-950 border-blue-900/15' : 'bg-blue-950/60 border-blue-700/40 text-sky-400'}`}>
              <Wrench className="w-5 h-5" />
            </div>
            <div className="space-y-2">
              <h4 className={`text-xs font-black uppercase tracking-wide ${isLight ? 'text-slate-800' : 'text-slate-100'}`}>Engineering (Kinematics & Microcontrollers)</h4>
              <p className={`text-3xs leading-relaxed font-sans font-medium ${textMuted}`}>
                Circuit diagnostics and robotic kinematics. Assembling dual H-bridge motor drivers, configuring PWM speed controls, and calculating gear torque for line-follower rovers.
              </p>
              <div className={`text-[8px] font-mono uppercase tracking-widest pt-1 ${isLight ? 'text-blue-950 font-bold' : 'text-sky-300'}`}>
                ⚙️ Motor Kinetics & PWM Tuning
              </div>
            </div>
          </div>

          {/* Mathematics Card */}
          <div className={`p-5 rounded-2xl border transition-all duration-300 relative overflow-hidden flex gap-4 ${cardBg}`}>
            <div className={`p-3 rounded-xl border h-fit shrink-0 ${isLight ? 'bg-blue-900/10 text-blue-950 border-blue-900/15' : 'bg-blue-950/60 border-blue-700/40 text-sky-400'}`}>
              <Percent className="w-5 h-5" />
            </div>
            <div className="space-y-2">
              <h4 className={`text-xs font-black uppercase tracking-wide ${isLight ? 'text-slate-800' : 'text-slate-100'}`}>Mathematics (Algorithmic Logic)</h4>
              <p className={`text-3xs leading-relaxed font-sans font-medium ${textMuted}`}>
                Practical mathematics applied to computing. Implementing PID balance loops, calculating distance via sonic wave time-of-flight equations, and plotting trigonometric motion curves.
              </p>
              <div className={`text-[8px] font-mono uppercase tracking-widest pt-1 ${isLight ? 'text-blue-950 font-bold' : 'text-sky-300'}`}>
                📐 Time-of-Flight & PID Control
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Social Media Link Connect Section */}
      <div className={`p-6 rounded-2xl border text-center space-y-4 ${
        isLight ? 'bg-blue-50/40 border-blue-900/10' : 'bg-[#0a192f]/60 border-blue-800/30'
      }`}>
        <h4 className={`text-2xs font-mono font-extrabold uppercase tracking-widest ${textTitle}`}>
          Join the Dakshyam Network
        </h4>
        <div className="flex flex-wrap items-center justify-center gap-4">
          
          <a
            href={aboutState.socialGithub}
            target="_blank"
            rel="noopener noreferrer"
            className={`flex items-center gap-1.5 font-mono text-2xs uppercase tracking-wider border px-3.5 py-2 rounded-xl transition-all active:scale-95 cursor-pointer ${
              isLight 
                ? 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700 hover:border-slate-400 shadow-3xs' 
                : 'bg-black/60 border-slate-750 hover:bg-slate-900 text-slate-305'
            }`}
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
            className={`flex items-center gap-1.5 font-mono text-2xs uppercase tracking-wider border px-3.5 py-2 rounded-xl transition-all active:scale-95 cursor-pointer ${
              isLight 
                ? 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700 hover:border-slate-400 shadow-3xs' 
                : 'bg-black/60 border-slate-755 hover:bg-slate-900 text-slate-350'
            }`}
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
