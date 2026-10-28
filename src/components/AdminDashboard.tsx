import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, Trash, BookOpen, Layers, Users, Calendar, 
  Settings, CheckCircle, HelpCircle, Activity, Award, Check, 
  ShieldCheck, Sparkles, Image as ImageIcon, ToggleLeft, ToggleRight, X,
  Download, FileSpreadsheet, Printer, RotateCcw, Eye, RefreshCw,
  ShieldAlert, Lock, Unlock, Cookie, Globe, Video, Film, Smartphone, Laptop, Monitor, AlertCircle, Play, Pause, ExternalLink, Instagram, Box
} from 'lucide-react';
import { Course, CourseApplication, StudentGroup, StudentUser, TrainerUser, PromoBanner, GalleryImage, SpecialTrainingProgram, SpecialProgramEnrollment, Certificate, CompanyAbout } from '../types';
import { DakshyamDatabase } from '../utils/db';
import { uploadMediaToCloudinary } from '../utils/mediaUpload';
import AnalyticsCharts from './AnalyticsCharts';
import { AboutEditorTab } from './AboutEditorTab';
import Home3DArtSettingsTab from './Home3DArtSettingsTab';
import AdminMasterGuide from './AdminMasterGuide';
import AdminAccountsManager from './AdminAccountsManager';
import SupportTicketManager from './SupportTicketManager';
import { SecurityGuard } from '../utils/security';
import { notifyError, notifySuccess, notifyInfo, notifyWarning } from '../utils/toast';
import WorkshopDirectoryManager from './WorkshopDirectoryManager';

interface AdminDashboardProps {
  courses: Course[];
  applications: CourseApplication[];
  groups: StudentGroup[];
  students: StudentUser[];
  onRefresh: () => void;
  theme?: 'light' | 'dark';
  isDbConnected?: boolean;
  onTestLoader?: () => void;
  onOpenPublicFeedbackForm?: (slug?: string) => void;
}

export default function AdminDashboard({
  courses,
  applications,
  groups,
  students,
  onRefresh,
  theme = 'dark',
  isDbConnected = false,
  onTestLoader,
  onOpenPublicFeedbackForm
}: AdminDashboardProps) {
  const isLight = theme === 'light';
  // Navigation tabs (3D art OBJ studio & tools restored)
  type TabType = 'analytics' | 'courses' | 'applications' | 'trainers' | 'workshops' | 'accounts' | 'tickets' | 'promotions' | 'gallery' | 'devices' | 'special_training' | 'about_editor' | 'home_3d_art' | 'logs' | 'admin_guide';
  const [adminTab, setAdminTab] = useState<TabType>('analytics');

  // Instagram Link Admin Editor Modal States
  const [showInstagramQuickModal, setShowInstagramQuickModal] = useState(false);
  const [quickInstagramUrl, setQuickInstagramUrl] = useState(() => {
    return DakshyamDatabase.getCompanyAbout().socialInstagram || 'https://instagram.com/dakshyam_innovations';
  });
  const [isSavingInstagram, setIsSavingInstagram] = useState(false);
  const [instagramSaveSuccess, setInstagramSaveSuccess] = useState(false);

  // Audit Logs Filtering States
  const [searchLog, setSearchLog] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'SUCCESS' | 'ERROR' | 'INFO'>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [isFetchingLogs, setIsFetchingLogs] = useState(false);
  const [isSecurityBypassed, setIsSecurityBypassed] = useState<boolean>(() => SecurityGuard.getIsBypassed());

  // DB connection advice helper & live diagnostic tester
  const [showDbAdvice, setShowDbAdvice] = useState(false);
  const [testingDb, setTestingDb] = useState(false);
  const [dbTestResult, setDbTestResult] = useState<{
    success?: boolean;
    message?: string;
    error?: string;
    advice?: string;
    latencyMs?: number;
    hasUri?: boolean;
    database?: string;
  } | null>(null);

  const handleTestDatabase = async () => {
    setTestingDb(true);
    setDbTestResult(null);
    try {
      const res = await fetch('/api/test-db');
      const data = await res.json();
      setDbTestResult(data);
      if (data.success && onRefresh) {
        onRefresh();
      }
    } catch (e: any) {
      setDbTestResult({
        success: false,
        error: e.message || 'Failed to reach /api/test-db',
        advice: 'Ensure that your Vercel deployment has rewrites configured so /api/* routes to the serverless function.'
      });
    } finally {
      setTestingDb(false);
    }
  };

  // --- NEW COURSE STATE FORM ---
  const [courseTitle, setCourseTitle] = useState('');
  const [courseDuration, setCourseDuration] = useState('');
  const [courseDesc, setCourseDesc] = useState('');
  const [courseTags, setCourseTags] = useState('');
  const [courseFeatures, setCourseFeatures] = useState('');
  const [mobHardware, setMobHardware] = useState(false);
  const [courseError, setCourseError] = useState('');
  const [courseSuccess, setCourseSuccess] = useState('');

  // --- NEW BANNER STATE FORM ---
  const [bannerTitle, setBannerTitle] = useState('');
  const [bannerSubtitle, setBannerSubtitle] = useState('');
  const [bannerImageUrl, setBannerImageUrl] = useState('');
  const [bannerActionUrl, setBannerActionUrl] = useState('');
  const [bannerError, setBannerError] = useState('');
  const [bannerSuccess, setBannerSuccess] = useState('');

  // --- NEW GALLERY SNAPSHOT FORM ---
  const [galTitle, setGalTitle] = useState('');
  const [galDesc, setGalDesc] = useState('');
  const [galImageUrl, setGalImageUrl] = useState('');
  const [uploadedGalImages, setUploadedGalImages] = useState<Array<{ url: string; name: string }>>([]);
  const [galCategory, setGalCategory] = useState<'school_programs' | 'iot_robotics' | 'mern_web' | 'lab_setups'>('school_programs');
  const [galError, setGalError] = useState('');
  const [galSuccess, setGalSuccess] = useState('');
  const [isUploadingGalImage, setIsUploadingGalImage] = useState(false);
  const [galUploadProgress, setGalUploadProgress] = useState('');

  const handleGalFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    const validFiles: File[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.type.startsWith('image/')) {
        validFiles.push(file);
      }
    }

    if (validFiles.length === 0) {
      setGalError('Please select valid image file(s) (JPEG, PNG, WebP).');
      return;
    }

    setGalError('');
    setIsUploadingGalImage(true);
    setGalSuccess('');

    const token = DakshyamDatabase.getAuthToken();
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const newlyUploaded: Array<{ url: string; name: string }> = [];

    for (let i = 0; i < validFiles.length; i++) {
      const file = validFiles[i];
      setGalUploadProgress(`Uploading photo ${i + 1} of ${validFiles.length}: "${file.name}"...`);

      try {
        const base64Data: string = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        const res = await fetch('/api/upload', {
          method: 'POST',
          headers,
          body: JSON.stringify({ 
            file: base64Data, 
            resourceType: 'image',
            fileName: file.name
          })
        });

        if (res.ok) {
          const data = await res.json();
          newlyUploaded.push({
            url: data.url,
            name: file.name
          });
        } else {
          // If server returned non-ok or error, keep base64 preview so photo is preserved
          newlyUploaded.push({
            url: base64Data,
            name: file.name
          });
        }
      } catch (err: any) {
        console.warn('Gallery upload notice:', err);
        const dataUrl: string = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });
        newlyUploaded.push({
          url: dataUrl,
          name: file.name
        });
      }
    }

    setUploadedGalImages(prev => [...prev, ...newlyUploaded]);
    setIsUploadingGalImage(false);
    setGalUploadProgress('');
    setGalSuccess(`✓ ${newlyUploaded.length} photo(s) uploaded! (${uploadedGalImages.length + newlyUploaded.length} total ready to publish)`);
    e.target.value = '';
  };

  const handleRemoveUploadedGalImage = (indexToRemove: number) => {
    setUploadedGalImages(prev => prev.filter((_, idx) => idx !== indexToRemove));
  };

  // Sourced active state data
  const trainersList = DakshyamDatabase.getTrainers();
  const bannersList = DakshyamDatabase.getBanners();
  const galleryList = DakshyamDatabase.getGalleryImages();
  const videosList = DakshyamDatabase.getVideos();

  // Exhibition Tab Modes: Photos Snapshots or Project Videos
  const [exhibitionMode, setExhibitionMode] = useState<'photos' | 'videos'>('photos');

  // Dakshyam Innovations Project Videos (up to 2 min) state
  const [projVideoTitle, setProjVideoTitle] = useState('');
  const [projVideoDesc, setProjVideoDesc] = useState('');
  const [projVideoUrl, setProjVideoUrl] = useState('');
  const [projVideoFileBase64, setProjVideoFileBase64] = useState('');
  const [projVideoFileName, setProjVideoFileName] = useState('');
  const [projVideoDuration, setProjVideoDuration] = useState<number | null>(null);
  const [projVideoTrack, setProjVideoTrack] = useState('ROBOTICS_DEMO');
  const [projVideoError, setProjVideoError] = useState('');
  const [projVideoSuccess, setProjVideoSuccess] = useState('');
  const [isUploadingProjVideo, setIsUploadingProjVideo] = useState(false);
  const [projVideoUploadProgress, setProjVideoUploadProgress] = useState('');
  const [activeVideoModal, setActiveVideoModal] = useState<string | null>(null);

  // Dynamic Active Sessions Tracking
  const [activeSessions, setActiveSessions] = useState<any[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [sessionActionMsg, setSessionActionMsg] = useState('');

  // --- MODAL CONTROLLERS ---
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [showBannerModal, setShowBannerModal] = useState(false);
  const [showGalleryModal, setShowGalleryModal] = useState(false);
  const [showSpecialProgramModal, setShowSpecialProgramModal] = useState(false);
  const [showManualEnrollModal, setShowManualEnrollModal] = useState(false);
  const [showTrainerCreateModal, setShowTrainerCreateModal] = useState(false);
  const [showStudentCreateModal, setShowStudentCreateModal] = useState(false);

  // --- NEW TRAINER MANUALLY STATE FORM ---
  const [newTrainerName, setNewTrainerName] = useState('');
  const [newTrainerEmail, setNewTrainerEmail] = useState('');
  const [newTrainerPassword, setNewTrainerPassword] = useState('');
  const [newTrainerApproved, setNewTrainerApproved] = useState(true);
  const [trainerError, setTrainerError] = useState('');
  const [trainerSuccess, setTrainerSuccess] = useState('');

  // --- NEW STUDENT MANUALLY STATE FORM ---
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentEmail, setNewStudentEmail] = useState('');
  const [newStudentPhone, setNewStudentPhone] = useState('');
  const [newStudentSchool, setNewStudentSchool] = useState('');
  const [newStudentLevel, setNewStudentLevel] = useState('Grade 10');
  const [newStudentPassword, setNewStudentPassword] = useState('');
  const [newStudentPoints, setNewStudentPoints] = useState(0);
  const [studentError, setStudentError] = useState('');
  const [studentSuccess, setStudentSuccess] = useState('');

  // --- MANUALLY CREATE TRAINER ---
  const handleCreateTrainerManually = (e: React.FormEvent) => {
    e.preventDefault();
    setTrainerError('');
    setTrainerSuccess('');

    if (!newTrainerName.trim() || !newTrainerEmail.trim() || !newTrainerPassword.trim()) {
      setTrainerError('All trainer fields are required.');
      return;
    }

    const res = DakshyamDatabase.registerTrainer(
      newTrainerName.trim(),
      newTrainerEmail.trim(),
      newTrainerPassword.trim(),
      newTrainerApproved
    );

    if (res.success) {
      setTrainerSuccess('✓ Trainer successfully registered and stored!');
      setNewTrainerName('');
      setNewTrainerEmail('');
      setNewTrainerPassword('');
      onRefresh();
      setTimeout(() => {
        setShowTrainerCreateModal(false);
        setTrainerSuccess('');
      }, 1500);
    } else {
      setTrainerError(res.error || 'Failed to create trainer.');
    }
  };

  // --- MANUALLY CREATE STUDENT ---
  const handleCreateStudentManually = (e: React.FormEvent) => {
    e.preventDefault();
    setStudentError('');
    setStudentSuccess('');

    if (!newStudentName.trim() || !newStudentEmail.trim() || !newStudentPassword.trim()) {
      setStudentError('Name, Email, and Password are required.');
      return;
    }

    const studentsList = DakshyamDatabase.getStudents();
    if (studentsList.some(s => s.email.toLowerCase() === newStudentEmail.trim().toLowerCase())) {
      setStudentError('Student with this email already exists.');
      return;
    }

    const newStudent: StudentUser = {
      id: `usr-s${Date.now()}`,
      name: newStudentName.trim(),
      email: newStudentEmail.trim(),
      role: 'student',
      profile: {
        phone: newStudentPhone.trim(),
        institution: newStudentSchool.trim(),
        gradeOrBranch: newStudentLevel,
      },
      createdAt: new Date().toISOString().split('T')[0],
      password: newStudentPassword.trim()
    };

    studentsList.push(newStudent);
    DakshyamDatabase.saveStudents(studentsList);
    setStudentSuccess('✓ Student successfully registered and enrolled!');
    setNewStudentName('');
    setNewStudentEmail('');
    setNewStudentPhone('');
    setNewStudentSchool('');
    setNewStudentPassword('');
    setNewStudentPoints(0);
    onRefresh();
    setTimeout(() => {
      setShowStudentCreateModal(false);
      setStudentSuccess('');
    }, 1500);
  };

  const handlePurgeDatabase = async () => {
    const confirmation = prompt(
      "🚨 ADMIN PURGE ALL TESTING DATA CONFIRMATION:\n\nTo permanently delete all seed and test records (Students, Trainers, Applications, Certificates, Groups, Videos, Special Enrollments, and Workshop Feedbacks) from BOTH server and client cache, enter confirmation code:\n\nCONFIRM_PERMANENT_DATABASE_CLEAR"
    );
    if (!confirmation) return;
    if (confirmation.trim() !== 'CONFIRM_PERMANENT_DATABASE_CLEAR') {
      notifyError("Invalid confirmation code. You must enter exact code: CONFIRM_PERMANENT_DATABASE_CLEAR");
      return;
    }

    try {
      DakshyamDatabase.clearUserRelatedData();
      // Cleared user-related data
      const token = DakshyamDatabase.getAuthToken();
      const res = await fetch('/api/db/clear', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ confirmation: 'CONFIRM_PERMANENT_DATABASE_CLEAR' })
      });
      if (res.ok) {
        notifySuccess('All seeded user databases, testing records, and server directories successfully wiped clean!');
      } else {
        notifySuccess('Client Cache and workshop test records wiped clean.');
      }
      onRefresh();
    } catch (err) {
      console.error("Purge fail:", err);
      notifySuccess('Client cache cleared successfully!');
      onRefresh();
    }
  };

  // --- SPECIAL TRAINING PROGRAM STATES ---
  const [specName, setSpecName] = useState('');
  const [specDuration, setSpecDuration] = useState('');
  const [specStartDateTime, setSpecStartDateTime] = useState('');
  const [specInstitution, setSpecInstitution] = useState('');
  const [specError, setSpecError] = useState('');
  const [specSuccess, setSpecSuccess] = useState('');

  // --- MANUAL ENROLLMENT STATE FORM ---
  const [selectedProgramId, setSelectedProgramId] = useState('');
  const [manStudentName, setManStudentName] = useState('');
  const [manBranch, setManBranch] = useState('');
  const [manYear, setManYear] = useState('');
  const [manFathersName, setManFathersName] = useState('');
  const [manEmail, setManEmail] = useState('');
  const [manRollNumber, setManRollNumber] = useState('');
  const [manMobile, setManMobile] = useState('');
  const [manualEnrollOpen, setManualEnrollOpen] = useState(false);
  const [manError, setManError] = useState('');
  const [manSuccess, setManSuccess] = useState('');

  // Load Special programs and enrollments
  const specialPrograms = DakshyamDatabase.getSpecialPrograms(); // Active ones (auto-purges expired!)
  const specialProgramsAll = DakshyamDatabase.getSpecialProgramsAll(); // Full archive/list
  const specialEnrollments = DakshyamDatabase.getSpecialEnrollments();



  // Create special program
  const handleCreateSpecialProgram = (e: React.FormEvent) => {
    e.preventDefault();
    setSpecError('');
    setSpecSuccess('');

    if (!specName.trim() || !specDuration.trim() || !specStartDateTime.trim() || !specInstitution.trim()) {
      setSpecError('Please fill out all the program details.');
      return;
    }

    try {
      const programs = DakshyamDatabase.getSpecialProgramsAll();
      const newProgram: SpecialTrainingProgram = {
        id: `spec-${Date.now()}`,
        trainingName: specName,
        duration: specDuration,
        startingDateTime: specStartDateTime,
        institutionName: specInstitution,
        createdAt: new Date().toISOString()
      };

      programs.push(newProgram);
      DakshyamDatabase.saveSpecialPrograms(programs);

      setSpecSuccess('✓ Special training registration program created successfully!');
      setSpecName('');
      setSpecDuration('');
      setSpecStartDateTime('');
      setSpecInstitution('');
      onRefresh();
    } catch {
      setSpecError('Failed to create special training program.');
    }
  };

  // Delete special program
  const handleDeleteSpecialProgram = (id: string) => {
    if (confirm('Are you sure you want to delete this program? Expired ones are deleted automatically but you can manually purge or archive.')) {
      const all = DakshyamDatabase.getSpecialProgramsAll();
      const filtered = all.filter(p => p.id !== id);
      DakshyamDatabase.saveSpecialPrograms(filtered);
      
      // Filter out enrollments linked to it
      const enrolls = DakshyamDatabase.getSpecialEnrollments().filter(e => e.programId !== id);
      DakshyamDatabase.saveSpecialEnrollments(enrolls);
      
      if (selectedProgramId === id) {
        setSelectedProgramId('');
      }
      onRefresh();
    }
  };

  // Manual enroll candidate
  const handleManualEnroll = (e: React.FormEvent) => {
    e.preventDefault();
    setManError('');
    setManSuccess('');

    if (!selectedProgramId) {
      setManError('Please select active special program first.');
      return;
    }

    if (!manStudentName.trim() || !manEmail.trim() || !manMobile.trim() || !manRollNumber.trim()) {
      setManError('Please enter Student Name, Email ID, Roll number, and Mobile number.');
      return;
    }

    try {
      const targetProg = specialProgramsAll.find(p => p.id === selectedProgramId);
      const trainingName = targetProg ? targetProg.trainingName : 'Special Training';
      const institutionName = targetProg ? targetProg.institutionName : 'Regional School';

      const enrolls = DakshyamDatabase.getSpecialEnrollments();
      const newEnroll: SpecialProgramEnrollment = {
        id: `enroll-${Date.now()}`,
        programId: selectedProgramId,
        trainingName,
        institutionName,
        name: manStudentName,
        branch: manBranch,
        yearOfStudy: manYear,
        fathersName: manFathersName,
        email: manEmail,
        rollNumber: manRollNumber,
        mobileNumber: manMobile,
        enrolledAt: new Date().toISOString().split('T')[0]
      };

      enrolls.push(newEnroll);
      DakshyamDatabase.saveSpecialEnrollments(enrolls);

      setManSuccess('✓ Student registered manually into program registry!');
      setManStudentName('');
      setManBranch('');
      setManYear('');
      setManFathersName('');
      setManEmail('');
      setManRollNumber('');
      setManMobile('');
      setManualEnrollOpen(false);
      onRefresh();
    } catch {
      setManError('Failed to save manual student registration record.');
    }
  };



  // Export Special training program registry to CSV format
  const handleExportToCSV = (program: SpecialTrainingProgram) => {
    const enrolls = specialEnrollments.filter(e => e.programId === program.id);
    if (!enrolls.length) {
      notifyWarning('No enrolled student records found to export.', 'Export Empty');
      return;
    }

    try {
      const headers = ['Student Name', 'Branch/Specialization', 'Year of study', "Father's Name", 'Email ID', 'Roll Number', 'Mobile Number', 'Enrolled At Date'];
      const rows = enrolls.map(e => [
        e.name,
        e.branch || 'N/A',
        e.yearOfStudy || 'N/A',
        e.fathersName || 'N/A',
        e.email,
        e.rollNumber,
        e.mobileNumber,
        e.enrolledAt
      ]);
      
      const csvContent = [
        headers.join(','),
        ...rows.map(r => r.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))
      ].join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `${program.trainingName.toLowerCase().replace(/\s+/g, '_')}_student_registry.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      notifySuccess(`Exported ${enrolls.length} candidate records to CSV!`, 'Export Complete');
    } catch (err) {
      notifyError('Failed exporting registry file. Ensure browser permits downloads.', 'Export Error');
    }
  };


  // Handle Create Course
  const handleCreateCourse = (e: React.FormEvent) => {
    e.preventDefault();
    setCourseError('');
    setCourseSuccess('');

    if (!courseTitle.trim() || !courseDuration.trim() || !courseDesc.trim()) {
      setCourseError('Please enter a title, duration, and description.');
      return;
    }

    try {
      const allCourses = DakshyamDatabase.getCourses();
      const tagsArray = courseTags ? courseTags.split(',').map(t => t.trim()) : ['Tech'];
      const featuresArray = courseFeatures ? courseFeatures.split(',').map(f => f.trim()) : ['Manual Training Setups'];

      const newCourse: Course = {
        id: `course-${Date.now()}`,
        title: courseTitle,
        duration: courseDuration,
        description: courseDesc,
        tags: tagsArray,
        features: featuresArray,
        mobileHardwareIncluded: mobHardware
      };

      allCourses.push(newCourse);
      DakshyamDatabase.saveCourses(allCourses);

      setCourseSuccess('✓ New syllabus course has been successfully published to the live directory!');
      setCourseTitle('');
      setCourseDuration('');
      setCourseDesc('');
      setCourseTags('');
      setCourseFeatures('');
      setMobHardware(false);
      onRefresh();
    } catch {
      setCourseError('Error creating course Node.');
    }
  };

  // Delete Course
  const handleDeleteCourse = (courseId: string) => {
    if (confirm('Are you sure you want to permanently delete this course?')) {
      const all = DakshyamDatabase.getCourses();
      const filtered = all.filter(c => c.id !== courseId);
      DakshyamDatabase.saveCourses(filtered);
      onRefresh();
    }
  };

  // Approve Trainer ID
  const handleApproveTrainer = (trainerId: string) => {
    const trainers = DakshyamDatabase.getTrainers();
    const match = trainers.find(t => t.id === trainerId);
    if (match) {
      match.isApproved = true;
      DakshyamDatabase.saveTrainers(trainers);
      onRefresh();
    }
  };

  // Revoke/Remove Trainer
  const handleDeleteTrainer = (trainerId: string) => {
    if (confirm('Are you sure you want to remove this trainer from the system database?')) {
      const trainers = DakshyamDatabase.getTrainers();
      const filtered = trainers.filter(t => t.id !== trainerId);
      DakshyamDatabase.saveTrainers(filtered);
      onRefresh();
    }
  };

  // Manage Application Status
  const handleUpdateAppStatus = (appId: string, status: 'approved' | 'rejected') => {
    const apps = DakshyamDatabase.getApplications();
    const match = apps.find(a => a.id === appId);
    if (match) {
      match.status = status;
      DakshyamDatabase.saveApplications(apps);
      onRefresh();
    }
  };

  // Handle Banner Upload/Save
  const handleCreateBanner = (e: React.FormEvent) => {
    e.preventDefault();
    setBannerError('');
    setBannerSuccess('');

    if (!bannerTitle.trim() || !bannerSubtitle.trim() || !bannerImageUrl.trim()) {
      setBannerError('Title, subtitle, and solid stock image URL are required fields.');
      return;
    }

    try {
      const banners = DakshyamDatabase.getBanners();
      const newBanner: PromoBanner = {
        id: `ban-${Date.now()}`,
        title: bannerTitle,
        subtitle: bannerSubtitle,
        imageUrl: bannerImageUrl,
        actionUrl: bannerActionUrl.trim() || undefined,
        isActive: true,
        createdAt: new Date().toISOString().split('T')[0]
      };

      banners.push(newBanner);
      DakshyamDatabase.saveBanners(banners);

      setBannerSuccess('✓ Promotional banner successfully established in the home carousel pool!');
      setBannerTitle('');
      setBannerSubtitle('');
      setBannerImageUrl('');
      setBannerActionUrl('');
      onRefresh();
    } catch {
      setBannerError('Database transaction timed out.');
    }
  };

  const handleToggleBanner = (bannerId: string) => {
    const banners = DakshyamDatabase.getBanners();
    const match = banners.find(b => b.id === bannerId);
    if (match) {
      match.isActive = !match.isActive;
      DakshyamDatabase.saveBanners(banners);
      onRefresh();
    }
  };

  const handleDeleteBanner = (bannerId: string) => {
    if (confirm('Are you sure you want to delete this promotional banner?')) {
      const banners = DakshyamDatabase.getBanners();
      const filtered = banners.filter(b => b.id !== bannerId);
      DakshyamDatabase.saveBanners(filtered);
      onRefresh();
    }
  };

  // Handle Gallery Save (supports multi-photo batch publishing & optional direct URL)
  const handleCreateGalleryImage = (e: React.FormEvent) => {
    e.preventDefault();
    setGalError('');
    setGalSuccess('');

    if (!galTitle.trim() || !galDesc.trim()) {
      setGalError('Title and description are required fields.');
      return;
    }

    // Collect all valid image URLs to publish
    const imagesToPublish: string[] = [];

    // 1. Add all uploaded photos
    uploadedGalImages.forEach(img => {
      if (img.url && !imagesToPublish.includes(img.url)) {
        imagesToPublish.push(img.url);
      }
    });

    // 2. Direct URL is completely OPTIONAL. If provided, add it
    if (galImageUrl.trim() && !imagesToPublish.includes(galImageUrl.trim())) {
      imagesToPublish.push(galImageUrl.trim());
    }

    if (imagesToPublish.length === 0) {
      setGalError('Please upload at least one photo or optionally provide an image URL.');
      return;
    }

    try {
      const gallery = DakshyamDatabase.getGalleryImages();
      const now = new Date().toISOString().split('T')[0];

      // Add all images to the exhibition directory
      imagesToPublish.forEach((url, idx) => {
        const itemTitle = imagesToPublish.length > 1 
          ? `${galTitle.trim()} (${idx + 1}/${imagesToPublish.length})` 
          : galTitle.trim();

        const newImg: GalleryImage = {
          id: `gal-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
          title: itemTitle,
          description: galDesc.trim(),
          imageUrl: url,
          category: galCategory,
          createdAt: now
        };

        gallery.unshift(newImg);
      });

      DakshyamDatabase.saveGalleryImages(gallery);

      setGalSuccess(`✓ ${imagesToPublish.length} photo snapshot(s) successfully published to the public exhibition!`);
      setGalTitle('');
      setGalDesc('');
      setGalImageUrl('');
      setUploadedGalImages([]);
      setGalCategory('school_programs');
      onRefresh();
    } catch {
      setGalError('Storage node failed.');
    }
  };

  const handleDeleteGalleryImage = (galId: string) => {
    if (confirm('Delete this photo snapshot from the public portfolio exhibition?')) {
      const gallery = DakshyamDatabase.getGalleryImages();
      const filtered = gallery.filter(g => g.id !== galId);
      DakshyamDatabase.saveGalleryImages(filtered);
      onRefresh();
    }
  };

  // --- DAKSHYAM INNOVATIONS PROJECT VIDEOS (UP TO 2 MIN) ---
  const handleProjectVideoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setProjVideoError('');
    setProjVideoSuccess('');
    setProjVideoFileBase64('');
    setProjVideoFileName('');
    setProjVideoDuration(null);

    if (!file.type.startsWith('video/')) {
      setProjVideoError('❌ Invalid file format. Please choose an MP4, WebM, or video recording file.');
      e.target.value = '';
      return;
    }

    // Inspect duration in browser first
    const tempVideo = document.createElement('video');
    tempVideo.preload = 'metadata';
    const blobUrl = URL.createObjectURL(file);
    tempVideo.src = blobUrl;

    tempVideo.onloadedmetadata = () => {
      URL.revokeObjectURL(blobUrl);
      const dur = tempVideo.duration;
      // 121 seconds max (2 minutes with slight precision buffer)
      if (dur > 121) {
        const mins = Math.floor(dur / 60);
        const secs = Math.round(dur % 60);
        setProjVideoError(`❌ Selected video duration is ${mins}m ${secs}s (${Math.round(dur)} seconds). Dakshyam Innovations project videos must be 2 minutes (120s) or less. Please select a trimmed demonstration video.`);
        e.target.value = '';
        return;
      }

      setProjVideoDuration(dur);
      const reader = new FileReader();
      reader.onloadend = () => {
        setProjVideoFileBase64(reader.result as string);
        setProjVideoFileName(file.name);
      };
      reader.readAsDataURL(file);
    };

    tempVideo.onerror = () => {
      URL.revokeObjectURL(blobUrl);
      const reader = new FileReader();
      reader.onloadend = () => {
        setProjVideoFileBase64(reader.result as string);
        setProjVideoFileName(file.name);
      };
      reader.readAsDataURL(file);
    };
  };

  const handleCreateProjectVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    setProjVideoError('');
    setProjVideoSuccess('');

    if (!projVideoTitle.trim()) {
      setProjVideoError('Please enter a project video title.');
      return;
    }

    const hasFile = Boolean(projVideoFileBase64);
    const hasUrl = Boolean(projVideoUrl.trim());

    if (!hasFile && !hasUrl) {
      setProjVideoError('Please select a demonstration video file (up to 2 min) or enter a video URL.');
      return;
    }

    try {
      setIsUploadingProjVideo(true);
      setProjVideoUploadProgress('Encoding & uploading project video to Cloudinary/server...');

      let finalUrl = projVideoUrl.trim();

      if (hasFile) {
        const token = DakshyamDatabase.getAuthToken();
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const res = await fetch('/api/upload', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            file: projVideoFileBase64,
            resourceType: 'video'
          })
        });

        if (res.ok) {
          const data = await res.json();
          finalUrl = data.url || finalUrl;
        } else {
          finalUrl = projVideoFileBase64;
        }
      }

      const newVideo = {
        id: `vid_dakshyam_${Date.now()}`,
        groupId: 'dakshyam-official-innovations',
        groupName: 'Dakshyam Innovations Project',
        title: projVideoTitle.trim(),
        description: projVideoDesc.trim(),
        videoUrl: finalUrl,
        mediaType: 'video' as const,
        duration: projVideoDuration ? Math.round(projVideoDuration) : 90,
        likes: 0,
        likedByUserIds: [],
        views: 1,
        comments: [],
        createdAt: new Date().toISOString().replace('T', ' ').substring(0, 16)
      };

      // Save to API
      const token = DakshyamDatabase.getAuthToken();
      fetch('/api/videos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(newVideo)
      }).catch(() => {});

      // Save to local state
      const currentVideos = DakshyamDatabase.getVideos();
      DakshyamDatabase.saveVideos([newVideo, ...currentVideos]);

      setProjVideoSuccess('✓ Dakshyam Innovations project video (up to 2 min) published successfully!');
      setProjVideoTitle('');
      setProjVideoDesc('');
      setProjVideoUrl('');
      setProjVideoFileBase64('');
      setProjVideoFileName('');
      setProjVideoDuration(null);
      setProjVideoUploadProgress('');
      onRefresh();
    } catch (err: any) {
      setProjVideoError(err.message || 'Video upload process failed.');
    } finally {
      setIsUploadingProjVideo(false);
    }
  };

  const handleDeleteProjectVideo = (videoId: string) => {
    if (confirm('Delete this Dakshyam Innovations project video from the exhibition?')) {
      const current = DakshyamDatabase.getVideos().filter(v => v.id !== videoId);
      DakshyamDatabase.saveVideos(current);
      const token = DakshyamDatabase.getAuthToken();
      fetch(`/api/videos/${videoId}`, {
        method: 'DELETE',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      }).catch(() => {});
      onRefresh();
    }
  };

  // --- DYNAMIC ACTIVE SESSION MANAGEMENT ---
  const fetchSessions = async () => {
    setSessionsLoading(true);
    try {
      const currentSessionId = DakshyamDatabase.getSessionId();
      const token = DakshyamDatabase.getAuthToken();
      const res = await fetch(`/api/auth/sessions?sessionId=${encodeURIComponent(currentSessionId)}`, {
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
          'x-session-id': currentSessionId
        }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.sessions && data.sessions.length > 0) {
          setActiveSessions(data.sessions);
        } else {
          // Provide dynamic current session
          setActiveSessions([{
            sessionId: currentSessionId,
            userId: 'usr-admin-master',
            email: 'admin@dakshyam.com',
            role: 'admin',
            deviceName: 'Active Administrator Console',
            deviceType: 'Desktop',
            browser: 'Production Browser',
            os: 'Secure Workspace',
            ip: 'Production Gateway',
            createdAt: new Date().toISOString(),
            lastActive: new Date().toISOString(),
            isCurrent: true
          }]);
        }
      }
    } catch {} finally {
      setSessionsLoading(false);
    }
  };

  React.useEffect(() => {
    fetchSessions();
    const interval = setInterval(fetchSessions, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleRevokeSession = async (sessionId: string) => {
    if (confirm('Revoke access and log out this device?')) {
      try {
        const token = DakshyamDatabase.getAuthToken();
        await fetch(`/api/auth/sessions/${sessionId}`, {
          method: 'DELETE',
          headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        });
        setSessionActionMsg('✓ Device session revoked and logged out successfully.');
        setTimeout(() => setSessionActionMsg(''), 4000);
        fetchSessions();
      } catch {}
    }
  };

  const handleTerminateOtherSessions = async () => {
    if (confirm('Log out from all other logged-in devices except this one?')) {
      try {
        const currentSessionId = DakshyamDatabase.getSessionId();
        const token = DakshyamDatabase.getAuthToken();
        await fetch('/api/auth/sessions/terminate-others', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
            'x-session-id': currentSessionId
          },
          body: JSON.stringify({ sessionId: currentSessionId })
        });
        setSessionActionMsg('✓ All other device sessions successfully terminated.');
        setTimeout(() => setSessionActionMsg(''), 4000);
        fetchSessions();
      } catch {}
    }
  };

  // --- ANALYTICS DATAPOINTS ---
  const courseRegistrationData = courses.map(course => {
    const count = applications.filter(app => app.courseId === course.id).length;
    return { label: course.title.substring(0, 16) + '...', value: count };
  });

  const projectPointsData = groups.slice(0, 5).map(gp => {
    return { label: gp.name, value: gp.points };
  });

  const pendingCount = applications.filter(a => a.status === 'pending').length;
  const approvedCount = applications.filter(a => a.status === 'approved').length;

  return (
    <div className="space-y-6 text-left max-w-4xl mx-auto">
      
      {/* Admin Hero Header banner */}
      <div className={`border p-6 rounded-2xl relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-all duration-300 ${
        isLight 
          ? 'bg-gradient-to-r from-amber-500/5 to-slate-50 border-slate-200 shadow-sm' 
          : 'bg-gradient-to-r from-slate-950 to-cyan-950/20 border border-cyan-500/15'
      }`}>
        <div className="absolute top-0 right-0 h-full w-48 bg-radial from-cyan-500/5 to-transparent blur-xl pointer-events-none" />
        
        <div className="space-y-2">
          <div>
            <span className={`text-[9px] font-mono tracking-widest uppercase font-bold ${
              isLight ? 'text-amber-800' : 'text-[#22d3ee]'
            }`}>System Command Console</span>
            <h1 className={`text-xl font-black tracking-wide uppercase ${
              isLight ? 'text-slate-900' : 'text-white'
            }`}>Administrator Console</h1>
            <p className={`text-xs font-sans ${isLight ? 'text-slate-650' : 'text-slate-400'}`}>Full Database Access • No-Code Dynamic Editing Active</p>
          </div>
          
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setAdminTab('admin_guide')}
              className={`text-[10px] font-mono font-bold border px-3.5 py-1.5 rounded-xl flex items-center gap-1.5 transition-all shadow-xs shrink-0 cursor-pointer ${
                adminTab === 'admin_guide'
                  ? (isLight ? 'bg-blue-900 text-white border-blue-900' : 'bg-sky-500/20 border-sky-400 text-sky-300 shadow-[0_0_12px_rgba(56,189,248,0.3)]')
                  : (isLight ? 'border-blue-900/30 bg-blue-50 text-blue-900 hover:bg-blue-100' : 'border-sky-500/30 bg-sky-950/30 text-sky-300 hover:bg-sky-900/40')
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" /> 📖 Admin Master Guide
            </button>

            <button
              onClick={handlePurgeDatabase}
              className={`text-[10px] font-mono font-bold border px-3.5 py-1.5 rounded-xl flex items-center gap-1.5 transition-all shadow-xs shrink-0 cursor-pointer ${
                isLight
                  ? 'border-red-200 bg-red-50 text-red-600 hover:bg-red-100'
                  : 'border-red-500/25 bg-red-950/20 text-red-400 hover:bg-red-900/30 hover:border-red-500/40'
              }`}
            >
              <Trash className="w-3.5 h-3.5" /> Purge Seed & User-Related Data
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 text-3xs font-mono">
          <span className={`px-3 py-1 border rounded-full font-bold ${
            isLight ? 'bg-amber-50 border-amber-500/20 text-amber-900' : 'bg-cyan-950/40 border-cyan-500/10 text-white'
          }`}>
            Courses: {courses.length}
          </span>
          <span className={`px-3 py-1 border rounded-full font-bold ${
            isLight ? 'bg-amber-50 border-amber-500/20 text-amber-900' : 'bg-cyan-950/40 border-cyan-500/10 text-[#22d3ee]'
          }`}>
            Gallery: {galleryList.length}
          </span>
          <span className={`px-3 py-1 border rounded-full font-bold ${
            isLight ? 'bg-slate-150 border-slate-250 text-slate-600' : 'bg-[#111] border-cyan-500/5 text-slate-400'
          }`}>
            Pending Applicants: {pendingCount}
          </span>
          {isDbConnected ? (
            <span className={`px-3 py-1 border rounded-full font-bold flex items-center gap-1.5 bg-emerald-950/30 border-emerald-500/20 text-emerald-400`}>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Live DB Connected
            </span>
          ) : (
            <button 
              onClick={() => setShowDbAdvice(!showDbAdvice)}
              className={`px-3 py-1 border rounded-full font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                isLight 
                  ? 'bg-amber-50 border-amber-500/25 text-amber-900 hover:bg-amber-100' 
                  : 'bg-amber-950/20 border-amber-500/15 text-amber-400 hover:bg-amber-900/30 hover:border-amber-500/30'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" /> Storage: Local Cache Active
            </button>
          )}
          <button
            onClick={() => setAdminTab('devices')}
            className={`px-3 py-1 border rounded-full font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              isLight 
                ? 'bg-blue-50 border-blue-900/20 text-blue-950 hover:bg-blue-100' 
                : 'bg-cyan-950/40 border-cyan-400/30 text-cyan-300 hover:bg-cyan-900/40 shadow-[0_0_10px_rgba(34,211,238,0.15)]'
            }`}
            title="View all active devices where admin is logged in"
          >
            <Smartphone className="w-3 h-3 text-cyan-400" />
            <span>Devices: {activeSessions.length || 1} Logged In</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          </button>

          <button
            type="button"
            onClick={() => {
              setQuickInstagramUrl(DakshyamDatabase.getCompanyAbout().socialInstagram || 'https://instagram.com/dakshyam_innovations');
              setShowInstagramQuickModal(true);
            }}
            className={`px-3 py-1 border rounded-full font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              isLight 
                ? 'bg-pink-50 border-pink-400/30 text-pink-900 hover:bg-pink-100 shadow-xs' 
                : 'bg-gradient-to-r from-pink-950/40 to-purple-950/40 border-pink-500/30 text-pink-300 hover:border-pink-400 shadow-[0_0_10px_rgba(236,72,153,0.15)]'
            }`}
            title="Edit Instagram & Social Media Profile URL"
          >
            <Instagram className="w-3 h-3 text-pink-400" />
            <span>Edit Instagram Link</span>
          </button>

          <button
            type="button"
            onClick={() => setAdminTab('home_3d_art')}
            className={`px-3 py-1 border rounded-full font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              isLight 
                ? 'bg-cyan-50 border-cyan-500/30 text-cyan-900 hover:bg-cyan-100 shadow-xs' 
                : 'bg-cyan-950/40 border-cyan-400/30 text-cyan-300 hover:bg-cyan-900/40 shadow-[0_0_10px_rgba(34,211,238,0.15)]'
            }`}
            title="Open Home Page 3D Art & OBJ Studio"
          >
            <Box className="w-3 h-3 text-cyan-400" />
            <span>Home 3D Art Studio</span>
          </button>
        </div>
      </div>

      {/* Database connection details banner if in fallback mode and clicked */}
      <AnimatePresence>
        {(!isDbConnected || showDbAdvice) && showDbAdvice && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className={`border p-5 rounded-2xl text-xs space-y-3 relative overflow-hidden transition-all shadow-xl ${
              isLight 
                ? 'bg-amber-50/80 border-amber-300 text-slate-800' 
                : 'bg-[#101b2b] border-amber-500/30 text-slate-200'
            }`}
          >
            <button 
              onClick={() => setShowDbAdvice(false)}
              className="absolute top-3 right-3 text-slate-400 hover:text-white cursor-pointer p-1 rounded-lg hover:bg-black/20"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center justify-between gap-3 flex-wrap pr-8">
              <div className="flex items-center gap-2 font-bold font-mono text-[#f59e0b] text-xs uppercase tracking-wider">
                <Activity className="w-4 h-4" /> 
                <span>MongoDB Atlas Connectivity Center</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${
                  isDbConnected ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                }`}>
                  {isDbConnected ? 'Live Connected' : 'Local Resilient Storage Active'}
                </span>
              </div>

              {/* Action test button */}
              <button
                type="button"
                onClick={handleTestDatabase}
                disabled={testingDb}
                className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-mono text-2xs font-bold uppercase transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50 shadow"
              >
                <RefreshCw className={`w-3 h-3 ${testingDb ? 'animate-spin' : ''}`} />
                <span>{testingDb ? 'Testing Connection...' : 'Ping Atlas Cluster'}</span>
              </button>
            </div>

            {/* Test result box if run */}
            {dbTestResult && (
              <div className={`p-3 rounded-xl border font-mono text-2xs space-y-1 ${
                dbTestResult.success 
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' 
                  : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
              }`}>
                <div className="flex items-center gap-2 font-bold text-xs">
                  <span>{dbTestResult.success ? '✓ Atlas Ping Successful!' : '✕ Connection Diagnostic Notice'}</span>
                  {dbTestResult.latencyMs && (
                    <span className="px-2 py-0.5 rounded bg-black/40 text-emerald-400">
                      {dbTestResult.latencyMs}ms latency
                    </span>
                  )}
                </div>
                {dbTestResult.message && <p>{dbTestResult.message}</p>}
                {dbTestResult.error && <p className="text-rose-400"><strong>Error:</strong> {dbTestResult.error}</p>}
                {dbTestResult.advice && (
                  <p className="text-amber-200 mt-1">
                    <strong>Resolution Step:</strong> {dbTestResult.advice}
                  </p>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
              <div className={`p-3 rounded-xl border ${isLight ? 'bg-white border-amber-200' : 'bg-black/30 border-slate-700/60'}`}>
                <strong className="text-sky-400 font-mono uppercase text-2xs block mb-1">
                  1. MongoDB Atlas Network Access (Mandatory)
                </strong>
                <p className="text-[11px] leading-relaxed text-slate-300">
                  Because Vercel serverless functions dynamically deploy on different IP ranges, MongoDB Atlas will reject connections unless access is open:
                </p>
                <ol className="list-decimal list-inside space-y-0.5 font-mono text-[10px] mt-1 text-slate-400">
                  <li>In Atlas, navigate to <span className="text-white font-bold">Network Access</span></li>
                  <li>Click <span className="text-white font-bold">Add IP Address</span></li>
                  <li>Choose <span className="text-amber-300 font-bold">Allow Access from Anywhere (0.0.0.0/0)</span></li>
                  <li>Click <span className="text-white font-bold">Confirm</span></li>
                </ol>
              </div>

              <div className={`p-3 rounded-xl border ${isLight ? 'bg-white border-amber-200' : 'bg-black/30 border-slate-700/60'}`}>
                <strong className="text-sky-400 font-mono uppercase text-2xs block mb-1">
                  2. Vercel Environment Variables (Mandatory)
                </strong>
                <p className="text-[11px] leading-relaxed text-slate-300">
                  Add your Atlas connection string to Vercel so the serverless API routes connect directly:
                </p>
                <ol className="list-decimal list-inside space-y-0.5 font-mono text-[10px] mt-1 text-slate-400">
                  <li>In Vercel Dashboard, go to your project -&gt; <span className="text-white font-bold">Settings</span> -&gt; <span className="text-white font-bold">Environment Variables</span></li>
                  <li>Key: <span className="text-sky-300 font-bold">MONGODB_URI</span></li>
                  <li>Value: <span className="text-amber-300 font-bold">mongodb+srv://...</span> (ensure special characters in password like @ are URL-encoded)</li>
                  <li>Click <span className="text-white font-bold">Redeploy</span></li>
                </ol>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tabs list */}
      <div className={`flex flex-wrap gap-1.5 border-b pb-0.5 font-mono text-3xs uppercase font-extrabold scrollbar-none overflow-x-auto ${
        isLight ? 'border-slate-200' : 'border-cyan-500/10'
      }`}>
        {(['analytics', 'courses', 'applications', 'trainers', 'workshops', 'accounts', 'tickets', 'promotions', 'gallery', 'devices', 'special_training', 'about_editor', 'home_3d_art', 'logs', 'admin_guide'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setAdminTab(tab)}
            className={`px-3.5 py-2 rounded-t-xl transition-all border-t border-x cursor-pointer shrink-0 ${
              adminTab === tab
                ? (isLight ? 'bg-white border-slate-250 text-amber-800 font-bold border-b-white z-10' : 'bg-[#050505]/70 border-cyan-500/15 text-[#22d3ee]')
                : (isLight ? 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100/50' : 'border-transparent text-slate-450 hover:text-white')
            }`}
          >
            {tab === 'analytics' && 'Analytics Deck'}
            {tab === 'courses' && 'Publisher'}
            {tab === 'applications' && 'Admissions'}
            {tab === 'trainers' && 'Verify Trainers'}
            {tab === 'workshops' && '🏢 Workshops Directory'}
            {tab === 'accounts' && '👥 Registered Accounts'}
            {tab === 'tickets' && '🎫 Support & Bug Tickets'}
            {tab === 'promotions' && 'Promo Banners'}
            {tab === 'gallery' && 'Class Gallery & Exhibition'}
            {tab === 'devices' && `📱 Active Devices (${activeSessions.length || 1})`}
            {tab === 'special_training' && '🎓 Special Training Forms'}
            {tab === 'about_editor' && '✏️ About Page Editor'}
            {tab === 'home_3d_art' && '🧊 Home 3D Art (.obj)'}
            {tab === 'logs' && '🛡️ System Audit Logs'}
            {tab === 'admin_guide' && '📖 Admin Master Guide'}
          </button>
        ))}
      </div>

      {/* Panel containers */}
      <div className={`rounded-2xl p-5 md:p-6 border transition-all duration-300 overflow-hidden ${
        isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#050505]/60 border-cyan-500/10 backdrop-blur-md'
      }`}>
        <AnimatePresence mode="wait">
          <motion.div
            key={adminTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
          >
        
        {/* TAB 1: ANALYTICS & CHARTS */}
        {adminTab === 'analytics' && (() => {
          // Compute student academic demographics dynamically
          const levelsCountMap: Record<string, number> = {};
          students.forEach(st => {
            const lvl = st.profile?.gradeOrBranch || 'Grade 10';
            levelsCountMap[lvl] = (levelsCountMap[lvl] || 0) + 1;
          });

          const demographicsData = Object.entries(levelsCountMap).map(([lbl, val]) => ({
            label: lbl,
            value: val
          }));

          const certCount = DakshyamDatabase.getCertificates().length;
          const specialProgCount = specialProgramsAll.length;
          const specialEnrollsCount = specialEnrollments.length;

          return (
            <div className="space-y-6">
              
              {/* Primary Bento row: Application volumes & Project points */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                
                <AnalyticsCharts 
                  title="Class Application Volumes" 
                  data={courseRegistrationData} 
                  type="bar" 
                  icon={<BookOpen className="w-4 h-4 text-cyan-400" />}
                  theme={theme}
                />

                <AnalyticsCharts 
                  title="Group Project Standings (Points)" 
                  data={projectPointsData} 
                  type="line" 
                  icon={<Award className="w-4 h-4 text-cyan-400" />}
                  theme={theme}
                />

              </div>

              {/* Secondary Bento Row: Demographics and Kit Logistics Tracker */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                
                <AnalyticsCharts 
                  title="Student Academic Demographics Profile" 
                  data={demographicsData} 
                  type="bar" 
                  icon={<Users className="w-4 h-4 text-[#22d3ee]" />}
                  theme={theme}
                />

                {/* Custom Logistics & Inventory health check card */}
                <div className={`border rounded-2xl p-5 transition-all duration-300 space-y-4 ${
                  isLight 
                    ? 'bg-slate-50/55 border-slate-200 hover:border-amber-500/15' 
                    : 'bg-[#050505]/60 border border-cyan-500/10 hover:border-cyan-500/20 backdrop-blur-md'
                }`}>
                  <div className="flex items-center justify-between">
                    <h3 className={`text-sm font-semibold tracking-wider flex items-center gap-2 ${
                      isLight ? 'text-slate-800' : 'text-slate-300'
                    }`}>
                      <Activity className={`w-4 h-4 ${isLight ? 'text-amber-600' : 'text-amber-500'}`} /> Physical IoT Kit Logistics Pool
                    </h3>
                    <span className={`text-2xs font-mono px-2 py-0.5 rounded-full border ${
                      isLight ? 'text-amber-800/85 border-amber-500/25 bg-amber-500/5' : 'text-amber-400/80 border border-amber-500/20'
                    }`}>
                      Active Telemetry
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3.5 pt-1.5 text-left font-mono">
                    <div className={`p-3 rounded-xl space-y-1 border ${
                      isLight ? 'bg-slate-100/60 border-slate-250/50' : 'bg-black/40 border border-slate-500/5'
                    }`}>
                      <span className={`text-4xs uppercase font-black ${isLight ? 'text-slate-500' : 'text-slate-500'}`}>ESP32 Classes Leased</span>
                      <span className={`text-sm font-bold block ${isLight ? 'text-slate-900' : 'text-white'}`}>85 Active Hubs</span>
                      <div className={`h-1 w-full rounded mt-1.5 overflow-hidden ${isLight ? 'bg-slate-200' : 'bg-[#111]'}`}>
                        <div className={`h-full w-[85%] ${isLight ? 'bg-amber-600' : 'bg-amber-500'}`} />
                      </div>
                    </div>

                    <div className={`p-3 rounded-xl space-y-1 border ${
                      isLight ? 'bg-slate-100/60 border-slate-250/50' : 'bg-black/40 border border-slate-500/5'
                    }`}>
                      <span className={`text-4xs uppercase font-black ${isLight ? 'text-slate-500' : 'text-slate-500'}`}>Camps Reserve Stock</span>
                      <span className={`text-sm font-bold block ${isLight ? 'text-amber-800' : 'text-cyan-400'}`}>40 Lab Kits</span>
                      <div className={`h-1 w-full rounded mt-1.5 overflow-hidden ${isLight ? 'bg-slate-200' : 'bg-[#111]'}`}>
                        <div className={`h-full w-[60%] ${isLight ? 'bg-amber-600' : 'bg-cyan-400'}`} />
                      </div>
                    </div>

                    <div className={`p-3 rounded-xl space-y-1 col-span-2 border ${
                      isLight ? 'bg-slate-100/60 border-slate-250/50' : 'bg-black/40 border border-slate-500/5'
                    }`}>
                      <div className="flex justify-between items-center text-4xs">
                        <span className={`uppercase font-black ${isLight ? 'text-slate-500' : 'text-slate-500'}`}>Waraseoni Central Lab Hardware Utilization</span>
                        <span className={`font-bold ${isLight ? 'text-amber-700' : 'text-amber-500'}`}>92% Load</span>
                      </div>
                      <span className={`text-sm font-bold block mt-1 ${isLight ? 'text-slate-900' : 'text-white'}`}>16 Workstations Engaged</span>
                      <div className={`h-1 w-full rounded mt-1.5 overflow-hidden ${isLight ? 'bg-slate-200' : 'bg-[#111]'}`}>
                        <div className="h-full bg-gradient-to-r from-amber-500 to-red-500 w-[92%]" />
                      </div>
                    </div>
                  </div>
                </div>

              </div>

              {/* Detailed Performance Metric counters */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-left">
                
                <div className={`p-4 rounded-xl border ${isLight ? 'bg-slate-50/50 border-slate-200' : 'border-cyan-500/5 bg-[#111]/30'}`}>
                  <span className={`text-[10px] font-mono block uppercase font-bold ${isLight ? 'text-slate-500' : 'text-slate-550'}`}>Users Directory</span>
                  <span className={`text-sm font-black font-mono mt-1.5 block ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    {students.length} Students
                  </span>
                  <span className={`text-4xs font-mono block mt-0.5 ${isLight ? 'text-amber-800' : 'text-cyan-400'}`}>
                    {trainersList.length} Authenticated Instructors
                  </span>
                </div>

                <div className={`p-4 rounded-xl border ${isLight ? 'bg-slate-50/50 border-slate-200' : 'border-cyan-500/5 bg-[#111]/30'}`}>
                  <span className={`text-[10px] font-mono block uppercase font-bold ${isLight ? 'text-slate-500' : 'text-slate-550'}`}>Content Exhibition</span>
                  <span className={`text-sm font-black font-mono mt-1.5 block ${isLight ? 'text-amber-800' : 'text-[#22d3ee]'}`}>
                    {DakshyamDatabase.getVideos().length} Video Walkthroughs
                  </span>
                  <span className={`text-4xs font-mono block mt-0.5 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                    {galleryList.length} Captioned Gallery Showcase Items
                  </span>
                </div>

                <div className={`p-4 rounded-xl border ${isLight ? 'bg-slate-50/50 border-slate-200' : 'border-cyan-500/5 bg-[#111]/30'}`}>
                  <span className={`text-[10px] font-mono block uppercase font-bold ${isLight ? 'text-slate-500' : 'text-slate-550'}`}>Vocational Registry</span>
                  <span className={`text-sm font-black font-mono mt-1.5 block ${isLight ? 'text-emerald-700' : 'text-emerald-400'}`}>
                    {specialProgCount} Training Camps
                  </span>
                  <span className={`text-4xs font-mono block mt-0.5 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                    {specialEnrollsCount} Registered Candidates
                  </span>
                </div>

                <div className={`p-4 rounded-xl border ${isLight ? 'bg-slate-50/50 border-slate-200' : 'border-cyan-500/5 bg-[#111]/30'}`}>
                  <span className={`text-[10px] font-mono block uppercase font-bold ${isLight ? 'text-slate-500' : 'text-slate-550'}`}>Credentials Issued</span>
                  <span className={`text-sm font-black font-mono mt-1.5 block ${isLight ? 'text-amber-600' : 'text-yellow-500'}`}>
                    {certCount} Verified Certificates
                  </span>
                  <span className={`text-4xs font-mono block mt-0.5 ${isLight ? 'text-slate-650' : 'text-slate-400'}`}>
                    {applications.length > 0 ? Math.round((approvedCount / applications.length) * 100) : 0}% Admission Rate
                  </span>
                </div>

              </div>

            </div>
          );
        })()}

        {/* TAB 2: COURSE ARCHITECT */}
        {adminTab === 'courses' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Publisher Form */}
            <form onSubmit={handleCreateCourse} className="space-y-3.5">
              <h3 className={`text-xs font-bold tracking-wider uppercase border-b pb-2 ${
                isLight ? 'text-amber-800 border-slate-200' : 'text-white border-cyan-500/5'
              }`}>
                Configure New Syllabus Course
              </h3>

              {courseError && <div className="text-3xs font-mono text-red-400 bg-red-950/25 p-2 rounded-xl">{courseError}</div>}
              {courseSuccess && <div className="text-3xs font-mono text-cyan-400 bg-cyan-950/25 p-2 rounded-xl font-bold">{courseSuccess}</div>}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={`block text-[9px] font-mono uppercase mb-1 ${isLight ? 'text-amber-800/90' : 'text-cyan-400'}`}>Course Title</label>
                  <input
                    type="text"
                    required
                    value={courseTitle}
                    onChange={(e) => setCourseTitle(e.target.value)}
                    placeholder="e.g. Django API Systems"
                    className={`w-full border rounded-xl px-3 py-2 text-xs focus:outline-none transition-all ${
                      isLight 
                        ? 'bg-slate-50 border-slate-250 text-slate-800 focus:border-amber-500/50 placeholder:text-slate-450' 
                        : 'bg-[#111]/80 border-cyan-500/10 text-white focus:border-cyan-45'
                    }`}
                  />
                </div>

                <div>
                  <label className={`block text-[9px] font-mono uppercase mb-1 ${isLight ? 'text-amber-800/90' : 'text-cyan-400'}`}>Duration Block</label>
                  <input
                    type="text"
                    required
                    value={courseDuration}
                    onChange={(e) => setCourseDuration(e.target.value)}
                    placeholder="e.g. 1 Week"
                    className={`w-full border rounded-xl px-3 py-2 text-xs focus:outline-none transition-all ${
                      isLight 
                        ? 'bg-slate-50 border-slate-250 text-slate-800 focus:border-amber-500/50 placeholder:text-slate-450' 
                        : 'bg-[#111]/80 border-cyan-500/10 text-white focus:border-cyan-45'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className={`block text-[9px] font-mono uppercase mb-1 ${isLight ? 'text-amber-800/90' : 'text-cyan-400'}`}>Description summary</label>
                <textarea
                  required
                  value={courseDesc}
                  onChange={(e) => setCourseDesc(e.target.value)}
                  placeholder="Master logical flows and database schemas..."
                  rows={2}
                  className={`w-full border rounded-xl px-3 py-2 text-xs focus:outline-none transition-all ${
                    isLight 
                      ? 'bg-slate-50 border-slate-250 text-slate-800 focus:border-amber-500/50 placeholder:text-slate-450' 
                      : 'bg-[#111]/80 border-cyan-500/10 text-white focus:border-cyan-45'
                  }`}
                />
              </div>

              <div>
                <label className={`block text-[9px] font-mono uppercase mb-0.5 ${isLight ? 'text-amber-800/90' : 'text-cyan-400'}`}>Tags (Comma-separated)</label>
                <input
                  type="text"
                  value={courseTags}
                  onChange={(e) => setCourseTags(e.target.value)}
                  placeholder="NEP Aligned, Python, HTML5, Scratch"
                  className={`w-full border rounded-xl px-3 py-2 text-xs focus:outline-none transition-all ${
                    isLight 
                      ? 'bg-slate-50 border-slate-250 text-slate-800 focus:border-amber-500/50 placeholder:text-slate-450' 
                      : 'bg-[#111]/80 border-cyan-500/10 text-white focus:border-cyan-45'
                  }`}
                />
              </div>

              <div>
                <label className={`block text-[9px] font-mono uppercase mb-0.5 ${isLight ? 'text-amber-800/90' : 'text-cyan-400'}`}>Core Features (Comma-separated)</label>
                <input
                  type="text"
                  value={courseFeatures}
                  onChange={(e) => setCourseFeatures(e.target.value)}
                  placeholder="1-Week setup, Free laptop leasing, Microcontroller boards"
                  className={`w-full border rounded-xl px-3 py-2 text-xs focus:outline-none transition-all ${
                    isLight 
                      ? 'bg-slate-50 border-slate-250 text-slate-800 focus:border-amber-500/50 placeholder:text-slate-450' 
                      : 'bg-[#111]/80 border-cyan-500/10 text-white focus:border-cyan-45'
                  }`}
                />
              </div>

              <div className="flex items-center gap-2 select-none">
                <input
                  type="checkbox"
                  id="hardware"
                  checked={mobHardware}
                  onChange={(e) => setMobHardware(e.target.checked)}
                  className={`rounded focus:ring-opacity-20 ${
                    isLight 
                      ? 'border-slate-350 text-amber-700 focus:ring-amber-500' 
                      : 'border-cyan-500/15 text-cyan-500 focus:ring-cyan-500'
                  }`}
                />
                <label htmlFor="hardware" className={`text-3xs font-mono cursor-pointer ${isLight ? 'text-slate-600 font-semibold' : 'text-slate-350'}`}>
                  Includes free mobile computer hardware leasing support
                </label>
              </div>

              <button
                type="submit"
                className={`w-full font-bold text-xs py-2.5 rounded-xl cursor-pointer uppercase tracking-wider font-mono shadow-xs transition-all ${
                  isLight 
                    ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-600/10' 
                    : 'bg-cyan-500 hover:bg-cyan-440 text-slate-950 shadow-[0_0_12px_rgba(34,211,238,0.1)]'
                }`}
              >
                Publish New Course
              </button>
            </form>

            {/* List and delete */}
            <div className="space-y-4">
              <h3 className={`text-xs font-bold tracking-wider uppercase border-b pb-2 ${
                isLight ? 'text-amber-800 border-slate-200' : 'text-white border-cyan-500/5'
              }`}>
                Live Catalog Operations ({courses.length})
              </h3>

              <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                {courses.map(course => (
                  <div 
                    key={course.id}
                    className={`p-3.5 rounded-xl border transition-all flex items-center justify-between ${
                      isLight 
                        ? 'bg-slate-50/50 border-slate-200 hover:border-amber-500/15' 
                        : 'bg-[#111]/40 border border-cyan-500/5 hover:border-cyan-500/12'
                    }`}
                  >
                    <div className="text-left space-y-0.5">
                      <h4 className={`text-2xs font-extrabold uppercase ${isLight ? 'text-slate-800' : 'text-white'}`}>{course.title}</h4>
                      <div className="flex gap-2 items-center text-[10px] font-mono">
                        <span className={`font-bold ${isLight ? 'text-amber-700' : 'text-[#22d3ee]/80'}`}>{course.duration}</span>
                        {course.mobileHardwareIncluded && (
                          <span className={`text-nowrap font-bold ${isLight ? 'text-emerald-700' : 'text-emerald-400'}`}>★ LEASED SYSTEMS</span>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeleteCourse(course.id)}
                      className={`p-2 rounded-xl transition-all cursor-pointer border ${
                        isLight 
                          ? 'bg-red-50 border-red-200 text-red-600 hover:bg-red-100 hover:text-red-700' 
                          : 'bg-red-950/20 border border-red-500/15 text-red-400 hover:bg-red-950/40 hover:text-red-300'
                      }`}
                      title="Permanently Delete Course"
                    >
                      <Trash className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* TAB 3: APPLICATIONS MANAGEMENT */}
        {adminTab === 'applications' && (
          <div className="space-y-4">
            <h3 className={`text-xs font-bold tracking-wider uppercase border-b pb-2 ${
              isLight ? 'text-amber-800 border-slate-200' : 'text-white border-cyan-500/5'
            }`}>
              Syllabus Registrations Desk
            </h3>

            <div className="space-y-3">
              {applications.length > 0 ? (
                applications.map((app, aIdx) => {
                  const matchCourse = courses.find(c => c.id === app.courseId);
                  
                  return (
                    <div 
                      key={app.id ? `${app.id}-${aIdx}` : `app-${aIdx}`}
                      className={`p-4 rounded-xl border transition-all text-left flex flex-col md:flex-row justify-between items-start md:items-center gap-4 animate-fadeIn ${
                        isLight 
                          ? 'bg-slate-50 border-slate-200 hover:border-amber-500/15 shadow-3xs' 
                          : 'bg-[#111]/45 border border-cyan-500/5 hover:border-cyan-500/15'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className={`text-xs font-black ${isLight ? 'text-slate-800' : 'text-white'}`}>{app.fullName}</h4>
                          <span className="text-[10px] font-mono text-slate-500">[{app.id}]</span>
                        </div>
                        <div className={`text-3xs font-mono uppercase tracking-wider font-bold block ${
                          isLight ? 'text-amber-700' : 'text-[#22d3ee]'
                        }`}>
                          Applied For: {matchCourse ? matchCourse.title : 'General Stream'}
                        </div>
                        <div className={`text-3xs space-y-0.5 leading-relaxed ${isLight ? 'text-slate-600' : 'text-slate-450'}`}>
                          <div>Institution node: <strong className={isLight ? 'text-slate-800 font-bold' : 'text-slate-350'}>{app.institution}</strong></div>
                          <div>WhatsApp: {app.phone} • Email registry key: {app.email}</div>
                        </div>
                      </div>

                      <div className="flex gap-2 self-stretch md:self-auto justify-end">
                        {app.status === 'pending' ? (
                          <>
                            <button
                              onClick={() => handleUpdateAppStatus(app.id, 'rejected')}
                              className={`text-3xs font-mono font-black bg-transparent border px-3.5 py-2 rounded-xl cursor-pointer uppercase transition-all ${
                                isLight 
                                  ? 'border-red-300 text-red-650 hover:bg-red-50' 
                                  : 'border-red-500/30 text-red-400 hover:bg-red-500/10'
                              }`}
                            >
                              Reject
                            </button>
                            <button
                              onClick={() => handleUpdateAppStatus(app.id, 'approved')}
                              className={`text-3xs font-mono font-black border px-3.5 py-2 rounded-xl cursor-pointer flex items-center gap-1 uppercase transition-all ${
                                isLight 
                                  ? 'border-amber-500/30 text-amber-800 bg-amber-50/50 hover:bg-amber-600 hover:text-white' 
                                  : 'border-cyan-500/25 text-white bg-cyan-950/40 hover:bg-cyan-500 hover:text-slate-950'
                              }`}
                            >
                              <Check className="w-3 h-3" /> Approve
                            </button>
                          </>
                        ) : (
                          <span className={`text-[9px] font-mono tracking-widest uppercase font-black px-3 py-1.5 rounded-full border ${
                            app.status === 'approved' 
                              ? (isLight ? 'border-emerald-300 bg-emerald-50 text-emerald-800' : 'border-cyan-400/25 bg-cyan-500/5 text-cyan-400') 
                              : (isLight ? 'border-red-300 bg-red-50 text-red-700' : 'border-red-400/25 bg-red-500/5 text-red-400')
                          }`}>
                            {app.status}
                          </span>
                        )}
                      </div>

                    </div>
                  );
                })
              ) : (
                <div className={`text-xs font-mono italic text-center py-8 ${isLight ? 'text-slate-500' : 'text-slate-550'}`}>
                  No applicants registered in DB.
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 4: VERIFY TRAINERS (ADMIN RIGHTS TO APPROVE TRAINER ID FIRST) */}
        {adminTab === 'trainers' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-left border-b pb-3 border-slate-200 dark:border-cyan-500/10">
              <div className="space-y-1">
                <h3 className={`text-xs font-bold tracking-wider uppercase ${
                  isLight ? 'text-amber-800' : 'text-white'
                }`}>
                  Trainer ID Verification & Provisioning Desk
                </h3>
                <p className={`text-3xs leading-relaxed max-w-xl ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                  Authorize newly registered Trainer profiles or directly provision new faculty accounts for workshop sessions and student grading.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setAdminTab('accounts')}
                className={`px-3.5 py-2 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer shrink-0 transition-all ${
                  isLight ? 'bg-blue-950 hover:bg-blue-900 text-white shadow-xs' : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black'
                }`}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Create Trainer</span>
              </button>
            </div>

            <div className="space-y-3">
              {trainersList.map((trn, idx) => (
                <div 
                  key={trn.id ? `${trn.id}-${idx}` : `trn-${idx}`}
                  className={`p-4 rounded-xl border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 text-left animate-fadeIn ${
                    isLight 
                      ? 'bg-slate-50 border-slate-200 hover:border-amber-500/15 shadow-3xs' 
                      : 'bg-[#111]/45 border border-cyan-500/5'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className={`text-xs font-black ${isLight ? 'text-slate-800' : 'text-white'}`}>{trn.name}</h4>
                      <span className="text-[10px] font-mono text-slate-500">[{trn.id}]</span>
                    </div>
                    <div className={`text-3xs font-mono ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>Email: {trn.email} • Created: {trn.createdAt}</div>
                  </div>

                  <div className="flex items-center gap-2.5">
                    {!trn.isApproved ? (
                      <>
                        <span className={`text-[9px] font-mono font-bold border px-2.5 py-1.5 rounded-lg uppercase ${
                          isLight 
                            ? 'border-amber-300 text-amber-800 bg-amber-50' 
                            : 'border-amber-500/10 bg-amber-500/5 text-amber-500'
                        }`}>
                          ⚠ PENDING APPROVAL
                        </span>
                        <button
                          onClick={() => handleApproveTrainer(trn.id)}
                          className={`text-3xs font-mono font-black px-3.5 py-1.5 rounded-lg cursor-pointer uppercase transition-all ${
                            isLight 
                              ? 'bg-amber-600 hover:bg-amber-700 text-white' 
                              : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950'
                          }`}
                        >
                          ✓ Grant ID Access
                        </button>
                      </>
                    ) : (
                      <span className={`text-[9px] font-mono font-black border px-2.5 py-1.5 rounded-lg uppercase flex items-center gap-1 ${
                        isLight 
                          ? 'border-emerald-300 bg-emerald-50 text-emerald-800' 
                          : 'border-emerald-500/15 bg-emerald-500/5 text-emerald-400'
                      }`}>
                        <ShieldCheck className={`w-3.5 h-3.5 ${isLight ? 'text-emerald-750' : 'text-emerald-400'}`} /> FULL MEMBERSHIP GRANTED
                      </span>
                    )}

                    {/* Delete except default Vivek Mathur for demo stability */}
                    {trn.id !== 'usr-t1' && (
                      <button
                        onClick={() => handleDeleteTrainer(trn.id)}
                        className={`p-1.5 transition-colors cursor-pointer ${
                          isLight ? 'text-slate-400 hover:text-red-650' : 'text-slate-500 hover:text-red-400'
                        }`}
                        title="Remove Trainer Profile"
                      >
                        <Trash className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB: WORKSHOPS DIRECTORY CRUD CONSOLE */}
        {adminTab === 'workshops' && (
          <WorkshopDirectoryManager
            userRole="admin"
            currentUserEmail="admin@dakshyam.com"
            currentTrainerName="Dakshyam Administration"
            theme={theme}
            onRefresh={onRefresh}
          />
        )}

        {/* TAB 5: BANNER PROMOTIONS MANAGEMENT */}
        {adminTab === 'promotions' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Banner Form */}
            <form onSubmit={handleCreateBanner} className="space-y-3.5">
              <h3 className={`text-xs font-bold tracking-wider uppercase border-b pb-2 ${
                isLight ? 'text-amber-800 border-slate-200' : 'text-white border-cyan-500/5'
              }`}>
                Launch Carousel Banner Advertisement
              </h3>

              {bannerError && <div className="text-3xs font-mono text-red-400 bg-red-950/25 p-2 rounded-xl">{bannerError}</div>}
              {bannerSuccess && <div className="text-3xs font-mono text-cyan-400 bg-cyan-950/25 p-2 rounded-xl font-bold">{bannerSuccess}</div>}

              <div>
                <label className={`block text-[9px] font-mono uppercase mb-1 ${isLight ? 'text-amber-800/90' : 'text-cyan-400'}`}>Banner Title (Primary Topic)</label>
                <input
                  type="text"
                  required
                  value={bannerTitle}
                  onChange={(e) => setBannerTitle(e.target.value)}
                  placeholder="e.g. NEP 2020 Programming camps open"
                  className={`w-full border rounded-xl px-3 py-2 text-xs focus:outline-none transition-all ${
                    isLight 
                      ? 'bg-slate-50 border-slate-250 text-slate-800 focus:border-amber-500/50 placeholder:text-slate-450' 
                      : 'bg-[#111]/80 border-cyan-500/10 text-white focus:border-cyan-45'
                  }`}
                />
              </div>

              <div>
                <label className={`block text-[9px] font-mono uppercase mb-1 ${isLight ? 'text-amber-800/90' : 'text-cyan-400'}`}>Subtitle / Slogan description</label>
                <textarea
                  required
                  value={bannerSubtitle}
                  onChange={(e) => setBannerSubtitle(e.target.value)}
                  placeholder="Active block coding camps provided directly to local classes..."
                  rows={2}
                  className={`w-full border rounded-xl px-3 py-2 text-xs focus:outline-none transition-all ${
                    isLight 
                      ? 'bg-slate-50 border-slate-250 text-slate-800 focus:border-amber-500/50 placeholder:text-slate-450' 
                      : 'bg-[#111]/80 border-cyan-500/10 text-white focus:border-cyan-45'
                  }`}
                />
              </div>

              <div>
                <label className={`block text-[9px] font-mono uppercase mb-1 ${isLight ? 'text-amber-800/90' : 'text-cyan-400'}`}>Public Display Image URL</label>
                <input
                  type="url"
                  required
                  value={bannerImageUrl}
                  onChange={(e) => setBannerImageUrl(e.target.value)}
                  placeholder="Paste Unsplash or static picture URL"
                  className={`w-full border rounded-xl px-3 py-2 text-xs focus:outline-none transition-all ${
                    isLight 
                      ? 'bg-slate-50 border-slate-250 text-slate-800 focus:border-amber-500/50 placeholder:text-slate-450' 
                      : 'bg-[#111]/80 border-cyan-500/10 text-white focus:border-cyan-45'
                  }`}
                />
                <span className={`text-[8px] block mt-0.5 font-mono ${isLight ? 'text-slate-500' : 'text-slate-500'}`}>
                  Curated Unsplash suggestions: <code className={isLight ? 'bg-slate-100 text-amber-900 px-1 py-0.5 rounded' : 'text-cyan-400'}>https://images.unsplash.com/photo-1516321318423-f06f85e504b3</code>
                </span>
              </div>

              <div>
                <label className={`block text-[9px] font-mono uppercase mb-1 ${isLight ? 'text-amber-800/90' : 'text-cyan-400'}`}>Redirect Navigation Anchor (Optional)</label>
                <input
                  type="text"
                  value={bannerActionUrl}
                  onChange={(e) => setBannerActionUrl(e.target.value)}
                  placeholder="e.g. #services"
                  className={`w-full border rounded-xl px-3 py-2 text-xs focus:outline-none transition-all ${
                    isLight 
                      ? 'bg-slate-50 border-slate-250 text-slate-800 focus:border-amber-500/50 placeholder:text-slate-450' 
                      : 'bg-[#111]/80 border-cyan-500/10 text-white focus:border-cyan-45'
                  }`}
                />
              </div>

              <button
                type="submit"
                className={`w-full font-bold text-xs py-2.5 rounded-xl cursor-pointer uppercase tracking-wider font-mono shadow-xs transition-all ${
                  isLight 
                    ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-600/10' 
                    : 'bg-cyan-500 hover:bg-cyan-440 text-slate-950 shadow-[0_0_12px_rgba(34,211,238,0.1)]'
                }`}
              >
                Launch Promo Banner
              </button>
            </form>

            {/* List and edit */}
            <div className="space-y-4">
              <h3 className={`text-xs font-bold tracking-wider uppercase border-b pb-2 ${
                isLight ? 'text-amber-800 border-slate-200' : 'text-white border-cyan-500/5'
              }`}>
                Active Promo Carousels ({bannersList.length})
              </h3>

              <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                {bannersList.map((b, idx) => (
                  <div 
                    key={b.id ? `${b.id}-${idx}` : `banner-${idx}`}
                    className={`p-3 rounded-xl border flex items-center justify-between gap-3 text-left animate-fadeIn ${
                      isLight 
                        ? 'bg-slate-50 border-slate-200 hover:border-amber-500/15 shadow-3xs' 
                        : 'bg-[#111]/45 border border-cyan-500/5'
                    }`}
                  >
                    <div className={`w-12 h-10 rounded overflow-hidden shrink-0 ${isLight ? 'bg-slate-200' : 'bg-slate-900'}`}>
                      <img src={b.imageUrl} alt="" className="w-full h-full object-cover" />
                    </div>
                    
                    <div className="flex-1 min-w-0 space-y-0.5">
                      <h4 className={`text-3xs font-extrabold uppercase truncate ${isLight ? 'text-slate-800' : 'text-white'}`}>{b.title}</h4>
                      <p className={`text-[9px] truncate leading-relaxed ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>{b.subtitle}</p>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleToggleBanner(b.id)}
                        className={`p-1 rounded-lg border transition-all cursor-pointer ${
                          b.isActive 
                            ? (isLight ? 'border-amber-500/30 text-amber-800 bg-amber-50' : 'border-cyan-500/20 text-[#22d3ee] bg-cyan-950/20') 
                            : (isLight ? 'border-transparent text-slate-400 hover:text-slate-600' : 'border-transparent text-slate-500 hover:text-slate-350')
                        }`}
                        title={b.isActive ? "Deactivate advertisement" : "Activate advertisement"}
                      >
                        {b.isActive ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteBanner(b.id)}
                        className={`p-1 rounded-lg transition-colors cursor-pointer ${
                          isLight ? 'text-slate-400 hover:text-red-650' : 'text-slate-500 hover:text-red-400'
                        }`}
                        title="Delete Banner"
                      >
                        <Trash className="w-4 h-4" />
                      </button>
                    </div>

                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* TAB 6: CAPTIONED PROJECT IMAGE GALLERY & INNOVATION EXHIBITION VIDEOS */}
        {adminTab === 'gallery' && (
          <div className="space-y-6">
            
            {/* Sub-Panel Switcher */}
            <div className={`flex flex-wrap items-center justify-between gap-3 border-b pb-3 ${
              isLight ? 'border-slate-200' : 'border-cyan-500/10'
            }`}>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setExhibitionMode('photos')}
                  className={`px-4 py-2 rounded-xl font-mono text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                    exhibitionMode === 'photos'
                      ? (isLight ? 'bg-amber-600 text-white shadow-xs' : 'bg-cyan-500 text-slate-950 font-black shadow-[0_0_12px_rgba(34,211,238,0.25)]')
                      : (isLight ? 'bg-slate-100 text-slate-700 hover:bg-slate-200' : 'bg-[#111] text-slate-400 hover:text-white')
                  }`}
                >
                  <ImageIcon className="w-4 h-4" />
                  <span>📸 Event Photo Snapshots ({galleryList.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setExhibitionMode('videos')}
                  className={`px-4 py-2 rounded-xl font-mono text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                    exhibitionMode === 'videos'
                      ? (isLight ? 'bg-amber-600 text-white shadow-xs' : 'bg-cyan-500 text-slate-950 font-black shadow-[0_0_12px_rgba(34,211,238,0.25)]')
                      : (isLight ? 'bg-slate-100 text-slate-700 hover:bg-slate-200' : 'bg-[#111] text-slate-400 hover:text-white')
                  }`}
                >
                  <Video className="w-4 h-4" />
                  <span>🎬 Project Videos (Up to 2 Min) ({videosList.length})</span>
                </button>
              </div>

              <span className={`text-[9px] font-mono font-bold uppercase ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                {exhibitionMode === 'photos' ? 'Batch Image Multi-Uploader' : 'Video Duration Limit: 120 Seconds (2 Min)'}
              </span>
            </div>

            {exhibitionMode === 'photos' ? (
              /* --- SUB-MODE A: PHOTO SNAPSHOTS --- */
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Gallery Upload Form */}
                <form onSubmit={handleCreateGalleryImage} className="space-y-3.5 font-sans">
                  <h3 className={`text-xs font-bold tracking-wider uppercase border-b pb-2 ${
                    isLight ? 'text-amber-800 border-slate-200' : 'text-white border-cyan-500/5'
                  }`}>
                    Post Photo snapshot to Public Exhibition
                  </h3>

                  {galError && <div className="text-3xs font-mono text-red-400 bg-red-950/25 p-2 rounded-xl">{galError}</div>}
                  {galSuccess && <div className="text-3xs font-mono text-cyan-400 bg-cyan-950/25 p-2 rounded-xl font-bold">{galSuccess}</div>}

                  <div>
                    <label className={`block text-[9px] font-mono uppercase mb-1 ${isLight ? 'text-amber-800/90' : 'text-cyan-400'}`}>Event Snapshot Title</label>
                    <input
                      type="text"
                      required
                      value={galTitle}
                      onChange={(e) => setGalTitle(e.target.value)}
                      placeholder="e.g. Waraseoni School IT Delivery"
                      className={`w-full border rounded-xl px-3 py-2 text-xs focus:outline-none transition-all ${
                        isLight 
                          ? 'bg-slate-50 border-slate-250 text-slate-800 focus:border-amber-500/50 placeholder:text-slate-450' 
                          : 'bg-[#111]/80 border-cyan-500/10 text-white focus:border-cyan-45'
                      }`}
                    />
                  </div>

                  <div>
                    <label className={`block text-[9px] font-mono uppercase mb-1 ${isLight ? 'text-amber-800/90' : 'text-cyan-400'}`}>Image Description (Contextual Caption)</label>
                    <textarea
                      required
                      value={galDesc}
                      onChange={(e) => setGalDesc(e.target.value)}
                      placeholder="Details on active training setups, logical loops designed, or hardware used..."
                      rows={2}
                      className={`w-full border rounded-xl px-3 py-2 text-xs focus:outline-none transition-all ${
                        isLight 
                          ? 'bg-slate-50 border-slate-250 text-slate-800 focus:border-amber-500/50 placeholder:text-slate-450' 
                          : 'bg-[#111]/80 border-cyan-500/10 text-white focus:border-cyan-45'
                      }`}
                    />
                  </div>

                  <div className="space-y-2.5">
                    <label className={`block text-[9px] font-mono uppercase mb-1 ${isLight ? 'text-amber-800/90' : 'text-cyan-400'}`}>
                      Exhibition Photo Upload (Upload Single or Multiple Images)
                    </label>
                    
                    {/* Multi-Photo File Picker */}
                    <div className={`p-3 rounded-xl border border-dashed transition-all ${
                      isLight 
                        ? 'border-amber-300 bg-amber-50/50 hover:bg-amber-50' 
                        : 'border-cyan-500/30 bg-[#071326]/50 hover:bg-cyan-950/20'
                    }`}>
                      <div className="flex flex-col sm:flex-row items-center gap-3">
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={handleGalFileUpload}
                          disabled={isUploadingGalImage}
                          className={`block w-full text-4xs cursor-pointer file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-3xs file:font-bold disabled:opacity-50 ${
                            isLight 
                              ? 'text-slate-600 file:bg-amber-600 file:text-white hover:file:bg-amber-700' 
                              : 'text-slate-300 file:bg-cyan-500 file:text-slate-950 hover:file:bg-cyan-400'
                          }`}
                        />
                      </div>

                      {isUploadingGalImage && (
                        <div className="mt-2.5 flex items-center gap-2 p-2 rounded-lg bg-cyan-950/40 border border-cyan-500/20">
                          <div className="w-3.5 h-3.5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin shrink-0" />
                          <span className="text-3xs font-mono text-cyan-300 animate-pulse">
                            {galUploadProgress || 'Uploading images...'}
                          </span>
                        </div>
                      )}

                      <p className="text-[8px] font-mono text-slate-400 mt-2">
                        💡 Tip: You can select multiple photos at once. JPEG, PNG, and WebP are supported.
                      </p>
                    </div>

                    {/* Staged Uploaded Images List with Thumbnails and Remove Button */}
                    {uploadedGalImages.length > 0 && (
                      <div className="space-y-1.5 pt-1">
                        <div className="flex items-center justify-between text-3xs font-mono text-cyan-400 font-bold">
                          <span>Staged Photos Ready to Publish ({uploadedGalImages.length}):</span>
                          <button
                            type="button"
                            onClick={() => setUploadedGalImages([])}
                            className="text-red-400 hover:text-red-300 cursor-pointer text-4xs uppercase"
                          >
                            Clear All
                          </button>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-1">
                          {uploadedGalImages.map((img, idx) => (
                            <div 
                              key={idx} 
                              className={`relative group rounded-lg overflow-hidden border p-1 flex items-center gap-2 ${
                                isLight ? 'bg-white border-slate-200' : 'bg-slate-900/80 border-cyan-500/20'
                              }`}
                            >
                              <img 
                                src={img.url} 
                                alt={img.name} 
                                className="w-10 h-10 object-cover rounded shrink-0"
                                referrerPolicy="no-referrer"
                              />
                              <div className="min-w-0 flex-1">
                                <p className="text-4xs font-mono truncate text-slate-300">{img.name || `Photo ${idx + 1}`}</p>
                                <span className="text-[8px] font-mono text-emerald-400">✓ Ready</span>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleRemoveUploadedGalImage(idx)}
                                className="p-1 rounded bg-red-950/80 text-red-400 hover:text-red-200 cursor-pointer text-3xs shrink-0"
                                title="Remove photo"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Optional Image URL Input */}
                    <div className="pt-1 space-y-1.5">
                      <div className="text-[8px] font-mono text-slate-400 flex items-center gap-2">
                        <span>Optional: Or paste direct photo URL (Leave blank if you uploaded files above):</span>
                      </div>

                      <input
                        type="url"
                        value={galImageUrl}
                        onChange={(e) => setGalImageUrl(e.target.value)}
                        placeholder="https://... (Optional)"
                        className={`w-full border rounded-xl px-3 py-2 text-xs focus:outline-none transition-all ${
                          isLight 
                            ? 'bg-slate-50 border-slate-250 text-slate-800 focus:border-amber-500/50 placeholder:text-slate-455' 
                            : 'bg-[#111]/80 border-cyan-500/10 text-white focus:border-cyan-45 placeholder:text-slate-500'
                        }`}
                      />

                      {galImageUrl && (
                        <div className="flex items-center gap-2 pt-1">
                          <img 
                            src={galImageUrl} 
                            alt="Exhibition preview" 
                            className="w-12 h-12 object-cover rounded-lg border border-slate-500/20" 
                            referrerPolicy="no-referrer"
                          />
                          <span className="text-[9px] font-mono text-emerald-400 flex items-center gap-1">
                            ✓ Snapshot Image URL Loaded {galImageUrl.includes('cloudinary.com') ? '(Cloudinary Hosted)' : ''}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className={`block text-[9px] font-mono uppercase mb-1 ${isLight ? 'text-amber-800/90' : 'text-cyan-400'}`}>Program Classification Category</label>
                    <select
                      value={galCategory}
                      onChange={(e) => setGalCategory(e.target.value as any)}
                      className={`w-full border rounded-xl px-3 py-2.5 text-xs focus:outline-none transition-all ${
                        isLight 
                          ? 'bg-slate-50 border-slate-250 text-slate-800 focus:border-amber-500/50' 
                          : 'bg-[#111]/80 border border-cyan-500/10 text-white'
                      }`}
                    >
                      <option value="school_programs" className={isLight ? 'text-slate-800' : 'text-black'}>School Programs</option>
                      <option value="iot_robotics" className={isLight ? 'text-slate-800' : 'text-black'}>IoT & Computational Robotics</option>
                      <option value="mern_web" className={isLight ? 'text-slate-800' : 'text-black'}>Web & Django Engineering</option>
                      <option value="lab_setups" className={isLight ? 'text-slate-800' : 'text-black'}>Lab Setup Logistics</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    className={`w-full font-bold text-xs py-2.5 rounded-xl cursor-pointer uppercase tracking-wider font-mono shadow-xs transition-all ${
                      isLight 
                        ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-600/10' 
                        : 'bg-cyan-500 hover:bg-cyan-440 text-slate-950 shadow-[0_0_12px_rgba(34,211,238,0.1)]'
                    }`}
                  >
                    Publish Event Snapshot
                  </button>
                </form>

                {/* List snaps */}
                <div className="space-y-4">
                  <h3 className={`text-xs font-bold tracking-wider uppercase border-b pb-2 ${
                    isLight ? 'text-amber-800 border-slate-200' : 'text-white border-cyan-500/5'
                  }`}>
                    Live Snapshots Directory ({galleryList.length})
                  </h3>

                  <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                    {galleryList.map((g, idx) => (
                      <div 
                        key={g.id ? `${g.id}-${idx}` : `gal-${idx}`}
                        className={`p-3 rounded-xl border flex items-center justify-between gap-3 text-left animate-fadeIn ${
                          isLight 
                            ? 'bg-slate-50 border-slate-200 hover:border-amber-500/15 shadow-3xs' 
                            : 'bg-[#111]/45 border border-cyan-500/5'
                        }`}
                      >
                        <div className={`w-14 h-11 rounded overflow-hidden shrink-0 ${isLight ? 'bg-slate-200' : 'bg-slate-900'}`}>
                          <img src={g.imageUrl} alt="" className="w-full h-full object-cover" />
                        </div>

                        <div className="flex-1 min-w-0 space-y-0.5">
                          <h4 className={`text-3xs font-extrabold uppercase truncate ${isLight ? 'text-slate-800' : 'text-white'}`}>{g.title}</h4>
                          <p className={`text-[9px] uppercase font-mono tracking-wider ${isLight ? 'text-amber-750' : 'text-[#22d3ee]'}`}>{g.category.replace('_', ' ')}</p>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleDeleteGalleryImage(g.id)}
                          className={`p-1.5 rounded-lg transition-colors cursor-pointer shrink-0 ${
                            isLight ? 'text-slate-400 hover:text-red-650' : 'text-slate-500 hover:text-red-400'
                          }`}
                          title="Delete snapshot"
                        >
                          <Trash className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              /* --- SUB-MODE B: DAKSHYAM INNOVATIONS PROJECT VIDEOS (UP TO 2 MIN) --- */
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Video Upload Form */}
                <form onSubmit={handleCreateProjectVideo} className="space-y-3.5 font-sans">
                  <div className="border-b pb-2">
                    <h3 className={`text-xs font-bold tracking-wider uppercase ${
                      isLight ? 'text-amber-800' : 'text-white'
                    }`}>
                      🎬 Upload Dakshyam Innovations Project Video (Up to 2 Min)
                    </h3>
                    <p className={`text-[9px] font-mono mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                      Upload hardware demo clips, robotics trials, or IoT firmware demonstrations. Maximum duration: 120 seconds (2 mins).
                    </p>
                  </div>

                  {projVideoError && <div className="text-3xs font-mono text-red-400 bg-red-950/25 p-2.5 rounded-xl border border-red-500/20">{projVideoError}</div>}
                  {projVideoSuccess && <div className="text-3xs font-mono text-cyan-400 bg-cyan-950/25 p-2.5 rounded-xl font-bold border border-cyan-500/20">{projVideoSuccess}</div>}

                  <div>
                    <label className={`block text-[9px] font-mono uppercase mb-1 ${isLight ? 'text-amber-800/90' : 'text-cyan-400'}`}>
                      Project Title
                    </label>
                    <input
                      type="text"
                      required
                      value={projVideoTitle}
                      onChange={(e) => setProjVideoTitle(e.target.value)}
                      placeholder="e.g. ESP32 Autonomous Obstacle Avoiding Rover Test"
                      className={`w-full border rounded-xl px-3 py-2 text-xs focus:outline-none transition-all ${
                        isLight 
                          ? 'bg-slate-50 border-slate-250 text-slate-800 focus:border-amber-500/50' 
                          : 'bg-[#111]/80 border-cyan-500/10 text-white focus:border-cyan-45'
                      }`}
                    />
                  </div>

                  <div>
                    <label className={`block text-[9px] font-mono uppercase mb-1 ${isLight ? 'text-amber-800/90' : 'text-cyan-400'}`}>
                      Project Demonstration Description
                    </label>
                    <textarea
                      required
                      value={projVideoDesc}
                      onChange={(e) => setProjVideoDesc(e.target.value)}
                      placeholder="Explain the hardware architecture, sensors calibrated, logic controller, or test results..."
                      rows={2}
                      className={`w-full border rounded-xl px-3 py-2 text-xs focus:outline-none transition-all ${
                        isLight 
                          ? 'bg-slate-50 border-slate-250 text-slate-800 focus:border-amber-500/50' 
                          : 'bg-[#111]/80 border-cyan-500/10 text-white focus:border-cyan-45'
                      }`}
                    />
                  </div>

                  {/* Project Video File Picker with Duration Check */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className={`block text-[9px] font-mono uppercase ${isLight ? 'text-amber-800/90' : 'text-cyan-400'}`}>
                        Video Demonstration File (Max 2 Minutes)
                      </label>
                      {projVideoDuration !== null && (
                        <span className="text-[9px] font-mono font-bold text-emerald-400 flex items-center gap-1">
                          ✓ Duration: {Math.floor(projVideoDuration / 60)}m {Math.round(projVideoDuration % 60)}s / 2m Max
                        </span>
                      )}
                    </div>

                    <div className={`p-3.5 rounded-xl border border-dashed transition-all ${
                      isLight 
                        ? 'border-amber-300 bg-amber-50/50 hover:bg-amber-50' 
                        : 'border-cyan-500/30 bg-[#071326]/50 hover:bg-cyan-950/20'
                    }`}>
                      <input
                        type="file"
                        accept="video/mp4,video/webm,video/quicktime,video/*"
                        onChange={handleProjectVideoFileChange}
                        disabled={isUploadingProjVideo}
                        className={`block w-full text-4xs cursor-pointer file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-3xs file:font-bold disabled:opacity-50 ${
                          isLight 
                            ? 'text-slate-600 file:bg-amber-600 file:text-white hover:file:bg-amber-700' 
                            : 'text-slate-300 file:bg-cyan-500 file:text-slate-950 hover:file:bg-cyan-400'
                        }`}
                      />

                      {projVideoFileName && (
                        <div className="mt-2 text-3xs font-mono text-cyan-300 flex items-center gap-2">
                          <Film className="w-3.5 h-3.5" />
                          <span className="truncate">Selected: {projVideoFileName}</span>
                        </div>
                      )}

                      {/* Video Player Preview if loaded */}
                      {projVideoFileBase64 && (
                        <div className="mt-3 aspect-video w-full rounded-xl overflow-hidden bg-black border border-cyan-500/20">
                          <video 
                            src={projVideoFileBase64} 
                            controls 
                            playsInline 
                            className="w-full h-full object-contain"
                          />
                        </div>
                      )}

                      {isUploadingProjVideo && (
                        <div className="mt-3 p-2.5 rounded-xl bg-cyan-950/60 border border-cyan-500/30 space-y-1.5">
                          <div className="flex items-center justify-between text-3xs font-mono text-cyan-300 font-bold">
                            <span>{projVideoUploadProgress || 'Uploading project video...'}</span>
                            <div className="w-3.5 h-3.5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                          </div>
                          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                            <div className="bg-cyan-400 h-full animate-pulse w-3/4 rounded-full" />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Optional Video URL */}
                  <div className="space-y-1">
                    <label className="block text-[8px] font-mono text-slate-400 uppercase">
                      Or Direct Cloud Video URL (Optional fallback if file is already hosted):
                    </label>
                    <input
                      type="url"
                      value={projVideoUrl}
                      onChange={(e) => setProjVideoUrl(e.target.value)}
                      placeholder="https://... (Cloudinary, MP4, WebM)"
                      className={`w-full border rounded-xl px-3 py-2 text-xs focus:outline-none transition-all ${
                        isLight 
                          ? 'bg-slate-50 border-slate-250 text-slate-800 focus:border-amber-500/50' 
                          : 'bg-[#111]/80 border-cyan-500/10 text-white focus:border-cyan-45'
                      }`}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isUploadingProjVideo}
                    className={`w-full font-bold text-xs py-2.5 rounded-xl cursor-pointer uppercase tracking-wider font-mono shadow-xs transition-all disabled:opacity-50 flex items-center justify-center gap-2 ${
                      isLight 
                        ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-600/10' 
                        : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-[0_0_12px_rgba(34,211,238,0.2)]'
                    }`}
                  >
                    <Video className="w-4 h-4" />
                    <span>Publish Project Video (Up to 2 Min)</span>
                  </button>
                </form>

                {/* Published Videos List */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b pb-2">
                    <h3 className={`text-xs font-bold tracking-wider uppercase ${
                      isLight ? 'text-amber-800' : 'text-white'
                    }`}>
                      Published Exhibition Videos ({videosList.length})
                    </h3>
                    <span className="text-[9px] font-mono text-slate-400">Dakshyam Innovations Wall</span>
                  </div>

                  <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1 custom-scrollbar">
                    {videosList.length > 0 ? (
                      videosList.map((v) => (
                        <div 
                          key={v.id}
                          className={`p-3.5 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-left transition-all ${
                            isLight 
                              ? 'bg-slate-50 border-slate-200 hover:border-amber-500/20' 
                              : 'bg-[#111]/60 border-cyan-500/10 hover:border-cyan-500/30'
                          }`}
                        >
                          <div className="relative w-full sm:w-28 h-20 rounded-xl overflow-hidden bg-black shrink-0 border border-slate-700/30 group">
                            <video 
                              src={v.videoUrl} 
                              className="w-full h-full object-cover opacity-80" 
                              preload="metadata"
                            />
                            <button
                              type="button"
                              onClick={() => setActiveVideoModal(v.videoUrl)}
                              className="absolute inset-0 bg-black/40 hover:bg-black/20 flex items-center justify-center transition-colors cursor-pointer text-white"
                              title="Play Video"
                            >
                              <Play className="w-6 h-6 text-cyan-400 fill-cyan-400" />
                            </button>
                            <span className="absolute bottom-1 right-1 bg-black/80 text-[7.5px] font-mono text-cyan-300 px-1 rounded">
                              {v.duration ? `${Math.floor(v.duration / 60)}m ${v.duration % 60}s` : 'Video'}
                            </span>
                          </div>

                          <div className="flex-1 min-w-0 space-y-1">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[8px] font-mono font-bold px-1.5 py-0.5 rounded bg-blue-900/40 text-sky-300 border border-blue-500/20">
                                {v.groupName || 'Dakshyam Innovations'}
                              </span>
                              <span className="text-[8px] font-mono text-slate-400">{v.createdAt}</span>
                            </div>
                            <h4 className={`text-xs font-bold uppercase truncate ${isLight ? 'text-slate-800' : 'text-white'}`}>
                              {v.title}
                            </h4>
                            <p className={`text-[10px] line-clamp-1 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                              {v.description}
                            </p>
                          </div>

                          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                            <button
                              type="button"
                              onClick={() => setActiveVideoModal(v.videoUrl)}
                              className={`p-2 rounded-xl text-xs font-mono font-bold border transition-colors cursor-pointer flex items-center gap-1 ${
                                isLight ? 'bg-white border-slate-300 text-blue-950 hover:bg-blue-50' : 'bg-slate-900 border-cyan-500/20 text-cyan-300 hover:bg-cyan-950/40'
                              }`}
                              title="Play Video Preview"
                            >
                              <Play className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">Play</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDeleteProjectVideo(v.id)}
                              className={`p-2 rounded-xl transition-colors cursor-pointer text-red-400 hover:text-red-200 hover:bg-red-950/30 border border-transparent hover:border-red-500/20`}
                              title="Delete project video"
                            >
                              <Trash className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-10 font-mono text-slate-400 text-xs border border-dashed rounded-2xl p-6">
                        No Dakshyam Innovations project videos published yet. Upload your first 2-minute video on the left!
                      </div>
                    )}
                  </div>
                </div>

              </div>
            )}
          </div>
        )}

        {/* TAB 6B: DYNAMIC ACTIVE SESSIONS & DEVICE SECURITY TRACKER */}
        {adminTab === 'devices' && (
          <div className="space-y-6 text-left font-sans">
            
            {/* Header & Controls */}
            <div className={`p-5 rounded-2xl border flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0d1f38]/60 border-cyan-500/15'
            }`}>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                  </span>
                  <span className="font-mono text-3xs uppercase font-black tracking-widest text-emerald-400">
                    Dynamic Security Heartbeat Active
                  </span>
                </div>
                <h3 className={`text-base font-black uppercase tracking-wide ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  Admin Logged In on {activeSessions.length || 1} Device(s)
                </h3>
                <p className={`text-xs ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                  Real-time dynamic device registry tracks all active administrator logins across computers, laptops, and mobile devices.
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={fetchSessions}
                  disabled={sessionsLoading}
                  className={`px-3.5 py-2 rounded-xl font-mono text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
                    isLight ? 'bg-white border-slate-300 text-slate-800 hover:bg-slate-100' : 'bg-slate-900 border-cyan-500/20 text-cyan-300 hover:bg-cyan-950/40'
                  }`}
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${sessionsLoading ? 'animate-spin' : ''}`} />
                  <span>Refresh</span>
                </button>

                <button
                  type="button"
                  onClick={handleTerminateOtherSessions}
                  className="px-3.5 py-2 rounded-xl font-mono text-xs font-bold bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 text-red-400 transition-all cursor-pointer shadow-xs"
                >
                  Terminate Other Devices
                </button>
              </div>
            </div>

            {sessionActionMsg && (
              <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 font-mono text-xs">
                {sessionActionMsg}
              </div>
            )}

            {/* Device Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeSessions.map((sess, idx) => {
                const isMobile = sess.deviceType === 'Mobile';
                const isTablet = sess.deviceType === 'Tablet';

                return (
                  <div
                    key={sess.sessionId || idx}
                    className={`p-5 rounded-2xl border transition-all relative overflow-hidden flex flex-col justify-between space-y-4 ${
                      sess.isCurrent
                        ? (isLight ? 'bg-blue-50/70 border-blue-900/30 shadow-md ring-2 ring-blue-900/10' : 'bg-[#0d2240] border-cyan-400/50 shadow-[0_0_20px_rgba(34,211,238,0.15)] ring-1 ring-cyan-400/30')
                        : (isLight ? 'bg-white border-slate-200' : 'bg-[#071326]/60 border-slate-800')
                    }`}
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <div className={`p-2.5 rounded-xl border ${
                            sess.isCurrent
                              ? (isLight ? 'bg-blue-900 text-white border-blue-900' : 'bg-cyan-500/20 text-cyan-300 border-cyan-400/30')
                              : (isLight ? 'bg-slate-100 text-slate-700 border-slate-200' : 'bg-slate-900 text-slate-400 border-slate-800')
                          }`}>
                            {isMobile ? <Smartphone className="w-5 h-5" /> : isTablet ? <Monitor className="w-5 h-5" /> : <Laptop className="w-5 h-5" />}
                          </div>
                          <div>
                            <h4 className={`text-xs font-black uppercase tracking-wide ${isLight ? 'text-slate-900' : 'text-white'}`}>
                              {sess.deviceName || 'Admin Session Device'}
                            </h4>
                            <span className="text-[9px] font-mono text-slate-400">
                              {sess.os} • {sess.browser}
                            </span>
                          </div>
                        </div>

                        {sess.isCurrent ? (
                          <span className="text-[8px] font-mono font-black uppercase px-2.5 py-1 rounded-full bg-emerald-500 text-slate-950 tracking-wider shadow-sm flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-950 animate-ping" />
                            THIS DEVICE
                          </span>
                        ) : (
                          <span className="text-[8px] font-mono font-bold uppercase px-2 py-0.5 rounded-full bg-slate-500/20 text-slate-400 border border-slate-500/20">
                            REMOTE
                          </span>
                        )}
                      </div>

                      <div className={`p-3 rounded-xl border text-[9px] font-mono space-y-1 ${
                        isLight ? 'bg-slate-100/70 border-slate-200 text-slate-700' : 'bg-black/40 border-slate-800 text-slate-300'
                      }`}>
                        <div className="flex justify-between">
                          <span className="text-slate-400">IP Address:</span>
                          <span className="font-bold">{sess.ip && sess.ip !== '127.0.0.1' ? sess.ip : 'Client Gateway'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Session ID:</span>
                          <span className="truncate max-w-[160px] font-bold">{sess.sessionId}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Logged In:</span>
                          <span>{sess.createdAt ? new Date(sess.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recent'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Last Activity:</span>
                          <span className="text-emerald-400 font-bold">
                            {sess.isCurrent ? 'Active Now' : sess.lastActive ? new Date(sess.lastActive).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {!sess.isCurrent && (
                      <div className="pt-2 border-t border-slate-500/10 flex justify-end">
                        <button
                          type="button"
                          onClick={() => handleRevokeSession(sess.sessionId)}
                          className="px-3 py-1.5 rounded-lg text-[9px] font-mono font-bold text-red-400 hover:text-white bg-red-500/10 hover:bg-red-500/30 border border-red-500/20 transition-all cursor-pointer"
                        >
                          Revoke Access & Disconnect
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Video Preview Modal */}
        {activeVideoModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div 
              onClick={() => setActiveVideoModal(null)}
              className="absolute inset-0 bg-black/90 backdrop-blur-sm cursor-pointer"
            />
            <div className="relative z-10 max-w-3xl w-full bg-black rounded-2xl overflow-hidden border border-cyan-500/30 shadow-2xl">
              <div className="p-3 bg-slate-900 border-b border-slate-800 flex justify-between items-center text-white text-xs font-mono">
                <span>Dakshyam Innovations Exhibition Video Player</span>
                <button 
                  onClick={() => setActiveVideoModal(null)}
                  className="p-1 text-slate-400 hover:text-white cursor-pointer"
                >
                  ✕ Close
                </button>
              </div>
              <div className="aspect-video w-full bg-black">
                <video 
                  src={activeVideoModal} 
                  controls 
                  autoPlay 
                  playsInline 
                  className="w-full h-full object-contain"
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 7: SPECIAL TRAINING PROGRAMS & INTEGRATED CERTIFICATE ENGINE */}
        {adminTab === 'special_training' && (
          <div className="space-y-6 font-sans">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Part A: Registration Form Designer */}
              <div className={`rounded-2xl p-5 space-y-4 lg:col-span-1 border ${
                isLight ? 'bg-slate-50 border-slate-200 shadow-3xs' : 'bg-[#050505]/75 border-cyan-500/10'
              }`}>
                <div className={`border-b pb-2 ${isLight ? 'border-slate-200' : 'border-cyan-500/15'}`}>
                  <h3 className={`text-xs font-bold font-mono tracking-wider uppercase flex items-center gap-1 ${
                    isLight ? 'text-amber-850' : 'text-[#22d3ee]'
                  }`}>
                    <Plus className="w-4 h-4" /> Create Special Training form
                  </h3>
                  <p className={`text-[10px] mt-1 leading-relaxed ${isLight ? 'text-slate-605' : 'text-slate-400'}`}>
                    Designed for colleges & schools. Active listings will render secure student registration hubs on public dashboards instantly.
                  </p>
                </div>

                <form onSubmit={handleCreateSpecialProgram} className="space-y-3.5">
                  {specError && <p className="text-3xs text-red-400 bg-red-500/10 p-2.5 rounded-xl border border-red-500/15 font-mono text-center">{specError}</p>}
                  {specSuccess && <p className="text-3xs text-cyan-400 bg-cyan-500/10 p-2.5 rounded-xl border border-cyan-500/15 font-mono font-bold text-center">{specSuccess}</p>}

                  <div>
                    <label className={`block text-[9px] font-mono uppercase mb-1 ${isLight ? 'text-amber-800/90' : 'text-cyan-400'}`}>Training Program Name</label>
                    <input
                      type="text"
                      required
                      value={specName}
                      onChange={(e) => setSpecName(e.target.value)}
                      placeholder="e.g. Drone assembly workshop"
                      className={`w-full border rounded-xl px-3 py-2 text-xs focus:outline-none transition-all ${
                        isLight 
                          ? 'bg-slate-50 border-slate-250 text-slate-800 focus:border-amber-500/50 placeholder:text-slate-450' 
                          : 'bg-[#111]/80 border-cyan-500/10 text-white focus:border-cyan-45'
                      }`}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={`block text-[9px] font-mono uppercase mb-1 ${isLight ? 'text-amber-800/90' : 'text-cyan-400'}`}>Duration</label>
                      <input
                        type="text"
                        required
                        value={specDuration}
                        onChange={(e) => setSpecDuration(e.target.value)}
                        placeholder="e.g. 5 Days / 1 Week"
                        className={`w-full border rounded-xl px-3 py-2 text-xs focus:outline-none transition-all ${
                          isLight 
                            ? 'bg-slate-50 border-slate-250 text-slate-800 focus:border-amber-500/50 placeholder:text-slate-455' 
                            : 'bg-[#111]/80 border-cyan-500/10 text-white focus:border-cyan-45'
                        }`}
                      />
                    </div>
                    <div>
                      <label className={`block text-[9px] font-mono uppercase mb-1 ${isLight ? 'text-amber-800/90' : 'text-cyan-400'}`}>College/School Name</label>
                      <input
                        type="text"
                        required
                        value={specInstitution}
                        onChange={(e) => setSpecInstitution(e.target.value)}
                        placeholder="e.g. Govt Excellence School Waraseoni"
                        className={`w-full border rounded-xl px-3 py-2 text-xs focus:outline-none transition-all ${
                          isLight 
                            ? 'bg-slate-50 border-slate-250 text-slate-800 focus:border-amber-500/50 placeholder:text-slate-455' 
                            : 'bg-[#111]/80 border-cyan-500/10 text-white focus:border-cyan-45'
                        }`}
                      />
                    </div>
                  </div>

                  <div>
                    <label className={`block text-[9px] font-mono uppercase mb-1 ${isLight ? 'text-amber-800/90' : 'text-cyan-400'}`}>Starting Date & Time (Expiry limit)</label>
                    <input
                      type="datetime-local"
                      required
                      value={specStartDateTime}
                      onChange={(e) => setSpecStartDateTime(e.target.value)}
                      className={`w-full border rounded-xl px-3 py-2 text-xs focus:outline-none transition-all font-mono ${
                        isLight 
                          ? 'bg-slate-50 border-slate-250 text-slate-800 focus:border-amber-500/50' 
                          : 'bg-[#111]/80 border border-cyan-500/10 text-white'
                      }`}
                    />
                    <span className="text-[8px] text-slate-500 block mt-1 font-sans leading-relaxed">
                      ⚠ Public sign-up forms will automatically close/delete when starting date threshold is completed.
                    </span>
                  </div>

                  <button
                    type="submit"
                    className={`w-full font-black text-xs py-2.5 rounded-xl cursor-pointer uppercase transition-all font-mono tracking-wider ${
                      isLight 
                        ? 'bg-amber-600 hover:bg-amber-700 text-white' 
                        : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 hover:shadow-[0_0_12px_rgba(34,211,238,0.22)]'
                    }`}
                  >
                    Generate Form Hub
                  </button>
                </form>
              </div>

              {/* Part B: Programs Directory */}
              <div className={`rounded-2xl p-5 space-y-4 lg:col-span-2 border ${
                isLight ? 'bg-slate-50 border-slate-200 shadow-3xs' : 'bg-[#050505]/75 border-cyan-500/10'
              }`}>
                <div className={`border-b pb-2 ${isLight ? 'border-slate-200' : 'border-cyan-500/15'}`}>
                  <h3 className={`text-xs font-bold tracking-wider uppercase font-mono ${
                    isLight ? 'text-amber-850' : 'text-white'
                  }`}>
                    Special Program Directory ({specialProgramsAll.length})
                  </h3>
                  <p className={`text-[10px] leading-relaxed mt-0.5 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                    Lists active and closed programs. Click any item to inspect student enrollments, issue credentials, or manually register students.
                  </p>
                </div>

                {specialProgramsAll.length > 0 ? (
                  <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
                    {specialProgramsAll.map((prog, idx) => {
                      const registries = specialEnrollments.filter(e => e.programId === prog.id);
                      const isExpired = new Date(prog.startingDateTime) < new Date();
                      
                      return (
                        <div 
                          key={prog.id ? `${prog.id}-${idx}` : `prog-${idx}`}
                          onClick={() => {
                            setSelectedProgramId(prog.id);
                            setManualEnrollOpen(false);
                            setManSuccess('');
                            setManError('');
                          }}
                          className={`p-4 rounded-xl border text-left cursor-pointer transition-all ${
                            selectedProgramId === prog.id
                              ? (isLight 
                                  ? 'bg-amber-50/70 border-amber-500/50 shadow-3xs' 
                                  : 'bg-cyan-500/5 border-cyan-500/35 shadow-[0_0_15px_rgba(34,211,238,0.06)]')
                              : (isLight 
                                  ? 'bg-slate-100/55 border-slate-200 hover:border-amber-500/15' 
                                  : 'bg-[#111]/45 border-cyan-500/5 hover:border-cyan-500/20')
                          }`}
                        >
                          <div className="flex flex-col sm:flex-row justify-between items-start gap-2">
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4 className={`text-xs font-black uppercase ${isLight ? 'text-slate-800' : 'text-white'}`}>{prog.trainingName}</h4>
                                <span className={`text-[8px] font-mono px-2 py-0.5 rounded-full font-bold uppercase tracking-wider border ${
                                  isExpired 
                                    ? (isLight ? 'bg-red-50 border-red-200 text-red-750' : 'bg-red-500/10 text-red-400 border border-red-500/15')
                                    : (isLight ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/15')
                                }`}>
                                  {isExpired ? '⌛ Closed / Auto-Deleted On Public' : '● Active Registration Hub'}
                                </span>
                              </div>
                              <p className={`text-[10px] mt-1 font-mono ${isLight ? 'text-slate-650' : 'text-slate-400'}`}>
                                College/School: <strong className={`font-semibold ${isLight ? 'text-amber-850' : 'text-[#22d3ee]'}`}>{prog.institutionName}</strong> • Duration: {prog.duration}
                              </p>
                              <p className={`text-[9px] mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-500'}`}>
                                Start Date Threshold: {new Date(prog.startingDateTime).toLocaleString()}
                              </p>
                            </div>

                            <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                              <span className={`text-[10px] font-mono border px-2 py-1 rounded-lg ${
                                isLight ? 'text-slate-700 bg-slate-100 border-slate-200' : 'text-slate-300 bg-slate-900/60 border-slate-500/10'
                              }`}>
                                {registries.length} students
                              </span>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteSpecialProgram(prog.id);
                                }}
                                className={`p-1.5 transition-colors cursor-pointer ${
                                  isLight ? 'text-slate-400 hover:text-red-650' : 'text-slate-500 hover:text-red-400'
                                }`}
                                title="Delete Program Form"
                              >
                                <Trash className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className={`text-center py-12 border border-dashed rounded-xl ${
                    isLight ? 'border-slate-300 bg-slate-100/30' : 'border-cyan-500/10'
                  }`}>
                    <p className={`text-xs italic font-mono ${isLight ? 'text-slate-500' : 'text-slate-550'}`}>No special program form templates configured yet.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Part C: Inside Selected Program Student Registry */}
            {selectedProgramId && (() => {
              const currentProgram = specialProgramsAll.find(p => p.id === selectedProgramId);
              if (!currentProgram) return null;
              
              const programEnrolls = specialEnrollments.filter(e => e.programId === selectedProgramId);
              const issuedCertificates = DakshyamDatabase.getCertificates();

              return (
                <div className={`rounded-2xl p-5 space-y-6 animate-fadeIn border ${
                  isLight ? 'bg-slate-50 border-slate-200 shadow-2xs' : 'bg-[#050505]/75 border-cyan-500/10'
                }`}>
                  
                  {/* Registry control bar */}
                  <div className={`flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-4 ${
                    isLight ? 'border-slate-200' : 'border-cyan-500/10'
                  }`}>
                    <div>
                      <span className={`text-[9px] font-mono uppercase tracking-widest block font-bold ${
                        isLight ? 'text-amber-700' : 'text-cyan-400'
                      }`}>
                        MANAGE TRAINING BATCH REGISTRY
                      </span>
                      <h4 className={`text-sm font-black uppercase mt-0.5 ${isLight ? 'text-slate-800' : 'text-white'}`}>
                        {currentProgram.trainingName} ({currentProgram.institutionName})
                      </h4>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setManualEnrollOpen(!manualEnrollOpen)}
                        className={`px-3 py-2 text-2xs font-mono font-bold rounded-xl transition-all cursor-pointer border flex items-center gap-1.5 ${
                          isLight 
                            ? 'bg-amber-50 text-amber-850 border-amber-500/25 hover:bg-amber-100' 
                            : 'bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/25'
                        }`}
                      >
                        <Plus className="w-3.5 h-3.5" /> Manual Student Entry
                      </button>

                      <button
                        type="button"
                        onClick={() => handleExportToCSV(currentProgram)}
                        className={`px-3 py-2 text-2xs font-mono font-bold rounded-xl transition-all cursor-pointer border flex items-center gap-1.5 ${
                          isLight 
                            ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300' 
                            : 'bg-[#111] hover:bg-cyan-500/10 text-slate-300 hover:text-[#22d3ee] border-slate-500/10 hover:border-cyan-500/20'
                        }`}
                        title="Export this student registry directly into Excel or CSV format"
                      >
                        <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" /> Export Excel/CSV
                      </button>

                    </div>
                  </div>

                  {/* Manual Enroll Drawer/Area */}
                  {manualEnrollOpen && (
                    <form className={`rounded-xl p-4 space-y-4 animate-slideDown max-w-2xl text-left border ${
                      isLight ? 'bg-amber-50/50 border-amber-500/15' : 'bg-cyan-500/5 border border-cyan-500/10'
                    }`} onSubmit={handleManualEnroll}>
                      <div className={`flex justify-between items-center border-b pb-2 ${
                        isLight ? 'border-slate-200' : 'border-cyan-500/5'
                      }`}>
                        <h5 className={`text-2xs font-mono font-bold uppercase ${isLight ? 'text-amber-800' : 'text-cyan-400'}`}>Manually Add Candidate Student</h5>
                        <button type="button" onClick={() => setManualEnrollOpen(false)} className="text-slate-400 hover:text-red-500">
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      {manError && <p className="text-red-400 font-mono bg-red-950/20 p-2 rounded-lg text-center text-3xs">{manError}</p>}
                      {manSuccess && <p className="text-cyan-400 font-mono bg-cyan-950/20 p-2 rounded-lg font-bold text-center text-3xs">{manSuccess}</p>}

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div>
                          <label className={`block text-[8px] font-mono uppercase mb-1 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>Student Name</label>
                          <input
                            type="text"
                            required
                            value={manStudentName}
                            onChange={(e) => setManStudentName(e.target.value)}
                            placeholder="Full Name"
                            className={`w-full border rounded-lg px-2.5 py-1.5 text-2xs focus:outline-none ${
                              isLight 
                                ? 'bg-slate-50 border-slate-250 text-slate-800 focus:border-amber-500/50 placeholder:text-slate-405' 
                                : 'bg-[#111]/80 border border-cyan-500/10 text-white'
                            }`}
                          />
                        </div>
                        <div>
                          <label className={`block text-[8px] font-mono uppercase mb-1 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>Branch Specialization</label>
                          <input
                            type="text"
                            required
                            value={manBranch}
                            onChange={(e) => setManBranch(e.target.value)}
                            placeholder="e.g. CSE / IT / Class 10"
                            className={`w-full border rounded-lg px-2.5 py-1.5 text-2xs focus:outline-none ${
                              isLight 
                                ? 'bg-slate-50 border-slate-250 text-slate-800 focus:border-amber-500/50 placeholder:text-slate-405' 
                                : 'bg-[#111]/80 border border-cyan-500/10 text-white focus:border-cyan-45'
                            }`}
                          />
                        </div>
                        <div>
                          <label className={`block text-[8px] font-mono uppercase mb-1 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>Year of Study</label>
                          <input
                            type="text"
                            required
                            value={manYear}
                            onChange={(e) => setManYear(e.target.value)}
                            placeholder="e.g. 2nd Year / 10th Standard"
                            className={`w-full border rounded-lg px-2.5 py-1.5 text-2xs focus:outline-none ${
                              isLight 
                                ? 'bg-slate-50 border-slate-250 text-slate-800 focus:border-amber-500/50 placeholder:text-slate-405' 
                                : 'bg-[#111]/80 border border-cyan-500/10 text-white focus:border-cyan-45'
                            }`}
                          />
                        </div>
                        <div>
                          <label className={`block text-[8px] font-mono uppercase mb-1 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>Father's Name</label>
                          <input
                            type="text"
                            required
                            value={manFathersName}
                            onChange={(e) => setManFathersName(e.target.value)}
                            placeholder="Father's Name"
                            className={`w-full border rounded-lg px-2.5 py-1.5 text-2xs focus:outline-none ${
                              isLight 
                                ? 'bg-slate-50 border-slate-250 text-slate-800 focus:border-amber-500/50 placeholder:text-slate-405' 
                                : 'bg-[#111]/80 border border-cyan-500/10 text-white focus:border-cyan-45'
                            }`}
                          />
                        </div>
                        <div>
                          <label className={`block text-[8px] font-mono uppercase mb-1 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>Email ID</label>
                          <input
                            type="email"
                            required
                            value={manEmail}
                            onChange={(e) => setManEmail(e.target.value)}
                            placeholder="student@dakshyam.in"
                            className={`w-full border rounded-lg px-2.5 py-1.5 text-2xs focus:outline-none ${
                              isLight 
                                ? 'bg-slate-50 border-slate-250 text-slate-800 focus:border-amber-500/50 placeholder:text-slate-405' 
                                : 'bg-[#111]/80 border border-cyan-500/10 text-white'
                            }`}
                          />
                        </div>
                        <div>
                          <label className={`block text-[8px] font-mono uppercase mb-1 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>Roll Number</label>
                          <input
                            type="text"
                            required
                            value={manRollNumber}
                            onChange={(e) => setManRollNumber(e.target.value)}
                            placeholder="Roll ID"
                            className={`w-full border rounded-lg px-2.5 py-1.5 text-2xs focus:outline-none ${
                              isLight 
                                ? 'bg-slate-50 border-slate-250 text-slate-800 focus:border-amber-500/50 placeholder:text-slate-405' 
                                : 'bg-[#111]/80 border border-cyan-500/10 text-white focus:border-cyan-45'
                            }`}
                          />
                        </div>
                        <div className="md:col-span-3">
                          <label className={`block text-[8px] font-mono uppercase mb-1 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>Mobile / WhatsApp Number</label>
                          <input
                            type="text"
                            required
                            value={manMobile}
                            onChange={(e) => setManMobile(e.target.value)}
                            placeholder="+91 WhatsApp Contact"
                            className={`w-full border rounded-lg px-2.5 py-1.5 text-2xs focus:outline-none ${
                              isLight 
                                ? 'bg-slate-50 border-slate-250 text-slate-800 focus:border-amber-500/50 placeholder:text-slate-405' 
                                : 'bg-[#111]/80 border border-cyan-500/10 text-white'
                            }`}
                          />
                        </div>
                      </div>

                      <div className="flex justify-end gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => setManualEnrollOpen(false)}
                          className={`px-3 py-1.5 text-2xs font-mono bg-transparent ${isLight ? 'text-slate-500 hover:text-slate-800' : 'text-slate-400 hover:text-white'}`}
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className={`px-4 py-1.5 rounded-lg text-2xs font-bold font-mono transition-all hover:scale-[1.02] cursor-pointer shadow-xs ${
                            isLight ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-600/10' : 'bg-[#22d3ee] text-slate-950'
                          }`}
                        >
                          Enroll Student Candidate
                        </button>
                      </div>
                    </form>
                  )}

                  {/* Student enrollments checklist */}
                  <div className={`overflow-x-auto rounded-xl border ${
                    isLight ? 'bg-slate-100/50 border-slate-200' : 'border-cyan-500/5 bg-black/30'
                  }`}>
                    {programEnrolls.length > 0 ? (
                      <table className="w-full table-auto text-left font-mono text-2xs">
                        <thead>
                          <tr className={`border-b uppercase tracking-wider font-extrabold text-[8px] ${
                            isLight ? 'bg-slate-100 text-slate-700 border-slate-200' : 'bg-cyan-950/20 text-[#22d3ee]/80 border-cyan-500/10'
                          }`}>
                            <th className="p-3">Roll ID</th>
                            <th className="p-3">Name</th>
                            <th className="p-3">Syllabus Details</th>
                            <th className="p-3">Parent Info</th>
                            <th className="p-3">Email & Mobile</th>
                            <th className="p-3 text-right">Enrollment Status</th>
                          </tr>
                        </thead>
                        <tbody className={`divide-y select-text ${isLight ? 'divide-slate-200' : 'divide-cyan-500/5'}`}>
                          {programEnrolls.map((enroll, idx) => {
                            return (
                              <tr key={enroll.id ? `${enroll.id}-${idx}` : `enroll-${idx}`} className={`transition-all ${
                                isLight ? 'hover:bg-slate-100/80 text-slate-700' : 'hover:bg-cyan-500/5 text-slate-305'
                              }`}>
                                <td className={`p-3 font-bold ${isLight ? 'text-slate-800' : 'text-white'}`}>{enroll.rollNumber}</td>
                                <td className="p-3">
                                  <span className={`font-extrabold uppercase block ${isLight ? 'text-amber-800' : 'text-[#22d3ee]'}`}>{enroll.name}</span>
                                  <span className="text-[9px] text-slate-500">Reg: {enroll.enrolledAt}</span>
                                </td>
                                <td className="p-3">
                                  <span className={`block ${isLight ? 'text-slate-800 font-bold' : 'text-white'}`}>{enroll.branch || 'N/A'}</span>
                                  <span className="text-[9px] text-slate-500">Class Year: {enroll.yearOfStudy || 'N/A'}</span>
                                </td>
                                <td className={`p-3 ${isLight ? 'text-slate-700' : 'text-slate-350'}`}>{enroll.fathersName || 'N/A'}</td>
                                <td className="p-3">
                                  <span className={`block lowercase ${isLight ? 'text-slate-850 font-bold' : 'text-white'}`}>{enroll.email}</span>
                                  <span className="text-[9px] text-slate-500">{enroll.mobileNumber}</span>
                                </td>
                                <td className="p-3 text-right">
                                  <div className={`flex items-center justify-end gap-1.5 font-bold border px-2.5 py-1 rounded-lg inline-flex ${
                                    isLight ? 'border-emerald-300 bg-emerald-50 text-emerald-800' : 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400'
                                  }`}>
                                    <Check className="w-3.5 h-3.5" /> Enrolled Active
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    ) : (
                      <div className="text-center py-10">
                        <p className="text-xs text-slate-500 italic px-2">No students active in this program. You can manually register any student using the manual entry drawer above.</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* TAB 9: ABOUT PAGE COMMANDER */}
        {adminTab === 'about_editor' && (
          <AboutEditorTab onRefresh={onRefresh} theme={theme} />
        )}

        {/* TAB 11: HOME PAGE 3D ART & OBJ MODEL STUDIO */}
        {adminTab === 'home_3d_art' && (
          <Home3DArtSettingsTab theme={theme} />
        )}

        {/* TAB 12: ADMINISTRATIVE LOG CONTROL */}
        {adminTab === 'logs' && (() => {
          const rawLogs = DakshyamDatabase.getAppLogs();
          const uniqueLogsMap = new Map<string, typeof rawLogs[0]>();
          rawLogs.forEach(l => { if (l && l.id && !uniqueLogsMap.has(l.id)) uniqueLogsMap.set(l.id, l); });
          const uniqueRawLogs = Array.from(uniqueLogsMap.values());
          const filteredLogs = uniqueRawLogs.filter(log => {
            const matchesSearch = log.action.toLowerCase().includes(searchLog.toLowerCase()) || 
                                  log.details.toLowerCase().includes(searchLog.toLowerCase()) ||
                                  log.userEmail.toLowerCase().includes(searchLog.toLowerCase());
            const matchesStatus = statusFilter === 'ALL' || log.status === statusFilter;
            const matchesCategory = categoryFilter === 'ALL' || log.category === categoryFilter;
            return matchesSearch && matchesStatus && matchesCategory;
          });

          const workshopLogsCount = uniqueRawLogs.filter(l => l.category === 'WORKSHOP' || l.action.toLowerCase().includes('workshop')).length;
          const securityLogsCount = uniqueRawLogs.filter(l => l.category === 'SECURITY' || l.category === 'AUTH' || l.action.toLowerCase().includes('login') || l.action.toLowerCase().includes('lockout')).length;
          const errorLogsCount = uniqueRawLogs.filter(l => l.status === 'ERROR').length;

          const handleSyncRemoteLogs = async () => {
            setIsFetchingLogs(true);
            try {
              const remoteLogs = await DakshyamDatabase.fetchRemoteLogs();
              if (remoteLogs && remoteLogs.length > 0) {
                DakshyamDatabase.saveAppLogs(remoteLogs);
              }
              onRefresh();
            } catch (err) {
              console.error('Remote sync fail', err);
            } finally {
              setIsFetchingLogs(false);
            }
          };

          const logCategories = ['ALL', 'WORKSHOP', 'AUTH', 'SECURITY', 'DATABASE', 'CERTIFICATE', 'STUDENT', 'TRAINER', 'SYSTEM'];

          return (
            <div className="space-y-6 text-left animate-fadeIn">
              
              {/* TOP HEADER & METRICS */}
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 border-b pb-4 border-slate-500/15">
                <div>
                  <h3 className={`text-sm font-black font-mono tracking-wider uppercase flex items-center gap-2 ${isLight ? 'text-amber-800' : 'text-[#22d3ee]'}`}>
                    <span>🛡️ System Security & Workshop Audit Stream</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
                      LIVE TELEMETRY
                    </span>
                  </h3>
                  <p className="text-3xs font-mono text-slate-500 mt-0.5">
                    Centralized platform telemetry tracking workshop publications, participant evaluation entries, security authorizations, and administrative actions.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={handleSyncRemoteLogs}
                    disabled={isFetchingLogs}
                    className={`px-3 py-1.5 rounded-xl border font-mono text-3xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      isLight ? 'bg-sky-50 border-sky-200 text-sky-800 hover:bg-sky-100' : 'bg-sky-950/40 border-sky-500/30 text-sky-300 hover:bg-sky-900/50'
                    }`}
                    title="Fetch centralized logs from database"
                  >
                    <RefreshCw className={`w-3 h-3 ${isFetchingLogs ? 'animate-spin' : ''}`} />
                    <span>{isFetchingLogs ? 'Syncing...' : 'Sync Cloud Logs'}</span>
                  </button>

                  <button
                    onClick={() => DakshyamDatabase.exportLogsToCsv(filteredLogs)}
                    className={`px-3 py-1.5 rounded-xl border font-mono text-3xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      isLight ? 'bg-emerald-50 border-emerald-300 text-emerald-800 hover:bg-emerald-100' : 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300 hover:bg-emerald-900/50'
                    }`}
                    title="Download filtered logs as CSV spreadsheet"
                  >
                    <Download className="w-3 h-3" />
                    <span>CSV</span>
                  </button>

                  <button
                    onClick={() => DakshyamDatabase.exportLogsToJson(filteredLogs)}
                    className={`px-3 py-1.5 rounded-xl border font-mono text-3xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      isLight ? 'bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200' : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                    }`}
                    title="Export raw JSON log stream"
                  >
                    <FileSpreadsheet className="w-3 h-3" />
                    <span>JSON</span>
                  </button>

                  <button
                    onClick={() => {
                      if (window.confirm('Are you sure you want to purge all security log streams? This cannot be undone.')) {
                        DakshyamDatabase.saveAppLogs([
                          {
                            id: 'log-purged',
                            timestamp: new Date().toISOString(),
                            action: 'Audit Log Cleared',
                            details: 'Admin purged the history log records manually.',
                            userEmail: 'admin@dakshyam.com',
                            role: 'admin',
                            status: 'INFO',
                            category: 'SECURITY'
                          }
                        ]);
                        onRefresh();
                      }
                    }}
                    className={`px-3 py-1.5 rounded-xl border font-mono text-3xs font-bold transition-all hover:bg-red-500 hover:text-white cursor-pointer ${
                      isLight ? 'border-red-500/35 text-red-700 bg-red-50/50' : 'border-red-500/20 text-red-400 bg-red-950/20'
                    }`}
                  >
                    Purge
                  </button>
                </div>
              </div>

              {/* ENTERPRISE SECURITY & BROWSER COMPATIBILITY CONTROL PANEL */}
              <div className={`p-4 rounded-2xl border transition-all ${
                isLight 
                  ? 'bg-gradient-to-r from-blue-50/70 to-indigo-50/40 border-blue-200 shadow-xs text-slate-800' 
                  : 'bg-gradient-to-r from-[#071326]/90 to-[#0d1f38]/90 border-blue-800/40 shadow-md text-slate-200'
              }`}>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-blue-500/15">
                  <div className="flex items-center gap-2.5">
                    <div className={`p-2 rounded-xl ${isLight ? 'bg-blue-600 text-white shadow-xs' : 'bg-blue-500/20 text-cyan-400 border border-blue-400/30'}`}>
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className={`text-xs font-mono font-black uppercase tracking-wider ${isLight ? 'text-blue-950' : 'text-white'}`}>
                        Enterprise Security & Multi-Browser Engine
                      </h3>
                      <p className="text-4xs font-sans text-slate-400">
                        Right-click restriction, DevTools interceptor, resilient cookie sync (Brave/Edge), and search engine indexing.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const nextBypass = !isSecurityBypassed;
                        SecurityGuard.setBypass(nextBypass);
                        setIsSecurityBypassed(nextBypass);
                        if (nextBypass) {
                          notifyInfo('DevTools & Right-Click protection temporarily bypassed for Admin inspection.', 'Security Bypass');
                        } else {
                          notifySuccess('Enterprise Security Guard restored. Right-click and DevTools shortcuts are now actively blocked.', 'Security Restored');
                        }
                      }}
                      className={`px-3 py-1.5 rounded-xl font-mono text-4xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer ${
                        isSecurityBypassed
                          ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-xs'
                          : isLight 
                            ? 'bg-blue-950 hover:bg-blue-900 text-white shadow-xs' 
                            : 'bg-white hover:bg-slate-100 text-[#0a192f] shadow-[0_0_12px_rgba(255,255,255,0.15)]'
                      }`}
                    >
                      {isSecurityBypassed ? <Unlock className="w-3.5 h-3.5 text-slate-950" /> : <Lock className="w-3.5 h-3.5" />}
                      <span>{isSecurityBypassed ? 'Bypass Active (Dev Enabled)' : 'Bypass for Admin Debug'}</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3">
                  <div className={`p-3 rounded-xl border ${isLight ? 'bg-white/80 border-blue-100' : 'bg-[#040d1a]/60 border-blue-900/30'}`}>
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="text-4xs font-mono font-bold uppercase text-slate-400 flex items-center gap-1">
                        <Lock className="w-3 h-3 text-cyan-400" /> DevTools & Context Menu
                      </span>
                      <span className={`px-1.5 py-0.5 rounded text-5xs font-mono font-bold uppercase ${
                        isSecurityBypassed ? 'bg-amber-500/20 text-amber-300' : 'bg-emerald-500/20 text-emerald-400'
                      }`}>
                        {isSecurityBypassed ? 'Bypassed' : 'Restricted'}
                      </span>
                    </div>
                    <p className="text-4xs font-sans text-slate-400 leading-snug">
                      F12, Ctrl+Shift+I/J/C, Ctrl+U, right click, and drag-and-drop scraping disabled.
                    </p>
                  </div>

                  <div className={`p-3 rounded-xl border ${isLight ? 'bg-white/80 border-blue-100' : 'bg-[#040d1a]/60 border-blue-900/30'}`}>
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="text-4xs font-mono font-bold uppercase text-slate-400 flex items-center gap-1">
                        <Cookie className="w-3 h-3 text-sky-400" /> Brave / Edge Cookie Sync
                      </span>
                      <span className="px-1.5 py-0.5 rounded text-5xs font-mono font-bold uppercase bg-emerald-500/20 text-emerald-400">
                        Synchronized
                      </span>
                    </div>
                    <p className="text-4xs font-sans text-slate-400 leading-snug">
                      Dual-layer persistence syncs cookies with localStorage against aggressive privacy blockers.
                    </p>
                  </div>

                  <div className={`p-3 rounded-xl border ${isLight ? 'bg-white/80 border-blue-100' : 'bg-[#040d1a]/60 border-blue-900/30'}`}>
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="text-4xs font-mono font-bold uppercase text-slate-400 flex items-center gap-1">
                        <Globe className="w-3 h-3 text-indigo-400" /> Multi-Browser SEO Directives
                      </span>
                      <span className="px-1.5 py-0.5 rounded text-5xs font-mono font-bold uppercase bg-emerald-500/20 text-emerald-400">
                        Optimized
                      </span>
                    </div>
                    <p className="text-4xs font-sans text-slate-400 leading-snug">
                      Windows Edge application tiles, Brave referrer headers, hreflang, and JSON-LD schemas.
                    </p>
                  </div>
                </div>
              </div>

              {/* TELEMETRY METRICS CARDS */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className={`p-3.5 rounded-2xl border font-mono ${isLight ? 'bg-white border-slate-200' : 'bg-slate-900/60 border-cyan-500/20'}`}>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Total Logged Events</span>
                  <div className="text-xl font-black mt-1 text-sky-400">{rawLogs.length}</div>
                  <span className="text-[9px] text-slate-500">Platform-wide activities</span>
                </div>

                <div className={`p-3.5 rounded-2xl border font-mono ${isLight ? 'bg-white border-slate-200' : 'bg-slate-900/60 border-purple-500/20'}`}>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Workshop Activities</span>
                  <div className="text-xl font-black mt-1 text-purple-400">{workshopLogsCount}</div>
                  <span className="text-[9px] text-slate-500">Creation & submissions</span>
                </div>

                <div className={`p-3.5 rounded-2xl border font-mono ${isLight ? 'bg-white border-slate-200' : 'bg-slate-900/60 border-amber-500/20'}`}>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Security & Auth</span>
                  <div className="text-xl font-black mt-1 text-amber-400">{securityLogsCount}</div>
                  <span className="text-[9px] text-slate-500">Tokens, logins & PINs</span>
                </div>

                <div className={`p-3.5 rounded-2xl border font-mono ${isLight ? 'bg-white border-slate-200' : 'bg-slate-900/60 border-red-500/20'}`}>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Alerts & Failures</span>
                  <div className="text-xl font-black mt-1 text-red-400">{errorLogsCount}</div>
                  <span className="text-[9px] text-slate-500">Critical exceptions</span>
                </div>
              </div>

              {/* CATEGORY & STATUS FILTERS */}
              <div className="space-y-2.5">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-3xs font-mono text-slate-400 uppercase font-bold mr-1">Category:</span>
                  {logCategories.map(cat => (
                    <button
                      key={cat}
                      onClick={() => setCategoryFilter(cat)}
                      className={`px-2.5 py-1 rounded-lg border font-mono text-4xs font-bold uppercase transition-all cursor-pointer ${
                        categoryFilter === cat
                          ? isLight 
                            ? 'bg-blue-900 text-white border-blue-900 shadow-sm' 
                            : 'bg-cyan-500 text-slate-950 border-cyan-400 font-black shadow-[0_0_10px_rgba(34,211,238,0.3)]'
                          : isLight 
                            ? 'border-slate-200 text-slate-600 hover:bg-slate-100' 
                            : 'border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
                  <input
                    type="text"
                    placeholder="Search logs by action, details, email, or workshop name..."
                    value={searchLog}
                    onChange={(e) => setSearchLog(e.target.value)}
                    className={`w-full sm:max-w-md rounded-xl px-3 py-2 text-3xs font-mono border focus:outline-none focus:ring-1 ${
                      isLight
                        ? 'bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400 focus:border-amber-500'
                        : 'bg-[#111]/80 border-cyan-500/10 text-white placeholder-slate-500 focus:border-cyan-450'
                    }`}
                  />
                  
                  <div className="flex gap-1 self-start sm:self-auto">
                    {(['ALL', 'SUCCESS', 'ERROR', 'INFO'] as const).map(f => (
                      <button
                        key={f}
                        onClick={() => setStatusFilter(f)}
                        className={`px-2.5 py-1.5 rounded-lg border font-mono text-4xs font-bold uppercase transition-all cursor-pointer ${
                          statusFilter === f
                            ? (isLight ? 'bg-amber-100 border-amber-500 text-amber-950' : 'bg-cyan-950/80 border-cyan-400/85 text-cyan-400')
                            : (isLight ? 'border-slate-200 text-slate-500 hover:bg-slate-100' : 'border-cyan-500/5 text-slate-450 hover:text-white hover:bg-[#111]')
                        }`}
                      >
                        {f}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* LOGS LIST STREAM */}
              <div className="space-y-2 max-h-[550px] overflow-y-auto pr-1">
                {filteredLogs.length === 0 ? (
                  <div className={`p-8 text-center rounded-2xl border ${
                    isLight ? 'bg-slate-50 border-slate-200 text-slate-400' : 'bg-[#111]/40 border-cyan-500/5 text-slate-500'
                  }`}>
                    <p className="text-3xs font-mono">No telemetry events found matching the active criteria.</p>
                  </div>
                ) : (
                  filteredLogs.map((log, idx) => {
                    let statusBg = '';
                    if (log.status === 'SUCCESS') {
                      statusBg = isLight ? 'bg-emerald-50 text-emerald-800 border-emerald-500/20' : 'bg-emerald-950/20 text-emerald-400 border-emerald-500/20';
                    } else if (log.status === 'ERROR') {
                      statusBg = isLight ? 'bg-red-50 text-red-800 border-red-500/20' : 'bg-red-950/20 text-red-450 border-red-500/20';
                    } else {
                      statusBg = isLight ? 'bg-slate-50 text-slate-700 border-slate-200' : 'bg-zinc-900/60 text-zinc-400 border-cyan-500/5';
                    }

                    const categoryBadgeClass = () => {
                      switch (log.category) {
                        case 'WORKSHOP':
                          return isLight ? 'bg-purple-100 text-purple-800 border-purple-200' : 'bg-purple-950/50 text-purple-300 border-purple-500/30';
                        case 'SECURITY':
                          return isLight ? 'bg-rose-100 text-rose-800 border-rose-200' : 'bg-rose-950/50 text-rose-300 border-rose-500/30';
                        case 'AUTH':
                          return isLight ? 'bg-amber-100 text-amber-800 border-amber-200' : 'bg-amber-950/50 text-amber-300 border-amber-500/30';
                        case 'DATABASE':
                          return isLight ? 'bg-cyan-100 text-cyan-800 border-cyan-200' : 'bg-cyan-950/50 text-cyan-300 border-cyan-500/30';
                        case 'CERTIFICATE':
                          return isLight ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : 'bg-emerald-950/50 text-emerald-300 border-emerald-500/30';
                        default:
                          return isLight ? 'bg-slate-100 text-slate-700 border-slate-200' : 'bg-slate-800 text-slate-400 border-slate-700';
                      }
                    };

                    return (
                      <div
                        key={log.id ? `${log.id}-${idx}` : `log-${idx}`}
                        className={`p-3.5 rounded-xl border flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-3xs font-mono transition-all ${
                          isLight ? 'bg-slate-50/50 border-slate-150 hover:bg-slate-50' : 'bg-[#111]/60 border-cyan-500/5 hover:border-cyan-500/10'
                        }`}
                      >
                        <div className="space-y-1.5 flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className={`px-1.5 py-0.5 rounded text-4xs uppercase font-extrabold border ${statusBg}`}>
                              {log.status}
                            </span>
                            {log.category && (
                              <span className={`px-1.5 py-0.5 rounded text-4xs font-black uppercase border ${categoryBadgeClass()}`}>
                                {log.category}
                              </span>
                            )}
                            <span className={`font-extrabold uppercase text-2xs ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
                              {log.action}
                            </span>
                            <span className="text-slate-500 select-none">•</span>
                            <span className={`px-1 rounded-md text-4xs lowercase font-bold ${isLight ? 'bg-slate-100 text-slate-700' : 'bg-[#222] text-slate-400'}`}>
                              {log.userEmail} ({log.role})
                            </span>
                          </div>
                          <p className={`leading-relaxed text-4xs select-all break-words ${isLight ? 'text-slate-600' : 'text-slate-350'}`}>
                            {log.details}
                          </p>
                        </div>
                        <div className="shrink-0 text-[10px] text-slate-500">
                          {new Date(log.timestamp).toLocaleString()}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })()}

        {/* TAB: REGISTERED ACCOUNTS REGISTRY */}
        {adminTab === 'accounts' && (
          <div className="w-full">
            <AdminAccountsManager 
              theme={theme}
              onRefresh={onRefresh}
            />
          </div>
        )}

        {/* TAB: SUPPORT TICKETS & BUG REPORTS */}
        {adminTab === 'tickets' && (
          <div className="w-full">
            <SupportTicketManager
              currentUser={{
                id: 'usr-admin-master',
                name: 'Platform Administrator',
                email: 'admin@dakshyam.com',
                role: 'admin'
              }}
              theme={theme}
              isAdminView={true}
            />
          </div>
        )}

        {/* TAB: ADMIN MASTER OPERATIONAL GUIDE */}
        {adminTab === 'admin_guide' && (
          <div className="w-full">
            <AdminMasterGuide 
              theme={theme} 
              onNavigateTab={(tab) => setAdminTab(tab as any)}
            />
          </div>
        )}

          </motion.div>
        </AnimatePresence>
      </div>

      {/* 1. Course Creator Modal */}
      <AnimatePresence>
        {showCourseModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setShowCourseModal(false);
                setCourseError('');
                setCourseSuccess('');
              }}
              className="absolute inset-0 bg-black/85 backdrop-blur-xs cursor-pointer pointer-events-auto"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className={`border p-6 rounded-2xl max-w-lg w-full relative z-10 text-left space-y-4 max-h-[90vh] overflow-y-auto ${
                isLight ? 'bg-white border-slate-200 shadow-2xl' : 'bg-[#050505]/98 border-cyan-500/20 shadow-[0_0_55px_rgba(6,182,212,0.12)]'
              }`}
            >
              <div className="flex justify-between items-center border-b pb-2">
                <h3 className={`text-xs font-bold tracking-wider uppercase ${isLight ? 'text-amber-800 font-mono' : 'text-[#22d3ee] font-mono'}`}>
                  Configure New Syllabus Course
                </h3>
                <button
                  onClick={() => setShowCourseModal(false)}
                  className="text-slate-400 hover:text-red-400 transition-colors text-xs font-mono font-bold cursor-pointer"
                >
                  ✕ Close
                </button>
              </div>

              <form onSubmit={async (e) => {
                await handleCreateCourse(e);
                setShowCourseModal(false);
              }} className="space-y-3.5">
                {courseError && <div className="text-3xs font-mono text-red-400 bg-red-950/25 p-2 rounded-xl">{courseError}</div>}
                {courseSuccess && <div className="text-3xs font-mono text-cyan-400 bg-cyan-950/25 p-2 rounded-xl font-bold">{courseSuccess}</div>}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-[9px] font-mono uppercase mb-1 ${isLight ? 'text-amber-800/90' : 'text-cyan-400'}`}>Course Title</label>
                    <input
                      type="text"
                      required
                      value={courseTitle}
                      onChange={(e) => setCourseTitle(e.target.value)}
                      placeholder="e.g. Django API Systems"
                      className={`w-full border rounded-xl px-3 py-2 text-xs focus:outline-none transition-all ${
                        isLight ? 'bg-slate-50 border-slate-200 text-slate-800' : 'bg-[#111]/80 border-cyan-500/10 text-white'
                      }`}
                    />
                  </div>
                  <div>
                    <label className={`block text-[9px] font-mono uppercase mb-1 ${isLight ? 'text-amber-800/90' : 'text-cyan-400'}`}>Duration Block</label>
                    <input
                      type="text"
                      required
                      value={courseDuration}
                      onChange={(e) => setCourseDuration(e.target.value)}
                      placeholder="e.g. 1 Week"
                      className={`w-full border rounded-xl px-3 py-2 text-xs focus:outline-none transition-all ${
                        isLight ? 'bg-slate-50 border-slate-200 text-slate-800' : 'bg-[#111]/80 border-cyan-500/10 text-white'
                      }`}
                    />
                  </div>
                </div>

                <div>
                  <label className={`block text-[9px] font-mono uppercase mb-1 ${isLight ? 'text-amber-800/90' : 'text-cyan-400'}`}>Description summary</label>
                  <textarea
                    required
                    value={courseDesc}
                    onChange={(e) => setCourseDesc(e.target.value)}
                    placeholder="Master logical flows and database schemas..."
                    rows={2}
                    className={`w-full border rounded-xl px-3 py-2 text-xs focus:outline-none transition-all ${
                      isLight ? 'bg-slate-50 border-slate-200 text-slate-800' : 'bg-[#111]/80 border-cyan-500/10 text-white'
                    }`}
                  />
                </div>

                <div>
                  <label className={`block text-[9px] font-mono uppercase mb-0.5 ${isLight ? 'text-amber-800/90' : 'text-cyan-400'}`}>Tags (Comma-separated)</label>
                  <input
                    type="text"
                    value={courseTags}
                    onChange={(e) => setCourseTags(e.target.value)}
                    placeholder="NEP Aligned, Python, HTML5, Scratch"
                    className={`w-full border rounded-xl px-3 py-2 text-xs focus:outline-none transition-all ${
                      isLight ? 'bg-slate-50 border-slate-200 text-slate-800' : 'bg-[#111]/80 border-cyan-500/10 text-white'
                    }`}
                  />
                </div>

                <div>
                  <label className={`block text-[9px] font-mono uppercase mb-0.5 ${isLight ? 'text-amber-800/90' : 'text-cyan-400'}`}>Core Features (Comma-separated)</label>
                  <input
                    type="text"
                    value={courseFeatures}
                    onChange={(e) => setCourseFeatures(e.target.value)}
                    placeholder="1-Week setup, Free laptop leasing, Microcontroller boards"
                    className={`w-full border rounded-xl px-3 py-2 text-xs focus:outline-none transition-all ${
                      isLight ? 'bg-slate-50 border-slate-200 text-slate-800' : 'bg-[#111]/80 border-cyan-500/10 text-white'
                    }`}
                  />
                </div>

                <div className="flex items-center gap-2 select-none">
                  <input
                    type="checkbox"
                    id="hardware"
                    checked={mobHardware}
                    onChange={(e) => setMobHardware(e.target.checked)}
                    className="rounded"
                  />
                  <label htmlFor="hardware" className={`text-3xs font-mono cursor-pointer ${isLight ? 'text-slate-600 font-semibold' : 'text-slate-355'}`}>
                    Includes free mobile computer hardware leasing support
                  </label>
                </div>

                <button
                  type="submit"
                  className={`w-full font-bold text-xs py-2.5 rounded-xl cursor-pointer uppercase tracking-wider font-mono shadow-xs transition-all ${
                    isLight ? 'bg-amber-600 hover:bg-amber-700 text-white' : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950'
                  }`}
                >
                  Publish New Course
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 2. Banner Creator Modal */}
      <AnimatePresence>
        {showBannerModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setShowBannerModal(false);
                setBannerError('');
                setBannerSuccess('');
              }}
              className="absolute inset-0 bg-black/85 backdrop-blur-xs cursor-pointer pointer-events-auto"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className={`border p-6 rounded-2xl max-w-lg w-full relative z-10 text-left space-y-4 max-h-[90vh] overflow-y-auto ${
                isLight ? 'bg-white border-slate-200 shadow-2xl' : 'bg-[#050505]/98 border-cyan-500/20 shadow-[0_0_55px_rgba(6,182,212,0.12)]'
              }`}
            >
              <div className="flex justify-between items-center border-b pb-2">
                <h3 className={`text-xs font-bold tracking-wider uppercase ${isLight ? 'text-amber-800 font-mono' : 'text-[#22d3ee] font-mono'}`}>
                  Launch Carousel Banner Advertisement
                </h3>
                <button
                  onClick={() => setShowBannerModal(false)}
                  className="text-slate-400 hover:text-red-400 transition-colors text-xs font-mono font-bold cursor-pointer"
                >
                  ✕ Close
                </button>
              </div>

              <form onSubmit={async (e) => {
                await handleCreateBanner(e);
                setShowBannerModal(false);
              }} className="space-y-3.5">
                {bannerError && <div className="text-3xs font-mono text-red-400 bg-red-950/25 p-2 rounded-xl">{bannerError}</div>}
                {bannerSuccess && <div className="text-3xs font-mono text-cyan-400 bg-cyan-950/25 p-2 rounded-xl font-bold">{bannerSuccess}</div>}

                <div>
                  <label className={`block text-[9px] font-mono uppercase mb-1 ${isLight ? 'text-amber-800/90' : 'text-cyan-400'}`}>Banner Title</label>
                  <input
                    type="text"
                    required
                    value={bannerTitle}
                    onChange={(e) => setBannerTitle(e.target.value)}
                    placeholder="e.g. NEP 2020 Programming camps open"
                    className={`w-full border rounded-xl px-3 py-2 text-xs focus:outline-none ${
                      isLight ? 'bg-slate-50 border-slate-200 text-slate-800' : 'bg-[#111]/80 border-cyan-500/10 text-white'
                    }`}
                  />
                </div>

                <div>
                  <label className={`block text-[9px] font-mono uppercase mb-1 ${isLight ? 'text-amber-800/90' : 'text-cyan-400'}`}>Subtitle / Slogan description</label>
                  <textarea
                    required
                    value={bannerSubtitle}
                    onChange={(e) => setBannerSubtitle(e.target.value)}
                    placeholder="Active block coding camps..."
                    rows={2}
                    className={`w-full border rounded-xl px-3 py-2 text-xs focus:outline-none ${
                      isLight ? 'bg-slate-50 border-slate-200 text-slate-800' : 'bg-[#111]/80 border-cyan-500/10 text-white'
                    }`}
                  />
                </div>

                <div>
                  <label className={`block text-[9px] font-mono uppercase mb-1 ${isLight ? 'text-amber-800/90' : 'text-cyan-400'}`}>Media Asset Image URL</label>
                  <input
                    type="url"
                    required
                    value={bannerImageUrl}
                    onChange={(e) => setBannerImageUrl(e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                    className={`w-full border rounded-xl px-3 py-2 text-xs focus:outline-none ${
                      isLight ? 'bg-slate-50 border-slate-200 text-slate-800' : 'bg-[#111]/80 border-cyan-500/10 text-white'
                    }`}
                  />
                </div>

                <div>
                  <label className={`block text-[9px] font-mono uppercase mb-1 ${isLight ? 'text-amber-800/90' : 'text-cyan-400'}`}>Button Redirect Call to Action (URL)</label>
                  <input
                    type="text"
                    required
                    value={bannerActionUrl}
                    onChange={(e) => setBannerActionUrl(e.target.value)}
                    placeholder="e.g. #courses or external https://..."
                    className={`w-full border rounded-xl px-3 py-2 text-xs focus:outline-none ${
                      isLight ? 'bg-slate-50 border-slate-200 text-slate-800' : 'bg-[#111]/80 border-cyan-500/10 text-white'
                    }`}
                  />
                </div>

                <button
                  type="submit"
                  className={`w-full font-bold text-xs py-2.5 rounded-xl cursor-pointer uppercase tracking-wider font-mono shadow-xs transition-all ${
                    isLight ? 'bg-amber-600 hover:bg-amber-700 text-white' : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950'
                  }`}
                >
                  Launch Banner Promo
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 3. Gallery Snapshot Creator Modal */}
      <AnimatePresence>
        {showGalleryModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setShowGalleryModal(false);
                setGalError('');
                setGalSuccess('');
              }}
              className="absolute inset-0 bg-black/85 backdrop-blur-xs cursor-pointer pointer-events-auto"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className={`border p-6 rounded-2xl max-w-lg w-full relative z-10 text-left space-y-4 max-h-[90vh] overflow-y-auto ${
                isLight ? 'bg-white border-slate-200 shadow-2xl' : 'bg-[#050505]/98 border-cyan-500/20 shadow-[0_0_55px_rgba(6,182,212,0.12)]'
              }`}
            >
              <div className="flex justify-between items-center border-b pb-2">
                <h3 className={`text-xs font-bold tracking-wider uppercase ${isLight ? 'text-amber-800 font-mono' : 'text-[#22d3ee] font-mono'}`}>
                  Post Photo Snapshot to Exhibition
                </h3>
                <button
                  onClick={() => setShowGalleryModal(false)}
                  className="text-slate-400 hover:text-red-400 transition-colors text-xs font-mono font-bold cursor-pointer"
                >
                  ✕ Close
                </button>
              </div>

              <form onSubmit={async (e) => {
                await handleCreateGalleryImage(e);
                setShowGalleryModal(false);
              }} className="space-y-3.5">
                {galError && <div className="text-3xs font-mono text-red-400 bg-red-950/25 p-2 rounded-xl">{galError}</div>}
                {galSuccess && <div className="text-3xs font-mono text-cyan-400 bg-cyan-950/25 p-2 rounded-xl font-bold">{galSuccess}</div>}

                <div>
                  <label className={`block text-[9px] font-mono uppercase mb-1 ${isLight ? 'text-amber-800/90' : 'text-cyan-400'}`}>Event Snapshot Title</label>
                  <input
                    type="text"
                    required
                    value={galTitle}
                    onChange={(e) => setGalTitle(e.target.value)}
                    placeholder="e.g. Waraseoni School IT Delivery"
                    className={`w-full border rounded-xl px-3 py-2 text-xs focus:outline-none ${
                      isLight ? 'bg-slate-50 border-slate-200 text-slate-800' : 'bg-[#111]/80 border-cyan-500/10 text-white'
                    }`}
                  />
                </div>

                <div>
                  <label className={`block text-[9px] font-mono uppercase mb-1 ${isLight ? 'text-amber-800/90' : 'text-cyan-400'}`}>Image Description (Contextual Caption)</label>
                  <textarea
                    required
                    value={galDesc}
                    onChange={(e) => setGalDesc(e.target.value)}
                    placeholder="Details on active training setups..."
                    rows={2}
                    className={`w-full border rounded-xl px-3 py-2 text-xs focus:outline-none ${
                      isLight ? 'bg-slate-50 border-slate-200 text-slate-800' : 'bg-[#111]/80 border-cyan-500/10 text-white'
                    }`}
                  />
                </div>

                <div>
                  <label className={`block text-[9px] font-mono uppercase mb-1 ${isLight ? 'text-amber-800/90' : 'text-cyan-400'}`}>Category Filter</label>
                  <select
                    value={galCategory}
                    onChange={(e) => setGalCategory(e.target.value as any)}
                    className={`w-full border rounded-xl px-3 py-2 text-xs focus:outline-none ${
                      isLight ? 'bg-slate-50 border-slate-200 text-slate-800' : 'bg-[#111]/80 border-cyan-500/10 text-white'
                    }`}
                  >
                    <option value="school_programs">School Outreach & NEP Labs</option>
                    <option value="iot_robotics">IoT & Robotic Microcontrollers</option>
                    <option value="mern_web">MERN Fullstack Architecture</option>
                    <option value="lab_setups">Laboratory System Deployments</option>
                  </select>
                </div>

                {/* Upload Photos Section */}
                <div className="space-y-2">
                  <label className={`block text-[9px] font-mono uppercase mb-1 ${isLight ? 'text-amber-800/90' : 'text-cyan-400'}`}>
                    Upload Photos (Single or Multiple)
                  </label>
                  <div className={`p-3 rounded-xl border border-dashed ${
                    isLight ? 'border-amber-300 bg-amber-50/50' : 'border-cyan-500/30 bg-[#071326]/50'
                  }`}>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleGalFileUpload}
                      disabled={isUploadingGalImage}
                      className={`block w-full text-4xs cursor-pointer file:mr-3 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-3xs file:font-bold disabled:opacity-50 ${
                        isLight 
                          ? 'text-slate-600 file:bg-amber-600 file:text-white' 
                          : 'text-slate-300 file:bg-cyan-500 file:text-slate-950'
                      }`}
                    />
                    {isUploadingGalImage && (
                      <p className="text-3xs font-mono text-cyan-300 animate-pulse mt-1.5">
                        {galUploadProgress || 'Uploading photos...'}
                      </p>
                    )}
                  </div>

                  {uploadedGalImages.length > 0 && (
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-4xs font-mono text-cyan-400 font-bold">
                        <span>Ready ({uploadedGalImages.length}):</span>
                        <button
                          type="button"
                          onClick={() => setUploadedGalImages([])}
                          className="text-red-400 hover:text-red-300 cursor-pointer text-4xs uppercase"
                        >
                          Clear All
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-2 max-h-36 overflow-y-auto p-1">
                        {uploadedGalImages.map((img, idx) => (
                          <div 
                            key={idx} 
                            className={`rounded-lg border p-1 flex items-center gap-2 ${
                              isLight ? 'bg-white border-slate-200' : 'bg-slate-900/80 border-cyan-500/20'
                            }`}
                          >
                            <img src={img.url} alt="" className="w-8 h-8 object-cover rounded shrink-0" referrerPolicy="no-referrer" />
                            <span className="text-4xs font-mono truncate flex-1 text-slate-300">{img.name || `Photo ${idx + 1}`}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveUploadedGalImage(idx)}
                              className="text-red-400 hover:text-red-200 cursor-pointer p-0.5"
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Optional URL */}
                  <div>
                    <label className={`block text-[9px] font-mono uppercase mb-1 ${isLight ? 'text-amber-800/90' : 'text-cyan-400'}`}>
                      Photo URL (Optional — leave blank if files are uploaded above)
                    </label>
                    <input
                      type="url"
                      value={galImageUrl}
                      onChange={(e) => setGalImageUrl(e.target.value)}
                      placeholder="https://... (Optional)"
                      className={`w-full border rounded-xl px-3 py-2 text-xs focus:outline-none ${
                        isLight ? 'bg-slate-50 border-slate-200 text-slate-800' : 'bg-[#111]/80 border-cyan-500/10 text-white'
                      }`}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className={`w-full font-bold text-xs py-2.5 rounded-xl cursor-pointer uppercase tracking-wider font-mono shadow-xs transition-all ${
                    isLight ? 'bg-amber-600 hover:bg-amber-700 text-white' : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950'
                  }`}
                >
                  {uploadedGalImages.length > 1 ? `Publish ${uploadedGalImages.length} Photos to Exhibition` : 'Post to Exhibition'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 4. Special Program Creator Modal */}
      <AnimatePresence>
        {showSpecialProgramModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setShowSpecialProgramModal(false);
                setSpecError('');
                setSpecSuccess('');
              }}
              className="absolute inset-0 bg-black/85 backdrop-blur-xs cursor-pointer pointer-events-auto"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className={`border p-6 rounded-2xl max-w-lg w-full relative z-10 text-left space-y-4 max-h-[90vh] overflow-y-auto ${
                isLight ? 'bg-white border-slate-200 shadow-2xl' : 'bg-[#050505]/98 border-cyan-500/20 shadow-[0_0_55px_rgba(6,182,212,0.12)]'
              }`}
            >
              <div className="flex justify-between items-center border-b pb-2">
                <h3 className={`text-xs font-bold tracking-wider uppercase ${isLight ? 'text-amber-800 font-mono' : 'text-[#22d3ee] font-mono'}`}>
                  Create Special Training Form Hub
                </h3>
                <button
                  onClick={() => setShowSpecialProgramModal(false)}
                  className="text-slate-400 hover:text-red-400 transition-colors text-xs font-mono font-bold cursor-pointer"
                >
                  ✕ Close
                </button>
              </div>

              <form onSubmit={async (e) => {
                await handleCreateSpecialProgram(e);
                setShowSpecialProgramModal(false);
              }} className="space-y-3.5">
                {specError && <p className="text-3xs text-red-400 bg-red-500/10 p-2 rounded-xl text-center">{specError}</p>}
                {specSuccess && <p className="text-3xs text-cyan-400 bg-cyan-500/10 p-2 rounded-xl text-center font-bold">{specSuccess}</p>}

                <div>
                  <label className={`block text-[9px] font-mono uppercase mb-1 ${isLight ? 'text-amber-800/90' : 'text-cyan-400'}`}>Training Program Name</label>
                  <input
                    type="text"
                    required
                    value={specName}
                    onChange={(e) => setSpecName(e.target.value)}
                    placeholder="e.g. Drone assembly workshop"
                    className={`w-full border rounded-xl px-3 py-2 text-xs focus:outline-none ${
                      isLight ? 'bg-slate-50 border-slate-200 text-slate-800' : 'bg-[#111]/80 border-cyan-500/10 text-white'
                    }`}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={`block text-[9px] font-mono uppercase mb-1 ${isLight ? 'text-amber-800/90' : 'text-cyan-400'}`}>Duration</label>
                    <input
                      type="text"
                      required
                      value={specDuration}
                      onChange={(e) => setSpecDuration(e.target.value)}
                      placeholder="e.g. 5 Days"
                      className={`w-full border rounded-xl px-3 py-2 text-xs focus:outline-none ${
                        isLight ? 'bg-slate-50 border-slate-200 text-slate-800' : 'bg-[#111]/80 border-cyan-500/10 text-white'
                      }`}
                    />
                  </div>
                  <div>
                    <label className={`block text-[9px] font-mono uppercase mb-1 ${isLight ? 'text-amber-800/90' : 'text-cyan-400'}`}>College/School Name</label>
                    <input
                      type="text"
                      required
                      value={specInstitution}
                      onChange={(e) => setSpecInstitution(e.target.value)}
                      placeholder="Govt Excellence School"
                      className={`w-full border rounded-xl px-3 py-2 text-xs focus:outline-none ${
                        isLight ? 'bg-slate-50 border-slate-200 text-slate-800' : 'bg-[#111]/80 border-cyan-500/10 text-white'
                      }`}
                    />
                  </div>
                </div>

                <div>
                  <label className={`block text-[9px] font-mono uppercase mb-1 ${isLight ? 'text-amber-800/90' : 'text-cyan-400'}`}>Starting Date & Time</label>
                  <input
                    type="datetime-local"
                    required
                    value={specStartDateTime}
                    onChange={(e) => setSpecStartDateTime(e.target.value)}
                    className={`w-full border rounded-xl px-3 py-2 text-xs focus:outline-none font-mono ${
                      isLight ? 'bg-slate-50 border-slate-200 text-slate-800' : 'bg-[#111]/80 border-cyan-500/10 text-white'
                    }`}
                  />
                </div>

                <button
                  type="submit"
                  className={`w-full font-black text-xs py-2.5 rounded-xl cursor-pointer uppercase transition-all font-mono tracking-wider ${
                    isLight ? 'bg-amber-600 hover:bg-amber-700 text-white' : 'bg-[#22d3ee] hover:bg-cyan-400 text-slate-950'
                  }`}
                >
                  Generate Form Hub
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 5. Manual Special Program Enrollment Modal */}
      <AnimatePresence>
        {showManualEnrollModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setShowManualEnrollModal(false);
                setManError('');
                setManSuccess('');
              }}
              className="absolute inset-0 bg-black/85 backdrop-blur-xs cursor-pointer pointer-events-auto"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className={`border p-6 rounded-2xl max-w-lg w-full relative z-10 text-left space-y-4 max-h-[90vh] overflow-y-auto ${
                isLight ? 'bg-white border-slate-200 shadow-2xl' : 'bg-[#050505]/98 border-cyan-500/20 shadow-[0_0_55px_rgba(6,182,212,0.12)]'
              }`}
            >
              <div className="flex justify-between items-center border-b pb-2">
                <h3 className={`text-xs font-bold tracking-wider uppercase ${isLight ? 'text-amber-800 font-mono' : 'text-[#22d3ee] font-mono'}`}>
                  Manual Candidate Program Enrollment
                </h3>
                <button
                  onClick={() => setShowManualEnrollModal(false)}
                  className="text-slate-400 hover:text-red-400 transition-colors text-xs font-mono font-bold cursor-pointer"
                >
                  ✕ Close
                </button>
              </div>

              <form onSubmit={async (e) => {
                handleManualEnroll(e);
                setShowManualEnrollModal(false);
              }} className="space-y-3.5">
                {manError && <p className="text-3xs text-red-400 bg-red-500/10 p-2 rounded-xl text-center font-mono">{manError}</p>}
                {manSuccess && <p className="text-3xs text-cyan-400 bg-cyan-500/10 p-2 rounded-xl text-center font-mono font-bold">{manSuccess}</p>}

                <div>
                  <label className={`block text-[9px] font-mono uppercase mb-1 ${isLight ? 'text-amber-800/90' : 'text-cyan-400'}`}>Select Special Program</label>
                  <select
                    required
                    value={selectedProgramId}
                    onChange={(e) => setSelectedProgramId(e.target.value)}
                    className={`w-full border rounded-xl px-3 py-2 text-xs focus:outline-none ${
                      isLight ? 'bg-slate-50 border-slate-200 text-slate-800' : 'bg-[#111]/80 border-cyan-500/10 text-white'
                    }`}
                  >
                    <option value="">-- Choose Program --</option>
                    {specialProgramsAll.map(p => (
                      <option key={p.id} value={p.id}>{p.trainingName} ({p.institutionName})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={`block text-[9px] font-mono uppercase mb-1 ${isLight ? 'text-amber-800/90' : 'text-cyan-400'}`}>Student Full Name</label>
                  <input
                    type="text"
                    required
                    value={manStudentName}
                    onChange={(e) => setManStudentName(e.target.value)}
                    placeholder="e.g. Priyanshu Patle"
                    className={`w-full border rounded-xl px-3 py-2 text-xs focus:outline-none ${
                      isLight ? 'bg-slate-50 border-slate-200 text-slate-800' : 'bg-[#111]/80 border-cyan-500/10 text-white'
                    }`}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={`block text-[9px] font-mono uppercase mb-1 ${isLight ? 'text-amber-800/90' : 'text-cyan-400'}`}>Branch/Class</label>
                    <input
                      type="text"
                      required
                      value={manBranch}
                      onChange={(e) => setManBranch(e.target.value)}
                      placeholder="e.g. CSE-B / Grade XI"
                      className={`w-full border rounded-xl px-3 py-2 text-xs focus:outline-none ${
                        isLight ? 'bg-slate-50 border-slate-200 text-slate-800' : 'bg-[#111]/80 border-cyan-500/10 text-white'
                      }`}
                    />
                  </div>
                  <div>
                    <label className={`block text-[9px] font-mono uppercase mb-1 ${isLight ? 'text-amber-800/90' : 'text-cyan-400'}`}>Academic Year/Roll</label>
                    <input
                      type="text"
                      required
                      value={manYear}
                      onChange={(e) => setManYear(e.target.value)}
                      placeholder="e.g. 3rd Year / 41"
                      className={`w-full border rounded-xl px-3 py-2 text-xs focus:outline-none ${
                        isLight ? 'bg-slate-50 border-slate-200 text-slate-800' : 'bg-[#111]/80 border-cyan-500/10 text-white'
                      }`}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={`block text-[9px] font-mono uppercase mb-1 ${isLight ? 'text-amber-800/90' : 'text-cyan-400'}`}>Father's Name</label>
                    <input
                      type="text"
                      required
                      value={manFathersName}
                      onChange={(e) => setManFathersName(e.target.value)}
                      placeholder="e.g. Mr. S. R. Patle"
                      className={`w-full border rounded-xl px-3 py-2 text-xs focus:outline-none ${
                        isLight ? 'bg-slate-50 border-slate-200 text-slate-800' : 'bg-[#111]/80 border-cyan-500/10 text-white'
                      }`}
                    />
                  </div>
                  <div>
                    <label className={`block text-[9px] font-mono uppercase mb-1 ${isLight ? 'text-amber-800/90' : 'text-cyan-400'}`}>Roll Number</label>
                    <input
                      type="text"
                      required
                      value={manRollNumber}
                      onChange={(e) => setManRollNumber(e.target.value)}
                      placeholder="e.g. ROLL-102"
                      className={`w-full border rounded-xl px-3 py-2 text-xs focus:outline-none ${
                        isLight ? 'bg-slate-50 border-slate-200 text-slate-800' : 'bg-[#111]/80 border-cyan-500/10 text-white'
                      }`}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={`block text-[9px] font-mono uppercase mb-1 ${isLight ? 'text-amber-800/90' : 'text-cyan-400'}`}>WhatsApp Number</label>
                    <input
                      type="text"
                      required
                      value={manMobile}
                      onChange={(e) => setManMobile(e.target.value)}
                      placeholder="e.g. 9179XXXXXX"
                      className={`w-full border rounded-xl px-3 py-2 text-xs focus:outline-none ${
                        isLight ? 'bg-slate-50 border-slate-200 text-slate-800' : 'bg-[#111]/80 border-cyan-500/10 text-white'
                      }`}
                    />
                  </div>
                  <div>
                    <label className={`block text-[9px] font-mono uppercase mb-1 ${isLight ? 'text-amber-800/90' : 'text-cyan-400'}`}>Student Email Key</label>
                    <input
                      type="email"
                      required
                      value={manEmail}
                      onChange={(e) => setManEmail(e.target.value)}
                      placeholder="e.g. candidate@gmail.com"
                      className={`w-full border rounded-xl px-3 py-2 text-xs focus:outline-none ${
                        isLight ? 'bg-slate-50 border-slate-200 text-slate-800' : 'bg-[#111]/80 border-cyan-500/10 text-white'
                      }`}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className={`w-full font-black text-xs py-2.5 rounded-xl cursor-pointer uppercase transition-all font-mono tracking-wider ${
                    isLight ? 'bg-amber-600 hover:bg-amber-700 text-white' : 'bg-cyan-50 hover:bg-cyan-400 text-slate-950'
                  }`}
                >
                  Enroll Student
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 6. Manual Trainer Creator Modal */}
      <AnimatePresence>
        {showTrainerCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setShowTrainerCreateModal(false);
                setTrainerError('');
                setTrainerSuccess('');
              }}
              className="absolute inset-0 bg-black/85 backdrop-blur-xs cursor-pointer pointer-events-auto"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className={`border p-6 rounded-2xl max-w-lg w-full relative z-10 text-left space-y-4 max-h-[90vh] overflow-y-auto ${
                isLight ? 'bg-white border-slate-200 shadow-2xl' : 'bg-[#050505]/98 border-cyan-500/20 shadow-[0_0_55px_rgba(6,182,212,0.12)]'
              }`}
            >
              <div className="flex justify-between items-center border-b pb-2">
                <h3 className={`text-xs font-bold tracking-wider uppercase ${isLight ? 'text-amber-800 font-mono' : 'text-[#22d3ee] font-mono'}`}>
                  Register Authorized Trainer Profile
                </h3>
                <button
                  onClick={() => setShowTrainerCreateModal(false)}
                  className="text-slate-400 hover:text-red-400 transition-colors text-xs font-mono font-bold cursor-pointer"
                >
                  ✕ Close
                </button>
              </div>

              <form onSubmit={handleCreateTrainerManually} className="space-y-3.5">
                {trainerError && <p className="text-3xs text-red-400 bg-red-500/10 p-2 rounded-xl text-center font-mono">{trainerError}</p>}
                {trainerSuccess && <p className="text-3xs text-cyan-400 bg-cyan-500/10 p-2 rounded-xl text-center font-mono font-bold">{trainerSuccess}</p>}

                <div>
                  <label className={`block text-[9px] font-mono uppercase mb-1 ${isLight ? 'text-amber-800/90' : 'text-cyan-400'}`}>Trainer Full Name</label>
                  <input
                    type="text"
                    required
                    value={newTrainerName}
                    onChange={(e) => setNewTrainerName(e.target.value)}
                    placeholder="e.g. Prof. Rakesh K. Verma"
                    className={`w-full border rounded-xl px-3 py-2 text-xs focus:outline-none ${
                      isLight ? 'bg-slate-50 border-slate-200 text-slate-800' : 'bg-[#111]/80 border-cyan-500/10 text-white'
                    }`}
                  />
                </div>

                <div>
                  <label className={`block text-[9px] font-mono uppercase mb-1 ${isLight ? 'text-amber-800/90' : 'text-cyan-400'}`}>Email Address</label>
                  <input
                    type="email"
                    required
                    value={newTrainerEmail}
                    onChange={(e) => setNewTrainerEmail(e.target.value)}
                    placeholder="e.g. rakesh@dakshyam.in"
                    className={`w-full border rounded-xl px-3 py-2 text-xs focus:outline-none ${
                      isLight ? 'bg-slate-50 border-slate-200 text-slate-800' : 'bg-[#111]/80 border-cyan-500/10 text-white'
                    }`}
                  />
                </div>

                <div>
                  <label className={`block text-[9px] font-mono uppercase mb-1 ${isLight ? 'text-amber-800/90' : 'text-cyan-400'}`}>Password</label>
                  <input
                    type="password"
                    required
                    value={newTrainerPassword}
                    onChange={(e) => setNewTrainerPassword(e.target.value)}
                    placeholder="Enter trainer secure key"
                    className={`w-full border rounded-xl px-3 py-2 text-xs focus:outline-none ${
                      isLight ? 'bg-slate-50 border-slate-200 text-slate-800' : 'bg-[#111]/80 border-cyan-500/10 text-white'
                    }`}
                  />
                </div>

                <div className="flex items-center gap-2 select-none">
                  <input
                    type="checkbox"
                    id="trainerApproved"
                    checked={newTrainerApproved}
                    onChange={(e) => setNewTrainerApproved(e.target.checked)}
                    className="rounded"
                  />
                  <label htmlFor="trainerApproved" className={`text-3xs font-mono cursor-pointer ${isLight ? 'text-slate-600' : 'text-slate-355'}`}>
                    Approve Trainer instantly (Full membership granted)
                  </label>
                </div>

                <button
                  type="submit"
                  className={`w-full font-bold text-xs py-2.5 rounded-xl cursor-pointer uppercase tracking-wider font-mono shadow-xs transition-all ${
                    isLight ? 'bg-amber-600 hover:bg-amber-700 text-white' : 'bg-cyan-50hover:bg-cyan-400 text-slate-950'
                  }`}
                >
                  Create Trainer Profile
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 7. Manual Student Creator Modal */}
      <AnimatePresence>
        {showStudentCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setShowStudentCreateModal(false);
                setStudentError('');
                setStudentSuccess('');
              }}
              className="absolute inset-0 bg-black/85 backdrop-blur-xs cursor-pointer pointer-events-auto"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className={`border p-6 rounded-2xl max-w-lg w-full relative z-10 text-left space-y-4 max-h-[90vh] overflow-y-auto ${
                isLight ? 'bg-white border-slate-200 shadow-2xl' : 'bg-[#050505]/98 border-cyan-500/20 shadow-[0_0_55px_rgba(6,182,212,0.12)]'
              }`}
            >
              <div className="flex justify-between items-center border-b pb-2">
                <h3 className={`text-xs font-bold tracking-wider uppercase ${isLight ? 'text-amber-800 font-mono' : 'text-[#22d3ee] font-mono'}`}>
                  Enroll & Register Student Manually
                </h3>
                <button
                  onClick={() => setShowStudentCreateModal(false)}
                  className="text-slate-400 hover:text-red-400 transition-colors text-xs font-mono font-bold cursor-pointer"
                >
                  ✕ Close
                </button>
              </div>

              <form onSubmit={handleCreateStudentManually} className="space-y-3.5">
                {studentError && <p className="text-3xs text-red-400 bg-red-500/10 p-2 rounded-xl text-center font-mono">{studentError}</p>}
                {studentSuccess && <p className="text-3xs text-cyan-400 bg-cyan-500/10 p-2 rounded-xl text-center font-mono font-bold">{studentSuccess}</p>}

                <div>
                  <label className={`block text-[9px] font-mono uppercase mb-1 ${isLight ? 'text-amber-800/90' : 'text-cyan-400'}`}>Student Full Name</label>
                  <input
                    type="text"
                    required
                    value={newStudentName}
                    onChange={(e) => setNewStudentName(e.target.value)}
                    placeholder="e.g. Ankush Nanda"
                    className={`w-full border rounded-xl px-3 py-2 text-xs focus:outline-none ${
                      isLight ? 'bg-slate-50 border-slate-200 text-slate-800' : 'bg-[#111]/80 border-cyan-500/10 text-white'
                    }`}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={`block text-[9px] font-mono uppercase mb-1 ${isLight ? 'text-amber-800/90' : 'text-cyan-400'}`}>Email Address</label>
                    <input
                      type="email"
                      required
                      value={newStudentEmail}
                      onChange={(e) => setNewStudentEmail(e.target.value)}
                      placeholder="e.g. student@gmail.com"
                      className={`w-full border rounded-xl px-3 py-2 text-xs focus:outline-none ${
                        isLight ? 'bg-slate-50 border-slate-200 text-slate-800' : 'bg-[#111]/80 border-cyan-500/10 text-white'
                      }`}
                    />
                  </div>
                  <div>
                    <label className={`block text-[9px] font-mono uppercase mb-1 ${isLight ? 'text-amber-800/90' : 'text-cyan-400'}`}>Contact Number</label>
                    <input
                      type="text"
                      value={newStudentPhone}
                      onChange={(e) => setNewStudentPhone(e.target.value)}
                      placeholder="e.g. 91790XXXXX"
                      className={`w-full border rounded-xl px-3 py-2 text-xs focus:outline-none ${
                        isLight ? 'bg-slate-50 border-slate-200 text-slate-800' : 'bg-[#111]/80 border-cyan-500/10 text-white'
                      }`}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={`block text-[9px] font-mono uppercase mb-1 ${isLight ? 'text-amber-800/90' : 'text-cyan-400'}`}>School / Institute</label>
                    <input
                      type="text"
                      value={newStudentSchool}
                      onChange={(e) => setNewStudentSchool(e.target.value)}
                      placeholder="e.g. Govt Excellence School"
                      className={`w-full border rounded-xl px-3 py-2 text-xs focus:outline-none ${
                        isLight ? 'bg-slate-50 border-slate-200 text-slate-800' : 'bg-[#111]/80 border-cyan-500/10 text-white'
                      }`}
                    />
                  </div>
                  <div>
                    <label className={`block text-[9px] font-mono uppercase mb-1 ${isLight ? 'text-amber-800/90' : 'text-cyan-400'}`}>Level / Standard</label>
                    <select
                      value={newStudentLevel}
                      onChange={(e) => setNewStudentLevel(e.target.value)}
                      className={`w-full border rounded-xl px-3 py-2 text-xs focus:outline-none ${
                        isLight ? 'bg-slate-50 border-slate-200 text-slate-800' : 'bg-[#111]/80 border-cyan-500/10 text-white'
                      }`}
                    >
                      <option value="Middle School">Middle School</option>
                      <option value="Grade 9">Grade 9</option>
                      <option value="Grade 10">Grade 10</option>
                      <option value="Grade 11">Grade 11</option>
                      <option value="Grade 12">Grade 12</option>
                      <option value="College Undergraduate">College Undergraduate</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={`block text-[9px] font-mono uppercase mb-1 ${isLight ? 'text-amber-800/90' : 'text-cyan-400'}`}>Student Password</label>
                    <input
                      type="password"
                      required
                      value={newStudentPassword}
                      onChange={(e) => setNewStudentPassword(e.target.value)}
                      placeholder="Enter login password"
                      className={`w-full border rounded-xl px-3 py-2 text-xs focus:outline-none ${
                        isLight ? 'bg-slate-50 border-slate-200 text-slate-800' : 'bg-[#111]/80 border-cyan-500/10 text-white'
                      }`}
                    />
                  </div>
                  <div>
                    <label className={`block text-[9px] font-mono uppercase mb-1 ${isLight ? 'text-amber-800/90' : 'text-cyan-400'}`}>Initial Experience Points</label>
                    <input
                      type="number"
                      value={newStudentPoints}
                      onChange={(e) => setNewStudentPoints(Number(e.target.value))}
                      placeholder="e.g. 100"
                      className={`w-full border rounded-xl px-3 py-2 text-xs focus:outline-none ${
                        isLight ? 'bg-slate-50 border-slate-200 text-slate-800' : 'bg-[#111]/80 border-cyan-500/10 text-white'
                      }`}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className={`w-full font-bold text-xs py-2.5 rounded-xl cursor-pointer uppercase tracking-wider font-mono shadow-xs transition-all ${
                    isLight ? 'bg-amber-600 hover:bg-amber-700 text-white' : 'bg-cyan-50 hover:bg-cyan-400 text-slate-950'
                  }`}
                >
                  Register & Create Student Profile
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* INSTAGRAM LINK ADMIN QUICK EDITOR MODAL */}
      <AnimatePresence>
        {showInstagramQuickModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className={`w-full max-w-lg rounded-3xl border shadow-2xl p-6 relative ${
                isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-[#0d1626] border-pink-500/30 text-white'
              }`}
            >
              <button
                type="button"
                onClick={() => setShowInstagramQuickModal(false)}
                className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 via-pink-500 to-purple-600 flex items-center justify-center text-white shadow-md">
                  <Instagram className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black uppercase font-mono tracking-wide">
                    Edit Instagram Profile Link
                  </h3>
                  <p className="text-xs text-slate-400 font-mono">
                    Updates live across all visitor footers, social badges, and navigation links.
                  </p>
                </div>
              </div>

              {instagramSaveSuccess && (
                <div className="mb-4 p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-mono flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  <span>✓ Instagram link saved and synced to cloud!</span>
                </div>
              )}

              <form onSubmit={(e) => {
                e.preventDefault();
                setIsSavingInstagram(true);
                try {
                  const currentAbout = DakshyamDatabase.getCompanyAbout();
                  const updated: CompanyAbout = {
                    ...currentAbout,
                    socialInstagram: quickInstagramUrl.trim()
                  };
                  DakshyamDatabase.saveCompanyAbout(updated);
                  fetch('/api/db/company_about', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(updated)
                  }).catch(() => {});
                  setInstagramSaveSuccess(true);
                  onRefresh();
                  setTimeout(() => {
                    setInstagramSaveSuccess(false);
                    setShowInstagramQuickModal(false);
                  }, 1200);
                } catch (err) {
                  console.error('Failed to save Instagram URL:', err);
                } finally {
                  setIsSavingInstagram(false);
                }
              }} className="space-y-4">
                <div className="space-y-1.5 text-left">
                  <label className="block text-2xs font-mono uppercase text-slate-400 font-bold">
                    Official Instagram Handle / Profile URL
                  </label>
                  <div className="relative">
                    <input
                      type="url"
                      required
                      value={quickInstagramUrl}
                      onChange={(e) => setQuickInstagramUrl(e.target.value)}
                      placeholder="https://instagram.com/dakshyam_innovations"
                      className={`w-full px-4 py-3 rounded-xl border text-xs font-mono focus:outline-none transition-all ${
                        isLight 
                          ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-pink-500' 
                          : 'bg-black/50 border-pink-500/30 text-white focus:border-pink-400'
                      }`}
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 font-mono">
                    Example: https://instagram.com/dakshyam_innovations
                  </p>
                </div>

                <div className="pt-2 flex items-center justify-end gap-2.5">
                  <a
                    href={quickInstagramUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="px-4 py-2.5 rounded-xl border border-white/10 hover:bg-white/10 text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Test Link</span>
                  </a>

                  <button
                    type="submit"
                    disabled={isSavingInstagram}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-mono font-bold text-xs uppercase tracking-wider flex items-center gap-2 cursor-pointer shadow-lg active:scale-95 transition-all disabled:opacity-50"
                  >
                    {isSavingInstagram ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                    <span>Save Instagram Link</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
