import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, CheckCircle2, User, Phone, School, Mail, HelpCircle, ArrowRight } from 'lucide-react';
import { Course, CourseApplication } from '../types';
import { DakshyamDatabase } from '../utils/db';
import { BeautifulErrorDisplay } from '../utils/errorShield';

interface CourseRegistrationFormProps {
  courses: Course[];
  preselectedCourseId?: string | null;
  onSuccess?: () => void;
}

export default function CourseRegistrationForm({ 
  courses, 
  preselectedCourseId = null,
  onSuccess 
}: CourseRegistrationFormProps) {
  // Try to grab logged in user profile details
  const loggedInUser = DakshyamDatabase.getLoggedInUser();
  const isStudentLoggedIn = loggedInUser && loggedInUser.role === 'student';

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
      setFullName(loggedInUser.name || '');
      setEmail(loggedInUser.email || '');
      setPhone(loggedInUser.profile?.phone || '');
      setInstitution(loggedInUser.profile?.institution || '');
    }
  }, [isStudentLoggedIn, loggedInUser]);

  // Handle setting preselected course correctly if passed down
  useEffect(() => {
    if (preselectedCourseId) {
      setSelectedCourseId(preselectedCourseId);
    }
  }, [preselectedCourseId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorText('');

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
            studentId: isStudentLoggedIn ? loggedInUser.id : undefined,
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
      }, 1000);

    } catch (err: any) {
      setErrorText(err?.message || 'Something went wrong processing your request.');
      setIsSubmitting(false);
    }
  };

  const selectedCourse = courses.find(c => c.id === selectedCourseId);

  return (
    <div className="bg-[#050505]/80 border border-cyan-500/10 rounded-2xl p-6 md:p-8 backdrop-blur-xl relative overflow-hidden max-w-2xl mx-auto">
      {/* Absolute glow design accent */}
      <div className="absolute top-0 right-0 h-24 w-24 bg-cyan-500/5 blur-2xl rounded-full pointer-events-none" />

      {isDone ? (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-10 space-y-4"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-cyan-950/40 border border-cyan-400/30 text-cyan-400 mb-2">
            <CheckCircle2 className="w-8 h-8 animate-pulse" />
          </div>
          <h3 className="text-xl font-bold text-white tracking-wide">Application Submitted Successfully!</h3>
          <p className="text-slate-400 text-sm max-w-md mx-auto">
            Your application for <strong className="text-cyan-300 font-medium">{selectedCourse?.title}</strong> is registered under pending approval.
          </p>
          <div className="bg-cyan-500/5 border border-cyan-500/10 rounded-xl p-4 text-left font-mono text-xs max-w-md mx-auto space-y-1 text-slate-300">
            <div><span className="text-slate-500">Applicant:</span> {fullName}</div>
            <div><span className="text-slate-500">Duration:</span> {selectedCourse?.duration}</div>
            <div><span className="text-slate-500">Phone Code:</span> {phone}</div>
            <div><span className="text-slate-500">School/College:</span> {institution}</div>
            {selectedCourse?.mobileHardwareIncluded && (
              <div className="text-cyan-400 font-semibold mt-2">
                ★ Fully compatible mobile kit configuration included for setups.
              </div>
            )}
          </div>
          <div className="pt-4">
            <button
              onClick={() => {
                setIsDone(false);
                if (!isStudentLoggedIn) {
                  setFullName('');
                  setEmail('');
                  setPhone('');
                  setInstitution('');
                }
              }}
              className="bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 font-semibold text-xs px-5 py-2.5 rounded-xl border border-cyan-500/20 hover:border-cyan-400/40 transition-all cursor-pointer"
            >
              Apply for another course
            </button>
          </div>
        </motion.div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <h2 className="text-lg md:text-xl font-bold text-white tracking-wide">Course & Training Enrollment</h2>
            <p className="text-xs text-slate-400">
              {isStudentLoggedIn 
                ? "Logged in as student. Profile details have been mapped automatically." 
                : "Fill out the enrollment fields. New profiles will be created instantly."}
            </p>
          </div>

          <AnimatePresence mode="wait">
            {errorText && (
              <BeautifulErrorDisplay errorText={errorText} isLight={false} />
            )}
          </AnimatePresence>

          <div className="space-y-4">
            {/* 1. Course Selection Dropdown */}
            <div>
              <label className="block text-2xs font-mono text-cyan-400/80 tracking-widest uppercase mb-1.5 font-medium">
                Select Domain Sector
              </label>
              <select
                value={selectedCourseId}
                onChange={(e) => setSelectedCourseId(e.target.value)}
                className="w-full bg-[#111111]/80 border border-cyan-500/10 text-white rounded-xl px-4 py-3 text-xs md:text-sm focus:outline-none focus:border-cyan-450 focus:ring-1 focus:ring-cyan-450/10"
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
              <div className="p-3 bg-[#111]/40 border border-cyan-500/5 rounded-xl text-xs text-slate-300">
                <span className="font-semibold text-white">Course Info:</span> {selectedCourse.description}
                {selectedCourse.mobileHardwareIncluded && (
                  <div className="text-cyan-400 text-3xs font-mono mt-1 uppercase tracking-wider">
                    ⚡ Hardware kits & testing tools shipped to school labs.
                  </div>
                )}
              </div>
            )}

            {/* 2. Personal demographic details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-2xs font-mono text-cyan-400/80 tracking-widest uppercase mb-1.5 font-medium">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    required
                    disabled={isStudentLoggedIn}
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Enter full name"
                    className="w-full bg-[#111]/80 border border-cyan-500/10 text-white rounded-xl py-3 pl-10 pr-4 text-xs md:text-sm focus:outline-none focus:border-cyan-450 disabled:opacity-60"
                  />
                </div>
              </div>

              <div>
                <label className="block text-2xs font-mono text-cyan-400/80 tracking-widest uppercase mb-1.5 font-medium">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="email"
                    required
                    disabled={isStudentLoggedIn}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="student@example.com"
                    className="w-full bg-[#111]/80 border border-cyan-500/10 text-white rounded-xl py-3 pl-10 pr-4 text-xs md:text-sm focus:outline-none focus:border-cyan-450 disabled:opacity-60"
                  />
                </div>
              </div>

              <div>
                <label className="block text-2xs font-mono text-cyan-400/80 tracking-widest uppercase mb-1.5 font-medium">
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
                    className="w-full bg-[#111]/80 border border-cyan-500/10 text-white rounded-xl py-3 pl-10 pr-4 text-xs md:text-sm focus:outline-none focus:border-cyan-450"
                  />
                </div>
              </div>

              <div>
                <label className="block text-2xs font-mono text-cyan-400/80 tracking-widest uppercase mb-1.5 font-medium">
                  Institution Name (School/College)
                </label>
                <div className="relative">
                  <School className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    required
                    value={institution}
                    onChange={(e) => setInstitution(e.target.value)}
                    placeholder="Enter School or College"
                    className="w-full bg-[#111]/80 border border-cyan-500/10 text-white rounded-xl py-3 pl-10 pr-4 text-xs md:text-sm focus:outline-none focus:border-cyan-450"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 group cursor-pointer disabled:opacity-50 hover:shadow-[0_0_15px_rgba(34,211,238,0.22)] transition-all cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <span className="w-5 h-5 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin" />
                  Securing application node...
                </>
              ) : (
                <>
                  Submit Course Application <Send className="w-4 h-4 group-hover:translate-x-0.5" />
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
