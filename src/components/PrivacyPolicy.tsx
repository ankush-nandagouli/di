import React from 'react';
import { 
  ShieldCheck, Lock, Eye, FileText, Database, UserCheck, 
  Cookie, AlertCircle, ArrowLeft, Mail, Phone, MapPin, CheckCircle2 
} from 'lucide-react';
import { NavigationTab } from '../App';

interface PrivacyPolicyProps {
  theme: 'dark' | 'light';
  onNavigateTab: (tab: NavigationTab) => void;
}

export function PrivacyPolicy({ theme, onNavigateTab }: PrivacyPolicyProps) {
  const isLight = theme === 'light';

  const cardBg = isLight 
    ? 'bg-white border-slate-200 shadow-xs' 
    : 'bg-[#0d1f38]/70 border-blue-900/40 backdrop-blur-md';
  const textTitle = isLight ? 'text-slate-900' : 'text-white';
  const textBody = isLight ? 'text-slate-700' : 'text-slate-300';
  const textMuted = isLight ? 'text-slate-600 font-medium' : 'text-slate-400';
  const accentBadge = isLight 
    ? 'bg-blue-50 text-blue-950 border-blue-900/15' 
    : 'bg-blue-950/60 text-sky-400 border-blue-700/40';

  return (
    <div className="max-w-4xl mx-auto py-6 px-4 space-y-8 select-text font-sans">
      {/* Top Breadcrumb & Navigation */}
      <div className="flex items-center justify-between gap-4">
        <button
          onClick={() => onNavigateTab('home')}
          className={`inline-flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider px-3.5 py-1.5 rounded-xl border transition-all cursor-pointer ${
            isLight 
              ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300' 
              : 'bg-[#0a192f] hover:bg-blue-950 text-sky-300 border-blue-800/40'
          }`}
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Home
        </button>

        <span className={`text-2xs font-mono font-bold tracking-wider px-2.5 py-1 rounded-lg border ${accentBadge}`}>
          Effective Date: January 1, 2026
        </span>
      </div>

      {/* Header Banner */}
      <div className={`p-6 sm:p-8 rounded-3xl border relative overflow-hidden transition-all duration-300 ${
        isLight ? 'border-blue-900/15 bg-blue-50/50 shadow-xs' : 'border-blue-800/40 bg-[#0a192f]/90 shadow-2xl'
      }`}>
        <div className="max-w-3xl space-y-3 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border text-[10px] font-mono font-black uppercase tracking-widest bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400">
            <ShieldCheck className="w-4 h-4" /> DPDP & IT Act 2000 Compliant
          </div>
          <h1 className={`text-2xl sm:text-3xl font-black uppercase tracking-tight ${textTitle}`}>
            Privacy Policy
          </h1>
          <p className={`text-xs sm:text-sm leading-relaxed ${textMuted}`}>
            At Dakshyam Innovations, we take your trust and privacy seriously. This document outlines how we collect, store, process, and protect student, educator, and institutional data across our vocational robotics and IoT learning platforms.
          </p>
        </div>
      </div>

      {/* Section 1: Overview and Data Controller */}
      <div className={`p-6 sm:p-7 rounded-2xl border space-y-4 ${cardBg}`}>
        <div className="flex items-center gap-2.5">
          <div className={`p-2 rounded-xl ${isLight ? 'bg-blue-100 text-blue-900' : 'bg-blue-950 text-sky-400'}`}>
            <Building2Icon isLight={isLight} />
          </div>
          <h2 className={`text-base font-black uppercase tracking-wide ${textTitle}`}>
            1. Data Controller & Scope
          </h2>
        </div>
        <p className={`text-xs sm:text-sm leading-relaxed ${textBody}`}>
          <strong>Dakshyam Innovations</strong> (headquartered at Ward No. 4, Siddhivinayak Complex, Balaghat Road, Waraseoni, Madhya Pradesh - 481331, India) operates as the primary data fiduciary for all applications, educational portals, workshops, and services offered through <code>dakshyaminnovations.in</code>.
        </p>
        <p className={`text-xs sm:text-sm leading-relaxed ${textBody}`}>
          This policy applies to enrolled students, parents or legal guardians of minor participants, certified trainers, school administrators, and visitors accessing our website or hands-on laboratory telemetry infrastructure.
        </p>
      </div>

      {/* Section 2: Information We Collect */}
      <div className={`p-6 sm:p-7 rounded-2xl border space-y-4 ${cardBg}`}>
        <div className="flex items-center gap-2.5">
          <div className={`p-2 rounded-xl ${isLight ? 'bg-indigo-100 text-indigo-900' : 'bg-indigo-950 text-indigo-300'}`}>
            <Database className="w-5 h-5" />
          </div>
          <h2 className={`text-base font-black uppercase tracking-wide ${textTitle}`}>
            2. Categories of Information Collected
          </h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <div className={`p-4 rounded-xl border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-black/30 border-blue-950'}`}>
            <h3 className={`text-xs font-mono font-bold uppercase mb-2 ${isLight ? 'text-blue-950' : 'text-sky-300'}`}>
              A. Personal Identifiers
            </h3>
            <ul className={`text-xs space-y-1.5 list-disc list-inside ${textMuted}`}>
              <li>Full Name and contact email address</li>
              <li>Phone number and guardian emergency contact</li>
              <li>Affiliated school, college, or polytechnic institution</li>
              <li>Academic grade / year of study / branch</li>
              <li>Roll number or institutional candidate ID</li>
            </ul>
          </div>

          <div className={`p-4 rounded-xl border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-black/30 border-blue-950'}`}>
            <h3 className={`text-xs font-mono font-bold uppercase mb-2 ${isLight ? 'text-blue-950' : 'text-sky-300'}`}>
              B. Learning & Performance Data
            </h3>
            <ul className={`text-xs space-y-1.5 list-disc list-inside ${textMuted}`}>
              <li>Course attendance records and workshop check-ins</li>
              <li>Robotics project submissions and code assessments</li>
              <li>Trainer evaluations, badges, and feedback scores</li>
              <li>Verified digital certificates with unique hash IDs</li>
            </ul>
          </div>

          <div className={`p-4 rounded-xl border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-black/30 border-blue-950'}`}>
            <h3 className={`text-xs font-mono font-bold uppercase mb-2 ${isLight ? 'text-blue-950' : 'text-sky-300'}`}>
              C. Technical & Laboratory Telemetry
            </h3>
            <ul className={`text-xs space-y-1.5 list-disc list-inside ${textMuted}`}>
              <li>IoT workstation logs (ESP32/Arduino test runs)</li>
              <li>Browser agent, operating system, and screen resolution</li>
              <li>Masked IP address and geographic access region</li>
              <li>Active session heartbeats for concurrent login security</li>
            </ul>
          </div>

          <div className={`p-4 rounded-xl border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-black/30 border-blue-950'}`}>
            <h3 className={`text-xs font-mono font-bold uppercase mb-2 ${isLight ? 'text-blue-950' : 'text-sky-300'}`}>
              D. Exhibition Media & Consent
            </h3>
            <ul className={`text-xs space-y-1.5 list-disc list-inside ${textMuted}`}>
              <li>Photos and video demonstrations from lab sessions</li>
              <li>Student robotics exhibition showreels</li>
              <li>Parental/guardian opt-in authorizations for student showcases</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Section 3: Legal Basis & Use of Data */}
      <div className={`p-6 sm:p-7 rounded-2xl border space-y-4 ${cardBg}`}>
        <div className="flex items-center gap-2.5">
          <div className={`p-2 rounded-xl ${isLight ? 'bg-emerald-100 text-emerald-900' : 'bg-emerald-950 text-emerald-400'}`}>
            <FileText className="w-5 h-5" />
          </div>
          <h2 className={`text-base font-black uppercase tracking-wide ${textTitle}`}>
            3. Purpose and Legal Basis for Processing
          </h2>
        </div>
        <p className={`text-xs sm:text-sm leading-relaxed ${textBody}`}>
          We process personal data strictly in accordance with the Digital Personal Data Protection (DPDP) Act 2023 and the Information Technology Act, 2000 under the following legal bases:
        </p>
        <div className="space-y-2.5 text-xs sm:text-sm">
          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
            <p className={textBody}><strong>Educational Contract Fulfillment:</strong> Enrolling students into certified courses, scheduling trainer mentorship sessions, delivering hardware kits, and issuing verifiable completion certificates.</p>
          </div>
          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
            <p className={textBody}><strong>Institutional Reporting:</strong> Providing partner colleges and schools with attendance audits, student performance metrics, and skill-readiness indexes under NEP 2020 guidelines.</p>
          </div>
          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
            <p className={textBody}><strong>Platform Security:</strong> Detecting unauthorized supervisor access attempts, rate-limiting malicious bots, preventing identity impersonation, and validating session authenticity.</p>
          </div>
        </div>
      </div>

      {/* Section 4: Minor and Student Protection */}
      <div className={`p-6 sm:p-7 rounded-2xl border space-y-4 ${cardBg}`}>
        <div className="flex items-center gap-2.5">
          <div className={`p-2 rounded-xl ${isLight ? 'bg-amber-100 text-amber-900' : 'bg-amber-950 text-amber-300'}`}>
            <UserCheck className="w-5 h-5" />
          </div>
          <h2 className={`text-base font-black uppercase tracking-wide ${textTitle}`}>
            4. Protection of Minors (Students Under 18)
          </h2>
        </div>
        <p className={`text-xs sm:text-sm leading-relaxed ${textBody}`}>
          Because our STEM and robotics workshops engage school students, we maintain enhanced protective measures:
        </p>
        <ul className={`text-xs sm:text-sm space-y-2 list-disc list-inside ${textMuted}`}>
          <li><strong>No Commercial Profiling:</strong> We never sell, rent, or trade student profiles to third-party ad networks or brokers.</li>
          <li><strong>Parental Supervision:</strong> Registrations for students below 18 years require verifiable parental or school authorization.</li>
          <li><strong>Minimal Collection:</strong> Only data strictly essential for course grading and certification is requested.</li>
        </ul>
      </div>

      {/* Section 5: Cookies and Browser Storage */}
      <div className={`p-6 sm:p-7 rounded-2xl border space-y-4 ${cardBg}`}>
        <div className="flex items-center gap-2.5">
          <div className={`p-2 rounded-xl ${isLight ? 'bg-purple-100 text-purple-900' : 'bg-purple-950 text-purple-300'}`}>
            <Cookie className="w-5 h-5" />
          </div>
          <h2 className={`text-base font-black uppercase tracking-wide ${textTitle}`}>
            5. Cookies & Local Storage
          </h2>
        </div>
        <p className={`text-xs sm:text-sm leading-relaxed ${textBody}`}>
          We use strictly necessary first-party cookies and localStorage tokens for:
        </p>
        <ul className={`text-xs sm:text-sm space-y-1.5 list-disc list-inside ${textMuted}`}>
          <li>Authentication session preservation (<code>dakshyam_auth_token</code>)</li>
          <li>Visual interface theme preference (<code>dakshyam_theme</code>)</li>
          <li>User cookie consent choices (<code>dakshyam_cookie_consent</code>)</li>
          <li>Aggregated visitor counter verification without tracking individual user identities</li>
        </ul>
        <p className={`text-xs ${textMuted}`}>
          You may reset or adjust your cookie preferences at any time using the <em>[ cookie preferences ]</em> trigger located in the website footer.
        </p>
      </div>

      {/* Section 6: Security and Retention */}
      <div className={`p-6 sm:p-7 rounded-2xl border space-y-4 ${cardBg}`}>
        <div className="flex items-center gap-2.5">
          <div className={`p-2 rounded-xl ${isLight ? 'bg-cyan-100 text-cyan-900' : 'bg-cyan-950 text-cyan-300'}`}>
            <Lock className="w-5 h-5" />
          </div>
          <h2 className={`text-base font-black uppercase tracking-wide ${textTitle}`}>
            6. Data Security & Storage Architecture
          </h2>
        </div>
        <p className={`text-xs sm:text-sm leading-relaxed ${textBody}`}>
          All data transmitted across our networks is encrypted via TLS 1.3 in transit and stored in protected cloud databases (MongoDB Atlas & Google Cloud Firestore) with row-level security rules, role-based access validation, and salted password hashing.
        </p>
        <p className={`text-xs sm:text-sm leading-relaxed ${textBody}`}>
          Student project repositories and certificates are archived for a maximum of 5 academic years to facilitate legitimate certificate verification by universities and employers.
        </p>
      </div>

      {/* Section 7: Grievance Officer & Contact */}
      <div className={`p-6 sm:p-7 rounded-2xl border space-y-4 ${
        isLight ? 'bg-blue-50/70 border-blue-300 text-slate-800' : 'bg-blue-950/40 border-blue-800/60 text-slate-200'
      }`}>
        <div className="flex items-center gap-2.5">
          <div className={`p-2 rounded-xl ${isLight ? 'bg-blue-600 text-white' : 'bg-sky-500 text-black'}`}>
            <Mail className="w-5 h-5" />
          </div>
          <div>
            <h2 className={`text-base font-black uppercase tracking-wide ${isLight ? 'text-blue-950' : 'text-white'}`}>
              7. Grievance Redressal & Privacy Officer
            </h2>
            <p className="text-2xs font-mono text-slate-500">In compliance with Rule 5(9) of the IT (Intermediary Guidelines) Rules</p>
          </div>
        </div>

        <p className={`text-xs sm:text-sm leading-relaxed ${textBody}`}>
          If you have questions, data access requests, or wish to correct/delete student records, you may write directly to our designated Grievance Officer:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 text-xs font-mono">
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Designation</span>
            <span className="font-bold">Grievance Redressal Officer</span>
            <span className="text-slate-500 block text-[11px]">Dakshyam Innovations</span>
          </div>

          <div className="space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Direct Email</span>
            <a href="mailto:support@dakshyaminnovations.in" className="text-sky-600 dark:text-sky-400 font-bold hover:underline">
              support@dakshyaminnovations.in
            </a>
            <span className="text-slate-500 block text-[11px]">Response SLA: 48 Hours</span>
          </div>

          <div className="space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Postal Address</span>
            <span className="font-sans text-[11px] leading-tight block">
              Ward No. 4, Siddhivinayak Complex, Balaghat Road, Waraseoni, MP - 481331
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function Building2Icon({ isLight }: { isLight: boolean }) {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  );
}
