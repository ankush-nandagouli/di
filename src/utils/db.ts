import { StudentUser, TrainerUser, AdminUser, StudentGroup, Course, CourseApplication, Certificate, VideoPost, PromoBanner, GalleryImage, SpecialTrainingProgram, SpecialProgramEnrollment, CompanyAbout, CompanyFounder } from '../types';

// Default seeded courses requested by the user
export const DEFAULT_COURSES: Course[] = [
  {
    id: 'course-1',
    title: 'IoT Training with Web Development',
    duration: '3 Months',
    description: 'Learn modern Web Dashboard engineering integrated with embedded hardware. Build smart devices with live telemetry tracking.',
    tags: ['IoT', 'React', 'Embedded C', 'Web Sockets', 'API Integrations'],
    features: [
      'Microcontroller Programming (ESP32/Arduino)',
      'Direct REST/MQTT API development',
      'Real-time React dashboards with Tailwind',
      'Deploying embedded sensors to cloud layers'
    ],
    mobileHardwareIncluded: false
  },
  {
    id: 'course-2',
    title: 'Full Stack Technology (MERN & Django)',
    duration: '2 Months',
    description: 'Master powerful modern ecosystems. Bridge high-speed backend controllers in Django & Javascript to clean React interfaces.',
    tags: ['MERN', 'Django', 'PostgreSQL', 'Redux', 'REST framework'],
    features: [
      'Database schema engineering with PostgreSQL & MongoDB',
      'Robust JWT Authentication & Middleware security',
      'Django Rest Framework (DRF) & Express backend APIs',
      'Beautiful SPA state handling on the client client'
    ],
    mobileHardwareIncluded: false
  },
  {
    id: 'course-3',
    title: 'Robotics & Automation Bootcamp',
    duration: '4 Weeks',
    description: 'Build responsive mechanisms, motorized limbs, autonomous line crawlers and mobile-controlled robotics nodes.',
    tags: ['Robotics', 'Kinematics', 'Bluetooth Tech', 'Sensors', 'Actuators'],
    features: [
      'Motor driver and H-Bridge configuration',
      'Autonomous pathfinding and distance calculation',
      'Custom app integration for wireless robotics control',
      'Mechanical assembly and system integrations'
    ],
    mobileHardwareIncluded: true
  },
  {
    id: 'course-4',
    title: 'School Computer Training & Essential Coding',
    duration: '1 Week (Customizable)',
    description: 'Tailored school digital literacy. Bringing physical systems directly to schools so students learn software environments manually.',
    tags: ['Basic Software', 'HTML/CSS', 'Scratch Coding', 'Office Suites'],
    features: [
      'Mobile hardware support (Laptops/Kits shipped directly)',
      'Introduction to programming logic and syntax',
      'Safe computer administration and operating systems',
      'Dedicated guidance with professional lab setups'
    ],
    mobileHardwareIncluded: true
  }
];

// Initial seeded students
export const SEEDED_STUDENTS: StudentUser[] = [
  { id: 'usr-s1', name: 'Ayush Patel', email: 'ayush@example.com', role: 'student', createdAt: '2026-06-01', profile: { phone: '+91 9123456789', institution: 'Government Excellence School Balaghat', gradeOrBranch: 'Grade 10' } },
  { id: 'usr-s2', name: 'Riya Shrivastava', email: 'riya@example.com', role: 'student', createdAt: '2026-06-02', profile: { phone: '+91 8877665544', institution: 'JIC Waraseoni', gradeOrBranch: 'Grade 11' } },
  { id: 'usr-s3', name: 'Amit Nanda', email: 'amit@example.com', role: 'student', createdAt: '2026-06-03', profile: { phone: '+91 7766554433', institution: 'Dakshyam Academy Balaghat', gradeOrBranch: 'MERN Stack Batch' } },
  { id: 'usr-s4', name: 'Kunal Sonkar', email: 'kunal@example.com', role: 'student', createdAt: '2026-06-04', profile: { phone: '+91 9988112233', institution: 'Govt Polytechnic Waraseoni', gradeOrBranch: 'Computer Science' } }
];

// Initial seeded trainers
export const SEEDED_TRAINERS: TrainerUser[] = [
  { id: 'usr-t1', name: 'Trainer Vivek Mathur', email: 'trainer@dakshyam.com', role: 'trainer', isApproved: true, createdAt: '2026-05-15' },
  { id: 'usr-t2', name: 'Trainer Dr. Shanti Rao', email: 'shanti@dakshyam.com', role: 'trainer', isApproved: true, createdAt: '2026-05-18' }
];

// Initial seeded admins
export const SEEDED_ADMINS: AdminUser[] = [
  { id: 'usr-a1', name: 'Dakshyam Admin Leader', email: 'admin@dakshyam.com', role: 'admin', createdAt: '2026-01-01' }
];

// Initial seeded project student groups with points
export const SEEDED_GROUPS: StudentGroup[] = [
  {
    id: 'grp-1',
    name: 'Team AgriBot',
    projectTitle: 'Smart IoT Irrigation & Telemetry Node',
    projectDescription: 'Esp32 based solar powered soil health monitor and automated watering node feeding real-time charts.',
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    memberIds: ['usr-s1', 'usr-s2'],
    points: 94,
    trainerId: 'usr-t1',
    createdAt: '2026-06-10'
  },
  {
    id: 'grp-2',
    name: 'Code Wizards',
    projectTitle: 'Interactive Django-MERN Medical Core Scheduler',
    projectDescription: 'A dynamic doctor reservation console linking MERN client components with a fast Django DRF schema mapping core services.',
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    memberIds: ['usr-s3'],
    points: 88,
    trainerId: 'usr-t1',
    createdAt: '2026-06-12'
  },
  {
    id: 'grp-3',
    name: 'Balaghat Robo Warriors',
    projectTitle: 'Obstacle Interceptor Bluetooth Bot',
    projectDescription: 'Autonomous crawling system running custom obstacle routing and manual overrides. Tested with custom mobile hardware sets.',
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    memberIds: ['usr-s4'],
    points: 79,
    trainerId: 'usr-t2',
    createdAt: '2026-06-15'
  }
];

// Initial social media video posts by groups
export const SEEDED_VIDEOS: VideoPost[] = [
  {
    id: 'vid-1',
    groupId: 'grp-1',
    groupName: 'Team AgriBot',
    title: 'Smart Soil Moisture Regulator in Action',
    description: 'Watch the sensor live-stream threshold variables and trigger micro-solenoid pumps without latency!',
    videoUrl: 'ESP32_AGRIBOT',
    likes: 12,
    likedByUserIds: [],
    views: 145,
    comments: [
      { id: 'c1', senderName: 'Trainer Vivek Mathur', text: 'Stunning calibration, team. The solar charge rate metrics show high stability.', timestamp: '2026-06-12 14:20' },
      { id: 'c2', senderName: 'Riya Shrivastava', text: 'This dashboard response looks so fast!', timestamp: '2026-06-13 09:12' }
    ],
    createdAt: '2026-06-11'
  },
  {
    id: 'vid-2',
    groupId: 'grp-2',
    groupName: 'Code Wizards',
    title: 'Django Rest API Schema Endpoint Stress Test',
    description: 'Profiling database query resolution on complex nested models using Django debugging logs.',
    videoUrl: 'DJANGO_CORE',
    likes: 7,
    likedByUserIds: [],
    views: 89,
    comments: [
      { id: 'c3', senderName: 'Kunal Sonkar', text: 'Are the database calls serialized properly on the endpoints?', timestamp: '2026-06-13 18:01' }
    ],
    createdAt: '2026-06-13'
  }
];

// Seeded certificates
export const SEEDED_CERTIFICATES: Certificate[] = [
  {
    id: 'DKM-2026-E49A',
    studentName: 'Ayush Patel',
    studentEmail: 'ayush@example.com',
    courseTitle: 'IoT Training with Web Development',
    projectTitle: 'Smart IoT Irrigation & Telemetry Node',
    issueDate: '2026-06-18',
    trainerId: 'usr-t1',
    trainerName: 'Trainer Vivek Mathur'
  },
  {
    id: 'DKM-2026-R82X',
    studentName: 'Riya Shrivastava',
    studentEmail: 'riya@example.com',
    courseTitle: 'IoT Training with Web Development',
    projectTitle: 'Smart IoT Irrigation & Telemetry Node',
    issueDate: '2026-06-18',
    trainerId: 'usr-t1',
    trainerName: 'Trainer Vivek Mathur'
  }
];

// Initial course registration applications
export const SEEDED_APPLICATIONS: CourseApplication[] = [
  {
    id: 'app-1',
    studentId: 'usr-s1',
    fullName: 'Ayush Patel',
    email: 'ayush@example.com',
    phone: '+91 9123456789',
    institution: 'Government Excellence School Balaghat',
    courseId: 'course-1',
    appliedAt: '2026-06-08',
    status: 'approved'
  },
  {
    id: 'app-2',
    studentId: 'usr-s4',
    fullName: 'Kunal Sonkar',
    email: 'kunal@example.com',
    phone: '+91 9988112233',
    institution: 'Govt Polytechnic Waraseoni',
    courseId: 'course-3',
    appliedAt: '2026-06-14',
    status: 'pending'
  }
];

// Initial seeded promotional banners (fully editable by admin)
export const DEFAULT_BANNERS: PromoBanner[] = [
  {
    id: 'ban-1',
    title: 'NEP 2020 Aligned School Programming & Robotics Labs',
    subtitle: 'Bringing 21st century programming, game design & smart hardware direct to students. High-spec training rigs leased free of charge!',
    imageUrl: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?q=80&w=1200&auto=format&fit=crop',
    actionUrl: '#services',
    isActive: true,
    createdAt: '2026-06-01'
  },
  {
    id: 'ban-2',
    title: 'Admissions Open: 3-Month IoT Integrated Web Apps Batch',
    subtitle: 'Master complete ESP32 sensor telemetry pipelines hooked into real-time custom React dashboards. Earn verified industry-ready credentials!',
    imageUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=1200&auto=format&fit=crop',
    actionUrl: '#services',
    isActive: true,
    createdAt: '2026-06-05'
  },
  {
    id: 'ban-3',
    title: 'Customizable 1-Week Intensive Coding Workshops',
    subtitle: 'Now booking for regional government and private schools in Balaghat. Focus is 100% on logical reasoning and hardware interfaces.',
    imageUrl: 'https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?q=80&w=1200&auto=format&fit=crop',
    isActive: true,
    createdAt: '2026-06-12'
  }
];

// Initial seeded project image gallery displaying real actions (fully editable by admin)
export const DEFAULT_GALLERY_IMAGES: GalleryImage[] = [
  {
    id: 'gal-1',
    title: 'School IT Lab Integration - Balaghat Regional',
    description: 'Providing mobile computer rigs and microcontrollers with custom programming guides. Supporting rural students with coding kits.',
    imageUrl: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?q=80&w=650&auto=format&fit=crop',
    category: 'school_programs',
    createdAt: '2026-06-02'
  },
  {
    id: 'gal-2',
    title: 'ESP32 Wi-Fi Sensor Calibration',
    description: 'Students testing telemetry thresholds. Connecting live analog signals to Express web relays and charting results live.',
    imageUrl: 'https://images.unsplash.com/photo-1517055720730-076b4efc42a2?q=80&w=650&auto=format&fit=crop',
    category: 'iot_robotics',
    createdAt: '2026-06-04'
  },
  {
    id: 'gal-3',
    title: 'Autonomous Robotics Obstacle Schedulers',
    description: 'Custom Bluetooth motor chassis calibrated inside regional secondary setups for algorithmic path calculations.',
    imageUrl: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?q=80&w=650&auto=format&fit=crop',
    category: 'iot_robotics',
    createdAt: '2026-06-08'
  },
  {
    id: 'gal-4',
    title: 'Django API Core Security Exercises',
    description: 'Advanced student programmers engineering JSON Web Token verification filters on REST schemas for patient tracking systems.',
    imageUrl: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?q=80&w=650&auto=format&fit=crop',
    category: 'mern_web',
    createdAt: '2026-06-11'
  },
  {
    id: 'gal-5',
    title: 'National Education Policy Training Session',
    description: 'Aligning classrooms to core developmental benchmarks in logical problem solving, manual building, and design mechanics.',
    imageUrl: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?q=80&w=650&auto=format&fit=crop',
    category: 'school_programs',
    createdAt: '2026-06-14'
  }
];

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
    return this.get<AdminUser[]>('admins', SEEDED_ADMINS);
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

  // Register standard mock auth simulation
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

  static registerTrainer(name: string, email: string, password?: string): { success: boolean; error?: string } {
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
      isApproved: false, // Starts as pending admin approval!
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
    return this.get<string>('supervisor_pin', '123456');
  }

  static saveSupervisorPin(pin: string): void {
    this.set('supervisor_pin', pin);
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
