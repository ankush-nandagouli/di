import { StudentUser, TrainerUser, AdminUser, StudentGroup, Course, CourseApplication, Certificate, VideoPost, PromoBanner, GalleryImage, SpecialTrainingProgram, SpecialProgramEnrollment, CompanyAbout, CompanyFounder, AppLog, LogCategory, PageLoaderConfig } from '../types';

// Default seeded courses requested by the user
export const DEFAULT_COURSES: Course[] = [
  {
    id: 'CRS-IOT-101',
    title: 'IoT & Smart Robotics Engineering',
    duration: '3 Months',
    description: 'Comprehensive vocational training in physical computing, ESP32 microcontroller programming, Wi-Fi telemetry pipelines, and autonomous robotic rovers.',
    tags: ['ESP32', 'Robotics', 'Sensors', 'Telemetry', 'NEP-2020'],
    features: [
      'Hands-on ESP32 architecture & C++ firmware programming',
      'Dual H-Bridge Motor Kinetics & Sensor Diagnostics',
      'Real-time Telemetry Dashboard Deployment',
      'Complete Leased Hardware Kit Included'
    ],
    mobileHardwareIncluded: true
  },
  {
    id: 'CRS-WEB-201',
    title: 'Full-Stack Web & Real-Time Telemetry',
    duration: '8 Weeks',
    description: 'Build scalable web applications, RESTful microservices, and live IoT dashboards using React, TypeScript, Node.js, and MongoDB.',
    tags: ['React', 'TypeScript', 'Node.js', 'Express', 'MongoDB'],
    features: [
      'Modern Reactive Component Architecture',
      'REST API Development with Express & Middleware',
      'Real-time WebSockets & Telemetry Streaming',
      'Production Deployment to Cloud Infrastructure'
    ],
    mobileHardwareIncluded: false
  },
  {
    id: 'CRS-NEP-301',
    title: 'NEP 2020 Computational Thinking & Coding',
    duration: '1 Month',
    description: 'Inquiry-based foundational coding aligned with the National Education Policy. Covers logical flowcharts, block coding to script transitions, and cyber safety.',
    tags: ['NEP-2020', 'Computational-Thinking', 'Python', 'Logic', 'STEM'],
    features: [
      'Flowchart Architecture & Algorithmic Design',
      'Interactive Simulator & Game Logic Development',
      'Micro:bit & Arduino Physical Logic Demonstrations',
      'Verifiable NEP 2020 Certificate of Completion'
    ],
    mobileHardwareIncluded: true
  },
  {
    id: 'CRS-EMB-401',
    title: 'Embedded Systems & Circuit Instrumentation',
    duration: '6 Weeks',
    description: 'Master electronic circuit schematics, analog-to-digital signal processing, bus protocols (I2C, SPI, UART), and industrial motor drives.',
    tags: ['Embedded-C', 'Circuits', 'PCB-Basics', 'Sensors', 'Hardware'],
    features: [
      'Breadboard Prototyping & Multimeter Testing',
      'Microcontroller Register-Level Interfacing',
      'Pulse-Width Modulation & Motor Velocity Control',
      'Diagnostic Telemetry Logging'
    ],
    mobileHardwareIncluded: true
  }
];

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
export const DEFAULT_BANNERS: PromoBanner[] = [
  {
    id: 'ban-1',
    title: 'Vocational STEM Laboratories Across Madhya Pradesh Schools',
    subtitle: 'Equipping rural and urban students with leased high-performance hardware kits and hands-on robotics labs under NEP 2020 guidelines.',
    imageUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=1200&q=80',
    actionUrl: '#services',
    isActive: true,
    createdAt: '2026-01-01'
  },
  {
    id: 'ban-2',
    title: 'Hands-on IoT & Embedded Systems Winter Bootcamp',
    subtitle: '100% practical, project-driven engineering camps where students design, build, and deploy functional IoT telemetric products.',
    imageUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80',
    actionUrl: '#services',
    isActive: true,
    createdAt: '2026-01-02'
  }
];

// Initial seeded project image gallery displaying real actions (fully editable by admin)
export const DEFAULT_GALLERY_IMAGES: GalleryImage[] = [
  {
    id: 'gal-1',
    title: 'Robotics Assembly & Telemetry Testing',
    description: 'Students constructing autonomous wheeled robots with ultrasonic obstacle sensors and ESP32 microcontrollers.',
    imageUrl: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=800&q=80',
    category: 'iot_robotics',
    createdAt: '2026-01-01'
  },
  {
    id: 'gal-2',
    title: 'School Lab Installation & Microcontroller Workshops',
    description: 'Hands-on laboratory setup and diagnostic breadboard sessions conducted inside regional secondary schools.',
    imageUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80',
    category: 'school_programs',
    createdAt: '2026-01-02'
  },
  {
    id: 'gal-3',
    title: 'Full-Stack Software Development & Cloud Dashboards',
    description: 'Candidates designing real-time sensor dashboards and REST APIs using modern React and Node.js frameworks.',
    imageUrl: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=800&q=80',
    category: 'mern_web',
    createdAt: '2026-01-03'
  }
];

// Default animated video page loader configuration
export const DEFAULT_PAGE_LOADER_CONFIG: PageLoaderConfig = {
  enabled: true,
  videoUrl: '', // Ready for user's uploaded animated video
  mediaType: 'auto',
  showOnTabChange: true,
  minDurationMs: 850,
  title: 'DAKSHYAM INNOVATIONS',
  subtitle: 'Initializing Advanced Engineering & Telemetry Platform...',
  overlayTheme: 'glass',
  soundEnabled: false,
  showProgress: true,
  videoFit: 'cover',
  updatedAt: '2026-01-01'
};

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

  static getAuthToken(): string | null {
    try {
      return localStorage.getItem('dakshyam_auth_token');
    } catch {
      return null;
    }
  }

  static setAuthToken(token: string | null): void {
    try {
      if (token) {
        localStorage.setItem('dakshyam_auth_token', token);
      } else {
        localStorage.removeItem('dakshyam_auth_token');
      }
    } catch (e) {
      console.error(e);
    }
  }

  static set<T>(key: string, data: T): void {
    try {
      localStorage.setItem(`dakshyam_db_${key}`, JSON.stringify(data));
      // Asynchronously synchronize with MongoDB Atlas using Bearer token
      const token = this.getAuthToken();
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      fetch(`/api/db/${key}`, {
        method: 'POST',
        headers,
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

  static getPageLoaderConfig(): PageLoaderConfig {
    return this.get<PageLoaderConfig>('page_loader_config', DEFAULT_PAGE_LOADER_CONFIG);
  }

  static savePageLoaderConfig(config: PageLoaderConfig): void {
    this.set('page_loader_config', config);
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
        const { password, passwordHash, ...safeUser } = user;
        localStorage.setItem('dakshyam_logged_in_user', JSON.stringify(safeUser));
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
      isApproved,
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
    return this.get<string>('supervisor_pin', '');
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

  static logEvent(
    action: string, 
    details: string, 
    userEmail: string, 
    role: string, 
    status: 'SUCCESS' | 'ERROR' | 'INFO' | 'WARNING' = 'INFO',
    category?: LogCategory,
    metadata?: Record<string, any>
  ): void {
    try {
      // Auto-detect category if not explicitly specified
      let cat: LogCategory = category || 'SYSTEM';
      if (!category) {
        const lower = (action + ' ' + details).toLowerCase();
        if (lower.includes('workshop')) cat = 'WORKSHOP';
        else if (lower.includes('feedback')) cat = 'FEEDBACK';
        else if (lower.includes('auth') || lower.includes('login') || lower.includes('password') || lower.includes('signup') || lower.includes('registered')) cat = 'AUTH';
        else if (lower.includes('lockout') || lower.includes('security') || lower.includes('failed') || lower.includes('blocked')) cat = 'SECURITY';
        else if (lower.includes('student')) cat = 'STUDENT';
        else if (lower.includes('trainer')) cat = 'TRAINER';
        else if (lower.includes('cert')) cat = 'CERTIFICATE';
      }

      const logs = this.getAppLogs();
      const newLog: AppLog = {
        id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        timestamp: new Date().toISOString(),
        action,
        details,
        userEmail: userEmail || 'system@dakshyam.com',
        role: role || 'guest',
        status,
        category: cat,
        metadata
      };
      logs.unshift(newLog);
      if (logs.length > 500) {
        logs.length = 500;
      }
      this.saveAppLogs(logs);

      // Asynchronous non-blocking sync with backend API / MongoDB
      if (typeof fetch !== 'undefined') {
        fetch('/api/logs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newLog)
        }).catch(() => {});
      }
    } catch (e) {
      console.error('Failed to write app event log:', e);
    }
  }

  static async fetchRemoteLogs(limit = 100): Promise<AppLog[]> {
    try {
      const res = await fetch(`/api/logs?limit=${limit}`);
      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.logs) && data.logs.length > 0) {
          const local = this.getAppLogs();
          const existingIds = new Set(local.map(l => l.id));
          const combined = [...local];
          for (const rl of data.logs) {
            if (!existingIds.has(rl.id)) {
              combined.push(rl);
              existingIds.add(rl.id);
            }
          }
          combined.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
          if (combined.length > 500) combined.length = 500;
          this.saveAppLogs(combined);
          return combined;
        }
      }
    } catch (err) {
      console.warn('Could not load remote logs:', err);
    }
    return this.getAppLogs();
  }

  static exportLogsToCsv(logsToExport?: AppLog[]): void {
    try {
      const logs = logsToExport || this.getAppLogs();
      const headers = ['ID', 'Timestamp', 'Category', 'Status', 'Action', 'Operator Email', 'Role', 'Details'];
      const rows = logs.map(l => [
        `"${l.id}"`,
        `"${l.timestamp}"`,
        `"${l.category || 'SYSTEM'}"`,
        `"${l.status}"`,
        `"${(l.action || '').replace(/"/g, '""')}"`,
        `"${l.userEmail}"`,
        `"${l.role}"`,
        `"${(l.details || '').replace(/"/g, '""')}"`
      ]);
      const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `dakshyam_system_audit_logs_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Export CSV error:', err);
    }
  }

  static exportLogsToJson(logsToExport?: AppLog[]): void {
    try {
      const logs = logsToExport || this.getAppLogs();
      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(logs, null, 2));
      const link = document.createElement('a');
      link.setAttribute('href', dataStr);
      link.setAttribute('download', `dakshyam_system_audit_logs_${new Date().toISOString().split('T')[0]}.json`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Export JSON error:', err);
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

  // --- COOKIE PROTOCOL UTILITIES (HARDENED FOR EDGE, BRAVE, SAFARI & FIREFOX) ---
  static getCookie(name: string): string {
    try {
      const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
      if (match) return decodeURIComponent(match[2]);
      // Resilient fallback to localStorage if privacy shields blocked cookie
      if (typeof localStorage !== 'undefined') {
        const local = localStorage.getItem(name);
        if (local) return local;
      }
      return '';
    } catch {
      return '';
    }
  }

  static setCookie(name: string, value: string, days = 365): void {
    try {
      const d = new Date();
      d.setTime(d.getTime() + days * 24 * 60 * 60 * 1000);
      const isHttps = typeof window !== 'undefined' && (window.location.protocol === 'https:' || window.location.hostname !== 'localhost');
      const secureFlag = isHttps ? ';Secure' : '';
      document.cookie = `${name}=${encodeURIComponent(value)};path=/;expires=${d.toUTCString()};SameSite=Lax${secureFlag}`;
      
      // Dual-layer persistence across strict privacy shields (Brave, Edge Tracking Prevention)
      if (typeof localStorage !== 'undefined') {
        try {
          localStorage.setItem(name, value);
        } catch {}
      }
    } catch (e) {
      console.error('Cookie write warning:', e);
    }
  }
}
