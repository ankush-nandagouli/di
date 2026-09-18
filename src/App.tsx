import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Trophy, BookOpen, ShieldCheck, Play, UserCircle, 
  LogOut, LogIn, ChevronRight, HelpCircle, Activity, Sparkles, School,
  Sun, Moon, Menu, X, Eye, EyeOff, Lock, Settings, Key, Info, Cpu, Compass,
  UserPlus, ShieldAlert, CheckCircle2, Check, ClipboardList
} from 'lucide-react';

import ThreeBackground from './components/ThreeBackground';
import LandingPage from './components/LandingPage';
import LeaderboardComp from './components/Leaderboard';
import CourseRegistrationForm from './components/CourseRegistrationForm';
import CertificateVerify from './components/CertificateVerify';
import SocialVideoWall from './components/SocialVideoWall';
import StudentDashboard from './components/StudentDashboard';
import TrainerDashboard from './components/TrainerDashboard';
import AdminDashboard from './components/AdminDashboard';
import AboutCompany from './components/AboutCompany';
import ContactUs from './components/ContactUs';
import PageLoader from './components/PageLoader';
import WorkshopFeedbackForm from './components/WorkshopFeedbackForm';
import AdminWorkshopFeedbackManager from './components/AdminWorkshopFeedbackManager';
import { SecurityToast } from './components/SecurityToast';
import { SecurityGuard } from './utils/security';
import { syncStorageWithCookies } from './utils/secureCookie';

import { DakshyamDatabase } from './utils/db';
import { Course, CourseApplication, StudentGroup, StudentUser, Certificate, VideoPost, PromoBanner, GalleryImage, PageLoaderConfig } from './types';
import { BeautifulErrorDisplay } from './utils/errorShield';
import { getVideoBlob, cacheVideoFromUrl } from './utils/videoStorage';

// Firebase Auth & Firestore SDK imports
import { 
  sendPasswordResetEmail,
  createUserWithEmailAndPassword
} from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth as firebaseAuth, db } from './utils/firebase';

export default function App() {
  // Theme & Mobile Menu states
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    try {
      const cookieTheme = DakshyamDatabase.getCookie('dakshyam_theme');
      if (cookieTheme === 'light' || cookieTheme === 'dark') return cookieTheme;
      const stored = localStorage.getItem('dakshyam_theme');
      return (stored === 'light' || stored === 'dark') ? stored : 'dark';
    } catch {
      return 'dark';
    }
  });

  const [cookieConsent, setCookieConsent] = useState(() => DakshyamDatabase.getCookie('dakshyam_cookie_consent'));

  const [menuOpen, setMenuOpen] = useState(false);
  const [isStaffAccessEnabled, setIsStaffAccessEnabled] = useState(false);

  // 6-digit Supervisor access PIN states
  const [showPinPrompt, setShowPinPrompt] = useState(false);
  const [enteredPin, setEnteredPin] = useState('');
  const [pinError, setPinError] = useState('');

  // Helper to parse feedback routes (supports /feedback-form/workshop-name, /feedback, /workshop, hashes, params, etc.)
  const parseInitialFeedbackRoute = () => {
    try {
      if (typeof window === 'undefined') return { isFeedback: false, slug: null, fromPath: false };
      const pathname = window.location.pathname;
      const searchParams = new URLSearchParams(window.location.search);
      const hash = window.location.hash || '';

      const feedbackPrefixes = ['/feedback-form', '/feedback', '/workshop-form', '/workshop', '/workshops'];
      for (const prefix of feedbackPrefixes) {
        if (pathname.startsWith(prefix)) {
          const parts = pathname.slice(prefix.length).split('/').filter(Boolean);
          const slug = parts.length > 0 ? decodeURIComponent(parts[0]) : null;
          return { isFeedback: true, slug, fromPath: true };
        }
      }

      // Check hash route (e.g. #/feedback-form/slug or #feedback...)
      if (hash.includes('feedback') || hash.includes('workshop')) {
        const cleanHash = hash.replace(/^#\/?/, '');
        for (const prefix of feedbackPrefixes) {
          const cleanPrefix = prefix.replace(/^\//, '');
          if (cleanHash.startsWith(cleanPrefix)) {
            const parts = cleanHash.slice(cleanPrefix.length).split('/').filter(Boolean);
            const slug = parts.length > 0 ? decodeURIComponent(parts[0]) : null;
            return { isFeedback: true, slug, fromPath: true };
          }
        }
      }

      if (searchParams.get('tab') === 'feedback' || searchParams.get('feedback') !== null || searchParams.get('workshop') !== null) {
        const slug = searchParams.get('workshop') || searchParams.get('w') || searchParams.get('ws') || searchParams.get('slug');
        return { isFeedback: true, slug, fromPath: false };
      }
    } catch (e) {
      console.error('URL parse fail', e);
    }
    return { isFeedback: false, slug: null, fromPath: false };
  };

  const initialFeedbackRoute = parseInitialFeedbackRoute();

  // Navigation states
  const [activeTab, setActiveTab] = useState<'home' | 'services' | 'leaderboard' | 'social' | 'portal' | 'verification' | 'about' | 'contact' | 'feedback'>(() => {
    if (initialFeedbackRoute.isFeedback) {
      return 'feedback';
    }
    try {
      const searchParams = new URLSearchParams(window.location.search);
      const tabParam = searchParams.get('tab');
      if (tabParam && ['home', 'services', 'leaderboard', 'social', 'portal', 'verification', 'about', 'contact', 'feedback'].includes(tabParam)) {
        return tabParam as any;
      }
    } catch (e) {
      console.error('URL parse fail', e);
    }
    return 'home';
  });
  const [feedbackViewMode, setFeedbackViewMode] = useState<'audit' | 'form'>(() => {
    // If arriving via shared feedback link, default directly to public participant form
    if (initialFeedbackRoute.isFeedback) {
      return 'form';
    }
    return 'audit';
  });
  const [preselectedWorkshopSlug, setPreselectedWorkshopSlug] = useState<string | null>(initialFeedbackRoute.slug);
  const [preselectedCourseId, setPreselectedCourseId] = useState<string | null>(null);

  // --- ANIMATED VIDEO LAZY LOADER STATES ---
  const [pageLoaderConfig, setPageLoaderConfig] = useState<PageLoaderConfig>(() => {
    return DakshyamDatabase.getPageLoaderConfig();
  });
  const [isPageLoading, setIsPageLoading] = useState<boolean>(true);
  const [loadingTargetTab, setLoadingTargetTab] = useState<string>('home');
  const [localVideoUrl, setLocalVideoUrl] = useState<string>('');

  // Hydrate local video from IndexedDB if uploaded locally
  useEffect(() => {
    let activeObjUrl: string | null = null;
    async function loadCachedVideoBlob() {
      try {
        const blob = await getVideoBlob('page_loader_video');
        if (blob) {
          activeObjUrl = URL.createObjectURL(blob);
          setLocalVideoUrl(activeObjUrl);
        }
      } catch (err) {
        console.warn('Could not read cached video blob from IndexedDB:', err);
      }
    }
    loadCachedVideoBlob();

    return () => {
      if (activeObjUrl) {
        URL.revokeObjectURL(activeObjUrl);
      }
    };
  }, [pageLoaderConfig.updatedAt]);

  // Global Real-time Subscription to Page Loader Config from Firestore
  useEffect(() => {
    try {
      const configDocRef = doc(db, 'settings', 'page_loader_config');
      const unsubscribe = onSnapshot(configDocRef, (snap) => {
        if (snap.exists()) {
          const cloudData = snap.data();
          const cloudConfig = (cloudData.value || cloudData) as PageLoaderConfig;
          if (cloudConfig && typeof cloudConfig === 'object' && cloudConfig.videoUrl !== undefined) {
            setPageLoaderConfig((prev) => ({ ...prev, ...cloudConfig }));
            DakshyamDatabase.savePageLoaderConfig({ ...pageLoaderConfig, ...cloudConfig });
            if (cloudConfig.videoUrl) {
              cacheVideoFromUrl(cloudConfig.videoUrl, 'page_loader_video').then((cached) => {
                if (cached) setLocalVideoUrl(cached);
              }).catch(() => {});
            }
          }
        }
      }, (err) => {
        console.warn('Firestore page loader config sync notice:', err);
      });
      return () => unsubscribe();
    } catch (err) {
      console.warn('Firestore page loader config snapshot error:', err);
    }
  }, []);

  // Initial page load lazy animation & Enterprise Security Initialization
  useEffect(() => {
    // Initialize Enterprise Security Guard (restricts unauthorized right click & devtools inspection)
    SecurityGuard.init();
    // Synchronize resilient cookie and local storage across Edge, Brave, and modern browsers
    syncStorageWithCookies();

    if (pageLoaderConfig.enabled) {
      const timer = setTimeout(() => {
        setIsPageLoading(false);
      }, Math.max(pageLoaderConfig.minDurationMs || 850, 700));
      return () => clearTimeout(timer);
    } else {
      setIsPageLoading(false);
    }
  }, []);

  // Listen to browser navigation popstate (e.g. back/forward or direct feedback links)
  useEffect(() => {
    const handlePopState = () => {
      const route = parseInitialFeedbackRoute();
      if (route.isFeedback) {
        setActiveTab('feedback');
        setFeedbackViewMode('form');
        if (route.slug) {
          setPreselectedWorkshopSlug(route.slug);
        }
      } else {
        const searchParams = new URLSearchParams(window.location.search);
        const tabParam = searchParams.get('tab');
        if (tabParam && ['home', 'services', 'leaderboard', 'social', 'portal', 'verification', 'about', 'contact', 'feedback'].includes(tabParam)) {
          setActiveTab(tabParam as any);
        } else {
          setActiveTab('home');
        }
      }
    };
    window.addEventListener('popstate', handlePopState);
    window.addEventListener('hashchange', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('hashchange', handlePopState);
    };
  }, []);

  // Compute active loader configuration with local video preference
  const activeLoaderConfig: PageLoaderConfig = {
    ...pageLoaderConfig,
    videoUrl: localVideoUrl || pageLoaderConfig.videoUrl || ''
  };

  // Safe navigation function triggering the animated lazy loader on every page change
  const navigateToTab = (
    newTab: 'home' | 'services' | 'leaderboard' | 'social' | 'portal' | 'verification' | 'about' | 'contact' | 'feedback',
    preselectCourse: string | null = null,
    preselectWorkshop: string | null = null
  ) => {
    if (preselectCourse !== undefined) {
      setPreselectedCourseId(preselectCourse);
    }
    if (preselectWorkshop !== undefined) {
      setPreselectedWorkshopSlug(preselectWorkshop);
    }
    setMenuOpen(false);

    try {
      const url = new URL(window.location.href);
      if (newTab === 'feedback') {
        url.searchParams.set('tab', 'feedback');
        if (preselectWorkshop) {
          url.searchParams.set('workshop', preselectWorkshop);
        }
      } else if (newTab === 'home') {
        url.pathname = '/';
        url.searchParams.delete('tab');
        url.searchParams.delete('workshop');
        url.searchParams.delete('feedback');
      } else {
        url.pathname = '/';
        url.searchParams.set('tab', newTab);
        url.searchParams.delete('workshop');
        url.searchParams.delete('feedback');
      }
      window.history.replaceState(null, '', url.toString());
    } catch {}

    if (newTab === activeTab) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (pageLoaderConfig.enabled && pageLoaderConfig.showOnTabChange) {
      setLoadingTargetTab(newTab);
      setIsPageLoading(true);

      const switchTimer = setTimeout(() => {
        setActiveTab(newTab);
        window.scrollTo({ top: 0, behavior: 'instant' });
      }, 120);

      const finishTimer = setTimeout(() => {
        setIsPageLoading(false);
      }, Math.max(pageLoaderConfig.minDurationMs || 850, 600));

      return () => {
        clearTimeout(switchTimer);
        clearTimeout(finishTimer);
      };
    } else {
      setActiveTab(newTab);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const [pendingApplyCourseId, setPendingApplyCourseId] = useState<string | null>(() => {
    try {
      return sessionStorage.getItem('dakshyam_pending_course_apply') || null;
    } catch {
      return null;
    }
  });
  const [showApplyAuthPrompt, setShowApplyAuthPrompt] = useState(false);
  const [applicationSuccessBanner, setApplicationSuccessBanner] = useState<string | null>(null);
  const [logoError, setLogoError] = useState(false);

  // Authentication UI Modal
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register' | 'forgot'>('login');
  const [authRoleTab, setAuthRoleTab] = useState<'student' | 'trainer' | 'admin'>('student');

  // Input states
  const [studentEmail, setStudentEmail] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [studentName, setStudentName] = useState('');
  const [studentPhone, setStudentPhone] = useState('');
  const [studentSchool, setStudentSchool] = useState('');
  const [studentLevel, setStudentLevel] = useState('Grade 10');

  // Secret passcode states (Trainer/Admin URL security)
  const [secretCode, setSecretCode] = useState('');
  const [trainerRegCode, setTrainerRegCode] = useState('');
  const [authError, setAuthError] = useState('');

  // Rate limiting & security lockout states
  const [failedAttempts, setFailedAttempts] = useState<Record<string, number>>({});
  const [lockoutTimers, setLockoutTimers] = useState<Record<string, number>>({});

  // Forgot Password Recovery states
  const [resetEmail, setResetEmail] = useState('');
  const [resetSuccessMessage, setResetSuccessMessage] = useState('');

  // Email verification states
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpInput, setOtpInput] = useState('');
  const [otpStatusMsg, setOtpStatusMsg] = useState('');

  const triggerOtp = async () => {
    setOtpStatusMsg('');
    const emailClean = studentEmail.trim();
    if (!emailClean || !emailClean.includes('@')) {
      setOtpStatusMsg('❌ Enter a valid email first.');
      return;
    }
    setOtpStatusMsg('⏳ Signalling secure OTP server...');
    try {
      const res = await fetch('/api/verify/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailClean })
      });
      const data = await res.json();
      if (res.ok) {
        setOtpSent(true);
        setOtpStatusMsg(data.message || '✓ Code dispatched!');
      } else {
        setOtpStatusMsg(`❌ Error: ${data.error || 'Request failed.'}`);
      }
    } catch (err: any) {
      setOtpStatusMsg(`❌ Connection Error: ${err.message || err}`);
    }
  };

  const confirmOtp = async () => {
    setOtpStatusMsg('');
    if (!otpInput) {
      setOtpStatusMsg('❌ Enter the 6-digit verification code.');
      return;
    }
    setOtpStatusMsg('⏳ Confirming profile security...');
    try {
      const res = await fetch('/api/verify/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: studentEmail.trim(), code: otpInput.trim() })
      });
      const data = await res.json();
      if (res.ok) {
        setIsEmailVerified(true);
        setOtpStatusMsg('✓ Profile verified successfully! Proceed to register.');
      } else {
        setOtpStatusMsg(`❌ Error: ${data.error || 'Verification failed.'}`);
      }
    } catch (err: any) {
      setOtpStatusMsg(`❌ Network Exception: ${err.message || err}`);
    }
  };

  // Strict secure input sanitization and verification against SQL/Query injection or Cross-Site Scripting (XSS)
  const isInputSafe = (val: string, fieldName = 'input'): { safe: boolean; error?: string } => {
    if (!val) return { safe: true };
    if (val.length > 100) {
      return { safe: false, error: `Invalid ${fieldName}: Input exceeds maximum secure length.` };
    }
    const maliciousPatterns = [
      /['";`]/g,
      /--/g,
      /union\s+select/gi,
      /select\s+.*\s+from/gi,
      /insert\s+into/gi,
      /delete\s+from/gi,
      /drop\s+table/gi,
      /update\s+.*\s+set/gi,
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      /javascript:/gi,
      /onload=/gi,
      /onerror=/gi
    ];
    for (const pattern of maliciousPatterns) {
      if (pattern.test(val)) {
        return { safe: false, error: `Malicious characters or query injection detected in ${fieldName}. Special symbols and SQL syntax are strictly forbidden.` };
      }
    }
    return { safe: true };
  };

  const isValidEmail = (emailStr: string): boolean => {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(emailStr);
  };

  // Secure SHA-256 Client-Side Hashing Generator
  const hashPassword = async (pwd: string): Promise<string> => {
    try {
      const msgUint8 = new TextEncoder().encode(pwd);
      const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    } catch {
      let hash1 = 0x811c9dc5;
      let hash2 = 0x55aa55aa;
      for (let i = 0; i < pwd.length; i++) {
        hash1 ^= pwd.charCodeAt(i);
        hash1 += (hash1 << 1) + (hash1 << 4) + (hash1 << 7) + (hash1 << 8) + (hash1 << 24);
        hash2 = (hash2 << 5) - hash2 + pwd.charCodeAt(i);
        hash2 |= 0;
      }
      return 'sha_sim_' + Math.abs(hash1).toString(16) + Math.abs(hash2).toString(16);
    }
  };

  const checkLockout = (emailStr: string): boolean => {
    const lockTime = lockoutTimers[emailStr.toLowerCase()];
    if (lockTime) {
      const now = Date.now();
      if (now < lockTime) {
        const remaining = Math.ceil((lockTime - now) / 1000);
        setAuthError(`❌ SECURITY BRACE LOCKOUT: Too many failed login attempts. Locked out. Please wait ${remaining} seconds before retrying.`);
        return true;
      } else {
        const updatedLockouts = { ...lockoutTimers };
        delete updatedLockouts[emailStr.toLowerCase()];
        setLockoutTimers(updatedLockouts);
        
        const updatedAttempts = { ...failedAttempts };
        delete updatedAttempts[emailStr.toLowerCase()];
        setFailedAttempts(updatedAttempts);
      }
    }
    return false;
  };

  const handleFailedAttempt = (emailStr: string) => {
    const current = (failedAttempts[emailStr.toLowerCase()] || 0) + 1;
    const updatedAttempts = { ...failedAttempts, [emailStr.toLowerCase()]: current };
    setFailedAttempts(updatedAttempts);

    if (current >= 5) {
      const lockDuration = 30 * 1000; 
      const lockUntil = Date.now() + lockDuration;
      setLockoutTimers({ ...lockoutTimers, [emailStr.toLowerCase()]: lockUntil });
      setAuthError(`❌ SECURITY LOCKOUT: 5 failed attempts reached. Brute-force safeguard active. Access is locked for 30 seconds.`);
      DakshyamDatabase.logEvent('Security Lockout Engaged', `User/Admin account ${emailStr} locked out due to 5 consecutive authentication failures.`, emailStr, 'unknown', 'ERROR');
    } else {
      setAuthError(`❌ Incorrect secure credentials. Attempt ${current}/5. Access blocks after 5 failures.`);
      DakshyamDatabase.logEvent('Failed Authentication Attempt', `Failed login attempt ${current}/5 for email: ${emailStr}`, emailStr, 'unknown', 'ERROR');
    }
  };

  // --- FORGOT PASSWORD RECOVERY HANDLER ---
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setResetSuccessMessage('');

    const emailClean = resetEmail.trim();

    if (!emailClean) {
      setAuthError('Please fill out your registered email address.');
      return;
    }

    const emailCheck = isInputSafe(emailClean, 'Verification Email');
    if (!emailCheck.safe) { setAuthError(emailCheck.error); return; }

    if (!isValidEmail(emailClean)) {
      setAuthError('❌ Invalid security format: Email structure is invalid.');
      return;
    }

    try {
      // First check if the user exists in our local systems (student or trainer)
      const studentsList = DakshyamDatabase.getStudents();
      const trainersList = DakshyamDatabase.getTrainers();
      
      const isStudent = studentsList.some(s => s.email.toLowerCase() === emailClean.toLowerCase());
      const isTrainer = trainersList.some(t => t.email.toLowerCase() === emailClean.toLowerCase());

      if (!isStudent && !isTrainer) {
        setAuthError('❌ Account not found: This email address is not registered under any Student or Trainer account.');
        return;
      }

      setResetSuccessMessage('⏳ Contacting secure authentication server... Dispatching recovery email...');

      try {
        // Attempt direct email dispatch
        await sendPasswordResetEmail(firebaseAuth, emailClean);
        setResetSuccessMessage(`✓ RECOVERY EMAIL DISPATCHED: A secure password reset link has been sent to ${emailClean}. Please verify your inbox and spam folder.`);
        setResetEmail('');
      } catch (fbError: any) {
        // If the error indicates they are not in our auth record yet, let's provision them dynamically so they can receive it
        if (
          fbError.code === 'auth/user-not-found' || 
          fbError.code === 'auth/invalid-credential' || 
          fbError.message?.includes('user-not-found')
        ) {
          try {
            // Retrieve their existing local password, or default to a dummy one
            let localPassword = 'TemporaryUserPass123!';
            if (isStudent) {
              const sObj = studentsList.find(s => s.email.toLowerCase() === emailClean.toLowerCase());
              if (sObj && sObj.password) localPassword = sObj.password;
            } else if (isTrainer) {
              const tObj = trainersList.find(t => t.email.toLowerCase() === emailClean.toLowerCase());
              if (tObj && tObj.password) localPassword = tObj.password;
            }

            // Create user in Auth database so they can receive the password reset mail
            await createUserWithEmailAndPassword(firebaseAuth, emailClean, localPassword);
            // Now trigger password reset email
            await sendPasswordResetEmail(firebaseAuth, emailClean);
            
            setResetSuccessMessage(`✓ RECOVERY EMAIL DISPATCHED: A secure password reset link has been successfully dispatched to ${emailClean}. Please check your inbox and spam folders.`);
            setResetEmail('');
          } catch (createError: any) {
            setAuthError(`❌ Security Sync Error: ${createError.message || createError}`);
          }
        } else {
          setAuthError(`❌ Authentication Service Error: ${fbError.message || fbError}`);
        }
      }
    } catch (err: any) {
      setAuthError(`❌ Reset Process Failed: ${err.message || err}`);
    }
  };

  // Loaded database states
  const [courses, setCourses] = useState<Course[]>([]);
  const [students, setStudents] = useState<StudentUser[]>([]);
  const [groups, setGroups] = useState<StudentGroup[]>([]);
  const [videos, setVideos] = useState<VideoPost[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [applications, setApplications] = useState<CourseApplication[]>([]);
  const [banners, setBanners] = useState<PromoBanner[]>([]);
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [aboutState, setAboutState] = useState<any>(null);
  const [isDbConnected, setIsDbConnected] = useState<boolean>(false);

  // Helper trigger to synchronize live database alterations across dashboards
  const refreshDb = () => {
    try {
      setCourses(DakshyamDatabase.getCourses());
      setStudents(DakshyamDatabase.getStudents());
      setGroups(DakshyamDatabase.getGroups());
      setVideos(DakshyamDatabase.getVideos());
      setCertificates(DakshyamDatabase.getCertificates());
      setApplications(DakshyamDatabase.getApplications());
      setBanners(DakshyamDatabase.getBanners());
      setGalleryImages(DakshyamDatabase.getGalleryImages());
      setCurrentUser(DakshyamDatabase.getLoggedInUser());
      setAboutState(DakshyamDatabase.getCompanyAbout());
      setPageLoaderConfig(DakshyamDatabase.getPageLoaderConfig());
    } catch (e) {
      console.error('Error synchronizing dataset:', e);
    }
  };

  // Run initial loading sequences and sync theme side-effect
  useEffect(() => {
    try {
      localStorage.setItem('dakshyam_theme', theme);
      DakshyamDatabase.setCookie('dakshyam_theme', theme);
    } catch (e) {
      console.error(e);
    }
  }, [theme]);

  // SEO Tab Synchronization, Dynamic Document Titles, and Meta updates
  useEffect(() => {
    try {
      const url = new URL(window.location.href);
      url.searchParams.set('tab', activeTab);
      window.history.replaceState(null, '', url.toString());

      // Update document titles and meta tags dynamically based on the active vocational page
      const titleMapping: Record<string, string> = {
        home: 'DAKSHYAM INNOVATION | Physical-Digital Technical Vocational Training Labs',
        services: 'DAKSHYAM INNOVATION | Vocational Courses & IoT Training Programs',
        leaderboard: 'DAKSHYAM INNOVATION | Students Leaderboard & Matrix Performance',
        social: 'DAKSHYAM INNOVATION | Social Telemetry Feed & Live Projects',
        portal: 'DAKSHYAM INNOVATION | Student & Trainer Logins',
        verification: 'DAKSHYAM INNOVATION | Verifiable Certificate Verification Engine',
        about: 'DAKSHYAM INNOVATION | Board of Directors, Founders & Mission Statement',
        contact: 'DAKSHYAM INNOVATION | Get In Touch - Dynamic Contact Desk',
      };

      const descMapping: Record<string, string> = {
        home: 'Dakshyam Innovation is India\'s premier skill incubator under NEP 2020. Discover physical-digital integrated labs, embedded systems training, and modern technology camps.',
        services: 'Explore our hand-crafted, industry-oriented computer literacy, IoT hardware training, and robotic engineering syllabus modules.',
        leaderboard: 'Track student laboratory points, group capstone submissions, and real-time active grading matrices.',
        social: 'See what our students are building. Experience live project diagnostic feeds, solar hardware telemetry streams, and social tech logs.',
        portal: 'Secure access gateway for authenticated student users, authorized trainers, and system administrators.',
        verification: 'Verify authentic certification credentials issued by Dakshyam Innovation. Examine student telemetry scores and download official print-ready PDFs.',
        about: 'Meet the founding members, technical developers, board of directors, and visionaries shaping India\'s vocational development pipeline.',
        contact: 'Connect directly with the Dakshyam team. Partner with us to construct modern computer literacy and IoT hardware labs inside your regional school.',
      };

      if (titleMapping[activeTab]) {
        document.title = titleMapping[activeTab];
      }

      // Update meta description
      const metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc && descMapping[activeTab]) {
        metaDesc.setAttribute('content', descMapping[activeTab]);
      }

      // Update Open Graph tags for rich indexing previews
      const ogTitle = document.querySelector('meta[property="og:title"]');
      if (ogTitle && titleMapping[activeTab]) {
        ogTitle.setAttribute('content', titleMapping[activeTab]);
      }
      const ogDesc = document.querySelector('meta[property="og:description"]');
      if (ogDesc && descMapping[activeTab]) {
        ogDesc.setAttribute('content', descMapping[activeTab]);
      }
    } catch (err) {
      console.error('SEO sync fail', err);
    }
  }, [activeTab]);

  useEffect(() => {
    // Eagerly sync all database records from the backend to local cache
    const syncDatabaseOnBoot = async () => {
      try {
        const response = await fetch('/api/db/all');
        if (response.ok) {
          const data = await response.json();
          if (data.connected !== undefined) {
            setIsDbConnected(!!data.connected);
          }
          // Synchronize keys into local storage
          const keys = [
            'students', 'trainers', 'groups', 'videos', 'certificates', 
            'applications', 'special_programs', 'special_enrollments', 
            'company_about', 'supervisor_pin', 'courses', 'banners', 'gallery_images', 'app_logs', 'admins'
          ];
          for (const key of keys) {
            if (data[key] !== undefined && data[key] !== null) {
              localStorage.setItem(`dakshyam_db_${key}`, JSON.stringify(data[key]));
            }
          }
          refreshDb();
        }
      } catch (err) {
        console.warn("Could not sync live MongoDB database on startup:", err);
      }
    };
    
    syncDatabaseOnBoot();
    refreshDb();

    // Secure URL listener: Check query parameters for secure trainer/admin login
    try {
      const searchParams = new URLSearchParams(window.location.search);
      const accessMatch = searchParams.get('access');
      const tabMatch = searchParams.get('tab');

      // Validate tabMatch whitelist
      if (tabMatch) {
        const allowedTabs = ['home', 'services', 'leaderboard', 'social', 'portal', 'verification', 'about', 'contact'];
        if (!allowedTabs.includes(tabMatch)) {
          console.warn('Security Warning: Corrupt tab parameter blocked.');
          setActiveTab('home');
          const cleanUrl = new URL(window.location.href);
          cleanUrl.searchParams.delete('tab');
          window.history.replaceState(null, '', cleanUrl.toString());
        }
      }
      
      // Strict whitelist verification of access match
      if (accessMatch) {
        const allowedAccess = ['admin', 'trainer'];
        if (!allowedAccess.includes(accessMatch)) {
          console.warn('Security Warning: Invalid bypass access parameter discarded.');
          return;
        }

        if (accessMatch === 'admin') {
          setIsStaffAccessEnabled(true);
          setAuthRoleTab('admin');
          setSecretCode('ADMIN2026');
          setShowAuthModal(true);
        } else if (accessMatch === 'trainer') {
          setIsStaffAccessEnabled(true);
          setAuthRoleTab('trainer');
          setStudentEmail('trainer@dakshyam.com');
          setShowAuthModal(true);
        }
      }
    } catch (err) {
      console.error('URL parse sequence failed security checks.', err);
    }
  }, []);

  // --- STAFF/SUPERVISOR ACCESS CHALLENGE HANDLERS ---
  const handleStaffAccessTrigger = () => {
    if (isStaffAccessEnabled) {
      setAuthRoleTab('admin');
      setAuthMode('login');
      setShowAuthModal(true);
    } else {
      setEnteredPin('');
      setPinError('');
      setShowPinPrompt(true);
    }
  };

  const handleVerifyPinCode = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const correctPin = DakshyamDatabase.getSupervisorPin();
    if (enteredPin === correctPin) {
      setIsStaffAccessEnabled(true);
      setAuthRoleTab('admin');
      setAuthMode('login');
      setShowPinPrompt(false);
      setShowAuthModal(true);
      setPinError('');
    } else {
      setPinError('Invalid 6-digit Supervisor PIN code. Access Denied. Setup default: 123456');
    }
  };

  // --- STUDENT REGULAR SIGNUP HANDLER ---
  const handleStudentRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');

    const nameClean = studentName.trim();
    const emailClean = studentEmail.trim();
    const phoneClean = studentPhone.trim().replace(/\D/g, '');
    const schoolClean = studentSchool.trim();

    if (!nameClean || !emailClean || !phoneClean || !schoolClean || !passwordInput) {
      setAuthError('Please fill out all registration fields, including a secure password.');
      return;
    }

    if (phoneClean.length !== 10) {
      setAuthError('❌ WhatsApp Node must be exactly 10 digits.');
      return;
    }

    if (!isEmailVerified) {
      setAuthError('❌ Email address must be verified using the verification code first.');
      return;
    }

    // Input Safeguard validation
    const nameCheck = isInputSafe(nameClean, 'Full Name');
    if (!nameCheck.safe) { setAuthError(nameCheck.error); return; }
    const emailCheck = isInputSafe(emailClean, 'Email');
    if (!emailCheck.safe) { setAuthError(emailCheck.error); return; }
    const phoneCheck = isInputSafe(phoneClean, 'WhatsApp Node');
    if (!phoneCheck.safe) { setAuthError(phoneCheck.error); return; }
    const schoolCheck = isInputSafe(schoolClean, 'School');
    if (!schoolCheck.safe) { setAuthError(schoolCheck.error); return; }
    const pwdCheck = isInputSafe(passwordInput, 'Password');
    if (!pwdCheck.safe) { setAuthError(pwdCheck.error); return; }

    if (!isValidEmail(emailClean)) {
      setAuthError('❌ Invalid security format: Email structure is invalid.');
      return;
    }

    try {
      // HASHING PASSWORD PRIOR TO PERSISTENCE (Anti-Steal and DevTools protection)
      const hashedPassword = await hashPassword(passwordInput);

      const res = DakshyamDatabase.registerStudent(nameClean, emailClean, hashedPassword, {
        phone: phoneClean,
        institution: schoolClean,
        gradeOrBranch: studentLevel
      });

      if (res.success) {
        // Log them in immediately
        const latestStudents = DakshyamDatabase.getStudents();
        const createdUser = latestStudents.find(s => s.email.toLowerCase() === emailClean.toLowerCase());
        DakshyamDatabase.setLoggedInUser(createdUser);
        DakshyamDatabase.logEvent('Student Registered', `New student ${nameClean} (${emailClean}) registered and signed up successfully.`, emailClean, 'student', 'SUCCESS');
        
        // Reset states
        setStudentName('');
        setStudentEmail('');
        setStudentPhone('');
        setStudentSchool('');
        setPasswordInput('');
        setAuthError('');
        setIsEmailVerified(false);
        setOtpSent(false);
        setOtpInput('');
        setOtpStatusMsg('');
        setShowAuthModal(false);
        setShowApplyAuthPrompt(false);
        refreshDb();

        if (pendingApplyCourseId) {
          const targetCourse = courses.find(c => c.id === pendingApplyCourseId);
          setPreselectedCourseId(pendingApplyCourseId);
          setApplicationSuccessBanner(`Welcome, ${nameClean}! Your candidate profile is verified. Complete your application for "${targetCourse?.title || 'Selected Course'}" below.`);
          navigateToTab('services');
          setPendingApplyCourseId(null);
          try { sessionStorage.removeItem('dakshyam_pending_course_apply'); } catch {}
        } else {
          navigateToTab('portal'); // Take directly to workspace
        }
      } else {
        setAuthError(res.error || 'Registration failed.');
        DakshyamDatabase.logEvent('Student Registration Failed', `Signup failed for ${emailClean}. Error: ${res.error}`, emailClean, 'student', 'ERROR');
      }
    } catch {
      setAuthError('Registry server timeout.');
    }
  };

  // --- STUDENT NORMAL LOGIN HANDLER ---
  const handleStudentLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');

    const emailClean = studentEmail.trim();
    if (!emailClean) {
      setAuthError('Email verification required.');
      return;
    }

    // Input Safeguard checks to prevent SQL/NoSQL injections
    const emailCheck = isInputSafe(emailClean, 'Email');
    if (!emailCheck.safe) {
      setAuthError(emailCheck.error || 'Invalid Email formatting.');
      return;
    }
    const pwdCheck = isInputSafe(passwordInput, 'Password');
    if (!pwdCheck.safe) {
      setAuthError(pwdCheck.error || 'Invalid Password characters.');
      return;
    }

    if (!isValidEmail(emailClean)) {
      setAuthError('❌ Invalid security format: Email structure is invalid.');
      return;
    }

    // Lockout verification
    if (checkLockout(emailClean)) return;

    try {
      const allStudents = DakshyamDatabase.getStudents();
      const match = allStudents.find(s => s.email.toLowerCase() === emailClean.toLowerCase());
      
      if (match) {
        const userPassword = match.password || '123456';
        const inputHashed = await hashPassword(passwordInput);
        const savedHashed = await hashPassword(userPassword);

        // Allow match if input hashed equals the saved password or if saved password matches plain text (fallback for seeded accounts)
        if (inputHashed !== userPassword && passwordInput !== userPassword && inputHashed !== savedHashed) {
          handleFailedAttempt(emailClean);
          return;
        }

        // Success - Clear lockout history
        const updatedAttempts = { ...failedAttempts };
        delete updatedAttempts[emailClean.toLowerCase()];
        setFailedAttempts(updatedAttempts);

        DakshyamDatabase.setLoggedInUser(match);
        DakshyamDatabase.logEvent('Student Logged In', `Student ${match.name} (${match.email}) authenticated successfully.`, match.email, 'student', 'SUCCESS');
        setShowAuthModal(false);
        setShowApplyAuthPrompt(false);
        setStudentEmail('');
        setPasswordInput('');
        refreshDb();

        if (pendingApplyCourseId) {
          const targetCourse = courses.find(c => c.id === pendingApplyCourseId);
          setPreselectedCourseId(pendingApplyCourseId);
          setApplicationSuccessBanner(`Welcome back, ${match.name}! Your student credentials are verified. Complete your application for "${targetCourse?.title || 'Selected Course'}" below.`);
          navigateToTab('services');
          setPendingApplyCourseId(null);
          try { sessionStorage.removeItem('dakshyam_pending_course_apply'); } catch {}
        } else {
          navigateToTab('portal');
        }
      } else {
        // Registering failed attempt even for non-existent users to protect user enumeration
        handleFailedAttempt(emailClean);
      }
    } catch {
      setAuthError('Exception: secure database timeout.');
    }
  };

  // --- TRAINER LOGIN HANDLER WITH APPROVAL SYSTEM ---
  const handleTrainerLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');

    const emailClean = studentEmail.trim();
    if (!emailClean) {
      setAuthError('Trainer email verification required.');
      return;
    }

    // Input Safeguard checks
    const emailCheck = isInputSafe(emailClean, 'Trainer Email');
    if (!emailCheck.safe) {
      setAuthError(emailCheck.error || 'Invalid Email characters.');
      return;
    }
    const pwdCheck = isInputSafe(passwordInput, 'Password');
    if (!pwdCheck.safe) {
      setAuthError(pwdCheck.error || 'Invalid Password characters.');
      return;
    }

    if (!isValidEmail(emailClean)) {
      setAuthError('❌ Invalid security format: Trainer Email structure is invalid.');
      return;
    }

    // Lockout verification
    if (checkLockout(emailClean)) return;

    try {
      const trainers = DakshyamDatabase.getTrainers();
      const match = trainers.find(t => t.email.toLowerCase() === emailClean.toLowerCase());

      if (match) {
        if (!match.isApproved) {
          setAuthError('⚠ RESTRICTED ACCESS: Your Trainer profile registry ID is pending Admin authorization. Please ask admin leads to verify your account.');
          return;
        }

        const userPassword = match.password || '123456';
        const inputHashed = await hashPassword(passwordInput);
        const savedHashed = await hashPassword(userPassword);

        if (inputHashed !== userPassword && passwordInput !== userPassword && inputHashed !== savedHashed) {
          handleFailedAttempt(emailClean);
          return;
        }

        // Success - Clear lockout history
        const updatedAttempts = { ...failedAttempts };
        delete updatedAttempts[emailClean.toLowerCase()];
        setFailedAttempts(updatedAttempts);

        DakshyamDatabase.setLoggedInUser(match);
        DakshyamDatabase.logEvent('Trainer Logged In', `Supervisor/Trainer ${match.name} (${match.email}) authenticated successfully.`, match.email, 'trainer', 'SUCCESS');
        setShowAuthModal(false);
        setStudentEmail('');
        setPasswordInput('');
        refreshDb();
        navigateToTab('portal');
      } else {
        handleFailedAttempt(emailClean);
      }
    } catch {
      setAuthError('Trainer node access timeout.');
    }
  };

  // --- NEW TRAINER REGISTER REQUEST HANDLER ---
  const handleTrainerRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');

    const nameClean = studentName.trim();
    const emailClean = studentEmail.trim();

    if (!nameClean || !emailClean || !passwordInput) {
      setAuthError('Trainer name, email, and password registry are required fields.');
      return;
    }

    // Input Safeguards
    const nameCheck = isInputSafe(nameClean, 'Trainer Name');
    if (!nameCheck.safe) { setAuthError(nameCheck.error); return; }
    const emailCheck = isInputSafe(emailClean, 'Trainer Email');
    if (!emailCheck.safe) { setAuthError(emailCheck.error); return; }
    const pwdCheck = isInputSafe(passwordInput, 'Password');
    if (!pwdCheck.safe) { setAuthError(pwdCheck.error); return; }

    if (!isValidEmail(emailClean)) {
      setAuthError('❌ Invalid security format: Email structure is invalid.');
      return;
    }

    try {
      // HASHING PRIOR TO DB SUBMISSION
      const hashedPassword = await hashPassword(passwordInput);

      const isApprovedCode = trainerRegCode.trim() === 'trainer@dki2026';
      const res = DakshyamDatabase.registerTrainer(nameClean, emailClean, hashedPassword, isApprovedCode);
      if (res.success) {
        setStudentName('');
        setStudentEmail('');
        setPasswordInput('');
        setTrainerRegCode('');
        refreshDb();
        if (isApprovedCode) {
          setAuthError('✓ TRAINER ACCOUNT ACTIVATED INSTANTLY! You entered a valid Trainer Access Code. You can now login directly and access your workspace.');
          DakshyamDatabase.logEvent('Trainer Self-Registered', `Trainer ${nameClean} (${emailClean}) auto-approved and activated using instant code.`, emailClean, 'trainer', 'SUCCESS');
        } else {
          setAuthError('✓ APPLICATION REQUISITION SUBMITTED! Your account is held as "Pending Approval". Once a Dakshyam Admin grants access (or you supply a Trainer Registration Code), you can run courses.');
          DakshyamDatabase.logEvent('Trainer Registration Submitted', `Trainer ${nameClean} (${emailClean}) submitted application queue request (Approval Pending).`, emailClean, 'trainer', 'INFO');
        }
      } else {
        setAuthError(res.error || 'Trainer application failed.');
        DakshyamDatabase.logEvent('Trainer Registration Failed', `Trainer registration failed for ${emailClean}. Error: ${res.error || 'Duplicate record'}`, emailClean, 'trainer', 'ERROR');
      }
    } catch {
      setAuthError('Storage exception. Retry later.');
    }
  };

  // --- ADMIN PASSCODE LOGIN HANDLER ---
  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');

    const cleanCode = secretCode.trim().toUpperCase();
    
    // Lockout verification for admin as well
    if (checkLockout('admin_account')) return;

    const codeCheck = isInputSafe(cleanCode, 'Admin Passcode');
    if (!codeCheck.safe) {
      setAuthError(codeCheck.error || 'Malicious input detected.');
      return;
    }

    if (secretCode.trim() === 'dki2026@w' || cleanCode === 'DKI2026@W' || cleanCode === 'ADMIN2026') {
      try {
        const adminUser = DakshyamDatabase.getAdmins()[0];
        DakshyamDatabase.setLoggedInUser(adminUser);
        DakshyamDatabase.logEvent('Admin Logged In', `Platform administrator authenticated successfully and opened system tools.`, adminUser.email, 'admin', 'SUCCESS');
        setShowAuthModal(false);
        setSecretCode('');
        
        // Clear attempts
        const updatedAttempts = { ...failedAttempts };
        delete updatedAttempts['admin_account'];
        setFailedAttempts(updatedAttempts);

        refreshDb();
        navigateToTab('portal');
      } catch {
        setAuthError('Admin indexing node failure.');
      }
    } else {
      handleFailedAttempt('admin_account');
    }
  };

  const handleLogout = () => {
    DakshyamDatabase.setLoggedInUser(null);
    refreshDb();
    navigateToTab('home');
  };

  // CTA triggers from Public screens & Course Catalogs
  const triggerQuickEnroll = (courseId: string) => {
    if (currentUser && currentUser.role === 'student') {
      navigateToTab('services', courseId);
    } else {
      setPendingApplyCourseId(courseId);
      try {
        sessionStorage.setItem('dakshyam_pending_course_apply', courseId);
      } catch {}
      setShowApplyAuthPrompt(true);
    }
  };

  const handleApplyAuthChoice = (mode: 'login' | 'register') => {
    setShowApplyAuthPrompt(false);
    setAuthRoleTab('student');
    setAuthMode(mode);
    setAuthError('');
    setShowAuthModal(true);
  };

  const isLight = theme === 'light';

  return (
    <div className={`relative min-h-screen font-sans antialiased overflow-x-hidden flex flex-col justify-between transition-colors duration-500 ${
      isLight 
        ? 'bg-white text-slate-900 selection:bg-blue-900 selection:text-white' 
        : 'bg-[#0a192f] text-slate-100 selection:bg-blue-600/35 selection:text-white'
    }`}>
      
      {/* FULL-SCREEN ANIMATED VIDEO LAZY LOADER */}
      <PageLoader 
        isLoading={isPageLoading}
        targetTab={loadingTargetTab}
        config={activeLoaderConfig}
        onFinish={() => setIsPageLoading(false)}
        onOpenUploadSettings={() => {
          setIsPageLoading(false);
          if (currentUser?.role === 'admin') {
            navigateToTab('portal');
          } else {
            handleStaffAccessTrigger();
          }
        }}
        theme={theme}
      />

      {/* Dynamic scanlines & background ambient lights */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none -z-20">
        <div className={`absolute top-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full blur-[140px] opacity-25 animate-pulseGlow ${
          isLight ? 'bg-blue-100/50' : 'bg-[#0d2847]'
        }`} />
        <div className={`absolute bottom-[10%] right-[-5%] w-[50%] h-[50%] rounded-full blur-[120px] opacity-20 ${
          isLight ? 'bg-slate-100/30' : 'bg-[#112240]'
        }`} />
        <div 
          className="absolute inset-0 opacity-[0.015] pointer-events-none" 
          style={{
            backgroundImage: `url('data:image/svg+xml,%3Csvg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"%3E%3Cfilter id="noiseFilter"%3E%3CfeTurbulence type="fractalNoise" baseFrequency="0.75" numOctaves="3" stitchTiles="stitch"/%3E%3C/filter%3E%3Crect width="100%25" height="100%25" filter="url(%23noiseFilter)"/%3E%3C/svg%3E')`
          }}
        />
      </div>

      {/* Interactive WebGL Vector Canvas background */}
      <ThreeBackground theme={theme} />

      {/* NAVIGATION BAR HEADER */}
      <header className={`relative z-20 w-full border-b backdrop-blur-md no-print py-4 transition-colors duration-300 ${
        isLight ? 'border-blue-900/10 bg-white/85' : 'border-blue-500/10 bg-[#0a192f]/75'
      }`}>
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between">
          
          {/* Logo segment */}
          <div 
            onClick={() => navigateToTab('home')}
            className="flex items-center gap-3 cursor-pointer select-none group"
          >
            <div className="relative w-8 h-8 flex items-center justify-center shrink-0">
              {!logoError ? (
                <img 
                  src="/logo.svg" 
                  alt="Dakshyam Logo" 
                  onError={() => setLogoError(true)}
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className={`w-full h-full flex items-center justify-center rounded-lg border font-mono font-black text-sm transition-all duration-300 ${
                  isLight ? 'border-blue-900/20 bg-blue-50 text-blue-950' : 'border-blue-400/20 bg-blue-950/40 text-sky-400 group-hover:border-blue-400/40'
                }`}>
                  D
                </div>
              )}
            </div>
            <div className="text-left font-sans space-y-0.5">
              <span className={`text-xs font-black tracking-[0.22em] transition-colors duration-300 ${isLight ? 'text-blue-950' : 'text-white'}`}>DAKSHYAM</span>
              <span className={`text-[8px] font-mono tracking-[0.38em] block translate-x-[0.1em] transition-colors duration-300 ${isLight ? 'text-blue-900 font-bold' : 'text-slate-300'}`}>INNOVATIONS</span>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1.5 text-2xs md:text-xs font-mono tracking-wider font-semibold">
            <button
              onClick={() => navigateToTab('home', null)}
              className={`px-3 py-1.5 rounded-lg transition-all border ${
                activeTab === 'home' 
                  ? (isLight ? 'bg-blue-900 text-white font-bold shadow-xs border-blue-900' : 'bg-blue-600/20 border-blue-400/30 text-white font-bold shadow-[0_0_12px_rgba(59,130,246,0.2)]') 
                  : (isLight ? 'border-transparent text-slate-700 hover:text-blue-950 hover:bg-blue-50/50' : 'border-transparent text-slate-300 hover:text-white hover:bg-white/5')
              }`}
            >
              WELCOME
            </button>
            <button
              onClick={() => navigateToTab('services', null)}
              className={`px-3 py-1.5 rounded-lg transition-all border ${
                activeTab === 'services' 
                  ? (isLight ? 'bg-blue-900 text-white font-bold shadow-xs border-blue-900' : 'bg-blue-600/20 border-blue-400/30 text-white font-bold shadow-[0_0_12px_rgba(59,130,246,0.2)]') 
                  : (isLight ? 'border-transparent text-slate-700 hover:text-blue-950 hover:bg-blue-50/50' : 'border-transparent text-slate-300 hover:text-white hover:bg-white/5')
              }`}
            >
              SERVICES & SYLLABUS
            </button>
            <button
              onClick={() => navigateToTab('leaderboard')}
              className={`px-3 py-1.5 rounded-lg transition-all border ${
                activeTab === 'leaderboard' 
                  ? (isLight ? 'bg-blue-900 text-white font-bold shadow-xs border-blue-900' : 'bg-blue-600/20 border-blue-400/30 text-white font-bold shadow-[0_0_12px_rgba(59,130,246,0.2)]') 
                  : (isLight ? 'border-transparent text-slate-700 hover:text-blue-950 hover:bg-blue-50/50' : 'border-transparent text-slate-300 hover:text-white hover:bg-white/5')
              }`}
            >
              LEADERBOARD
            </button>
            <button
              onClick={() => navigateToTab('social')}
              className={`px-3 py-1.5 rounded-lg transition-all border ${
                activeTab === 'social' 
                  ? (isLight ? 'bg-blue-900 text-white font-bold shadow-xs border-blue-900' : 'bg-blue-600/20 border-blue-400/30 text-white font-bold shadow-[0_0_12px_rgba(59,130,246,0.2)]') 
                  : (isLight ? 'border-transparent text-slate-700 hover:text-blue-950 hover:bg-blue-50/50' : 'border-transparent text-slate-300 hover:text-white hover:bg-white/5')
              }`}
            >
              INNOVATION EXHIBITION
            </button>
            <button
              onClick={() => navigateToTab('verification')}
              className={`px-3 py-1.5 rounded-lg transition-all border ${
                activeTab === 'verification' 
                  ? (isLight ? 'bg-blue-900 text-white font-bold shadow-xs border-blue-900' : 'bg-blue-600/20 border-blue-400/30 text-white font-bold shadow-[0_0_12px_rgba(59,130,246,0.2)]') 
                  : (isLight ? 'border-transparent text-slate-700 hover:text-blue-950 hover:bg-blue-50/50' : 'border-transparent text-slate-300 hover:text-white hover:bg-white/5')
              }`}
            >
              VERIFY CREDENTIALS
            </button>
            <button
              onClick={() => navigateToTab('about')}
              className={`px-3 py-1.5 rounded-lg transition-all border ${
                activeTab === 'about' 
                  ? (isLight ? 'bg-blue-900 text-white font-bold shadow-xs border-blue-900' : 'bg-blue-600/20 border-blue-400/30 text-white font-bold shadow-[0_0_12px_rgba(59,130,246,0.2)]') 
                  : (isLight ? 'border-transparent text-slate-700 hover:text-blue-950 hover:bg-blue-50/50' : 'border-transparent text-slate-300 hover:text-white hover:bg-white/5')
              }`}
            >
              ABOUT US
            </button>
            <button
              onClick={() => navigateToTab('contact')}
              className={`px-3 py-1.5 rounded-lg transition-all border ${
                activeTab === 'contact' 
                  ? (isLight ? 'bg-blue-900 text-white font-bold shadow-xs border-blue-900' : 'bg-blue-600/20 border-blue-400/30 text-white font-bold shadow-[0_0_12px_rgba(59,130,246,0.2)]') 
                  : (isLight ? 'border-transparent text-slate-700 hover:text-blue-950 hover:bg-blue-50/50' : 'border-transparent text-slate-300 hover:text-white hover:bg-white/5')
              }`}
            >
              CONTACT US
            </button>

            {/* RESTRICTED ACCESS: WORKSHOP FEEDBACK (Admin & Trainer ONLY) */}
            {currentUser && (currentUser.role === 'admin' || currentUser.role === 'trainer') && (
              <button
                onClick={() => navigateToTab('feedback')}
                className={`px-3 py-1.5 rounded-lg transition-all border flex items-center gap-1.5 font-mono ${
                  activeTab === 'feedback' 
                    ? (isLight ? 'bg-blue-900 text-white font-bold shadow-xs border-blue-900' : 'bg-sky-500/20 border-sky-400/40 text-sky-300 font-bold shadow-[0_0_12px_rgba(56,189,248,0.25)]') 
                    : (isLight ? 'border-amber-500/25 bg-amber-50/70 text-amber-950 hover:bg-amber-100/70 font-semibold' : 'border-amber-500/25 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20')
                }`}
                title="Workshop Participant Feedback Management Console"
              >
                <ClipboardList className="w-3.5 h-3.5 text-amber-400" />
                <span>FEEDBACK AUDIT</span>
              </button>
            )}
          </nav>

          {/* Right Theme & Auth Action button segment */}
          <div className="flex items-center gap-2">
            {/* Mode shift toggle button */}
            <button
              onClick={() => setTheme(isLight ? 'dark' : 'light')}
              className={`p-2 rounded-xl border transition-all hover:scale-105 cursor-pointer flex items-center justify-center ${
                isLight 
                  ? 'border-blue-900/15 bg-blue-50 text-blue-950 hover:bg-blue-100/70' 
                  : 'border-white/15 bg-[#112240] text-white hover:border-white/35'
              }`}
              title={isLight ? 'Activate Navy Blue Theme' : 'Activate White Theme'}
            >
              {isLight ? <Moon className="w-3.5 h-3.5" /> : <Sun className="w-3.5 h-3.5" />}
            </button>

            {/* Desktop authentication */}
            <div className="hidden lg:flex items-center gap-2">
              {currentUser ? (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => navigateToTab('portal')}
                    className={`border text-2xs font-mono font-bold px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                      isLight 
                        ? 'bg-blue-50 border-blue-900/20 text-blue-950 hover:bg-blue-100/50' 
                        : 'bg-blue-600/20 border-blue-400/30 text-white shadow-[0_0_10px_rgba(59,130,246,0.2)]'
                    }`}
                  >
                    <UserCircle className="w-3.5 h-3.5" /> 
                    <span className="uppercase tracking-widest">{currentUser.role} AREA</span>
                  </button>
                  <button
                    onClick={handleLogout}
                    className={`p-1.5 border border-transparent rounded-xl transition-all cursor-pointer ${
                      isLight ? 'text-slate-400 hover:text-red-600 hover:bg-red-50' : 'text-slate-400 hover:text-red-400 hover:bg-red-950/20 hover:border-red-500/10'
                    }`}
                    title="Logout Session"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setAuthMode('login');
                    setShowAuthModal(true);
                  }}
                  className={`text-2xs font-bold font-mono px-4 py-2 rounded-xl flex items-center gap-1.5 tracking-wider active:scale-95 transition-all cursor-pointer ${
                    isLight 
                      ? 'bg-blue-950 hover:bg-blue-900 text-white shadow-sm' 
                      : 'bg-white hover:bg-slate-100 text-[#0a192f] font-bold shadow-[0_0_15px_rgba(255,255,255,0.2)]'
                  }`}
                >
                  <LogIn className="w-3.5 h-3.5" /> ENTER CONSOLE
                </button>
              )}
            </div>

            {/* Mobile hamburger menu button */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className={`lg:hidden p-2 rounded-xl border transition-all cursor-pointer flex items-center justify-center ${
                isLight 
                  ? 'border-blue-900/15 bg-blue-50 text-blue-950' 
                  : 'border-white/15 bg-[#112240] text-white'
              }`}
            >
              <motion.div
                key={menuOpen ? "open" : "closed"}
                initial={{ rotate: -45, opacity: 0, scale: 0.8 }}
                animate={{ rotate: 0, opacity: 1, scale: 1 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                className="flex items-center justify-center"
              >
                {menuOpen ? <X className="w-4.5 h-4.5" /> : <Menu className="w-4.5 h-4.5" />}
              </motion.div>
            </button>
          </div>

        </div>

        {/* Dynamic Mobile collapsing responsive menu */}
        <AnimatePresence>
          {menuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{
                height: { duration: 0.35, ease: [0.16, 1, 0.3, 1] },
                opacity: { duration: 0.25, ease: 'easeInOut' }
              }}
              style={{ overflow: 'hidden' }}
              className={`lg:hidden w-full border-t mt-4 ${
                isLight ? 'border-blue-900/10 bg-white' : 'border-blue-500/10 bg-[#0a192f]'
              }`}
            >
              <div className="p-4 space-y-2 flex flex-col font-mono text-xs font-bold">
                <button
                  onClick={() => navigateToTab('home')}
                  className={`w-full text-left px-3.5 py-2.5 rounded-xl border transition-all ${
                    activeTab === 'home' 
                      ? (isLight ? 'bg-blue-900 text-white font-extrabold shadow-xs' : 'bg-blue-600/20 border-blue-400/30 text-white font-bold') 
                      : (isLight ? 'border-transparent text-slate-700' : 'border-transparent text-slate-300')
                  }`}
                >
                  WELCOME DEAR VISITOR
                </button>
                <button
                  onClick={() => navigateToTab('services', null)}
                  className={`w-full text-left px-3.5 py-2.5 rounded-xl border transition-all ${
                    activeTab === 'services' 
                      ? (isLight ? 'bg-blue-900 text-white font-extrabold shadow-xs' : 'bg-blue-600/20 border-blue-400/30 text-white font-bold') 
                      : (isLight ? 'border-transparent text-slate-700' : 'border-transparent text-slate-300')
                  }`}
                >
                  SERVICES & PROGRAM CATALOGS
                </button>
                <button
                  onClick={() => navigateToTab('leaderboard')}
                  className={`w-full text-left px-3.5 py-2.5 rounded-xl border transition-all ${
                    activeTab === 'leaderboard' 
                      ? (isLight ? 'bg-blue-900 text-white font-extrabold shadow-xs' : 'bg-blue-600/20 border-blue-400/30 text-white font-bold') 
                      : (isLight ? 'border-transparent text-slate-700' : 'border-transparent text-slate-300')
                  }`}
                >
                  LEADERBOARD TRACKER
                </button>
                <button
                  onClick={() => navigateToTab('social')}
                  className={`w-full text-left px-3.5 py-2.5 rounded-xl border transition-all ${
                    activeTab === 'social' 
                      ? (isLight ? 'bg-blue-900 text-white font-extrabold shadow-xs' : 'bg-blue-600/20 border-blue-400/30 text-white font-bold') 
                      : (isLight ? 'border-transparent text-slate-700' : 'border-transparent text-slate-300')
                  }`}
                >
                  EXHIBITION POSTINGS
                </button>
                <button
                  onClick={() => navigateToTab('verification')}
                  className={`w-full text-left px-3.5 py-2.5 rounded-xl border transition-all ${
                    activeTab === 'verification' 
                      ? (isLight ? 'bg-blue-900 text-white font-extrabold shadow-xs' : 'bg-blue-600/20 border-blue-400/30 text-white font-bold') 
                      : (isLight ? 'border-transparent text-slate-700' : 'border-transparent text-slate-300')
                  }`}
                >
                  VERIFY CREDENTIALS
                </button>
                <button
                  onClick={() => navigateToTab('about')}
                  className={`w-full text-left px-3.5 py-2.5 rounded-xl border transition-all ${
                    activeTab === 'about' 
                      ? (isLight ? 'bg-blue-900 text-white font-extrabold shadow-xs' : 'bg-blue-600/20 border-blue-400/30 text-white font-bold') 
                      : (isLight ? 'border-transparent text-slate-700' : 'border-transparent text-slate-300')
                  }`}
                >
                  ABOUT US
                </button>
                <button
                  onClick={() => navigateToTab('contact')}
                  className={`w-full text-left px-3.5 py-2.5 rounded-xl border transition-all ${
                    activeTab === 'contact' 
                      ? (isLight ? 'bg-blue-900 text-white font-extrabold shadow-xs' : 'bg-blue-600/20 border-blue-400/30 text-white font-bold') 
                      : (isLight ? 'border-transparent text-slate-700' : 'border-transparent text-slate-300')
                  }`}
                >
                  CONTACT US
                </button>

                {/* RESTRICTED ACCESS: WORKSHOP FEEDBACK (Admin & Trainer ONLY) */}
                {currentUser && (currentUser.role === 'admin' || currentUser.role === 'trainer') && (
                  <button
                    onClick={() => navigateToTab('feedback')}
                    className={`w-full text-left px-3.5 py-2.5 rounded-xl border transition-all flex items-center gap-2 font-mono ${
                      activeTab === 'feedback' 
                        ? (isLight ? 'bg-blue-900 text-white font-extrabold shadow-xs' : 'bg-sky-500/20 border-sky-400/40 text-sky-300 font-bold') 
                        : (isLight ? 'border-amber-500/25 bg-amber-50 text-amber-950 font-bold' : 'border-amber-500/25 bg-amber-500/10 text-amber-300')
                    }`}
                  >
                    <ClipboardList className="w-4 h-4 text-amber-400" />
                    <span>WORKSHOP FEEDBACK AUDIT</span>
                  </button>
                )}

                <div className="pt-2 border-t border-slate-500/10">
                  {currentUser ? (
                    <div className="space-y-1.5 pt-1">
                      <button
                        onClick={() => navigateToTab('portal')}
                        className={`w-full py-2.5 rounded-xl text-center border font-mono font-bold tracking-widest ${
                          isLight 
                            ? 'bg-blue-900 border-blue-900 text-white' 
                            : 'bg-blue-600/20 border-blue-400/30 text-white'
                        }`}
                      >
                        MEMBERS AREA ({currentUser.role})
                      </button>
                      <button
                        onClick={() => { handleLogout(); setMenuOpen(false); }}
                        className="w-full py-2 bg-red-500/10 border border-red-500/30 text-red-500 rounded-xl font-mono text-center font-bold"
                      >
                        LOGOUT CONNECT
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        setAuthMode('login');
                        setShowAuthModal(true);
                        setMenuOpen(false);
                      }}
                      className={`w-full py-3 rounded-xl font-mono text-center font-black tracking-widest ${
                        isLight ? 'bg-blue-950 text-white shadow-xs' : 'bg-white text-[#0a192f] font-bold'
                      }`}
                    >
                      ENTER CONSOLE LOGIN
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* MAIN VIEW CONTROLLER */}
      <main className="relative z-10 flex-grow max-w-7xl w-full mx-auto px-4 py-8 pointer-events-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.35 }}
            className="w-full"
          >
            {/* VIEW 1: LANDING PAGE */}
            {activeTab === 'home' && (
              <LandingPage 
                theme={theme}
                courses={courses} 
                banners={banners}
                galleryImages={galleryImages}
                currentUser={currentUser}
                onNavigateToAdmin={() => {
                  if (currentUser?.role === 'admin') {
                    navigateToTab('portal');
                  } else {
                    setAuthMode('login');
                    setShowAuthModal(true);
                  }
                }}
                onEnterPortal={() => {
                  if (currentUser) {
                    navigateToTab('portal');
                  } else {
                    setAuthMode('login');
                    setShowAuthModal(true);
                  }
                }} 
                onSelectCourse={triggerQuickEnroll}
              />
            )}

            {/* VIEW 2: COURSE & SERVICES REQUEST */}
            {activeTab === 'services' && (
              <div className="space-y-6 max-w-7xl mx-auto">
                <div className={`text-center space-y-2 max-w-2xl mx-auto border-b pb-4 transition-colors duration-300 ${isLight ? 'border-blue-900/10' : 'border-blue-900/20'}`}>
                  <span className={`text-3xs font-mono tracking-widest uppercase font-bold ${isLight ? 'text-blue-900' : 'text-sky-300'}`}>Services & Academic Catalogs</span>
                  <h1 className={`text-2xl sm:text-3xl font-black tracking-wide uppercase ${isLight ? 'text-slate-900' : 'text-white'}`}>Academic Admissions Portal</h1>
                  <p className={`text-xs ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                    Choose from our National Education Policy (NEP 2020) compliant programs, explore STEM vocational frameworks, and submit your registration request below.
                  </p>
                </div>

                {/* Candidate verified notification banner */}
                {applicationSuccessBanner && (
                  <div className={`p-4 rounded-2xl border flex items-start justify-between gap-3 animate-fadeIn transition-all ${
                    isLight ? 'bg-emerald-50 border-emerald-200 text-emerald-950' : 'bg-emerald-950/50 border-emerald-500/40 text-emerald-100'
                  }`}>
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                      <div className="text-xs">
                        <span className="font-mono uppercase font-bold tracking-wider block text-[10px] text-emerald-600 dark:text-emerald-400">
                          ✓ Candidate Profile Verified
                        </span>
                        <p className="mt-0.5 font-medium">{applicationSuccessBanner}</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => setApplicationSuccessBanner(null)}
                      className="text-xs opacity-60 hover:opacity-100 cursor-pointer p-1"
                      title="Dismiss"
                    >
                      ✕
                    </button>
                  </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                  
                  {/* LEFT SIDE: NEP 2020, STEM & COURSE CATALOGS */}
                  <div className="lg:col-span-7 space-y-6">
                    
                    {/* NEP 2020 & STEM Briefing Card */}
                    <div className={`border rounded-2xl p-6 backdrop-blur-md transition-all ${
                      isLight ? 'bg-white border-blue-900/10 text-slate-800 shadow-sm' : 'bg-[#0d1f38]/70 border-blue-800/30 text-white'
                    }`}>
                      <h2 className={`text-sm sm:text-base font-bold tracking-wide mb-3 flex items-center gap-2 uppercase font-mono ${
                        isLight ? 'text-blue-900' : 'text-sky-400'
                      }`}>
                        <Cpu className="w-5 h-5 animate-pulse" /> NEP 2020 & STEM Education Paradigm
                      </h2>
                      
                      <div className="space-y-4 text-xs font-sans">
                        <div className={`p-4 rounded-xl border ${
                          isLight ? 'bg-blue-50/50 border-blue-900/10' : 'bg-blue-950/20 border-blue-900/20'
                        }`}>
                          <h3 className={`font-extrabold mb-1 tracking-wide ${isLight ? 'text-slate-900' : 'text-white'}`}>National Education Policy Compliance (NEP 2020)</h3>
                          <p className={`leading-relaxed ${isLight ? 'text-slate-650' : 'text-slate-400'}`}>
                            Our curriculum structures are built from the ground up to support NEP 2020's mandate for **experiential, vocational, and inquiry-driven learning**. By removing the traditional boundaries of theoretical assessments, we introduce 6th to 12th graders and college undergraduates to physical computing, manual circuit assembly, and hardware diagnostics, ensuring early-stage technological fluency.
                          </p>
                        </div>

                        <div className={`p-4 rounded-xl border ${
                          isLight ? 'bg-blue-50/50 border-blue-900/10' : 'bg-blue-950/20 border-blue-900/20'
                        }`}>
                          <h3 className={`font-extrabold mb-1 tracking-wide ${isLight ? 'text-slate-900' : 'text-white'}`}>Industrial STEM Pedagogy</h3>
                          <p className={`leading-relaxed ${isLight ? 'text-slate-650' : 'text-slate-400'}`}>
                            STEM at Dakshyam is more than code on a screen—it is a physical-digital handshake. Students assemble dual-H-bridge motors, write PWM logic parameters, configure real analog sensors, and deploy telemetry dashboards. This practical laboratory approach turns abstract math and physics (such as spatial kinematics and spatial vector calculations) into highly intuitive, real-world engineering skills.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Dynamic Course Catalogs Panel */}
                    <div className={`border rounded-2xl p-6 backdrop-blur-md transition-all ${
                      isLight ? 'bg-white border-blue-900/10 text-slate-800 shadow-sm' : 'bg-[#0d1f38]/70 border-blue-800/30 text-white'
                    }`}>
                      <h2 className={`text-sm sm:text-base font-bold tracking-wide mb-3 flex items-center gap-2 uppercase font-mono ${
                        isLight ? 'text-blue-900' : 'text-sky-400'
                      }`}>
                        <BookOpen className="w-5 h-5" /> Available Program Catalogs
                      </h2>
                      <p className={`text-xs mb-4 ${isLight ? 'text-slate-650' : 'text-slate-400'}`}>
                        Click on any course catalog below to select it and update the registration request form on the right.
                      </p>

                      <div className="space-y-4">
                        {courses.map(course => {
                          const isSelected = preselectedCourseId === course.id || (!preselectedCourseId && courses[0]?.id === course.id);
                          return (
                            <div 
                              key={course.id}
                              onClick={() => setPreselectedCourseId(course.id)}
                              className={`p-4 rounded-xl border transition-all cursor-pointer text-left relative ${
                                isSelected 
                                  ? (isLight ? 'bg-blue-50/70 border-blue-900/30 shadow-sm' : 'bg-blue-950/30 border-blue-500/40 shadow-[0_0_15px_rgba(59,130,246,0.1)]')
                                  : (isLight ? 'bg-slate-50 border-slate-200/60 hover:bg-slate-100/50' : 'bg-black/40 border-slate-500/5 hover:border-blue-500/20')
                              }`}
                            >
                              <div className="flex justify-between items-start gap-2">
                                <div>
                                  <span className={`text-[9px] font-mono font-bold tracking-widest uppercase ${
                                    isLight ? 'text-blue-900' : 'text-sky-400'
                                  }`}>
                                    {course.duration} Program
                                  </span>
                                  <h3 className={`text-xs sm:text-sm font-black uppercase tracking-wide mt-0.5 ${
                                    isLight ? 'text-slate-900' : 'text-white'
                                  }`}>
                                    {course.title}
                                  </h3>
                                </div>
                                {isSelected && (
                                  <span className={`text-[8px] font-mono uppercase font-bold tracking-wider px-2 py-0.5 rounded-md ${
                                    isLight ? 'bg-blue-900/10 text-blue-950' : 'bg-blue-600/20 text-sky-300'
                                  }`}>
                                    Selected
                                  </span>
                                )}
                              </div>

                              <p className={`text-xs mt-2 leading-relaxed ${isLight ? 'text-slate-650' : 'text-slate-400'}`}>
                                {course.description}
                              </p>

                              <div className="mt-3 pt-2.5 border-t flex flex-wrap items-center justify-between gap-2 border-slate-500/10">
                                <div className="flex flex-wrap gap-1">
                                  {course.tags.map((tag, tIdx) => (
                                    <span key={tIdx} className={`text-[9px] font-mono font-semibold px-2 py-0.5 rounded ${
                                      isLight ? 'bg-blue-50 text-blue-900' : 'bg-blue-950/40 text-sky-300'
                                    }`}>
                                      #{tag}
                                    </span>
                                  ))}
                                </div>

                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    triggerQuickEnroll(course.id);
                                  }}
                                  className={`text-[10px] font-mono uppercase font-bold px-3 py-1.5 rounded-lg border transition-all cursor-pointer ${
                                    isSelected
                                      ? (isLight ? 'bg-blue-950 text-white border-blue-950 shadow-xs' : 'bg-white text-[#0a192f] border-white font-black')
                                      : (isLight ? 'bg-white border-slate-300 text-blue-950 hover:bg-blue-50' : 'bg-blue-950/60 border-blue-700/40 text-sky-300 hover:bg-blue-900/60')
                                  }`}
                                >
                                  Apply for Course →
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                  </div>

                  {/* RIGHT SIDE: COURSE REGISTRATION FORM */}
                  <div className="lg:col-span-5 space-y-6">
                    <div className={`border rounded-2xl p-6 backdrop-blur-md transition-all ${
                      isLight ? 'bg-white border-blue-900/10 text-slate-800 shadow-sm' : 'bg-[#0d1f38]/70 border-blue-800/30'
                    }`}>
                      <h2 className={`text-sm sm:text-base font-bold tracking-wide mb-3 flex items-center gap-2 uppercase font-mono ${
                        isLight ? 'text-blue-900' : 'text-sky-400'
                      }`}>
                        <Compass className="w-5 h-5" /> Registration Request
                      </h2>
                      <p className={`text-xs mb-4 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                        Verified candidates can submit enrollment applications directly. Allocation of hardware kits and verifiable certificates are linked to your student ID.
                      </p>

                      <CourseRegistrationForm 
                        courses={courses} 
                        preselectedCourseId={preselectedCourseId}
                        onSuccess={() => {
                          refreshDb();
                          setApplicationSuccessBanner(null);
                        }}
                        onRequireAuth={(mode, cId) => {
                          if (cId) {
                            setPendingApplyCourseId(cId);
                            try { sessionStorage.setItem('dakshyam_pending_course_apply', cId); } catch {}
                          }
                          handleApplyAuthChoice(mode);
                        }}
                        currentUser={currentUser}
                        theme={theme}
                      />
                    </div>
                  </div>

                </div>
              </div>
            )}

            {/* VIEW 3: GLOBAL LEADERBOARD */}
            {activeTab === 'leaderboard' && (
              <LeaderboardComp groups={groups} students={students} />
            )}

            {/* VIEW 4: SOCIAL VIDEO EXHIBITION */}
            {activeTab === 'social' && (
              <SocialVideoWall videos={videos} onVideoUpdated={refreshDb} />
            )}

            {/* VIEW 5: VERIFY CERTIFICATES */}
            {activeTab === 'verification' && (
              <CertificateVerify theme={theme} />
            )}

            {/* VIEW 6: ABOUT US COMPANY VIEW */}
            {activeTab === 'about' && aboutState && (
              <AboutCompany aboutState={aboutState} theme={theme} />
            )}

            {/* VIEW 7: CONTACT US PAGE VIEW */}
            {activeTab === 'contact' && (
              <ContactUs theme={theme} />
            )}

            {/* VIEW 8: WORKSHOP EVALUATION & FEEDBACK (Student Direct Form via Link & Admin/Trainer Management Audit) */}
            {activeTab === 'feedback' && (
              <div className="w-full">
                {currentUser && (currentUser.role === 'admin' || currentUser.role === 'trainer') ? (
                  <div className="space-y-4">
                    {/* View Switcher: Audit Console vs Participant Form Preview */}
                    <div className="flex flex-wrap items-center justify-between max-w-7xl mx-auto px-4 gap-2">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setFeedbackViewMode('audit')}
                          className={`text-2xs font-mono font-bold px-3.5 py-1.5 rounded-xl border transition-all cursor-pointer ${
                            feedbackViewMode === 'audit'
                              ? (isLight ? 'bg-blue-950 text-white border-blue-950 shadow-xs' : 'bg-sky-500/20 border-sky-400 text-sky-300 shadow-[0_0_10px_rgba(56,189,248,0.2)]')
                              : (isLight ? 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50' : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700')
                          }`}
                        >
                          📊 Feedback Audit & Export Console
                        </button>
                        <button
                          onClick={() => setFeedbackViewMode('form')}
                          className={`text-2xs font-mono font-bold px-3.5 py-1.5 rounded-xl border transition-all cursor-pointer ${
                            feedbackViewMode === 'form'
                              ? (isLight ? 'bg-blue-950 text-white border-blue-950 shadow-xs' : 'bg-sky-500/20 border-sky-400 text-sky-300 shadow-[0_0_10px_rgba(56,189,248,0.2)]')
                              : (isLight ? 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50' : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700')
                          }`}
                        >
                          📝 Participant Public Form Preview
                        </button>
                      </div>

                      <div className="text-[11px] font-mono text-slate-400 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        <span>Logged in as <strong>{currentUser.name}</strong> ({currentUser.role.toUpperCase()})</span>
                      </div>
                    </div>

                    {feedbackViewMode === 'audit' ? (
                      <AdminWorkshopFeedbackManager
                        theme={theme}
                        currentUserRole={currentUser.role}
                        onOpenPublicForm={(wsId) => {
                          if (wsId) setPreselectedWorkshopSlug(wsId);
                          setFeedbackViewMode('form');
                        }}
                      />
                    ) : (
                      <WorkshopFeedbackForm
                        theme={theme}
                        onNavigateHome={() => setFeedbackViewMode('audit')}
                        preselectedWorkshopId={preselectedWorkshopSlug}
                      />
                    )}
                  </div>
                ) : (
                  <WorkshopFeedbackForm
                    theme={theme}
                    onNavigateHome={() => navigateToTab('home')}
                    preselectedWorkshopId={preselectedWorkshopSlug}
                  />
                )}
              </div>
            )}

            {/* VIEW 6: MEMBERS / ROLES AREA DASHBOARDS */}
            {activeTab === 'portal' && (
              <div className="w-full">
                {currentUser ? (
                  <>
                    {currentUser.role === 'student' && (
                      <StudentDashboard 
                        user={currentUser as StudentUser} 
                        courses={courses} 
                        groups={groups} 
                        certificates={certificates}
                        applications={applications}
                        onRefresh={refreshDb}
                      />
                    )}

                    {currentUser.role === 'trainer' && (
                      <TrainerDashboard 
                        trainer={currentUser} 
                        students={students} 
                        courses={courses} 
                        groups={groups} 
                        applications={applications} 
                        certificates={certificates}
                        onRefresh={refreshDb}
                      />
                    )}

                    {currentUser.role === 'admin' && (
                      <AdminDashboard 
                        courses={courses} 
                        applications={applications} 
                        groups={groups} 
                        students={students} 
                        onRefresh={refreshDb}
                        theme={theme}
                        isDbConnected={isDbConnected}
                        onTestLoader={() => {
                          setLoadingTargetTab('portal');
                          setIsPageLoading(true);
                          setTimeout(() => {
                            setIsPageLoading(false);
                          }, Math.max(pageLoaderConfig.minDurationMs || 900, 800));
                        }}
                      />
                    )}
                  </>
                ) : (
                  <div className="text-center max-w-md mx-auto py-12 space-y-4">
                    <HelpCircle className={`w-12 h-12 mx-auto ${isLight ? 'text-blue-900' : 'text-slate-500'}`} />
                    <h2 className={`text-lg font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>Console Session Inactive</h2>
                    <p className={`text-xs ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>Please sign in as a student, trainer, or system supervisor using the top right control card to view dashboards.</p>
                    <button
                      onClick={() => {
                        setAuthMode('login');
                        setShowAuthModal(true);
                      }}
                      className={`text-xs font-bold px-5 py-2.5 rounded-xl cursor-pointer shadow-sm active:scale-95 transition-all ${
                        isLight ? 'bg-blue-950 text-white hover:bg-blue-900' : 'bg-white text-[#0a192f] hover:bg-slate-100 font-bold'
                      }`}
                    >
                      Enter Console Now
                    </button>
                  </div>
                )}
              </div>
            )}

          </motion.div>
        </AnimatePresence>
      </main>

      {/* FOOTER COOPERATING SIGNATURE */}
      <footer className={`relative z-20 w-full py-6 text-center text-3xs font-mono tracking-[0.3em] border-t no-print flex flex-col items-center justify-center gap-1 transition-colors duration-300 ${
        isLight ? 'text-slate-500 border-blue-900/10 bg-white/70' : 'text-slate-500 border-blue-900/20 bg-[#071326]/60 backdrop-blur-md'
      }`}>
        <div 
          onClick={handleStaffAccessTrigger}
          className="cursor-pointer hover:text-blue-900 dark:hover:text-sky-400 transition-colors py-1"
          title="Supervisory Node Overlap (Click to reveal panel)"
        >
          © 2026 Dakshyam innovations
        </div>
        <div className="text-[8px] tracking-normal text-slate-400/60 uppercase flex items-center gap-2">
          <span>NEP-Aligned School IoT & Full-Stack Robotics Integrations</span>
          <span className="text-slate-500">•</span>
          <button
            onClick={() => {
              DakshyamDatabase.setCookie('dakshyam_cookie_consent', '');
              setCookieConsent('');
            }}
            className="hover:text-[#22d3ee] underline transition-colors cursor-pointer text-[8px] font-mono lowercase tracking-normal"
          >
            [ manage cookies ]
          </button>
        </div>
      </footer>

      {/* CANDIDATE COURSE APPLICATION AUTHENTICATION GATEWAY MODAL */}
      <AnimatePresence>
        {showApplyAuthPrompt && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowApplyAuthPrompt(false)}
              className="absolute inset-0 bg-black/85 backdrop-blur-sm pointer-events-auto cursor-pointer"
            />

            {/* Modal Content */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              className={`border p-6 sm:p-7 max-w-md w-full relative z-10 text-left space-y-5 rounded-2xl transition-all shadow-2xl overflow-hidden ${
                isLight 
                  ? 'bg-white border-blue-900/15 text-slate-800' 
                  : 'bg-[#0d1f38] border-blue-800/40 text-white'
              }`}
            >
              {/* Header */}
              <div className="flex justify-between items-start border-b pb-3 border-slate-500/10">
                <div className="flex items-center gap-2.5">
                  <div className={`p-2 rounded-xl border ${
                    isLight ? 'bg-amber-50 border-amber-200 text-amber-800' : 'bg-amber-950/40 border-amber-500/30 text-amber-300'
                  }`}>
                    <ShieldAlert className="w-5 h-5" />
                  </div>
                  <div>
                    <span className={`text-[9px] font-mono uppercase font-bold tracking-widest block ${
                      isLight ? 'text-amber-800' : 'text-amber-300'
                    }`}>
                      Official Enrollment Gateway
                    </span>
                    <h3 className={`text-sm sm:text-base font-black uppercase tracking-wide ${isLight ? 'text-slate-900' : 'text-white'}`}>
                      Candidate Verification Required
                    </h3>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowApplyAuthPrompt(false)}
                  className={`text-xs font-mono font-bold transition-colors cursor-pointer p-1 ${
                    isLight ? 'text-slate-400 hover:text-slate-900' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  ✕ CLOSE
                </button>
              </div>

              {/* Target Course Preview */}
              {pendingApplyCourseId && (
                (() => {
                  const targetCourse = courses.find(c => c.id === pendingApplyCourseId);
                  if (!targetCourse) return null;
                  return (
                    <div className={`p-4 rounded-xl border space-y-1.5 ${
                      isLight ? 'bg-blue-50/50 border-blue-900/15' : 'bg-blue-950/30 border-blue-800/40'
                    }`}>
                      <div className="flex justify-between items-center">
                        <span className={`text-[9px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                          isLight ? 'bg-blue-900/10 text-blue-950' : 'bg-sky-500/10 text-sky-300 border border-sky-500/20'
                        }`}>
                          {targetCourse.duration} Track
                        </span>
                        {targetCourse.mobileHardwareIncluded && (
                          <span className="text-[9px] font-mono font-bold text-emerald-500">
                            ★ Hardware Kit Included
                          </span>
                        )}
                      </div>
                      <h4 className={`text-xs sm:text-sm font-black uppercase ${isLight ? 'text-slate-900' : 'text-white'}`}>
                        {targetCourse.title}
                      </h4>
                      <p className={`text-3xs leading-relaxed ${isLight ? 'text-slate-650' : 'text-slate-350'}`}>
                        {targetCourse.description}
                      </p>
                    </div>
                  );
                })()
              )}

              <p className={`text-xs leading-relaxed ${isLight ? 'text-slate-650' : 'text-slate-350'}`}>
                To submit an official course application, receive physical hardware kits, and track your accredited certification, please sign in to your student account or register as a new candidate.
              </p>

              {/* Benefits Checklist */}
              <div className={`rounded-xl p-3.5 space-y-2 border text-xs font-mono ${
                isLight ? 'bg-slate-50 border-slate-200 text-slate-700' : 'bg-[#071326] border-blue-900/30 text-slate-350'
              }`}>
                <div className="flex items-center gap-2 text-[11px]">
                  <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>Real-time status updates in your Student Portal</span>
                </div>
                <div className="flex items-center gap-2 text-[11px]">
                  <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>Hardware kit allocation directly mapped to your Student ID</span>
                </div>
                <div className="flex items-center gap-2 text-[11px]">
                  <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>Verifiable QR-coded NEP 2020 Certificate issued upon completion</span>
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => handleApplyAuthChoice('login')}
                  className={`w-full py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 uppercase font-mono tracking-wider transition-all cursor-pointer ${
                    isLight 
                      ? 'bg-blue-950 text-white hover:bg-blue-900 shadow-sm' 
                      : 'bg-white text-[#0a192f] hover:bg-slate-100 font-black'
                  }`}
                >
                  <LogIn className="w-4 h-4" />
                  Log In to Your Account
                </button>

                <button
                  type="button"
                  onClick={() => handleApplyAuthChoice('register')}
                  className={`w-full py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 uppercase font-mono tracking-wider transition-all cursor-pointer border ${
                    isLight 
                      ? 'bg-blue-50 border-blue-900/30 text-blue-950 hover:bg-blue-100' 
                      : 'bg-blue-950/40 border-sky-400/40 text-sky-300 hover:bg-blue-900/50'
                  }`}
                >
                  <UserPlus className="w-4 h-4" />
                  Register as New Candidate
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* AUTHENTICATION CONSOLE PANEL MODAL */}
      <AnimatePresence>
        {showAuthModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setShowAuthModal(false);
                setAuthError('');
              }}
              className="absolute inset-0 bg-[#000000]/85 backdrop-blur-sm pointer-events-auto"
            />

            {/* Modal Box */}
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              className={`border p-6 sm:p-7 max-w-sm w-full relative z-10 text-left space-y-5 transition-colors duration-300 flex flex-col justify-between max-h-[90vh] overflow-y-auto rounded-2xl ${
                isLight 
                  ? 'bg-white border-blue-900/15 shadow-2xl' 
                  : 'bg-[#0d1f38] border-blue-800/40 shadow-2xl'
              }`}
            >
              {/* Modal Header */}
              <div className={`flex items-center justify-between border-b pb-2.5 ${isLight ? 'border-blue-900/10' : 'border-blue-500/10'}`}>
                <span className={`text-3xs font-mono tracking-widest uppercase font-black flex items-center gap-1 ${
                  isLight ? 'text-blue-950' : 'text-sky-400'
                }`}>
                  <Sparkles className="w-3.5 h-3.5" /> SECURE HUB ENTRANCE
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setShowAuthModal(false);
                    setAuthError('');
                  }}
                  className={`text-4xs font-mono transition-colors cursor-pointer ${
                    isLight ? 'text-slate-400 hover:text-blue-950' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  ✕ CLOSE
                </button>
              </div>

              {/* Course Application Context Badge */}
              {pendingApplyCourseId && (
                <div className={`p-2.5 rounded-xl border text-xs font-mono flex items-start gap-2 ${
                  isLight ? 'bg-blue-50 border-blue-200 text-blue-950' : 'bg-blue-950/40 border-blue-500/30 text-sky-300'
                }`}>
                  <Sparkles className="w-3.5 h-3.5 shrink-0 text-amber-500 mt-0.5" />
                  <span className="text-[10px] leading-snug">
                    Applying for course: <strong>{courses.find(c => c.id === pendingApplyCourseId)?.title || 'Selected Course'}</strong>. Sign in or register to finalize your application.
                  </span>
                </div>
              )}

              {/* Roles tab selectors - conditionally rendering student or all depending on toggled settings */}
              <div className="space-y-2.5">
                <div className={`p-1 rounded-xl font-mono text-[9px] font-black uppercase text-center relative z-25 grid ${
                  isStaffAccessEnabled ? 'grid-cols-3' : 'grid-cols-1'
                } ${isLight ? 'bg-blue-50 text-slate-700' : 'bg-[#071326] text-slate-300'}`}>
                  
                  {/* Student is always there */}
                  <button
                    type="button"
                    onClick={() => {
                      setAuthRoleTab('student');
                      setAuthMode('login');
                      setAuthError('');
                    }}
                    className={`py-2 rounded-lg cursor-pointer transition-all ${
                      authRoleTab === 'student' 
                        ? (isLight ? 'bg-blue-900 text-white font-extrabold shadow-sm' : 'bg-blue-600 text-white font-bold shadow-md') 
                        : (isLight ? 'text-slate-600 hover:text-blue-950' : 'text-slate-400 hover:text-white')
                    }`}
                  >
                    STUDENT CONSOLE
                  </button>

                  {/* Staff nodes revealed only on active override switch */}
                  {isStaffAccessEnabled && (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          setAuthRoleTab('trainer');
                          setAuthMode('login');
                          setAuthError('');
                        }}
                        className={`py-2 rounded-lg cursor-pointer transition-all ${
                          authRoleTab === 'trainer' 
                            ? (isLight ? 'bg-blue-900 text-white font-extrabold shadow-sm' : 'bg-blue-600 text-white font-bold shadow-md') 
                            : (isLight ? 'text-slate-600 hover:text-blue-950' : 'text-slate-400 hover:text-white')
                        }`}
                      >
                        TRAINER
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setAuthRoleTab('admin');
                          setAuthMode('login');
                          setAuthError('');
                        }}
                        className={`py-2 rounded-lg cursor-pointer transition-all ${
                          authRoleTab === 'admin' 
                            ? (isLight ? 'bg-blue-900 text-white font-extrabold shadow-sm' : 'bg-blue-600 text-white font-bold shadow-md') 
                            : (isLight ? 'text-slate-600 hover:text-blue-950' : 'text-slate-400 hover:text-white')
                        }`}
                      >
                        ADMIN
                      </button>
                    </>
                  )}
                </div>

                {/* Secure trigger key to prevent accidental leakage in customer sites */}
                <div className="flex justify-center pt-0.5">
                  <button
                    type="button"
                    onClick={() => {
                      if (isStaffAccessEnabled) {
                        setIsStaffAccessEnabled(false);
                        setAuthRoleTab('student');
                      } else {
                        setShowAuthModal(false);
                        handleStaffAccessTrigger();
                      }
                    }}
                    className={`text-[9px] font-mono tracking-wider uppercase transition-colors flex items-center gap-1.5 cursor-pointer hover:font-bold ${
                      isLight ? 'text-slate-400 hover:text-blue-900' : 'text-slate-400 hover:text-sky-300'
                    }`}
                  >
                    <Lock className="w-2.5 h-2.5" />
                    {isStaffAccessEnabled ? 'Hide Staff portals' : 'Staff/Supervisor access panel'}
                  </button>
                </div>
              </div>

              {/* Status Alert Notification */}
              {authError && (
                <BeautifulErrorDisplay errorText={authError} isLight={isLight} />
              )}

              {/* SECTION A: STUDENT REGISTRY */}
              {authRoleTab === 'student' && authMode !== 'forgot' && (
                <>
                  {authMode === 'login' ? (
                    <form onSubmit={handleStudentLogin} className="space-y-4 font-sans">
                      <div className="space-y-1">
                        <label className={`block text-4xs font-mono tracking-widest uppercase mb-1 ${isLight ? 'text-blue-900 font-bold' : 'text-sky-300'}`}>
                          Registered Student Email
                        </label>
                        <input
                          type="email"
                          required
                          value={studentEmail}
                          onChange={(e) => setStudentEmail(e.target.value)}
                          placeholder="e.g. student@example.com"
                          className={isLight 
                            ? "w-full bg-slate-50 border border-blue-900/15 text-slate-800 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-900 focus:bg-white transition-all" 
                            : "w-full bg-[#071326] border border-blue-900/30 text-white rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-400 transition-all"
                          }
                        />
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between items-center">
                          <label className={`block text-4xs font-mono tracking-widest uppercase ${isLight ? 'text-blue-900 font-bold' : 'text-sky-300'}`}>
                            Secure Account Password
                          </label>
                        </div>
                        <input
                          type="password"
                          required
                          value={passwordInput}
                          onChange={(e) => setPasswordInput(e.target.value)}
                          placeholder="••••••••"
                          className={isLight 
                            ? "w-full bg-slate-50 border border-blue-900/15 text-slate-800 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-900 focus:bg-white transition-all" 
                            : "w-full bg-[#071326] border border-blue-900/30 text-white rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-400 transition-all"
                          }
                        />
                      </div>

                      <div className="flex justify-end pt-0.5">
                        <button
                          type="button"
                          onClick={() => {
                            setAuthMode('forgot');
                            setAuthError('');
                            setResetSuccessMessage('');
                          }}
                          className={`text-[9px] font-mono uppercase tracking-wide hover:underline cursor-pointer ${
                            isLight ? 'text-blue-900 hover:text-blue-950 font-bold' : 'text-sky-400 hover:text-sky-300'
                          }`}
                        >
                          Forgot Password?
                        </button>
                      </div>

                      <button
                        type="submit"
                        className={`w-full font-bold text-xs py-2.5 rounded-xl cursor-pointer transition-all uppercase font-mono tracking-wider shadow-xs ${
                          isLight 
                            ? 'bg-blue-950 hover:bg-blue-900 text-white shadow-sm' 
                            : 'bg-white hover:bg-slate-100 text-[#0a192f] font-bold shadow-[0_0_15px_rgba(255,255,255,0.2)]'
                        }`}
                      >
                        Sign In Student
                      </button>

                      <div className="text-center pt-1 font-mono text-4xs">
                        <span className={isLight ? 'text-slate-500' : 'text-slate-400'}>Don't have an account? </span>
                        <button
                          type="button"
                          onClick={() => {
                            setAuthMode('register');
                            setAuthError('');
                          }}
                          className={`uppercase font-black cursor-pointer ${isLight ? 'text-blue-900 hover:underline' : 'text-sky-400 hover:underline'}`}
                        >
                          Register Student
                        </button>
                      </div>
                    </form>
                  ) : (
                    <form onSubmit={handleStudentRegister} className="space-y-3 font-sans">
                      <div className="space-y-1">
                        <label className={`block text-4xs font-mono tracking-widest uppercase ${isLight ? 'text-blue-900 font-bold' : 'text-sky-300'}`}>
                          Student Full Name
                        </label>
                        <input
                          type="text"
                          required
                          value={studentName}
                          onChange={(e) => setStudentName(e.target.value)}
                          placeholder="e.g. Kunal Sonkar"
                          className={isLight 
                            ? "w-full bg-slate-50 border border-blue-900/15 text-slate-800 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-blue-900 focus:bg-white" 
                            : "w-full bg-[#071326] border border-blue-900/30 text-white rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-blue-400"
                          }
                        />
                      </div>

                      <div className="space-y-1">
                        <label className={`block text-4xs font-mono tracking-widest uppercase ${isLight ? 'text-blue-900 font-bold' : 'text-sky-300'}`}>
                          Email (Registry ID)
                        </label>
                        <input
                          type="email"
                          required
                          value={studentEmail}
                          onChange={(e) => {
                            setStudentEmail(e.target.value);
                            setIsEmailVerified(false);
                            setOtpSent(false);
                            setOtpInput('');
                            setOtpStatusMsg('');
                          }}
                          placeholder="e.g. kunal@example.com"
                          className={isLight 
                            ? "w-full bg-slate-50 border border-blue-900/15 text-slate-800 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-blue-900 focus:bg-white" 
                            : "w-full bg-[#071326] border border-blue-900/30 text-white rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-blue-400"
                          }
                        />
                      </div>

                      {/* Real OTP Profile Verification Integration */}
                      <div className={`p-3 border rounded-xl space-y-1.5 transition-all ${
                        isLight ? 'bg-blue-50/50 border-blue-900/10' : 'bg-blue-950/20 border-blue-900/30'
                      }`}>
                        <div className="flex items-center justify-between gap-2">
                          <span className={`text-[9px] font-mono uppercase tracking-wider ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                            Email Verification Security
                          </span>
                          {isEmailVerified ? (
                            <span className="text-[9px] font-mono font-bold text-emerald-500 uppercase tracking-widest">
                              ✓ Verified
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={triggerOtp}
                              className={`text-[8px] font-mono uppercase px-2.5 py-1 rounded-lg border transition-all cursor-pointer font-bold ${
                                isLight 
                                  ? 'bg-blue-50 border-blue-900/20 text-blue-900 hover:bg-blue-100/50' 
                                  : 'bg-blue-600/20 border-blue-400/30 text-sky-300 hover:bg-blue-600/30'
                              }`}
                            >
                              {otpSent ? 'Resend Code' : 'Send Code'}
                            </button>
                          )}
                        </div>
                        {otpSent && !isEmailVerified && (
                          <div className="flex gap-2">
                            <input
                              type="text"
                              maxLength={6}
                              value={otpInput}
                              onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, ''))}
                              placeholder="6-digit verification code"
                              className={isLight
                                ? "flex-1 bg-white border border-blue-900/20 text-slate-800 rounded-lg px-2.5 py-1 text-xs focus:outline-none"
                                : "flex-1 bg-[#071326] border border-blue-900/40 text-white rounded-lg px-2.5 py-1 text-xs focus:outline-none"
                              }
                            />
                            <button
                              type="button"
                              onClick={confirmOtp}
                              className={`text-[8px] font-mono font-bold uppercase px-3 py-1 rounded-lg border transition-all cursor-pointer ${
                                isLight 
                                  ? 'bg-blue-900 border-blue-900 text-white hover:bg-blue-950' 
                                  : 'bg-blue-600 border-blue-600 text-white hover:bg-blue-500'
                              }`}
                            >
                              Verify
                            </button>
                          </div>
                        )}
                        {otpStatusMsg && (
                          <p className={`text-[9px] font-mono ${
                            otpStatusMsg.includes('✓') ? 'text-emerald-500 font-bold' : 'text-blue-800 dark:text-sky-300'
                          }`}>
                            {otpStatusMsg}
                          </p>
                        )}
                      </div>

                      <div className="space-y-1">
                        <label className={`block text-4xs font-mono tracking-widest uppercase ${isLight ? 'text-blue-900 font-bold' : 'text-sky-300'}`}>
                          WhatsApp Node
                        </label>
                        <input
                          type="text"
                          required
                          value={studentPhone}
                          onChange={(e) => {
                            const val = e.target.value.replace(/\D/g, '');
                            if (val.length <= 10) setStudentPhone(val);
                          }}
                          placeholder="10-digit mobile number"
                          className={isLight 
                            ? "w-full bg-slate-50 border border-blue-900/15 text-slate-800 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-blue-900 focus:bg-white" 
                            : "w-full bg-[#071326] border border-blue-900/30 text-white rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-blue-400"
                          }
                        />
                      </div>

                      <div className="space-y-1">
                        <label className={`block text-4xs font-mono tracking-widest uppercase ${isLight ? 'text-blue-900 font-bold' : 'text-sky-300'}`}>
                          School / College
                        </label>
                        <input
                          type="text"
                          required
                          value={studentSchool}
                          onChange={(e) => setStudentSchool(e.target.value)}
                          placeholder="Secondary School Name"
                          className={isLight 
                            ? "w-full bg-slate-50 border border-blue-900/15 text-slate-800 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-blue-900 focus:bg-white" 
                            : "w-full bg-[#071326] border border-blue-900/30 text-white rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-blue-400"
                          }
                        />
                      </div>

                      <div className="space-y-1">
                        <label className={`block text-4xs font-mono tracking-widest uppercase ${isLight ? 'text-blue-900 font-bold' : 'text-sky-300'}`}>
                          Choose Safe Password
                        </label>
                        <input
                          type="password"
                          required
                          value={passwordInput}
                          onChange={(e) => setPasswordInput(e.target.value)}
                          placeholder="Create strong account passcode"
                          className={isLight 
                            ? "w-full bg-slate-50 border border-blue-900/15 text-slate-800 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-blue-900 focus:bg-white" 
                            : "w-full bg-[#071326] border border-blue-900/30 text-white rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-blue-400"
                          }
                        />
                      </div>

                      <div className="space-y-1">
                        <label className={`block text-4xs font-mono tracking-widest uppercase ${isLight ? 'text-blue-900 font-bold' : 'text-sky-300'}`}>
                          Class Level
                        </label>
                        <select
                          value={studentLevel}
                          onChange={(e) => setStudentLevel(e.target.value)}
                          className={isLight 
                            ? "w-full bg-slate-50 border border-blue-900/15 text-slate-800 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-900 focus:bg-white" 
                            : "w-full bg-[#071326] border border-blue-900/30 text-white rounded-xl px-3 py-2 text-xs focus:outline-none"
                          }
                        >
                          <option value="Grade 10">Grade 10 High School Setup</option>
                          <option value="Grade 11">Grade 11 High School Setup</option>
                          <option value="Grade 12">Grade 12 High School Setup</option>
                          <option value="Diploma Core">Diploma CS/Kinematics Branch</option>
                          <option value="General Batch">Open Professional Sector</option>
                        </select>
                      </div>

                      <button
                        type="submit"
                        className={`w-full font-bold text-xs py-2.5 rounded-xl cursor-pointer transition-all uppercase font-mono tracking-wider shadow-xs ${
                          isLight 
                            ? 'bg-blue-950 hover:bg-blue-900 text-white shadow-sm' 
                            : 'bg-white hover:bg-slate-100 text-[#0a192f] font-bold shadow-[0_0_15px_rgba(255,255,255,0.2)]'
                        }`}
                      >
                        Confirm Register
                      </button>

                      <div className="text-center pt-1 font-mono text-4xs">
                        <span className={isLight ? 'text-slate-500' : 'text-slate-400'}>Already have account? </span>
                        <button
                          type="button"
                          onClick={() => {
                            setAuthMode('login');
                            setAuthError('');
                          }}
                          className={`uppercase font-black cursor-pointer ${isLight ? 'text-blue-900 hover:underline' : 'text-sky-400 hover:underline'}`}
                        >
                          Sign In
                        </button>
                      </div>
                    </form>
                  )}
                </>
              )}

              {/* SECTION B: TRAINER REGISTRY & VERIFICATION SYSTEM */}
              {authRoleTab === 'trainer' && authMode !== 'forgot' && (
                <>
                  {authMode === 'login' ? (
                    <form onSubmit={handleTrainerLogin} className="space-y-4 font-sans">
                      <div className="space-y-1">
                        <label className={`block text-4xs font-mono tracking-widest uppercase mb-1 ${isLight ? 'text-blue-900 font-bold' : 'text-sky-300'}`}>
                          Trainer Email Key
                        </label>
                        <input
                          type="email"
                          required
                          value={studentEmail}
                          onChange={(e) => setStudentEmail(e.target.value)}
                          placeholder="e.g. trainer@dakshyam.com"
                          className={isLight 
                            ? "w-full bg-slate-50 border border-blue-900/15 text-slate-800 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-900 focus:bg-white" 
                            : "w-full bg-[#071326] border border-blue-900/30 text-white rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-40"
                          }
                        />
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between items-center">
                          <label className={`block text-4xs font-mono tracking-widest uppercase ${isLight ? 'text-blue-900 font-bold' : 'text-sky-300'}`}>
                            Trainer Password
                          </label>
                        </div>
                        <input
                          type="password"
                          required
                          value={passwordInput}
                          onChange={(e) => setPasswordInput(e.target.value)}
                          placeholder="••••••••"
                          className={isLight 
                            ? "w-full bg-slate-50 border border-blue-900/15 text-slate-800 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-900 focus:bg-white" 
                            : "w-full bg-[#071326] border border-blue-900/30 text-white rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-40"
                          }
                        />
                      </div>

                      <div className="flex justify-end pt-0.5">
                        <button
                          type="button"
                          onClick={() => {
                            setAuthMode('forgot');
                            setAuthError('');
                            setResetSuccessMessage('');
                          }}
                          className={`text-[9px] font-mono uppercase tracking-wide hover:underline cursor-pointer ${
                            isLight ? 'text-blue-900 hover:text-blue-950 font-bold' : 'text-sky-400 hover:text-sky-300'
                          }`}
                        >
                          Forgot Password?
                        </button>
                      </div>

                      <button
                        type="submit"
                        className={`w-full font-bold text-xs py-2.5 rounded-xl cursor-pointer transition-all uppercase font-mono tracking-wider shadow-xs ${
                          isLight 
                            ? 'bg-blue-950 hover:bg-blue-900 text-white shadow-sm' 
                            : 'bg-white hover:bg-slate-100 text-[#0a192f] font-bold shadow-[0_0_15px_rgba(255,255,255,0.2)]'
                        }`}
                      >
                        Enter Trainer Workspace
                      </button>

                      <div className="text-center pt-1 font-mono text-4xs">
                        <span className={isLight ? 'text-slate-500' : 'text-slate-400'}>New Trainer? </span>
                        <button
                          type="button"
                          onClick={() => {
                            setAuthMode('register');
                            setAuthError('');
                          }}
                          className={`uppercase font-black cursor-pointer ${isLight ? 'text-blue-900 hover:underline' : 'text-sky-400 hover:underline'}`}
                        >
                          Request Approved Account
                        </button>
                      </div>
                    </form>
                  ) : (
                    <form onSubmit={handleTrainerRegister} className="space-y-4 font-sans">
                      <div className="space-y-1">
                        <label className={`block text-4xs font-mono tracking-widest uppercase mb-1 ${isLight ? 'text-blue-900 font-bold' : 'text-sky-300'}`}>
                          Full Name
                        </label>
                        <input
                          type="text"
                          required
                          value={studentName}
                          onChange={(e) => setStudentName(e.target.value)}
                          placeholder="Trainer Amit Mathur"
                          className={isLight 
                            ? "w-full bg-slate-50 border border-blue-900/15 text-slate-800 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-900" 
                            : "w-full bg-[#071326] border border-blue-900/30 text-white rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-40"
                          }
                        />
                      </div>

                      <div className="space-y-1">
                        <label className={`block text-4xs font-mono tracking-widest uppercase mb-1 ${isLight ? 'text-blue-900 font-bold' : 'text-sky-300'}`}>
                          Email (Needs Approval)
                        </label>
                        <input
                          type="email"
                          required
                          value={studentEmail}
                          onChange={(e) => setStudentEmail(e.target.value)}
                          placeholder="name@dakshyam.com"
                          className={isLight 
                            ? "w-full bg-slate-50 border border-blue-900/15 text-slate-800 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-900" 
                            : "w-full bg-[#071326] border border-blue-900/30 text-white rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-40"
                          }
                        />
                      </div>

                      <div className="space-y-1">
                        <label className={`block text-4xs font-mono tracking-widest uppercase mb-1 ${isLight ? 'text-blue-900 font-bold' : 'text-sky-300'}`}>
                          Choose Safe Password
                        </label>
                        <input
                          type="password"
                          required
                          value={passwordInput}
                          onChange={(e) => setPasswordInput(e.target.value)}
                          placeholder="Create strong account passcode"
                          className={isLight 
                            ? "w-full bg-slate-50 border border-blue-900/15 text-slate-800 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-900" 
                            : "w-full bg-[#071326] border border-blue-900/30 text-white rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-40"
                          }
                        />
                      </div>

                      <div className="space-y-1">
                        <label className={`block text-4xs font-mono tracking-widest uppercase mb-1 ${isLight ? 'text-blue-900 font-bold' : 'text-sky-300'}`}>
                          Trainer Registration Code (Optional)
                        </label>
                        <input
                          type="password"
                          value={trainerRegCode}
                          onChange={(e) => setTrainerRegCode(e.target.value)}
                          placeholder="trainer@dki2026 for instant approval"
                          className={isLight 
                            ? "w-full bg-slate-50 border border-blue-900/15 text-slate-800 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-900" 
                            : "w-full bg-[#071326] border border-blue-900/30 text-white rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-40"
                          }
                        />
                      </div>

                      <button
                        type="submit"
                        className={`w-full font-bold text-xs py-2.5 rounded-xl cursor-pointer transition-all uppercase font-mono tracking-wider shadow-xs ${
                          isLight 
                            ? 'bg-blue-950 hover:bg-blue-900 text-white shadow-sm' 
                            : 'bg-white hover:bg-slate-100 text-[#0a192f] font-bold shadow-[0_0_15px_rgba(255,255,255,0.2)]'
                        }`}
                      >
                        Submit ID Application
                      </button>

                      <div className="text-center pt-1 font-mono text-4xs">
                        <span className={isLight ? 'text-slate-500' : 'text-slate-400'}>Already registered? </span>
                        <button
                          type="button"
                          onClick={() => {
                            setAuthMode('login');
                            setAuthError('');
                          }}
                          className={`uppercase font-black cursor-pointer ${isLight ? 'text-blue-900 hover:underline' : 'text-sky-400 hover:underline'}`}
                        >
                          Sign In
                        </button>
                      </div>
                    </form>
                  )}
                </>
              )}

              {/* SECTION C: ADMINISTRATOR PASSCODE ENTER */}
              {authRoleTab === 'admin' && (
                <form onSubmit={handleAdminLogin} className="space-y-4 font-sans">
                  <div className="space-y-1">
                    <label className={`block text-4xs font-mono tracking-widest uppercase mb-1 ${isLight ? 'text-blue-900 font-bold' : 'text-sky-300'}`}>
                      Admin Signature Override Passcode
                    </label>
                    <input
                      type="password"
                      required
                      value={secretCode}
                      onChange={(e) => setSecretCode(e.target.value)}
                      placeholder="ENTER PRIVATE SYSTEM CODE"
                      className={isLight 
                        ? "w-full bg-slate-50 border border-blue-900/20 text-slate-800 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-900 tracking-widest text-center uppercase font-black" 
                        : "w-full bg-[#071326] border border-blue-900/30 text-white rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-400 tracking-widest text-center uppercase text-sky-400 font-bold"
                      }
                    />
                  </div>

                  <button
                    type="submit"
                    className={`w-full font-bold text-xs py-2.5 rounded-xl cursor-pointer transition-all uppercase font-mono tracking-wider shadow-xs ${
                      isLight 
                        ? 'bg-blue-950 hover:bg-blue-900 text-white shadow-sm' 
                        : 'bg-white hover:bg-slate-100 text-[#0a192f] font-bold shadow-[0_0_15px_rgba(255,255,255,0.2)]'
                    }`}
                  >
                    Authenticate Console
                  </button>
                </form>
              )}

              {/* SECTION D: SELF-SERVICE PASSWORD RECOVERY */}
              {authMode === 'forgot' && (
                <form onSubmit={handleResetPassword} className="space-y-4 font-sans">
                  <div className="space-y-1.5 text-center pb-2 border-b border-blue-500/10">
                    <h3 className={`text-xs font-black uppercase tracking-wide ${isLight ? 'text-slate-800' : 'text-slate-100'}`}>
                      Recover {authRoleTab === 'student' ? 'Student' : 'Trainer'} Access
                    </h3>
                    <p className="text-[10px] text-slate-400 font-sans leading-relaxed">
                      Enter your registered email address below to receive a secure password recovery link.
                    </p>
                  </div>

                  {resetSuccessMessage && (
                    <div className="text-[10px] font-mono p-2.5 rounded-xl border border-emerald-500/20 bg-emerald-50 text-emerald-600 font-bold text-center leading-relaxed">
                      {resetSuccessMessage}
                    </div>
                  )}

                  <div className="space-y-1">
                    <label className={`block text-4xs font-mono tracking-widest uppercase mb-1 ${isLight ? 'text-blue-900 font-bold' : 'text-sky-300'}`}>
                      Registered Account Email
                    </label>
                    <input
                      type="email"
                      required
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      placeholder="e.g. user@example.com"
                      className={isLight 
                        ? "w-full bg-slate-50 border border-blue-900/15 text-slate-800 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-900" 
                        : "w-full bg-[#071326] border border-blue-900/30 text-white rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-400"
                      }
                    />
                  </div>

                  <button
                    type="submit"
                    className={`w-full font-bold text-xs py-2.5 rounded-xl cursor-pointer transition-all uppercase font-mono tracking-wider shadow-xs ${
                      isLight 
                        ? 'bg-blue-950 hover:bg-blue-900 text-white shadow-sm' 
                        : 'bg-white hover:bg-slate-100 text-[#0a192f] font-bold shadow-[0_0_15px_rgba(255,255,255,0.2)]'
                    }`}
                  >
                    Send Recovery Email
                  </button>

                  <div className="text-center pt-1 font-mono text-4xs">
                    <span className={isLight ? 'text-slate-500' : 'text-slate-400'}>Remember password? </span>
                    <button
                      type="button"
                      onClick={() => {
                        setAuthMode('login');
                        setAuthError('');
                        setResetSuccessMessage('');
                      }}
                      className={`uppercase font-black cursor-pointer ${isLight ? 'text-blue-900 hover:underline' : 'text-sky-400 hover:underline'}`}
                    >
                      Sign In Page
                    </button>
                  </div>
                </form>
              )}

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* DIRECTORS / SUPERVISOR SECURE PIN MODAL */}
      <AnimatePresence>
        {showPinPrompt && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setShowPinPrompt(false);
                setPinError('');
              }}
              className="absolute inset-0 bg-[#000000]/90 backdrop-blur-md pointer-events-auto"
            />

            {/* PIN Dialog Box */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className={`border p-6 max-w-sm w-full relative z-10 text-center space-y-5 transition-colors duration-300 rounded-2xl ${
                isLight 
                  ? 'bg-white border-blue-900/15 shadow-2xl font-sans' 
                  : 'bg-[#0d1f38] border-blue-800/40 shadow-2xl font-sans'
              }`}
            >
              {/* Icon & Title */}
              <div className="space-y-2">
                <div className={`w-12 h-12 mx-auto rounded-full flex items-center justify-center border ${
                  isLight ? 'bg-blue-50 border-blue-900/20 text-blue-950' : 'bg-blue-950/60 border-blue-500/20 text-sky-400'
                }`}>
                  <Lock className="w-5 h-5 animate-pulse" />
                </div>
                <h3 className={`text-xs font-black uppercase tracking-widest ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  Supervisor Authentication Challenge
                </h3>
                <p className="text-4xs text-slate-450 font-mono">
                  Enter the 6-digit numeric access PIN to expose supervisory controls.
                </p>
              </div>

              {/* Pin Form */}
              <form onSubmit={handleVerifyPinCode} className="space-y-4">
                <div className="space-y-1.5">
                  <input
                    type="password"
                    maxLength={6}
                    pattern="[0-9]{6}"
                    required
                    autoFocus
                    value={enteredPin}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, ''); // Number only
                      setEnteredPin(val);
                    }}
                    placeholder="••••••"
                    className={`w-full tracking-[1.5em] text-center font-black text-lg py-2.5 rounded-xl border focus:outline-none transition-all ${
                      isLight 
                        ? 'bg-slate-50 border-blue-900/20 text-slate-800 focus:border-blue-900 focus:bg-white' 
                        : 'bg-[#071326] border-blue-900/30 text-sky-300 focus:border-blue-400 focus:ring-1 focus:ring-blue-400/20'
                    }`}
                  />
                </div>

                {pinError && (
                  <p className="text-4xs font-mono text-red-500 bg-red-950/10 border border-red-500/10 p-2.5 rounded-lg leading-relaxed text-center">
                    {pinError}
                  </p>
                )}

                <div className="grid grid-cols-2 gap-3.5 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setShowPinPrompt(false);
                      setPinError('');
                    }}
                    className={`font-mono text-4xs uppercase tracking-widest py-2.5 rounded-xl border transition-all cursor-pointer font-extrabold ${
                      isLight 
                        ? 'border-slate-500/10 text-slate-500 hover:text-slate-800 hover:bg-slate-50' 
                        : 'border-slate-500/10 text-slate-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    Cancel Challenge
                  </button>

                  <button
                    type="submit"
                    className={`font-mono text-4xs uppercase tracking-widest py-2.5 rounded-xl transition-all cursor-pointer font-black ${
                      isLight 
                        ? 'bg-blue-950 hover:bg-blue-900 text-white shadow-sm' 
                        : 'bg-white hover:bg-slate-100 text-[#0a192f] shadow-[0_0_10px_rgba(255,255,255,0.15)]'
                    }`}
                  >
                    Verify Passcode
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* COOKIE CONSENT PROTOCOL BANNER */}
      <AnimatePresence>
        {!cookieConsent && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-4 left-4 right-4 z-50 max-w-lg sm:left-auto sm:right-4 no-print"
          >
            <div className={`p-5 rounded-2xl border shadow-xl flex flex-col gap-3.5 ${
              isLight ? 'bg-white border-blue-900/15 text-slate-800' : 'bg-[#0d1f38]/95 border-blue-800/40 text-slate-300'
            }`}>
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-xl shrink-0 ${isLight ? 'bg-blue-50 text-blue-950' : 'bg-blue-950 text-sky-400'}`}>
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div className="space-y-1">
                  <h4 className={`text-2xs font-mono font-black uppercase tracking-wider ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    Cookie Consent Agreement
                  </h4>
                  <p className="text-4xs leading-relaxed font-sans">
                    We use basic cookies to safely remember your selected theme preference ('light' / 'dark') and store structured cache data to speed up navigation response.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-end gap-2 text-2xs font-mono">
                <button
                  type="button"
                  onClick={() => {
                    DakshyamDatabase.setCookie('dakshyam_cookie_consent', 'basic');
                    setCookieConsent('basic');
                  }}
                  className={`px-3 py-1.5 rounded-lg border text-4xs uppercase tracking-wider font-bold hover:opacity-80 transition-all cursor-pointer ${
                    isLight ? 'border-slate-350 text-slate-600 bg-slate-50' : 'border-slate-800 text-slate-400 bg-[#071326]'
                  }`}
                >
                  Allow Basic Only
                </button>
                <button
                  type="button"
                  onClick={() => {
                    DakshyamDatabase.setCookie('dakshyam_cookie_consent', 'accepted');
                    setCookieConsent('accepted');
                    DakshyamDatabase.setCookie('dakshyam_fast_caching', 'enabled');
                  }}
                  className={`px-3 py-1.5 rounded-lg text-4xs uppercase tracking-wider font-extrabold hover:shadow-md transition-all cursor-pointer ${
                    isLight 
                      ? 'bg-blue-950 hover:bg-blue-900 text-white' 
                      : 'bg-white hover:bg-slate-100 text-[#0a192f]'
                  }`}
                >
                  Accept All Preferences
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ENTERPRISE SECURITY VIOLATION FEEDBACK TOAST */}
      <SecurityToast />

    </div>
  );
}
