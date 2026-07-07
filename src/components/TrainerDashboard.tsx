import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Users, Award, Percent, Printer, FileText, CheckCircle2, Bookmark, Check, ShieldCheck, BookOpen, User, Mail, Phone, Briefcase, MapPin } from 'lucide-react';
import { StudentUser, StudentGroup, Course, CourseApplication, Certificate, TrainerUser } from '../types';
import { DakshyamDatabase } from '../utils/db';
import TrainerGuide from './TrainerGuide';
import { BeautifulErrorDisplay } from '../utils/errorShield';

interface TrainerDashboardProps {
  trainer: TrainerUser;
  students: StudentUser[];
  courses: Course[];
  groups: StudentGroup[];
  applications: CourseApplication[];
  certificates: Certificate[];
  onRefresh: () => void;
  theme?: 'light' | 'dark';
}

export default function TrainerDashboard({
  trainer,
  students,
  courses,
  groups,
  applications,
  certificates,
  onRefresh,
  theme = 'dark'
}: TrainerDashboardProps) {
  const isLight = theme === 'light';
  // Navigation states inside dashboard
  const [activeTab, setActiveTab] = useState<'groups' | 'assessment' | 'certificates' | 'guide' | 'profile'>('groups');

  // Trainer Profile States
  const [phone, setPhone] = useState(trainer.profile?.phone || '');
  const [qualification, setQualification] = useState(trainer.profile?.qualification || '');
  const [specialization, setSpecialization] = useState(trainer.profile?.specialization || '');
  const [experienceYears, setExperienceYears] = useState(trainer.profile?.experienceYears || '');
  const [institution, setInstitution] = useState(trainer.profile?.institution || '');
  const [bio, setBio] = useState(trainer.profile?.bio || '');
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError, setProfileError] = useState('');

  // Group creation form states
  const [groupName, setGroupName] = useState('');
  const [projectTitle, setProjectTitle] = useState('');
  const [projectDesc, setProjectDesc] = useState('');
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [groupError, setGroupError] = useState('');
  const [groupSuccess, setGroupSuccess] = useState('');

  // Assessment form states
  const [selectedGroupIdForGrading, setSelectedGroupIdForGrading] = useState<string>('');
  const [newPoints, setNewPoints] = useState<number>(80);
  const [gradeSuccess, setGradeSuccess] = useState('');

  // Certificate generation form states
  const [selectedAppIdForCert, setSelectedAppIdForCert] = useState<string>('');
  const [certProjectTitle, setCertProjectTitle] = useState('');
  const [certCustomLogoUrl, setCertCustomLogoUrl] = useState<string>('');
  const [certCustomSealUrl, setCertCustomSealUrl] = useState<string>('');
  const [certTrainingPartnerName, setCertTrainingPartnerName] = useState<string>('');
  const [certTrainingPartnerLogoUrl, setCertTrainingPartnerLogoUrl] = useState<string>('');
  const [certError, setCertError] = useState('');
  const [certSuccess, setCertSuccess] = useState('');

  // CREATE GROUP HANDLER
  const handleCreateGroup = (e: React.FormEvent) => {
    e.preventDefault();
    setGroupError('');
    setGroupSuccess('');

    if (!groupName.trim() || !projectTitle.trim() || selectedMemberIds.length === 0) {
      setGroupError('Fill in Group name, project title, and select at least one student.');
      return;
    }

    try {
      const allGroups = DakshyamDatabase.getGroups();
      const newGroup: StudentGroup = {
        id: `grp-${Date.now()}`,
        name: groupName,
        projectTitle,
        projectDescription: projectDesc,
        memberIds: selectedMemberIds,
        points: 75, // default
        trainerId: trainer.id,
        createdAt: new Date().toISOString().split('T')[0]
      };

      allGroups.push(newGroup);
      DakshyamDatabase.saveGroups(allGroups);

      setGroupSuccess(`🚀 ${groupName} established successfully! Now assign points in the Assessment Matrix.`);
      setGroupName('');
      setProjectTitle('');
      setProjectDesc('');
      setSelectedMemberIds([]);
      onRefresh();
    } catch (err: any) {
      setGroupError(err?.message || 'Failed creating new group node.');
    }
  };

  // AWARD POINTS/GRADES
  const handleAssignPoints = (e: React.FormEvent) => {
    e.preventDefault();
    setGradeSuccess('');

    if (!selectedGroupIdForGrading) {
      alert('Select a group to grade.');
      return;
    }

    try {
      const allGroups = DakshyamDatabase.getGroups();
      const match = allGroups.find(g => g.id === selectedGroupIdForGrading);
      if (match) {
        match.points = Number(newPoints);
        DakshyamDatabase.saveGroups(allGroups);
        setGradeSuccess(`✓ Assigned ${newPoints} PTS successfully! Rankings and leaderboard updated.`);
        setTimeout(() => setGradeSuccess(''), 2000);
        onRefresh();
      }
    } catch {
      alert('Error updating score record.');
    }
  };

  // GENERATE CERTIFICATE HANDLER
  const handleGenerateCertificate = (e: React.FormEvent) => {
    e.preventDefault();
    setCertError('');
    setCertSuccess('');

    if (!selectedAppIdForCert || !certProjectTitle.trim()) {
      setCertError('Please select an applicant and specify their major project design title.');
      return;
    }

    try {
      const apps = DakshyamDatabase.getApplications();
      const appMatch = apps.find(a => a.id === selectedAppIdForCert);
      
      if (!appMatch) {
         setCertError('Application record trace missing.');
         return;
      }

      const allCerts = DakshyamDatabase.getCertificates();
      const randomId = `DKM-2026-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

      const newCert: Certificate = {
        id: randomId,
        studentName: appMatch.fullName,
        studentEmail: appMatch.email,
        courseTitle: courses.find(c => c.id === appMatch.courseId)?.title || 'Advanced Technology Sector',
        projectTitle: certProjectTitle,
        issueDate: new Date().toISOString().split('T')[0],
        trainerId: trainer.id,
        trainerName: trainer.name,
        customLogoUrl: certCustomLogoUrl || undefined,
        customSealUrl: certCustomSealUrl || undefined,
        trainingPartnerName: certTrainingPartnerName.trim() || undefined,
        trainingPartnerLogoUrl: certTrainingPartnerLogoUrl || undefined
      };

      allCerts.push(newCert);
      DakshyamDatabase.saveCertificates(allCerts);

      // Approve application immediately
      appMatch.status = 'approved';
      DakshyamDatabase.saveApplications(apps);

      setCertSuccess(`✓ Credential code ${randomId} fully published to student workspace!`);
      setSelectedAppIdForCert('');
      setCertProjectTitle('');
      setCertCustomLogoUrl('');
      setCertCustomSealUrl('');
      setCertTrainingPartnerName('');
      setCertTrainingPartnerLogoUrl('');
      onRefresh();
    } catch (err: any) {
      setCertError(err?.message || 'Database transaction error.');
    }
  };

  // Printing dynamic report cards
  const handlePrintSheet = () => {
    window.print();
  };

  const handleUpdateTrainerProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSuccess('');
    setProfileError('');

    try {
      const trainers = DakshyamDatabase.getTrainers();
      const idx = trainers.findIndex(t => t.id === trainer.id);
      if (idx !== -1) {
        trainers[idx].profile = {
          phone,
          qualification,
          specialization,
          experienceYears,
          institution,
          bio
        };
        DakshyamDatabase.saveTrainers(trainers);
        DakshyamDatabase.setLoggedInUser(trainers[idx]);
        setProfileSuccess('✓ Profile parameters updated and synchronized with Board systems!');
        setTimeout(() => setProfileSuccess(''), 4000);
        onRefresh();
      } else {
        setProfileError('Failed to locate corresponding trainer record node.');
      }
    } catch (err: any) {
      setProfileError(err?.message || 'Error updating profile.');
    }
  };

  const myCreatedGroups = groups.filter(g => g.trainerId === trainer.id);
  const eligibleApplicants = applications.filter(app => app.status === 'pending');

  return (
    <div className="space-y-6 text-left max-w-4xl mx-auto">
      
      {/* 1. Header welcome */}
      <div className={`border p-6 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative overflow-hidden transition-all duration-300 ${
        isLight 
          ? 'bg-gradient-to-r from-amber-500/5 to-slate-50 border-slate-200 shadow-sm' 
          : 'bg-gradient-to-r from-slate-950 to-emerald-950/10 border-cyan-500/15'
      }`}>
        <div className="absolute top-0 right-0 h-full w-48 bg-radial from-cyan-500/5 to-transparent blur-xl pointer-events-none" />
        <div className="space-y-1">
          <span className={`text-[9px] font-mono tracking-widest uppercase ${
            isLight ? 'text-amber-800 font-bold' : 'text-cyan-400'
          }`}>Lead Trainer Workspace</span>
          <h1 className={`text-xl font-black tracking-wide uppercase ${
            isLight ? 'text-slate-900' : 'text-white'
          }`}>{trainer.name}</h1>
          <p className={`text-xs font-sans ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>Active Supervisor • {trainer.email}</p>
        </div>

        <button
          onClick={handlePrintSheet}
          className={`flex items-center gap-1.5 font-bold text-xs px-4.5 py-2.5 rounded-xl cursor-pointer active:scale-95 transition-all self-stretch md:self-auto justify-center ${
            isLight 
              ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-sm' 
              : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 hover:shadow-[0_0_12px_rgba(34,211,238,0.22)]'
          }`}
        >
          <Printer className="w-4 h-4" /> Export Class Standings
        </button>
      </div>

      {/* Selector Tabs */}
      <div className={`flex flex-wrap gap-1.5 border-b pb-0.5 font-mono text-2xs uppercase ${
        isLight ? 'border-slate-200' : 'border-cyan-500/10'
      }`}>
        {(['groups', 'assessment', 'certificates', 'guide', 'profile'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 rounded-t-xl transition-all border-t border-x cursor-pointer ${
              activeTab === tab
                ? (isLight ? 'bg-white border-slate-250 text-amber-800 font-bold border-b-white z-10' : 'bg-[#050505]/70 border-cyan-500/15 text-[#22d3ee] font-bold')
                : (isLight ? 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100/50' : 'border-transparent text-slate-400 hover:text-white hover:bg-slate-500/5')
            }`}
          >
            {tab === 'groups' ? 'Group Builder' : tab === 'assessment' ? 'Assessment Matrix' : tab === 'certificates' ? 'Publish Certificates' : tab === 'guide' ? '📖 Curriculum Guides' : '👤 Profile Details'}
          </button>
        ))}
      </div>

      {/* Tab Panels */}
      <div className={`rounded-2xl p-5 md:p-6 border transition-all duration-300 overflow-hidden ${
        isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#050505]/60 border-cyan-500/10 backdrop-blur-md'
      }`}>
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
          >
        
        {/* TAB 1: GROUP BUILDER */}
        {activeTab === 'groups' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-left">
            
            {/* Form */}
            <form onSubmit={handleCreateGroup} className="space-y-4">
              <h3 className={`text-xs font-bold font-mono tracking-wider uppercase border-b pb-2 ${
                isLight ? 'text-amber-800 border-slate-100' : 'text-[#22d3ee] border-cyan-500/5'
              }`}>
                Establish Student Group Node
              </h3>

              <BeautifulErrorDisplay errorText={groupError} isLight={isLight} />
              {groupSuccess && <div className={`text-xs font-mono font-bold ${isLight ? 'text-emerald-700' : 'text-cyan-400'}`}>{groupSuccess}</div>}

              <div>
                <label className={`block text-3xs font-mono uppercase mb-1 ${isLight ? 'text-amber-800 font-bold' : 'text-cyan-400'}`}>Group Name</label>
                <input
                  type="text"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="e.g. Balaghat Robo Pioneers"
                  className={`w-full rounded-xl px-3 py-2.5 text-xs focus:outline-none border ${
                    isLight 
                      ? 'bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400 focus:border-amber-500' 
                      : 'bg-[#111]/80 border-cyan-500/10 text-white placeholder-slate-500 focus:border-cyan-45'
                  }`}
                />
              </div>

              <div>
                <label className={`block text-3xs font-mono uppercase mb-1 ${isLight ? 'text-amber-800 font-bold' : 'text-cyan-400'}`}>Project Research Title</label>
                <input
                  type="text"
                  value={projectTitle}
                  onChange={(e) => setProjectTitle(e.target.value)}
                  placeholder="e.g. RFID Smart Attendance System"
                  className={`w-full rounded-xl px-3 py-2.5 text-xs focus:outline-none border ${
                    isLight 
                      ? 'bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400 focus:border-amber-500' 
                      : 'bg-[#111]/80 border-cyan-500/10 text-white placeholder-slate-500 focus:border-cyan-45'
                  }`}
                />
              </div>

              <div>
                <label className={`block text-3xs font-mono uppercase mb-1 ${isLight ? 'text-amber-800 font-bold' : 'text-cyan-400'}`}>Brief Description (Objectives)</label>
                <textarea
                  value={projectDesc}
                  onChange={(e) => setProjectDesc(e.target.value)}
                  placeholder="Objectives, microcontroller details or frameworks integrated..."
                  rows={2}
                  className={`w-full rounded-xl px-3 py-2.5 text-xs focus:outline-none border ${
                    isLight 
                      ? 'bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400 focus:border-amber-500' 
                      : 'bg-[#111]/80 border-cyan-500/10 text-white placeholder-slate-500 focus:border-cyan-45'
                  }`}
                />
              </div>

              {/* Multiple Members Selector checkboxes */}
              <div>
                <label className={`block text-3xs font-mono uppercase mb-1.5 ${isLight ? 'text-amber-800 font-bold' : 'text-cyan-400'}`}>Select Student Members</label>
                <div className={`border rounded-xl p-3 max-h-36 overflow-y-auto space-y-2 ${
                  isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#111]/65 border-cyan-500/10'
                }`}>
                  {students.map(std => {
                    const isChecked = selectedMemberIds.includes(std.id);
                    return (
                      <label key={std.id} className="flex items-center gap-2 text-xs cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {
                            if (isChecked) {
                              setSelectedMemberIds(selectedMemberIds.filter(id => id !== std.id));
                            } else {
                              setSelectedMemberIds([...selectedMemberIds, std.id]);
                            }
                          }}
                          className={`rounded ${
                            isLight 
                              ? 'border-slate-300 text-amber-600 focus:ring-amber-500/20' 
                              : 'border-cyan-500/10 text-cyan-500 focus:ring-cyan-500/20'
                          }`}
                        />
                        <span className={isLight ? 'text-slate-700 font-medium' : 'text-slate-300'}>
                          {std.name} <strong className="text-slate-400 dark:text-slate-500 font-normal">({std.profile?.institution || 'General'})</strong>
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <button
                type="submit"
                className={`w-full font-bold text-xs py-2.5 rounded-xl cursor-pointer transition-all uppercase border ${
                  isLight 
                    ? 'bg-amber-600 hover:bg-amber-700 text-white border-amber-600 shadow-sm active:scale-98' 
                    : 'bg-cyan-500 hover:bg-cyan-450 text-slate-950 border-cyan-500'
                }`}
              >
                Assemble Team & Project
              </button>
            </form>

            {/* List of my created groups */}
            <div className="space-y-4">
              <h3 className={`text-xs font-bold font-mono tracking-wider uppercase border-b pb-2 ${
                isLight ? 'text-amber-800 border-slate-100' : 'text-[#22d3ee] border-cyan-500/5'
              }`}>
                Active Supervised Groups ({myCreatedGroups.length})
              </h3>

              <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                {myCreatedGroups.map(gp => {
                  const memberNames = students
                    .filter(s => gp.memberIds.includes(s.id))
                    .map(s => s.name)
                    .join(', ');

                  return (
                    <div 
                      key={gp.id}
                      className={`p-4 rounded-xl border transition-all text-left space-y-1.5 ${
                        isLight 
                          ? 'bg-slate-50/50 border-slate-200/60 hover:border-amber-500/20 shadow-xs' 
                          : 'bg-[#111]/40 border-cyan-500/5 hover:border-cyan-500/15'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <h4 className={`text-xs font-black uppercase ${isLight ? 'text-slate-900' : 'text-white'}`}>{gp.name}</h4>
                        <span className={`text-2xs font-mono px-2.5 py-0.5 rounded-full font-bold border ${
                          isLight 
                            ? 'text-amber-800 bg-amber-50 border-amber-500/20' 
                            : 'text-cyan-400 bg-cyan-950/20 border-cyan-500/10'
                        }`}>
                          {gp.points} PTS
                        </span>
                      </div>
                      <div className={`text-2xs space-y-1 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                        <div><strong className={isLight ? 'text-slate-800' : 'text-slate-200'}>Project:</strong> "{gp.projectTitle}"</div>
                        <div><strong className={isLight ? 'text-slate-800' : 'text-slate-200'}>Team:</strong> {memberNames}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        )}

        {/* TAB 2: ASSESSMENT MATRIX */}
        {activeTab === 'assessment' && (
          <div className="max-w-xl mx-auto space-y-5 text-left">
            <h3 className={`text-xs font-bold font-mono tracking-wider uppercase border-b pb-2 ${
              isLight ? 'text-amber-800 border-slate-100' : 'text-[#22d3ee] border-cyan-500/5'
            }`}>
              Performance assessment Deck
            </h3>

            <p className={`text-xs font-sans ${isLight ? 'text-slate-650' : 'text-slate-400'}`}>
              Award scores directly to student project teams. Points are calculated toward rankings and published on the live leaderboard.
            </p>

            {gradeSuccess && (
              <div className={`border rounded-xl p-3 text-xs font-mono text-center font-bold ${
                isLight ? 'bg-emerald-50 border-emerald-500/20 text-emerald-800' : 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400'
              }`}>
                {gradeSuccess}
              </div>
            )}

            <form onSubmit={handleAssignPoints} className={`space-y-4 p-5 rounded-2xl border ${
              isLight ? 'bg-slate-50/50 border-slate-200 shadow-sm' : 'bg-[#111]/45 border-cyan-500/5'
            }`}>
              <div>
                <label className={`block text-3xs font-mono uppercase mb-1 ${isLight ? 'text-amber-800 font-bold' : 'text-cyan-400'}`}>Select Group Node</label>
                <select
                  value={selectedGroupIdForGrading}
                  onChange={(e) => setSelectedGroupIdForGrading(e.target.value)}
                  required
                  className={`w-full rounded-xl px-3 py-2.5 text-xs focus:outline-none border ${
                    isLight 
                      ? 'bg-white border-slate-200 text-slate-800 focus:border-amber-500' 
                      : 'bg-[#111]/80 border-cyan-500/10 text-white focus:border-cyan-45'
                  }`}
                >
                  <option value="">-- Select Team --</option>
                  {myCreatedGroups.map(gp => (
                    <option key={gp.id} value={gp.id}>{gp.name} (Current: {gp.points} pts)</option>
                  ))}
                </select>
              </div>

              <div>
                <label className={`block text-3xs font-mono uppercase mb-1 ${isLight ? 'text-amber-800 font-bold' : 'text-cyan-400'}`}>Award Points (0 - 100)</label>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min="10"
                    max="100"
                    value={newPoints}
                    onChange={(e) => setNewPoints(Number(e.target.value))}
                    className={`flex-1 ${isLight ? 'accent-amber-600' : 'accent-cyan-400'}`}
                  />
                  <span className={`text-lg font-black font-mono min-w-12 text-center border px-3 py-1 rounded-xl ${
                    isLight 
                      ? 'bg-amber-50 border-amber-500/20 text-amber-900' 
                      : 'bg-cyan-950/40 border-cyan-500/10 text-white'
                  }`}>
                    {newPoints} XP
                  </span>
                </div>
              </div>

              <button
                type="submit"
                className={`w-full font-bold text-xs py-2.5 rounded-xl cursor-pointer border ${
                  isLight 
                    ? 'bg-amber-600 hover:bg-amber-700 border-amber-600 text-white shadow-sm' 
                    : 'bg-cyan-500 hover:bg-cyan-450 border-cyan-500 text-slate-950'
                }`}
              >
                Record Grade Matrix
              </button>
            </form>
          </div>
        )}

        {/* TAB 3: PUBLISH DECK CERTIFICATE */}
        {activeTab === 'certificates' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-left">
            
            {/* Cert Generator Form */}
            <form onSubmit={handleGenerateCertificate} className="space-y-4">
              <h3 className={`text-xs font-bold font-mono tracking-wider uppercase border-b pb-2 flex items-center gap-1.5 ${
                isLight ? 'text-amber-800 border-slate-150' : 'text-[#22d3ee] border-cyan-500/5'
              }`}>
                <Award className={`w-4 h-4 ${isLight ? 'text-amber-600' : 'text-cyan-400'}`} /> Issue Credential Serializer
              </h3>

              <BeautifulErrorDisplay errorText={certError} isLight={isLight} />
              {certSuccess && <div className={`text-xs font-mono font-bold ${isLight ? 'text-emerald-700' : 'text-cyan-400'}`}>{certSuccess}</div>}

              <div>
                <label className={`block text-3xs font-mono uppercase mb-1 ${isLight ? 'text-amber-800 font-bold' : 'text-cyan-400'}`}>Select Student Applicant</label>
                <select
                  value={selectedAppIdForCert}
                  onChange={(e) => setSelectedAppIdForCert(e.target.value)}
                  required
                  className={`w-full rounded-xl px-3 py-2.5 text-xs focus:outline-none border ${
                    isLight 
                      ? 'bg-slate-50 border-slate-200 text-slate-800 focus:border-amber-500' 
                      : 'bg-[#111]/80 border-cyan-500/10 text-white focus:border-cyan-45'
                  }`}
                >
                  <option value="">-- Choose Applicant --</option>
                  {eligibleApplicants.map(app => {
                    const courseName = courses.find(c => c.id === app.courseId)?.title || 'Training Sector';
                    return (
                      <option key={app.id} value={app.id}>
                        {app.fullName} ({courseName})
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label className={`block text-3xs font-mono uppercase mb-1 ${isLight ? 'text-amber-800 font-bold' : 'text-cyan-400'}`}>Major Development / Project Title</label>
                <input
                  type="text"
                  value={certProjectTitle}
                  onChange={(e) => setCertProjectTitle(e.target.value)}
                  placeholder="e.g. Smart Agri Moisture Controller System"
                  required
                  className={`w-full rounded-xl px-3 py-2.5 text-xs focus:outline-none border ${
                    isLight 
                      ? 'bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400 focus:border-amber-500' 
                      : 'bg-[#111]/80 border-cyan-500/10 text-white placeholder-slate-500 focus:border-cyan-45'
                  }`}
                />
              </div>

              {/* Customizable Branding and Partners for Trainer too! */}
              <div className={`border-t pt-3 space-y-3 ${isLight ? 'border-slate-150' : 'border-cyan-500/10'}`}>
                <h4 className={`text-[10px] font-mono uppercase tracking-widest font-extrabold text-left ${
                  isLight ? 'text-amber-900' : 'text-cyan-400'
                }`}>Custom Branding & Partnership Options</h4>
                
                <div className="grid grid-cols-2 gap-3 text-left">
                  {/* Custom Logo Upload */}
                  <div>
                    <label className={`block text-[8px] font-mono uppercase mb-1 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>Custom Issuer Logo</label>
                    <div className="relative">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const r = new FileReader();
                            r.onloadend = () => setCertCustomLogoUrl(r.result as string);
                            r.readAsDataURL(file);
                          }
                        }}
                        className="hidden"
                        id="trainer-logo-upload"
                      />
                      <label
                        htmlFor="trainer-logo-upload"
                        className={`flex items-center justify-center gap-1 border text-[9px] font-semibold py-1.5 px-2 rounded-lg cursor-pointer transition-all uppercase ${
                          isLight 
                            ? 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700' 
                            : 'bg-black/40 border-slate-500/10 hover:border-cyan-500/30 text-slate-300'
                        }`}
                      >
                        {certCustomLogoUrl ? "✓ Logo Loaded" : "Upload Logo"}
                      </label>
                    </div>
                    {certCustomLogoUrl && (
                      <button
                        type="button"
                        onClick={() => setCertCustomLogoUrl("")}
                        className="text-[8px] text-red-500 hover:underline mt-1 block"
                      >
                        Remove Logo
                      </button>
                    )}
                  </div>

                  {/* Custom Seal Upload */}
                  <div>
                    <label className={`block text-[8px] font-mono uppercase mb-1 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>Custom Seal Image</label>
                    <div className="relative">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const r = new FileReader();
                            r.onloadend = () => setCertCustomSealUrl(r.result as string);
                            r.readAsDataURL(file);
                          }
                        }}
                        className="hidden"
                        id="trainer-seal-upload"
                      />
                      <label
                        htmlFor="trainer-seal-upload"
                        className={`flex items-center justify-center gap-1 border text-[9px] font-semibold py-1.5 px-2 rounded-lg cursor-pointer transition-all uppercase ${
                          isLight 
                            ? 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700' 
                            : 'bg-black/40 border-slate-500/10 hover:border-cyan-500/30 text-slate-300'
                        }`}
                      >
                        {certCustomSealUrl ? "✓ Seal Loaded" : "Upload Seal"}
                      </label>
                    </div>
                    {certCustomSealUrl && (
                      <button
                        type="button"
                        onClick={() => setCertCustomSealUrl("")}
                        className="text-[8px] text-red-500 hover:underline mt-1 block"
                      >
                        Remove Seal
                      </button>
                    )}
                  </div>
                </div>

                {/* Training Partner */}
                <div className="space-y-2 text-left">
                  <div>
                    <label className={`block text-[8px] font-mono uppercase mb-1 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>Training Partner Name (Optional)</label>
                    <input
                      type="text"
                      value={certTrainingPartnerName}
                      onChange={(e) => setCertTrainingPartnerName(e.target.value)}
                      placeholder="e.g. State Science Council"
                      className={`w-full rounded-xl px-3 py-1.5 text-xs focus:outline-none border ${
                        isLight 
                          ? 'bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400 focus:border-amber-500' 
                          : 'w-full bg-[#111]/80 border border-[#22d3ee]/10 text-white placeholder-slate-500 focus:border-cyan-400 text-slate-350'
                      }`}
                    />
                  </div>

                  {certTrainingPartnerName && (
                    <div>
                      <label className={`block text-[8px] font-mono uppercase mb-1 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>Partner Logo (Optional)</label>
                      <div className="relative">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const r = new FileReader();
                              r.onloadend = () => setCertTrainingPartnerLogoUrl(r.result as string);
                              r.readAsDataURL(file);
                            }
                          }}
                          className="hidden"
                          id="trainer-partner-logo-upload"
                        />
                        <label
                          htmlFor="trainer-partner-logo-upload"
                          className={`flex items-center justify-center gap-1 border text-[9px] font-semibold py-1.5 px-2 rounded-lg cursor-pointer transition-all uppercase ${
                            isLight 
                              ? 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700' 
                              : 'bg-black/40 border-slate-500/10 hover:border-cyan-500/30 text-slate-300'
                          }`}
                        >
                          {certTrainingPartnerLogoUrl ? "✓ Partner Logo Loaded" : "Upload Partner Logo"}
                        </label>
                      </div>
                      {certTrainingPartnerLogoUrl && (
                        <button
                          type="button"
                          onClick={() => setCertTrainingPartnerLogoUrl("")}
                          className="text-[8px] text-red-500 hover:underline mt-1 block"
                        >
                          Remove Partner Logo
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className={`p-3 border rounded-xl text-3xs leading-relaxed space-y-1 ${
                isLight ? 'bg-amber-500/5 border-amber-500/10 text-slate-600' : 'bg-[#111]/50 border-cyan-500/5 text-slate-400'
              }`}>
                <div className={`font-semibold ${isLight ? 'text-slate-800' : 'text-slate-300'}`}>AUTHORITY CLAUSE:</div>
                <p>Generating this credential locks the record into the immutable directory query. It registers signatures and permits official student export packages.</p>
              </div>

              <button
                type="submit"
                className={`w-full font-bold text-xs py-2.5 rounded-xl cursor-pointer border ${
                  isLight 
                    ? 'bg-amber-600 hover:bg-amber-700 border-amber-600 text-white shadow-sm' 
                    : 'bg-cyan-500 hover:bg-cyan-450 border-cyan-500 text-slate-950'
                }`}
              >
                Sign & Emit Digital Certificate
              </button>
            </form>

            {/* List of Issued Certs */}
            <div className="space-y-4">
              <h3 className={`text-xs font-bold font-mono tracking-wider uppercase border-b pb-2 ${
                isLight ? 'text-amber-800 border-slate-150' : 'text-[#22d3ee] border-cyan-500/5'
              }`}>
                Published Certificates Log ({certificates.length})
              </h3>

              <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
                {certificates.map(cert => (
                  <div 
                    key={cert.id}
                    className={`p-3 rounded-xl border text-left text-2xs space-y-1 ${
                      isLight 
                        ? 'bg-slate-50/50 border-slate-200/60' 
                        : 'bg-[#111]/45 border-cyan-500/5'
                    }`}
                  >
                    <div className="flex justify-between items-center text-3xs font-mono">
                      <span className={`font-bold ${isLight ? 'text-amber-800' : 'text-[#22d3ee]'}`}>{cert.id}</span>
                      <span className="text-slate-500">{cert.issueDate}</span>
                    </div>
                    <div className={`font-semibold ${isLight ? 'text-slate-800' : 'text-slate-300'}`}>{cert.studentName}</div>
                    <div className={`text-3xs block italic ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Project: "{cert.projectTitle}"</div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* TAB 4: TRAINER SYLLABUS & KNOWLEDGE KITS GUIDE */}
        {activeTab === 'guide' && (
          <TrainerGuide theme={theme} />
        )}

        {/* TAB 5: TRAINER PROFILE SETTINGS & BADGE CARD */}
        {activeTab === 'profile' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 text-left">
            
            {/* Form Editor */}
            <div className="lg:col-span-2 space-y-6">
              <div className={`border rounded-2xl p-5 md:p-6 space-y-4 ${
                isLight ? 'bg-slate-50/50 border-slate-200' : 'bg-black/45 border-cyan-500/10'
              }`}>
                <div>
                  <h3 className={`text-sm font-black font-mono tracking-wider uppercase ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    Update Trainer Profile Credentials
                  </h3>
                  <p className={`text-3xs font-sans leading-relaxed mt-1 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                    Your profile values specify your center location and credential parameters printed onto generated student performance certificates.
                  </p>
                </div>

                {profileSuccess && (
                  <div className={`p-3 border font-mono text-2xs font-semibold rounded-xl text-center ${
                    isLight ? 'bg-emerald-50 border-emerald-500/20 text-emerald-800' : 'bg-emerald-950/20 border-emerald-500/30 text-emerald-400'
                  }`}>
                    {profileSuccess}
                  </div>
                )}
                
                <BeautifulErrorDisplay errorText={profileError} isLight={isLight} />

                <form onSubmit={handleUpdateTrainerProfile} className="space-y-4 font-sans text-xs">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    
                    {/* Phone */}
                    <div className="space-y-1">
                      <label className={`block text-[10px] font-mono uppercase tracking-wider ${
                        isLight ? 'text-amber-800 font-bold' : 'text-cyan-400'
                      }`}>Mobile / Contact Number</label>
                      <div className="relative">
                        <Phone className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3" />
                        <input
                          type="text"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="+91 WhatsApp Contact"
                          className={`w-full border rounded-xl pl-9 pr-3 py-2.5 tracking-wide placeholder:text-slate-400 focus:outline-none ${
                            isLight 
                              ? 'bg-white border-slate-200 text-slate-800 focus:border-amber-500' 
                              : 'bg-black/60 border-cyan-500/15 text-white placeholder:text-slate-600 focus:border-cyan-400'
                          }`}
                        />
                      </div>
                    </div>

                    {/* Center Location */}
                    <div className="space-y-1">
                      <label className={`block text-[10px] font-mono uppercase tracking-wider ${
                        isLight ? 'text-amber-800 font-bold' : 'text-cyan-400'
                      }`}>Designated Training Center</label>
                      <div className="relative">
                        <MapPin className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3" />
                        <input
                          type="text"
                          value={institution}
                          onChange={(e) => setInstitution(e.target.value)}
                          placeholder="e.g. Govt Dev Center Balaghat"
                          className={`w-full border rounded-xl pl-9 pr-3 py-2.5 tracking-wide placeholder:text-slate-400 focus:outline-none ${
                            isLight 
                              ? 'bg-white border-slate-200 text-slate-800 focus:border-amber-500' 
                              : 'bg-black/60 border-cyan-500/15 text-white placeholder:text-slate-600 focus:border-cyan-400'
                          }`}
                        />
                      </div>
                    </div>

                    {/* Qualification */}
                    <div className="space-y-1">
                      <label className={`block text-[10px] font-mono uppercase tracking-wider ${
                        isLight ? 'text-amber-800 font-bold' : 'text-cyan-400'
                      }`}>Academic Qualification</label>
                      <div className="relative">
                        <Bookmark className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3" />
                        <input
                          type="text"
                          value={qualification}
                          onChange={(e) => setQualification(e.target.value)}
                          placeholder="e.g. B.Tech ECE, NIT Bhopal"
                          className={`w-full border rounded-xl pl-9 pr-3 py-2.5 tracking-wide placeholder:text-slate-400 focus:outline-none ${
                            isLight 
                              ? 'bg-white border-slate-200 text-slate-800 focus:border-amber-500' 
                              : 'bg-black/60 border-cyan-500/15 text-white placeholder:text-slate-600 focus:border-cyan-400'
                          }`}
                        />
                      </div>
                    </div>

                    {/* Specialization */}
                    <div className="space-y-1">
                      <label className={`block text-[10px] font-mono uppercase tracking-wider ${
                        isLight ? 'text-amber-800 font-bold' : 'text-cyan-400'
                      }`}>Specialization Fields</label>
                      <div className="relative">
                        <Briefcase className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3" />
                        <input
                          type="text"
                          value={specialization}
                          onChange={(e) => setSpecialization(e.target.value)}
                          placeholder="e.g. IoT Architecture, Robotics"
                          className={`w-full border rounded-xl pl-9 pr-3 py-2.5 tracking-wide placeholder:text-slate-400 focus:outline-none ${
                            isLight 
                              ? 'bg-white border-slate-200 text-slate-800 focus:border-amber-500' 
                              : 'bg-black/60 border-cyan-500/15 text-white placeholder:text-slate-600 focus:border-cyan-400'
                          }`}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Years of Experience */}
                    <div className="space-y-1 md:col-span-1">
                      <label className={`block text-[10px] font-mono uppercase tracking-wider ${
                        isLight ? 'text-amber-800 font-bold' : 'text-cyan-400'
                      }`}>Years of Experience</label>
                      <input
                        type="text"
                        value={experienceYears}
                        onChange={(e) => setExperienceYears(e.target.value)}
                        placeholder="e.g. 5+ Years"
                        className={`w-full border rounded-xl px-3 py-2.5 tracking-wide placeholder:text-slate-400 focus:outline-none ${
                          isLight 
                            ? 'bg-white border-slate-200 text-slate-800 focus:border-amber-500' 
                            : 'bg-black/60 border-cyan-500/15 text-white placeholder:text-slate-600 focus:border-cyan-400'
                        }`}
                      />
                    </div>

                    {/* Fixed Trainer Email Indicator */}
                    <div className="space-y-1 md:col-span-2">
                      <label className={`block text-[10px] font-mono uppercase tracking-wider ${
                        isLight ? 'text-slate-600' : 'text-slate-500'
                      }`}>Registered Board Email</label>
                      <div className="relative">
                        <Mail className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3" />
                        <input
                          type="text"
                          value={trainer.email}
                          disabled
                          className={`w-full border rounded-xl pl-9 pr-3 py-2.5 text-xs font-mono select-none ${
                            isLight 
                              ? 'bg-slate-100 border-slate-200 text-slate-500' 
                              : 'bg-slate-900/40 border-slate-800 text-slate-400'
                          }`}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Biography */}
                  <div className="space-y-1">
                    <label className={`block text-[10px] font-mono uppercase tracking-wider ${
                      isLight ? 'text-amber-800 font-bold' : 'text-cyan-400'
                    }`}>Professional Biography</label>
                    <textarea
                      rows={3}
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="Share a short background description about your teaching philosophy, labs setup, and digital literacy focus."
                      className={`w-full border rounded-xl px-3 py-2.5 tracking-wide placeholder:text-slate-400 focus:outline-none resize-none font-sans ${
                        isLight 
                          ? 'bg-white border-slate-200 text-slate-800 focus:border-amber-500' 
                          : 'bg-black/60 border-cyan-500/15 text-white placeholder:text-slate-600 focus:border-cyan-400'
                      }`}
                    />
                  </div>

                  <button
                    type="submit"
                    className={`w-full border text-xs py-2.5 rounded-xl transition-all cursor-pointer font-bold tracking-wider uppercase font-mono ${
                      isLight 
                        ? 'bg-amber-600 hover:bg-amber-700 text-white border-amber-600 shadow-sm' 
                        : 'bg-gradient-to-r from-cyan-950/40 to-cyan-800/40 border-cyan-500/30 hover:border-cyan-400 hover:bg-cyan-500/10 text-cyan-400'
                    }`}
                  >
                    Save Trainer Parameters & Sync
                  </button>
                </form>
              </div>
            </div>

            {/* Premium Badging ID Preview */}
            <div className="lg:col-span-1 space-y-4">
              <span className={`text-[9px] font-mono tracking-widest uppercase block font-bold ${
                isLight ? 'text-slate-700' : 'text-slate-500'
              }`}>Supervisor Credential Badge</span>
              
              {/* Badge Preview */}
              <div className={`relative group overflow-hidden border-2 rounded-2xl p-6 shadow-2xl relative select-text transition-all duration-300 ${
                isLight 
                  ? 'bg-gradient-to-br from-amber-50/50 via-slate-50 to-white border-slate-300 shadow-lg' 
                  : 'bg-gradient-to-br from-[#0c2a33] via-[#040d12] to-black border-cyan-500/35 shadow-2xl'
              }`}>
                {/* Tactical Corner Marks */}
                <div className={`absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 ${isLight ? 'border-amber-600' : 'border-cyan-400'}`} />
                <div className={`absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 ${isLight ? 'border-amber-600' : 'border-cyan-400'}`} />
                <div className={`absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 ${isLight ? 'border-amber-600' : 'border-cyan-400'}`} />
                <div className={`absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 ${isLight ? 'border-amber-600' : 'border-cyan-400'}`} />
                <div className={`absolute -top-10 -right-10 w-32 h-32 rounded-full blur-2xl pointer-events-none ${
                  isLight ? 'bg-amber-500/5' : 'bg-cyan-400/5'
                }`} />

                {/* ID Header */}
                <div className={`flex justify-between items-start border-b pb-4 ${isLight ? 'border-slate-200' : 'border-cyan-500/10'}`}>
                  <div className="text-left">
                    <span className={`text-[10px] font-mono block tracking-widest font-extrabold ${
                      isLight ? 'text-amber-800' : 'text-cyan-400'
                    }`}>DAKSHYAM IN</span>
                    <span className="text-[7px] font-mono text-slate-500 block uppercase font-medium">Manual Skill Enrichment Node</span>
                  </div>
                  <span className={`text-[7.5px] font-mono border px-2 py-0.5 rounded-md font-bold uppercase animate-pulse flex items-center gap-1 ${
                    isLight 
                      ? 'bg-amber-50 border-amber-400/30 text-amber-850' 
                      : 'bg-cyan-950/60 border-cyan-400/30 text-cyan-400'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full inline-block animate-ping ${isLight ? 'bg-amber-600' : 'bg-cyan-400'}`} /> Validated • Active
                  </span>
                </div>

                {/* Core Person Meta */}
                <div className="py-5 space-y-3.5 text-left">
                  <div className="space-y-0.5">
                    <span className={`text-[8px] font-mono uppercase tracking-widest block font-bold ${
                      isLight ? 'text-amber-800' : 'text-cyan-500'
                    }`}>Full Name</span>
                    <h4 className={`text-sm font-black uppercase tracking-wide ${isLight ? 'text-slate-900' : 'text-white'}`}>{trainer.name}</h4>
                  </div>

                  <div className="space-y-0.5">
                    <span className={`text-[8px] font-mono uppercase tracking-widest block font-bold ${
                      isLight ? 'text-amber-800' : 'text-cyan-500'
                    }`}>Lead Status</span>
                    <div className={`flex items-center gap-1.5 font-mono text-[10px] font-extrabold uppercase ${
                      isLight ? 'text-slate-800' : 'text-slate-200'
                    }`}>
                      <ShieldCheck className={`w-3.5 h-3.5 ${isLight ? 'text-amber-700' : 'text-cyan-400'}`} />
                      <span>Certified Board Supervisor</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div className="space-y-0.5">
                      <span className={`text-[8px] font-mono uppercase tracking-widest block font-bold ${
                        isLight ? 'text-amber-800' : 'text-cyan-500'
                      }`}>Qualification</span>
                      <p className={`text-[10px] font-sans tracking-wide leading-tight uppercase font-semibold ${
                        isLight ? 'text-slate-800' : 'text-slate-300'
                      }`}>{qualification || 'Not Spec'}</p>
                    </div>

                    <div className="space-y-0.5">
                      <span className={`text-[8px] font-mono uppercase tracking-widest block font-bold ${
                        isLight ? 'text-amber-800' : 'text-cyan-500'
                      }`}>Center Location</span>
                      <p className={`text-[10px] font-sans tracking-wide leading-tight uppercase font-semibold ${
                        isLight ? 'text-slate-800' : 'text-slate-300'
                      }`}>{institution || 'Dakshyam Gen Center'}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-0.5">
                      <span className={`text-[8px] font-mono uppercase tracking-widest block font-bold ${
                        isLight ? 'text-amber-800' : 'text-cyan-500'
                      }`}>Fields / Domain</span>
                      <p className={`text-[10px] font-sans tracking-wide leading-tight uppercase font-semibold ${
                        isLight ? 'text-slate-800' : 'text-slate-300'
                      }`}>{specialization || 'General Tech'}</p>
                    </div>

                    <div className="space-y-0.5">
                      <span className={`text-[8px] font-mono uppercase tracking-widest block font-bold ${
                        isLight ? 'text-amber-800' : 'text-cyan-500'
                      }`}>Experience</span>
                      <p className={`text-[10px] font-mono tracking-wide leading-tight uppercase font-black ${
                        isLight ? 'text-amber-850' : 'text-cyan-400'
                      }`}>{experienceYears || '0+ Years'}</p>
                    </div>
                  </div>

                  {bio && (
                    <div className={`space-y-0.5 pt-1 border-t ${isLight ? 'border-slate-200' : 'border-cyan-500/5'}`}>
                      <span className={`text-[8px] font-mono uppercase tracking-widest block font-bold ${
                        isLight ? 'text-amber-800' : 'text-cyan-500'
                      }`}>Teaching Philosophy</span>
                      <p className={`text-[9.5px] leading-normal font-sans tracking-wide select-text italic ${
                        isLight ? 'text-slate-700' : 'text-slate-400'
                      }`}>
                        "{bio}"
                      </p>
                    </div>
                  )}
                </div>

                {/* ID Footer */}
                <div className={`pt-3 border-t flex justify-between items-center text-[7.5px] font-mono ${
                  isLight ? 'border-slate-200 text-slate-500' : 'border-cyan-500/10 text-slate-500'
                }`}>
                  <span>REG ID: {trainer.id.toUpperCase()}</span>
                  <span>JOIN DATE: {trainer.createdAt}</span>
                </div>
              </div>

              <div className={`p-4 border rounded-2xl text-left text-2xs leading-relaxed font-mono ${
                isLight ? 'bg-amber-500/5 border-amber-500/10 text-slate-650' : 'bg-cyan-950/10 border-cyan-500/5 text-slate-400'
              }`}>
                <span className={`font-extrabold uppercase block mb-1 ${isLight ? 'text-amber-850' : 'text-cyan-400'}`}>Board Sync Node verified</span>
                <p>This supervisor profile card represents your official active credential recorded inside local and state training registers. All digital signatures on certificates are tracked dynamically by the Dakshyam Board office.</p>
              </div>
            </div>

          </div>
        )}
          </motion.div>
        </AnimatePresence>
      </div>

    </div>
  );
}
