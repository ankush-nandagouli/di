import React from 'react';
import { 
  FileCheck, Shield, AlertTriangle, Cpu, Award, 
  HelpCircle, ArrowLeft, CheckCircle2, Scale, RefreshCw, BookOpen 
} from 'lucide-react';
import { NavigationTab } from '../App';

interface TermsAndConditionsProps {
  theme: 'dark' | 'light';
  onNavigateTab: (tab: NavigationTab) => void;
}

export function TermsAndConditions({ theme, onNavigateTab }: TermsAndConditionsProps) {
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
          Last Revised: January 1, 2026
        </span>
      </div>

      {/* Header Banner */}
      <div className={`p-6 sm:p-8 rounded-3xl border relative overflow-hidden transition-all duration-300 ${
        isLight ? 'border-blue-900/15 bg-blue-50/50 shadow-xs' : 'border-blue-800/40 bg-[#0a192f]/90 shadow-2xl'
      }`}>
        <div className="max-w-3xl space-y-3 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border text-[10px] font-mono font-black uppercase tracking-widest bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-300">
            <Scale className="w-4 h-4" /> Educational Services Agreement
          </div>
          <h1 className={`text-2xl sm:text-3xl font-black uppercase tracking-tight ${textTitle}`}>
            Terms and Conditions
          </h1>
          <p className={`text-xs sm:text-sm leading-relaxed ${textMuted}`}>
            Please review these terms governing participation in Dakshyam Innovations training programs, digital learning portals, workshop physical labs, and hardware experimentation kits.
          </p>
        </div>
      </div>

      {/* Clause 1: Acceptance of Terms */}
      <div className={`p-6 sm:p-7 rounded-2xl border space-y-4 ${cardBg}`}>
        <div className="flex items-center gap-2.5">
          <div className={`p-2 rounded-xl ${isLight ? 'bg-blue-100 text-blue-900' : 'bg-blue-950 text-sky-400'}`}>
            <FileCheck className="w-5 h-5" />
          </div>
          <h2 className={`text-base font-black uppercase tracking-wide ${textTitle}`}>
            1. Agreement & Acceptance
          </h2>
        </div>
        <p className={`text-xs sm:text-sm leading-relaxed ${textBody}`}>
          By accessing the platform at <code>dakshyaminnovations.in</code>, registering for any course, attending an in-person or remote workshop, or submitting an application, you agree to be bound by these Terms and Conditions and our Privacy Policy. If you do not accept these terms, you must refrain from registering or using our facilities.
        </p>
      </div>

      {/* Clause 2: Eligibility & Course Admissions */}
      <div className={`p-6 sm:p-7 rounded-2xl border space-y-4 ${cardBg}`}>
        <div className="flex items-center gap-2.5">
          <div className={`p-2 rounded-xl ${isLight ? 'bg-purple-100 text-purple-900' : 'bg-purple-950 text-purple-300'}`}>
            <BookOpen className="w-5 h-5" />
          </div>
          <h2 className={`text-base font-black uppercase tracking-wide ${textTitle}`}>
            2. Program Eligibility & Student Admissions
          </h2>
        </div>
        <ul className={`text-xs sm:text-sm space-y-2 list-disc list-inside ${textMuted}`}>
          <li><strong>Age & Qualifications:</strong> Courses are open to school students (Class 6 and above), polytechnic candidates, and engineering undergraduates meeting pre-requisites listed in syllabus outlines.</li>
          <li><strong>Accurate Registration:</strong> Applicants must provide accurate full legal names, contact coordinates, and institution affiliations. Misrepresentation may result in disqualification without refund.</li>
          <li><strong>Batch Allocation:</strong> Dakshyam Innovations reserves the right to schedule batch cohorts, adjust lab timings, or reallocate laboratory workstations to optimize student-to-trainer ratios.</li>
        </ul>
      </div>

      {/* Clause 3: Laboratory Safety & Hardware Equipment Use */}
      <div className={`p-6 sm:p-7 rounded-2xl border space-y-4 ${cardBg}`}>
        <div className="flex items-center gap-2.5">
          <div className={`p-2 rounded-xl ${isLight ? 'bg-amber-100 text-amber-900' : 'bg-amber-950 text-amber-300'}`}>
            <Cpu className="w-5 h-5" />
          </div>
          <h2 className={`text-base font-black uppercase tracking-wide ${textTitle}`}>
            3. Laboratory Hardware & Safety Guidelines
          </h2>
        </div>
        <p className={`text-xs sm:text-sm leading-relaxed ${textBody}`}>
          Practical engineering education involves electrical microcontrollers (ESP32, Arduino), motor drivers, sensors, soldering equipment, and mechanical rover chassis:
        </p>
        <div className="space-y-2 text-xs sm:text-sm">
          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
            <p className={textBody}><strong>Supervised Operation:</strong> High-voltage or soldering tools must only be operated under the direct supervision of a certified Dakshyam trainer.</p>
          </div>
          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
            <p className={textBody}><strong>Equipment Care:</strong> Students must exercise diligence with lab equipment. Willful damage or unauthorized removal of components from the premises will incur repair or replacement costs.</p>
          </div>
          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
            <p className={textBody}><strong>Take-Home Kits:</strong> Physical kits designated as student-owned become the student's responsibility upon handover after full fee settlement.</p>
          </div>
        </div>
      </div>

      {/* Clause 4: Certification Standards */}
      <div className={`p-6 sm:p-7 rounded-2xl border space-y-4 ${cardBg}`}>
        <div className="flex items-center gap-2.5">
          <div className={`p-2 rounded-xl ${isLight ? 'bg-emerald-100 text-emerald-900' : 'bg-emerald-950 text-emerald-400'}`}>
            <Award className="w-5 h-5" />
          </div>
          <h2 className={`text-base font-black uppercase tracking-wide ${textTitle}`}>
            4. Certification Criteria & Verification
          </h2>
        </div>
        <p className={`text-xs sm:text-sm leading-relaxed ${textBody}`}>
          Certificates awarded by Dakshyam Innovations represent verified skills and are earned based on objective performance benchmarks:
        </p>
        <ul className={`text-xs sm:text-sm space-y-1.5 list-disc list-inside ${textMuted}`}>
          <li>Minimum 80% attendance in scheduled workshop or practical course sessions.</li>
          <li>Successful demonstration of capstone hardware/software projects.</li>
          <li>Submission of trainer-graded evaluation rubrics.</li>
          <li>Each certificate features an immutable hash verifiable via our system database.</li>
        </ul>
      </div>

      {/* Clause 5: Intellectual Property */}
      <div className={`p-6 sm:p-7 rounded-2xl border space-y-4 ${cardBg}`}>
        <div className="flex items-center gap-2.5">
          <div className={`p-2 rounded-xl ${isLight ? 'bg-indigo-100 text-indigo-900' : 'bg-indigo-950 text-indigo-300'}`}>
            <Shield className="w-5 h-5" />
          </div>
          <h2 className={`text-base font-black uppercase tracking-wide ${textTitle}`}>
            5. Intellectual Property & Course Materials
          </h2>
        </div>
        <p className={`text-xs sm:text-sm leading-relaxed ${textBody}`}>
          All curriculum outlines, slide decks, lab manuals, proprietary firmware libraries, circuit schematic diagrams, and website content are the exclusive intellectual property of <strong>Dakshyam Innovations</strong>. Students receive a revocable, non-transferable license for personal, non-commercial educational use only. Reselling, recording, or publishing training materials without express written authorization is strictly prohibited.
        </p>
        <p className={`text-xs sm:text-sm leading-relaxed ${textBody}`}>
          Students retain ownership of original code and novel project inventions authored during project laboratories.
        </p>
      </div>

      {/* Clause 6: Fees, Cancellations & Refunds */}
      <div className={`p-6 sm:p-7 rounded-2xl border space-y-4 ${cardBg}`}>
        <div className="flex items-center gap-2.5">
          <div className={`p-2 rounded-xl ${isLight ? 'bg-rose-100 text-rose-900' : 'bg-rose-950 text-rose-300'}`}>
            <RefreshCw className="w-5 h-5" />
          </div>
          <h2 className={`text-base font-black uppercase tracking-wide ${textTitle}`}>
            6. Fees, Cancellations & Refunds
          </h2>
        </div>
        <ul className={`text-xs sm:text-sm space-y-2 list-disc list-inside ${textMuted}`}>
          <li><strong>Course Fees:</strong> Fees must be settled prior to course commencement or kit dispatch.</li>
          <li><strong>Student Cancellations:</strong> Notice given at least 7 days before program start qualifies for a 80% refund (less 20% administrative kit reserve). No refunds are granted once classroom or hardware lab sessions begin.</li>
          <li><strong>Institution Rescheduling:</strong> If Dakshyam Innovations reschedules or cancels a workshop due to unforeseen circumstances, enrolled students will receive full enrollment credit or a 100% refund.</li>
        </ul>
      </div>

      {/* Clause 7: Code of Conduct & Suspension */}
      <div className={`p-6 sm:p-7 rounded-2xl border space-y-4 ${cardBg}`}>
        <div className="flex items-center gap-2.5">
          <div className={`p-2 rounded-xl ${isLight ? 'bg-orange-100 text-orange-900' : 'bg-orange-950 text-orange-300'}`}>
            <AlertTriangle className="w-5 h-5" />
          </div>
          <h2 className={`text-base font-black uppercase tracking-wide ${textTitle}`}>
            7. Student Code of Conduct & Academic Integrity
          </h2>
        </div>
        <p className={`text-xs sm:text-sm leading-relaxed ${textBody}`}>
          We uphold an inclusive, respectful, and safe learning environment. Dakshyam Innovations reserves the right to immediately terminate access or revoke certification for:
        </p>
        <ul className={`text-xs sm:text-sm space-y-1.5 list-disc list-inside ${textMuted}`}>
          <li>Harassment, bullying, or discrimination toward peers, trainers, or staff.</li>
          <li>Submitting plagiarized code or fraudulent project telemetry data.</li>
          <li>Unauthorized tampering with lab network infrastructure or supervisor access portals.</li>
        </ul>
      </div>

      {/* Clause 8: Governing Law & Jurisdiction */}
      <div className={`p-6 sm:p-7 rounded-2xl border space-y-4 ${
        isLight ? 'bg-blue-50/70 border-blue-300 text-slate-800' : 'bg-blue-950/40 border-blue-800/60 text-slate-200'
      }`}>
        <div className="flex items-center gap-2.5">
          <div className={`p-2 rounded-xl ${isLight ? 'bg-blue-600 text-white' : 'bg-sky-500 text-black'}`}>
            <Scale className="w-5 h-5" />
          </div>
          <h2 className={`text-base font-black uppercase tracking-wide ${isLight ? 'text-blue-950' : 'text-white'}`}>
            8. Governing Law & Dispute Jurisdiction
          </h2>
        </div>
        <p className={`text-xs sm:text-sm leading-relaxed ${textBody}`}>
          These Terms and Conditions shall be governed by and construed in accordance with the substantive laws of India. Any legal dispute, arbitration, or claim arising out of or relating to these terms or our services shall fall exclusively within the jurisdiction of the competent courts of <strong>Balaghat / Waraseoni, Madhya Pradesh, India</strong>.
        </p>

        <div className="pt-2 text-xs font-mono border-t border-slate-300 dark:border-blue-900/40 flex flex-col sm:flex-row justify-between gap-2">
          <span>Inquiries: <a href="mailto:support@dakshyaminnovations.in" className="text-sky-600 dark:text-sky-400 font-bold hover:underline">support@dakshyaminnovations.in</a></span>
          <span>Postal: Siddhivinayak Complex, Balaghat Road, Waraseoni - 481331</span>
        </div>
      </div>
    </div>
  );
}
