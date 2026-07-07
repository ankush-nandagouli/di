import { StudentUser, TrainerUser, AdminUser, StudentGroup, Course, CourseApplication, Certificate, VideoPost, PromoBanner, GalleryImage, SpecialTrainingProgram, SpecialProgramEnrollment, CompanyAbout, CompanyFounder, AppLog } from '../types';

// Default seeded courses requested by the user
export const DEFAULT_COURSES: Course[] = [];

// Initial seeded students
export const SEEDED_STUDENTS: StudentUser[] = [];

// Initial seeded trainers
export const SEEDED_TRAINERS: TrainerUser[] = [];

// Initial seeded admins
export const SEEDED_ADMINS: AdminUser[] = [];

// Initial seeded project student groups with points
export const SEEDED_GROUPS: StudentGroup[] = [];

// Initial social media video posts by groups
export const SEEDED_VIDEOS: VideoPost[] = [];

// Seeded certificates
export const SEEDED_CERTIFICATES: Certificate[] = [];

// Initial course registration applications
export const SEEDED_APPLICATIONS: CourseApplication[] = [];

// Initial seeded promotional banners (fully editable by admin)
export const DEFAULT_BANNERS: PromoBanner[] = [];

// Initial seeded project image gallery displaying real actions (fully editable by admin)
export const DEFAULT_GALLERY_IMAGES: GalleryImage[] = [];

/**
 * Offline-first localStorage Data Layer
 * Wrapped in error catchers to guarantee complete runtime stability.
 */
export class DakshyamDatabase {
  
  static get<T>(key: string, seed: T): T {
    try {
      const data = localStorage.getItem(`dakshyam_db_${key}`);
      if (!data) {
        localStorage.setItem(`dakshyam_db_${key}`, JSON.stringify(seed));
        return seed;
      }
      return JSON.parse(data) as T;
    } catch (e) {
      console.error(`Error reading ${key} from storage:`, e);
      return seed;
    }
  }

  static set<T>(key: string, data: T): void {
    try {
      localStorage.setItem(`dakshyam_db_${key}`, JSON.stringify(data));
      // Asynchronously synchronize with MongoDB Atlas
      fetch(`/api/db/${key}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ data })
      }).catch(err => console.warn(`Background MongoDB sync warning for key ${key}:`, err));
    } catch (e) {
      console.error(`Error writing ${key} to storage:`, e);
    }
  }

  // --- INITIALIZERS & CORE QUERIES ---

  static getCourses(): Course[] {
    return this.get<Course[]>('courses', DEFAULT_COURSES);
  }

  static saveCourses(items: Course[]): void {
    this.set('courses', items);
  }

  static getStudents(): StudentUser[] {
    return this.get<StudentUser[]>('students', SEEDED_STUDENTS);
  }

  static saveStudents(items: StudentUser[]): void {
    this.set('students', items);
  }

  static getTrainers(): TrainerUser[] {
    return this.get<TrainerUser[]>('trainers', SEEDED_TRAINERS);
  }

  static saveTrainers(items: TrainerUser[]): void {
    this.set('trainers', items);
  }

  static getBanners(): PromoBanner[] {
    return this.get<PromoBanner[]>('banners', DEFAULT_BANNERS);
  }

  static saveBanners(items: PromoBanner[]): void {
    this.set('banners', items);
  }

  static getGalleryImages(): GalleryImage[] {
    return this.get<GalleryImage[]>('gallery_images', DEFAULT_GALLERY_IMAGES);
  }

  static saveGalleryImages(items: GalleryImage[]): void {
    this.set('gallery_images', items);
  }

  static getAdmins(): AdminUser[] {
    const list = this.get<AdminUser[]>('admins', SEEDED_ADMINS);
    if (!list || list.length === 0) {
      return [{ id: 'usr-a1', name: 'Dakshyam Admin', email: 'admin@dakshyam.com', role: 'admin', createdAt: '2026-01-01' }];
    }
    return list;
  }

  static getGroups(): StudentGroup[] {
    return this.get<StudentGroup[]>('groups', SEEDED_GROUPS);
  }

  static saveGroups(items: StudentGroup[]): void {
    this.set('groups', items);
  }

  static getVideos(): VideoPost[] {
    return this.get<VideoPost[]>('videos', SEEDED_VIDEOS);
  }

  static saveVideos(items: VideoPost[]): void {
    this.set('videos', items);
  }

  static getCertificates(): Certificate[] {
    return this.get<Certificate[]>('certificates', SEEDED_CERTIFICATES);
  }

  static saveCertificates(items: Certificate[]): void {
    this.set('certificates', items);
  }

  static getApplications(): CourseApplication[] {
    return this.get<CourseApplication[]>('applications', SEEDED_APPLICATIONS);
  }

  static saveApplications(items: CourseApplication[]): void {
    this.set('applications', items);
  }

  // Active authenticated user state manager
  static getLoggedInUser() {
    try {
      const item = localStorage.getItem('dakshyam_logged_in_user');
      return item ? JSON.parse(item) : null;
    } catch {
      return null;
    }
  }

  static setLoggedInUser(user: any) {
    try {
      if (user) {
        localStorage.setItem('dakshyam_logged_in_user', JSON.stringify(user));
      } else {
        localStorage.removeItem('dakshyam_logged_in_user');
      }
    } catch (e) {
      console.error(e);
    }
  }

  /**
   * Safe registration logic checking existing duplicates
   */
  static registerStudent(name: string, email: string, password?: string, profile?: { phone: string; institution: string; gradeOrBranch: string; }): { success: boolean; error?: string } {
    const students = this.getStudents();
    const emailsMatch = (u: any) => u.email.toLowerCase() === email.toLowerCase();
    
    if (students.some(emailsMatch) || this.getTrainers().some(emailsMatch) || this.getAdmins().some(emailsMatch)) {
      return { success: false, error: 'Email already registered.' };
    }

    const newStudent: StudentUser = {
      id: `usr-s${Date.now()}`,
      name,
      email,
      role: 'student',
      password: password || '123456',
      profile,
      createdAt: new Date().toISOString().split('T')[0]
    };

    students.push(newStudent);
    this.saveStudents(students);
    return { success: true };
  }

  static registerTrainer(name: string, email: string, password?: string, isApproved = false): { success: boolean; error?: string } {
    const trainers = this.getTrainers();
    const emailsMatch = (u: any) => u.email.toLowerCase() === email.toLowerCase();
    
    if (this.getStudents().some(emailsMatch) || trainers.some(emailsMatch) || this.getAdmins().some(emailsMatch)) {
      return { success: false, error: 'Email already registered.' };
    }

    const newTrainer: TrainerUser = {
      id: `usr-t${Date.now()}`,
      name,
      email,
      role: 'trainer',
      isApproved, // Set depending on code verification or admin approval
      password: password || '123456',
      createdAt: new Date().toISOString().split('T')[0]
    };

    trainers.push(newTrainer);
    this.saveTrainers(trainers);
    return { success: true };
  }

  // --- SPECIAL TRAINING PROGRAMS & REGISTRATIONS ---

  static getSpecialPrograms(): SpecialTrainingProgram[] {
    const items = this.get<SpecialTrainingProgram[]>('special_programs', []);
    const now = new Date();
    
    // Automatic deletion of special training forms when the starting date/time has passed.
    const activeItems = items.filter(p => {
      try {
        if (!p.startingDateTime) return true;
        const startDate = new Date(p.startingDateTime);
        return startDate.getTime() > now.getTime();
      } catch {
        return true;
      }
    });

    if (activeItems.length !== items.length) {
      this.saveSpecialPrograms(activeItems);
    }
    return activeItems;
  }

  static getSpecialProgramsAll(): SpecialTrainingProgram[] {
    return this.get<SpecialTrainingProgram[]>('special_programs', []);
  }

  static saveSpecialPrograms(items: SpecialTrainingProgram[]): void {
    this.set('special_programs', items);
  }

  static getSpecialEnrollments(): SpecialProgramEnrollment[] {
    return this.get<SpecialProgramEnrollment[]>('special_enrollments', []);
  }

  static saveSpecialEnrollments(items: SpecialProgramEnrollment[]): void {
    this.set('special_enrollments', items);
  }

  static getCompanyAbout(): CompanyAbout {
    const defaultAbout: CompanyAbout = {
      companyName: 'Dakshyam Innovations',
      description: 'Dakshyam Innovations is a premier engineering education technology developer and skill incubator. We specialize in physical-digital integrated vocational training, making modern embedded labs, microcontrollers, IoT equipment, and programming frameworks accessible directly to students, primary setups, and regional schools. Under the visionary guidelines of India\'s National Education Policy (NEP 2020), our mission is to eliminate technical literacy barriers through custom physical teaching kits and high-performance, real-time feedback systems.',
      mission: 'To democratize access to 21st-century technology tools, physical computing, and web engineering. We provide state-of-the-art diagnostic kits and hardware resources, ensuring that students in Tier-2, Tier-3 and rural setups get hands-on workspace training.',
      vision: 'To build a standard vocational platform where beginners can smoothly transition from intuitive logical block models into building industrial-level internet of things telemetry systems and back-end web engines.',
      officeLocation: 'Waraseoni, Balaghat District, Madhya Pradesh, India',
      socialGithub: 'https://github.com/dakshyam-innovations',
      socialLinkedin: 'https://linkedin.com/company/dakshyam-innovations',
      socialTwitter: 'https://twitter.com/dakshyam_in',
      socialYoutube: 'https://youtube.com/@dakshyaminnovations',
      founders: [
        { name: 'Himanshu Patle', role: 'Co-Founder & Chief Director', bio: 'Directs strategic planning & corporate relations, aligning industrial skills development targets with institutions and regional secondary setups.', avatarText: 'HP' },
        { name: 'Ankush Nandagouli', role: 'Co-Founder & Chief Software Architect', bio: 'Directs physical/digital telemetry integrations, cloud-hosted API backends, real-time WebSocket pipelines, and educational platforms.', avatarText: 'AN' },
        { name: 'Anand Gautam', role: 'Co-Founder & Embedded Hardware Head', bio: 'Directs circuit diagnostics, micro-controller register calibrations, multi-H-bridge motor kinetics, sensor logic systems, and diagnostic kits.', avatarText: 'AG' },
        { name: 'Shikhar Bisen', role: 'Co-Founder & Laboratory Setup Lead', bio: 'Manages physical laboratory logistics, equipment distributions, electrical integrity checks, and field-stage support frameworks.', avatarText: 'SB' },
        { name: 'Kunal Raut', role: 'Co-Founder & Director of Operations', bio: 'Directs vocational logistics, community outreach campaigns, local school partnerships, and ensures flawless distribution of laboratory teaching kits.', avatarText: 'KR' },
        { name: 'Rohit Bhajipale', role: 'Co-Founder & Regional Coordinator', bio: 'Leads educational outreach programs, public relations, regional technical campaigns, and on-site training sessions.', avatarText: 'RB' }
      ]
    };
    const currentAbout = this.get<CompanyAbout>('company_about', defaultAbout);
    if (currentAbout && currentAbout.founders && !currentAbout.founders.some(f => f.name.toLowerCase().includes('kunal raut'))) {
      currentAbout.founders.splice(4, 0, {
        name: 'Kunal Raut',
        role: 'Co-Founder & Director of Operations',
        bio: 'Directs vocational logistics, community outreach campaigns, local school partnerships, and ensures flawless distribution of laboratory teaching kits.',
        avatarText: 'KR'
      });
      this.saveCompanyAbout(currentAbout);
    }
    return currentAbout;
  }

  static saveCompanyAbout(about: CompanyAbout): void {
    this.set('company_about', about);
  }

  static getSupervisorPin(): string {
    return this.get<string>('supervisor_pin', '427752');
  }

  static saveSupervisorPin(pin: string): void {
    this.set('supervisor_pin', pin);
  }

  static getAppLogs(): AppLog[] {
    return this.get<AppLog[]>('app_logs', [
      {
        id: 'log-initial',
        timestamp: new Date().toISOString(),
        action: 'System Seed',
        details: 'Initial system initialization, NEP 2020 diagnostic guidelines loaded.',
        userEmail: 'system@dakshyam.com',
        role: 'admin',
        status: 'INFO'
      }
    ]);
  }

  static saveAppLogs(logs: AppLog[]): void {
    this.set('app_logs', logs);
  }

  static logEvent(action: string, details: string, userEmail: string, role: string, status: 'SUCCESS' | 'ERROR' | 'INFO' = 'INFO'): void {
    try {
      const logs = this.getAppLogs();
      const newLog: AppLog = {
        id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        timestamp: new Date().toISOString(),
        action,
        details,
        userEmail: userEmail || 'guest@dakshyam.com',
        role: role || 'guest',
        status
      };
      logs.unshift(newLog);
      if (logs.length > 200) {
        logs.length = 200;
      }
      this.saveAppLogs(logs);
    } catch (e) {
      console.error('Failed to write app event log:', e);
    }
  }

  static clearUserRelatedData(): void {
    this.saveStudents([]);
    this.saveTrainers([]);
    this.saveGroups([]);
    this.saveVideos([]);
    this.saveCertificates([]);
    this.saveApplications([]);
    this.saveSpecialEnrollments([]);
    this.saveAppLogs([
      {
        id: `log-purge-${Date.now()}`,
        timestamp: new Date().toISOString(),
        action: 'Database Purged',
        details: 'Admin purged and wiped all candidate data stores and group tables.',
        userEmail: 'admin@dakshyam.com',
        role: 'admin',
        status: 'INFO'
      }
    ]);
    console.log('Successfully cleared all user-related data.');
  }

  // --- COOKIE PROTOCOL UTILITIES ---
  static getCookie(name: string): string {
    try {
      const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
      return match ? decodeURIComponent(match[2]) : '';
    } catch {
      return '';
    }
  }

  static setCookie(name: string, value: string, days = 365): void {
    try {
      const d = new Date();
      d.setTime(d.getTime() + days * 24 * 60 * 60 * 1000);
      document.cookie = `${name}=${encodeURIComponent(value)};path=/;expires=${d.toUTCString()};SameSite=Lax`;
    } catch (e) {
      console.error('Cookie write warning:', e);
    }
  }
}
