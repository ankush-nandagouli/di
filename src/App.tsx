import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Trophy, BookOpen, ShieldCheck, Play, UserCircle, 
  LogOut, LogIn, ChevronRight, HelpCircle, Activity, Sparkles, School,
  Sun, Moon, Menu, X, Eye, EyeOff, Lock, Settings, Key, Info, Cpu, Compass,
  UserPlus, ShieldAlert, CheckCircle2, Check, ClipboardList, Home, Phone, Video, Award,
  Building2, ArrowUp, Instagram, Linkedin, Youtube, Twitter, Smartphone, Users, Github
} from 'lucide-react';

import ThreeBackground from './components/ThreeBackground';
import LandingPage from './components/LandingPage';
import CourseRegistrationForm from './components/CourseRegistrationForm';
import SocialVideoWall from './components/SocialVideoWall';
import StudentDashboard from './components/StudentDashboard';
import TrainerDashboard from './components/TrainerDashboard';
import AdminDashboard from './components/AdminDashboard';
import AboutCompany from './components/AboutCompany';
import ContactUs from './components/ContactUs';
import { PrivacyPolicy } from './components/PrivacyPolicy';
import { TermsAndConditions } from './components/TermsAndConditions';
import WorkshopDirectoryModal from './components/WorkshopDirectoryModal';
import { WorkshopFeedbackStorage } from './utils/feedbackStorage';
import NotificationBell from './components/NotificationBell';
import { NotificationService } from './utils/notificationService';
import { SecurityToast } from './components/SecurityToast';
import { NotFoundPage } from './components/NotFoundPage';
import { AppToast } from './components/AppToast';
import { notifySuccess, notifyError, notifyInfo } from './utils/toast';
import { SecurityGuard } from './utils/security';
import { syncStorageWithCookies } from './utils/secureCookie';

import { DakshyamDatabase } from './utils/db';
import { Course, CourseApplication, StudentGroup, StudentUser, Certificate, VideoPost, PromoBanner, GalleryImage } from './types';
import { BeautifulErrorDisplay } from './utils/errorShield';

// Firebase Auth & Firestore SDK imports
import { 
  sendPasswordResetEmail,
  createUserWithEmailAndPassword
} from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth as firebaseAuth, db } from './utils/firebase';

export type NavigationTab = 'home' | 'services' | 'social' | 'portal' | 'about' | 'contact' | 'notfound' | 'privacy' | 'terms';

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
  const [showPinMask, setShowPinMask] = useState(true);

  // Helper to parse routes (supports courses, hashes, 404 routes, etc.)
  const parseInitialRoute = (): { tab: NavigationTab } => {
    try {
      if (typeof window === 'undefined') return { tab: 'home' };
      const pathname = window.location.pathname;
      const searchParams = new URLSearchParams(window.location.search);

      // Check for legacy feedback or certificate paths - gracefully route home
      const legacyPrefixes = ['/feedback-form', '/feedback', '/workshop-form', '/workshop', '/workshops', '/leaderboard', '/verification'];
      for (const prefix of legacyPrefixes) {
        if (pathname.startsWith(prefix)) {
          return { tab: 'home' };
        }
      }

      // Check for 404 path
      if (pathname !== '/' && pathname !== '' && pathname !== '/index.html') {
        return { tab: 'notfound' };
      }

      const tabParam = searchParams.get('tab');
      if (tabParam) {
        if (['home', 'services', 'social', 'portal', 'about', 'contact', 'privacy', 'terms'].includes(tabParam)) {
          return { tab: tabParam as NavigationTab };
        }
        return { tab: 'notfound' };
      }
    } catch (e) {
      console.error('URL parse fail', e);
    }
    return { tab: 'home' };
  };

  const initialRoute = parseInitialRoute();

  // Navigation states
  const [activeTab, setActiveTab] = useState<NavigationTab>(() => initialRoute.tab);
  const [preselectedWorkshopSlug, setPreselectedWorkshopSlug] = useState<string | null>(null);
  const [preselectedCourseId, setPreselectedCourseId] = useState<string | null>(null);
  const [isWorkshopDirectoryModalOpen, setIsWorkshopDirectoryModalOpen] = useState<boolean>(false);
  const [showScrollTop, setShowScrollTop] = useState<boolean>(false);
  const [availableWorkshops, setAvailableWorkshops] = useState(() => {
    try {
      return WorkshopFeedbackStorage.getFeedbackConfig().workshops;
    } catch {
      return [];
    }
  });

  // Track window scroll position for floating back-to-top button
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 350);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Enterprise Security Initialization & Visitor Tracking
  useEffect(() => {
    // Initialize Enterprise Security Guard
    SecurityGuard.init();
    // Synchronize resilient cookie and local storage across browsers
    syncStorageWithCookies();

    // Dynamic Visitor Tracking Hit
    const liveHitCount = DakshyamDatabase.recordVisitorHit();
    setVisitorCount(liveHitCount);

    fetch('/api/visitor/count')
      .then(res => res.json())
      .then(data => {
        if (typeof data?.count === 'number') {
          setVisitorCount(data.count);
          DakshyamDatabase.set('dakshyam_visitor_count', data.count);
        }
      })
      .catch(() => {});
  }, []);

  // Dynamic Visitor Count state
  const [visitorCount, setVisitorCount] = useState<number>(() => {
    return DakshyamDatabase.getVisitorCount();
  });

  // Dynamic active devices count for admin
  const [adminDeviceCount, setAdminDeviceCount] = useState<number>(1);

  // Listen to browser navigation popstate (back/forward)
  useEffect(() => {
    const handlePopState = () => {
      const route = parseInitialRoute();
      setActiveTab(route.tab);
    };
    window.addEventListener('popstate', handlePopState);
    window.addEventListener('hashchange', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('hashchange', handlePopState);
    };
  }, []);

  // Fast, user-friendly navigation function
  const navigateToTab = (
    newTab: NavigationTab,
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
      if (newTab === 'home') {
        url.pathname = '/';
        url.searchParams.delete('tab');
        url.searchParams.delete('workshop');
        url.searchParams.delete('feedback');
      } else if (newTab === 'notfound') {
        url.searchParams.set('tab', '404');
        url.searchParams.delete('workshop');
        url.searchParams.delete('feedback');
      } else {
        url.pathname = '/';
        url.searchParams.set('tab', newTab);
        url.searchParams.delete('workshop');
        url.searchParams.delete('feedback');
      }
      window.history.pushState(null, '', url.toString());
    } catch {}

    if (newTab === activeTab) {
      return;
    }

    setActiveTab(newTab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
  const [studentLevel, setStudentLevel] = useState('');

  // Secret passcode states (Trainer/Admin URL security)
  const [secretCode, setSecretCode] = useState('');
  const [trainerRegCode, setTrainerRegCode] = useState('');
  const [authError, setAuthError] = useState('');

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

  // Clean input validation: limits max length and blocks malicious script/HTML injection
  const isInputSafe = (val: string, fieldName = 'input'): { safe: boolean; error?: string } => {
    if (!val) return { safe: true };
    if (val.length > 250) {
      return { safe: false, error: `${fieldName} exceeds maximum allowable length of 250 characters.` };
    }
    // Block script tags and javascript: URIs without restricting legitimate names with apostrophes/quotes
    if (/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi.test(val) || /javascript:/gi.test(val)) {
      return { safe: false, error: `Invalid characters or HTML markup detected in ${fieldName}.` };
    }
    return { safe: true };
  };

  const isValidEmail = (emailStr: string): boolean => {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(emailStr);
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
    } catch (e) {
      console.error('Error synchronizing dataset:', e);
    }
  };

  // Dynamic session heartbeat ping & devices count
  useEffect(() => {
    if (!currentUser) return;
    const sessionId = DakshyamDatabase.getSessionId();

    const doPingAndRefreshDevices = () => {
      fetch('/api/auth/sessions/ping', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-session-id': sessionId
        },
        body: JSON.stringify({ sessionId })
      }).catch(() => {});

      if (currentUser?.role === 'admin') {
        const token = DakshyamDatabase.getAuthToken();
        fetch(`/api/auth/sessions?sessionId=${encodeURIComponent(sessionId)}`, {
          headers: {
            ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
            'x-session-id': sessionId
          }
        })
          .then(res => res.json())
          .then(data => {
            if (typeof data?.totalDevices === 'number') {
              setAdminDeviceCount(data.totalDevices);
            }
          })
          .catch(() => {});
      }
    };

    doPingAndRefreshDevices();
    const interval = setInterval(doPingAndRefreshDevices, 30000);
    return () => clearInterval(interval);
  }, [currentUser]);

  // Run initial loading sequences and sync theme side-effect to root HTML & meta
  useEffect(() => {
    try {
      localStorage.setItem('dakshyam_theme', theme);
      DakshyamDatabase.setCookie('dakshyam_theme', theme);

      // Synchronize root html class and colorScheme for smooth theme switching
      const root = document.documentElement;
      if (theme === 'light') {
        root.classList.remove('dark');
        root.classList.add('light');
        root.style.colorScheme = 'light';
      } else {
        root.classList.remove('light');
        root.classList.add('dark');
        root.style.colorScheme = 'dark';
      }

      // Sync theme-color meta tag
      const metaTheme = document.querySelector('meta[name="theme-color"]');
      if (metaTheme) {
        metaTheme.setAttribute('content', theme === 'light' ? '#ffffff' : '#0a192f');
      }
    } catch (e) {
      console.error(e);
    }
  }, [theme]);

  // SEO Tab Synchronization, Dynamic Document Titles, and Meta updates
  useEffect(() => {
    try {
      const url = new URL(window.location.href);
      if (activeTab === 'home') {
        url.searchParams.delete('tab');
      } else if (activeTab === 'notfound') {
        url.searchParams.set('tab', '404');
      } else {
        url.searchParams.set('tab', activeTab);
      }
      window.history.replaceState(null, '', url.toString());

      // Update document titles and meta tags dynamically matching brand & SEO standards
      const portalTitle = currentUser 
        ? `${currentUser.role === 'admin' ? 'Admin Control Console' : currentUser.role === 'trainer' ? 'Trainer Evaluation & Assessment Portal' : 'Student Workspace & Learning Portal'} | Dakshyam Innovations`
        : 'Console & Workspace Access | Dakshyam Innovations';

      const portalDesc = currentUser
        ? `Dakshyam Innovations authenticated workspace for ${currentUser.name} (${currentUser.role.toUpperCase()}). Manage courses, robotics telemetry, and project modules.`
        : 'Secure digital console for enrolled students, certified trainers, and system administrators at Dakshyam Innovations.';

      const titleMapping: Record<NavigationTab, string> = {
        home: 'Dakshyam Innovations | Robotics, IoT & Programming Hub Waraseoni',
        services: 'Vocational Programs & Labs | Dakshyam Innovations Waraseoni',
        social: 'Exhibition Wall & Projects | Dakshyam Innovations',
        portal: portalTitle,
        about: 'About Us & Tech Services | Dakshyam Innovations Waraseoni',
        contact: 'Contact & Campus Consultations | Dakshyam Innovations',
        notfound: '404 - Page Not Found | Dakshyam Innovations',
        privacy: 'Privacy Policy | Dakshyam Innovations',
        terms: 'Terms and Conditions | Dakshyam Innovations'
      };

      const descMapping: Record<NavigationTab, string> = {
        home: 'Dakshyam Innovations Waraseoni delivers premier hands-on training in Programming, Web Development, Mobile Apps, AI, Industrial IoT, and Robotics under NEP 2020 in Waraseoni, Balaghat, MP.',
        services: 'Explore our hands-on engineering programs in C, C++, Python, JavaScript, Django, MERN, Flutter, and IoT robotics laboratory hardware in Waraseoni.',
        social: 'Exhibition postings, student robotics demonstrations, and technical achievements from Dakshyam Innovations laboratories.',
        portal: portalDesc,
        about: 'Dakshyam Innovations is a premier engineering education technology developer and skill incubator in Waraseoni, Balaghat, MP. Learn • Build • Innovate.',
        contact: 'Connect with Dakshyam Innovations at Ward No. 4, Siddhivinayak Complex, Balaghat Road, Waraseoni for workshops, training, and lab setups.',
        notfound: 'The requested destination on dakshyaminnovations.in could not be located. Explore our available courses and training tracks.',
        privacy: 'Read the Dakshyam Innovations Privacy Policy. Learn how we handle student data, laboratory security, and privacy compliance under DPDP & IT Act 2000.',
        terms: 'Terms and Conditions for Dakshyam Innovations vocational training programs, robotics hardware laboratories, and student certification.'
      };

      const currentTitle = titleMapping[activeTab] || titleMapping.home;
      const currentDesc = descMapping[activeTab] || descMapping.home;
      const currentUrl = activeTab === 'home' ? 'https://dakshyaminnovations.in/' : `https://dakshyaminnovations.in/?tab=${activeTab}`;

      document.title = currentTitle;

      const setMeta = (selector: string, attr: string, val: string, createTag?: () => HTMLElement) => {
        let el = document.querySelector(selector);
        if (!el && createTag) {
          el = createTag();
          document.head.appendChild(el);
        }
        if (el) el.setAttribute(attr, val);
      };

      // Primary Meta Tags
      setMeta('meta[name="title"]', 'content', currentTitle, () => {
        const m = document.createElement('meta');
        m.name = 'title';
        return m;
      });
      setMeta('meta[name="description"]', 'content', currentDesc, () => {
        const m = document.createElement('meta');
        m.name = 'description';
        return m;
      });

      // Open Graph Tags
      setMeta('meta[property="og:title"]', 'content', currentTitle, () => {
        const m = document.createElement('meta');
        m.setAttribute('property', 'og:title');
        return m;
      });
      setMeta('meta[property="og:description"]', 'content', currentDesc, () => {
        const m = document.createElement('meta');
        m.setAttribute('property', 'og:description');
        return m;
      });
      setMeta('meta[property="og:url"]', 'content', currentUrl, () => {
        const m = document.createElement('meta');
        m.setAttribute('property', 'og:url');
        return m;
      });

      // Twitter Card Tags
      setMeta('meta[name="twitter:title"]', 'content', currentTitle, () => {
        const m = document.createElement('meta');
        m.name = 'twitter:title';
        return m;
      });
      setMeta('meta[name="twitter:description"]', 'content', currentDesc, () => {
        const m = document.createElement('meta');
        m.name = 'twitter:description';
        return m;
      });
      setMeta('meta[name="twitter:url"]', 'content', currentUrl, () => {
        const m = document.createElement('meta');
        m.name = 'twitter:url';
        return m;
      });

      // Canonical link
      setMeta('link[rel="canonical"]', 'href', currentUrl, () => {
        const l = document.createElement('link');
        l.rel = 'canonical';
        return l;
      });
    } catch (err) {
      console.error('SEO sync fail', err);
    }
  }, [activeTab, currentUser]);

  useEffect(() => {
    // Sync public catalog and UI settings without exposing user accounts
    const syncDatabaseOnBoot = async () => {
      try {
        const response = await fetch('/api/public/data');
        if (response.ok) {
          const data = await response.json();
          if (data.connected !== undefined) {
            setIsDbConnected(!!data.connected);
          }
          // Synchronize public catalog keys into local storage
          const publicKeys = [
            'courses', 'banners', 'gallery_images', 'company_about', 
            'page_loader_config', 'workshop_feedback_config', 'videos', 'groups'
          ];
          for (const key of publicKeys) {
            if (data[key] !== undefined && data[key] !== null) {
              localStorage.setItem(`dakshyam_db_${key}`, JSON.stringify(data[key]));
            }
          }
          refreshDb();
        }
      } catch (err) {
        console.warn("Could not sync public platform catalog on startup:", err);
      }

      // If user holds a valid auth token, verify session against server
      const token = DakshyamDatabase.getAuthToken();
      if (token) {
        try {
          const meRes = await fetch('/api/me', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (meRes.ok) {
            const meData = await meRes.json();
            if (meData.user) {
              DakshyamDatabase.setLoggedInUser(meData.user);
              setCurrentUser(meData.user);
            }
          } else {
            // Token expired or invalid
            DakshyamDatabase.setAuthToken(null);
            DakshyamDatabase.setLoggedInUser(null);
            setCurrentUser(null);
          }
        } catch {
          // Keep offline state
        }
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
        const allowedTabs = ['home', 'services', 'social', 'portal', 'about', 'contact'];
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
          setSecretCode('');
          setShowAuthModal(true);
        } else if (accessMatch === 'trainer') {
          setIsStaffAccessEnabled(true);
          setAuthRoleTab('trainer');
          setStudentEmail('');
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

  const handleVerifyPinCode = async (e?: React.FormEvent, directPin?: string) => {
    if (e) e.preventDefault();
    const pin = (directPin || enteredPin).trim();
    if (!pin) {
      setPinError('Please enter the 6-digit Supervisor PIN code or Master Passcode.');
      return;
    }

    const cleanDigits = pin.replace(/\s+/g, '');
    const localSavedPin = (DakshyamDatabase.getSupervisorPin() || '').trim();
    const isMasterPasscode = cleanDigits === 'DakshyamAdmin#2026!Secure' || cleanDigits.toLowerCase() === 'dakshyamadmin#2026!secure';
    const isPinMatch = cleanDigits === '849201' || (localSavedPin && (cleanDigits === localSavedPin || pin === localSavedPin));

    // Fast-path client verification for configured PIN, default PIN, or master admin passcode
    if (isPinMatch || isMasterPasscode) {
      setIsStaffAccessEnabled(true);
      setAuthRoleTab('admin');
      setAuthMode('login');
      if (isMasterPasscode) {
        setSecretCode('DakshyamAdmin#2026!Secure');
      }
      setShowPinPrompt(false);
      setShowAuthModal(true);
      setPinError('');
      notifySuccess('Supervisor credentials verified. Administrative entry unlocked.');
      return;
    }

    try {
      const res = await fetch('/api/auth/verify-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: cleanDigits, clientPin: localSavedPin })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setIsStaffAccessEnabled(true);
        setAuthRoleTab('admin');
        setAuthMode('login');
        setShowPinPrompt(false);
        setShowAuthModal(true);
        setPinError('');
        notifySuccess('Supervisor credentials verified. Administrative entry unlocked.');
      } else {
        setPinError(data.error || 'Invalid 6-digit Supervisor PIN code. Access Denied.');
        notifyError(data.error || 'Invalid Supervisor PIN code.');
      }
    } catch {
      // Offline fallback: verify against client-saved PIN or factory default
      if (isPinMatch || isMasterPasscode) {
        setIsStaffAccessEnabled(true);
        setAuthRoleTab('admin');
        setAuthMode('login');
        if (isMasterPasscode) {
          setSecretCode('DakshyamAdmin#2026!Secure');
        }
        setShowPinPrompt(false);
        setShowAuthModal(true);
        setPinError('');
        notifySuccess('Supervisor credentials verified. Administrative entry unlocked.');
      } else {
        setPinError('Could not verify credentials. Please ensure correct PIN or Master Passcode is entered.');
        notifyError('Supervisor authentication challenge rejected.');
      }
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
      notifyError('Please fill out all required fields.');
      return;
    }

    if (phoneClean.length !== 10) {
      setAuthError('❌ WhatsApp Node must be exactly 10 digits.');
      notifyError('WhatsApp number must be 10 digits.');
      return;
    }

    if (!isEmailVerified) {
      setAuthError('❌ Email address must be verified using the verification code first.');
      notifyError('Please verify your email address first.');
      return;
    }

    // Input Safeguard validation
    const nameCheck = isInputSafe(nameClean, 'Full Name');
    if (!nameCheck.safe) { setAuthError(nameCheck.error); notifyError(nameCheck.error); return; }
    const emailCheck = isInputSafe(emailClean, 'Email');
    if (!emailCheck.safe) { setAuthError(emailCheck.error); notifyError(emailCheck.error); return; }
    const phoneCheck = isInputSafe(phoneClean, 'WhatsApp Node');
    if (!phoneCheck.safe) { setAuthError(phoneCheck.error); notifyError(phoneCheck.error); return; }
    const schoolCheck = isInputSafe(schoolClean, 'School');
    if (!schoolCheck.safe) { setAuthError(schoolCheck.error); notifyError(schoolCheck.error); return; }
    const pwdCheck = isInputSafe(passwordInput, 'Password');
    if (!pwdCheck.safe) { setAuthError(pwdCheck.error); notifyError(pwdCheck.error); return; }

    if (!isValidEmail(emailClean)) {
      setAuthError('❌ Invalid security format: Email structure is invalid.');
      notifyError('Invalid email structure.');
      return;
    }

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: nameClean,
          email: emailClean,
          password: passwordInput,
          role: 'student',
          profile: {
            phone: phoneClean,
            institution: schoolClean,
            gradeOrBranch: studentLevel
          }
        })
      });
      const data = await res.json();

      if (res.ok && data.success) {
        if (data.token) {
          DakshyamDatabase.setAuthToken(data.token);
        }
        DakshyamDatabase.setLoggedInUser(data.user);
        DakshyamDatabase.logEvent('Student Registered', `New student ${nameClean} (${emailClean}) registered and signed up successfully.`, emailClean, 'student', 'SUCCESS');
        notifySuccess(`Welcome to Dakshyam Innovations, ${nameClean}! Registration completed.`);
        
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
        setAuthError(data.error || 'Registration failed.');
        notifyError(data.error || 'Registration failed.');
        DakshyamDatabase.logEvent('Student Registration Failed', `Signup failed for ${emailClean}. Error: ${data.error}`, emailClean, 'student', 'ERROR');
      }
    } catch {
      setAuthError('Registry server timeout.');
      notifyError('Registration server timeout. Please try again.');
    }
  };

  // --- STUDENT NORMAL LOGIN HANDLER ---
  const handleStudentLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');

    const emailClean = studentEmail.trim();
    if (!emailClean) {
      setAuthError('Email verification required.');
      notifyError('Email is required.');
      return;
    }

    const emailCheck = isInputSafe(emailClean, 'Email');
    if (!emailCheck.safe) {
      setAuthError(emailCheck.error || 'Invalid Email formatting.');
      notifyError(emailCheck.error || 'Invalid Email formatting.');
      return;
    }
    const pwdCheck = isInputSafe(passwordInput, 'Password');
    if (!pwdCheck.safe) {
      setAuthError(pwdCheck.error || 'Invalid Password characters.');
      notifyError(pwdCheck.error || 'Invalid Password characters.');
      return;
    }

    if (!isValidEmail(emailClean)) {
      setAuthError('❌ Invalid security format: Email structure is invalid.');
      notifyError('Invalid email structure.');
      return;
    }

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailClean, password: passwordInput, role: 'student' })
      });
      const data = await res.json();

      if (res.ok && data.success) {
        DakshyamDatabase.setAuthToken(data.token);
        DakshyamDatabase.setLoggedInUser(data.user);
        DakshyamDatabase.logEvent('Student Logged In', `Student ${data.user.name} (${data.user.email}) authenticated successfully.`, data.user.email, 'student', 'SUCCESS');
        notifySuccess(`Welcome back, ${data.user.name}!`);
        setShowAuthModal(false);
        setShowApplyAuthPrompt(false);
        setStudentEmail('');
        setPasswordInput('');
        refreshDb();

        if (pendingApplyCourseId) {
          const targetCourse = courses.find(c => c.id === pendingApplyCourseId);
          setPreselectedCourseId(pendingApplyCourseId);
          setApplicationSuccessBanner(`Welcome back, ${data.user.name}! Your student credentials are verified. Complete your application for "${targetCourse?.title || 'Selected Course'}" below.`);
          navigateToTab('services');
          setPendingApplyCourseId(null);
          try { sessionStorage.removeItem('dakshyam_pending_course_apply'); } catch {}
        } else {
          navigateToTab('portal');
        }
      } else {
        setAuthError(data.error || 'Invalid email or password.');
        notifyError(data.error || 'Invalid email or password.');
      }
    } catch {
      setAuthError('Exception: secure database timeout.');
      notifyError('Login timeout. Please retry.');
    }
  };

  // --- TRAINER LOGIN HANDLER WITH APPROVAL SYSTEM ---
  const handleTrainerLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');

    const emailClean = studentEmail.trim();
    if (!emailClean) {
      setAuthError('Trainer email verification required.');
      notifyError('Trainer email is required.');
      return;
    }

    const emailCheck = isInputSafe(emailClean, 'Trainer Email');
    if (!emailCheck.safe) {
      setAuthError(emailCheck.error || 'Invalid Email characters.');
      notifyError(emailCheck.error || 'Invalid Email characters.');
      return;
    }
    const pwdCheck = isInputSafe(passwordInput, 'Password');
    if (!pwdCheck.safe) {
      setAuthError(pwdCheck.error || 'Invalid Password characters.');
      notifyError(pwdCheck.error || 'Invalid Password characters.');
      return;
    }

    if (!isValidEmail(emailClean)) {
      setAuthError('❌ Invalid security format: Trainer Email structure is invalid.');
      notifyError('Invalid trainer email format.');
      return;
    }

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailClean, password: passwordInput, role: 'trainer' })
      });
      const data = await res.json();

      if (res.ok && data.success) {
        DakshyamDatabase.setAuthToken(data.token);
        DakshyamDatabase.setLoggedInUser(data.user);
        DakshyamDatabase.logEvent('Trainer Logged In', `Supervisor/Trainer ${data.user.name} (${data.user.email}) authenticated successfully.`, data.user.email, 'trainer', 'SUCCESS');
        notifySuccess(`Welcome back, Trainer ${data.user.name}!`);
        setShowAuthModal(false);
        setStudentEmail('');
        setPasswordInput('');
        refreshDb();
        navigateToTab('portal');
      } else {
        setAuthError(data.error || 'Invalid trainer credentials or pending authorization.');
        notifyError(data.error || 'Trainer authentication failed.');
      }
    } catch {
      setAuthError('Trainer node access timeout.');
      notifyError('Trainer portal access timeout.');
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
      notifyError('Please fill out all required fields.');
      return;
    }

    const nameCheck = isInputSafe(nameClean, 'Trainer Name');
    if (!nameCheck.safe) { setAuthError(nameCheck.error); notifyError(nameCheck.error); return; }
    const emailCheck = isInputSafe(emailClean, 'Trainer Email');
    if (!emailCheck.safe) { setAuthError(emailCheck.error); notifyError(emailCheck.error); return; }
    const pwdCheck = isInputSafe(passwordInput, 'Password');
    if (!pwdCheck.safe) { setAuthError(pwdCheck.error); notifyError(pwdCheck.error); return; }

    if (!isValidEmail(emailClean)) {
      setAuthError('❌ Invalid security format: Email structure is invalid.');
      notifyError('Invalid email format.');
      return;
    }

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: nameClean,
          email: emailClean,
          password: passwordInput,
          role: 'trainer',
          trainerCode: trainerRegCode.trim()
        })
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setStudentName('');
        setStudentEmail('');
        setPasswordInput('');
        setTrainerRegCode('');
        refreshDb();
        if (data.isApproved) {
          setAuthError('✓ TRAINER ACCOUNT ACTIVATED INSTANTLY! You entered a valid Trainer Access Code. You can now login directly and access your workspace.');
          notifySuccess('Trainer account activated! You can now login.');
          DakshyamDatabase.logEvent('Trainer Self-Registered', `Trainer ${nameClean} (${emailClean}) auto-approved and activated using instant code.`, emailClean, 'trainer', 'SUCCESS');
        } else {
          setAuthError('✓ APPLICATION REQUISITION SUBMITTED! Your account is held as "Pending Approval". Once a Dakshyam Admin grants access, you can run courses.');
          notifyInfo('Application submitted for Administrator review.');
          DakshyamDatabase.logEvent('Trainer Registration Submitted', `Trainer ${nameClean} (${emailClean}) submitted application queue request (Approval Pending).`, emailClean, 'trainer', 'INFO');
        }
      } else {
        setAuthError(data.error || 'Trainer application failed.');
        notifyError(data.error || 'Trainer application failed.');
        DakshyamDatabase.logEvent('Trainer Registration Failed', `Trainer registration failed for ${emailClean}. Error: ${data.error || 'Duplicate record'}`, emailClean, 'trainer', 'ERROR');
      }
    } catch {
      setAuthError('Storage exception. Retry later.');
      notifyError('Registration error. Please retry later.');
    }
  };

  // --- ADMIN PASSCODE LOGIN HANDLER ---
  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');

    const cleanCode = secretCode.trim();
    if (!cleanCode) {
      setAuthError('Please enter administrator passcode.');
      notifyError('Please enter administrator passcode.');
      return;
    }

    const codeCheck = isInputSafe(cleanCode, 'Admin Passcode');
    if (!codeCheck.safe) {
      setAuthError(codeCheck.error || 'Malicious input detected.');
      notifyError('Invalid passcode formatting.');
      return;
    }

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passcode: cleanCode })
      });
      const data = await res.json();

      if (res.ok && data.success) {
        DakshyamDatabase.setAuthToken(data.token);
        DakshyamDatabase.setLoggedInUser(data.user);
        if (data.sessionId) DakshyamDatabase.setSessionId(data.sessionId);
        DakshyamDatabase.logEvent('Admin Logged In', `Platform administrator authenticated successfully and opened system tools.`, data.user.email, 'admin', 'SUCCESS');
        notifySuccess('Administrator console access authorized.');
        setShowAuthModal(false);
        setSecretCode('');
        refreshDb();
        navigateToTab('portal');
      } else {
        setAuthError(data.error || 'Authentication failed: Invalid administrator passcode.');
        notifyError(data.error || 'Invalid administrator passcode.');
      }
    } catch {
      setAuthError('Admin authentication request failed.');
      notifyError('Authentication request timeout.');
    }
  };

  const handleLogout = () => {
    DakshyamDatabase.setAuthToken(null);
    DakshyamDatabase.setLoggedInUser(null);
    DakshyamDatabase.setSessionId(null);
    refreshDb();
    notifyInfo('Session logged out successfully.');
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
          </nav>

          {/* Right Theme, Notifications & Auth Action button segment */}
          <div className="flex items-center gap-2">
            {/* Real-time Role-Aware Notification Center */}
            <NotificationBell 
              currentUser={currentUser} 
              theme={theme} 
              onNavigateTab={(tab) => navigateToTab(tab as any)} 
            />

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
                  {(currentUser.role === 'admin' || currentUser.role === 'trainer') && (
                    <button
                      onClick={() => {
                        try {
                          setAvailableWorkshops(WorkshopFeedbackStorage.getFeedbackConfig().workshops);
                        } catch {}
                        setIsWorkshopDirectoryModalOpen(true);
                      }}
                      className={`border text-2xs font-mono font-bold px-2.5 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                        isLight 
                          ? 'bg-amber-50 border-amber-300 text-amber-900 hover:bg-amber-100 shadow-2xs' 
                          : 'bg-cyan-500/15 border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/25 shadow-[0_0_10px_rgba(34,211,238,0.2)]'
                      }`}
                      title="Workshop Directory: Edit Fields & Full CRUD Console"
                    >
                      <Building2 className="w-3.5 h-3.5" />
                      <span>WORKSHOPS</span>
                    </button>
                  )}
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
                  className={`w-full text-left px-3.5 py-3 rounded-xl border transition-all flex items-center gap-3 cursor-pointer ${
                    activeTab === 'home' 
                      ? (isLight ? 'bg-blue-900 text-white font-extrabold shadow-sm' : 'bg-blue-600/25 border-blue-400/40 text-white font-bold') 
                      : (isLight ? 'border-transparent text-slate-700 hover:bg-slate-100' : 'border-transparent text-slate-300 hover:bg-white/5')
                  }`}
                >
                  <Home className={`w-4 h-4 shrink-0 ${activeTab === 'home' ? 'text-amber-400' : 'text-slate-400'}`} />
                  <span>WELCOME DEAR VISITOR</span>
                </button>
                <button
                  onClick={() => navigateToTab('services', null)}
                  className={`w-full text-left px-3.5 py-3 rounded-xl border transition-all flex items-center gap-3 cursor-pointer ${
                    activeTab === 'services' 
                      ? (isLight ? 'bg-blue-900 text-white font-extrabold shadow-sm' : 'bg-blue-600/25 border-blue-400/40 text-white font-bold') 
                      : (isLight ? 'border-transparent text-slate-700 hover:bg-slate-100' : 'border-transparent text-slate-300 hover:bg-white/5')
                  }`}
                >
                  <BookOpen className={`w-4 h-4 shrink-0 ${activeTab === 'services' ? 'text-amber-400' : 'text-slate-400'}`} />
                  <span>SERVICES & SYLLABUS</span>
                </button>
                <button
                  onClick={() => navigateToTab('social')}
                  className={`w-full text-left px-3.5 py-3 rounded-xl border transition-all flex items-center gap-3 cursor-pointer ${
                    activeTab === 'social' 
                      ? (isLight ? 'bg-blue-900 text-white font-extrabold shadow-sm' : 'bg-blue-600/25 border-blue-400/40 text-white font-bold') 
                      : (isLight ? 'border-transparent text-slate-700 hover:bg-slate-100' : 'border-transparent text-slate-300 hover:bg-white/5')
                  }`}
                >
                  <Video className={`w-4 h-4 shrink-0 ${activeTab === 'social' ? 'text-amber-400' : 'text-slate-400'}`} />
                  <span>EXHIBITION POSTINGS</span>
                </button>
                <button
                  onClick={() => navigateToTab('about')}
                  className={`w-full text-left px-3.5 py-3 rounded-xl border transition-all flex items-center gap-3 cursor-pointer ${
                    activeTab === 'about' 
                      ? (isLight ? 'bg-blue-900 text-white font-extrabold shadow-sm' : 'bg-blue-600/25 border-blue-400/40 text-white font-bold') 
                      : (isLight ? 'border-transparent text-slate-700 hover:bg-slate-100' : 'border-transparent text-slate-300 hover:bg-white/5')
                  }`}
                >
                  <Info className={`w-4 h-4 shrink-0 ${activeTab === 'about' ? 'text-amber-400' : 'text-slate-400'}`} />
                  <span>ABOUT US</span>
                </button>
                <button
                  onClick={() => navigateToTab('contact')}
                  className={`w-full text-left px-3.5 py-3 rounded-xl border transition-all flex items-center gap-3 cursor-pointer ${
                    activeTab === 'contact' 
                      ? (isLight ? 'bg-blue-900 text-white font-extrabold shadow-sm' : 'bg-blue-600/25 border-blue-400/40 text-white font-bold') 
                      : (isLight ? 'border-transparent text-slate-700 hover:bg-slate-100' : 'border-transparent text-slate-300 hover:bg-white/5')
                  }`}
                >
                  <Phone className={`w-4 h-4 shrink-0 ${activeTab === 'contact' ? 'text-amber-400' : 'text-slate-400'}`} />
                  <span>CONTACT US</span>
                </button>

                {/* Mobile Theme Shift Button */}
                <button
                  onClick={() => setTheme(isLight ? 'dark' : 'light')}
                  className={`w-full text-left px-3.5 py-2.5 rounded-xl border transition-all flex items-center justify-between font-mono cursor-pointer ${
                    isLight 
                      ? 'border-blue-900/15 bg-blue-50/70 text-blue-950' 
                      : 'border-white/10 bg-[#112240] text-slate-200'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    {isLight ? <Moon className="w-4 h-4 text-blue-950" /> : <Sun className="w-4 h-4 text-amber-400" />}
                    <span>THEME: {isLight ? 'LIGHT MODE' : 'DARK NAVY'}</span>
                  </span>
                  <span className="text-3xs uppercase text-slate-500 font-bold">[SWITCH]</span>
                </button>

                <div className="pt-2 border-t border-slate-500/10">
                  {currentUser ? (
                    <div className="space-y-1.5 pt-1">
                      {(currentUser.role === 'admin' || currentUser.role === 'trainer') && (
                        <button
                          onClick={() => {
                            try {
                              setAvailableWorkshops(WorkshopFeedbackStorage.getFeedbackConfig().workshops);
                            } catch {}
                            setIsWorkshopDirectoryModalOpen(true);
                            setMenuOpen(false);
                          }}
                          className={`w-full py-2.5 rounded-xl text-center border font-mono font-bold tracking-wider cursor-pointer flex items-center justify-center gap-2 ${
                            isLight 
                              ? 'bg-amber-50 border-amber-300 text-amber-900 shadow-2xs' 
                              : 'bg-cyan-500/15 border-cyan-500/30 text-cyan-300'
                          }`}
                        >
                          <Building2 className="w-4 h-4" />
                          <span>WORKSHOPS DIRECTORY (EDIT & CRUD)</span>
                        </button>
                      )}
                      <button
                        onClick={() => navigateToTab('portal')}
                        className={`w-full py-2.5 rounded-xl text-center border font-mono font-bold tracking-widest cursor-pointer ${
                          isLight 
                            ? 'bg-blue-900 border-blue-900 text-white' 
                            : 'bg-blue-600/20 border-blue-400/30 text-white'
                        }`}
                      >
                        MEMBERS AREA ({currentUser.role})
                      </button>
                      <button
                        onClick={() => { handleLogout(); setMenuOpen(false); }}
                        className="w-full py-2 bg-red-500/10 border border-red-500/30 text-red-500 rounded-xl font-mono text-center font-bold cursor-pointer"
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
                      className={`w-full py-3 rounded-xl font-mono text-center font-black tracking-widest cursor-pointer ${
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
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="smooth-gpu w-full"
          >
            {/* VIEW 1: LANDING PAGE */}
            {activeTab === 'home' && (
              <LandingPage 
                theme={theme}
                courses={courses} 
                banners={banners}
                galleryImages={galleryImages}
                currentUser={currentUser}
                currentUserRole={currentUser?.role}
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
                onOpenWorkshopDirectory={() => {
                  try {
                    setAvailableWorkshops(WorkshopFeedbackStorage.getFeedbackConfig().workshops);
                  } catch {}
                  setIsWorkshopDirectoryModalOpen(true);
                }}
                onNavigateToTab={navigateToTab}
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

            {/* VIEW 2: SOCIAL VIDEO EXHIBITION */}
            {activeTab === 'social' && (
              <SocialVideoWall videos={videos} onVideoUpdated={refreshDb} />
            )}

            {/* VIEW 3: ABOUT US COMPANY VIEW */}
            {activeTab === 'about' && aboutState && (
              <AboutCompany aboutState={aboutState} theme={theme} />
            )}

            {/* VIEW 4: CONTACT US PAGE VIEW */}
            {activeTab === 'contact' && (
              <ContactUs theme={theme} />
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
                        onNavigateTab={(tab) => navigateToTab(tab as any)}
                        theme={theme}
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
            {/* VIEW 9: PRIVACY POLICY PAGE */}
            {activeTab === 'privacy' && (
              <PrivacyPolicy 
                theme={theme}
                onNavigateTab={(tab) => navigateToTab(tab)}
              />
            )}

            {/* VIEW 10: TERMS AND CONDITIONS PAGE */}
            {activeTab === 'terms' && (
              <TermsAndConditions 
                theme={theme}
                onNavigateTab={(tab) => navigateToTab(tab)}
              />
            )}

            {/* VIEW 11: CUSTOM 404 NOT FOUND PAGE */}
            {activeTab === 'notfound' && (
              <NotFoundPage 
                theme={theme}
                onNavigateTab={(tab) => navigateToTab(tab)}
              />
            )}

          </motion.div>
        </AnimatePresence>
      </main>

      {/* FOOTER COOPERATING SIGNATURE */}
      <footer className={`relative z-20 w-full pt-10 pb-8 text-center text-3xs font-mono tracking-wider border-t no-print transition-colors duration-300 ${
        isLight 
          ? 'text-slate-600 border-blue-900/10 bg-gradient-to-b from-white/80 via-slate-50/90 to-blue-50/40 shadow-inner' 
          : 'text-slate-400 border-blue-900/30 bg-gradient-to-b from-[#071326]/80 via-[#0a192f]/95 to-[#050d1a] backdrop-blur-xl'
      }`}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-6">
          
          {/* Top Row: Brand Identity & Social Icons */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-6 border-b border-slate-500/10">
            <div className="text-center md:text-left space-y-1">
              <div className="flex items-center justify-center md:justify-start gap-2 text-xs font-black uppercase tracking-[0.25em]">
                <span className={`text-sm ${isLight ? 'text-blue-950 font-black' : 'text-white font-black'}`}>DAKSHYAM INNOVATIONS</span>
                <span className="text-slate-500">•</span>
                <span className={`text-2xs font-bold ${isLight ? 'text-amber-800' : 'text-amber-300'}`}>LEARN • BUILD • INNOVATE</span>
              </div>
              <p className="text-[10px] text-slate-500 max-w-md font-sans">
                Equipping regional educational classrooms and engineering labs with hands-on robotics, IoT telemetry, and modern coding environments.
              </p>
            </div>

            {/* Social Connectivity Links (Fully respectful of admin visibility toggles) */}
            {(() => {
              const igUrl = aboutState?.socialInstagram?.trim() || 'https://instagram.com/dakshyam_innovations';
              const liUrl = aboutState?.socialLinkedin?.trim() || 'https://linkedin.com/company/dakshyam-innovations';
              const ytUrl = aboutState?.socialYoutube?.trim() || 'https://youtube.com/@dakshyaminnovations';
              const twUrl = aboutState?.socialTwitter?.trim() || 'https://twitter.com/dakshyam_in';
              const ghUrl = aboutState?.socialGithub?.trim();

              const showIg = !aboutState?.hideInstagram && Boolean(igUrl);
              const showLi = !aboutState?.hideLinkedin && Boolean(liUrl);
              const showYt = !aboutState?.hideYoutube && Boolean(ytUrl);
              const showTw = !aboutState?.hideTwitter && Boolean(twUrl);
              const showGh = !aboutState?.hideGithub && Boolean(ghUrl);

              const hasAny = showIg || showLi || showYt || showTw || showGh;
              if (!hasAny) return null;

              return (
                <div className="flex flex-wrap items-center justify-center md:justify-end gap-2.5">
                  {showIg && (
                    <a
                      href={igUrl}
                      target="_blank"
                      rel="noreferrer"
                      className={`p-2.5 rounded-xl border flex items-center gap-2 text-[10px] font-mono font-bold transition-all shadow-xs group cursor-pointer ${
                        isLight 
                          ? 'border-pink-300/60 bg-gradient-to-r from-pink-500/10 via-purple-500/10 to-amber-500/10 text-pink-700 hover:border-pink-500/50 hover:shadow-pink-500/15' 
                          : 'border-pink-500/30 bg-gradient-to-r from-pink-950/40 via-purple-950/30 to-amber-950/20 text-pink-300 hover:border-pink-400 hover:shadow-[0_0_15px_rgba(244,63,94,0.25)]'
                      }`}
                      title="Follow Dakshyam Innovations on Instagram"
                    >
                      <Instagram className="w-4 h-4 text-pink-500 group-hover:scale-110 transition-transform" />
                      <span className="font-extrabold tracking-wider">Instagram</span>
                    </a>
                  )}

                  {showLi && (
                    <a
                      href={liUrl}
                      target="_blank"
                      rel="noreferrer"
                      className={`p-2.5 rounded-xl border flex items-center gap-1.5 text-[10px] font-mono transition-all cursor-pointer ${
                        isLight ? 'border-slate-200 bg-white hover:border-blue-500/40 text-blue-900' : 'border-blue-900/40 bg-black/40 hover:border-blue-400 text-sky-300'
                      }`}
                      title="LinkedIn"
                    >
                      <Linkedin className="w-4 h-4" />
                      <span className="hidden sm:inline">LinkedIn</span>
                    </a>
                  )}

                  {showYt && (
                    <a
                      href={ytUrl}
                      target="_blank"
                      rel="noreferrer"
                      className={`p-2.5 rounded-xl border flex items-center gap-1.5 text-[10px] font-mono transition-all cursor-pointer ${
                        isLight ? 'border-slate-200 bg-white hover:border-red-500/40 text-red-600' : 'border-red-900/30 bg-black/40 hover:border-red-400 text-red-400'
                      }`}
                      title="YouTube"
                    >
                      <Youtube className="w-4 h-4" />
                      <span className="hidden sm:inline">YouTube</span>
                    </a>
                  )}

                  {showTw && (
                    <a
                      href={twUrl}
                      target="_blank"
                      rel="noreferrer"
                      className={`p-2.5 rounded-xl border flex items-center gap-1.5 text-[10px] font-mono transition-all cursor-pointer ${
                        isLight ? 'border-slate-200 bg-white hover:border-slate-400 text-slate-800' : 'border-slate-800 bg-black/40 hover:border-slate-500 text-slate-300'
                      }`}
                      title="Twitter / X"
                    >
                      <Twitter className="w-4 h-4" />
                      <span className="hidden sm:inline">Twitter</span>
                    </a>
                  )}

                  {showGh && (
                    <a
                      href={ghUrl}
                      target="_blank"
                      rel="noreferrer"
                      className={`p-2.5 rounded-xl border flex items-center gap-1.5 text-[10px] font-mono transition-all cursor-pointer ${
                        isLight ? 'border-slate-200 bg-white hover:border-slate-400 text-slate-800' : 'border-slate-800 bg-black/40 hover:border-slate-500 text-slate-300'
                      }`}
                      title="GitHub"
                    >
                      <Github className="w-4 h-4" />
                      <span className="hidden sm:inline">GitHub</span>
                    </a>
                  )}
                </div>
              );
            })()}
          </div>

          {/* Quick Navigation Links */}
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[9px] font-mono uppercase font-bold">
            <button onClick={() => navigateToTab('home')} className="hover:text-sky-400 transition-colors cursor-pointer">
              Home
            </button>
            <button onClick={() => navigateToTab('services')} className="hover:text-sky-400 transition-colors cursor-pointer">
              Courses
            </button>
            <button onClick={() => navigateToTab('social')} className="hover:text-sky-400 transition-colors cursor-pointer">
              Exhibition Wall
            </button>
            <button onClick={() => navigateToTab('about')} className="hover:text-sky-400 transition-colors cursor-pointer">
              About Us
            </button>
            <button onClick={() => navigateToTab('contact')} className="hover:text-sky-400 transition-colors cursor-pointer">
              Contact
            </button>
            <button onClick={() => navigateToTab('privacy')} className="hover:text-sky-400 transition-colors cursor-pointer">
              Privacy Policy
            </button>
            <button onClick={() => navigateToTab('terms')} className="hover:text-sky-400 transition-colors cursor-pointer">
              Terms & Conditions
            </button>
            <button
              onClick={() => {
                try {
                  setAvailableWorkshops(WorkshopFeedbackStorage.getFeedbackConfig().workshops);
                } catch {}
                setIsWorkshopDirectoryModalOpen(true);
              }}
              className="text-purple-400 hover:text-purple-300 transition-colors cursor-pointer"
            >
              Workshops Directory
            </button>
            <button
              onClick={() => {
                DakshyamDatabase.setCookie('dakshyam_cookie_consent', '');
                setCookieConsent('');
              }}
              className="hover:text-cyan-400 transition-colors cursor-pointer lowercase"
            >
              [ cookie preferences ]
            </button>
          </div>

          {/* ADMIN-ONLY DYNAMIC TELEMETRY STRIP (Total Visitor Count & Device Tracking) */}
          {currentUser?.role === 'admin' && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-3.5 sm:p-4 rounded-2xl border flex flex-col sm:flex-row items-center justify-between gap-3 text-left font-mono text-xs shadow-md ${
                isLight 
                  ? 'bg-amber-50/70 border-amber-300 text-slate-800' 
                  : 'bg-[#0d1f38]/90 border-cyan-400/30 text-white shadow-[0_0_20px_rgba(34,211,238,0.12)]'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-xl ${isLight ? 'bg-amber-200 text-amber-900' : 'bg-cyan-500/20 text-cyan-300'}`}>
                  <Eye className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[9px] uppercase tracking-wider font-extrabold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      Admin Telemetry
                    </span>
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    <span className="text-[10px] text-slate-400">Live Counters</span>
                  </div>
                  <div className="text-xs sm:text-sm font-black flex items-center gap-2 mt-0.5">
                    <span className={isLight ? 'text-slate-900' : 'text-white'}>Total Site Visitors:</span>
                    <span className="text-amber-500 dark:text-cyan-400 font-mono tracking-tight text-sm sm:text-base">
                      {visitorCount.toLocaleString()} Hits
                    </span>
                  </div>
                </div>
              </div>

              {/* Devices Logged In Pill (Clickable -> Opens Admin Dashboard Devices) */}
              <button
                type="button"
                onClick={() => navigateToTab('portal')}
                className={`px-3.5 py-2 rounded-xl border flex items-center gap-2 text-xs font-bold transition-all cursor-pointer ${
                  isLight 
                    ? 'bg-white border-amber-300 text-slate-900 hover:bg-amber-100 shadow-xs' 
                    : 'bg-black/50 border-cyan-500/30 text-cyan-300 hover:bg-cyan-950/40 hover:border-cyan-400 shadow-xs'
                }`}
                title="View logged-in devices in Admin Dashboard"
              >
                <Smartphone className="w-3.5 h-3.5 text-cyan-400" />
                <span>Active Devices: {adminDeviceCount || 1} Logged In</span>
                <span className="text-[9px] uppercase font-mono text-slate-400 font-normal">→ Manage</span>
              </button>
            </motion.div>
          )}

          {/* Location & Copyright */}
          <div className="space-y-1.5 pt-2">
            <div className="text-[9px] tracking-normal text-slate-500 font-sans max-w-xl mx-auto">
              📍 Ward No. 4, Siddhivinayak Complex, First Floor, Balaghat Road, Waraseoni - 481331 (M.P.), India
            </div>

            <div 
              onClick={handleStaffAccessTrigger}
              className="cursor-pointer hover:text-blue-900 dark:hover:text-sky-400 transition-colors text-[8.5px] uppercase tracking-widest text-slate-400/80"
              title="Staff & Educator Access"
            >
              © {new Date().getFullYear()} Dakshyam Innovations • Learn • Build • Innovate • NEP 2020 Aligned
            </div>

            <div className="text-[8px] text-slate-500">
              Programming • Web & App Development • AI & Machine Learning • IoT & Robotics Lab Infrastructure
            </div>
          </div>

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
                To submit an official course application, receive physical hardware kits, and track your project modules, please sign in to your student account or register as a new candidate.
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
                  <span>Hands-on laboratory training and real project deployments</span>
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
                          placeholder="e.g. student@dakshyam.in"
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
                          placeholder="e.g. trainer@dakshyam.in"
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
                          Class / Level
                        </label>
                        <input
                          type="text"
                          required
                          value={studentLevel}
                          onChange={(e) => setStudentLevel(e.target.value)}
                          placeholder="Enter your class or grade (e.g. Class 10, 12th, B.Tech CSE)"
                          className={isLight 
                            ? "w-full bg-slate-50 border border-blue-900/15 text-slate-800 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-900 focus:bg-white" 
                            : "w-full bg-[#071326] border border-blue-900/30 text-white rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-sky-400"
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
                            : "w-full bg-[#071326] border border-blue-900/30 text-white rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-400"
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
                            : "w-full bg-[#071326] border border-blue-900/30 text-white rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-400"
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
                            : "w-full bg-[#071326] border border-blue-900/30 text-white rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-400"
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
                            : "w-full bg-[#071326] border border-blue-900/30 text-white rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-400"
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
                            : "w-full bg-[#071326] border border-blue-900/30 text-white rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-400"
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
                          placeholder="Enter invitation code for instant approval"
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
                      placeholder="e.g. user@dakshyam.in"
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
                <p className="text-4xs text-slate-400 font-mono">
                  Enter the 6-digit numeric access PIN to expose supervisory controls.
                </p>
              </div>

              {/* Pin Form */}
              <form onSubmit={handleVerifyPinCode} className="space-y-4">
                <div className="relative">
                  <input
                    type={showPinMask ? "password" : "text"}
                    maxLength={30}
                    required
                    autoFocus
                    value={enteredPin}
                    onChange={(e) => {
                      setEnteredPin(e.target.value.trim());
                    }}
                    placeholder="••••••"
                    className={`w-full ${showPinMask ? 'tracking-[1em]' : 'tracking-[0.2em]'} text-center font-black text-lg py-2.5 px-10 rounded-xl border focus:outline-none transition-all ${
                      isLight 
                        ? 'bg-slate-50 border-blue-900/20 text-slate-800 focus:border-blue-900 focus:bg-white' 
                        : 'bg-[#071326] border-blue-900/30 text-sky-300 focus:border-blue-400 focus:ring-1 focus:ring-blue-400/20'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPinMask(!showPinMask)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1 cursor-pointer"
                    title={showPinMask ? "Show PIN digits" : "Hide PIN digits"}
                  >
                    {showPinMask ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>
                </div>

                <p className="text-3xs text-slate-400 font-mono text-center">
                  Protected Supervisory Gate • Authorized Personnel Only
                </p>

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
                    isLight ? 'border-slate-300 text-slate-600 bg-slate-50' : 'border-slate-800 text-slate-400 bg-[#071326]'
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

      {/* GLOBAL APPLICATION TOAST FEEDBACK */}
      <AppToast theme={theme} />

      {/* ENTERPRISE SECURITY VIOLATION FEEDBACK TOAST */}
      <SecurityToast />

      {/* GLOBAL WORKSHOP DIRECTORY MODAL */}
      <WorkshopDirectoryModal
        isOpen={isWorkshopDirectoryModalOpen}
        onClose={() => setIsWorkshopDirectoryModalOpen(false)}
        workshops={availableWorkshops}
        theme={theme}
        currentUserRole={currentUser?.role}
        onSelectWorkshop={() => {}}
      />

      {/* FLOATING SMOOTH SCROLL TO TOP BUTTON */}
      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 16 }}
            transition={{ duration: 0.2 }}
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className={`fixed bottom-6 right-6 z-40 p-3 rounded-2xl border shadow-xl flex items-center justify-center transition-all cursor-pointer group active:scale-95 ${
              isLight 
                ? 'bg-white/95 border-blue-900/20 text-blue-950 hover:bg-blue-50 shadow-blue-950/15' 
                : 'bg-[#071326]/95 border-sky-400/40 text-sky-400 hover:bg-sky-950/50 shadow-black/70'
            }`}
            title="Scroll to top of page"
            aria-label="Scroll to top"
          >
            <ArrowUp className="w-5 h-5 group-hover:-translate-y-0.5 transition-transform" />
          </motion.button>
        )}
      </AnimatePresence>

    </div>
  );
}
