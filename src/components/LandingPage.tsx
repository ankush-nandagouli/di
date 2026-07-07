import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowRight, BookOpen, Smartphone, ShieldCheck, 
  Star, ChevronLeft, ChevronRight, School, Sparkles, LayoutGrid, Image as ImageIcon 
} from 'lucide-react';
import DakshyamLogo from './DakshyamLogo';
import { Course, PromoBanner, GalleryImage } from '../types';
import { DakshyamDatabase } from '../utils/db';
import { BeautifulErrorDisplay } from '../utils/errorShield';

interface LandingPageProps {
  courses: Course[];
  banners: PromoBanner[];
  galleryImages: GalleryImage[];
  onEnterPortal: () => void;
  onSelectCourse: (courseId: string) => void;
  theme?: 'light' | 'dark';
}

export default function LandingPage({ 
  courses, 
  banners, 
  galleryImages, 
  onEnterPortal, 
  onSelectCourse,
  theme = 'dark'
}: LandingPageProps) {
  
  // Theme state maps
  const isLight = theme === 'light';
  const textGold = isLight ? 'text-amber-600' : 'text-cyan-400';
  const textTitle = isLight ? 'text-slate-900' : 'text-white';
  const textMuted = isLight ? 'text-slate-600 font-medium' : 'text-slate-400';
  const textMutedLight = isLight ? 'text-slate-500' : 'text-slate-450';
  const borderLight = isLight ? 'border-amber-500/20' : 'border-cyan-500/5';
  const badgeClass = isLight ? 'border-amber-500/15 bg-amber-50/70 text-amber-700' : 'border-cyan-500/15 bg-cyan-950/20 text-cyan-400';
  const cardBg = isLight ? 'bg-amber-500/5 border-amber-500/10 hover:border-amber-500/20 hover:shadow-lg' : 'border-cyan-500/5 bg-[#111]/30 hover:border-cyan-500/10';
  const cardCourseBg = isLight ? 'bg-white border-amber-500/15 hover:border-amber-500/30' : 'bg-[#050505]/65 border-cyan-500/10 hover:border-cyan-500/20';
  const actionButtonBg = isLight ? 'bg-amber-600 hover:bg-amber-700 text-white' : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950';
  
  // Banner Slider state
  const activeBanners = banners.filter(b => b.isActive);
  const [currentSlide, setCurrentSlide] = useState(0);

  // Auto-play banners slider
  useEffect(() => {
    if (activeBanners.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % activeBanners.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [activeBanners.length]);

  const handleNextSlide = () => {
    setCurrentSlide(prev => (prev + 1) % activeBanners.length);
  };

  const handlePrevSlide = () => {
    setCurrentSlide(prev => (prev - 1 + activeBanners.length) % activeBanners.length);
  };

  // Image Gallery state
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [lightboxImage, setLightboxImage] = useState<GalleryImage | null>(null);

  const categories = [
    { key: 'all', label: 'ALL EVENTS' },
    { key: 'school_programs', label: 'SCHOOL PROGRAMS' },
    { key: 'iot_robotics', label: 'IoT & ROBOTICS' },
    { key: 'mern_web', label: 'WEB & BACKEND' },
    { key: 'lab_setups', label: 'LAB SETUP LOGISTICS' }
  ];

  const filteredGallery = activeCategory === 'all' 
    ? galleryImages 
    : galleryImages.filter(img => img.category === activeCategory);

  return (
    <div className="space-y-16 py-4 relative text-center">
      {/* Absolute ambient lights background */}
      <div className={`absolute top-24 left-1/2 -translate-x-1/2 h-96 w-96 bg-radial via-transparent to-transparent blur-3xl pointer-events-none -z-10 ${
        isLight ? 'from-amber-400/15' : 'from-cyan-500/10'
      }`} />

      {/* --- SECTION A: PROMOTIONAL BANNER CAROUSEL --- */}
      {activeBanners.length > 0 && (
        <div id="banner-slider" className="max-w-5xl mx-auto px-4 relative">
          <div className={`relative h-[280px] sm:h-[340px] w-full rounded-2xl border overflow-hidden transition-all duration-300 ${
            isLight ? 'border-amber-500/20 bg-amber-50/5 shadow-[0_0_45px_rgba(217,119,6,0.08)]' : 'border-cyan-500/20 bg-[#050505]/90 shadow-[0_0_40px_rgba(6,182,212,0.1)]'
          }`}>
            
            {/* Slide renderer */}
            <AnimatePresence mode="wait">
              <motion.div
                key={currentSlide}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.5 }}
                className="absolute inset-0 flex flex-col justify-end p-6 sm:p-10 text-left bg-cover bg-center"
                style={{
                  backgroundImage: isLight
                    ? `linear-gradient(to top, rgba(254,254,254,0.99) 35%, rgba(254,254,254,0.6) 70%, rgba(254,254,254,0.2) 100%), url(${activeBanners[currentSlide].imageUrl})`
                    : `linear-gradient(to top, rgba(5,5,5,0.98) 35%, rgba(5,5,5,0.6) 70%, rgba(5,5,5,0.2) 100%), url(${activeBanners[currentSlide].imageUrl})`
                }}
              >
                <div className="max-w-2xl space-y-2.5 z-10">
                  <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border font-mono text-[9px] font-black tracking-widest uppercase transition-colors duration-300 ${
                    isLight ? 'border-amber-500/25 bg-amber-50 text-amber-700' : 'border-cyan-400/30 bg-cyan-950/40 text-cyan-400'
                  }`}>
                    <Sparkles className="w-3 h-3 text-current" /> PROMOTIONAL SPOTLIGHT
                  </div>
                  
                  <h2 className={`text-base sm:text-2xl font-black tracking-wide uppercase leading-tight transition-colors duration-300 ${textTitle}`}>
                    {activeBanners[currentSlide].title}
                  </h2>
                  
                  <p className={`text-2xs sm:text-xs leading-relaxed max-w-xl transition-colors duration-300 ${textMuted}`}>
                    {activeBanners[currentSlide].subtitle}
                  </p>

                  {activeBanners[currentSlide].actionUrl && (
                    <div className="pt-1.5">
                      <a
                        href={activeBanners[currentSlide].actionUrl}
                        className={`inline-flex items-center gap-1.5 text-[10px] font-black font-mono px-3.5 py-1.5 rounded-lg transition-all hover:scale-103 active:scale-97 cursor-pointer ${actionButtonBg}`}
                      >
                        LEARN DETAIL <ArrowRight className="w-3 h-3" />
                      </a>
                    </div>
                  )}
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Background scanline mesh overlay */}
            <div className="absolute inset-0 bg-scanlines opacity-[0.03] pointer-events-none z-10" />

            {/* Previous/Next Controls */}
            {activeBanners.length > 1 && (
              <>
                <button
                  onClick={handlePrevSlide}
                  className={`absolute left-3 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full border transition-all text-sm shrink-0 cursor-pointer ${
                    isLight ? 'border-amber-500/20 bg-white/80 text-amber-800' : 'border-cyan-500/10 bg-black/60 text-slate-400 hover:text-cyan-400'
                  }`}
                  title="Previous Banner"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={handleNextSlide}
                  className={`absolute right-3 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full border transition-all text-sm shrink-0 cursor-pointer ${
                    isLight ? 'border-amber-500/20 bg-white/80 text-amber-800' : 'border-cyan-500/10 bg-black/60 text-slate-400 hover:text-cyan-400'
                  }`}
                  title="Next Banner"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>

                {/* Dots index indicators */}
                <div className="absolute bottom-4 right-6 z-20 flex gap-2">
                  {activeBanners.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentSlide(index)}
                      className={`h-1.5 rounded-full transition-all cursor-pointer ${
                        currentSlide === index 
                          ? (isLight ? 'w-5 bg-amber-600' : 'w-5 bg-cyan-400') 
                          : 'w-1.5 bg-slate-400 hover:bg-slate-300'
                      }`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* --- HERO / LOGO SECTION --- */}
      <div className="flex flex-col items-center justify-center min-h-[48vh] px-4 space-y-6">
        <div className="scale-90 md:scale-102 transition-all">
          <DakshyamLogo size="lg" pulseGlow={true} interactive={true} showText={true} theme={theme} />
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.8 }}
          className="space-y-4 max-w-lg mx-auto"
        >
          <p className={`text-3xs sm:text-xs font-mono tracking-widest uppercase ${textMuted}`}>
            Sovereign Skill Systems & Robotics Integration
          </p>

          <div className="pt-1">
            <button
              onClick={onEnterPortal}
              className={`font-black text-xs sm:text-sm px-8 py-3.5 rounded-xl inline-flex items-center gap-2 group cursor-pointer active:scale-95 transition-all uppercase font-mono tracking-wider ${
                isLight 
                  ? 'bg-amber-600 hover:bg-amber-700 text-white hover:shadow-[0_0_25px_rgba(217,119,6,0.22)]' 
                  : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 hover:shadow-[0_0_25px_rgba(34,211,238,0.22)]'
              }`}
            >
              Enter Innovation Portal <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </motion.div>
      </div>

      {/* --- SECTION B: NEP 2020 INTEGRATION GRID (CONNECTSHIKSHA INSPIRED) --- */}
      <div className="max-w-4xl mx-auto px-4 space-y-8">
        <div className={`text-left space-y-2 border-l-2 pl-4 ${isLight ? 'border-amber-600' : 'border-[#22d3ee]'}`}>
          <span className={`text-3xs font-mono tracking-widest uppercase font-bold ${textGold}`}>Policy & Compliance</span>
          <h2 className={`text-base md:text-lg font-black tracking-wide uppercase ${textTitle}`}>NEP 2020 School Computer Literacy & 21st-Century Coding</h2>
          <p className={`text-xs max-w-xl font-sans ${textMuted}`}>
            How we translate the Indian National Education Policy (NEP) guidelines into classroom actions. Our camps trigger cognitive development, logical reasoning, and mechanical mastery.
          </p>
        </div>

        {/* Bento Grid Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-left font-sans">
          
          <div className={`p-5 rounded-2xl border transition-all space-y-3 ${cardBg}`}>
            <div className={`p-2.5 rounded-xl border w-fit ${isLight ? 'bg-amber-500/10 border-amber-500/20 text-amber-700' : 'bg-cyan-950/30 border-cyan-500/10 text-cyan-400'}`}>
              <School className="w-5 h-5" />
            </div>
            <h3 className={`text-xs font-bold uppercase tracking-wider ${textTitle}`}>NEP Comp Thinking Alignment</h3>
            <p className={`text-3xs leading-relaxed ${textMutedLight}`}>
              Replacing rote programming theory with hands-on computer execution. We teach students flowchart designs, block structures, physical variables, script debugging, and safe cyber habits from early grades.
            </p>
          </div>

          <div className={`p-5 rounded-2xl border transition-all space-y-3 ${cardBg}`}>
            <div className={`p-2.5 rounded-xl border w-fit ${isLight ? 'bg-amber-500/10 border-amber-500/20 text-amber-700' : 'bg-cyan-950/30 border-cyan-500/10 text-cyan-400'}`}>
              <Smartphone className="w-5 h-5" />
            </div>
            <h3 className={`text-xs font-bold uppercase tracking-wider ${textTitle}`}>Zero Setup Hassle for Schools</h3>
            <p className={`text-3xs leading-relaxed ${textMutedLight}`}>
              No school computer lab? No problem. Dakshyam leases high-specification mobile learning computer systems, Wi-Fi routers, breadboards, and robotics sensors directly to classrooms for the duration of the program.
            </p>
          </div>

          <div className={`p-5 rounded-2xl border transition-all space-y-3 ${cardBg}`}>
            <div className={`p-2.5 rounded-xl border w-fit ${isLight ? 'bg-amber-500/10 border-amber-500/20 text-amber-700' : 'bg-cyan-950/30 border-cyan-500/10 text-cyan-400'}`}>
              <Star className="w-5 h-5 animate-spin-slow" />
            </div>
            <h3 className={`text-xs font-bold uppercase tracking-wider ${textTitle}`}>1-Week & 3-Month Core Tracks</h3>
            <p className={`text-3xs leading-relaxed ${textMutedLight}`}>
              Tailored modules fitting any school schedule. Build customized 1-week basic computer bootcamps, 15-day robotics camps, or a comprehensive 3-month IoT engineering curriculum linked to national boards.
            </p>
          </div>

        </div>
      </div>

      {/* --- SECTION C: SERVICING WORKSPACES SPOTLIGHT --- */}
      <div className="max-w-4xl mx-auto px-4 space-y-8">
        <div className={`text-left space-y-2 border-l-2 pl-4 ${isLight ? 'border-amber-600' : 'border-cyan-400'}`}>
          <span className={`text-3xs font-mono tracking-widest uppercase font-bold ${textGold}`}>Dakshyam Capabilities</span>
          <h2 className={`text-base md:text-lg font-black tracking-wide uppercase ${textTitle}`}>Comprehensive Vocational Services & Delivery</h2>
          <p className={`text-xs max-w-2xl ${textMuted}`}>
            Dakshyam Innovations designs and deploys customized, turn-key computational labs and robotic work benches. Our services bridge hardware-level physical instrumentation with professional diagnostic code frameworks, aligning with modern industrial standards.
          </p>
        </div>

        {/* Premium services grids */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left font-sans text-xs">
          
          <div className={`p-6 rounded-2xl border ${cardCourseBg} space-y-3`}>
            <div className="flex items-center gap-3">
              <span className={`font-mono text-xs font-black px-2 py-0.5 rounded ${isLight ? 'bg-amber-600/10 text-amber-750' : 'bg-cyan-950/40 text-[#22d3ee]'}`}>S1</span>
              <h4 className={`font-black text-xs uppercase tracking-wide ${textTitle}`}>On-Demand High-Spec Computer Leases</h4>
            </div>
            <p className={`${textMuted}`}>
              We deliver fully configured mobile laptop arrays directly to local and rural schools. These systems come pre-loaded with localized offline development compilation tools, terminal diagnostics softwares, and electronic circuit emulators. This mitigates infrastructure constraints for standard schools and ensures 100% participation.
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              <span className="text-[10px] font-mono text-slate-400 bg-black/30 border border-slate-500/10 px-2 py-0.5 rounded">✓ Leased Free of Charge</span>
              <span className="text-[10px] font-mono text-slate-400 bg-black/30 border border-slate-500/10 px-2 py-0.5 rounded">✓ No Internet Necessary</span>
            </div>
          </div>

          <div className={`p-6 rounded-2xl border ${cardCourseBg} space-y-3`}>
            <div className="flex items-center gap-3">
              <span className={`font-mono text-xs font-black px-2 py-0.5 rounded ${isLight ? 'bg-amber-600/10 text-amber-750' : 'bg-cyan-950/40 text-[#22d3ee]'}`}>S2</span>
              <h4 className={`font-black text-xs uppercase tracking-wide ${textTitle}`}>Hands-On Hardware Kit Provision</h4>
            </div>
            <p className={`${textMuted}`}>
              Every student gets individual access to premium hardware kits including ESP32 Wi-Fi modules, DC geared motors, optical incremental encoder discs, L298N dual-H-bridge power modules, custom solar cells, infrared line trackers, and HC-SR04 ultrasonic sound wave receptors. No simulation models; purely physical assembly and diagnostics.
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              <span className="text-[10px] font-mono text-slate-400 bg-black/30 border border-slate-500/10 px-2 py-0.5 rounded">✓ Individual Kit Ownership</span>
              <span className="text-[10px] font-mono text-slate-400 bg-black/30 border border-slate-500/10 px-2 py-0.5 rounded">✓ Complete Spare Spares</span>
            </div>
          </div>

          <div className={`p-6 rounded-2xl border ${cardCourseBg} space-y-3`}>
            <div className="flex items-center gap-3">
              <span className={`font-mono text-xs font-black px-2 py-0.5 rounded ${isLight ? 'bg-amber-600/10 text-amber-750' : 'bg-cyan-950/40 text-[#22d3ee]'}`}>S3</span>
              <h4 className={`font-black text-xs uppercase tracking-wide ${textTitle}`}>Sovereign Evaluation & Micro-Credentials</h4>
            </div>
            <p className={`${textMuted}`}>
              We replace standard text examinations with verifiable project reviews. Students build a functional end-product (such as a smart solar watering pump or an autonomous pathfinder), present its diagnostic performance on telemetry charts, write a brief lab record, and receive blockchain-traceable, industry-approved, downloadable completion certificates.
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              <span className="text-[10px] font-mono text-slate-400 bg-black/30 border border-slate-500/10 px-2 py-0.5 rounded">✓ 100% Practical Grading</span>
              <span className="text-[10px] font-mono text-slate-400 bg-black/30 border border-slate-500/10 px-2 py-0.5 rounded">✓ Shared Video Presentations</span>
            </div>
          </div>

          <div className={`p-6 rounded-2xl border ${cardCourseBg} space-y-3`}>
            <div className="flex items-center gap-3">
              <span className={`font-mono text-xs font-black px-2 py-0.5 rounded ${isLight ? 'bg-amber-600/10 text-amber-750' : 'bg-cyan-950/40 text-[#22d3ee]'}`}>S4</span>
              <h4 className={`font-black text-xs uppercase tracking-wide ${textTitle}`}>Institutional Lab Integrations</h4>
            </div>
            <p className={`${textMuted}`}>
              For schools and science institutions seeking continuous, permanent technical excellence, we offer complete turn-key laboratory configuration services. We design and install safe wiring setups, physical server nodes, visual diagnostic telemetry banners, and custom instructional trainer guidelines fitted to local schedules.
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              <span className="text-[10px] font-mono text-slate-400 bg-black/30 border border-slate-500/10 px-2 py-0.5 rounded">✓ Turn-key physical lab designs</span>
              <span className="text-[10px] font-mono text-slate-400 bg-black/30 border border-slate-500/10 px-2 py-0.5 rounded">✓ Certified Supervisor handshakes</span>
            </div>
          </div>

        </div>
      </div>

      {/* --- SECTION CD: SYLLABUS DIRECTORY --- */}
      <div className="max-w-4xl mx-auto px-4 space-y-8">
        <div className={`text-left space-y-2 border-l-2 pl-4 ${isLight ? 'border-amber-600' : 'border-[#22d3ee]'}`}>
          <span className={`text-3xs font-mono tracking-widest uppercase font-bold ${textGold}`}>Curriculum Catalog</span>
          <h2 className={`text-base md:text-lg font-black tracking-wide uppercase ${textTitle}`}>Official Course Syllabus Directory</h2>
          <p className={`text-xs max-w-xl ${textMuted}`}>
            Explore active syllabus schedules. Complete physical training is supported by digital access logs and authorized, downloadable certificates.
          </p>
        </div>

        {/* Course Cards */}
        {courses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
            {courses.map((course) => (
              <div 
                key={course.id}
                className={`p-5 border rounded-2xl transition-all duration-300 flex flex-col justify-between space-y-4 relative group ${cardCourseBg} ${
                  isLight ? 'hover:shadow-[0_0_20px_rgba(217,119,6,0.04)]' : 'hover:shadow-[0_0_20px_rgba(34,211,238,0.03)]'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase tracking-widest border ${badgeClass}`}>
                      {course.duration} Module
                    </span>
                    
                    {course.mobileHardwareIncluded && (
                      <span className="text-4xs font-mono text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full flex items-center gap-1 font-bold shadow-xs">
                        ★ MOB HARDWARE LEASED
                      </span>
                    )}
                  </div>

                  <h3 className={`text-xs sm:text-sm font-black tracking-wide uppercase font-sans ${textTitle}`}>
                    {course.title}
                  </h3>
                  
                  <p className={`text-3xs sm:text-2xs leading-relaxed ${textMuted}`}>
                    {course.description}
                  </p>

                  {/* Program Features */}
                  <div className={`space-y-1.5 pt-2 border-t ${isLight ? 'border-amber-500/10' : 'border-cyan-500/5'}`}>
                    {course.features.map((feat, fIdx) => (
                      <div key={fIdx} className={`text-[10px] flex items-start gap-1 font-mono uppercase ${isLight ? 'text-slate-600' : 'text-slate-350'}`}>
                        <span className={`${textGold} font-bold select-none shrink-0`}>•</span>
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <button
                    onClick={() => onSelectCourse(course.id)}
                    className={`w-full text-center border font-bold text-2xs py-2.5 rounded-xl cursor-pointer transition-all uppercase tracking-wider ${
                      isLight 
                        ? 'bg-amber-500/10 border-amber-500/25 text-amber-700 hover:bg-amber-600 hover:text-white hover:border-amber-600' 
                        : 'bg-cyan-950/30 border-cyan-500/20 text-cyan-400 hover:bg-cyan-500 hover:text-slate-950'
                    }`}
                  >
                    Enroll / Service Request
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className={`p-8 border rounded-2xl max-w-md mx-auto text-center space-y-2 font-mono ${cardCourseBg}`}>
            <BookOpen className="w-8 h-8 text-slate-550 mx-auto" />
            <h3 className={`text-xs font-bold uppercase ${textTitle}`}>Syllabus Catalog Empty</h3>
            <p className={`text-3xs ${textMutedLight}`}>Wait for Admin supervisor to publish new classes.</p>
          </div>
        )}
      </div>

      {/* --- SECTION CA: SPECIAL SCHOOL & COLLEGE CAMPUS REGISTRATIONS --- */}
      {(() => {
        const activePrograms = DakshyamDatabase.getSpecialPrograms();
        const [selectedRegProg, setSelectedRegProg] = useState<any>(null);
        const [studentName, setStudentName] = useState('');
        const [branch, setBranch] = useState('');
        const [year, setYear] = useState('');
        const [fatherName, setFatherName] = useState('');
        const [email, setEmail] = useState('');
        const [roll, setRoll] = useState('');
        const [mobile, setMobile] = useState('');
        const [regSuccess, setRegSuccess] = useState('');
        const [regError, setRegError] = useState('');

        const handleSelfRegister = (e: React.FormEvent) => {
          e.preventDefault();
          setRegError('');
          setRegSuccess('');

          if (!studentName.trim() || !email.trim() || !roll.trim() || !mobile.trim()) {
            setRegError('Please complete Name, Email, Roll, and Mobile fields.');
            return;
          }

          try {
            const enrollments = DakshyamDatabase.getSpecialEnrollments();
            
            // Check if student already registered in this specific program
            const exists = enrollments.some(
              x => x.programId === selectedRegProg.id && x.email.toLowerCase() === email.toLowerCase().trim()
            );

            if (exists) {
              setRegError('You have already submitted your registry enrollment form for this campus training!');
              return;
            }

            const newRegistration = {
              id: `enroll-${Date.now()}`,
              programId: selectedRegProg.id,
              trainingName: selectedRegProg.trainingName,
              institutionName: selectedRegProg.institutionName,
              name: studentName,
              branch,
              yearOfStudy: year,
              fathersName: fatherName,
              email: email.toLowerCase().trim(),
              rollNumber: roll,
              mobileNumber: mobile,
              enrolledAt: new Date().toISOString().split('T')[0]
            };

            enrollments.push(newRegistration);
            DakshyamDatabase.saveSpecialEnrollments(enrollments);

            setRegSuccess('✓ CONGRATULATIONS! Your special student registration has been captured successfully.');
            setStudentName('');
            setBranch('');
            setYear('');
            setFatherName('');
            setEmail('');
            setRoll('');
            setMobile('');
          } catch {
            setRegError('Failed submitting your enrollment record to repository.');
          }
        };

        if (activePrograms.length === 0) return null;

        return (
          <div className="max-w-5xl mx-auto px-4 space-y-8 animate-fadeIn text-left">
            <div className={`text-left space-y-2 border-l-2 pl-4 ${isLight ? 'border-amber-600' : 'border-cyan-400'}`}>
              <span className={`text-3xs font-mono tracking-widest uppercase font-black ${textGold}`}>Public Registrations</span>
              <h2 className={`text-base md:text-lg font-black tracking-wide uppercase ${textTitle}`}>
                🏫 Active School & College Campus Training Registrations
              </h2>
              <p className={`text-xs max-w-xl ${textMuted}`}>
                Specific campus programs currently open for registration in MP. Scan list to find your school or college and register to claim your verified credential files!
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {activePrograms.map(prog => (
                <div 
                  key={prog.id}
                  className={`p-5 rounded-2xl border text-left flex flex-col justify-between space-y-4 transition-all duration-300 ${cardCourseBg}`}
                >
                  <div className="space-y-1.5">
                    <span className={`text-[9px] font-mono font-black border ${badgeClass} px-2.5 py-0.5 rounded-full uppercase tracking-wider`}>
                      CAMPUS PROGRAM
                    </span>
                    <h3 className={`text-sm font-black uppercase ${textTitle}`}>
                      {prog.trainingName}
                    </h3>
                    <p className={`text-2xs font-mono ${textGold}`}>
                      {prog.institutionName} • {prog.duration}
                    </p>
                    <p className="text-[10px] text-slate-550">
                      Starting On: {new Date(prog.startingDateTime).toLocaleString()}
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      setSelectedRegProg(prog);
                      setRegSuccess('');
                      setRegError('');
                    }}
                    className={`w-full text-center border font-bold text-2xs py-2.5 rounded-xl cursor-pointer transition-all uppercase tracking-wider ${
                      isLight 
                        ? 'bg-amber-600 hover:bg-amber-700 text-white border-transparent' 
                        : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 border-transparent hover:shadow-[0_0_12px_rgba(34,211,238,0.2)]'
                    }`}
                  >
                    Fill Registration Form
                  </button>
                </div>
              ))}
            </div>

            {/* In-app modal for special registration */}
            <AnimatePresence>
              {selectedRegProg && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setSelectedRegProg(null)}
                    className="absolute inset-0 bg-black/85 backdrop-blur-xs cursor-pointer"
                  />

                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className={`border rounded-2xl max-w-lg w-full p-6 relative z-10 text-left space-y-4 max-h-[90vh] overflow-y-auto ${
                      isLight ? 'bg-white border-amber-500/20 shadow-xl' : 'bg-[#0a0a0a] border-cyan-500/25 shadow-2xl'
                    }`}
                  >
                    <div className="flex justify-between items-start border-b pb-2 border-slate-500/10">
                      <div>
                        <span className="text-[9px] font-mono text-amber-600 uppercase tracking-widest font-bold">CAMPUS REGISTRATION DESK</span>
                        <h3 className={`text-xs sm:text-sm font-black uppercase mt-0.5 ${textTitle}`}>
                          {selectedRegProg.trainingName}
                        </h3>
                        <p className="text-[10px] text-slate-500">{selectedRegProg.institutionName}</p>
                      </div>
                      <button 
                        onClick={() => setSelectedRegProg(null)} 
                        className={`text-xs font-mono font-bold px-2 py-1 rounded border hover:text-red-400 transition-colors ${
                          isLight ? 'border-amber-500/10 text-slate-700' : 'border-cyan-500/10 text-slate-400'
                        }`}
                      >
                        ✕ CLOSE
                      </button>
                    </div>

                    {regError && <p className="text-3xs text-red-400 font-mono bg-red-950/20 p-2.5 rounded-xl border border-red-500/10 text-center">{regError}</p>}
                    {regSuccess && (
                      <div className="bg-cyan-950/30 p-4 rounded-xl border border-cyan-500/20 text-center space-y-3 font-mono">
                        <p className="text-2xs text-cyan-400 font-bold leading-relaxed">{regSuccess}</p>
                        <button
                          onClick={() => setSelectedRegProg(null)}
                          className="bg-cyan-500 text-slate-950 text-3xs px-4 py-1.5 rounded-lg header-text font-black uppercase tracking-wider"
                        >
                          Okay, Got It!
                        </button>
                      </div>
                    )}

                    {!regSuccess && (
                      <form onSubmit={handleSelfRegister} className={`space-y-3 text-xs ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[8px] font-mono text-slate-400 uppercase mb-1">Student Full Name</label>
                            <input
                              type="text"
                              required
                              value={studentName}
                              onChange={(e) => setStudentName(e.target.value)}
                              placeholder="e.g. Ramesh Kumar"
                              className={`w-full border rounded-xl px-3 py-2 text-xs focus:outline-none ${
                                isLight ? 'bg-slate-50 border-slate-300 text-slate-950' : 'bg-black/40 border-slate-500/15 text-white'
                              }`}
                            />
                          </div>

                          <div>
                            <label className="block text-[8px] font-mono text-slate-400 uppercase mb-1">Branch / Stream</label>
                            <input
                              type="text"
                              required
                              value={branch}
                              onChange={(e) => setBranch(e.target.value)}
                              placeholder="e.g. Science / CSE / IT"
                              className={`w-full border rounded-xl px-3 py-2 text-xs focus:outline-none ${
                                isLight ? 'bg-slate-50 border-slate-300 text-slate-950' : 'bg-black/40 border-slate-500/15 text-white'
                              }`}
                            />
                          </div>

                          <div>
                            <label className="block text-[8px] font-mono text-slate-400 uppercase mb-1">Year of Study</label>
                            <input
                              type="text"
                              required
                              value={year}
                              onChange={(e) => setYear(e.target.value)}
                              placeholder="e.g. Class 11 / 2nd Year"
                              className={`w-full border rounded-xl px-3 py-2 text-xs focus:outline-none ${
                                isLight ? 'bg-slate-50 border-slate-300 text-slate-950' : 'bg-black/40 border-slate-500/15 text-white'
                              }`}
                            />
                          </div>

                          <div>
                            <label className="block text-[8px] font-mono text-slate-400 uppercase mb-1">Father's Name</label>
                            <input
                              type="text"
                              required
                              value={fatherName}
                              onChange={(e) => setFatherName(e.target.value)}
                              placeholder="Father's Full Name"
                              className={`w-full border rounded-xl px-3 py-2 text-xs focus:outline-none ${
                                isLight ? 'bg-slate-50 border-slate-300 text-slate-950' : 'bg-black/40 border-slate-500/15 text-white'
                              }`}
                            />
                          </div>

                          <div>
                            <label className="block text-[8px] font-mono text-slate-400 uppercase mb-1">Email ID</label>
                            <input
                              type="email"
                              required
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              placeholder="student@example.com"
                              className={`w-full border rounded-xl px-3 py-2 text-xs focus:outline-none ${
                                isLight ? 'bg-slate-50 border-slate-300 text-slate-950' : 'bg-black/40 border-slate-500/15 text-white'
                              }`}
                            />
                          </div>

                          <div>
                            <label className="block text-[8px] font-mono text-slate-400 uppercase mb-1">Roll / Enrolment Number</label>
                            <input
                              type="text"
                              required
                              value={roll}
                              onChange={(e) => setRoll(e.target.value)}
                              placeholder="e.g. ROLL12A"
                              className={`w-full border rounded-xl px-3 py-2 text-xs focus:outline-none ${
                                isLight ? 'bg-slate-50 border-slate-300 text-slate-950' : 'bg-black/40 border-slate-500/15 text-white'
                              }`}
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-[8px] font-mono text-slate-400 uppercase mb-1">Mobile / WhatsApp contacts</label>
                          <input
                            type="text"
                            required
                            value={mobile}
                            onChange={(e) => setMobile(e.target.value)}
                            placeholder="+91 WhatsApp Contact"
                            className={`w-full border rounded-xl px-3 py-2 text-xs focus:outline-none ${
                              isLight ? 'bg-slate-50 border-slate-300 text-slate-950' : 'bg-black/40 border-slate-500/15 text-white'
                            }`}
                          />
                        </div>

                        <button
                          type="submit"
                          className="w-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs py-3 rounded-xl transition-all cursor-pointer uppercase font-mono mt-3"
                        >
                          Submit Enrollment Form
                        </button>
                      </form>
                    )}
                  </motion.div>
                </div>
              )}
            </AnimatePresence>
          </div>
        );
      })()}

      {/* --- SECTION D: AUTHENTIC captioned PHOTO GALLERY --- */}
      <div className="max-w-4xl mx-auto px-4 space-y-8">
        <div className={`text-left space-y-2 border-l-2 pl-4 ${isLight ? 'border-amber-600' : 'border-cyan-400'}`}>
          <span className={`text-3xs font-mono tracking-widest uppercase font-bold ${textGold}`}>Class Actions</span>
          <h2 className={`text-base md:text-lg font-black tracking-wide uppercase ${textTitle}`}>Dakshyam Innovations Project Photo Gallery</h2>
          <p className={`text-xs max-w-xl ${textMuted}`}>
            Real snapshots from active school setups, IoT calibrations, and robotics assembly labs. Fully updated dynamically via the central Admin Control Panel.
          </p>
        </div>

        {/* Filter categories tabs selector */}
        <div className={`flex flex-wrap items-center justify-start gap-1.5 pb-2 font-mono text-[9px] font-bold border-b ${isLight ? 'border-amber-500/10' : 'border-cyan-500/5'}`}>
          {categories.map(cat => (
            <button
              key={cat.key}
              onClick={() => setActiveCategory(cat.key)}
              className={`px-3 py-1.5 rounded-lg border transition-all cursor-pointer ${
                activeCategory === cat.key 
                  ? (isLight ? 'bg-amber-600/10 border-amber-600/30 text-amber-700 font-extrabold shadow-[0_0_10px_rgba(217,119,6,0.08)]' : 'bg-cyan-500/15 border-cyan-500/30 text-cyan-400 font-bold shadow-[0_0_10px_rgba(34,211,238,0.1)]')
                  : (isLight ? 'border-transparent text-slate-600 hover:text-amber-800' : 'border-transparent text-slate-450 hover:text-white')
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Images Grid */}
        {filteredGallery.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 text-left">
            {filteredGallery.map((img) => (
              <motion.div
                layout
                key={img.id}
                onClick={() => setLightboxImage(img)}
                className={`group border rounded-2xl overflow-hidden cursor-pointer transition-all hover:scale-[1.01] ${
                  isLight 
                    ? 'border-amber-500/10 bg-white hover:border-amber-500/30 hover:shadow-[0_0_20px_rgba(217,119,6,0.04)]' 
                    : 'border-cyan-500/5 bg-[#050505]/60 hover:border-cyan-500/25 hover:shadow-[0_0_20px_rgba(6,182,212,0.05)]'
                }`}
              >
                <div className="h-44 w-full overflow-hidden relative bg-slate-900">
                  <img 
                    src={img.imageUrl} 
                    alt={img.title}
                    referrerPolicy="no-referrer"
                    className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-transparent to-transparent opacity-80" />
                  
                  <span className={`absolute top-3 left-3 text-[8px] font-mono font-bold px-2 py-0.5 rounded-full uppercase tracking-wider border ${
                    isLight ? 'border-amber-500/20 bg-amber-50 text-amber-700' : 'border-cyan-500/20 bg-black/75 text-cyan-400'
                  }`}>
                    {img.category.replace('_', ' ')}
                  </span>
                </div>

                <div className={`p-4 space-y-1 transition-colors duration-305 ${isLight ? 'bg-amber-500/5' : 'bg-[#0a0a0a]/80'}`}>
                  <h4 className={`text-2xs font-extrabold uppercase transition-colors tracking-wide ${
                    isLight ? 'text-slate-800 group-hover:text-amber-700' : 'text-white group-hover:text-cyan-400'
                  }`}>
                    {img.title}
                  </h4>
                  <p className={`text-[10px] leading-relaxed line-clamp-2 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                    {img.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className={`p-12 border rounded-2xl max-w-sm mx-auto text-center space-y-2 font-mono ${cardCourseBg}`}>
            <ImageIcon className="w-8 h-8 text-slate-550 mx-auto" />
            <h3 className={`text-xs font-bold uppercase ${textTitle}`}>No photos posted</h3>
            <p className={`text-3xs ${textMutedLight}`}>Wait for Admin supervisor to publish gallery uploads.</p>
          </div>
        )}
      </div>

      {/* --- ABOUT DAKSHYAM INNOVATIONS SECTION --- */}
      <div className={`max-w-4xl mx-auto px-4 mt-20 p-8 rounded-3xl border transition-all duration-300 relative overflow-hidden ${
        isLight 
          ? 'bg-amber-500/5 border-amber-500/15 shadow-[0_0_55px_rgba(217,119,6,0.05)]' 
          : 'bg-[#050505]/80 border-cyan-500/10 shadow-[0_0_55px_rgba(6,182,212,0.04)]'
      }`}>
        {/* Subtle grid accent background */}
        <div className="absolute inset-0 bg-scanlines opacity-[0.015] pointer-events-none" />
        
        <div className="relative z-10 space-y-6 text-left">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-4 border-slate-500/10">
            <div className="space-y-1">
              <span className={`text-3xs font-mono tracking-widest uppercase font-black ${textGold}`}>About Cooperatives</span>
              <h2 className={`text-lg md:text-xl font-black uppercase text-left tracking-wide ${textTitle}`}>
                Dakshyam Innovations
              </h2>
            </div>
            
            <div className={`px-4 py-2 rounded-2xl border font-mono text-[10px] tracking-wide leading-relaxed font-bold w-fit ${
              isLight ? 'bg-amber-100/50 border-amber-500/20 text-amber-800' : 'bg-cyan-950/20 border-cyan-500/15 text-cyan-400'
            }`}>
              📍 Location Node: Waraseoni, District Balaghat, MP
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-sans">
            <div className="space-y-3.5">
              <h3 className={`text-xs font-bold uppercase tracking-wider ${textTitle}`}>
                Who Are We ?
              </h3>
              <p className={`text-3xs leading-relaxed ${textMuted}`}>
                Dakshyam Innovations is an elite technical training cooperative committed to making advanced technology concepts highly tactile and intuitive. We operate at the forefront of digital inclusion by setting up bespoke **School Coding & Robotics Labs** and organizing dedicated physical workshops.
              </p>
              <p className={`text-3xs leading-relaxed ${textMuted}`}>
                We bridge the gap between abstract textbook syntax and real-world microcontrollers. By deploying fully customized mobile kits, regional school classrooms in central India gain direct hands-on access to embedded engineering, logic controllers, and modern full-stack developer environments.
              </p>
            </div>

            <div className="space-y-3.5">
              <h3 className={`text-xs font-bold uppercase tracking-wider ${textTitle}`}>
                What We Do ?
              </h3>
              <div className="space-y-3 font-mono">
                <div className="flex gap-2.5 items-start">
                  <span className={`${textGold} text-2xs font-bold`}>✓</span>
                  <div className="space-y-0.5">
                    <h4 className={`text-4xs font-bold uppercase ${textTitle}`}>NEP 2020 Laboratory Structuring</h4>
                    <p className={`text-[9.5px] leading-relaxed ${textMutedLight}`}>Equipping schools with fully managed developer systems, robotic sensors, and hands-on, multi-tier training syllabi aligned with NEP benchmarks.</p>
                  </div>
                </div>

                <div className="flex gap-2.5 items-start">
                  <span className={`${textGold} text-2xs font-bold`}>✓</span>
                  <div className="space-y-0.5">
                    <h4 className={`text-4xs font-bold uppercase ${textTitle}`}>Dynamic IoT & Full-Stack Bootcamps</h4>
                    <p className={`text-[9.5px] leading-relaxed ${textMutedLight}`}>Guiding students step-by-step from breadboard calibrations to live telemetry reporting, hooked securely into react dashboard APIs.</p>
                  </div>
                </div>

                <div className="flex gap-2.5 items-start">
                  <span className={`${textGold} text-2xs font-bold`}>✓</span>
                  <div className="space-y-0.5">
                    <h4 className={`text-4xs font-bold uppercase ${textTitle}`}>Localized Rural Development</h4>
                    <p className={`text-[9.5px] leading-relaxed ${textMutedLight}`}>Operating proud, accessible hubs in Waraseoni, Balaghat, MP to prepare candidates for engineering and industrial automation sectors.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* --- LIGHTBOX MODAL --- */}
      <AnimatePresence>
        {lightboxImage && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setLightboxImage(null)}
              className="absolute inset-0 bg-black/90 backdrop-blur-sm cursor-pointer"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`border rounded-2xl max-w-xl w-full overflow-hidden relative z-10 text-left space-y-4 flex flex-col justify-between max-h-[90vh] overflow-y-auto ${
                isLight ? 'bg-white border-amber-500/20 shadow-[0_0_40px_rgba(217,119,6,0.1)]' : 'bg-[#050505] border-cyan-500/25 shadow-[0_0_40px_rgba(34,211,238,0.15)]'
              }`}
            >
              <div className="relative aspect-video w-full bg-slate-900">
                <img 
                  src={lightboxImage.imageUrl} 
                  alt={lightboxImage.title}
                  referrerPolicy="no-referrer"
                  className="h-full w-full object-cover"
                />
                
                {/* Close Button */}
                <button
                  onClick={() => setLightboxImage(null)}
                  className={`absolute top-3 right-3 p-2 rounded-full border bg-black/80 text-white hover:text-red-400 transition-colors cursor-pointer text-xs font-mono ${
                    isLight ? 'border-amber-400/25' : 'border-cyan-400/20'
                  }`}
                >
                  ✕ CLOSE
                </button>
              </div>

              <div className="p-5 sm:p-6 space-y-2.5">
                <span className={`text-[8px] font-mono font-black tracking-widest uppercase px-2 py-0.5 rounded border ${
                  isLight ? 'text-amber-700 bg-amber-50 border-amber-500/15' : 'text-cyan-400 bg-cyan-950/40 border-cyan-500/10'
                }`}>
                  {lightboxImage.category.replace('_', ' ')}
                </span>
                
                <h3 className={`text-xs sm:text-sm font-black uppercase ${textTitle}`}>
                  {lightboxImage.title}
                </h3>
                
                <p className={`text-3xs sm:text-2xs leading-relaxed font-sans ${isLight ? 'text-slate-700' : 'text-slate-350'}`}>
                  {lightboxImage.description}
                </p>

                <div className={`text-[8px] font-mono border-t pt-2.5 flex justify-between items-center ${
                  isLight ? 'text-slate-500 border-amber-500/10' : 'text-slate-500 border-cyan-500/5'
                }`}>
                  <span>SYSTEM UNIQUE ID: {lightboxImage.id}</span>
                  <span>RECORDED: {lightboxImage.createdAt}</span>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
