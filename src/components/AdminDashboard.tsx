import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, Trash, BookOpen, Layers, Users, Calendar, 
  Settings, CheckCircle, HelpCircle, Activity, Award, Check, 
  ShieldCheck, Sparkles, Image as ImageIcon, ToggleLeft, ToggleRight, X,
  Download, FileSpreadsheet, Printer, RotateCcw
} from 'lucide-react';
import { Course, CourseApplication, StudentGroup, StudentUser, TrainerUser, PromoBanner, GalleryImage, SpecialTrainingProgram, SpecialProgramEnrollment, Certificate, CompanyAbout } from '../types';
import { DakshyamDatabase } from '../utils/db';
import AnalyticsCharts from './AnalyticsCharts';
import { AboutEditorTab } from './AboutEditorTab';

interface AdminDashboardProps {
  courses: Course[];
  applications: CourseApplication[];
  groups: StudentGroup[];
  students: StudentUser[];
  onRefresh: () => void;
}

export default function AdminDashboard({
  courses,
  applications,
  groups,
  students,
  onRefresh
}: AdminDashboardProps) {
  // Navigation tabs
  type TabType = 'analytics' | 'courses' | 'applications' | 'trainers' | 'promotions' | 'gallery' | 'special_training' | 'certificates' | 'about_editor';
  const [adminTab, setAdminTab] = useState<TabType>('analytics');

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

  // Sourced active state data
  const trainersList = DakshyamDatabase.getTrainers();
  const bannersList = DakshyamDatabase.getBanners();
  const galleryList = DakshyamDatabase.getGalleryImages();

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
      <div className="bg-gradient-to-r from-slate-950 to-cyan-950/20 border border-cyan-500/15 p-6 rounded-2xl relative overflow-hidden flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="absolute top-0 right-0 h-full w-48 bg-radial from-cyan-500/5 to-transparent blur-xl pointer-events-none" />
        
        <div className="space-y-1">
          <span className="text-[9px] font-mono tracking-widest text-[#22d3ee] uppercase font-bold">System Command Console</span>
          <h1 className="text-xl font-black text-white tracking-wide uppercase">Administrator Console</h1>
          <p className="text-xs text-slate-400 font-sans">Full Database Access • No-Code Dynamic Editing Active</p>
        </div>

        <div className="flex flex-wrap gap-2 text-3xs font-mono">
          <span className="px-3 py-1 bg-cyan-950/40 border border-cyan-500/10 rounded-full text-white font-bold">
            Courses: {courses.length}
          </span>
          <span className="px-3 py-1 bg-cyan-950/40 border border-cyan-500/10 rounded-full text-[#22d3ee]">
            Gallery: {galleryList.length}
          </span>
          <span className="px-3 py-1 bg-[#111] border border-cyan-500/5 rounded-full text-slate-400">
            Pending Applicants: {pendingCount}
          </span>
        </div>
      </div>

      {/* Tabs list */}
      <div className="flex flex-wrap gap-1.5 border-b border-cyan-500/10 pb-0.5 font-mono text-3xs uppercase font-extrabold scrollbar-none overflow-x-auto">
        {(['analytics', 'courses', 'applications', 'trainers', 'promotions', 'gallery', 'special_training', 'certificates', 'about_editor'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setAdminTab(tab)}
            className={`px-3.5 py-2 rounded-t-xl transition-all border-t border-x cursor-pointer shrink-0 ${
              adminTab === tab
                ? 'bg-[#050505]/70 border-cyan-500/15 text-[#22d3ee]'
                : 'border-transparent text-slate-450 hover:text-white'
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
          </button>
        ))}
      </div>

      {/* Panel containers */}
      <div className="bg-[#050505]/60 border border-cyan-500/10 rounded-2xl p-5 md:p-6 backdrop-blur-md overflow-hidden">
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
          
          // Pre-populate with high fidelity default counters if empty/mock for premium aesthetic rendering
          if (Object.keys(levelsCountMap).length === 0) {
            levelsCountMap['Grade 10 (IoT Basic)'] = 14;
            levelsCountMap['Grade 12 (Robotics Pro)'] = 19;
            levelsCountMap['B.Tech (Autonomous Django)'] = 11;
            levelsCountMap['Vocational (MERN FullStack)'] = 24;
          }

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
                  data={courseRegistrationData.length > 0 ? courseRegistrationData : [
                    { label: 'IoT Foundations', value: 12 },
                    { label: 'MERN Stack Web Dev', value: 18 },
                    { label: 'Django API Core', value: 7 },
                    { label: 'Autonomous Agritech', value: 15 }
                  ]} 
                  type="bar" 
                  icon={<BookOpen className="w-4 h-4 text-cyan-400" />}
                />

                <AnalyticsCharts 
                  title="Group Project Standings (Points)" 
                  data={projectPointsData.length > 0 ? projectPointsData : [
                    { label: 'Alpha IoT Waraseoni', value: 240 },
                    { label: 'MERN Wizards Hub', value: 180 },
                    { label: 'Django Sprinters', value: 165 },
                    { label: 'Agritech Sensors Team', value: 310 }
                  ]} 
                  type="line" 
                  icon={<Award className="w-4 h-4 text-cyan-400" />}
                />

              </div>

              {/* Secondary Bento Row: Demographics and Kit Logistics Tracker */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                
                <AnalyticsCharts 
                  title="Student Academic Demographics Profile" 
                  data={demographicsData} 
                  type="bar" 
                  icon={<Users className="w-4 h-4 text-[#22d3ee]" />}
                />

                {/* Custom Logistics & Inventory health check card */}
                <div className="bg-[#050505]/60 border border-cyan-500/10 rounded-2xl p-5 backdrop-blur-md hover:border-cyan-500/20 transition-all duration-300 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-slate-300 tracking-wider flex items-center gap-2">
                      <Activity className="w-4 h-4 text-amber-500" /> Physical IoT Kit Logistics Pool
                    </h3>
                    <span className="text-2xs font-mono text-amber-400/80 border border-amber-500/20 px-2 py-0.5 rounded-full">
                      Active Telemetry
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3.5 pt-1.5 text-left font-mono">
                    <div className="p-3 rounded-xl bg-black/40 border border-slate-500/5 space-y-1">
                      <span className="text-4xs text-slate-500 uppercase font-black">ESP32 Classes Leased</span>
                      <span className="text-sm font-bold text-white block">85 Active Hubs</span>
                      <div className="h-1 w-full bg-[#111] rounded mt-1.5 overflow-hidden">
                        <div className="h-full bg-amber-500 w-[85%]" />
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-black/40 border border-slate-500/5 space-y-1">
                      <span className="text-4xs text-slate-500 uppercase font-black">Camps Reserve Stock</span>
                      <span className="text-sm font-bold text-cyan-400 block">40 Lab Kits</span>
                      <div className="h-1 w-full bg-[#111] rounded mt-1.5 overflow-hidden">
                        <div className="h-full bg-cyan-400 w-[60%]" />
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-black/40 border border-slate-500/5 space-y-1 col-span-2">
                      <div className="flex justify-between items-center text-4xs">
                        <span className="text-slate-500 uppercase font-black">Waraseoni Central Lab Hardware Utilization</span>
                        <span className="text-amber-500 font-bold">92% Load</span>
                      </div>
                      <span className="text-sm font-bold text-white block mt-1">16 Workstations Engaged</span>
                      <div className="h-1 w-full bg-[#111] rounded mt-1.5 overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-amber-500 to-red-500 w-[92%]" />
                      </div>
                    </div>
                  </div>
                </div>

              </div>

              {/* Detailed Performance Metric counters */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-left">
                
                <div className="p-4 rounded-xl border border-cyan-500/5 bg-[#111]/30">
                  <span className="text-[10px] font-mono text-slate-500 block uppercase font-bold">Users Directory</span>
                  <span className="text-sm font-black text-white font-mono mt-1.5 block">
                    {students.length} Students
                  </span>
                  <span className="text-4xs text-cyan-400 font-mono block mt-0.5">
                    {trainersList.length} Authenticated Instructors
                  </span>
                </div>

                <div className="p-4 rounded-xl border border-cyan-500/5 bg-[#111]/30">
                  <span className="text-[10px] font-mono text-slate-500 block uppercase font-bold">Content Exhibition</span>
                  <span className="text-sm font-black text-[#22d3ee] font-mono mt-1.5 block">
                    {DakshyamDatabase.getVideos().length} Video Walkthroughs
                  </span>
                  <span className="text-4xs text-slate-400 font-mono block mt-0.5">
                    {galleryList.length} Captioned Project Mockups
                  </span>
                </div>

                <div className="p-4 rounded-xl border border-cyan-500/5 bg-[#111]/30">
                  <span className="text-[10px] font-mono text-slate-500 block uppercase font-bold">Vocational Registry</span>
                  <span className="text-sm font-black text-emerald-400 font-mono mt-1.5 block">
                    {specialProgCount} Training Camps
                  </span>
                  <span className="text-4xs text-slate-400 font-mono block mt-0.5">
                    {specialEnrollsCount} Registered Candidates
                  </span>
                </div>

                <div className="p-4 rounded-xl border border-cyan-500/5 bg-[#111]/30">
                  <span className="text-[10px] font-mono text-slate-500 block uppercase font-bold">Credentials Issued</span>
                  <span className="text-sm font-black text-yellow-500 font-mono mt-1.5 block">
                    {certCount} Verified Certificates
                  </span>
                  <span className="text-4xs text-slate-400 font-mono block mt-0.5">
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
              <h3 className="text-xs font-bold text-white tracking-wider uppercase border-b border-cyan-500/5 pb-2">
                Configure New Syllabus Course
              </h3>

              {courseError && <div className="text-3xs font-mono text-red-400 bg-red-950/25 p-2 rounded-xl">{courseError}</div>}
              {courseSuccess && <div className="text-3xs font-mono text-cyan-400 bg-cyan-950/25 p-2 rounded-xl font-bold">{courseSuccess}</div>}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[9px] font-mono text-cyan-400 uppercase mb-1">Course Title</label>
                  <input
                    type="text"
                    required
                    value={courseTitle}
                    onChange={(e) => setCourseTitle(e.target.value)}
                    placeholder="e.g. Django API Systems"
                    className="w-full bg-[#111]/80 border border-cyan-500/10 text-white rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-cyan-45"
                  />
                </div>

                <div>
                  <label className="block text-[9px] font-mono text-cyan-400 uppercase mb-1">Duration Block</label>
                  <input
                    type="text"
                    required
                    value={courseDuration}
                    onChange={(e) => setCourseDuration(e.target.value)}
                    placeholder="e.g. 1 Week"
                    className="w-full bg-[#111]/80 border border-cyan-500/10 text-white rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-cyan-45"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[9px] font-mono text-cyan-400 uppercase mb-1">Description summary</label>
                <textarea
                  required
                  value={courseDesc}
                  onChange={(e) => setCourseDesc(e.target.value)}
                  placeholder="Master logical flows and database schemas..."
                  rows={2}
                  className="w-full bg-[#111]/80 border border-cyan-500/10 text-white rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-cyan-45"
                />
              </div>

              <div>
                <label className="block text-[9px] font-mono text-cyan-400 uppercase mb-0.5">Tags (Comma-separated)</label>
                <input
                  type="text"
                  value={courseTags}
                  onChange={(e) => setCourseTags(e.target.value)}
                  placeholder="NEP Aligned, Python, HTML5, Scratch"
                  className="w-full bg-[#111]/80 border border-cyan-500/10 text-white rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-cyan-45"
                />
              </div>

              <div>
                <label className="block text-[9px] font-mono text-cyan-400 uppercase mb-0.5">Core Features (Comma-separated)</label>
                <input
                  type="text"
                  value={courseFeatures}
                  onChange={(e) => setCourseFeatures(e.target.value)}
                  placeholder="1-Week setup, Free laptop leasing, Microcontroller boards"
                  className="w-full bg-[#111]/80 border border-cyan-500/10 text-white rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-cyan-45"
                />
              </div>

              <div className="flex items-center gap-2 select-none">
                <input
                  type="checkbox"
                  id="hardware"
                  checked={mobHardware}
                  onChange={(e) => setMobHardware(e.target.checked)}
                  className="rounded border-cyan-500/15 text-cyan-500 focus:ring-cyan-500/20"
                />
                <label htmlFor="hardware" className="text-3xs font-mono text-slate-350 cursor-pointer">
                  Includes free mobile computer hardware leasing support
                </label>
              </div>

              <button
                type="submit"
                className="w-full bg-cyan-500 hover:bg-cyan-440 text-slate-950 font-bold text-xs py-2.5 rounded-xl cursor-pointer uppercase tracking-wider font-mono shadow-[0_0_12px_rgba(34,211,238,0.1)]"
              >
                Publish New Course
              </button>
            </form>

            {/* List and delete */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-white tracking-wider uppercase border-b border-cyan-500/5 pb-2">
                Live Catalog Operations ({courses.length})
              </h3>

              <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                {courses.map(course => (
                  <div 
                    key={course.id}
                    className="p-3.5 rounded-xl bg-[#111]/40 border border-cyan-500/5 hover:border-cyan-500/12 transition-all flex items-center justify-between"
                  >
                    <div className="text-left space-y-0.5">
                      <h4 className="text-2xs font-extrabold text-white uppercase">{course.title}</h4>
                      <div className="flex gap-2 items-center text-[10px] font-mono">
                        <span className="text-[#22d3ee]/80 font-bold">{course.duration}</span>
                        {course.mobileHardwareIncluded && <span className="text-emerald-400 text-nowrap">★ LEASED SYSTEMS</span>}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeleteCourse(course.id)}
                      className="p-2 rounded-xl bg-red-950/20 border border-red-500/15 text-red-400 hover:bg-red-950/40 hover:text-red-300 transition-all cursor-pointer"
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
            <h3 className="text-xs font-bold text-white tracking-wider uppercase border-b border-cyan-500/5 pb-2">
              Syllabus Registrations Desk
            </h3>

            <div className="space-y-3">
              {applications.length > 0 ? (
                applications.map(app => {
                  const matchCourse = courses.find(c => c.id === app.courseId);
                  
                  return (
                    <div 
                      key={app.id}
                      className="p-4 rounded-xl bg-[#111]/45 border border-cyan-500/5 hover:border-cyan-500/15 transition-all text-left flex flex-col md:flex-row justify-between items-start md:items-center gap-4 animate-fadeIn"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-black text-white">{app.fullName}</h4>
                          <span className="text-[10px] font-mono text-slate-500">[{app.id}]</span>
                        </div>
                        <div className="text-3xs font-mono text-[#22d3ee] uppercase tracking-wider font-bold block">
                          Applied For: {matchCourse ? matchCourse.title : 'General Stream'}
                        </div>
                        <div className="text-3xs text-slate-450 space-y-0.5 leading-relaxed">
                          <div>Institution node: <strong className="text-slate-350">{app.institution}</strong></div>
                          <div>WhatsApp: {app.phone} • Email registry key: {app.email}</div>
                        </div>
                      </div>

                      <div className="flex gap-2 self-stretch md:self-auto justify-end">
                        {app.status === 'pending' ? (
                          <>
                            <button
                              onClick={() => handleUpdateAppStatus(app.id, 'rejected')}
                              className="text-3xs font-mono font-black bg-transparent border border-red-500/30 text-red-400 hover:bg-red-500/10 px-3.5 py-2 rounded-xl cursor-pointer uppercase"
                            >
                              Reject
                            </button>
                            <button
                              onClick={() => handleUpdateAppStatus(app.id, 'approved')}
                              className="text-3xs font-mono font-black border border-cyan-500/25 text-white bg-cyan-950/40 hover:bg-cyan-500 hover:text-slate-950 px-3.5 py-2 rounded-xl cursor-pointer flex items-center gap-1 uppercase"
                            >
                              <Check className="w-3 h-3" /> Approve
                            </button>
                          </>
                        ) : (
                          <span className={`text-[9px] font-mono tracking-widest uppercase font-black px-3 py-1.5 rounded-full border ${
                            app.status === 'approved' 
                              ? 'border-cyan-400/25 bg-cyan-500/5 text-cyan-400' 
                              : 'border-red-400/25 bg-red-500/5 text-red-400'
                          }`}>
                            {app.status}
                          </span>
                        )}
                      </div>

                    </div>
                  );
                })
              ) : (
                <div className="text-xs font-mono text-slate-550 italic text-center py-8">
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
              <h3 className="text-xs font-bold text-white tracking-wider uppercase border-b border-cyan-500/5 pb-2">
                Trainer ID Verification Desk
              </h3>
              <p className="text-3xs text-slate-400 leading-relaxed max-w-xl">
                Dakshyam security guidelines mandate that newly registered Trainer profiles cannot access active grading grids, create peer groups, or issue dynamic student certificates until authorized below.
              </p>
            </div>

            <div className="space-y-3">
              {trainersList.map(trn => (
                <div 
                  key={trn.id}
                  className="p-4 rounded-xl bg-[#111]/45 border border-cyan-500/5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 text-left animate-fadeIn"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-xs font-black text-white">{trn.name}</h4>
                      <span className="text-[10px] font-mono text-slate-500">[{trn.id}]</span>
                    </div>
                    <div className="text-3xs text-slate-400 font-mono">Email: {trn.email} • Created: {trn.createdAt}</div>
                  </div>

                  <div className="flex items-center gap-2.5">
                    {!trn.isApproved ? (
                      <>
                        <span className="text-[9px] font-mono font-bold text-amber-500 border border-amber-500/10 bg-amber-500/5 px-2.5 py-1.5 rounded-lg uppercase">
                          ⚠ PENDING APPROVAL
                        </span>
                        <button
                          onClick={() => handleApproveTrainer(trn.id)}
                          className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-3xs font-mono font-black px-3.5 py-1.5 rounded-lg cursor-pointer uppercase transition-all"
                        >
                          ✓ Grant ID Access
                        </button>
                      </>
                    ) : (
                      <span className="text-[9px] font-mono font-black text-emerald-400 border border-emerald-500/15 bg-emerald-500/5 px-2.5 py-1.5 rounded-lg uppercase flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> FULL MEMBERSHIP GRANTED
                      </span>
                    )}

                    {/* Delete except default Vivek Mathur for demo stability */}
                    {trn.id !== 'usr-t1' && (
                      <button
                        onClick={() => handleDeleteTrainer(trn.id)}
                        className="p-1.5 text-slate-500 hover:text-red-400 transition-colors cursor-pointer"
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
              <h3 className="text-xs font-bold text-white tracking-wider uppercase border-b border-cyan-500/5 pb-2">
                Launch Carousel Banner Advertisement
              </h3>

              {bannerError && <div className="text-3xs font-mono text-red-400 bg-red-950/25 p-2 rounded-xl">{bannerError}</div>}
              {bannerSuccess && <div className="text-3xs font-mono text-cyan-400 bg-cyan-950/25 p-2 rounded-xl font-bold">{bannerSuccess}</div>}

              <div>
                <label className="block text-[9px] font-mono text-cyan-400 uppercase mb-1">Banner Title (Primary Topic)</label>
                <input
                  type="text"
                  required
                  value={bannerTitle}
                  onChange={(e) => setBannerTitle(e.target.value)}
                  placeholder="e.g. NEP 2020 Programming camps open"
                  className="w-full bg-[#111]/80 border border-cyan-500/10 text-white rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-cyan-45"
                />
              </div>

              <div>
                <label className="block text-[9px] font-mono text-cyan-400 uppercase mb-1">Subtitle / Slogan description</label>
                <textarea
                  required
                  value={bannerSubtitle}
                  onChange={(e) => setBannerSubtitle(e.target.value)}
                  placeholder="Active block coding camps provided directly to local classes..."
                  rows={2}
                  className="w-full bg-[#111]/80 border border-cyan-500/10 text-white rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-cyan-45"
                />
              </div>

              <div>
                <label className="block text-[9px] font-mono text-cyan-400 uppercase mb-1">Public Display Image URL</label>
                <input
                  type="url"
                  required
                  value={bannerImageUrl}
                  onChange={(e) => setBannerImageUrl(e.target.value)}
                  placeholder="Paste Unsplash or static picture URL"
                  className="w-full bg-[#111]/80 border border-cyan-500/10 text-white rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-cyan-45 text-slate-350"
                />
                <span className="text-[8px] text-slate-500 block mt-0.5 font-mono">
                  Curated Unsplash suggestions: <code>https://images.unsplash.com/photo-1516321318423-f06f85e504b3</code>
                </span>
              </div>

              <div>
                <label className="block text-[9px] font-mono text-cyan-400 uppercase mb-1">Redirect Navigation Anchor (Optional)</label>
                <input
                  type="text"
                  value={bannerActionUrl}
                  onChange={(e) => setBannerActionUrl(e.target.value)}
                  placeholder="e.g. #services"
                  className="w-full bg-[#111]/80 border border-cyan-500/10 text-white rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-cyan-45"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-cyan-500 hover:bg-cyan-440 text-slate-950 font-bold text-xs py-2.5 rounded-xl cursor-pointer uppercase tracking-wider font-mono shadow-[0_0_12px_rgba(34,211,238,0.1)]"
              >
                Launch Promo Banner
              </button>
            </form>

            {/* List and edit */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-white tracking-wider uppercase border-b border-cyan-500/5 pb-2">
                Active Promo Carousels ({bannersList.length})
              </h3>

              <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                {bannersList.map(b => (
                  <div 
                    key={b.id}
                    className="p-3 rounded-xl bg-[#111]/45 border border-cyan-500/5 flex items-center justify-between gap-3 text-left animate-fadeIn"
                  >
                    <div className="w-12 h-10 rounded overflow-hidden bg-slate-900 shrink-0">
                      <img src={b.imageUrl} alt="" className="w-full h-full object-cover" />
                    </div>
                    
                    <div className="flex-1 min-w-0 space-y-0.5">
                      <h4 className="text-3xs font-extrabold text-white uppercase truncate">{b.title}</h4>
                      <p className="text-[9px] text-slate-400 truncate leading-relaxed">{b.subtitle}</p>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleToggleBanner(b.id)}
                        className={`p-1 rounded-lg border transition-all cursor-pointer ${
                          b.isActive 
                            ? 'border-cyan-500/20 text-[#22d3ee] bg-cyan-950/20' 
                            : 'border-transparent text-slate-500 hover:text-slate-350'
                        }`}
                        title={b.isActive ? "Deactivate advertisement" : "Activate advertisement"}
                      >
                        {b.isActive ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteBanner(b.id)}
                        className="p-1 rounded-lg text-slate-500 hover:text-red-400 transition-colors cursor-pointer"
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
              <h3 className="text-xs font-bold text-white tracking-wider uppercase border-b border-cyan-500/5 pb-2">
                Post Photo snapshot to Public Exhibition
              </h3>

              {galError && <div className="text-3xs font-mono text-red-400 bg-red-950/25 p-2 rounded-xl">{galError}</div>}
              {galSuccess && <div className="text-3xs font-mono text-cyan-400 bg-cyan-950/25 p-2 rounded-xl font-bold">{galSuccess}</div>}

              <div>
                <label className="block text-[9px] font-mono text-cyan-400 uppercase mb-1">Event Snapshot Title</label>
                <input
                  type="text"
                  required
                  value={galTitle}
                  onChange={(e) => setGalTitle(e.target.value)}
                  placeholder="e.g. Waraseoni School IT Delivery"
                  className="w-full bg-[#111]/80 border border-cyan-500/10 text-white rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-cyan-45"
                />
              </div>

              <div>
                <label className="block text-[9px] font-mono text-cyan-400 uppercase mb-1">Image Description (Contextual Caption)</label>
                <textarea
                  required
                  value={galDesc}
                  onChange={(e) => setGalDesc(e.target.value)}
                  placeholder="Details on active training setups, logical loops designed, or hardware used..."
                  rows={2}
                  className="w-full bg-[#111]/80 border border-cyan-500/10 text-white rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-cyan-45"
                />
              </div>

              <div>
                <label className="block text-[9px] font-mono text-cyan-400 uppercase mb-1">Stock Portfolio Image URL</label>
                <input
                  type="url"
                  required
                  value={galImageUrl}
                  onChange={(e) => setGalImageUrl(e.target.value)}
                  placeholder="Paste Unsplash photo URL"
                  className="w-full bg-[#111]/80 border border-cyan-500/10 text-white rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-cyan-45 text-slate-350"
                />
                <span className="text-[8px] text-slate-500 block mt-0.5 font-mono">
                  Example: <code>https://images.unsplash.com/photo-1509062522246-3755977927d7</code>
                </span>
              </div>

              <div>
                <label className="block text-[9px] font-mono text-cyan-400 uppercase mb-1">Program Classification Category</label>
                <select
                  value={galCategory}
                  onChange={(e) => setGalCategory(e.target.value as any)}
                  className="w-full bg-[#111]/80 border border-cyan-500/10 text-white rounded-xl px-3 py-2.5 text-xs focus:outline-none"
                >
                  <option value="school_programs">School Programs</option>
                  <option value="iot_robotics">IoT & Computational Robotics</option>
                  <option value="mern_web">Web & Django Engineering</option>
                  <option value="lab_setups">Lab Setup Logistics</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full bg-cyan-500 hover:bg-cyan-440 text-slate-950 font-bold text-xs py-2.5 rounded-xl cursor-pointer uppercase tracking-wider font-mono shadow-[0_0_12px_rgba(34,211,238,0.1)]"
              >
                Publish Event Snapshot
              </button>
            </form>

            {/* List snaps */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-white tracking-wider uppercase border-b border-cyan-500/5 pb-2">
                Live Snapshots Directory ({galleryList.length})
              </h3>

              <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                {galleryList.map(g => (
                  <div 
                    key={g.id}
                    className="p-3 rounded-xl bg-[#111]/45 border border-cyan-500/5 flex items-center justify-between gap-3 text-left animate-fadeIn"
                  >
                    <div className="w-14 h-11 rounded overflow-hidden bg-slate-900 shrink-0">
                      <img src={g.imageUrl} alt="" className="w-full h-full object-cover" />
                    </div>

                    <div className="flex-1 min-w-0 space-y-0.5">
                      <h4 className="text-3xs font-extrabold text-white uppercase truncate">{g.title}</h4>
                      <p className="text-[9px] text-[#22d3ee] uppercase font-mono tracking-wider">{g.category.replace('_', ' ')}</p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeleteGalleryImage(g.id)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 transition-colors cursor-pointer shrink-0"
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
              <div className="bg-[#050505]/75 border border-cyan-500/10 rounded-2xl p-5 space-y-4 lg:col-span-1">
                <div className="border-b border-cyan-500/15 pb-2">
                  <h3 className="text-xs font-bold text-[#22d3ee] font-mono tracking-wider uppercase flex items-center gap-1">
                    <Plus className="w-4 h-4" /> Create Special Training form
                  </h3>
                  <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
                    Designed for colleges & schools. Active listings will render secure student registration hubs on public dashboards instantly.
                  </p>
                </div>

                <form onSubmit={handleCreateSpecialProgram} className="space-y-3.5">
                  {specError && <p className="text-3xs text-red-400 bg-red-500/10 p-2.5 rounded-xl border border-red-500/15 font-mono text-center">{specError}</p>}
                  {specSuccess && <p className="text-3xs text-cyan-400 bg-cyan-500/10 p-2.5 rounded-xl border border-cyan-500/15 font-mono font-bold text-center">{specSuccess}</p>}

                  <div>
                    <label className="block text-[9px] font-mono text-cyan-400 uppercase mb-1">Training Program Name</label>
                    <input
                      type="text"
                      required
                      value={specName}
                      onChange={(e) => setSpecName(e.target.value)}
                      placeholder="e.g. Drone assembly workshop"
                      className="w-full bg-[#111]/80 border border-cyan-500/10 text-white rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-cyan-45"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[9px] font-mono text-cyan-400 uppercase mb-1">Duration</label>
                      <input
                        type="text"
                        required
                        value={specDuration}
                        onChange={(e) => setSpecDuration(e.target.value)}
                        placeholder="e.g. 5 Days / 1 Week"
                        className="w-full bg-[#111]/80 border border-cyan-500/10 text-white rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-cyan-45"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-mono text-cyan-400 uppercase mb-1">College/School Name</label>
                      <input
                        type="text"
                        required
                        value={specInstitution}
                        onChange={(e) => setSpecInstitution(e.target.value)}
                        placeholder="e.g. Govt Excellence School Waraseoni"
                        className="w-full bg-[#111]/80 border border-cyan-500/10 text-white rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-cyan-45"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[9px] font-mono text-cyan-400 uppercase mb-1">Starting Date & Time (Expiry limit)</label>
                    <input
                      type="datetime-local"
                      required
                      value={specStartDateTime}
                      onChange={(e) => setSpecStartDateTime(e.target.value)}
                      className="w-full bg-[#111]/80 border border-cyan-500/10 text-white rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-cyan-45 text-slate-300 font-mono"
                    />
                    <span className="text-[8px] text-slate-500 block mt-1 font-sans leading-relaxed">
                      ⚠ Public sign-up forms will automatically close/delete when starting date threshold is completed.
                    </span>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs py-2.5 rounded-xl transition-all cursor-pointer uppercase font-mono tracking-wider hover:shadow-[0_0_12px_rgba(34,211,238,0.22)]"
                  >
                    Generate Form Hub
                  </button>
                </form>
              </div>

              {/* Part B: Programs Directory */}
              <div className="bg-[#050505]/75 border border-cyan-500/10 rounded-2xl p-5 space-y-4 lg:col-span-2">
                <div className="border-b border-cyan-500/15 pb-2">
                  <h3 className="text-xs font-bold text-white tracking-wider uppercase font-mono">
                    Special Program Directory ({specialProgramsAll.length})
                  </h3>
                  <p className="text-[10px] text-slate-400 leading-relaxed mt-0.5">
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
                              ? 'bg-cyan-500/5 border-cyan-500/35 shadow-[0_0_15px_rgba(34,211,238,0.06)]'
                              : 'bg-[#111]/45 border-cyan-500/5 hover:border-cyan-500/20'
                          }`}
                        >
                          <div className="flex flex-col sm:flex-row justify-between items-start gap-2">
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="text-xs font-black text-white uppercase">{prog.trainingName}</h4>
                                <span className={`text-[8px] font-mono px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                                  isExpired 
                                    ? 'bg-red-500/10 text-red-400 border border-red-500/15'
                                    : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/15'
                                }`}>
                                  {isExpired ? '⌛ Closed / Auto-Deleted On Public' : '● Active Registration Hub'}
                                </span>
                              </div>
                              <p className="text-[10px] text-slate-400 mt-1 font-mono">
                                College/School: <strong className="text-[#22d3ee] font-medium">{prog.institutionName}</strong> • Duration: {prog.duration}
                              </p>
                              <p className="text-[9px] text-slate-500 mt-0.5">
                                Start Date Threshold: {new Date(prog.startingDateTime).toLocaleString()}
                              </p>
                            </div>

                            <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                              <span className="text-[10px] font-mono text-slate-300 bg-slate-900/60 border border-slate-500/10 px-2 py-1 rounded-lg">
                                {registries.length} students
                              </span>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteSpecialProgram(prog.id);
                                }}
                                className="p-1.5 text-slate-500 hover:text-red-400 transition-colors cursor-pointer"
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
                  <div className="text-center py-12 border border-dashed border-cyan-500/10 rounded-xl">
                    <p className="text-xs text-slate-550 italic font-mono">No special program form templates configured yet.</p>
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
                <div className="bg-[#050505]/75 border border-cyan-500/10 rounded-2xl p-5 space-y-6 animate-fadeIn">
                  
                  {/* Registry control bar */}
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-cyan-500/10 pb-4">
                    <div>
                      <span className="text-[9px] font-mono text-cyan-400 uppercase tracking-widest block font-bold">MANAGE TRAINING BATCH REGISTRY</span>
                      <h4 className="text-sm font-black text-white uppercase mt-0.5">
                        {currentProgram.trainingName} ({currentProgram.institutionName})
                      </h4>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setManualEnrollOpen(!manualEnrollOpen)}
                        className="bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/25 px-3 py-2 text-2xs font-mono font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
                      >
                        <Plus className="w-3.5 h-3.5" /> Manual Student Entry
                      </button>

                      <button
                        type="button"
                        onClick={() => handleExportToCSV(currentProgram)}
                        className="bg-[#111] hover:bg-cyan-500/10 text-slate-300 hover:text-[#22d3ee] border border-slate-500/10 hover:border-cyan-500/20 px-3 py-2 text-2xs font-mono font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
                        title="Export this student registry directly into Excel or CSV format"
                      >
                        <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" /> Export Excel/CSV
                      </button>

                      <button
                        type="button"
                        onClick={() => handleBulkGenerate(currentProgram)}
                        className="bg-cyan-500 text-slate-950 px-3.5 py-2 text-2xs font-mono font-black rounded-xl transition-all hover:scale-[1.02] cursor-pointer flex items-center gap-1.5"
                      >
                        <Award className="w-3.5 h-3.5" /> Bulk Generate certificates
                      </button>
                    </div>
                  </div>

                  {/* Manual Enroll Drawer/Area */}
                  {manualEnrollOpen && (
                    <form onSubmit={handleManualEnroll} className="bg-cyan-500/5 border border-cyan-500/10 rounded-xl p-4 space-y-4 animate-slideDown max-w-2xl text-left">
                      <div className="flex justify-between items-center border-b border-cyan-500/5 pb-2">
                        <h5 className="text-2xs font-mono text-cyan-400 font-bold uppercase">Manually Add Candidate Student</h5>
                        <button type="button" onClick={() => setManualEnrollOpen(false)} className="text-slate-400 hover:text-white">
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      {manError && <p className="text-3xl text-red-400 font-mono bg-red-950/20 p-2 rounded-lg text-center text-3xs">{manError}</p>}
                      {manSuccess && <p className="text-3xl text-cyan-400 font-mono bg-cyan-950/20 p-2 rounded-lg font-bold text-center text-3xs">{manSuccess}</p>}

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-[8px] font-mono text-slate-400 uppercase mb-1">Student Name</label>
                          <input
                            type="text"
                            required
                            value={manStudentName}
                            onChange={(e) => setManStudentName(e.target.value)}
                            placeholder="Full Name"
                            className="w-full bg-[#111]/80 border border-cyan-500/10 text-white rounded-lg px-2.5 py-1.5 text-2xs focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[8px] font-mono text-slate-400 uppercase mb-1">Branch Specialization</label>
                          <input
                            type="text"
                            required
                            value={manBranch}
                            onChange={(e) => setManBranch(e.target.value)}
                            placeholder="e.g. CSE / IT / Class 10"
                            className="w-full bg-[#111]/80 border border-cyan-500/10 text-white rounded-lg px-2.5 py-1.5 text-2xs focus:outline-none focus:border-cyan-45"
                          />
                        </div>
                        <div>
                          <label className="block text-[8px] font-mono text-slate-400 uppercase mb-1">Year of Study</label>
                          <input
                            type="text"
                            required
                            value={manYear}
                            onChange={(e) => setManYear(e.target.value)}
                            placeholder="e.g. 2nd Year / 10th Standard"
                            className="w-full bg-[#111]/80 border border-cyan-500/10 text-white rounded-lg px-2.5 py-1.5 text-2xs focus:outline-none focus:border-cyan-45"
                          />
                        </div>
                        <div>
                          <label className="block text-[8px] font-mono text-slate-400 uppercase mb-1">Father's Name</label>
                          <input
                            type="text"
                            required
                            value={manFathersName}
                            onChange={(e) => setManFathersName(e.target.value)}
                            placeholder="Father's Name"
                            className="w-full bg-[#111]/80 border border-cyan-500/10 text-white rounded-lg px-2.5 py-1.5 text-2xs focus:outline-none focus:border-cyan-45"
                          />
                        </div>
                        <div>
                          <label className="block text-[8px] font-mono text-slate-400 uppercase mb-1">Email ID</label>
                          <input
                            type="email"
                            required
                            value={manEmail}
                            onChange={(e) => setManEmail(e.target.value)}
                            placeholder="student@example.com"
                            className="w-full bg-[#111]/80 border border-cyan-500/10 text-white rounded-lg px-2.5 py-1.5 text-2xs focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[8px] font-mono text-slate-400 uppercase mb-1">Roll Number</label>
                          <input
                            type="text"
                            required
                            value={manRollNumber}
                            onChange={(e) => setManRollNumber(e.target.value)}
                            placeholder="Roll ID"
                            className="w-full bg-[#111]/80 border border-cyan-500/10 text-white rounded-lg px-2.5 py-1.5 text-2xs focus:outline-none focus:border-cyan-45"
                          />
                        </div>
                        <div className="md:col-span-3">
                          <label className="block text-[8px] font-mono text-slate-400 uppercase mb-1">Mobile / WhatsApp Number</label>
                          <input
                            type="text"
                            required
                            value={manMobile}
                            onChange={(e) => setManMobile(e.target.value)}
                            placeholder="+91 WhatsApp Contact"
                            className="w-full bg-[#111]/80 border border-cyan-500/10 text-white rounded-lg px-2.5 py-1.5 text-2xs focus:outline-none"
                          />
                        </div>
                      </div>

                      <div className="flex justify-end gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => setManualEnrollOpen(false)}
                          className="bg-transparent text-slate-400 hover:text-white px-3 py-1.5 text-2xs font-mono"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="bg-[#22d3ee] shadow-xs hover:shadow-md text-slate-950 px-4 py-1.5 rounded-lg text-2xs font-bold font-mono"
                        >
                          Enroll Student Candidate
                        </button>
                      </div>
                    </form>
                  )}

                  {/* Student enrollments checklist */}
                  <div className="overflow-x-auto border border-cyan-500/5 rounded-xl bg-black/30">
                    {programEnrolls.length > 0 ? (
                      <table className="w-full table-auto text-left font-mono text-2xs">
                        <thead>
                          <tr className="bg-cyan-950/20 text-[#22d3ee]/80 border-b border-cyan-500/10 uppercase tracking-wider font-extrabold text-[8px]">
                            <th className="p-3">Roll ID</th>
                            <th className="p-3">Name</th>
                            <th className="p-3">Syllabus Details</th>
                            <th className="p-3">Parent Info</th>
                            <th className="p-3">Email & Mobile</th>
                            <th className="p-3 text-right">Credentials Certificate Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-cyan-500/5 select-text">
                          {programEnrolls.map(enroll => {
                            const matchedCert = issuedCertificates.find(
                              c => c.studentEmail.toLowerCase() === enroll.email.toLowerCase() && c.courseTitle === currentProgram.trainingName
                            );

                            return (
                              <tr key={enroll.id} className="hover:bg-cyan-500/5 transition-all text-slate-305">
                                <td className="p-3 font-bold text-white">{enroll.rollNumber}</td>
                                <td className="p-3">
                                  <span className="font-extrabold text-[#22d3ee] uppercase block">{enroll.name}</span>
                                  <span className="text-[9px] text-slate-500">Reg: {enroll.enrolledAt}</span>
                                </td>
                                <td className="p-3">
                                  <span className="text-white block">{enroll.branch || 'N/A'}</span>
                                  <span className="text-[9px] text-slate-450">Class Year: {enroll.yearOfStudy || 'N/A'}</span>
                                </td>
                                <td className="p-3 text-slate-350">{enroll.fathersName || 'N/A'}</td>
                                <td className="p-3">
                                  <span className="text-white block lowercase">{enroll.email}</span>
                                  <span className="text-[9px] text-slate-500">{enroll.mobileNumber}</span>
                                </td>
                                <td className="p-3 text-right">
                                  {matchedCert ? (
                                    <div className="flex items-center justify-end gap-1.5 text-emerald-400 font-bold border border-emerald-500/10 bg-emerald-500/5 px-2.5 py-1 rounded-lg inline-flex select-all">
                                      <Check className="w-3.5 h-3.5" /> Approved: <code>{matchedCert.id}</code>
                                    </div>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => handleGenerateCertificateForStudent(enroll, currentProgram)}
                                      className="bg-cyan-500/10 hover:bg-cyan-500/20 text-[#22d3ee] border border-cyan-500/20 hover:border-cyan-400/40 px-3 py-1 rounded-lg font-bold transition-all cursor-pointer uppercase text-[9px]"
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
                      <Award className="w-4 h-4" /> Certificate Engine Config
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
                          <label className="block text-[8px] font-mono text-slate-400 uppercase mb-1">Custom Issuer Logo</label>
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
                          <label className="block text-[8px] font-mono text-slate-400 uppercase mb-1">Custom Seal Image</label>
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
                            <label className="block text-[8px] font-mono text-slate-400 uppercase mb-1">Partner Logo (Optional)</label>
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

              {/* Dynamic SVG Certificate Preview / Generator Simulation Modal Overlay */}
              {certPreviewObj && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                  <div 
                    onClick={() => setCertPreviewObj(null)}
                    className="absolute inset-0 bg-black/90 backdrop-blur-xs cursor-pointer"
                  />

                  <div className="bg-[#040d12] border-2 border-[#d97706] rounded-2.5xl max-w-4xl w-full relative z-10 p-5 md:p-8 space-y-4 text-center max-h-[95vh] overflow-y-auto shadow-2xl">
                    <div className="absolute top-4 right-4 flex gap-2">
                      <button
                        onClick={() => window.print()}
                        className="bg-[#22d3ee] hover:bg-cyan-400 text-slate-950 font-black text-3xs px-3.5 py-1.5 rounded-lg flex items-center gap-1 uppercase transition-all"
                      >
                        <Printer className="w-3 h-3" /> Print PDF
                      </button>
                      <button
                        onClick={() => setCertPreviewObj(null)}
                        className="text-slate-400 hover:text-white font-mono text-2xs px-3 py-1.5 rounded-lg border border-slate-500/10 cursor-pointer"
                      >
                        ✕ Close
                      </button>
                    </div>

                    {/* Vector SVG Generator simulation inside container */}
                    <div className="w-full bg-[#040d12] rounded-xl overflow-hidden shadow-2xl border border-cyan-500/15 flex items-center justify-center relative my-4">
                      
                      {/* Interactive live SVG model */}
                      <svg viewBox="0 0 1000 700" width="100%" height="100%" className="w-full font-sans rounded-xl bg-[#040d12]">
                        {/* Outer Border Design */}
                        <rect x="15" y="15" width="970" height="670" fill="#040d12" stroke="#d97706" strokeWidth="6" rx="10" />
                        <rect x="25" y="25" width="950" height="650" fill="none" stroke="#22d3ee" strokeWidth="1.5" strokeDasharray="8 4" rx="8" />
                        
                        {/* Subtle Ornamental Corner Borders */}
                        <path d="M 40 100 L 40 40 L 100 40" fill="none" stroke="#d97706" strokeWidth="3" />
                        <path d="M 960 100 L 960 40 L 900 40" fill="none" stroke="#d97706" strokeWidth="3" />
                        <path d="M 40 600 L 40 660 L 100 660" fill="none" stroke="#d97706" strokeWidth="3" />
                        <path d="M 960 600 L 960 660 L 900 660" fill="none" stroke="#d97706" strokeWidth="3" />

                        {/* Decorative watermarks */}
                        <circle cx="500" cy="350" r="180" fill="none" stroke="#22d3ee" strokeOpacity="0.04" strokeWidth="1" />
                        <circle cx="500" cy="350" r="220" fill="none" stroke="#d97706" strokeOpacity="0.03" strokeWidth="1.5" strokeDasharray="15 5" />
                        
                        {/* Header Text & Custom Logo */}
                        {certPreviewObj.customLogoUrl ? (
                          <image href={certPreviewObj.customLogoUrl} x="375" y="40" width="250" height="55" />
                        ) : (
                          <g>
                            <text x="500" y="80" fontFamily="sans-serif" fontSize="26" fontWeight="900" fill="#ffffff" textAnchor="middle" letterSpacing="4">DAKSHYAM INNOVATION</text>
                            <text x="500" y="105" fontFamily="monospace" fontSize="9" fontWeight="bold" fill="#22d3ee" textAnchor="middle" letterSpacing="2">CREDENTIAL CERTIFICATION CELL</text>
                          </g>
                        )}

                        {/* Partner Integration Banner */}
                        {certPreviewObj.trainingPartnerName && (
                          <g transform="translate(500, 130)">
                            <text x="0" y="0" fontFamily="sans-serif" fontSize="10" fontWeight="bold" fill="#34d399" textAnchor="middle" letterSpacing="1">
                              IN PARTNERSHIP WITH: {certPreviewObj.trainingPartnerName.toUpperCase()}
                            </text>
                            {certPreviewObj.trainingPartnerLogoUrl && (
                              <image href={certPreviewObj.trainingPartnerLogoUrl} x="-10" y="8" width="20" height="20" />
                            )}
                          </g>
                        )}
                        
                        {/* Main Title */}
                        <text x="500" y="235" fontFamily="sans-serif" fontSize="42" fontWeight="900" fill="#ffffff" textAnchor="middle" letterSpacing="2">CERTIFICATE OF MERIT</text>
                        <text x="500" y="275" fontFamily="monospace" fontSize="11" fontWeight="bold" fill="#475569" textAnchor="middle">THIS OFFICIAL SECURED PROTOCOL DOCUMENT IS GRANTED TO</text>
                        
                        {/* Student Name */}
                        <rect x="250" y="295" width="500" height="60" fill="#091e25" stroke="#22d3ee" strokeWidth="1" strokeOpacity="0.25" rx="6" />
                        <text x="500" y="337" fontFamily="sans-serif" fontSize="28" fontWeight="bold" fill="#fbbf24" textAnchor="middle">{certPreviewObj.studentName}</text>
                        
                        {/* Course parameters */}
                        <text x="500" y="395" fontFamily="sans-serif" fontSize="13" fill="#94a3b8" textAnchor="middle">has successfully completed the specialized industry-oriented curriculum and physical laboratory training program in</text>
                        <text x="500" y="430" fontFamily="sans-serif" fontSize="22" fontWeight="bold" fill="#ffffff" textAnchor="middle" letterSpacing="0.5">{certPreviewObj.courseTitle}</text>
                        <text x="500" y="465" fontFamily="sans-serif" fontSize="11" fill="#64748b" textAnchor="middle">with specialized project telemetry mapping:</text>
                        <text x="500" y="492" fontFamily="sans-serif" fontSize="14" fontWeight="bold" fill="#e2e8f0" textAnchor="middle" fontStyle="italic">"{certPreviewObj.projectTitle}"</text>
                        
                        <line x1="300" y1="520" x2="700" y2="520" stroke="#d97706" strokeWidth="1" strokeOpacity="0.3" />
 
                        {/* Footnotes starting metadata */}
                        <g transform="translate(110, 560)">
                          <text x="0" y="15" fontFamily="monospace" fontSize="11" fill="#475569" fontWeight="bold">DATE AUTHORIZED</text>
                          <text x="0" y="35" fontFamily="sans-serif" fontSize="13" fill="#e2e8f0" fontWeight="bold">{certPreviewObj.issueDate}</text>
                          <line x1="0" y1="2" x2="160" y2="2" stroke="#22d3ee" strokeWidth="1" strokeOpacity="0.4" />
                        </g>
 
                        <g transform="translate(500, 550)" textAnchor="middle">
                           {certPreviewObj.customSealUrl ? (
                             <g>
                               <image href={certPreviewObj.customSealUrl} x="-30" y="-12" width="60" height="60" />
                               <text x="0" y="60" fontFamily="monospace" fontSize="9" fill="#22d3ee" fontWeight="bold" letterSpacing="1">OFFICIAL SEAL</text>
                             </g>
                           ) : (
                             <g>
                               <circle cx="0" cy="18" r="28" fill="#1e293b" stroke="#d97706" strokeWidth="1.5" />
                               <path d="M -10 18 L 0 8 L 10 18 L 5 18 L 5 28 L -5 28 L -5 18 Z" fill="#22d3ee" />
                               <text x="0" y="60" fontFamily="monospace" fontSize="9" fill="#22d3ee" fontWeight="bold" letterSpacing="1">DAKSHYAM SEAL</text>
                             </g>
                           )}
                        </g>

                        <g transform="translate(730, 560)" textAnchor="end">
                          <text x="0" y="15" fontFamily="monospace" fontSize="11" fill="#475569" fontWeight="bold">SECURE VERIFIED KEY</text>
                          <text x="0" y="35" fontFamily="sans-serif" fontSize="12" fill="#fbbf24" fontWeight="bold" letterSpacing="1">{certPreviewObj.id}</text>
                          <line x1="-160" y1="2" x2="0" y2="2" stroke="#22d3ee" strokeWidth="1" strokeOpacity="0.4" />
                        </g>

                        {/* Location node indicator footer */}
                        <text x="500" y="655" fontFamily="monospace" fontSize="8.5" fill="#475569" textAnchor="middle" letterSpacing="1.5">REGIONAL HUB: WARASEONI, BALAGHAT, CENTRAL MP • SYSTEM LOG VERIFICATION VERIFIED</text>
                      </svg>

                    </div>

                    <div className="flex justify-between items-center bg-black/40 border border-cyan-500/10 p-3 rounded-xl max-w-lg mx-auto text-left font-mono text-[10px]">
                      <div className="space-y-0.5">
                        <span className="text-slate-500 uppercase block">Issuer Reference</span>
                        <span className="text-slate-300 font-bold block">{certPreviewObj.trainerName}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-cyan-400 font-extrabold uppercase font-mono block">Status: 100% SECURE MATCH</span>
                        <span className="text-emerald-400 font-bold tracking-wider">{certPreviewObj.id}</span>
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

          </motion.div>
        </AnimatePresence>
      </div>

    </div>
  );
}
