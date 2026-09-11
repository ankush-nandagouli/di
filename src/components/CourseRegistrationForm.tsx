import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, CheckCircle2, User, Phone, School, Mail, ShieldAlert, LogIn, UserPlus, Sparkles, Check } from 'lucide-react';
import { Course, CourseApplication } from '../types';
import { DakshyamDatabase } from '../utils/db';
import { BeautifulErrorDisplay } from '../utils/errorShield';

interface CourseRegistrationFormProps {
  courses: Course[];
  preselectedCourseId?: string | null;
  onSuccess?: () => void;
  onRequireAuth?: (mode: 'login' | 'register', courseId?: string) => void;
  currentUser?: any;
  theme?: 'light' | 'dark';
}

export default function CourseRegistrationForm({ 
  courses, 
  preselectedCourseId = null,
  onSuccess,
  onRequireAuth,
  currentUser,
  theme = 'dark'
}: CourseRegistrationFormProps) {
  const isLight = theme === 'light';
  // Try to grab logged in user profile details from prop or database
  const activeUser = currentUser || DakshyamDatabase.getLoggedInUser();
  const isStudentLoggedIn = activeUser && activeUser.role === 'student';

  const [selectedCourseId, setSelectedCourseId] = useState(preselectedCourseId || (courses[0]?.id || ''));
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [institution, setInstitution] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [errorText, setErrorText] = useState('');

  // Auto populate on mount or login change
  useEffect(() => {
    if (isStudentLoggedIn) {
      setFullName(activeUser.name || '');
      setEmail(activeUser.email || '');
      setPhone(activeUser.profile?.phone || '');
      setInstitution(activeUser.profile?.institution || '');
    }
  }, [isStudentLoggedIn, activeUser]);

  // Handle setting preselected course correctly if passed down
  useEffect(() => {
    if (preselectedCourseId) {
      setSelectedCourseId(preselectedCourseId);
    }
  }, [preselectedCourseId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorText('');

    if (!isStudentLoggedIn) {
      if (onRequireAuth) {
        onRequireAuth('login', selectedCourseId);
      }
      return;
    }

    try {
      if (!fullName.trim() || !email.trim() || !phone.trim() || !institution.trim()) {
        throw new Error('Please fill out all the verification & demographic fields.');
      }

      if (!email.includes('@')) {
        throw new Error('Please enter a valid structure email address.');
      }

      const cleanPhone = phone.trim().replace(/\D/g, '');
      if (cleanPhone.length !== 10) {
        throw new Error('Contact / WhatsApp Number must be exactly 10 digits.');
      }

      setIsSubmitting(true);

      // Save application request
      setTimeout(() => {
        try {
          const apps = DakshyamDatabase.getApplications();
          const newApp: CourseApplication = {
            id: `app-${Date.now()}`,
            studentId: activeUser.id,
            fullName,
            email,
            phone,
            institution,
            courseId: selectedCourseId,
            appliedAt: new Date().toISOString().split('T')[0],
            status: 'pending'
          };

          apps.push(newApp);
          DakshyamDatabase.saveApplications(apps);

          setIsSubmitting(false);
          setIsDone(true);
          if (onSuccess) onSuccess();
        } catch (innerError: any) {
          setErrorText(innerError?.message || 'Database transaction error. Please try again.');
          setIsSubmitting(false);
        }
      }, 700);

    } catch (err: any) {
      setErrorText(err?.message || 'Something went wrong processing your request.');
      setIsSubmitting(false);
    }
  };

  const selectedCourse = courses.find(c => c.id === selectedCourseId) || courses[0];

  return (
    <div className={`rounded-2xl p-6 md:p-8 backdrop-blur-xl relative overflow-hidden max-w-2xl mx-auto border transition-all ${
      isLight 
        ? 'bg-white border-blue-900/15 shadow-sm text-slate-800' 
        : 'bg-[#0a192f]/80 border-blue-800/40 text-white'
    }`}>
      {/* Absolute glow design accent */}
      <div className={`absolute top-0 right-0 h-24 w-24 blur-2xl rounded-full pointer-events-none ${
        isLight ? 'bg-blue-900/5' : 'bg-sky-500/10'
      }`} />

      {isDone ? (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-8 space-y-4"
        >
          <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full border mb-2 ${
            isLight 
              ? 'bg-blue-50 border-blue-900/20 text-blue-950' 
              : 'bg-blue-950/60 border-sky-400/40 text-sky-400'
          }`}>
            <CheckCircle2 className="w-8 h-8 animate-pulse" />
          </div>
          <h3 className={`text-lg sm:text-xl font-black uppercase tracking-wide ${isLight ? 'text-slate-900' : 'text-white'}`}>
            Course Application Submitted!
          </h3>
          <p className={`text-xs max-w-md mx-auto ${isLight ? 'text-slate-650' : 'text-slate-350'}`}>
            Your application for <strong className={`font-bold ${isLight ? 'text-blue-950' : 'text-sky-300'}`}>{selectedCourse?.title}</strong> has been logged to the central supervisor queue.
          </p>
          <div className={`rounded-xl p-4 text-left font-mono text-xs max-w-md mx-auto space-y-1 border ${
            isLight 
              ? 'bg-blue-50/40 border-blue-900/10 text-slate-700' 
              : 'bg-blue-950/30 border-blue-800/30 text-slate-300'
          }`}>
            <div><span className="text-slate-500">Applicant:</span> {fullName}</div>
            <div><span className="text-slate-500">Program:</span> {selectedCourse?.title} ({selectedCourse?.duration})</div>
            <div><span className="text-slate-500">Contact Node:</span> +91 {phone}</div>
            <div><span className="text-slate-500">Institution:</span> {institution}</div>
            <div><span className="text-slate-500">Status:</span> <span className="text-amber-400 font-bold uppercase">Pending Verification</span></div>
            {selectedCourse?.mobileHardwareIncluded && (
              <div className={`font-semibold mt-2 pt-2 border-t border-slate-500/20 ${isLight ? 'text-blue-950' : 'text-sky-400'}`}>
                ★ Leased ESP32/Robotics hardware kit scheduled for delivery upon batch allocation.
              </div>
            )}
          </div>
          <div className="pt-3">
            <button
              onClick={() => setIsDone(false)}
              className={`font-bold text-xs px-5 py-2.5 rounded-xl border transition-all cursor-pointer uppercase font-mono ${
                isLight 
                  ? 'bg-blue-950 text-white hover:bg-blue-900 border-blue-950' 
                  : 'bg-white text-[#0a192f] hover:bg-slate-100 border-white'
              }`}
            >
              Apply for another course
            </button>
          </div>
        </motion.div>
      ) : !isStudentLoggedIn ? (
        /* --- AUTHENTICATION REQUIRED PROMPT GATEWAY --- */
        <div className="text-left space-y-5 py-2 animate-fadeIn">
          <div className="flex items-start gap-3">
            <div className={`p-2.5 rounded-xl border shrink-0 ${
              isLight ? 'bg-amber-50 border-amber-200 text-amber-800' : 'bg-amber-950/40 border-amber-500/30 text-amber-300'
            }`}>
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <span className={`text-[10px] font-mono uppercase font-bold tracking-widest ${isLight ? 'text-amber-800' : 'text-amber-300'}`}>
                Candidate Verification Gate
              </span>
              <h2 className={`text-base sm:text-lg font-black uppercase tracking-wide ${isLight ? 'text-slate-900' : 'text-white'}`}>
                Login or Register to Apply
              </h2>
              <p className={`text-xs mt-1 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                Course applications, equipment allocation, and accredited certifications are linked to verified student accounts. Please sign in or register to submit your application.
              </p>
            </div>
          </div>

          {/* Selected Course Preview Card */}
          {selectedCourse && (
            <div className={`p-4 rounded-xl border space-y-2 ${
              isLight ? 'bg-blue-50/50 border-blue-900/15' : 'bg-blue-950/30 border-blue-800/40'
            }`}>
              <div className="flex justify-between items-center">
                <span className={`text-[9px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                  isLight ? 'bg-blue-900/10 text-blue-950' : 'bg-sky-500/10 text-sky-300 border border-sky-500/20'
                }`}>
                  {selectedCourse.duration} Track
                </span>
                {selectedCourse.mobileHardwareIncluded && (
                  <span className="text-[9px] font-mono font-bold text-emerald-400 flex items-center gap-1">
                    ★ Hardware Kit Included
                  </span>
                )}
              </div>
              <h3 className={`text-sm font-black uppercase ${isLight ? 'text-slate-900' : 'text-white'}`}>
                {selectedCourse.title}
              </h3>
              <p className={`text-2xs leading-relaxed ${isLight ? 'text-slate-650' : 'text-slate-350'}`}>
                {selectedCourse.description}
              </p>
            </div>
          )}

          {/* Benefits checklist */}
          <div className={`rounded-xl p-3.5 space-y-2 border text-xs font-mono ${
            isLight ? 'bg-slate-50 border-slate-200 text-slate-700' : 'bg-[#071326] border-blue-900/30 text-slate-350'
          }`}>
            <div className="flex items-center gap-2 text-[11px]">
              <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Instant tracking of your course application status</span>
            </div>
            <div className="flex items-center gap-2 text-[11px]">
              <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Direct allocation of leased ESP32 / STEM laboratory kits</span>
            </div>
            <div className="flex items-center gap-2 text-[11px]">
              <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>QR-verifiable NEP 2020 Certificate linked to your profile</span>
            </div>
          </div>

          {/* Primary Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <button
              onClick={() => onRequireAuth?.('login', selectedCourseId)}
              className={`w-full py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 uppercase font-mono tracking-wider transition-all cursor-pointer ${
                isLight 
                  ? 'bg-blue-950 text-white hover:bg-blue-900 shadow-sm' 
                  : 'bg-white text-[#0a192f] hover:bg-slate-100 font-black'
              }`}
            >
              <LogIn className="w-4 h-4" />
              Sign In to Apply
            </button>

            <button
              onClick={() => onRequireAuth?.('register', selectedCourseId)}
              className={`w-full py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 uppercase font-mono tracking-wider transition-all cursor-pointer border ${
                isLight 
                  ? 'bg-blue-50 border-blue-900/30 text-blue-950 hover:bg-blue-100' 
                  : 'bg-blue-950/40 border-sky-400/40 text-sky-300 hover:bg-blue-900/50'
              }`}
            >
              <UserPlus className="w-4 h-4" />
              Register as Candidate
            </button>
          </div>
        </div>
      ) : (
        /* --- ACTIVE APPLICATION FORM FOR LOGGED-IN CANDIDATE --- */
        <form onSubmit={handleSubmit} className="space-y-5 text-left">
          <div className="flex items-center justify-between border-b pb-3 border-slate-500/10">
            <div>
              <div className="flex items-center gap-2">
                <span className={`text-[9px] font-mono font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${
                  isLight ? 'bg-emerald-100 text-emerald-800' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                }`}>
                  ✓ Verified Student Account
                </span>
              </div>
              <h2 className={`text-base sm:text-lg font-black uppercase tracking-wide mt-1 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                Official Course Application Form
              </h2>
            </div>
            <div className={`text-right hidden sm:block font-mono text-[10px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              Candidate ID: <span className="font-bold">{activeUser.id}</span>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {errorText && (
              <BeautifulErrorDisplay errorText={errorText} isLight={isLight} />
            )}
          </AnimatePresence>

          <div className="space-y-4">
            {/* 1. Course Selection Dropdown */}
            <div>
              <label className={`block text-2xs font-mono tracking-widest uppercase mb-1.5 font-bold ${
                isLight ? 'text-blue-950' : 'text-sky-400'
              }`}>
                Select Course Program
              </label>
              <select
                value={selectedCourseId}
                onChange={(e) => setSelectedCourseId(e.target.value)}
                className={`w-full rounded-xl px-4 py-3 text-xs md:text-sm focus:outline-none border transition-all ${
                  isLight 
                    ? 'bg-slate-50 border-slate-300 text-slate-800 focus:border-blue-950 focus:ring-1 focus:ring-blue-950/20' 
                    : 'bg-[#071326] border-blue-900/40 text-white focus:border-sky-400 focus:ring-1 focus:ring-sky-400/20'
                }`}
              >
                {courses.map(course => (
                  <option key={course.id} value={course.id}>
                    {course.title} ({course.duration})
                  </option>
                ))}
              </select>
            </div>

            {/* Informative duration node */}
            {selectedCourse && (
              <div className={`p-3 rounded-xl text-xs border space-y-1 ${
                isLight 
                  ? 'bg-blue-50/40 border-blue-900/10 text-slate-750' 
                  : 'bg-blue-950/30 border-blue-800/30 text-slate-300'
              }`}>
                <div className="flex items-center gap-1.5 font-bold">
                  <Sparkles className={`w-3.5 h-3.5 ${isLight ? 'text-blue-900' : 'text-sky-400'}`} />
                  <span className={`${isLight ? 'text-slate-900' : 'text-white'}`}>{selectedCourse.title}</span>
                </div>
                <p className="text-[11px] leading-relaxed text-slate-400">{selectedCourse.description}</p>
                {selectedCourse.mobileHardwareIncluded && (
                  <div className={`text-3xs font-mono mt-1 uppercase tracking-wider font-bold ${
                    isLight ? 'text-blue-950' : 'text-sky-400'
                  }`}>
                    ⚡ Leased physical hardware kit (ESP32/sensors) included for laboratory training.
                  </div>
                )}
              </div>
            )}

            {/* 2. Personal demographic details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={`block text-2xs font-mono tracking-widest uppercase mb-1.5 font-medium ${
                  isLight ? 'text-blue-950' : 'text-sky-400'
                }`}>
                  Candidate Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    required
                    readOnly
                    value={fullName}
                    placeholder="Candidate full name"
                    className={`w-full rounded-xl py-3 pl-10 pr-4 text-xs md:text-sm focus:outline-none border opacity-90 cursor-not-allowed transition-all ${
                      isLight 
                        ? 'bg-slate-100 border-slate-300 text-slate-800' 
                        : 'bg-[#071326]/60 border-blue-900/40 text-white'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className={`block text-2xs font-mono tracking-widest uppercase mb-1.5 font-medium ${
                  isLight ? 'text-blue-950' : 'text-sky-400'
                }`}>
                  Verified Student Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="email"
                    required
                    readOnly
                    value={email}
                    placeholder="student@example.com"
                    className={`w-full rounded-xl py-3 pl-10 pr-4 text-xs md:text-sm focus:outline-none border opacity-90 cursor-not-allowed transition-all ${
                      isLight 
                        ? 'bg-slate-100 border-slate-300 text-slate-800' 
                        : 'bg-[#071326]/60 border-blue-900/40 text-white'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className={`block text-2xs font-mono tracking-widest uppercase mb-1.5 font-medium ${
                  isLight ? 'text-blue-950' : 'text-sky-400'
                }`}>
                  Contact / WhatsApp Number
                </label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    required
                    value={phone}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '');
                      if (val.length <= 10) setPhone(val);
                    }}
                    placeholder="10-digit mobile number"
                    className={`w-full rounded-xl py-3 pl-10 pr-4 text-xs md:text-sm focus:outline-none border transition-all ${
                      isLight 
                        ? 'bg-slate-50 border-slate-300 text-slate-800 focus:border-blue-950' 
                        : 'bg-[#071326] border-blue-900/40 text-white focus:border-sky-400'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className={`block text-2xs font-mono tracking-widest uppercase mb-1.5 font-medium ${
                  isLight ? 'text-blue-950' : 'text-sky-400'
                }`}>
                  Institution / School / College
                </label>
                <div className="relative">
                  <School className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    required
                    value={institution}
                    onChange={(e) => setInstitution(e.target.value)}
                    placeholder="Enter School or College"
                    className={`w-full rounded-xl py-3 pl-10 pr-4 text-xs md:text-sm focus:outline-none border transition-all ${
                      isLight 
                        ? 'bg-slate-50 border-slate-300 text-slate-800 focus:border-blue-950' 
                        : 'bg-[#071326] border-blue-900/40 text-white focus:border-sky-400'
                    }`}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 group cursor-pointer disabled:opacity-50 transition-all uppercase font-mono tracking-wider ${
                isLight 
                  ? 'bg-blue-950 hover:bg-blue-900 text-white shadow-sm' 
                  : 'bg-white hover:bg-slate-100 text-[#0a192f] shadow-[0_0_15px_rgba(255,255,255,0.2)] font-black'
              }`}
            >
              {isSubmitting ? (
                <>
                  <span className={`w-5 h-5 border-2 rounded-full animate-spin ${isLight ? 'border-white/30 border-t-white' : 'border-blue-950/30 border-t-blue-950'}`} />
                  Submitting Course Application...
                </>
              ) : (
                <>
                  Submit Official Course Application <Send className="w-4 h-4 group-hover:translate-x-0.5" />
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
