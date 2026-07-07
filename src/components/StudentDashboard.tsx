import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { User, Award, Users, FileText, CheckCircle2, Clock, MapPin, Phone, Briefcase, BookOpen, Camera } from 'lucide-react';
import { StudentUser, StudentGroup, Course, CourseApplication, Certificate } from '../types';
import { DakshyamDatabase } from '../utils/db';
import SyllabusExplorer from './SyllabusExplorer';
import { BeautifulErrorDisplay } from '../utils/errorShield';

interface StudentDashboardProps {
  user: StudentUser;
  courses: Course[];
  groups: StudentGroup[];
  certificates: Certificate[];
  applications: CourseApplication[];
  onRefresh: () => void;
  theme?: 'light' | 'dark';
}

export default function StudentDashboard({
  user,
  courses,
  groups,
  certificates,
  applications,
  onRefresh,
  theme = 'dark'
}: StudentDashboardProps) {
  const isLight = theme === 'light';
  // Find student's group
  const myGroup = groups.find(g => g.memberIds.includes(user.id));
  const myApplications = applications.filter(app => app.email.toLowerCase() === user.email.toLowerCase());
  const myCertificates = certificates.filter(cert => cert.studentEmail.toLowerCase() === user.email.toLowerCase());

  // Navigation tab
  const [activeTab, setActiveTab] = useState<'overview' | 'syllabus'>('overview');

  // Editing profile details states
  const [name, setName] = useState(user.name);
  const [phone, setPhone] = useState(user.profile?.phone || '');
  const [institution, setInstitution] = useState(user.profile?.institution || '');
  const [gradeOrBranch, setGradeOrBranch] = useState(user.profile?.gradeOrBranch || '');
  const [avatar, setAvatar] = useState((user.profile as any)?.avatar || '');
  const [isSaved, setIsSaved] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatar(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const cleanPhone = phone.trim().replace(/\D/g, '');
    if (cleanPhone.length !== 10) {
      setErrorMsg('Mobile number must be exactly 10 digits.');
      DakshyamDatabase.logEvent('Student Profile Update Failed', `Student ${user.name} submitted invalid phone length: ${cleanPhone.length} digits`, user.email, 'student', 'ERROR');
      return;
    }

    const students = DakshyamDatabase.getStudents();
    const matchIdx = students.findIndex(s => s.id === user.id);
    if (matchIdx !== -1) {
      students[matchIdx].name = name;
      students[matchIdx].profile = {
        phone: cleanPhone,
        institution,
        gradeOrBranch,
        avatar
      } as any;
      
      DakshyamDatabase.saveStudents(students);
      
      // Update session storage too
      DakshyamDatabase.setLoggedInUser(students[matchIdx]);
      setIsSaved(true);
      DakshyamDatabase.logEvent('Student Profile Updated', `Student ${user.name} successfully updated their workspace demographic profile.`, user.email, 'student', 'SUCCESS');
      setTimeout(() => setIsSaved(false), 2000);
      onRefresh();
    }
  };

  return (
    <div className="space-y-6 text-left max-w-4xl mx-auto">
      
      {/* 1. Header Hero Welcome Panel */}
      <div className={`border p-6 rounded-2xl relative overflow-hidden backdrop-blur-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-all duration-300 ${
        isLight 
          ? 'bg-gradient-to-r from-amber-50 to-amber-100/30 border-amber-500/15 text-slate-800 shadow-sm' 
          : 'bg-gradient-to-r from-slate-950 to-[#0c1e22] border-cyan-500/15 text-white'
      }`}>
        <div className={`absolute top-0 right-0 h-full w-48 bg-radial blur-xl pointer-events-none ${
          isLight ? 'from-amber-500/5 to-transparent' : 'from-cyan-500/5 to-transparent'
        }`} />
        
        <div className="flex items-center gap-4">
          <div className={`p-0.5 border rounded-2xl overflow-hidden shrink-0 ${
            isLight ? 'bg-amber-50 border-amber-500/20 shadow-sm' : 'bg-cyan-950/50 border-cyan-500/20'
          }`}>
            {avatar ? (
              <img src={avatar} className="w-16 h-16 object-cover rounded-xl" referrerPolicy="no-referrer" alt={user.name} />
            ) : (
              <div className={`p-4 ${isLight ? 'text-amber-700' : 'text-cyan-400'}`}>
                <User className="w-8 h-8" />
              </div>
            )}
          </div>
          <div className="space-y-0.5">
            <span className={`text-[9px] font-mono tracking-widest uppercase font-bold ${isLight ? 'text-amber-800' : 'text-[#22d3ee]'}`}>Student Dashboard Portal</span>
            <h1 className={`text-xl font-black tracking-wide uppercase ${isLight ? 'text-slate-900' : 'text-white'}`}>{user.name}</h1>
            <p className={`text-xs font-sans ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>{user.email}</p>
          </div>
        </div>

        {myGroup && (
          <div className={`p-3 rounded-xl max-w-xs font-mono text-xs border ${
            isLight ? 'bg-amber-500/5 border-amber-500/20 text-slate-750' : 'bg-cyan-500/5 border-cyan-500/15 text-white'
          }`}>
            <span className={`font-bold block ${isLight ? 'text-amber-800' : 'text-cyan-400/80'}`}>★ Member of {myGroup.name}</span>
            <span className={`block mt-1 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>Project: "{myGroup.projectTitle}"</span>
            <span className={`block mt-1 ${isLight ? 'text-slate-850' : 'text-white'}`}>
              Current Score: <strong className={isLight ? 'text-amber-750 font-extrabold' : 'text-cyan-400 font-extrabold'}>{myGroup.points} / 100 PTS</strong>
            </span>
          </div>
        )}
      </div>

      {/* Selector Tabs */}
      <div className={`flex gap-1.5 border-b pb-0.5 font-mono text-2xs uppercase ${
        isLight ? 'border-amber-500/15' : 'border-cyan-500/10'
      }`}>
        {(['overview', 'syllabus'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 rounded-t-xl transition-all border-t border-x cursor-pointer ${
              activeTab === tab
                ? (isLight ? 'bg-white border-amber-500/25 text-amber-800 font-bold' : 'bg-[#050505]/70 border-cyan-500/15 text-[#22d3ee] font-bold')
                : (isLight ? 'border-transparent text-slate-500 hover:text-slate-800' : 'border-transparent text-slate-400 hover:text-white')
            }`}
          >
            {tab === 'overview' ? '📋 Workspace Overview' : '📖 My Course Syllabus'}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
          className="w-full"
        >
          {activeTab === 'overview' ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* LEFT COLUMN: Profile custom config */}
              <div className="md:col-span-1 space-y-6">
                <div className={`border rounded-2xl p-5 space-y-4 transition-all duration-300 ${
                  isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#050505]/75 border-cyan-500/10'
                }`}>
                  <h3 className={`text-xs font-bold font-mono tracking-wider uppercase border-b pb-2 ${
                    isLight ? 'text-amber-800 border-slate-100' : 'text-cyan-400 border-cyan-500/5'
                  }`}>
                    My Student Profile Info
                  </h3>

              {isSaved && <div className={`text-3xs font-bold text-center font-mono ${isLight ? 'text-amber-700' : 'text-cyan-400'}`}>✓ Profile saved successfully!</div>}
              {errorMsg && <BeautifulErrorDisplay errorText={errorMsg} isLight={isLight} />}

              <form onSubmit={handleUpdateProfile} className="space-y-3">
                {/* Profile Picture Select / Upload */}
                <div className="space-y-2">
                  <label className="block text-[9px] font-mono text-slate-500 uppercase">Profile Picture</label>
                  <div className="flex items-center gap-3">
                    {avatar ? (
                      <img src={avatar} className={`w-12 h-12 rounded-xl object-cover border ${isLight ? 'border-amber-500/20' : 'border-cyan-500/20'}`} referrerPolicy="no-referrer" />
                    ) : (
                      <div className={`w-12 h-12 rounded-xl border flex items-center justify-center font-mono text-4xs ${
                        isLight ? 'bg-slate-50 border-slate-200 text-slate-400' : 'bg-cyan-950/40 border-cyan-500/10 text-slate-500'
                      }`}>
                        NO PHOTO
                      </div>
                    )}
                    <div className="flex-1 space-y-1">
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handleAvatarChange}
                        className={`block w-full text-4xs cursor-pointer file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-4xs file:font-semibold ${
                          isLight 
                            ? 'text-slate-500 file:bg-amber-100 file:text-amber-800 hover:file:bg-amber-200' 
                            : 'text-slate-400 file:bg-cyan-950 file:text-cyan-400 hover:file:bg-cyan-900'
                        }`}
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[9px] font-mono text-slate-500 uppercase mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter Full Name"
                    className={`w-full rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 ${
                      isLight 
                        ? 'bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400 focus:border-amber-500 focus:ring-amber-500/15' 
                        : 'bg-[#111]/80 border border-cyan-500/10 text-white placeholder-slate-500 focus:border-cyan-450 focus:ring-cyan-500/15'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-[9px] font-mono text-slate-500 uppercase mb-1">Mobile / WhatsApp</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '');
                      if (val.length <= 10) setPhone(val);
                    }}
                    placeholder="10-digit mobile number"
                    className={`w-full rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 ${
                      isLight 
                        ? 'bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400 focus:border-amber-500 focus:ring-amber-500/15' 
                        : 'bg-[#111]/80 border border-cyan-500/10 text-white placeholder-slate-500 focus:border-cyan-450 focus:ring-cyan-500/15'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-[9px] font-mono text-slate-500 uppercase mb-1">School / College</label>
                  <input
                    type="text"
                    value={institution}
                    onChange={(e) => setInstitution(e.target.value)}
                    placeholder="Enter School/College Name"
                    className={`w-full rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 ${
                      isLight 
                        ? 'bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400 focus:border-amber-500 focus:ring-amber-500/15' 
                        : 'bg-[#111]/80 border border-cyan-500/10 text-white placeholder-slate-500 focus:border-cyan-450 focus:ring-cyan-500/15'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-[9px] font-mono text-slate-500 uppercase mb-1">Grade or Branch specialization</label>
                  <input
                    type="text"
                    value={gradeOrBranch}
                    onChange={(e) => setGradeOrBranch(e.target.value)}
                    placeholder="e.g. Class 10 or CSE"
                    className={`w-full rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 ${
                      isLight 
                        ? 'bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400 focus:border-amber-500 focus:ring-amber-500/15' 
                        : 'bg-[#111]/80 border border-cyan-500/10 text-white placeholder-slate-500 focus:border-cyan-450 focus:ring-cyan-500/15'
                    }`}
                  />
                </div>

                <button
                  type="submit"
                  className={`w-full text-xs py-2.5 rounded-xl transition-all cursor-pointer font-bold border ${
                    isLight 
                      ? 'bg-amber-600 border-amber-600 hover:bg-amber-700 text-white shadow-sm active:scale-98' 
                      : 'bg-[#0f2a2e]/60 border border-cyan-500/25 hover:border-cyan-450 text-cyan-400 hover:bg-cyan-500/10'
                  }`}
                >
                  Save Profile Parameters
                </button>
              </form>
            </div>
          </div>

          {/* RIGHT COLUMN: Active details */}
          <div className="md:col-span-2 space-y-6">
            
            {/* Applications list */}
            <div className={`border rounded-2xl p-5 space-y-4 transition-all duration-300 ${
              isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#050505]/70 border-cyan-500/10'
            }`}>
              <h3 className={`text-xs font-bold font-mono tracking-wider uppercase border-b pb-2 ${
                isLight ? 'text-amber-800 border-slate-100' : 'text-[#22d3ee] border-cyan-500/5'
              }`}>
                Training Course Applications
              </h3>

              {myApplications.length > 0 ? (
                <div className="space-y-3">
                  {myApplications.map(app => {
                    const matchCourse = courses.find(c => c.id === app.courseId);
                    
                    return (
                      <div 
                        key={app.id}
                        className={`flex items-center justify-between p-3.5 rounded-xl border relative transition-all ${
                          isLight 
                            ? 'bg-slate-50/50 border-slate-100 hover:border-amber-500/20' 
                            : 'bg-[#111]/40 border-slate-500/5 hover:border-cyan-500/15'
                        }`}
                      >
                        <div className="text-left font-sans space-y-0.5">
                          <h4 className={`text-xs font-bold tracking-wide ${isLight ? 'text-slate-800' : 'text-white'}`}>
                            {matchCourse ? matchCourse.title : 'General Training Sector'}
                          </h4>
                          <span className={`text-[10px] block ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Applied at: {app.appliedAt}</span>
                        </div>

                        <div className="flex items-center gap-1 font-mono text-xs">
                          {app.status === 'approved' ? (
                            <span className={`flex items-center gap-1 uppercase tracking-widest text-[10px] font-bold border px-2 py-0.5 rounded-full ${
                              isLight 
                                ? 'text-emerald-700 border-emerald-500/20 bg-emerald-500/5' 
                                : 'text-cyan-400 border border-cyan-500/10 bg-cyan-500/5'
                            }`}>
                              <CheckCircle2 className="w-3.5 h-3.5" /> Approved
                            </span>
                          ) : app.status === 'rejected' ? (
                            <span className="text-red-500 uppercase tracking-widest text-[10px] font-bold border border-red-500/10 bg-red-500/5 px-2 py-0.5 rounded-full">
                              Declined
                            </span>
                          ) : (
                            <span className="text-amber-500 flex items-center gap-1 uppercase tracking-widest text-[10px] font-bold border border-amber-500/10 bg-amber-500/5 px-2 py-0.5 rounded-full">
                              <Clock className="w-3.5 h-3.5" /> Pending Verification
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className={`text-xs font-mono italic text-center py-4 ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>
                  You have not submitted any enrollment forms yet. Head to "Explore Courses" to enroll!
                </div>
              )}
            </div>

            {/* Secure verify/awards link */}
            <div className={`border rounded-2xl p-5 space-y-4 transition-all duration-300 ${
              isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#050505]/70 border-cyan-500/10'
            }`}>
              <h3 className={`text-xs font-bold font-mono tracking-wider uppercase border-b pb-2 flex items-center gap-2 ${
                isLight ? 'text-amber-800 border-slate-100' : 'text-[#22d3ee] border-cyan-500/5'
              }`}>
                <Award className={`w-4 h-4 ${isLight ? 'text-amber-700' : 'text-cyan-400'}`} /> My Issued Certificates
              </h3>

              {myCertificates.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {myCertificates.map(cert => (
                    <div 
                      key={cert.id}
                      className={`p-4 rounded-xl border flex flex-col justify-between space-y-3 ${
                        isLight 
                          ? 'bg-gradient-to-br from-amber-50 to-white border-amber-500/15' 
                          : 'bg-gradient-to-br from-[#0a1a1f] to-black border-cyan-500/20'
                      }`}
                    >
                      <div>
                        <span className={`text-[9px] font-mono block font-bold ${isLight ? 'text-amber-800' : 'text-cyan-400'}`}>CODE: {cert.id}</span>
                        <h4 className={`text-xs font-bold tracking-wide mt-1 ${isLight ? 'text-slate-800' : 'text-white'}`}>{cert.courseTitle}</h4>
                        <p className={`text-[10px] font-sans mt-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Issuer: {cert.trainerName}</p>
                      </div>

                      <div className={`pt-2 border-t flex justify-between items-center text-xs font-mono ${
                        isLight ? 'border-amber-500/10' : 'border-cyan-500/5'
                      }`}>
                        <span className={`text-[10px] ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>{cert.issueDate}</span>
                        <span className={`text-3xs font-bold font-sans animate-pulse ${isLight ? 'text-amber-700' : 'text-cyan-400'}`}>
                          Ready in Verifications
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className={`text-xs font-mono italic text-center py-4 ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>
                  No performance awards published yet. Once the trainer grading cycle finishes in August, they are safe to print.
                </div>
              )}
            </div>

          </div>

        </div>
      ) : (
        <SyllabusExplorer courses={courses} applications={applications} theme={theme} />
      )}
        </motion.div>
      </AnimatePresence>

    </div>
  );
}
