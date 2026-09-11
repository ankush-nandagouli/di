import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, Trash, BookOpen, Layers, Users, Calendar, 
  Settings, CheckCircle, HelpCircle, Activity, Award, Check, 
  ShieldCheck, Sparkles, Image as ImageIcon, ToggleLeft, ToggleRight, X,
  Download, FileSpreadsheet, Printer, RotateCcw, Eye
} from 'lucide-react';
import { Course, CourseApplication, StudentGroup, StudentUser, TrainerUser, PromoBanner, GalleryImage, SpecialTrainingProgram, SpecialProgramEnrollment, Certificate, CompanyAbout } from '../types';
import { DakshyamDatabase } from '../utils/db';
import { uploadMediaToCloudinary } from '../utils/mediaUpload';
import AnalyticsCharts from './AnalyticsCharts';
import { AboutEditorTab } from './AboutEditorTab';
import OfficialCertificate from './OfficialCertificate';
import PageLoaderSettingsTab from './PageLoaderSettingsTab';
import Home3DArtSettingsTab from './Home3DArtSettingsTab';

interface AdminDashboardProps {
  courses: Course[];
  applications: CourseApplication[];
  groups: StudentGroup[];
  students: StudentUser[];
  onRefresh: () => void;
  theme?: 'light' | 'dark';
  isDbConnected?: boolean;
  onTestLoader?: () => void;
}

export default function AdminDashboard({
  courses,
  applications,
  groups,
  students,
  onRefresh,
  theme = 'dark',
  isDbConnected = false,
  onTestLoader
}: AdminDashboardProps) {
  const isLight = theme === 'light';
  // Navigation tabs
  type TabType = 'analytics' | 'courses' | 'applications' | 'trainers' | 'promotions' | 'gallery' | 'special_training' | 'certificates' | 'about_editor' | 'page_loader' | 'home_3d_art' | 'logs';
  const [adminTab, setAdminTab] = useState<TabType>('analytics');

  // Audit Logs Filtering States
  const [searchLog, setSearchLog] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'SUCCESS' | 'ERROR' | 'INFO'>('ALL');

  // DB connection advice helper
  const [showDbAdvice, setShowDbAdvice] = useState(false);

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
  const [galCategory, setGalCategory] = useState<'school_programs' | 'iot_robotics' | 'mern_web' | 'lab_setups'>('school_programs');
  const [galError, setGalError] = useState('');
  const [galSuccess, setGalSuccess] = useState('');
  const [isUploadingGalImage, setIsUploadingGalImage] = useState(false);

  const handleGalFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setGalError('Please select a valid image file.');
      return;
    }
    setGalError('');
    setIsUploadingGalImage(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        const res = await fetch('/api/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ file: reader.result, resourceType: 'image' })
        });
        if (res.ok) {
          const data = await res.json();
          setGalImageUrl(data.url);
          setGalSuccess('✓ Exhibition snapshot successfully uploaded to Cloudinary!');
        } else {
          const err = await res.json();
          setGalError(err.error || 'Failed to upload image to Cloudinary.');
        }
      } catch (err: any) {
        setGalError('Cloudinary upload failed: ' + err.message);
      } finally {
        setIsUploadingGalImage(false);
      }
    };
    reader.readAsDataURL(file);
  };

  // Sourced active state data
  const trainersList = DakshyamDatabase.getTrainers();
  const bannersList = DakshyamDatabase.getBanners();
  const galleryList = DakshyamDatabase.getGalleryImages();

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
    if (confirm("🚨 WARNING: Are you sure you want to permanently delete each and every user and user-related record (Students, Trainers, Applications, Certificates, Student Groups, Social Videos, and Special Enrollments) from BOTH Firestore and Client Cache? This action is IRREVERSIBLE.")) {
      try {
        DakshyamDatabase.clearUserRelatedData();
        const res = await fetch('/api/db/clear', { method: 'POST' });
        if (res.ok) {
          alert('✓ Success: All seeded user databases and server directories successfully wiped clean!');
        } else {
          alert('✓ Client Cache wiped. Server directory response pending.');
        }
        onRefresh();
      } catch (err) {
        console.error("Purge fail:", err);
        alert('✓ Client cache cleared successfully!');
        onRefresh();
      }
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

  // --- DYNAMIC CERTIFICATE GENERATOR STATE ---
  const [certSelectedCourseId, setCertSelectedCourseId] = useState<string>('');
  const [certProjectTitle, setCertProjectTitle] = useState<string>('');
  const [certIssueDate, setCertIssueDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [certTrainerName, setCertTrainerName] = useState<string>('Trainer Vivek Mathur');
  const [certTrainerId, setCertTrainerId] = useState<string>('usr-t1');
  const [certSearchQuery, setCertSearchQuery] = useState<string>('');
  const [certCustomLogoUrl, setCertCustomLogoUrl] = useState<string>('');
  const [certCustomSealUrl, setCertCustomSealUrl] = useState<string>('');
  const [certTrainingPartnerName, setCertTrainingPartnerName] = useState<string>('');
  const [certTrainingPartnerLogoUrl, setCertTrainingPartnerLogoUrl] = useState<string>('');
  const [certPreviewObj, setCertPreviewObj] = useState<Certificate | null>(null);

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

  // Generate Unique Key for Certificate
  const generateUniqueCertificateKey = () => {
    const currentYear = new Date().getFullYear();
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let randomPart = '';
    for (let i = 0; i < 6; i++) {
      randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `DKM-${currentYear}-${randomPart}`;
  };

  // Generate individual student certificate
  const handleGenerateCertificateForStudent = (enroll: SpecialProgramEnrollment, program: SpecialTrainingProgram) => {
    try {
      const certificates = DakshyamDatabase.getCertificates();
      
      // Check if certificate already exists
      const exists = certificates.some(c => c.studentEmail.toLowerCase() === enroll.email.toLowerCase() && c.courseTitle === program.trainingName);
      if (exists) {
        alert('Certificate already generated and issued for this candidate!');
        return;
      }

      const certKey = generateUniqueCertificateKey();
      const newCert: Certificate = {
        id: certKey,
        studentName: enroll.name,
        studentEmail: enroll.email,
        courseTitle: program.trainingName,
        projectTitle: `Completed Special Training Program at ${program.institutionName}`,
        issueDate: new Date().toISOString().split('T')[0],
        trainerId: 'admin',
        trainerName: 'Dakshyam Innovations Board'
      };

      certificates.push(newCert);
      DakshyamDatabase.saveCertificates(certificates);
      
      alert(`Certificate issued successfully! Unique Verification Key: ${certKey}`);
      onRefresh();
    } catch {
      alert('Error saving certificate.');
    }
  };

  // Bulk generate certificates
  const handleBulkGenerate = (program: SpecialTrainingProgram) => {
    const enrolls = specialEnrollments.filter(e => e.programId === program.id);
    if (!enrolls.length) {
      alert('No registered students in this program to issue certificates!');
      return;
    }

    if (confirm(`Are you sure you want to bulk generate certificates for all ${enrolls.length} students?`)) {
      try {
        const certificates = DakshyamDatabase.getCertificates();
        let count = 0;

        enrolls.forEach(enroll => {
          const exists = certificates.some(c => c.studentEmail.toLowerCase() === enroll.email.toLowerCase() && c.courseTitle === program.trainingName);
          if (!exists) {
            const certKey = generateUniqueCertificateKey();
            const newCert: Certificate = {
              id: certKey,
              studentName: enroll.name,
              studentEmail: enroll.email,
              courseTitle: program.trainingName,
              projectTitle: `Completed Special Training Program at ${program.institutionName}`,
              issueDate: new Date().toISOString().split('T')[0],
              trainerId: 'admin',
              trainerName: 'Dakshyam Innovations Board'
            };
            certificates.push(newCert);
            count++;
          }
        });

        if (count > 0) {
          DakshyamDatabase.saveCertificates(certificates);
          alert(`Successfully generated and verified ${count} certificates in bulk format!`);
          onRefresh();
        } else {
          alert('All registered students already possess active issued certificates for this program.');
        }
      } catch {
        alert('Error processing bulk generations.');
      }
    }
  };

  // Export Special training program registry to CSV format
  const handleExportToCSV = (program: SpecialTrainingProgram) => {
    const enrolls = specialEnrollments.filter(e => e.programId === program.id);
    if (!enrolls.length) {
      alert('No enrolled student records found to export.');
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
    } catch (err) {
      alert('Failed exporting registry file. Ensure browser permits popup file triggers.');
    }
  };

  // --- CERTIFICATE DASHBOARD HANDLERS ---
  const handleGenerateFromDashboard = (student: { name: string; email: string; institution: string; courseTitle: string; defaultProject: string }) => {
    try {
      const certificates = DakshyamDatabase.getCertificates();
      
      const exists = certificates.some(c => c.studentEmail.toLowerCase() === student.email.toLowerCase() && c.courseTitle.trim().toLowerCase() === student.courseTitle.trim().toLowerCase());
      if (exists) {
        alert('Credentials certificate has already been issued for this student candidate!');
        return;
      }

      const certKey = generateUniqueCertificateKey();
      const newCert: Certificate = {
        id: certKey,
        studentName: student.name,
        studentEmail: student.email,
        courseTitle: student.courseTitle,
        projectTitle: certProjectTitle.trim() || student.defaultProject,
        issueDate: certIssueDate,
        trainerId: certTrainerId,
        trainerName: certTrainerName,
        customLogoUrl: certCustomLogoUrl || undefined,
        customSealUrl: certCustomSealUrl || undefined,
        trainingPartnerName: certTrainingPartnerName.trim() || undefined,
        trainingPartnerLogoUrl: certTrainingPartnerLogoUrl || undefined
      };

      certificates.push(newCert);
      DakshyamDatabase.saveCertificates(certificates);

      setCertPreviewObj(newCert);
      onRefresh();
    } catch {
      alert('Failed saving certificate record.');
    }
  };

  const handleBulkGenerateFromDashboard = (courseTitleStr: string, studentsList: Array<{ name: string; email: string; institution: string; defaultProject: string }>) => {
    if (!studentsList.length) {
      alert('No students found to issue certificates to.');
      return;
    }

    if (confirm(`Bulk generate verified credentials certificates for all ${studentsList.length} candidate students?`)) {
      try {
        const certificates = DakshyamDatabase.getCertificates();
        let count = 0;

        studentsList.forEach(st => {
          const exists = certificates.some(c => c.studentEmail.toLowerCase() === st.email.toLowerCase() && c.courseTitle.trim().toLowerCase() === courseTitleStr.trim().toLowerCase());
          if (!exists) {
            const certKey = generateUniqueCertificateKey();
            const newCert: Certificate = {
              id: certKey,
              studentName: st.name,
              studentEmail: st.email,
              courseTitle: courseTitleStr,
              projectTitle: certProjectTitle.trim() || st.defaultProject,
              issueDate: certIssueDate,
              trainerId: certTrainerId,
              trainerName: certTrainerName,
              customLogoUrl: certCustomLogoUrl || undefined,
              customSealUrl: certCustomSealUrl || undefined,
              trainingPartnerName: certTrainingPartnerName.trim() || undefined,
              trainingPartnerLogoUrl: certTrainingPartnerLogoUrl || undefined
            };
            certificates.push(newCert);
            count++;
          }
        });

        if (count > 0) {
          DakshyamDatabase.saveCertificates(certificates);
          alert(`Successfully generated and verified ${count} credentials certificates in bulk!`);
          onRefresh();
        } else {
          alert('All active students already possess approved certificate records.');
        }
      } catch {
        alert('Error processing bulk generations.');
      }
    }
  };

  const handleDeleteCertificate = (certId: string) => {
    if (confirm('Are you sure you want to revoke/delete this issued certificate record?')) {
      try {
        const certificates = DakshyamDatabase.getCertificates();
        const filtered = certificates.filter(c => c.id !== certId);
        DakshyamDatabase.saveCertificates(filtered);
        alert('Certificate revoked successfully.');
        onRefresh();
      } catch {
        alert('Error deleting certificate.');
      }
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

  // Handle Gallery Save
  const handleCreateGalleryImage = (e: React.FormEvent) => {
    e.preventDefault();
    setGalError('');
    setGalSuccess('');

    if (!galTitle.trim() || !galDesc.trim() || !galImageUrl.trim()) {
      setGalError('Title, photo/mesh URL, and description are mandatory fields.');
      return;
    }

    try {
      const gallery = DakshyamDatabase.getGalleryImages();
      const newImg: GalleryImage = {
        id: `gal-${Date.now()}`,
        title: galTitle,
        description: galDesc,
        imageUrl: galImageUrl,
        category: galCategory,
        createdAt: new Date().toISOString().split('T')[0]
      };

      gallery.push(newImg);
      DakshyamDatabase.saveGalleryImages(gallery);

      setGalSuccess('✓ Capioned project snapshot successfully uploaded to the public exhibition!');
      setGalTitle('');
      setGalDesc('');
      setGalImageUrl('');
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
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" /> DB Fallback Mode
            </button>
          )}
        </div>
      </div>

      {/* Database connection details banner if in fallback mode and clicked */}
      <AnimatePresence>
        {!isDbConnected && showDbAdvice && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className={`border p-4 rounded-xl text-xs space-y-2 relative overflow-hidden transition-all ${
              isLight 
                ? 'bg-amber-50/50 border-amber-200 text-slate-800' 
                : 'bg-amber-950/10 border-amber-500/10 text-slate-300'
            }`}
          >
            <button 
              onClick={() => setShowDbAdvice(false)}
              className="absolute top-3 right-3 text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-2 font-bold font-mono text-[#f59e0b] text-3xs uppercase tracking-wider">
              <Activity className="w-4 h-4" /> Connection Status: Local Failsafe Fallback Active
            </div>
            <p className="font-sans leading-relaxed">
              The application is fully operational and automatically persists data in a resilient local fallback server store, ensuring no interruption to your session!
            </p>
            <p className="font-sans leading-relaxed">
              To connect this container to your cloud MongoDB Database:
            </p>
            <ol className="list-decimal list-inside space-y-1 font-mono text-[10px] pl-1 text-slate-400">
              <li>Open <span className="text-[#22d3ee]">MongoDB Atlas</span> dashboard</li>
              <li>Go to <span className="text-white font-bold">Network Access</span> -&gt; <span className="text-white font-bold">Add IP Address</span></li>
              <li>Enter <span className="text-amber-300 font-bold">0.0.0.0/0</span> (Allow Access From Anywhere)</li>
              <li>Save changes, then perform any editing task to automatically trigger a reconnect!</li>
            </ol>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tabs list */}
      <div className={`flex flex-wrap gap-1.5 border-b pb-0.5 font-mono text-3xs uppercase font-extrabold scrollbar-none overflow-x-auto ${
        isLight ? 'border-slate-200' : 'border-cyan-500/10'
      }`}>
        {(['analytics', 'courses', 'applications', 'trainers', 'promotions', 'gallery', 'special_training', 'certificates', 'about_editor', 'page_loader', 'home_3d_art', 'logs'] as const).map(tab => (
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
            {tab === 'promotions' && 'Promo Banners'}
            {tab === 'gallery' && 'Class Gallery'}
            {tab === 'special_training' && '🎓 Special Training Forms'}
            {tab === 'certificates' && '🎖 Certificate Dashboard'}
            {tab === 'about_editor' && '✏️ About Page Editor'}
            {tab === 'page_loader' && '🎬 Video Page Loader'}
            {tab === 'home_3d_art' && '🧊 Home 3D Art (.obj)'}
            {tab === 'logs' && '🛡️ System Audit Logs'}
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
                applications.map(app => {
                  const matchCourse = courses.find(c => c.id === app.courseId);
                  
                  return (
                    <div 
                      key={app.id}
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
            <div className="text-left space-y-1">
              <h3 className={`text-xs font-bold tracking-wider uppercase border-b pb-2 ${
                isLight ? 'text-amber-800 border-slate-200' : 'text-white border-cyan-500/5'
              }`}>
                Trainer ID Verification Desk
              </h3>
              <p className={`text-3xs leading-relaxed max-w-xl ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                Dakshyam security guidelines mandate that newly registered Trainer profiles cannot access active grading grids, create peer groups, or issue dynamic student certificates until authorized below.
              </p>
            </div>

            <div className="space-y-3">
              {trainersList.map(trn => (
                <div 
                  key={trn.id}
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
                {bannersList.map(b => (
                  <div 
                    key={b.id}
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

        {/* TAB 6: CAPTIONED PROJECT IMAGE GALLERY */}
        {adminTab === 'gallery' && (
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

              <div className="space-y-2">
                <label className={`block text-[9px] font-mono uppercase mb-1 ${isLight ? 'text-amber-800/90' : 'text-cyan-400'}`}>Exhibition Snapshot Image (Cloudinary or Direct URL)</label>
                
                {/* Cloudinary Upload Option */}
                <div className="flex items-center gap-3">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleGalFileUpload}
                    disabled={isUploadingGalImage}
                    className={`block w-full text-4xs cursor-pointer file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-4xs file:font-semibold disabled:opacity-50 ${
                      isLight 
                        ? 'text-slate-500 file:bg-amber-100 file:text-amber-800 hover:file:bg-amber-200' 
                        : 'text-slate-400 file:bg-cyan-950 file:text-cyan-400 hover:file:bg-cyan-900'
                    }`}
                  />
                  {isUploadingGalImage && (
                    <span className="text-[9px] font-mono text-cyan-400 animate-pulse whitespace-nowrap">
                      Uploading to Cloudinary...
                    </span>
                  )}
                </div>

                <div className="text-[8px] font-mono text-slate-500 flex items-center gap-2">
                  <span>OR paste direct/Cloudinary image URL:</span>
                </div>

                <input
                  type="url"
                  required
                  value={galImageUrl}
                  onChange={(e) => setGalImageUrl(e.target.value)}
                  placeholder="https://res.cloudinary.com/... or https://images.unsplash.com/..."
                  className={`w-full border rounded-xl px-3 py-2 text-xs focus:outline-none transition-all ${
                    isLight 
                      ? 'bg-slate-50 border-slate-250 text-slate-800 focus:border-amber-500/50 placeholder:text-slate-455' 
                      : 'bg-[#111]/80 border-cyan-500/10 text-white focus:border-cyan-45'
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
                      ✓ Snapshot Image Loaded {galImageUrl.includes('cloudinary.com') ? '(Cloudinary Hosted)' : ''}
                    </span>
                  </div>
                )}
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
                {galleryList.map(g => (
                  <div 
                    key={g.id}
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
                    {specialProgramsAll.map(prog => {
                      const registries = specialEnrollments.filter(e => e.programId === prog.id);
                      const isExpired = new Date(prog.startingDateTime) < new Date();
                      
                      return (
                        <div 
                          key={prog.id}
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

                      <button
                        type="button"
                        onClick={() => handleBulkGenerate(currentProgram)}
                        className={`px-3.5 py-2 text-2xs font-mono font-black rounded-xl transition-all hover:scale-[1.02] cursor-pointer flex items-center gap-1.5 ${
                          isLight 
                            ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-600/10' 
                            : 'bg-cyan-500 text-slate-950'
                        }`}
                      >
                        <Award className="w-3.5 h-3.5" /> Bulk Generate certificates
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
                            placeholder="student@example.com"
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
                            <th className="p-3 text-right">Credentials Certificate Action</th>
                          </tr>
                        </thead>
                        <tbody className={`divide-y select-text ${isLight ? 'divide-slate-200' : 'divide-cyan-500/5'}`}>
                          {programEnrolls.map(enroll => {
                            const matchedCert = issuedCertificates.find(
                              c => c.studentEmail.toLowerCase() === enroll.email.toLowerCase() && c.courseTitle === currentProgram.trainingName
                            );

                            return (
                              <tr key={enroll.id} className={`transition-all ${
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
                                  {matchedCert ? (
                                    <div className={`flex items-center justify-end gap-1.5 font-bold border px-2.5 py-1 rounded-lg inline-flex select-all ${
                                      isLight ? 'border-emerald-300 bg-emerald-50 text-emerald-850' : 'border-emerald-500/10 bg-emerald-500/5 text-emerald-400'
                                    }`}>
                                      <Check className="w-3.5 h-3.5" /> Approved: <code>{matchedCert.id}</code>
                                    </div>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => handleGenerateCertificateForStudent(enroll, currentProgram)}
                                      className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer uppercase text-[9px] border ${
                                        isLight 
                                          ? 'border-amber-500/25 text-amber-805 bg-amber-50 hover:bg-amber-100' 
                                          : 'bg-cyan-500/10 hover:bg-cyan-500/20 text-[#22d3ee] border border-cyan-500/20 hover:border-cyan-400/40'
                                      }`}
                                    >
                                      ✓ Issue Certificate
                                    </button>
                                  )}
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

        {/* TAB 8: INTEGRATED CERTIFICATE DASHBOARD & PREMIUM GENERATOR */}
        {adminTab === 'certificates' && (() => {
          const issuedCertificates = DakshyamDatabase.getCertificates();
          
          // Get all standard courses and special programs to display in selector
          const allOptions = [
            ...courses.map(c => ({ id: c.id, title: c.title, isSpecial: false, type: 'Course' })),
            ...specialProgramsAll.map(p => ({ id: p.id, title: p.trainingName, isSpecial: true, type: 'Special Program', institution: p.institutionName }))
          ];

          // Determine selected course details
          const selectedOption = allOptions.find(opt => opt.id === certSelectedCourseId);
          
          // Get students for selected option
          let registeredStudents: Array<{ id: string; name: string; email: string; institution: string; statusInfo: string; isRegistered: boolean; defaultProject: string }> = [];
          if (selectedOption) {
            if (selectedOption.isSpecial) {
              const enrolls = specialEnrollments.filter(e => e.programId === selectedOption.id);
              registeredStudents = enrolls.map(e => ({
                id: e.id,
                name: e.name,
                email: e.email,
                institution: e.institutionName,
                statusInfo: 'Registered for campus training',
                isRegistered: true,
                defaultProject: `Completed Special Training Program at ${e.institutionName}`
              }));
            } else {
              const enrolls = applications.filter(a => a.courseId === selectedOption.id);
              registeredStudents = enrolls.map(e => ({
                id: e.id,
                name: e.fullName,
                email: e.email,
                institution: e.institution || 'Regional Academy',
                statusInfo: e.status === 'approved' ? 'Admitted (Approved)' : `Applied (${e.status})`,
                isRegistered: e.status === 'approved',
                defaultProject: 'Completed sovereign hardware instrumentation modules'
              }));
            }
          }

          // Filter issued certificates by search query
          const filteredCerts = issuedCertificates.filter(c => {
            const query = certSearchQuery.toLowerCase().trim();
            if (!query) return true;
            return (
              c.studentName.toLowerCase().includes(query) ||
              c.studentEmail.toLowerCase().includes(query) ||
              c.courseTitle.toLowerCase().includes(query) ||
              c.id.toLowerCase().includes(query)
            );
          });

          return (
            <div className="space-y-6 font-sans">
              
              {/* Part 1: Top Control Panels */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-left">
                
                {/* 1A: Setup & Customizer */}
                <div className="bg-[#050505]/75 border border-cyan-500/10 rounded-2xl p-5 space-y-4 lg:col-span-1">
                  <div className="border-b border-cyan-500/15 pb-2">
                    <h3 className="text-xs font-bold text-[#22d3ee] font-mono tracking-wider uppercase flex items-center gap-1.5">
                      <Award className="w-4 h-4" /> Certificate of Completion Engine
                    </h3>
                    <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
                      Calibrate custom parameters for instant high-fidelity vector generation. Handlers automatically pull coordinates, roll data, and verify keys.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-[9px] font-mono text-cyan-400 uppercase mb-1">Select Target Module/Course</label>
                      <select
                        value={certSelectedCourseId}
                        onChange={(e) => {
                          setCertSelectedCourseId(e.target.value);
                          setCertProjectTitle(''); // reset title on change
                        }}
                        className="w-full bg-[#111]/80 border border-cyan-500/10 text-white rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-cyan-400 text-slate-300"
                      >
                        <option value="">-- Choose Course/Program ({allOptions.length}) --</option>
                        {allOptions.map((opt) => (
                          <option key={opt.id} value={opt.id}>
                            [{opt.type}] {opt.title.substring(0, 45)}{opt.title.length > 45 ? '...' : ''}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[9px] font-mono text-cyan-400 uppercase mb-1">Custom Project/Curricula Title (Optional)</label>
                      <input
                        type="text"
                        value={certProjectTitle}
                        onChange={(e) => setCertProjectTitle(e.target.value)}
                        placeholder="e.g. Smart IoT Soil moisture solar node"
                        className="w-full bg-[#111]/80 border border-cyan-500/10 text-white rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-cyan-400 text-slate-350"
                      />
                      <span className="text-[8px] text-slate-500 block mt-0.5 leading-relaxed">
                        If left blank, custom modules assign standard completions.
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[9px] font-mono text-cyan-400 uppercase mb-1">Issue Date</label>
                        <input
                          type="date"
                          value={certIssueDate}
                          onChange={(e) => setCertIssueDate(e.target.value)}
                          className="w-full bg-[#111]/80 border border-cyan-500/10 text-white rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-cyan-400 text-slate-300 font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] font-mono text-cyan-400 uppercase mb-1">Assigned Trainer</label>
                        <select
                          value={certTrainerId}
                          onChange={(e) => {
                            setCertTrainerId(e.target.value);
                            const matched = trainersList.find(t => t.id === e.target.value);
                            if (matched) setCertTrainerName(matched.name);
                          }}
                          className="w-full bg-[#111]/80 border border-cyan-500/10 text-white rounded-xl px-2 py-1.5 text-xs focus:outline-none focus:border-cyan-400 text-slate-300"
                        >
                          <option value="admin">Admin Board</option>
                          {trainersList.map(t => (
                            <option key={t.id} value={t.id}>{t.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Integrated Custom Branding & Partner Configuration */}
                    <div className="border-t border-cyan-500/10 pt-3 space-y-3">
                      <h4 className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest font-extrabold">Custom Branding & Partnership Options</h4>
                      
                      <div className="grid grid-cols-2 gap-3">
                        {/* Custom Logo Upload */}
                        <div>
                          <label className="block text-[8px] font-mono text-slate-400 uppercase mb-1">Custom Issuer Logo (Cloudinary)</label>
                          <div className="relative">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  const res = await uploadMediaToCloudinary(file, 'image');
                                  setCertCustomLogoUrl(res.url);
                                }
                              }}
                              className="hidden"
                              id="cert-logo-upload"
                            />
                            <label
                              htmlFor="cert-logo-upload"
                              className="flex items-center justify-center gap-1 bg-black/40 border border-slate-500/10 hover:border-cyan-500/30 text-[9px] text-slate-300 font-semibold py-1.5 px-2 rounded-lg cursor-pointer transition-all uppercase"
                            >
                              {certCustomLogoUrl ? "✓ Logo Loaded" : "Upload Logo"}
                            </label>
                          </div>
                          {certCustomLogoUrl && (
                            <button
                              type="button"
                              onClick={() => setCertCustomLogoUrl("")}
                              className="text-[8px] text-red-400 hover:underline mt-1 block text-left"
                            >
                              Remove Logo
                            </button>
                          )}
                        </div>

                        {/* Custom Seal Upload */}
                        <div>
                          <label className="block text-[8px] font-mono text-slate-400 uppercase mb-1">Custom Seal Image (Cloudinary)</label>
                          <div className="relative">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  const res = await uploadMediaToCloudinary(file, 'image');
                                  setCertCustomSealUrl(res.url);
                                }
                              }}
                              className="hidden"
                              id="cert-seal-upload"
                            />
                            <label
                              htmlFor="cert-seal-upload"
                              className="flex items-center justify-center gap-1 bg-black/40 border border-slate-500/10 hover:border-cyan-500/30 text-[9px] text-slate-300 font-semibold py-1.5 px-2 rounded-lg cursor-pointer transition-all uppercase"
                            >
                              {certCustomSealUrl ? "✓ Seal Loaded" : "Upload Seal"}
                            </label>
                          </div>
                          {certCustomSealUrl && (
                            <button
                              type="button"
                              onClick={() => setCertCustomSealUrl("")}
                              className="text-[8px] text-red-400 hover:underline mt-1 block text-left"
                            >
                              Remove Seal
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Training Partner Segment */}
                      <div className="space-y-2 text-left">
                        <div>
                          <label className="block text-[8px] font-mono text-slate-400 uppercase mb-1">Training Partner Name (Optional)</label>
                          <input
                            type="text"
                            value={certTrainingPartnerName}
                            onChange={(e) => setCertTrainingPartnerName(e.target.value)}
                            placeholder="e.g. State Innovation Cooperative"
                            className="w-full bg-[#111]/80 border border-slate-500/10 text-white rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-cyan-400 text-slate-300"
                          />
                        </div>

                        {certTrainingPartnerName && (
                          <div>
                            <label className="block text-[8px] font-mono text-slate-400 uppercase mb-1">Partner Logo (Cloudinary)</label>
                            <div className="relative">
                              <input
                                type="file"
                                accept="image/*"
                                onChange={async (e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    const res = await uploadMediaToCloudinary(file, 'image');
                                    setCertTrainingPartnerLogoUrl(res.url);
                                  }
                                }}
                                className="hidden"
                                id="cert-partner-logo-upload"
                              />
                              <label
                                htmlFor="cert-partner-logo-upload"
                                className="flex items-center justify-center gap-1 bg-black/40 border border-slate-500/10 hover:border-cyan-500/30 text-[9px] text-slate-300 font-semibold py-1.5 px-2 rounded-lg cursor-pointer transition-all uppercase"
                              >
                                {certTrainingPartnerLogoUrl ? "✓ Partner Logo Loaded" : "Upload Partner Logo"}
                              </label>
                            </div>
                            {certTrainingPartnerLogoUrl && (
                              <button
                                type="button"
                                onClick={() => setCertTrainingPartnerLogoUrl("")}
                                className="text-[8px] text-red-400 hover:underline mt-1 block text-left"
                              >
                                Remove Partner Logo
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {selectedOption && registeredStudents.length > 0 && (
                      <button
                        type="button"
                        onClick={() => handleBulkGenerateFromDashboard(selectedOption.title, registeredStudents.map(rs => ({
                          name: rs.name,
                          email: rs.email,
                          institution: rs.institution,
                          defaultProject: rs.defaultProject
                        })))}
                        className="w-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs py-2.5 rounded-xl transition-all cursor-pointer uppercase font-mono tracking-wider hover:shadow-[0_0_12px_rgba(34,211,238,0.22)] flex items-center justify-center gap-1.5 mt-2"
                      >
                        <Award className="w-4 h-4" /> Bulk Generate {registeredStudents.length} Certificates
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        setCertPreviewObj({
                          id: `DKM-2026-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
                          studentName: registeredStudents[0]?.name || "Alex M. Sharma",
                          studentEmail: registeredStudents[0]?.email || "alex.sharma@dakshyam.edu",
                          courseTitle: selectedOption?.title || "Industrial IoT & Edge Computing Systems",
                          projectTitle: certProjectTitle || registeredStudents[0]?.defaultProject || "Smart Autonomous Telemetry Node",
                          issueDate: certIssueDate || new Date().toISOString().split('T')[0],
                          trainerName: certTrainerName || "Er. Aniket Sharma, M.Tech",
                          customLogoUrl: certCustomLogoUrl || undefined,
                          customSealUrl: certCustomSealUrl || undefined,
                          trainingPartnerName: certTrainingPartnerName || undefined,
                          trainingPartnerLogoUrl: certTrainingPartnerLogoUrl || undefined
                        });
                      }}
                      className="w-full bg-slate-900/90 hover:bg-slate-800 border border-amber-500/30 hover:border-amber-400 text-amber-300 font-bold text-xs py-2 rounded-xl transition-all cursor-pointer uppercase font-mono tracking-wider flex items-center justify-center gap-1.5 mt-2"
                    >
                      <Eye className="w-3.5 h-3.5" /> Preview Certificate of Completion
                    </button>
                  </div>
                </div>

                {/* 1B: Candidate Students List */}
                <div className="bg-[#050505]/75 border border-cyan-500/10 rounded-2xl p-5 space-y-4 lg:col-span-2 text-left">
                  <div className="border-b border-cyan-500/15 pb-2 flex justify-between items-center">
                    <div>
                      <h3 className="text-xs font-bold text-white tracking-wider uppercase font-mono">
                        Target Candidate Student Registry
                      </h3>
                      <p className="text-[10px] text-slate-400 leading-relaxed mt-0.5">
                        {certSelectedCourseId ? 'Displaying enrolled/admissions roster for selected code.' : 'Please select a training course from the parameter configuration dropdown.'}
                      </p>
                    </div>
                    {certSelectedCourseId && (
                      <span className="text-[10px] font-mono bg-cyan-500/15 border border-cyan-500/20 px-2.5 py-1 rounded-lg text-[#22d3ee] font-bold">
                        {registeredStudents.length} Active Candidates
                      </span>
                    )}
                  </div>

                  {certSelectedCourseId ? (
                    registeredStudents.length > 0 ? (
                      <div className="overflow-y-auto max-h-[280px] border border-cyan-500/5 rounded-xl bg-black/30 select-text">
                        <table className="w-full table-auto text-left font-mono text-3xs">
                          <thead>
                            <tr className="bg-cyan-950/20 text-[#22d3ee]/80 border-b border-cyan-500/10 uppercase tracking-wider font-extrabold text-[8px]">
                              <th className="p-2.5">Student Name</th>
                              <th className="p-2.5">Institution / school</th>
                              <th className="p-2.5">Email Contact</th>
                              <th className="p-2.5">Status info</th>
                              <th className="p-2.5 text-right">Generator Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-cyan-500/5 col">
                            {registeredStudents.map(student => {
                              const matchedCert = issuedCertificates.find(
                                c => c.studentEmail.toLowerCase() === student.email.toLowerCase() && c.courseTitle.trim().toLowerCase() === selectedOption.title.trim().toLowerCase()
                              );

                              return (
                                <tr key={student.id} className="hover:bg-cyan-500/5 transition-all text-slate-350">
                                  <td className="p-2.5">
                                    <span className="font-extrabold text-white uppercase block">{student.name}</span>
                                  </td>
                                  <td className="p-2.5 text-slate-450">{student.institution}</td>
                                  <td className="p-2.5 lowercase">{student.email}</td>
                                  <td className="p-2.5">
                                    <span className={`text-[8px] uppercase px-2 py-0.5 rounded-full font-bold font-mono ${
                                      student.isRegistered
                                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/10'
                                        : 'bg-amber-500/10 text-amber-400 border border-amber-500/10'
                                    }`}>
                                      {student.statusInfo}
                                    </span>
                                  </td>
                                  <td className="p-2.5 text-right">
                                    {matchedCert ? (
                                      <div className="flex items-center justify-end gap-1 text-emerald-400 font-bold bg-emerald-500/5 border border-emerald-500/15 px-2 py-0.5 rounded-lg text-[9px] inline-flex">
                                        <Check className="w-3 h-3" /> <code>{matchedCert.id}</code>
                                      </div>
                                    ) : (
                                      <button
                                        type="button"
                                        onClick={() => handleGenerateFromDashboard({
                                          name: student.name,
                                          email: student.email,
                                          institution: student.institution,
                                          courseTitle: selectedOption.title,
                                          defaultProject: student.defaultProject
                                        })}
                                        className="bg-[#22d3ee] hover:bg-cyan-400 text-slate-950 px-2.5 py-1 rounded-md font-bold transition-all cursor-pointer uppercase text-[9px]"
                                      >
                                        ✓ Generate
                                      </button>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="text-center py-12 border border-dashed border-cyan-500/10 rounded-xl">
                        <p className="text-xs text-slate-500 italic font-mono">No students registered or approved for this module/course yet.</p>
                      </div>
                    )
                  ) : (
                    <div className="text-center py-16 border border-dashed border-cyan-500/10 rounded-xl">
                      <p className="text-xs text-slate-500 italic font-mono">Please select a course on the left configure panel to inspect registered student records.</p>
                    </div>
                  )}
                </div>

              </div>

              {/* Part 2: Issued Credentials Archives */}
              <div className="bg-[#050505]/75 border border-cyan-500/10 rounded-2xl p-5 space-y-4 text-left">
                <div className="border-b border-cyan-500/15 pb-2 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <h3 className="text-xs font-bold text-white tracking-wider uppercase font-mono">
                      Issued Credentials registry & Verification ledger ({issuedCertificates.length})
                    </h3>
                    <p className="text-[10px] text-slate-400 leading-relaxed mt-0.5">
                      Lists all officially verified certificates logged within browser cache. Matches signature values instantly.
                    </p>
                  </div>
                  
                  {/* Search Query */}
                  <div className="w-full sm:w-64">
                    <input
                      type="text"
                      value={certSearchQuery}
                      onChange={(e) => setCertSearchQuery(e.target.value)}
                      placeholder="Search name, code, or course..."
                      className="w-full bg-black/60 border border-cyan-500/10 text-white rounded-xl px-3 py-1.5 text-2xs focus:outline-none focus:border-cyan-400 font-mono placeholder:text-slate-600"
                    />
                  </div>
                </div>

                {filteredCerts.length > 0 ? (
                  <div className="overflow-x-auto border border-cyan-500/5 rounded-xl bg-black/30 select-text">
                    <table className="w-full table-auto text-left font-mono text-3xs">
                      <thead>
                        <tr className="bg-cyan-950/20 text-[#22d3ee]/80 border-b border-cyan-500/10 uppercase tracking-wider font-extrabold text-[8px]">
                          <th className="p-3">Verified code</th>
                          <th className="p-3">Candidate name</th>
                          <th className="p-3">Email address</th>
                          <th className="p-3">Authorized course</th>
                          <th className="p-3">Project details</th>
                          <th className="p-3">Issue date</th>
                          <th className="p-3 text-right">Signature actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-cyan-500/5">
                        {filteredCerts.map(cert => (
                          <tr key={cert.id} className="hover:bg-cyan-500/5 transition-all text-slate-350">
                            <td className="p-3 font-bold text-[#22d3ee] tracking-wide select-all">{cert.id}</td>
                            <td className="p-3 font-extrabold text-white text-[10px] uppercase">{cert.studentName}</td>
                            <td className="p-3 lowercase">{cert.studentEmail}</td>
                            <td className="p-3 text-[#22d3ee] font-medium">{cert.courseTitle}</td>
                            <td className="p-3 text-slate-400 italic font-mono">"{cert.projectTitle}"</td>
                            <td className="p-3 font-bold">{cert.issueDate}</td>
                            <td className="p-3 text-right space-x-1 shrink-0">
                              <button
                                type="button"
                                onClick={() => setCertPreviewObj(cert)}
                                className="bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/25 text-cyan-300 px-2.5 py-1 rounded-md text-[9px] font-bold transition-all uppercase cursor-pointer"
                              >
                                View Doc
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteCertificate(cert.id)}
                                className="bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 p-1 rounded-md transition-all cursor-pointer inline-flex align-middle"
                                title="Revoke Certificate"
                              >
                                <Trash className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-10">
                    <p className="text-xs text-slate-500 italic font-mono">No matching verified certificates found.</p>
                  </div>
                )}
              </div>

              {/* Dynamic SVG Certificate Preview / Generator Preview Modal Overlay */}
              {certPreviewObj && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 overflow-y-auto">
                  <div 
                    onClick={() => setCertPreviewObj(null)}
                    className="fixed inset-0 bg-black/85 backdrop-blur-md cursor-pointer"
                  />

                  <div className="bg-[#050b14] border border-amber-500/30 rounded-3xl max-w-5xl w-full relative z-10 p-4 md:p-7 space-y-4 text-center max-h-[96vh] overflow-y-auto shadow-[0_0_60px_rgba(0,0,0,0.8)]">
                    <OfficialCertificate 
                      certificate={certPreviewObj}
                      onClose={() => setCertPreviewObj(null)}
                      showControls={true}
                      theme={theme}
                    />

                    <div className="flex flex-wrap justify-between items-center bg-black/50 border border-slate-700/40 px-4 py-2.5 rounded-xl max-w-3xl mx-auto text-left font-mono text-[11px] gap-2">
                      <div className="space-y-0.5">
                        <span className="text-slate-400 uppercase text-[9px] block">Verified Authorizing Issuer</span>
                        <span className="text-slate-200 font-bold block">{certPreviewObj.trainerName || 'Dakshyam Innovations Board'}</span>
                      </div>
                      <div className="space-y-0.5 text-right">
                        <span className="text-emerald-400 font-black uppercase text-[9px] block">Ledger Status: 100% Cryptographic Match</span>
                        <span className="text-amber-300 font-mono font-bold tracking-wider">{certPreviewObj.id}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

            </div>
          )
        })()}

        {/* TAB 9: ABOUT PAGE COMMANDER */}
        {adminTab === 'about_editor' && (
          <AboutEditorTab onRefresh={onRefresh} theme="" />
        )}

        {/* TAB 10: ANIMATED VIDEO PAGE LOADER SETTINGS */}
        {adminTab === 'page_loader' && (
          <PageLoaderSettingsTab 
            theme={theme}
            onTestLoader={() => {
              if (onTestLoader) {
                onTestLoader();
              }
            }}
          />
        )}

        {/* TAB 11: HOME PAGE 3D ART & OBJ MODEL */}
        {adminTab === 'home_3d_art' && (
          <Home3DArtSettingsTab theme={theme} />
        )}

        {/* TAB 11: ADMINISTRATIVE LOG CONTROL */}
        {adminTab === 'logs' && (() => {
          const rawLogs = DakshyamDatabase.getAppLogs();
          const filteredLogs = rawLogs.filter(log => {
            const matchesSearch = log.action.toLowerCase().includes(searchLog.toLowerCase()) || 
                                  log.details.toLowerCase().includes(searchLog.toLowerCase()) ||
                                  log.userEmail.toLowerCase().includes(searchLog.toLowerCase());
            const matchesStatus = statusFilter === 'ALL' || log.status === statusFilter;
            return matchesSearch && matchesStatus;
          });

          return (
            <div className="space-y-6 text-left">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-4 border-slate-500/10">
                <div>
                  <h3 className={`text-sm font-black font-mono tracking-wider uppercase ${isLight ? 'text-amber-800' : 'text-[#22d3ee]'}`}>
                    🛡️ System Access and Security Audit logs
                  </h3>
                  <p className="text-3xs font-mono text-slate-500 mt-0.5">
                    Centralized platform telemetry tracking user logins, failed attempts, and operational updates in real time.
                  </p>
                </div>
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
                          status: 'INFO'
                        }
                      ]);
                      onRefresh();
                    }
                  }}
                  className={`px-3 py-1.5 rounded-xl border font-mono text-3xs font-bold transition-all hover:bg-red-500 hover:text-white cursor-pointer ${
                    isLight ? 'border-red-500/35 text-red-700 bg-red-50/50' : 'border-red-500/20 text-red-400 bg-red-950/20'
                  }`}
                >
                  Clear Audit Log Stream
                </button>
              </div>

              {/* Filtering Controls */}
              <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
                <input
                  type="text"
                  placeholder="Filter logs by action, details, or operator email..."
                  value={searchLog}
                  onChange={(e) => setSearchLog(e.target.value)}
                  className={`w-full sm:max-w-md rounded-xl px-3 py-2 text-3xs font-mono border focus:outline-none focus:ring-1 ${
                    isLight
                      ? 'bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400 focus:border-amber-500'
                      : 'bg-[#111]/80 border-cyan-500/10 text-white placeholder-slate-500 focus:border-cyan-450'
                  }`}
                />
                
                <div className="flex gap-1">
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

              {/* Log List */}
              <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                {filteredLogs.length === 0 ? (
                  <div className={`p-8 text-center rounded-2xl border ${
                    isLight ? 'bg-slate-50 border-slate-200 text-slate-400' : 'bg-[#111]/40 border-cyan-500/5 text-slate-500'
                  }`}>
                    <p className="text-3xs font-mono">No telemetry events found matching the criteria.</p>
                  </div>
                ) : (
                  filteredLogs.map(log => {
                    let statusBg = '';
                    if (log.status === 'SUCCESS') {
                      statusBg = isLight ? 'bg-emerald-50 text-emerald-800 border-emerald-500/20' : 'bg-emerald-950/20 text-emerald-400 border-emerald-500/20';
                    } else if (log.status === 'ERROR') {
                      statusBg = isLight ? 'bg-red-50 text-red-800 border-red-500/20' : 'bg-red-950/20 text-red-450 border-red-500/20';
                    } else {
                      statusBg = isLight ? 'bg-slate-50 text-slate-700 border-slate-200' : 'bg-zinc-900/60 text-zinc-400 border-cyan-500/5';
                    }

                    return (
                      <div
                        key={log.id}
                        className={`p-3.5 rounded-xl border flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-3xs font-mono transition-all ${
                          isLight ? 'bg-slate-50/50 border-slate-150 hover:bg-slate-50' : 'bg-[#111]/60 border-cyan-500/5 hover:border-cyan-500/10'
                        }`}
                      >
                        <div className="space-y-1.5 flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className={`px-1.5 py-0.5 rounded text-4xs uppercase font-extrabold border ${statusBg}`}>
                              {log.status}
                            </span>
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

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                  <div>
                    <label className={`block text-[9px] font-mono uppercase mb-1 ${isLight ? 'text-amber-800/90' : 'text-cyan-400'}`}>Exhibition Photo URL</label>
                    <input
                      type="url"
                      required
                      value={galImageUrl}
                      onChange={(e) => setGalImageUrl(e.target.value)}
                      placeholder="https://images.unsplash.com/..."
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
                  Post to Exhibition
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

    </div>
  );
}
