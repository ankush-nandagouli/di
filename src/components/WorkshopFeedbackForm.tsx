import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Star, CheckCircle2, AlertCircle, Sparkles, Building2, User, 
  Mail, Phone, MapPin, GraduationCap, Award, Send, ArrowLeft, 
  Check, Copy, Share2, Calendar, HelpCircle, Heart, ThumbsUp,
  Cpu, Wrench, BookOpen, Compass, ShieldCheck, ChevronRight
} from 'lucide-react';
import { 
  WorkshopFeedbackSubmission, WorkshopFeedbackConfig, 
  WorkshopItem, ParticipantCategory 
} from '../types';
import { WorkshopFeedbackStorage, toWorkshopSlug, getWorkshopShareUrl, VERCEL_DOMAIN } from '../utils/feedbackStorage';
import DakshyamLogo from './DakshyamLogo';

interface WorkshopFeedbackFormProps {
  theme?: 'light' | 'dark';
  onNavigateHome: () => void;
  preselectedWorkshopId?: string | null;
  isPreviewMode?: boolean;
  onClosePreview?: () => void;
}

const COMMON_INTEREST_TAGS = [
  'ROS2 & Autonomous Drones',
  'ESP32 Industrial IoT Firmware',
  'Smart City Telemetry & LoRaWAN',
  'PLC & Industrial Automation',
  'Edge AI & Computer Vision',
  'Full-Stack IoT Dashboards',
  'PCB Design & Circuit Fabrication',
  'School STEM Lab & Tinkering'
];

export default function WorkshopFeedbackForm({ 
  theme = 'dark', 
  onNavigateHome,
  preselectedWorkshopId,
  isPreviewMode = false,
  onClosePreview
}: WorkshopFeedbackFormProps) {
  const isLight = theme === 'light';

  // Config state
  const [config, setConfig] = useState<WorkshopFeedbackConfig>(() => WorkshopFeedbackStorage.getFeedbackConfig());
  
  // Form input states
  const [selectedWorkshopId, setSelectedWorkshopId] = useState<string>('');
  const [participantCategory, setParticipantCategory] = useState<ParticipantCategory>('student');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [institutionName, setInstitutionName] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('Madhya Pradesh');
  const [branchOrGrade, setBranchOrGrade] = useState('');
  const [rollOrEmployeeId, setRollOrEmployeeId] = useState('');
  const [designationOrRole, setDesignationOrRole] = useState('');

  // Ratings
  const [overallRating, setOverallRating] = useState<number>(5);
  const [trainerKnowledgeRating, setTrainerKnowledgeRating] = useState<number>(5);
  const [practicalHardwareRating, setPracticalHardwareRating] = useState<number>(5);
  const [industryRelevanceRating, setIndustryRelevanceRating] = useState<number>(5);
  const [labManagementRating, setLabManagementRating] = useState<number>(5);

  // Qualitative feedback
  const [keyLearnings, setKeyLearnings] = useState('');
  const [favoriteComponent, setFavoriteComponent] = useState('');
  const [improvementSuggestions, setImprovementSuggestions] = useState('');
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [recommendDakshyam, setRecommendDakshyam] = useState<'Yes, Definitely' | 'Likely' | 'Uncertain' | 'No'>('Yes, Definitely');
  const [testimonial, setTestimonial] = useState('');

  // Dynamic custom questions answers
  const [customAnswers, setCustomAnswers] = useState<Record<string, any>>({});

  // Validation & Submission states
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedResult, setSubmittedResult] = useState<{ id: string } | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);

  // Hydrate config and preselected workshop
  useEffect(() => {
    const currentConfig = WorkshopFeedbackStorage.getFeedbackConfig();
    setConfig(currentConfig);

    // 1. Extract workshop identifier from props, pathname, hash, or searchParams
    let rawIdentifier = preselectedWorkshopId;
    
    if (!rawIdentifier && typeof window !== 'undefined') {
      const pathname = window.location.pathname;
      const feedbackPrefixes = ['/feedback-form', '/feedback', '/workshop-form', '/workshop', '/workshops'];
      for (const prefix of feedbackPrefixes) {
        if (pathname.startsWith(prefix)) {
          const parts = pathname.slice(prefix.length).split('/').filter(Boolean);
          if (parts.length > 0) {
            rawIdentifier = decodeURIComponent(parts[0]);
            break;
          }
        }
      }

      // Check hash router
      if (!rawIdentifier && window.location.hash) {
        const hash = window.location.hash.replace(/^#\/?/, '');
        for (const prefix of feedbackPrefixes) {
          const cleanPrefix = prefix.replace(/^\//, '');
          if (hash.startsWith(cleanPrefix)) {
            const parts = hash.slice(cleanPrefix.length).split('/').filter(Boolean);
            if (parts.length > 0) {
              rawIdentifier = decodeURIComponent(parts[0]);
              break;
            }
          }
        }
      }
    }

    if (!rawIdentifier && typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search);
      rawIdentifier = searchParams.get('workshop') || searchParams.get('w') || searchParams.get('ws') || searchParams.get('slug');
    }

    const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
    const urlCat = searchParams ? (searchParams.get('category') as ParticipantCategory) : null;

    const matchWorkshopInList = (identifier: string | null | undefined, list: WorkshopItem[]): WorkshopItem | null => {
      if (!identifier || !identifier.trim() || !list || list.length === 0) return null;
      const cleanId = identifier.trim();
      const slugOfRaw = toWorkshopSlug(cleanId);
      return list.find(w => 
        w.id.toLowerCase() === cleanId.toLowerCase() ||
        toWorkshopSlug(w.id) === slugOfRaw ||
        toWorkshopSlug(w.name) === slugOfRaw ||
        (slugOfRaw.length > 3 && toWorkshopSlug(w.name).includes(slugOfRaw)) ||
        (slugOfRaw.length > 3 && slugOfRaw.includes(toWorkshopSlug(w.name)))
      ) || null;
    };

    if (rawIdentifier && rawIdentifier.trim()) {
      const matched = matchWorkshopInList(rawIdentifier, currentConfig.workshops);

      if (matched) {
        setSelectedWorkshopId(matched.id);
      } else {
        // If the URL specifies a workshop name that hasn't synced to this client's localStorage yet
        const cleanId = rawIdentifier.trim();
        const slugOfRaw = toWorkshopSlug(cleanId);
        const friendlyName = cleanId
          .replace(/[-_]+/g, ' ')
          .replace(/\b\w/g, c => c.toUpperCase());
        const tempWorkshop: WorkshopItem = {
          id: `WS-${slugOfRaw.toUpperCase() || 'CUSTOM'}`,
          name: friendlyName,
          date: new Date().toISOString().split('T')[0],
          venue: 'Dakshyam Practical Lab & Campus Node',
          trainerName: 'Dakshyam Lead Instructor',
          isActive: true,
          slug: slugOfRaw
        };
        setConfig(prev => {
          if (prev.workshops.some(w => w.id === tempWorkshop.id || toWorkshopSlug(w.name) === slugOfRaw)) {
            return prev;
          }
          return {
            ...prev,
            workshops: [tempWorkshop, ...prev.workshops]
          };
        });
        setSelectedWorkshopId(tempWorkshop.id);
      }
    } else if (currentConfig.workshops.length > 0) {
      setSelectedWorkshopId(currentConfig.workshops[0].id);
    }

    if (urlCat && ['student', 'school', 'college', 'other'].includes(urlCat)) {
      setParticipantCategory(urlCat);
    }

    // 2. Fetch fresh config from Firestore and backend in the background to ensure all newly created workshops sync
    WorkshopFeedbackStorage.fetchFeedbackConfigFromFirestore().then((remoteConfig) => {
      if (remoteConfig && remoteConfig.workshops && remoteConfig.workshops.length > 0) {
        setConfig(prev => ({
          ...prev,
          ...remoteConfig,
          workshops: remoteConfig.workshops
        }));
        // If user accessed via slug, re-match against the authoritative remote workshops
        if (rawIdentifier) {
          const remoteMatched = matchWorkshopInList(rawIdentifier, remoteConfig.workshops);
          if (remoteMatched) {
            setSelectedWorkshopId(remoteMatched.id);
          }
        }
      }
    }).catch(() => {});

    // Also fetch from API settings for instant MongoDB sync
    if (typeof fetch !== 'undefined') {
      fetch('/api/db/all')
        .then(res => res.json())
        .then(data => {
          if (data && data.workshop_feedback_config && Array.isArray(data.workshop_feedback_config.workshops)) {
            const apiWorkshops = data.workshop_feedback_config.workshops;
            if (apiWorkshops.length > 0) {
              setConfig(prev => ({
                ...prev,
                ...data.workshop_feedback_config,
                workshops: apiWorkshops
              }));
              if (rawIdentifier) {
                const apiMatched = matchWorkshopInList(rawIdentifier, apiWorkshops);
                if (apiMatched) {
                  setSelectedWorkshopId(apiMatched.id);
                }
              }
            }
          }
        })
        .catch(() => {});
    }
  }, [preselectedWorkshopId]);

  const activeWorkshop = config.workshops.find(w => w.id === selectedWorkshopId) || config.workshops[0];

  // Toggle interest tags
  const toggleInterest = (tag: string) => {
    setSelectedInterests(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  // Safe input validation
  const validateForm = (): boolean => {
    const errs: Record<string, string> = {};

    if (!fullName.trim()) {
      errs.fullName = 'Full name is required.';
    } else if (fullName.trim().length < 3) {
      errs.fullName = 'Name must be at least 3 characters.';
    }

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!email.trim()) {
      errs.email = 'Email address is required.';
    } else if (!emailRegex.test(email.trim())) {
      errs.email = 'Please provide a valid email format (e.g. name@domain.com).';
    }

    const cleanPhone = phone.replace(/[^0-9]/g, '');
    if (!cleanPhone) {
      errs.phone = 'Phone number is required for verification.';
    } else if (cleanPhone.length < 10) {
      errs.phone = 'Phone number must be at least 10 digits.';
    }

    if (!institutionName.trim()) {
      errs.institutionName = participantCategory === 'school' 
        ? 'School name is required.' 
        : participantCategory === 'college' 
        ? 'College / Institute name is required.' 
        : 'Institution / Organization name is required.';
    }

    if (!city.trim()) {
      errs.city = 'City or location is required.';
    }

    if (!keyLearnings.trim()) {
      errs.keyLearnings = 'Please describe at least one key takeaway or practical learning from this workshop.';
    } else if (keyLearnings.trim().length < 8) {
      errs.keyLearnings = 'Please provide a bit more detail on what you learned (min 8 characters).';
    }

    // Check any required custom questions
    if (config.customQuestions) {
      for (const q of config.customQuestions) {
        if (q.required && !customAnswers[q.id]) {
          errs[`custom_${q.id}`] = `${q.label} is required.`;
        }
      }
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Submission handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      // Scroll to first error
      window.scrollTo({ top: 180, behavior: 'smooth' });
      return;
    }

    if (isPreviewMode) {
      setIsSubmitting(true);
      setTimeout(() => {
        setSubmittedResult({ id: `PREVIEW-SIM-${Math.floor(1000 + Math.random() * 9000)}` });
        setIsSubmitting(false);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 400);
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await WorkshopFeedbackStorage.submitFeedback({
        workshopId: activeWorkshop?.id || 'WS-GENERAL',
        workshopName: activeWorkshop?.name || 'General Workshop',
        workshopDate: activeWorkshop?.date || new Date().toISOString().slice(0, 10),
        workshopVenue: activeWorkshop?.venue || 'Dakshyam Laboratory',
        participantCategory,
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        institutionName: institutionName.trim(),
        city: city.trim(),
        state: state.trim(),
        branchOrGrade: branchOrGrade.trim(),
        rollOrEmployeeId: rollOrEmployeeId.trim(),
        designationOrRole: designationOrRole.trim() || (participantCategory === 'student' ? 'Student' : 'Participant'),
        overallRating,
        trainerKnowledgeRating,
        practicalHardwareRating,
        industryRelevanceRating,
        labManagementRating,
        keyLearnings: keyLearnings.trim(),
        favoriteComponent: favoriteComponent.trim(),
        improvementSuggestions: improvementSuggestions.trim(),
        futureInterests: selectedInterests,
        recommendDakshyam,
        testimonial: testimonial.trim(),
        customAnswers
      });

      if (result.success && result.id) {
        setSubmittedResult({ id: result.id });
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        setErrors({ submit: result.error || 'Failed to submit feedback. Please try again.' });
      }
    } catch (err: any) {
      setErrors({ submit: err.message || 'An unexpected error occurred during submission.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Copy shareable link
  const copyShareLink = () => {
    const ws = config.workshops.find(w => w.id === selectedWorkshopId);
    const shareUrl = getWorkshopShareUrl(ws || selectedWorkshopId, true);
    navigator.clipboard.writeText(shareUrl);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  // Star Rating Component
  const StarRatingSelector = ({ 
    label, 
    value, 
    onChange, 
    description 
  }: { 
    label: string; 
    value: number; 
    onChange: (val: number) => void;
    description?: string;
  }) => {
    return (
      <div className={`p-4 rounded-xl border transition-all ${
        isLight ? 'bg-white border-blue-900/10' : 'bg-slate-900/60 border-blue-900/25'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
          <div>
            <label className={`text-xs font-bold font-mono uppercase tracking-wide block ${
              isLight ? 'text-slate-900' : 'text-slate-100'
            }`}>
              {label}
            </label>
            {description && (
              <p className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                {description}
              </p>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => onChange(star)}
                className="p-1 rounded-lg hover:scale-115 transition-transform cursor-pointer"
                title={`${star} Star${star > 1 ? 's' : ''}`}
              >
                <Star
                  className={`w-5 h-5 ${
                    star <= value
                      ? 'text-amber-400 fill-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]'
                      : isLight
                      ? 'text-slate-300 hover:text-amber-300'
                      : 'text-slate-700 hover:text-slate-500'
                  }`}
                />
              </button>
            ))}
            <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded-md ml-1 ${
              value >= 4
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                : 'bg-slate-800 text-slate-300'
            }`}>
              {value}.0
            </span>
          </div>
        </div>
      </div>
    );
  };

  // SUCCESS VIEW
  if (submittedResult) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 animate-fadeIn">
        <div className={`p-8 sm:p-10 rounded-3xl border shadow-xl text-center space-y-6 backdrop-blur-xl ${
          isLight ? 'bg-white border-blue-900/15 text-slate-900' : 'bg-[#0a192f]/90 border-sky-500/30 text-white'
        }`}>
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto shadow-[0_0_25px_rgba(16,185,129,0.2)]">
            <CheckCircle2 className="w-9 h-9" />
          </div>

          <div className="space-y-2">
            <span className="text-3xs font-mono font-bold tracking-widest uppercase px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 inline-block">
              Evaluation Recorded
            </span>
            <h1 className="text-2xl sm:text-3xl font-black uppercase font-mono tracking-tight">
              Thank You for Your Feedback!
            </h1>
            <p className={`text-xs sm:text-sm max-w-lg mx-auto ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
              Your feedback for <strong className={isLight ? 'text-blue-900' : 'text-sky-300'}>{activeWorkshop?.name}</strong> has been saved directly to the Dakshyam Innovations evaluation database.
            </p>
          </div>

          {/* Reference Card */}
          <div className={`p-4 rounded-2xl border text-left font-mono text-xs space-y-2 ${
            isLight ? 'bg-slate-50 border-slate-200 text-slate-800' : 'bg-black/40 border-blue-900/40 text-slate-300'
          }`}>
            <div className="flex justify-between items-center pb-2 border-b border-slate-500/15">
              <span className="text-[11px] text-slate-400 uppercase">Feedback Receipt Reference:</span>
              <span className="text-sky-400 font-bold">{submittedResult.id}</span>
            </div>
            <div className="flex justify-between items-center text-[11px]">
              <span className="text-slate-400">Participant:</span>
              <span className="font-bold">{fullName} ({participantCategory.toUpperCase()})</span>
            </div>
            <div className="flex justify-between items-center text-[11px]">
              <span className="text-slate-400">Institution:</span>
              <span>{institutionName}</span>
            </div>
            <div className="flex justify-between items-center text-[11px]">
              <span className="text-slate-400">Overall Rating:</span>
              <span className="text-amber-400 font-bold">{overallRating}.0 / 5.0 ★</span>
            </div>
          </div>

          {isPreviewMode && (
            <div className="p-3 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-mono text-center flex items-center justify-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span><strong>Form Preview Mode Active:</strong> This was a simulated test submission. No actual participant data was stored in MongoDB.</span>
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              onClick={() => {
                setSubmittedResult(null);
                setFullName('');
                setEmail('');
                setPhone('');
                setKeyLearnings('');
                setFavoriteComponent('');
                setImprovementSuggestions('');
                setTestimonial('');
              }}
              className={`w-full sm:w-auto px-6 py-3 rounded-xl border font-mono text-xs font-bold uppercase transition-all cursor-pointer ${
                isLight ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-800' : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200'
              }`}
            >
              {isPreviewMode ? 'Test Fill Form Again' : 'Submit Another Response'}
            </button>

            {isPreviewMode && onClosePreview ? (
              <button
                onClick={onClosePreview}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-mono text-xs font-bold uppercase transition-all cursor-pointer shadow-lg"
              >
                Close Preview
              </button>
            ) : (
              <button
                onClick={onNavigateHome}
                className={`w-full sm:w-auto px-6 py-3 rounded-xl font-mono text-xs font-bold uppercase transition-all cursor-pointer ${
                  isLight ? 'bg-blue-950 hover:bg-blue-900 text-white' : 'bg-sky-400 hover:bg-sky-300 text-slate-950 font-black'
                }`}
              >
                Back to Main Portal →
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // IF FORM IS CLOSED BY ADMIN
  if (!config.isOpen) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-6">
        <div className={`p-8 rounded-3xl border shadow-lg backdrop-blur-xl ${
          isLight ? 'bg-white border-blue-900/15 text-slate-800' : 'bg-slate-900/80 border-slate-700 text-white'
        }`}>
          <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold font-mono uppercase">Workshop Feedback Currently Paused</h2>
          <p className={`text-xs mt-2 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
            The administrator has temporarily concluded or paused feedback submissions for current workshop sessions. If you attended a recent session, please contact your trainer or coordinator.
          </p>
          <div className="pt-6">
            <button
              onClick={onNavigateHome}
              className="px-6 py-2.5 rounded-xl bg-blue-900 hover:bg-blue-800 text-white font-mono text-xs font-bold uppercase cursor-pointer"
            >
              Return Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-8 animate-fadeIn">
      
      {/* PREVIEW MODE FLOATING BANNER */}
      {isPreviewMode && (
        <div className="p-3.5 px-4 rounded-2xl bg-amber-500/15 border border-amber-500/40 text-amber-300 flex items-center justify-between gap-3 text-xs font-mono shadow-lg backdrop-blur-md">
          <div className="flex items-center gap-2.5">
            <div className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping shrink-0" />
            <span>
              <strong>Workshop Form Preview Active:</strong> Inspecting attendee layout & input flows. Submissions are simulated safely.
            </span>
          </div>
          {onClosePreview && (
            <button
              onClick={onClosePreview}
              className="px-3 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-2xs uppercase font-bold shrink-0 cursor-pointer transition-all shadow"
            >
              Exit Preview
            </button>
          )}
        </div>
      )}

      {/* TOP BRANDING & WORKSHOP HEADER */}
      <div className={`p-6 sm:p-8 rounded-3xl border shadow-xl relative overflow-hidden backdrop-blur-xl transition-all ${
        isLight 
          ? 'bg-gradient-to-br from-blue-950/5 via-white to-blue-900/5 border-blue-900/15 text-slate-900' 
          : 'bg-gradient-to-br from-[#0a192f] via-[#0e2444] to-[#0a192f] border-sky-500/20 text-white'
      }`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-500/15">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-blue-900/20 border border-blue-400/30 flex items-center justify-center p-1 shrink-0 overflow-hidden">
              <DakshyamLogo size="sm" showText={false} interactive={false} pulseGlow={false} theme={theme} className="scale-65" />
            </div>
            <div>
              <span className="text-[10px] font-mono tracking-widest uppercase font-bold text-sky-400 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Dakshyam Innovations • Workshop Evaluation
              </span>
              <h1 className="text-xl sm:text-2xl font-black uppercase font-mono tracking-tight">
                {config.formTitle}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={copyShareLink}
              className={`text-2xs font-mono font-bold px-3 py-1.5 rounded-xl border flex items-center gap-1.5 transition-all cursor-pointer ${
                linkCopied
                  ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                  : isLight
                  ? 'bg-white border-blue-900/20 hover:bg-blue-50 text-blue-950'
                  : 'bg-slate-800/80 border-slate-700 hover:border-sky-500/40 text-sky-300'
              }`}
              title="Copy direct shareable feedback URL"
            >
              {linkCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
              {linkCopied ? 'Link Copied!' : 'Share Form Link'}
            </button>

            <button
              type="button"
              onClick={onNavigateHome}
              className={`p-1.5 rounded-xl border transition-all cursor-pointer ${
                isLight ? 'border-slate-200 text-slate-600 hover:bg-slate-100' : 'border-slate-700 text-slate-300 hover:bg-slate-800'
              }`}
              title="Return to home"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          </div>
        </div>

        <p className={`text-xs sm:text-sm mt-3 leading-relaxed max-w-2xl ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
          {config.formSubtitle}
        </p>

        {/* WORKSHOP DETAILS BANNER */}
        {activeWorkshop && (
          <div className={`mt-4 p-4 rounded-2xl border flex flex-wrap items-center justify-between gap-3 text-xs font-mono ${
            isLight ? 'bg-blue-50/70 border-blue-900/10 text-slate-800' : 'bg-blue-950/40 border-blue-900/30 text-sky-200'
          }`}>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-sky-400 shrink-0" />
              <span>Date: <strong>{activeWorkshop.date}</strong></span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-sky-400 shrink-0" />
              <span>Venue: <strong>{activeWorkshop.venue}</strong></span>
            </div>
            {activeWorkshop.trainerName && (
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-sky-400 shrink-0" />
                <span>Trainer: <strong>{activeWorkshop.trainerName}</strong></span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* FORM CONTAINER */}
      <form onSubmit={handleSubmit} className="space-y-8">
        
        {/* SECTION 1: WORKSHOP SELECTION & CATEGORY */}
        <div className={`p-6 sm:p-8 rounded-3xl border shadow-sm space-y-6 transition-all ${
          isLight ? 'bg-white border-blue-900/10' : 'bg-slate-900/50 border-blue-900/25'
        }`}>
          <div className="border-b pb-3 border-slate-500/15 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-sky-500/20 text-sky-400 font-mono font-bold text-xs flex items-center justify-center">
                1
              </span>
              <h2 className={`font-mono font-bold uppercase text-sm tracking-wide ${
                isLight ? 'text-slate-900' : 'text-white'
              }`}>
                Workshop Program & Attendee Profile
              </h2>
            </div>
            <span className="text-[10px] font-mono uppercase text-sky-400 font-semibold">
              Step 1 of 4
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Workshop Picker */}
            <div className="space-y-2">
              <label className={`text-xs font-mono font-bold uppercase tracking-wider block ${
                isLight ? 'text-slate-800' : 'text-slate-200'
              }`}>
                Select Workshop Program <span className="text-rose-400">*</span>
              </label>
              <select
                value={selectedWorkshopId}
                onChange={(e) => setSelectedWorkshopId(e.target.value)}
                className={`w-full px-4 py-3 rounded-xl border text-xs font-medium focus:outline-none transition-all ${
                  isLight 
                    ? 'bg-slate-50 border-slate-200 text-slate-900 focus:border-blue-900 focus:bg-white' 
                    : 'bg-[#0f172a] border-slate-700 text-white focus:border-sky-400 focus:bg-black/50'
                }`}
              >
                {config.workshops.filter(w => w.isActive).map((ws) => (
                  <option key={ws.id} value={ws.id}>
                    {ws.name} ({ws.date})
                  </option>
                ))}
              </select>
              <p className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                {activeWorkshop?.description || 'Hands-on practical hardware, embedded firmware, and electronics engineering workshop.'}
              </p>
            </div>

            {/* Attendee Category Selection */}
            <div className="space-y-2">
              <label className={`text-xs font-mono font-bold uppercase tracking-wider block ${
                isLight ? 'text-slate-800' : 'text-slate-200'
              }`}>
                Who Are You? (Participant Category) <span className="text-rose-400">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'student', label: 'Student', icon: GraduationCap },
                  { id: 'school', label: 'School Coordinator', icon: Building2 },
                  { id: 'college', label: 'College Faculty/Dean', icon: BookOpen },
                  { id: 'other', label: 'Industry / Other', icon: Wrench }
                ].map((item) => {
                  const Icon = item.icon;
                  const isSelected = participantCategory === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setParticipantCategory(item.id as ParticipantCategory)}
                      className={`p-3 rounded-xl border text-left flex items-center gap-2.5 transition-all cursor-pointer ${
                        isSelected
                          ? (isLight 
                              ? 'bg-blue-950 text-white border-blue-950 font-bold shadow-xs' 
                              : 'bg-sky-500/20 border-sky-400/60 text-white font-bold shadow-[0_0_12px_rgba(56,189,248,0.15)]')
                          : (isLight 
                              ? 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100' 
                              : 'bg-slate-800/50 border-slate-700 text-slate-300 hover:bg-slate-800')
                      }`}
                    >
                      <Icon className={`w-4 h-4 shrink-0 ${isSelected ? (isLight ? 'text-sky-300' : 'text-sky-400') : 'text-slate-400'}`} />
                      <span className="text-xs font-mono">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

          </div>
        </div>

        {/* SECTION 2: ATTENDEE ESSENTIAL DETAILS */}
        <div className={`p-6 sm:p-8 rounded-3xl border shadow-sm space-y-6 transition-all ${
          isLight ? 'bg-white border-blue-900/10' : 'bg-slate-900/50 border-blue-900/25'
        }`}>
          <div className="border-b pb-3 border-slate-500/15 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-sky-500/20 text-sky-400 font-mono font-bold text-xs flex items-center justify-center">
                2
              </span>
              <h2 className={`font-mono font-bold uppercase text-sm tracking-wide ${
                isLight ? 'text-slate-900' : 'text-white'
              }`}>
                Participant & Institution Details
              </h2>
            </div>
            <span className="text-[10px] font-mono uppercase text-sky-400 font-semibold">
              Step 2 of 4
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            
            {/* Full Name */}
            <div className="space-y-1.5">
              <label className={`text-xs font-mono font-bold uppercase tracking-wider block ${
                isLight ? 'text-slate-800' : 'text-slate-200'
              }`}>
                Full Name <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Aryan Nanda"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-xs focus:outline-none transition-all ${
                    errors.fullName ? 'border-rose-500 bg-rose-500/5' : ''
                  } ${
                    isLight 
                      ? 'bg-slate-50 border-slate-200 text-slate-900 focus:border-blue-900 focus:bg-white' 
                      : 'bg-[#0f172a] border-slate-700 text-white focus:border-sky-400 focus:bg-black/50'
                  }`}
                />
              </div>
              {errors.fullName && <p className="text-[11px] text-rose-500 font-mono">{errors.fullName}</p>}
            </div>

            {/* Email Address */}
            <div className="space-y-1.5">
              <label className={`text-xs font-mono font-bold uppercase tracking-wider block ${
                isLight ? 'text-slate-800' : 'text-slate-200'
              }`}>
                Email Address <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  required
                  placeholder="e.g. aryan@example.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-xs focus:outline-none transition-all ${
                    errors.email ? 'border-rose-500 bg-rose-500/5' : ''
                  } ${
                    isLight 
                      ? 'bg-slate-50 border-slate-200 text-slate-900 focus:border-blue-900 focus:bg-white' 
                      : 'bg-[#0f172a] border-slate-700 text-white focus:border-sky-400 focus:bg-black/50'
                  }`}
                />
              </div>
              {errors.email && <p className="text-[11px] text-rose-500 font-mono">{errors.email}</p>}
            </div>

            {/* Phone Number */}
            <div className="space-y-1.5">
              <label className={`text-xs font-mono font-bold uppercase tracking-wider block ${
                isLight ? 'text-slate-800' : 'text-slate-200'
              }`}>
                Phone / WhatsApp Number <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="tel"
                  required
                  placeholder="e.g. 9826123456"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-xs focus:outline-none transition-all ${
                    errors.phone ? 'border-rose-500 bg-rose-500/5' : ''
                  } ${
                    isLight 
                      ? 'bg-slate-50 border-slate-200 text-slate-900 focus:border-blue-900 focus:bg-white' 
                      : 'bg-[#0f172a] border-slate-700 text-white focus:border-sky-400 focus:bg-black/50'
                  }`}
                />
              </div>
              {errors.phone && <p className="text-[11px] text-rose-500 font-mono">{errors.phone}</p>}
            </div>

            {/* Institution / College / School Name */}
            <div className="space-y-1.5 sm:col-span-2">
              <label className={`text-xs font-mono font-bold uppercase tracking-wider block ${
                isLight ? 'text-slate-800' : 'text-slate-200'
              }`}>
                {participantCategory === 'school' ? 'School Name' : participantCategory === 'college' ? 'College / Polytechnic / University Name' : 'Institution / Enterprise Name'} <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <Building2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  required
                  placeholder={participantCategory === 'school' ? 'e.g. Model Higher Secondary School' : 'e.g. Govt. Engineering College, Jabalpur'}
                  value={institutionName}
                  onChange={(e) => setInstitutionName(e.target.value)}
                  className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-xs focus:outline-none transition-all ${
                    errors.institutionName ? 'border-rose-500 bg-rose-500/5' : ''
                  } ${
                    isLight 
                      ? 'bg-slate-50 border-slate-200 text-slate-900 focus:border-blue-900 focus:bg-white' 
                      : 'bg-[#0f172a] border-slate-700 text-white focus:border-sky-400 focus:bg-black/50'
                  }`}
                />
              </div>
              {errors.institutionName && <p className="text-[11px] text-rose-500 font-mono">{errors.institutionName}</p>}
            </div>

            {/* City / District */}
            <div className="space-y-1.5">
              <label className={`text-xs font-mono font-bold uppercase tracking-wider block ${
                isLight ? 'text-slate-800' : 'text-slate-200'
              }`}>
                City / District <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Balaghat / Waraseoni"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-xs focus:outline-none transition-all ${
                    errors.city ? 'border-rose-500 bg-rose-500/5' : ''
                  } ${
                    isLight 
                      ? 'bg-slate-50 border-slate-200 text-slate-900 focus:border-blue-900 focus:bg-white' 
                      : 'bg-[#0f172a] border-slate-700 text-white focus:border-sky-400 focus:bg-black/50'
                  }`}
                />
              </div>
              {errors.city && <p className="text-[11px] text-rose-500 font-mono">{errors.city}</p>}
            </div>

            {/* State */}
            <div className="space-y-1.5">
              <label className={`text-xs font-mono font-bold uppercase tracking-wider block ${
                isLight ? 'text-slate-800' : 'text-slate-200'
              }`}>
                State
              </label>
              <input
                type="text"
                value={state}
                onChange={(e) => setState(e.target.value)}
                className={`w-full px-4 py-2.5 rounded-xl border text-xs focus:outline-none transition-all ${
                  isLight 
                    ? 'bg-slate-50 border-slate-200 text-slate-900 focus:border-blue-900 focus:bg-white' 
                    : 'bg-[#0f172a] border-slate-700 text-white focus:border-sky-400 focus:bg-black/50'
                }`}
              />
            </div>

            {/* Branch / Grade / Department */}
            <div className="space-y-1.5">
              <label className={`text-xs font-mono font-bold uppercase tracking-wider block ${
                isLight ? 'text-slate-800' : 'text-slate-200'
              }`}>
                {participantCategory === 'student' ? 'Branch & Year / Grade' : 'Department / Discipline'}
              </label>
              <input
                type="text"
                placeholder={participantCategory === 'student' ? 'e.g. B.Tech ECE (3rd Year) or Class 11' : 'e.g. Electrical Engineering Dept'}
                value={branchOrGrade}
                onChange={(e) => setBranchOrGrade(e.target.value)}
                className={`w-full px-4 py-2.5 rounded-xl border text-xs focus:outline-none transition-all ${
                  isLight 
                    ? 'bg-slate-50 border-slate-200 text-slate-900 focus:border-blue-900 focus:bg-white' 
                    : 'bg-[#0f172a] border-slate-700 text-white focus:border-sky-400 focus:bg-black/50'
                }`}
              />
            </div>

            {/* Roll Number or Employee ID */}
            <div className="space-y-1.5">
              <label className={`text-xs font-mono font-bold uppercase tracking-wider block ${
                isLight ? 'text-slate-800' : 'text-slate-200'
              }`}>
                {participantCategory === 'student' ? 'Roll No / Student ID' : 'Employee ID / Designation Code'}
              </label>
              <input
                type="text"
                placeholder="e.g. 0101EC231012 (optional)"
                value={rollOrEmployeeId}
                onChange={(e) => setRollOrEmployeeId(e.target.value)}
                className={`w-full px-4 py-2.5 rounded-xl border text-xs focus:outline-none transition-all ${
                  isLight 
                    ? 'bg-slate-50 border-slate-200 text-slate-900 focus:border-blue-900 focus:bg-white' 
                    : 'bg-[#0f172a] border-slate-700 text-white focus:border-sky-400 focus:bg-black/50'
                }`}
              />
            </div>

          </div>
        </div>

        {/* SECTION 3: WORKSHOP RATINGS & PRACTICAL EVALUATION */}
        <div className={`p-6 sm:p-8 rounded-3xl border shadow-sm space-y-6 transition-all ${
          isLight ? 'bg-white border-blue-900/10' : 'bg-slate-900/50 border-blue-900/25'
        }`}>
          <div className="border-b pb-3 border-slate-500/15 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-sky-500/20 text-sky-400 font-mono font-bold text-xs flex items-center justify-center">
                3
              </span>
              <h2 className={`font-mono font-bold uppercase text-sm tracking-wide ${
                isLight ? 'text-slate-900' : 'text-white'
              }`}>
                Workshop Quality & Practical Rating
              </h2>
            </div>
            <span className="text-[10px] font-mono uppercase text-sky-400 font-semibold">
              Step 3 of 4
            </span>
          </div>

          <div className="space-y-4">
            <StarRatingSelector
              label="1. Overall Workshop Quality & Practical Value"
              value={overallRating}
              onChange={setOverallRating}
              description="How valuable, engaging, and enriching was the overall workshop experience?"
            />

            <StarRatingSelector
              label="2. Trainer Technical Knowledge & Explanation Clarity"
              value={trainerKnowledgeRating}
              onChange={setTrainerKnowledgeRating}
              description="Did the trainers explain concepts clearly and guide you during hardware debugging?"
            />

            <StarRatingSelector
              label="3. Practical Hardware Kits & Laboratory Hands-on Setup"
              value={practicalHardwareRating}
              onChange={setPracticalHardwareRating}
              description="Were the ESP32 kits, motors, breadboards, and sensors adequate and functioning reliably?"
            />

            <StarRatingSelector
              label="4. Relevance to Industry Standards, NEP 2020 & Career Skills"
              value={industryRelevanceRating}
              onChange={setIndustryRelevanceRating}
              description="How relevant are these skills to real-world engineering, industrial automation, or academics?"
            />

            <StarRatingSelector
              label="5. Session Management, Lab Logistics & Time Allotment"
              value={labManagementRating}
              onChange={setLabManagementRating}
              description="Punctuality, pacing, lab assistance, and answering individual participant queries."
            />
          </div>
        </div>

        {/* SECTION 4: QUALITATIVE TAKEAWAYS & SUGGESTIONS */}
        <div className={`p-6 sm:p-8 rounded-3xl border shadow-sm space-y-6 transition-all ${
          isLight ? 'bg-white border-blue-900/10' : 'bg-slate-900/50 border-blue-900/25'
        }`}>
          <div className="border-b pb-3 border-slate-500/15 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-sky-500/20 text-sky-400 font-mono font-bold text-xs flex items-center justify-center">
                4
              </span>
              <h2 className={`font-mono font-bold uppercase text-sm tracking-wide ${
                isLight ? 'text-slate-900' : 'text-white'
              }`}>
                Learnings, Feedback & Future Topics
              </h2>
            </div>
            <span className="text-[10px] font-mono uppercase text-sky-400 font-semibold">
              Step 4 of 4
            </span>
          </div>

          <div className="space-y-5">
            {/* Key Learnings */}
            <div className="space-y-1.5">
              <label className={`text-xs font-mono font-bold uppercase tracking-wider block ${
                isLight ? 'text-slate-800' : 'text-slate-200'
              }`}>
                What was your most important practical learning from this workshop? <span className="text-rose-400">*</span>
              </label>
              <textarea
                required
                rows={3}
                placeholder="e.g. Connecting ESP32 to Wi-Fi telemetry, motor driver wiring, troubleshooting analog sensors, and real-time dashboard visualization..."
                value={keyLearnings}
                onChange={(e) => setKeyLearnings(e.target.value)}
                className={`w-full px-4 py-3 rounded-xl border text-xs focus:outline-none transition-all leading-relaxed ${
                  errors.keyLearnings ? 'border-rose-500 bg-rose-500/5' : ''
                } ${
                  isLight 
                    ? 'bg-slate-50 border-slate-200 text-slate-900 focus:border-blue-900 focus:bg-white' 
                    : 'bg-[#0f172a] border-slate-700 text-white focus:border-sky-400 focus:bg-black/50'
                }`}
              />
              {errors.keyLearnings && <p className="text-[11px] text-rose-500 font-mono">{errors.keyLearnings}</p>}
            </div>

            {/* Favorite Component / Exercise */}
            <div className="space-y-1.5">
              <label className={`text-xs font-mono font-bold uppercase tracking-wider block ${
                isLight ? 'text-slate-800' : 'text-slate-200'
              }`}>
                Which hardware experiment or coding challenge did you enjoy the most?
              </label>
              <input
                type="text"
                placeholder="e.g. Autonomous line following rover, cloud telemetry dashboard, PWM speed control..."
                value={favoriteComponent}
                onChange={(e) => setFavoriteComponent(e.target.value)}
                className={`w-full px-4 py-2.5 rounded-xl border text-xs focus:outline-none transition-all ${
                  isLight 
                    ? 'bg-slate-50 border-slate-200 text-slate-900 focus:border-blue-900 focus:bg-white' 
                    : 'bg-[#0f172a] border-slate-700 text-white focus:border-sky-400 focus:bg-black/50'
                }`}
              />
            </div>

            {/* Improvement Suggestions */}
            <div className="space-y-1.5">
              <label className={`text-xs font-mono font-bold uppercase tracking-wider block ${
                isLight ? 'text-slate-800' : 'text-slate-200'
              }`}>
                Suggestions for Improvement (How can we make future workshops even better?)
              </label>
              <textarea
                rows={2}
                placeholder="e.g. Provide more project build time, include printed circuit schematics, conduct follow-up sessions..."
                value={improvementSuggestions}
                onChange={(e) => setImprovementSuggestions(e.target.value)}
                className={`w-full px-4 py-3 rounded-xl border text-xs focus:outline-none transition-all leading-relaxed ${
                  isLight 
                    ? 'bg-slate-50 border-slate-200 text-slate-900 focus:border-blue-900 focus:bg-white' 
                    : 'bg-[#0f172a] border-slate-700 text-white focus:border-sky-400 focus:bg-black/50'
                }`}
              />
            </div>

            {/* Future Workshop Topics Interest */}
            <div className="space-y-2 pt-2">
              <label className={`text-xs font-mono font-bold uppercase tracking-wider block ${
                isLight ? 'text-slate-800' : 'text-slate-200'
              }`}>
                Select future technical topics you want Dakshyam to organize next:
              </label>
              <div className="flex flex-wrap gap-2">
                {COMMON_INTEREST_TAGS.map((tag) => {
                  const isSelected = selectedInterests.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleInterest(tag)}
                      className={`text-2xs font-mono px-3 py-1.5 rounded-xl border transition-all cursor-pointer ${
                        isSelected
                          ? (isLight 
                              ? 'bg-blue-950 text-white border-blue-950 font-bold' 
                              : 'bg-sky-500/20 border-sky-400 text-sky-200 font-bold shadow-[0_0_10px_rgba(56,189,248,0.2)]')
                          : (isLight 
                              ? 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100' 
                              : 'bg-slate-800/50 border-slate-700 text-slate-300 hover:bg-slate-800')
                      }`}
                    >
                      {isSelected ? '✓ ' : '+ '} {tag}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Recommendation NPS */}
            <div className="space-y-2 pt-2">
              <label className={`text-xs font-mono font-bold uppercase tracking-wider block ${
                isLight ? 'text-slate-800' : 'text-slate-200'
              }`}>
                Would you recommend Dakshyam Innovations workshops to your peers or institution? <span className="text-rose-400">*</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {['Yes, Definitely', 'Likely', 'Uncertain', 'No'].map((recOption) => {
                  const isSelected = recommendDakshyam === recOption;
                  return (
                    <button
                      key={recOption}
                      type="button"
                      onClick={() => setRecommendDakshyam(recOption as any)}
                      className={`p-2.5 rounded-xl border text-center font-mono text-xs transition-all cursor-pointer ${
                        isSelected
                          ? (isLight 
                              ? 'bg-blue-950 text-white border-blue-950 font-bold' 
                              : 'bg-sky-500/20 border-sky-400 text-white font-bold')
                          : (isLight 
                              ? 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100' 
                              : 'bg-slate-800/50 border-slate-700 text-slate-300 hover:bg-slate-800')
                      }`}
                    >
                      {recOption}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Testimonial Quote */}
            <div className="space-y-1.5 pt-2">
              <label className={`text-xs font-mono font-bold uppercase tracking-wider block ${
                isLight ? 'text-slate-800' : 'text-slate-200'
              }`}>
                Brief Testimonial / Feedback Quote (Optional consent to feature on Dakshyam Showcase)
              </label>
              <input
                type="text"
                placeholder="e.g. Best practical electronics workshop experience in our region!"
                value={testimonial}
                onChange={(e) => setTestimonial(e.target.value)}
                className={`w-full px-4 py-2.5 rounded-xl border text-xs focus:outline-none transition-all ${
                  isLight 
                    ? 'bg-slate-50 border-slate-200 text-slate-900 focus:border-blue-900 focus:bg-white' 
                    : 'bg-[#0f172a] border-slate-700 text-white focus:border-sky-400 focus:bg-black/50'
                }`}
              />
            </div>

            {/* Custom Admin Questions (if any configured) */}
            {config.customQuestions && config.customQuestions.length > 0 && (
              <div className="space-y-4 pt-4 border-t border-slate-500/15">
                <span className="text-[11px] font-mono text-sky-400 uppercase font-bold block">
                  Additional Workshop Specific Questions
                </span>
                {config.customQuestions.map((q) => (
                  <div key={q.id} className="space-y-1.5">
                    <label className={`text-xs font-mono font-bold uppercase tracking-wider block ${
                      isLight ? 'text-slate-800' : 'text-slate-200'
                    }`}>
                      {q.label} {q.required && <span className="text-rose-400">*</span>}
                    </label>

                    {q.type === 'choice' && q.options && (
                      <div className="flex flex-wrap gap-2">
                        {q.options.map((opt) => {
                          const isOptSelected = customAnswers[q.id] === opt;
                          return (
                            <button
                              key={opt}
                              type="button"
                              onClick={() => setCustomAnswers(prev => ({ ...prev, [q.id]: opt }))}
                              className={`px-3 py-1.5 rounded-xl border text-xs font-mono transition-all cursor-pointer ${
                                isOptSelected
                                  ? (isLight ? 'bg-blue-950 text-white border-blue-950 font-bold' : 'bg-sky-500/20 border-sky-400 text-white font-bold')
                                  : (isLight ? 'bg-slate-50 border-slate-200 text-slate-700' : 'bg-slate-800 border-slate-700 text-slate-300')
                              }`}
                            >
                              {opt}
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {q.type === 'yesno' && (
                      <div className="flex gap-2">
                        {['Yes', 'No'].map((yn) => {
                          const isYnSelected = customAnswers[q.id] === yn;
                          return (
                            <button
                              key={yn}
                              type="button"
                              onClick={() => setCustomAnswers(prev => ({ ...prev, [q.id]: yn }))}
                              className={`px-5 py-2 rounded-xl border text-xs font-mono transition-all cursor-pointer ${
                                isYnSelected
                                  ? (isLight ? 'bg-blue-950 text-white border-blue-950 font-bold' : 'bg-sky-500/20 border-sky-400 text-white font-bold')
                                  : (isLight ? 'bg-slate-50 border-slate-200 text-slate-700' : 'bg-slate-800 border-slate-700 text-slate-300')
                              }`}
                            >
                              {yn}
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {q.type === 'text' && (
                      <input
                        type="text"
                        value={customAnswers[q.id] || ''}
                        onChange={(e) => setCustomAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}
                        className={`w-full px-4 py-2 rounded-xl border text-xs focus:outline-none transition-all ${
                          isLight ? 'bg-slate-50 border-slate-200 text-slate-900' : 'bg-[#0f172a] border-slate-700 text-white'
                        }`}
                      />
                    )}

                    {errors[`custom_${q.id}`] && (
                      <p className="text-[11px] text-rose-500 font-mono">{errors[`custom_${q.id}`]}</p>
                    )}
                  </div>
                ))}
              </div>
            )}

          </div>
        </div>

        {/* ERROR SUMMARY */}
        {errors.submit && (
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-mono flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errors.submit}</span>
          </div>
        )}

        {/* SUBMIT BUTTON */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
          <p className={`text-[11px] font-mono ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
            🔒 Submissions are authenticated, cryptographically logged, and audited for quality assurance.
          </p>

          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full sm:w-auto px-8 py-3.5 rounded-xl font-mono text-xs uppercase font-bold flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer active:scale-95 disabled:opacity-50 ${
              isLight 
                ? 'bg-blue-950 hover:bg-blue-900 text-white shadow-blue-950/20' 
                : 'bg-white hover:bg-slate-100 text-[#0a192f] shadow-[0_0_20px_rgba(255,255,255,0.2)] font-black'
            }`}
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                <span>Recording Feedback...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Submit Workshop Evaluation</span>
              </>
            )}
          </button>
        </div>

      </form>

    </div>
  );
}
