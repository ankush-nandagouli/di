import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { User, Award, Users, FileText, CheckCircle2, Clock, MapPin, Phone, Briefcase, BookOpen } from 'lucide-react';
import { StudentUser, StudentGroup, Course, CourseApplication, Certificate } from '../types';
import { DakshyamDatabase } from '../utils/db';
import SyllabusExplorer from './SyllabusExplorer';

interface StudentDashboardProps {
  user: StudentUser;
  courses: Course[];
  groups: StudentGroup[];
  certificates: Certificate[];
  applications: CourseApplication[];
  onRefresh: () => void;
}

export default function StudentDashboard({
  user,
  courses,
  groups,
  certificates,
  applications,
  onRefresh
}: StudentDashboardProps) {
  // Find student's group
  const myGroup = groups.find(g => g.memberIds.includes(user.id));
  const myApplications = applications.filter(app => app.email.toLowerCase() === user.email.toLowerCase());
  const myCertificates = certificates.filter(cert => cert.studentEmail.toLowerCase() === user.email.toLowerCase());

  // Navigation tab
  const [activeTab, setActiveTab] = useState<'overview' | 'syllabus'>('overview');

  // Editing profile details states
  const [phone, setPhone] = useState(user.profile?.phone || '');
  const [institution, setInstitution] = useState(user.profile?.institution || '');
  const [gradeOrBranch, setGradeOrBranch] = useState(user.profile?.gradeOrBranch || '');
  const [isSaved, setIsSaved] = useState(false);

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const students = DakshyamDatabase.getStudents();
    const matchIdx = students.findIndex(s => s.id === user.id);
    if (matchIdx !== -1) {
      students[matchIdx].profile = {
        phone,
        institution,
        gradeOrBranch
      };
      DakshyamDatabase.saveStudents(students);
      
      // Update session storage too
      DakshyamDatabase.setLoggedInUser(students[matchIdx]);
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2000);
      onRefresh();
    }
  };

  return (
    <div className="space-y-6 text-left max-w-4xl mx-auto">
      
      {/* 1. Header Hero Welcome Panel */}
      <div className="bg-gradient-to-r from-slate-950 to-[#0c1e22] border border-cyan-500/15 p-6 rounded-2xl relative overflow-hidden backdrop-blur-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="absolute top-0 right-0 h-full w-48 bg-radial from-cyan-500/5 to-transparent blur-xl pointer-events-none" />
        
        <div className="flex items-center gap-4">
          <div className="bg-cyan-950/50 p-4 border border-cyan-500/20 rounded-2xl text-cyan-400">
            <User className="w-8 h-8" />
          </div>
          <div className="space-y-0.5">
            <span className="text-[9px] font-mono tracking-widest text-[#22d3ee] uppercase">Student Dashboard Portal</span>
            <h1 className="text-xl font-black text-white tracking-wide uppercase">{user.name}</h1>
            <p className="text-xs text-slate-400 font-sans">{user.email}</p>
          </div>
        </div>

        {myGroup && (
          <div className="bg-cyan-500/5 border border-cyan-500/15 p-3 rounded-xl max-w-xs font-mono text-xs">
            <span className="text-cyan-400/80 font-bold block">★ Member of {myGroup.name}</span>
            <span className="text-slate-400 block mt-0.5 mt-1">Project: "{myGroup.projectTitle}"</span>
            <span className="text-white block mt-1">Current Score: <strong className="text-cyan-400 font-extrabold">{myGroup.points} / 100 PTS</strong></span>
          </div>
        )}
      </div>

      {/* Selector Tabs */}
      <div className="flex gap-1.5 border-b border-cyan-500/10 pb-0.5 font-mono text-2xs uppercase">
        {(['overview', 'syllabus'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 rounded-t-xl transition-all border-t border-x cursor-pointer ${
              activeTab === tab
                ? 'bg-[#050505]/70 border-cyan-500/15 text-[#22d3ee] font-bold'
                : 'border-transparent text-slate-400 hover:text-white'
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
                <div className="bg-[#050505]/75 border border-cyan-500/10 rounded-2xl p-5 space-y-4">
                  <h3 className="text-xs font-bold text-[#22d3ee] font-mono tracking-wider uppercase border-b border-cyan-500/5 pb-2">
                    My Student Profile Info
                  </h3>

              {isSaved && <div className="text-3xs text-cyan-400 font-bold text-center font-mono">✓ Profile saved successfully!</div>}

              <form onSubmit={handleUpdateProfile} className="space-y-3">
                <div>
                  <label className="block text-[9px] font-mono text-slate-500 uppercase mb-1">Mobile / WhatsApp</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 WhatsApp Number"
                    className="w-full bg-[#111]/80 border border-cyan-500/10 text-white rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-cyan-45 *:"
                  />
                </div>

                <div>
                  <label className="block text-[9px] font-mono text-slate-500 uppercase mb-1">School / College</label>
                  <input
                    type="text"
                    value={institution}
                    onChange={(e) => setInstitution(e.target.value)}
                    placeholder="Enter School/College Name"
                    className="w-full bg-[#111]/80 border border-cyan-500/10 text-white rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-cyan-45"
                  />
                </div>

                <div>
                  <label className="block text-[9px] font-mono text-slate-500 uppercase mb-1">Grade or Branch specialization</label>
                  <input
                    type="text"
                    value={gradeOrBranch}
                    onChange={(e) => setGradeOrBranch(e.target.value)}
                    placeholder="e.g. Class 10 or CSE"
                    className="w-full bg-[#111]/80 border border-cyan-500/10 text-white rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-cyan-45"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-[#0f2a2e]/60 border border-cyan-500/25 hover:border-cyan-400 text-cyan-400 text-xs py-2.5 rounded-xl transition-all cursor-pointer hover:bg-cyan-500/10 font-bold"
                >
                  Save Profile Parameters
                </button>
              </form>
            </div>
          </div>

          {/* RIGHT COLUMN: Active details */}
          <div className="md:col-span-2 space-y-6">
            
            {/* Applications list */}
            <div className="bg-[#050505]/70 border border-cyan-500/10 rounded-2xl p-5 space-y-4">
              <h3 className="text-xs font-bold text-[#22d3ee] font-mono tracking-wider uppercase border-b border-cyan-500/5 pb-2">
                Training Course Applications
              </h3>

              {myApplications.length > 0 ? (
                <div className="space-y-3">
                  {myApplications.map(app => {
                    const matchCourse = courses.find(c => c.id === app.courseId);
                    
                    return (
                      <div 
                        key={app.id}
                        className="flex items-center justify-between p-3.5 rounded-xl bg-[#111]/40 border border-slate-500/5 relative hover:border-cyan-500/15 transition-all"
                      >
                        <div className="text-left font-sans space-y-0.5">
                          <h4 className="text-xs font-bold text-white tracking-wide">
                            {matchCourse ? matchCourse.title : 'General Training Sector'}
                          </h4>
                          <span className="text-[10px] text-slate-400 block">Applied at: {app.appliedAt}</span>
                        </div>

                        <div className="flex items-center gap-1 font-mono text-xs">
                          {app.status === 'approved' ? (
                            <span className="text-cyan-400 flex items-center gap-1 uppercase tracking-widest text-[10px] font-bold border border-cyan-500/10 bg-cyan-500/5 px-2 py-0.5 rounded-full">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Approved
                            </span>
                          ) : app.status === 'rejected' ? (
                            <span className="text-red-400 uppercase tracking-widest text-[10px] font-bold border border-red-500/10 bg-red-500/5 px-2 py-0.5 rounded-full">
                              Declined
                            </span>
                          ) : (
                            <span className="text-amber-400 flex items-center gap-1 uppercase tracking-widest text-[10px] font-bold border border-amber-500/10 bg-amber-500/5 px-2 py-0.5 rounded-full">
                              <Clock className="w-3.5 h-3.5" /> Pending Verification
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-xs font-mono text-slate-500 italic text-center py-4">
                  You have not submitted any enrollment forms yet. Head to "Explore Courses" to enroll!
                </div>
              )}
            </div>

            {/* Secure verify/awards link */}
            <div className="bg-[#050505]/70 border border-cyan-500/10 rounded-2xl p-5 space-y-4">
              <h3 className="text-xs font-bold text-[#22d3ee] font-mono tracking-wider uppercase border-b border-cyan-500/5 pb-2 flex items-center gap-2">
                <Award className="w-4 h-4 text-cyan-400" /> My Issued Certificates
              </h3>

              {myCertificates.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {myCertificates.map(cert => (
                    <div 
                      key={cert.id}
                      className="p-4 rounded-xl bg-gradient-to-br from-[#0a1a1f] to-black border border-cyan-500/20 flex flex-col justify-between space-y-3"
                    >
                      <div>
                        <span className="text-[9px] font-mono text-cyan-400 block font-bold">CODE: {cert.id}</span>
                        <h4 className="text-xs font-bold text-white tracking-wide mt-1">{cert.courseTitle}</h4>
                        <p className="text-[10px] text-slate-400 font-sans mt-1">Issuer: {cert.trainerName}</p>
                      </div>

                      <div className="pt-2 border-t border-cyan-500/5 flex justify-between items-center text-xs font-mono">
                        <span className="text-[10px] text-slate-500">{cert.issueDate}</span>
                        <span className="text-cyan-400 text-3xs font-bold font-sans animate-pulse">
                          Ready in Verifications
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-xs font-mono text-slate-500 italic text-center py-4">
                  No performance awards published yet. Once the trainer grading cycle finishes in August, they are safe to print.
                </div>
              )}
            </div>

          </div>

        </div>
      ) : (
        <SyllabusExplorer courses={courses} applications={applications} />
      )}
        </motion.div>
      </AnimatePresence>

    </div>
  );
}
