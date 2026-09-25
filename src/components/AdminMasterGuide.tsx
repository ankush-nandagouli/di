import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BookOpen, Search, Shield, Award, ClipboardList, 
  GraduationCap, Users, Video, BarChart3, Settings, 
  Key, CheckCircle2, ChevronRight, Copy, Check, 
  ExternalLink, Sparkles, HelpCircle, Layers, 
  Globe, AlertTriangle, Cpu, Terminal
} from 'lucide-react';

interface AdminMasterGuideProps {
  theme?: 'light' | 'dark';
  onNavigateTab?: (tab: string) => void;
  onClose?: () => void;
}

interface GuideSection {
  id: string;
  title: string;
  badge: string;
  icon: React.ReactNode;
  summary: string;
  steps: string[];
  tips: string[];
  targetAdminTab?: string;
  shortcuts?: string[];
}

export default function AdminMasterGuide({
  theme = 'dark',
  onNavigateTab,
  onClose
}: AdminMasterGuideProps) {
  const isLight = theme === 'light';
  const [selectedSectionId, setSelectedSectionId] = useState<string>('sec-overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const sections: GuideSection[] = [
    {
      id: 'sec-overview',
      title: '1. Overview & Master Credentials',
      badge: 'Core Access',
      icon: <Key className="w-4 h-4 text-amber-400" />,
      summary: 'Dakshyam Innovations Enterprise Portal is governed by role-based permissions (Admin, Trainer, Student). The Admin console provides full programmatic oversight.',
      steps: [
        'To access Admin mode: Open the Portal tab and authenticate with the registered Admin credentials or use the secure staff unlock button.',
        'Emergency Staff Passcode: Enter your configured Admin Passcode in the challenge dialog to initiate admin session privileges.',
        'Trainer Instant Activation Code: Share the configured Trainer Registration Code with new instructors to allow immediate access without waiting for manual approval.',
        'Role Switching: The portal allows toggling between Admin, Trainer, and Student interfaces to test user experiences safely.'
      ],
      tips: [
        'All administrative changes synchronize immediately to Firestore and persist across browser tabs.',
        'Always lock or sign out of the portal when operating on public or classroom projection screens.'
      ],
      targetAdminTab: 'analytics',
      shortcuts: ['Admin Passcode: Configured via ADMIN_PASSCODE', 'Trainer Passcode: Configured via TRAINER_REG_CODE']
    },
    {
      id: 'sec-feedback',
      title: '2. Workshop Feedback & Evaluation Hub',
      badge: 'Public Surveys',
      icon: <ClipboardList className="w-4 h-4 text-sky-400" />,
      summary: 'Collect, audit, and analyze participant ratings, trainer performance, and hardware satisfaction for school and college workshops.',
      steps: [
        'Creating a Workshop: Click "Create New Workshop" inside the Workshop Feedback manager. Provide the Title, Date, Venue, and Trainer Name. The system automatically creates a clean, SEO-friendly slug (e.g., /feedback-form/iot-bootcamp-2026).',
        'Sharing with Attendees: Click "Share Links & QR". Display the full-screen QR code on your lab projector screen or copy the direct link for WhatsApp/email broadcast.',
        'Previewing the Public Form: Click "Preview Feedback Form" to test the participant submission flow without creating dummy data.',
        'Auditing Responses: View real-time feedback submissions grouped by workshop or overall metrics. Filter by institution, overall rating, or recommendation score.',
        'Data Export: Export all feedback records to clean Excel (.xlsx), CSV, JSON, or printable PDF summary reports for partner schools and accreditation boards.',
        'Closing a Workshop: Toggle the "Is Open" switch on any workshop to prevent late submissions once the bootcamp concludes.'
      ],
      tips: [
        'Attendees do NOT need an account or password to submit feedback. The link works on mobile phones, tablets, and desktops.',
        'Custom survey questions can be added or edited in the Configuration panel to collect bespoke data (e.g. "Do you want an Arduino or ESP32 kit?").'
      ],
      targetAdminTab: 'workshop_feedback',
      shortcuts: ['URL Pattern: /feedback-form/:slug', 'Alternative: /?tab=feedback&workshop=:slug']
    },
    {
      id: 'sec-security',
      title: '3. Security Suite & Anti-Tampering',
      badge: 'Enterprise Guard',
      icon: <Shield className="w-4 h-4 text-emerald-400" />,
      summary: 'Comprehensive protection against unauthorized right-clicking, source code inspection, developer tools, and data tampering.',
      steps: [
        'Developer Tools Restriction: The SecurityGuard actively intercepts keyboard shortcuts (F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U) and blocks developer tools inspection.',
        'Context Menu Guard: Right-clicks on images, source links, and protected content trigger a sleek security violation banner.',
        'Admin Security Bypass: When the admin needs to inspect the console for debugging, open the Security Control card in the Admin Dashboard and toggle "Admin Security Bypass" ON.',
        'Security Violation Telemetry: Inspect the Live Security Log in the admin panel to view timestamps and types of attempted inspection actions.'
      ],
      tips: [
        'The security guard automatically pauses whenever an authorized Admin is logged in, ensuring you are never impeded while administering the platform.',
        'Edge and Brave browser tracking shields are handled via dual-layer resilient cookie and localStorage synchronization.'
      ],
      targetAdminTab: 'logs'
    },
    {
      id: 'sec-courses',
      title: '4. Course Catalog & Syllabus Engine',
      badge: 'Academic Modules',
      icon: <BookOpen className="w-4 h-4 text-blue-400" />,
      summary: 'Configure vocational courses, hardware training curricula, duration, tags, and kit inclusion flags.',
      steps: [
        'Adding a Course: Click "Configure New Syllabus Course". Enter the Course Title, Duration (e.g., "6 Weeks - 48 Hours"), and Overview Description.',
        'Tags & Hardware Kits: Add technical tags (e.g., "ESP32", "LoRaWAN", "Raspberry Pi", "FreeRTOS") and toggle "Hardware Kit Included".',
        'Features List: Detail each module (e.g., "Soldering fundamentals", "MQTT Cloud Publishing", "Edge AI inference").',
        'Editing & Removal: Click the edit icon on any course card to update content in real-time.'
      ],
      tips: [
        'Courses marked with "Hardware Kit Included" automatically display a golden kit badge on the public Services page to boost student enrollments.'
      ],
      targetAdminTab: 'courses'
    },
    {
      id: 'sec-applications',
      title: '5. Student Admissions & Pipeline',
      badge: 'Enrollments',
      icon: <GraduationCap className="w-4 h-4 text-purple-400" />,
      summary: 'Manage prospective student applications, verify credentials, update enrollment status, and allocate lab hardware kits.',
      steps: [
        'Reviewing Applications: Navigate to the Student Applications tab to see all submissions with applicant contact numbers, emails, and school/college affiliations.',
        'Updating Status: Click on an application to move it between "Pending", "Under Review", "Approved", "Enrolled", or "Rejected".',
        'Hardware Kit Allocation: Mark whether the student has received their physical Dakshyam IoT prototyping kit.',
        'Exporting Batch Rosters: Download complete candidate lists for classroom attendance and kit logistics.'
      ],
      tips: [
        'When you approve a student application, an automated in-app notification is dispatched to that student so they can track their status.'
      ],
      targetAdminTab: 'applications'
    },
    {
      id: 'sec-trainers',
      title: '6. Trainer Management & Super-Codes',
      badge: 'Faculty',
      icon: <Users className="w-4 h-4 text-indigo-400" />,
      summary: 'Onboard technical trainers, approve pending faculty profiles, and assign student project groups.',
      steps: [
        'Trainer Registration: Instructors register through the Portal using their email and credentials.',
        'Manual Approval: By default, new trainer accounts show as "Pending Approval". Admin can click "Approve Trainer" to grant lab privileges.',
        'Instant Passcode: Alternatively, instructors can enter the administrator-provided Trainer Registration Code during signup for instant autonomous approval.',
        'Group Assignment: Assign approved trainers to supervise specific student groups on the Leaderboard matrix.'
      ],
      tips: [
        'Trainers only have access to their assigned student groups and workshops, preventing unauthorized edits to root system settings.'
      ],
      targetAdminTab: 'trainers'
    },
    {
      id: 'sec-certificates',
      title: '7. Verifiable Certificates & QR Engine',
      badge: 'Credentials',
      icon: <Award className="w-4 h-4 text-amber-500" />,
      summary: 'Issue tamper-proof certificates with unique cryptographic verification codes and scannable QR verification engines.',
      steps: [
        'Generating a Certificate: Enter the Student Name, Course/Workshop Title, Completion Date, Grade, and Issue Date.',
        'Unique Verification ID: The engine generates a collision-resistant verifiable ID (e.g., DKY-2026-XXXX).',
        'Public Verification: Anyone (employers, colleges) can visit the Verification tab and enter the ID to instantly verify authenticity.',
        'Export & Print: Download print-ready high-resolution certificates with embedded QR codes.'
      ],
      tips: [
        'Certificates stored in Firestore cannot be altered once issued, guaranteeing zero counterfeit diploma generation.'
      ],
      targetAdminTab: 'certificates'
    },
    {
      id: 'sec-leaderboard',
      title: '8. Leaderboard & Student Competition',
      badge: 'Gamification',
      icon: <BarChart3 className="w-4 h-4 text-teal-400" />,
      summary: 'Motivate students through team-based competition, scoring points for project milestones and hardware prototypes.',
      steps: [
        'Group Creation: Form student teams (e.g., "Autonomous Rovers", "Smart Agriculture").',
        'Awarding Points: Award points for prototype milestones, code reviews, and project exhibitions.',
        'Real-time Ranking: The live leaderboard automatically sorts teams by score and highlights the top-performing innovators.',
        'Linking Exhibition Videos: Attach demo video links directly to student group profiles.'
      ],
      tips: [
        'Points updates reflect in real-time on the public Leaderboard view without requiring a page reload.'
      ],
      targetAdminTab: 'analytics'
    },
    {
      id: 'sec-multimedia',
      title: '9. Page Loader, 3D Art & Video Wall',
      badge: 'Visual Experience',
      icon: <Video className="w-4 h-4 text-rose-400" />,
      summary: 'Manage the animated full-screen video lazy loader, interactive 3D WebGL art, and Innovation Exhibition videos.',
      steps: [
        'Page Loader Settings: Upload custom intro videos or GIFs (via URL or local file). Configure minimum duration, overlay theme, and audio playback.',
        'Home 3D Art Viewer: Customize the interactive WebGL vector canvas, particle density, and wireframe wave heights.',
        'Exhibition Video Wall: Add student project showcase videos using YouTube URLs or Cloudinary direct video links.'
      ],
      tips: [
        'Large video assets are intelligently cached in IndexedDB to avoid repeated network downloads.'
      ],
      targetAdminTab: 'page_loader'
    },
    {
      id: 'sec-notifications',
      title: '10. Real-time In-App Notifications',
      badge: 'Role Alerts',
      icon: <Sparkles className="w-4 h-4 text-yellow-400" />,
      summary: 'Broadcast role-targeted announcements and receive instant alerts for security incidents, feedbacks, and applications.',
      steps: [
        'Notification Bell: Located in the top header. Displays a live badge count of unread notifications.',
        'Role Segregation: Alerts are strictly scoped: Admin alerts (security violations, new feedbacks) are completely hidden from students and visitors.',
        'Quick Navigation: Clicking any notification instantly navigates to the relevant tab (e.g. clicking a feedback alert opens the Feedback Manager).',
        'Clearing & Sound: Mark notifications as read or toggle subtle audio chimes.'
      ],
      tips: [
        'Zero sensitive student or trainer data is exposed in public alerts.'
      ],
      targetAdminTab: 'logs'
    },
    {
      id: 'sec-seo',
      title: '11. SEO & Browser Optimization',
      badge: 'Discovery',
      icon: <Globe className="w-4 h-4 text-cyan-400" />,
      summary: 'Search engine optimization, Microsoft Edge tile metadata, Brave privacy shield support, and social share cards.',
      steps: [
        'Dynamic Document Titles: The browser tab dynamically updates with branded keywords as users navigate through pages.',
        'OpenGraph & Twitter: Rich preview cards automatically generate when sharing links on WhatsApp, LinkedIn, Discord, or X.',
        'Structured Schema: EducationalOrganization, Course, and Event JSON-LD schemas are baked into index.html for rich search results.',
        'Edge & Brave Resilience: Cookies and local storage are synchronized every session to guarantee uninterrupted logins.'
      ],
      tips: [
        'Share URLs formatted as https://dakshyaminnovations.vercel.app/feedback-form/:slug for maximum click-through rates.'
      ],
      targetAdminTab: 'about_editor'
    }
  ];

  const filteredSections = sections.filter(sec => 
    sec.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    sec.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
    sec.steps.some(st => st.toLowerCase().includes(searchQuery.toLowerCase())) ||
    sec.tips.some(tp => tp.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const activeSection = sections.find(s => s.id === selectedSectionId) || sections[0];

  return (
    <div className={`w-full rounded-2xl border overflow-hidden shadow-2xl transition-all ${
      isLight 
        ? 'bg-white border-slate-200 text-slate-800' 
        : 'bg-[#0a192f]/95 border-blue-900/40 text-slate-100 shadow-[0_0_50px_rgba(0,0,0,0.5)]'
    }`}>
      {/* Top Banner Header */}
      <div className={`p-5 sm:p-6 border-b flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
        isLight ? 'bg-slate-50/80 border-slate-200' : 'bg-[#071326]/90 border-blue-900/30'
      }`}>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-blue-600/20 text-sky-400 border border-sky-400/30">
              <BookOpen className="w-5 h-5" />
            </div>
            <h2 className="text-base sm:text-lg font-mono font-black uppercase tracking-wider">
              Admin Master Operational Manual
            </h2>
          </div>
          <p className={`text-xs font-mono ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
            Comprehensive architectural guide, operational workflows, and feature execution manual for Dakshyam Innovations administrators.
          </p>
        </div>

        {/* Quick Action Badges */}
        <div className="flex items-center gap-2 self-stretch sm:self-auto justify-between sm:justify-start">
          <span className="text-[10px] font-mono px-2.5 py-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 font-bold flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" /> Complete System Coverage
          </span>
          {onClose && (
            <button
              onClick={onClose}
              className={`p-1.5 rounded-lg border text-xs font-mono cursor-pointer transition-colors ${
                isLight ? 'border-slate-300 hover:bg-slate-200' : 'border-blue-900/50 hover:bg-white/10'
              }`}
            >
              Close
            </button>
          )}
        </div>
      </div>

      {/* Search & Quick Filter Bar */}
      <div className={`p-3 px-4 border-b flex items-center gap-3 ${
        isLight ? 'bg-white border-slate-100' : 'bg-[#0d1f38]/60 border-blue-900/20'
      }`}>
        <Search className="w-4 h-4 text-slate-400 shrink-0" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search features (e.g. feedback form, certificates, security bypass, trainer code)..."
          className={`w-full text-xs font-mono bg-transparent outline-none ${
            isLight ? 'text-slate-900 placeholder:text-slate-400' : 'text-white placeholder:text-slate-500'
          }`}
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="text-[10px] font-mono text-slate-400 hover:text-white cursor-pointer"
          >
            Clear
          </button>
        )}
      </div>

      {/* Master 2-Column Split: Navigation Sidebar + Detailed Instruction Pane */}
      <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[580px]">
        {/* Left Navigation Directory */}
        <div className={`lg:col-span-4 border-r p-3 space-y-1.5 overflow-y-auto max-h-[620px] ${
          isLight ? 'border-slate-200 bg-slate-50/50' : 'border-blue-900/30 bg-[#071326]/50'
        }`}>
          <div className="text-[10px] font-mono uppercase tracking-widest text-slate-400 px-2 py-1 font-bold">
            Features & Modules ({filteredSections.length})
          </div>

          {filteredSections.map((sec) => {
            const isSelected = sec.id === activeSection.id;
            return (
              <button
                key={sec.id}
                onClick={() => setSelectedSectionId(sec.id)}
                className={`w-full text-left p-2.5 rounded-xl border transition-all flex items-start gap-2.5 cursor-pointer ${
                  isSelected
                    ? (isLight 
                        ? 'bg-blue-900 text-white border-blue-900 shadow-sm' 
                        : 'bg-blue-600/20 text-white border-sky-400/40 shadow-[0_0_15px_rgba(56,189,248,0.15)]')
                    : (isLight 
                        ? 'bg-white border-slate-200 hover:bg-slate-100 text-slate-700' 
                        : 'bg-[#0a192f]/60 border-blue-900/30 hover:bg-white/5 text-slate-300')
                }`}
              >
                <div className="mt-0.5 shrink-0">{sec.icon}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-xs font-mono font-bold truncate">
                      {sec.title}
                    </span>
                    <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded-md font-semibold shrink-0 ${
                      isSelected 
                        ? (isLight ? 'bg-white/20 text-white' : 'bg-sky-400/20 text-sky-200')
                        : (isLight ? 'bg-slate-100 text-slate-600' : 'bg-white/5 text-slate-400')
                    }`}>
                      {sec.badge}
                    </span>
                  </div>
                  <p className={`text-[10px] line-clamp-1 mt-0.5 ${
                    isSelected ? (isLight ? 'text-slate-100' : 'text-slate-200') : 'text-slate-400'
                  }`}>
                    {sec.summary}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Right Instruction Content Pane */}
        <div className="lg:col-span-8 p-5 sm:p-7 space-y-6 overflow-y-auto max-h-[620px]">
          {/* Active Chapter Header */}
          <div className="space-y-2 border-b pb-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-blue-600/10 text-sky-400 border border-sky-400/20">
                  {activeSection.icon}
                </div>
                <h3 className="text-lg font-mono font-black tracking-wide">
                  {activeSection.title}
                </h3>
              </div>

              {activeSection.targetAdminTab && onNavigateTab && (
                <button
                  type="button"
                  onClick={() => onNavigateTab(activeSection.targetAdminTab!)}
                  className="px-3 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-[#0a192f] font-mono text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
                >
                  <span>Open This Tab in Dashboard</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <p className={`text-xs sm:text-sm leading-relaxed ${isLight ? 'text-slate-700' : 'text-slate-200'}`}>
              {activeSection.summary}
            </p>

            {/* Quick shortcuts / copyable keys if available */}
            {activeSection.shortcuts && activeSection.shortcuts.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {activeSection.shortcuts.map((sc, idx) => {
                  const [label, val] = sc.split(': ');
                  return (
                    <div 
                      key={idx}
                      className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-lg border text-xs font-mono ${
                        isLight ? 'bg-amber-50 border-amber-200 text-amber-900' : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                      }`}
                    >
                      <span>{label}: <strong>{val}</strong></span>
                      {val && (
                        <button
                          type="button"
                          onClick={() => copyToClipboard(val, `sc-${idx}`)}
                          className="hover:text-white cursor-pointer"
                          title="Copy to clipboard"
                        >
                          {copiedKey === `sc-${idx}` ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Step-by-Step Instructions */}
          <div className="space-y-3">
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-sky-400 flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5" /> Execution Steps & Workflows
            </h4>
            <div className="space-y-2.5">
              {activeSection.steps.map((step, idx) => (
                <div 
                  key={idx}
                  className={`p-3.5 rounded-xl border flex items-start gap-3 transition-colors ${
                    isLight 
                      ? 'bg-slate-50/70 border-slate-200 text-slate-800' 
                      : 'bg-[#071326]/60 border-blue-900/30 text-slate-200'
                  }`}
                >
                  <span className={`w-5 h-5 rounded-full text-[10px] font-mono font-bold flex items-center justify-center shrink-0 mt-0.5 ${
                    isLight ? 'bg-blue-900 text-white' : 'bg-sky-500/20 text-sky-300 border border-sky-400/30'
                  }`}>
                    {idx + 1}
                  </span>
                  <p className="text-xs leading-relaxed">
                    {step}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Best Practices & Pro Tips */}
          {activeSection.tips.length > 0 && (
            <div className={`p-4 rounded-xl border space-y-2 ${
              isLight ? 'bg-amber-50/50 border-amber-200' : 'bg-amber-500/5 border-amber-500/20'
            }`}>
              <h5 className="text-[11px] font-mono font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" /> Best Practices & Security Tips
              </h5>
              <ul className="space-y-1.5">
                {activeSection.tips.map((tip, idx) => (
                  <li key={idx} className="text-xs leading-relaxed flex items-start gap-2 text-slate-300">
                    <span className="text-amber-400 mt-1">•</span>
                    <span className={isLight ? 'text-slate-700' : 'text-slate-300'}>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Interactive Navigation Footer */}
          <div className="pt-4 border-t flex items-center justify-between">
            <button
              type="button"
              onClick={() => {
                const curIdx = sections.findIndex(s => s.id === activeSection.id);
                if (curIdx > 0) setSelectedSectionId(sections[curIdx - 1].id);
              }}
              disabled={sections.findIndex(s => s.id === activeSection.id) === 0}
              className={`px-3 py-1.5 rounded-lg border text-xs font-mono transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer ${
                isLight ? 'border-slate-200 hover:bg-slate-100' : 'border-blue-900/40 hover:bg-white/5'
              }`}
            >
              ← Previous Feature
            </button>

            <span className="text-[10px] font-mono text-slate-400">
              Feature {sections.findIndex(s => s.id === activeSection.id) + 1} of {sections.length}
            </span>

            <button
              type="button"
              onClick={() => {
                const curIdx = sections.findIndex(s => s.id === activeSection.id);
                if (curIdx < sections.length - 1) setSelectedSectionId(sections[curIdx + 1].id);
              }}
              disabled={sections.findIndex(s => s.id === activeSection.id) === sections.length - 1}
              className={`px-3 py-1.5 rounded-lg border text-xs font-mono transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer ${
                isLight ? 'border-slate-200 hover:bg-slate-100' : 'border-blue-900/40 hover:bg-white/5'
              }`}
            >
              Next Feature →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
