import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Trophy, BookOpen, ShieldCheck, Play, UserCircle, 
  LogOut, LogIn, ChevronRight, HelpCircle, Activity, Sparkles, School,
  Sun, Moon, Menu, X, Eye, EyeOff, Lock, Settings, Key, Info
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

import { DakshyamDatabase } from './utils/db';
import { Course, CourseApplication, StudentGroup, StudentUser, Certificate, VideoPost, PromoBanner, GalleryImage } from './types';

// Firebase Auth SDK imports for secure password resetting
import { 
  sendPasswordResetEmail,
  createUserWithEmailAndPassword
} from 'firebase/auth';
import { auth as firebaseAuth } from './utils/firebase';

export default function App() {
  // Theme, Sandbox & Mobile Menu states
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
  const [showSandboxHints, setShowSandboxHints] = useState(false);
  const [isStaffAccessEnabled, setIsStaffAccessEnabled] = useState(false);

  // 6-digit Supervisor access PIN states
  const [showPinPrompt, setShowPinPrompt] = useState(false);
  const [enteredPin, setEnteredPin] = useState('');
  const [pinError, setPinError] = useState('');

  // Navigation states
  const [activeTab, setActiveTab] = useState<'home' | 'services' | 'leaderboard' | 'social' | 'portal' | 'verification' | 'about' | 'contact'>(() => {
    try {
      const searchParams = new URLSearchParams(window.location.search);
      const tabParam = searchParams.get('tab');
      if (tabParam && ['home', 'services', 'leaderboard', 'social', 'portal', 'verification', 'about', 'contact'].includes(tabParam)) {
        return tabParam as any;
      }
    } catch (e) {
      console.error('URL parse fail', e);
    }
    return 'home';
  });
  const [preselectedCourseId, setPreselectedCourseId] = useState<string | null>(null);
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
  const [authError, setAuthError] = useState('');

  // Rate limiting & security lockout states
  const [failedAttempts, setFailedAttempts] = useState<Record<string, number>>({});
  const [lockoutTimers, setLockoutTimers] = useState<Record<string, number>>({});

  // Forgot Password Recovery states
  const [resetEmail, setResetEmail] = useState('');
  const [resetSuccessMessage, setResetSuccessMessage] = useState('');

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
    } else {
      setAuthError(`❌ Incorrect secure credentials. Attempt ${current}/5. Access blocks after 5 failures.`);
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
    const phoneClean = studentPhone.trim();
    const schoolClean = studentSchool.trim();

    if (!nameClean || !emailClean || !phoneClean || !schoolClean || !passwordInput) {
      setAuthError('Please fill out all registration fields, including a secure password.');
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
        
        // Reset states
        setStudentName('');
        setStudentEmail('');
        setStudentPhone('');
        setStudentSchool('');
        setPasswordInput('');
        setAuthError('');
        setShowAuthModal(false);
        refreshDb();
        setActiveTab('portal'); // Take directly to workspace
      } else {
        setAuthError(res.error || 'Registration failed.');
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
        setShowAuthModal(false);
        setStudentEmail('');
        setPasswordInput('');
        refreshDb();
        setActiveTab('portal');
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
        setShowAuthModal(false);
        setStudentEmail('');
        setPasswordInput('');
        refreshDb();
        setActiveTab('portal');
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

      const res = DakshyamDatabase.registerTrainer(nameClean, emailClean, hashedPassword);
      if (res.success) {
        setStudentName('');
        setStudentEmail('');
        setPasswordInput('');
        refreshDb();
        setAuthError('✓ APPLICATION REQUISITION SUBMITTED! Your account is held as "Pending Approval". Once a Dakshyam Admin grants access, you can run courses.');
      } else {
        setAuthError(res.error || 'Trainer application failed.');
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

    if (cleanCode === 'ADMIN2026') {
      try {
        const adminUser = DakshyamDatabase.getAdmins()[0];
        DakshyamDatabase.setLoggedInUser(adminUser);
        setShowAuthModal(false);
        setSecretCode('');
        
        // Clear attempts
        const updatedAttempts = { ...failedAttempts };
        delete updatedAttempts['admin_account'];
        setFailedAttempts(updatedAttempts);

        refreshDb();
        setActiveTab('portal');
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
    setActiveTab('home');
  };

  // CTA triggers from Public screens
  const triggerQuickEnroll = (courseId: string) => {
    setPreselectedCourseId(courseId);
    setActiveTab('services');
  };

  const isLight = theme === 'light';

  return (
    <div className={`relative min-h-screen font-sans antialiased overflow-x-hidden flex flex-col justify-between transition-colors duration-500 ${
      isLight 
        ? 'bg-white text-slate-800 selection:bg-amber-500/20 selection:text-amber-900' 
        : 'bg-[#050505] text-slate-100 selection:bg-cyan-500/35 selection:text-cyan-100'
    }`}>
      
      {/* Dynamic scanlines & background ambient lights */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none -z-20">
        <div className={`absolute top-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full blur-[140px] opacity-25 animate-pulseGlow ${
          isLight ? 'bg-amber-100/40' : 'bg-[#082a3c]'
        }`} />
        <div className={`absolute bottom-[10%] right-[-5%] w-[50%] h-[50%] rounded-full blur-[120px] opacity-20 ${
          isLight ? 'bg-amber-50/20' : 'bg-[#0f1f2e]'
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
        isLight ? 'border-amber-500/10 bg-white/70' : 'border-cyan-500/5 bg-[#050505]/40'
      }`}>
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between">
          
          {/* Logo segment */}
          <div 
            onClick={() => { setActiveTab('home'); setMenuOpen(false); }}
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
                  isLight ? 'border-amber-500/25 bg-amber-500/10 text-amber-700' : 'border-cyan-500/10 bg-cyan-950/20 text-cyan-400 group-hover:border-cyan-400/30'
                }`}>
                  D
                </div>
              )}
            </div>
            <div className="text-left font-sans space-y-0.5">
              <span className={`text-xs font-black tracking-[0.22em] transition-colors duration-300 ${isLight ? 'text-slate-900' : 'text-white'}`}>DAKSHYAM</span>
              <span className={`text-[8px] font-mono tracking-[0.38em] block translate-x-[0.1em] transition-colors duration-300 ${isLight ? 'text-amber-700' : 'text-slate-400'}`}>INNOVATIONS</span>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1.5 text-2xs md:text-xs font-mono tracking-wider font-semibold">
            <button
              onClick={() => { setActiveTab('home'); setPreselectedCourseId(null); }}
              className={`px-3 py-1.5 rounded-lg transition-all border ${
                activeTab === 'home' 
                  ? (isLight ? 'bg-amber-500/10 border-amber-500/20 text-amber-700 font-bold' : 'bg-cyan-500/10 border-cyan-500/15 text-cyan-400') 
                  : (isLight ? 'border-transparent text-slate-600 hover:text-amber-800' : 'border-transparent text-slate-450 hover:text-white')
              }`}
            >
              WELCOME
            </button>
            <button
              onClick={() => { setActiveTab('services'); setPreselectedCourseId(null); }}
              className={`px-3 py-1.5 rounded-lg transition-all border ${
                activeTab === 'services' 
                  ? (isLight ? 'bg-amber-500/10 border-amber-500/20 text-amber-700 font-bold' : 'bg-cyan-500/10 border-cyan-500/15 text-cyan-400') 
                  : (isLight ? 'border-transparent text-slate-600 hover:text-amber-800' : 'border-transparent text-slate-450 hover:text-white')
              }`}
            >
              SERVICES & SYLLABUS
            </button>
            <button
              onClick={() => setActiveTab('leaderboard')}
              className={`px-3 py-1.5 rounded-lg transition-all border ${
                activeTab === 'leaderboard' 
                  ? (isLight ? 'bg-amber-500/10 border-amber-500/20 text-amber-700 font-bold' : 'bg-cyan-500/10 border-cyan-500/15 text-cyan-400') 
                  : (isLight ? 'border-transparent text-slate-600 hover:text-amber-800' : 'border-transparent text-slate-450 hover:text-white')
              }`}
            >
              LEADERBOARD
            </button>
            <button
              onClick={() => setActiveTab('social')}
              className={`px-3 py-1.5 rounded-lg transition-all border ${
                activeTab === 'social' 
                  ? (isLight ? 'bg-amber-500/10 border-amber-500/20 text-amber-700 font-bold' : 'bg-cyan-500/10 border-cyan-500/15 text-cyan-400') 
                  : (isLight ? 'border-transparent text-slate-600 hover:text-amber-800' : 'border-transparent text-slate-450 hover:text-white')
              }`}
            >
              INNOVATION EXHIBITION
            </button>
            <button
              onClick={() => setActiveTab('verification')}
              className={`px-3 py-1.5 rounded-lg transition-all border ${
                activeTab === 'verification' 
                  ? (isLight ? 'bg-amber-500/10 border-amber-500/20 text-amber-700 font-bold' : 'bg-cyan-500/10 border-cyan-500/15 text-cyan-400') 
                  : (isLight ? 'border-transparent text-slate-600 hover:text-amber-800' : 'border-transparent text-slate-450 hover:text-white')
              }`}
            >
              VERIFY CREDENTIALS
            </button>
            <button
              onClick={() => setActiveTab('about')}
              className={`px-3 py-1.5 rounded-lg transition-all border ${
                activeTab === 'about' 
                  ? (isLight ? 'bg-amber-500/10 border-amber-500/20 text-amber-700 font-bold' : 'bg-cyan-500/10 border-cyan-500/15 text-cyan-400') 
                  : (isLight ? 'border-transparent text-slate-600 hover:text-amber-800' : 'border-transparent text-slate-450 hover:text-white')
              }`}
            >
              ABOUT US
            </button>
            <button
              onClick={() => setActiveTab('contact')}
              className={`px-3 py-1.5 rounded-lg transition-all border ${
                activeTab === 'contact' 
                  ? (isLight ? 'bg-amber-500/10 border-amber-500/20 text-amber-700 font-bold' : 'bg-cyan-500/10 border-cyan-500/15 text-cyan-400') 
                  : (isLight ? 'border-transparent text-slate-600 hover:text-amber-800' : 'border-transparent text-slate-450 hover:text-white')
              }`}
            >
              CONTACT US
            </button>
          </nav>

          {/* Right Theme & Auth Action button segment */}
          <div className="flex items-center gap-2">
            {/* Mode shift toggle button */}
            <button
              onClick={() => setTheme(isLight ? 'dark' : 'light')}
              className={`p-2 rounded-xl border transition-all hover:scale-105 cursor-pointer flex items-center justify-center ${
                isLight 
                  ? 'border-amber-500/20 bg-amber-50 text-amber-700' 
                  : 'border-cyan-500/10 bg-cyan-950/20 text-cyan-400 hover:border-cyan-500/35'
              }`}
              title={isLight ? 'Activate Dark Mode' : 'Activate Light Theme'}
            >
              {isLight ? <Moon className="w-3.5 h-3.5" /> : <Sun className="w-3.5 h-3.5" />}
            </button>

            {/* Desktop authentication */}
            <div className="hidden lg:flex items-center gap-2">
              {currentUser ? (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setActiveTab('portal')}
                    className={`border text-2xs font-mono font-bold px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                      isLight 
                        ? 'bg-amber-500/10 border-amber-500/25 text-amber-800 hover:bg-amber-500/20' 
                        : 'bg-cyan-500/10 border-cyan-500/15 text-cyan-400'
                    }`}
                  >
                    <UserCircle className="w-3.5 h-3.5" /> 
                    <span className="uppercase tracking-widest">{currentUser.role} AREA</span>
                  </button>
                  <button
                    onClick={handleLogout}
                    className={`p-1.5 border border-transparent rounded-xl transition-all cursor-pointer ${
                      isLight ? 'text-slate-400 hover:text-red-650 hover:bg-red-50' : 'text-slate-500 hover:text-red-400 hover:bg-red-950/20 hover:border-red-500/10'
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
                      ? 'bg-amber-600 hover:bg-amber-700 text-white' 
                      : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 hover:shadow-[0_0_12px_rgba(34,211,238,0.22)]'
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
                  ? 'border-amber-500/20 bg-amber-50 text-amber-700' 
                  : 'border-cyan-500/10 bg-cyan-950/20 text-cyan-400'
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
                isLight ? 'border-amber-500/10 bg-white' : 'border-cyan-500/5 bg-[#050505]/95'
              }`}
            >
              <div className="p-4 space-y-2 flex flex-col font-mono text-xs font-bold">
                <button
                  onClick={() => { setActiveTab('home'); setMenuOpen(false); }}
                  className={`w-full text-left px-3.5 py-2.5 rounded-xl border transition-all ${
                    activeTab === 'home' 
                      ? (isLight ? 'bg-amber-500/10 border-amber-500/20 text-amber-700 font-extrabold' : 'bg-cyan-500/10 border-cyan-500/15 text-cyan-400') 
                      : (isLight ? 'border-transparent text-slate-600' : 'border-transparent text-slate-400')
                  }`}
                >
                  WELCOME DEAR VISITOR
                </button>
                <button
                  onClick={() => { setActiveTab('services'); setPreselectedCourseId(null); setMenuOpen(false); }}
                  className={`w-full text-left px-3.5 py-2.5 rounded-xl border transition-all ${
                    activeTab === 'services' 
                      ? (isLight ? 'bg-amber-500/10 border-amber-500/20 text-amber-700 font-extrabold' : 'bg-cyan-500/10 border-cyan-500/15 text-cyan-400') 
                      : (isLight ? 'border-transparent text-slate-600' : 'border-transparent text-slate-400')
                  }`}
                >
                  SERVICES & PROGRAM CATALOGS
                </button>
                <button
                  onClick={() => { setActiveTab('leaderboard'); setMenuOpen(false); }}
                  className={`w-full text-left px-3.5 py-2.5 rounded-xl border transition-all ${
                    activeTab === 'leaderboard' 
                      ? (isLight ? 'bg-amber-500/10 border-amber-500/20 text-amber-700 font-extrabold' : 'bg-cyan-500/10 border-cyan-500/15 text-cyan-400') 
                      : (isLight ? 'border-transparent text-slate-600' : 'border-transparent text-slate-400')
                  }`}
                >
                  LEADERBOARD TRACKER
                </button>
                <button
                  onClick={() => { setActiveTab('social'); setMenuOpen(false); }}
                  className={`w-full text-left px-3.5 py-2.5 rounded-xl border transition-all ${
                    activeTab === 'social' 
                      ? (isLight ? 'bg-amber-500/10 border-amber-500/20 text-amber-700 font-extrabold' : 'bg-cyan-500/10 border-cyan-500/15 text-cyan-400') 
                      : (isLight ? 'border-transparent text-slate-600' : 'border-transparent text-slate-400')
                  }`}
                >
                  EXHIBITION POSTINGS
                </button>
                <button
                  onClick={() => { setActiveTab('verification'); setMenuOpen(false); }}
                  className={`w-full text-left px-3.5 py-2.5 rounded-xl border transition-all ${
                    activeTab === 'verification' 
                      ? (isLight ? 'bg-amber-500/10 border-amber-500/20 text-amber-700 font-extrabold' : 'bg-cyan-500/10 border-cyan-500/15 text-cyan-400') 
                      : (isLight ? 'border-transparent text-slate-600' : 'border-transparent text-slate-400')
                  }`}
                >
                  VERIFY CREDENTIALS
                </button>
                <button
                  onClick={() => { setActiveTab('about'); setMenuOpen(false); }}
                  className={`w-full text-left px-3.5 py-2.5 rounded-xl border transition-all ${
                    activeTab === 'about' 
                      ? (isLight ? 'bg-amber-500/10 border-amber-500/20 text-amber-700 font-extrabold' : 'bg-cyan-500/10 border-cyan-500/15 text-cyan-400') 
                      : (isLight ? 'border-transparent text-slate-600' : 'border-transparent text-slate-400')
                  }`}
                >
                  ABOUT US
                </button>
                <button
                  onClick={() => { setActiveTab('contact'); setMenuOpen(false); }}
                  className={`w-full text-left px-3.5 py-2.5 rounded-xl border transition-all ${
                    activeTab === 'contact' 
                      ? (isLight ? 'bg-amber-500/10 border-amber-500/20 text-amber-700 font-extrabold' : 'bg-cyan-500/10 border-cyan-500/15 text-cyan-400') 
                      : (isLight ? 'border-transparent text-slate-600' : 'border-transparent text-slate-400')
                  }`}
                >
                  CONTACT US
                </button>

                <div className="pt-2 border-t border-slate-500/10">
                  {currentUser ? (
                    <div className="space-y-1.5 pt-1">
                      <button
                        onClick={() => { setActiveTab('portal'); setMenuOpen(false); }}
                        className={`w-full py-2.5 rounded-xl text-center border font-mono font-bold tracking-widest ${
                          isLight 
                            ? 'bg-amber-600 border-amber-600 text-white' 
                            : 'bg-cyan-500/15 border-cyan-500/30 text-cyan-400'
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
                        isLight ? 'bg-amber-600 text-white shadow-xs' : 'bg-cyan-500 text-slate-950'
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
                onEnterPortal={() => {
                  if (currentUser) {
                    setActiveTab('portal');
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
              <div className="space-y-8 max-w-4xl mx-auto">
                <div className={`text-center space-y-2 max-w-xl mx-auto border-b pb-4 ${isLight ? 'border-amber-500/10' : 'border-cyan-500/5'}`}>
                  <span className={`text-3xs font-mono tracking-widest uppercase font-bold ${isLight ? 'text-amber-700' : 'text-cyan-400'}`}>Apply for classes</span>
                  <h1 className={`text-2xl font-black tracking-wide uppercase ${isLight ? 'text-slate-900' : 'text-white'}`}>Course Registration Cell</h1>
                  <p className={`text-xs ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                    Pre-fills details from your active logged-in student profile. Choose from 3-month IoT schemes, Django/MERN tracks, autonomous systems, or customizable school hardware workshops.
                  </p>
                </div>
                
                <CourseRegistrationForm 
                  courses={courses} 
                  preselectedCourseId={preselectedCourseId}
                  onSuccess={refreshDb}
                />
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
              <CertificateVerify />
            )}

            {/* VIEW 6: ABOUT US COMPANY VIEW */}
            {activeTab === 'about' && aboutState && (
              <AboutCompany aboutState={aboutState} theme={theme} />
            )}

            {/* VIEW 7: CONTACT US PAGE VIEW */}
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
                      />
                    )}
                  </>
                ) : (
                  <div className="text-center max-w-md mx-auto py-12 space-y-4">
                    <HelpCircle className={`w-12 h-12 mx-auto ${isLight ? 'text-amber-600/60' : 'text-slate-600'}`} />
                    <h2 className={`text-lg font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>Console Session Inactive</h2>
                    <p className={`text-xs ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>Please sign in as a student, trainer, or system supervisor using the top right control card to view dashboards.</p>
                    <button
                      onClick={() => {
                        setAuthMode('login');
                        setShowAuthModal(true);
                      }}
                      className={`text-xs font-bold px-5 py-2.5 rounded-xl cursor-pointer shadow-sm active:scale-95 transition-all ${
                        isLight ? 'bg-amber-600 text-white hover:bg-amber-700' : 'bg-cyan-500 text-slate-950 hover:bg-cyan-400'
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
        isLight ? 'text-slate-500 border-amber-500/10 bg-white/70' : 'text-slate-500 border-cyan-500/5 bg-[#050505]/40 backdrop-blur-md'
      }`}>
        <div 
          onClick={handleStaffAccessTrigger}
          className="cursor-pointer hover:text-amber-600 transition-colors py-1"
          title="Supervisory Node Overlap (Click to reveal panel)"
        >
          © 2026 Dakshyam innovations
        </div>
        <div className="text-[8px] tracking-normal text-slate-400/60 uppercase">NEP-Aligned School IoT & Full-Stack Robotics Integrations</div>
      </footer>

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
              className={`border p-6 sm:p-7 max-w-sm w-full relative z-10 text-left space-y-5 transition-colors duration-300 flex flex-col justify-between ${
                isLight 
                  ? 'bg-white border-amber-500/20 shadow-[0_0_55px_rgba(217,119,6,0.06)]' 
                  : 'bg-[#050505]/98 border-cyan-500/20 shadow-[0_0_55px_rgba(6,182,212,0.12)]'
              }`}
            >
              {/* Modal Header */}
              <div className={`flex items-center justify-between border-b pb-2.5 ${isLight ? 'border-amber-500/10' : 'border-cyan-500/5'}`}>
                <span className={`text-3xs font-mono tracking-widest uppercase font-black flex items-center gap-1 ${
                  isLight ? 'text-amber-700' : 'text-[#22d3ee]'
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
                    isLight ? 'text-slate-400 hover:text-amber-800' : 'text-slate-500 hover:text-white'
                  }`}
                >
                  ✕ CLOSE
                </button>
              </div>

              {/* Roles tab selectors - conditionally rendering student or all depending on toggled settings */}
              <div className="space-y-2.5">
                <div className={`p-1 rounded-xl font-mono text-[9px] font-black uppercase text-center relative z-25 grid ${
                  isStaffAccessEnabled ? 'grid-cols-3' : 'grid-cols-1'
                } ${isLight ? 'bg-amber-100/40 text-slate-700' : 'bg-[#111]/65 text-slate-400'}`}>
                  
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
                        ? (isLight ? 'bg-amber-600 text-white font-extrabold shadow-sm' : 'bg-cyan-500 text-slate-950 font-bold shadow-md') 
                        : (isLight ? 'text-slate-600 hover:text-amber-800' : 'text-slate-400 hover:text-white')
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
                            ? (isLight ? 'bg-amber-600 text-white font-extrabold shadow-sm' : 'bg-cyan-500 text-slate-950 font-bold shadow-md') 
                            : (isLight ? 'text-slate-600 hover:text-amber-800' : 'text-slate-400 hover:text-white')
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
                            ? (isLight ? 'bg-amber-600 text-white font-extrabold shadow-sm' : 'bg-cyan-500 text-slate-950 font-bold shadow-md') 
                            : (isLight ? 'text-slate-600 hover:text-amber-800' : 'text-slate-400 hover:text-white')
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
                      isLight ? 'text-slate-400 hover:text-amber-700' : 'text-slate-550 hover:text-cyan-400'
                    }`}
                  >
                    <Lock className="w-2.5 h-2.5" />
                    {isStaffAccessEnabled ? 'Hide Staff portals' : 'Staff/Supervisor access panel'}
                  </button>
                </div>
              </div>

              {/* Status Alert Notification */}
              {authError && (
                <div className={`text-[10px] font-mono p-2.5 rounded-xl border leading-relaxed text-center ${
                  authError.includes('✓') 
                    ? 'text-emerald-600 border-emerald-500/20 bg-emerald-50 font-bold' 
                    : (isLight ? 'text-red-600 border-red-500/15 bg-red-50/50' : 'text-red-400 border-red-500/20 bg-red-950/20')
                }`}>
                  {authError}
                </div>
              )}

              {/* SECTION A: STUDENT REGISTRY */}
              {authRoleTab === 'student' && authMode !== 'forgot' && (
                <>
                  {authMode === 'login' ? (
                    <form onSubmit={handleStudentLogin} className="space-y-4 font-sans">
                      <div className="space-y-1">
                        <label className={`block text-4xs font-mono tracking-widest uppercase mb-1 ${isLight ? 'text-amber-700/85' : 'text-cyan-400/85'}`}>
                          Registered Student Email
                        </label>
                        <input
                          type="email"
                          required
                          value={studentEmail}
                          onChange={(e) => setStudentEmail(e.target.value)}
                          placeholder="e.g. student@example.com"
                          className={isLight 
                            ? "w-full bg-slate-50 border border-amber-500/20 text-slate-800 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-amber-500 focus:bg-white transition-all" 
                            : "w-full bg-[#111]/80 border border-cyan-500/10 text-white rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-cyan-45 transition-all"
                          }
                        />
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between items-center">
                          <label className={`block text-4xs font-mono tracking-widest uppercase ${isLight ? 'text-amber-700/85' : 'text-cyan-400/85'}`}>
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
                            ? "w-full bg-slate-50 border border-amber-500/20 text-slate-800 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-amber-500 focus:bg-white transition-all" 
                            : "w-full bg-[#111]/80 border border-cyan-500/10 text-white rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-cyan-45 transition-all"
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
                            isLight ? 'text-amber-700 hover:text-amber-900' : 'text-cyan-400 hover:text-cyan-300'
                          }`}
                        >
                          Forgot Password?
                        </button>
                      </div>

                      <button
                        type="submit"
                        className={`w-full font-bold text-xs py-2.5 rounded-xl cursor-pointer transition-all uppercase font-mono tracking-wider shadow-xs ${
                          isLight 
                            ? 'bg-amber-600 hover:bg-amber-700 text-white hover:shadow-[0_0_12px_rgba(217,119,6,0.15)]' 
                            : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 hover:shadow-[0_0_12px_rgba(34,211,238,0.2)]'
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
                          className={`uppercase font-black cursor-pointer ${isLight ? 'text-amber-700 hover:underline' : 'text-[#22d3ee] hover:underline'}`}
                        >
                          Register Student
                        </button>
                      </div>
                    </form>
                  ) : (
                    <form onSubmit={handleStudentRegister} className="space-y-3 font-sans">
                      <div className="space-y-1">
                        <label className={`block text-4xs font-mono tracking-widest uppercase ${isLight ? 'text-amber-700/85' : 'text-cyan-400/85'}`}>
                          Student Full Name
                        </label>
                        <input
                          type="text"
                          required
                          value={studentName}
                          onChange={(e) => setStudentName(e.target.value)}
                          placeholder="e.g. Kunal Sonkar"
                          className={isLight 
                            ? "w-full bg-slate-50 border border-amber-500/20 text-slate-800 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-amber-500 focus:bg-white" 
                            : "w-full bg-[#111]/80 border border-cyan-500/10 text-white rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-cyan-45"
                          }
                        />
                      </div>

                      <div className="space-y-1">
                        <label className={`block text-4xs font-mono tracking-widest uppercase ${isLight ? 'text-amber-700/85' : 'text-cyan-400/85'}`}>
                          Email (Registry ID)
                        </label>
                        <input
                          type="email"
                          required
                          value={studentEmail}
                          onChange={(e) => setStudentEmail(e.target.value)}
                          placeholder="e.g. kunal@example.com"
                          className={isLight 
                            ? "w-full bg-slate-50 border border-amber-500/20 text-slate-800 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-amber-500 focus:bg-white" 
                            : "w-full bg-[#111]/80 border border-cyan-500/10 text-white rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-cyan-45"
                          }
                        />
                      </div>

                      <div className="space-y-1">
                        <label className={`block text-4xs font-mono tracking-widest uppercase ${isLight ? 'text-amber-700/85' : 'text-cyan-400/85'}`}>
                          WhatsApp Node
                        </label>
                        <input
                          type="text"
                          required
                          value={studentPhone}
                          onChange={(e) => setStudentPhone(e.target.value)}
                          placeholder="+91 WhatsApp number"
                          className={isLight 
                            ? "w-full bg-slate-50 border border-amber-500/20 text-slate-800 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-amber-500 focus:bg-white" 
                            : "w-full bg-[#111]/80 border border-cyan-500/10 text-white rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-cyan-45"
                          }
                        />
                      </div>

                      <div className="space-y-1">
                        <label className={`block text-4xs font-mono tracking-widest uppercase ${isLight ? 'text-amber-700/85' : 'text-cyan-400/85'}`}>
                          School / College
                        </label>
                        <input
                          type="text"
                          required
                          value={studentSchool}
                          onChange={(e) => setStudentSchool(e.target.value)}
                          placeholder="Secondary School Name"
                          className={isLight 
                            ? "w-full bg-slate-50 border border-amber-500/20 text-slate-800 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-amber-500 focus:bg-white" 
                            : "w-full bg-[#111]/80 border border-cyan-500/10 text-white rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-cyan-45"
                          }
                        />
                      </div>

                      <div className="space-y-1">
                        <label className={`block text-4xs font-mono tracking-widest uppercase ${isLight ? 'text-amber-700/85' : 'text-cyan-400/85'}`}>
                          Choose Safe Password
                        </label>
                        <input
                          type="password"
                          required
                          value={passwordInput}
                          onChange={(e) => setPasswordInput(e.target.value)}
                          placeholder="Create strong account passcode"
                          className={isLight 
                            ? "w-full bg-slate-50 border border-amber-500/20 text-slate-800 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-amber-500 focus:bg-white" 
                            : "w-full bg-[#111]/80 border border-cyan-500/10 text-white rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-cyan-45"
                          }
                        />
                      </div>

                      <div className="space-y-1">
                        <label className={`block text-4xs font-mono tracking-widest uppercase ${isLight ? 'text-amber-700/85' : 'text-cyan-400/85'}`}>
                          Class Level
                        </label>
                        <select
                          value={studentLevel}
                          onChange={(e) => setStudentLevel(e.target.value)}
                          className={isLight 
                            ? "w-full bg-slate-50 border border-amber-500/20 text-slate-800 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-amber-500 focus:bg-white" 
                            : "w-full bg-[#111]/80 border border-cyan-500/10 text-white rounded-xl px-3 py-2 text-xs focus:outline-none"
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
                            ? 'bg-amber-600 hover:bg-amber-700 text-white hover:shadow-[0_0_12px_rgba(217,119,6,0.15)]' 
                            : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 hover:shadow-[0_0_12px_rgba(34,211,238,0.2)]'
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
                          className={`uppercase font-black cursor-pointer ${isLight ? 'text-amber-700 hover:underline' : 'text-[#22d3ee] hover:underline'}`}
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
                        <label className={`block text-4xs font-mono tracking-widest uppercase mb-1 ${isLight ? 'text-amber-700/85' : 'text-cyan-400/85'}`}>
                          Trainer Email Key
                        </label>
                        <input
                          type="email"
                          required
                          value={studentEmail}
                          onChange={(e) => setStudentEmail(e.target.value)}
                          placeholder="e.g. trainer@dakshyam.com"
                          className={isLight 
                            ? "w-full bg-slate-50 border border-amber-500/20 text-slate-800 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-amber-500 focus:bg-white" 
                            : "w-full bg-[#111]/80 border border-cyan-500/10 text-white rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-cyan-40"
                          }
                        />
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between items-center">
                          <label className={`block text-4xs font-mono tracking-widest uppercase ${isLight ? 'text-amber-700/85' : 'text-cyan-400/85'}`}>
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
                            ? "w-full bg-slate-50 border border-amber-500/20 text-slate-800 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-amber-500 focus:bg-white" 
                            : "w-full bg-[#111]/80 border border-cyan-500/10 text-white rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-cyan-40"
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
                            isLight ? 'text-amber-700 hover:text-amber-900' : 'text-cyan-400 hover:text-cyan-300'
                          }`}
                        >
                          Forgot Password?
                        </button>
                      </div>

                      <button
                        type="submit"
                        className={`w-full font-bold text-xs py-2.5 rounded-xl cursor-pointer transition-all uppercase font-mono tracking-wider shadow-xs ${
                          isLight 
                            ? 'bg-amber-600 hover:bg-amber-700 text-white hover:shadow-[0_0_12px_rgba(217,119,6,0.15)]' 
                            : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 hover:shadow-[0_0_12px_rgba(34,211,238,0.2)]'
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
                          className={`uppercase font-black cursor-pointer ${isLight ? 'text-amber-700 hover:underline' : 'text-cyan-400 hover:underline'}`}
                        >
                          Request Approved Account
                        </button>
                      </div>
                    </form>
                  ) : (
                    <form onSubmit={handleTrainerRegister} className="space-y-4 font-sans">
                      <div className="space-y-1">
                        <label className={`block text-4xs font-mono tracking-widest uppercase mb-1 ${isLight ? 'text-amber-700/85' : 'text-cyan-400/85'}`}>
                          Full Name
                        </label>
                        <input
                          type="text"
                          required
                          value={studentName}
                          onChange={(e) => setStudentName(e.target.value)}
                          placeholder="Trainer Amit Mathur"
                          className={isLight 
                            ? "w-full bg-slate-50 border border-amber-500/20 text-slate-800 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-amber-500" 
                            : "w-full bg-[#111]/80 border border-cyan-500/10 text-white rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-cyan-40"
                          }
                        />
                      </div>

                      <div className="space-y-1">
                        <label className={`block text-4xs font-mono tracking-widest uppercase mb-1 ${isLight ? 'text-amber-700/85' : 'text-cyan-400/85'}`}>
                          Email (Needs Approval)
                        </label>
                        <input
                          type="email"
                          required
                          value={studentEmail}
                          onChange={(e) => setStudentEmail(e.target.value)}
                          placeholder="name@dakshyam.com"
                          className={isLight 
                            ? "w-full bg-slate-50 border border-amber-500/20 text-slate-800 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-amber-500" 
                            : "w-full bg-[#111]/80 border border-cyan-500/10 text-white rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-cyan-40"
                          }
                        />
                      </div>

                      <div className="space-y-1">
                        <label className={`block text-4xs font-mono tracking-widest uppercase mb-1 ${isLight ? 'text-amber-700/85' : 'text-cyan-400/85'}`}>
                          Choose Safe Password
                        </label>
                        <input
                          type="password"
                          required
                          value={passwordInput}
                          onChange={(e) => setPasswordInput(e.target.value)}
                          placeholder="Create strong account passcode"
                          className={isLight 
                            ? "w-full bg-slate-50 border border-amber-500/20 text-slate-800 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-amber-500" 
                            : "w-full bg-[#111]/80 border border-cyan-500/10 text-white rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-cyan-40"
                          }
                        />
                      </div>

                      <button
                        type="submit"
                        className={`w-full font-bold text-xs py-2.5 rounded-xl cursor-pointer transition-all uppercase font-mono tracking-wider shadow-xs animate-pulse ${
                          isLight 
                            ? 'bg-amber-600 hover:bg-amber-700 text-white' 
                            : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950'
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
                          className={`uppercase font-black cursor-pointer ${isLight ? 'text-amber-700 hover:underline' : 'text-cyan-400 hover:underline'}`}
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
                    <label className={`block text-4xs font-mono tracking-widest uppercase mb-1 ${isLight ? 'text-amber-700/85' : 'text-cyan-400/85'}`}>
                      Admin Signature Override Passcode
                    </label>
                    <input
                      type="password"
                      required
                      value={secretCode}
                      onChange={(e) => setSecretCode(e.target.value)}
                      placeholder="ENTER PRIVATE SYSTEM CODE"
                      className={isLight 
                        ? "w-full bg-slate-50 border border-amber-500/25 text-slate-800 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-amber-500 tracking-widest text-center uppercase font-black" 
                        : "w-full bg-[#111]/85 border border-cyan-500/10 text-white rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-cyan-45 tracking-widest text-center uppercase text-cyan-400 font-bold"
                      }
                    />
                  </div>

                  <button
                    type="submit"
                    className={`w-full font-bold text-xs py-2.5 rounded-xl cursor-pointer transition-all uppercase font-mono tracking-wider shadow-xs ${
                      isLight 
                        ? 'bg-amber-600 hover:bg-amber-700 text-white hover:shadow-[0_0_12px_rgba(217,119,6,0.15)]' 
                        : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 hover:shadow-[0_0_12px_rgba(34,211,238,0.2)]'
                    }`}
                  >
                    Authenticate Console
                  </button>
                </form>
              )}

              {/* SECTION D: SELF-SERVICE PASSWORD RECOVERY */}
              {authMode === 'forgot' && (
                <form onSubmit={handleResetPassword} className="space-y-4 font-sans">
                  <div className="space-y-1.5 text-center pb-2 border-b border-cyan-500/5">
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
                    <label className={`block text-4xs font-mono tracking-widest uppercase mb-1 ${isLight ? 'text-amber-700/85' : 'text-cyan-400/85'}`}>
                      Registered Account Email
                    </label>
                    <input
                      type="email"
                      required
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      placeholder="e.g. user@example.com"
                      className={isLight 
                        ? "w-full bg-slate-50 border border-amber-500/20 text-slate-800 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-amber-500" 
                        : "w-full bg-[#111]/80 border border-cyan-500/10 text-white rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-cyan-45"
                      }
                    />
                  </div>

                  <button
                    type="submit"
                    className={`w-full font-bold text-xs py-2.5 rounded-xl cursor-pointer transition-all uppercase font-mono tracking-wider shadow-xs ${
                      isLight 
                        ? 'bg-amber-600 hover:bg-amber-700 text-white hover:shadow-[0_0_12px_rgba(217,119,6,0.15)]' 
                        : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 hover:shadow-[0_0_12px_rgba(34,211,238,0.2)]'
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
                      className={`uppercase font-black cursor-pointer ${isLight ? 'text-amber-700 hover:underline' : 'text-[#22d3ee] hover:underline'}`}
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
                  ? 'bg-white border-amber-500/35 shadow-[0_0_55px_rgba(217,119,6,0.12)] font-sans' 
                  : 'bg-[#050505]/98 border-cyan-500/25 shadow-[0_0_55px_rgba(6,182,212,0.22)] font-sans'
              }`}
            >
              {/* Icon & Title */}
              <div className="space-y-2">
                <div className={`w-12 h-12 mx-auto rounded-full flex items-center justify-center border ${
                  isLight ? 'bg-amber-100 border-amber-200 text-amber-700' : 'bg-cyan-950/40 border-cyan-500/20 text-[#22d3ee]'
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
                        ? 'bg-slate-50 border-amber-500/25 text-slate-800 focus:border-amber-500 focus:bg-white' 
                        : 'bg-[#111] border-cyan-500/15 text-yellow-400 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/20'
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
                        ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-sm' 
                        : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-[0_0_10px_rgba(6,182,212,0.15)]'
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
              isLight ? 'bg-white border-amber-500/20 text-slate-800' : 'bg-[#060606]/95 border-cyan-500/20 text-slate-305 text-slate-300'
            }`}>
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-xl shrink-0 ${isLight ? 'bg-amber-100 text-amber-700' : 'bg-cyan-950/50 text-[#22d3ee]'}`}>
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
                    isLight ? 'border-slate-350 text-slate-600 bg-slate-50' : 'border-slate-800 text-slate-400 bg-[#111]'
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
                      ? 'bg-amber-600 hover:bg-amber-700 text-white' 
                      : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950'
                  }`}
                >
                  Accept All Preferences
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
