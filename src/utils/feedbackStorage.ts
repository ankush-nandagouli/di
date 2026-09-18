import { db } from './firebase';
import { collection, doc, getDoc, getDocs, setDoc, deleteDoc, query, orderBy } from 'firebase/firestore';
import { WorkshopFeedbackSubmission, WorkshopFeedbackConfig, WorkshopItem } from '../types';
import { DakshyamDatabase } from './db';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';

// Canonical deployed Vercel domain for public student feedback links
export const VERCEL_DOMAIN = 'https://dakshyaminnovations.vercel.app';

export const getActiveBaseDomain = (): string => {
  if (typeof window !== 'undefined' && window.location.origin) {
    // If running on any deployed web host or production domain, use the current active origin
    const origin = window.location.origin;
    if (!origin.includes('localhost:3000') && !origin.includes('127.0.0.1:3000')) {
      return origin;
    }
  }
  // Check if a custom production domain was specified in localStorage
  if (typeof localStorage !== 'undefined') {
    const custom = localStorage.getItem('dakshyam_custom_production_domain');
    if (custom && custom.startsWith('http')) {
      return custom.replace(/\/+$/, '');
    }
  }
  return VERCEL_DOMAIN;
};

export const toWorkshopSlug = (nameOrId: string): string => {
  return (nameOrId || '')
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

export const getWorkshopShareUrl = (ws?: WorkshopItem | string | null, useVercel = false): string => {
  let base = getActiveBaseDomain();
  if (useVercel) {
    // If current origin is already on Vercel or production domain, prefer active origin; otherwise fallback to VERCEL_DOMAIN
    if (typeof window !== 'undefined' && window.location.origin && window.location.hostname.includes('vercel.app')) {
      base = window.location.origin;
    } else {
      base = VERCEL_DOMAIN;
    }
  } else if (typeof window !== 'undefined' && window.location.origin) {
    base = window.location.origin;
  }

  if (!ws) {
    return `${base}/feedback-form`;
  }
  const slug = typeof ws === 'string' 
    ? toWorkshopSlug(ws) 
    : (toWorkshopSlug(ws.name) || toWorkshopSlug(ws.id));
  return `${base}/feedback-form/${slug}`;
};

export const getWorkshopHashShareUrl = (ws?: WorkshopItem | string | null): string => {
  const base = typeof window !== 'undefined' && window.location.origin ? window.location.origin : getActiveBaseDomain();
  if (!ws) return `${base}/#/feedback-form`;
  const slug = typeof ws === 'string' 
    ? toWorkshopSlug(ws) 
    : (toWorkshopSlug(ws.name) || toWorkshopSlug(ws.id));
  return `${base}/#/feedback-form/${slug}`;
};

export const getWorkshopQueryShareUrl = (ws?: WorkshopItem | string | null): string => {
  const base = typeof window !== 'undefined' && window.location.origin ? window.location.origin : getActiveBaseDomain();
  if (!ws) return `${base}/?tab=feedback`;
  const slug = typeof ws === 'string' 
    ? toWorkshopSlug(ws) 
    : (toWorkshopSlug(ws.name) || toWorkshopSlug(ws.id));
  return `${base}/?tab=feedback&workshop=${slug}`;
};

export const getVercelWorkshopShareUrl = (ws?: WorkshopItem | string | null): string => {
  return getWorkshopShareUrl(ws, true);
};

export const getLiveAppWorkshopShareUrl = (ws?: WorkshopItem | string | null): string => {
  return getWorkshopShareUrl(ws, false);
};

export const DEFAULT_WORKSHOPS: WorkshopItem[] = [
  {
    id: 'WS-IOT-ROBO',
    name: 'Industrial IoT & Autonomous Robotics Bootcamp',
    date: '2026-09-10',
    venue: 'Dakshyam Central STEM & Robotics Lab, Balaghat',
    trainerName: 'Anand Gautam & Dakshyam Tech Leads',
    description: 'Hands-on ESP32 sensor telemetry, dual H-Bridge motor controls, firmware flashing, and live cloud dashboards.',
    isActive: true
  },
  {
    id: 'WS-NEP-STEM',
    name: 'NEP 2020 Computational STEM & Embedded Prototyping',
    date: '2026-08-25',
    venue: 'Govt. Polytechnic & Model Higher Secondary School',
    trainerName: 'Rohit Bhajipale & Kunal Raut',
    description: 'Vocational computational thinking, circuit schematic mapping, breadboard diagnostics, and logic design.',
    isActive: true
  },
  {
    id: 'WS-SMART-FARM',
    name: 'Smart Agro-Telemetry & Environmental Sensor Interfacing',
    date: '2026-08-12',
    venue: 'Agricultural Engineering Campus & Rural Innovation Wing',
    trainerName: 'Shikhar Bisen & Hardware Team',
    description: 'Analog/Digital soil moisture sensing, automated relay irrigation switches, LoRa wireless RF, and field diagnostics.',
    isActive: true
  },
  {
    id: 'WS-FULLSTACK-DASH',
    name: 'Full-Stack Web Engineering for IoT Telemetry',
    date: '2026-07-28',
    venue: 'Dakshyam Software Center, Balaghat',
    trainerName: 'Dakshyam Web Engineering Team',
    description: 'RESTful API integration, WebSocket pipelines, interactive real-time visual telemetry, and dashboard architecture.',
    isActive: true
  }
];

export const DEFAULT_FEEDBACK_CONFIG: WorkshopFeedbackConfig = {
  id: 'global-workshop-feedback-config',
  formTitle: 'Dakshyam Innovations Workshop Evaluation & Feedback',
  formSubtitle: 'Your candid evaluation directly powers our curriculum optimization, laboratory equipment enhancements, and hands-on trainer methodologies.',
  isOpen: true,
  workshops: DEFAULT_WORKSHOPS,
  customQuestions: [
    {
      id: 'q-pace',
      label: 'How was the instructional pace of the practical workshop exercises?',
      type: 'choice',
      required: false,
      options: ['Too Fast', 'Just Right & Balanced', 'A Bit Slow', 'Need More Lab Time']
    },
    {
      id: 'q-kit',
      label: 'Was the hardware laboratory kit adequate and functioning reliably?',
      type: 'yesno',
      required: false
    }
  ],
  updatedAt: new Date().toISOString()
};

export const SEEDED_FEEDBACKS: WorkshopFeedbackSubmission[] = [
  {
    id: 'fb-demo-001',
    workshopId: 'WS-IOT-ROBO',
    workshopName: 'Industrial IoT & Autonomous Robotics Bootcamp',
    workshopDate: '2026-09-10',
    workshopVenue: 'Dakshyam Central STEM & Robotics Lab, Balaghat',
    participantCategory: 'student',
    fullName: 'Aditya Verma',
    email: 'aditya.verma@example.edu',
    phone: '9826123456',
    institutionName: 'Govt. Engineering College, Jabalpur',
    city: 'Balaghat',
    state: 'Madhya Pradesh',
    branchOrGrade: 'B.Tech ECE (3rd Year)',
    rollOrEmployeeId: '0101EC231012',
    designationOrRole: 'Student Participant',
    overallRating: 5,
    trainerKnowledgeRating: 5,
    practicalHardwareRating: 5,
    industryRelevanceRating: 5,
    labManagementRating: 4,
    keyLearnings: 'Learned register-level ESP32 Wi-Fi telemetry, MQTT message brokering, and PWM motor driver configuration.',
    favoriteComponent: 'Live motor kinetics and Wi-Fi dashboard sync',
    improvementSuggestions: 'Please organize an advanced 5-day session on ROS2 and drone flight controllers.',
    futureInterests: ['ROS2 & Drone Kinematics', 'Embedded C Firmware', 'Industrial Automation'],
    recommendDakshyam: 'Yes, Definitely',
    testimonial: 'One of the most practical and well-equipped workshops in Central India. Every student received their own hardware kit.',
    customAnswers: { 'q-pace': 'Just Right & Balanced', 'q-kit': 'Yes' },
    submittedAt: '2026-09-10T16:45:00.000Z'
  },
  {
    id: 'fb-demo-002',
    workshopId: 'WS-NEP-STEM',
    workshopName: 'NEP 2020 Computational STEM & Embedded Prototyping',
    workshopDate: '2026-08-25',
    workshopVenue: 'Govt. Polytechnic & Model Higher Secondary School',
    participantCategory: 'school',
    fullName: 'Dr. Sunita Sharma',
    email: 'principal.model@mpeducation.gov.in',
    phone: '9425890123',
    institutionName: 'Model Excellence Higher Secondary School',
    city: 'Waraseoni',
    state: 'Madhya Pradesh',
    branchOrGrade: 'Science & Vocational Faculty',
    rollOrEmployeeId: 'FAC-EMP-8841',
    designationOrRole: 'Principal / STEM Coordinator',
    overallRating: 5,
    trainerKnowledgeRating: 5,
    practicalHardwareRating: 4,
    industryRelevanceRating: 5,
    labManagementRating: 5,
    keyLearnings: 'Translating theoretical physics concepts into interactive sensor-driven circuits for high school students.',
    favoriteComponent: 'Breadboard circuit logic and interactive simulation tools',
    improvementSuggestions: 'We request Dakshyam Innovations to establish a permanent Atal Tinkering Lab setup in our school.',
    futureInterests: ['School STEM Labs', 'Teacher Training & NEP 2020', 'Robotics Curriculum'],
    recommendDakshyam: 'Yes, Definitely',
    testimonial: 'Dakshyam brought true experiential learning to our rural students. The trainers were patient and highly knowledgeable.',
    customAnswers: { 'q-pace': 'Just Right & Balanced', 'q-kit': 'Yes' },
    submittedAt: '2026-08-25T17:20:00.000Z'
  },
  {
    id: 'fb-demo-003',
    workshopId: 'WS-IOT-ROBO',
    workshopName: 'Industrial IoT & Autonomous Robotics Bootcamp',
    workshopDate: '2026-09-10',
    workshopVenue: 'Dakshyam Central STEM & Robotics Lab, Balaghat',
    participantCategory: 'college',
    fullName: 'Prof. Rajesh K. Tiwari',
    email: 'rktiwari.polytechnic@gmail.com',
    phone: '9752044819',
    institutionName: 'Govt. Polytechnic College, Balaghat',
    city: 'Balaghat',
    state: 'Madhya Pradesh',
    branchOrGrade: 'Department of Electrical Engineering',
    rollOrEmployeeId: 'HOD-EE-201',
    designationOrRole: 'Head of Department',
    overallRating: 5,
    trainerKnowledgeRating: 5,
    practicalHardwareRating: 5,
    industryRelevanceRating: 5,
    labManagementRating: 5,
    keyLearnings: 'Direct industrial sensor calibration, analog signal conversion, and cloud telemetry integration.',
    favoriteComponent: 'Hands-on hardware troubleshooting & oscilloscopes',
    improvementSuggestions: 'Conduct a faculty development program (FDP) of 2 weeks with certification.',
    futureInterests: ['Industrial Automation & PLC', 'Faculty Development', 'IoT Lab Setup'],
    recommendDakshyam: 'Yes, Definitely',
    testimonial: 'Exemplary industrial standards. The hardware kits provided by Dakshyam are top grade.',
    customAnswers: { 'q-pace': 'Just Right & Balanced', 'q-kit': 'Yes' },
    submittedAt: '2026-09-10T17:05:00.000Z'
  },
  {
    id: 'fb-demo-004',
    workshopId: 'WS-SMART-FARM',
    workshopName: 'Smart Agro-Telemetry & Environmental Sensor Interfacing',
    workshopDate: '2026-08-12',
    workshopVenue: 'Agricultural Engineering Campus & Rural Innovation Wing',
    participantCategory: 'other',
    fullName: 'Mahendra Patel',
    email: 'mahendra.patel.agro@yahoo.com',
    phone: '9893112233',
    institutionName: 'Krishi Vikas Agritech FPO',
    city: 'Lalbarra',
    state: 'Madhya Pradesh',
    branchOrGrade: 'Agri-Tech Enterprise Lead',
    rollOrEmployeeId: 'FPO-DIR-09',
    designationOrRole: 'Operations Director',
    overallRating: 4,
    trainerKnowledgeRating: 5,
    practicalHardwareRating: 4,
    industryRelevanceRating: 5,
    labManagementRating: 4,
    keyLearnings: 'Automated relay control for drip irrigation and soil nitrogen sensor reading.',
    favoriteComponent: 'Solar-powered LoRa telemetry prototype',
    improvementSuggestions: 'Provide a translated Hindi reference manual for local farmers and rural youth.',
    futureInterests: ['Solar Telemetry', 'Smart Agriculture', 'LoRa Wireless Mesh'],
    recommendDakshyam: 'Likely',
    testimonial: 'Practical technology designed for real rural challenges.',
    customAnswers: { 'q-pace': 'A Bit Slow', 'q-kit': 'Yes' },
    submittedAt: '2026-08-12T15:30:00.000Z'
  }
];

const LOCAL_STORAGE_FEEDBACK_KEY = 'dakshyam_workshop_feedbacks';
const LOCAL_STORAGE_CONFIG_KEY = 'dakshyam_workshop_feedback_config';

export class WorkshopFeedbackStorage {
  // --- CONFIG MANAGEMENT ---
  static getFeedbackConfig(): WorkshopFeedbackConfig {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_CONFIG_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && parsed.formTitle) return parsed;
      }
    } catch (e) {
      console.warn('Config local read warning:', e);
    }
    return DEFAULT_FEEDBACK_CONFIG;
  }

  static async fetchFeedbackConfigFromFirestore(): Promise<WorkshopFeedbackConfig> {
    try {
      const docRef = doc(db, 'workshop_feedback_configs', 'global-config');
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const data = snap.data() as WorkshopFeedbackConfig;
        if (data && data.formTitle) {
          localStorage.setItem(LOCAL_STORAGE_CONFIG_KEY, JSON.stringify(data));
          return data;
        }
      }
    } catch (e) {
      console.warn('Could not fetch feedback config from Firestore:', e);
    }
    return this.getFeedbackConfig();
  }

  static async saveFeedbackConfig(config: WorkshopFeedbackConfig): Promise<boolean> {
    try {
      config.updatedAt = new Date().toISOString();
      localStorage.setItem(LOCAL_STORAGE_CONFIG_KEY, JSON.stringify(config));

      // Sync with Firestore
      try {
        const docRef = doc(db, 'workshop_feedback_configs', 'global-config');
        await setDoc(docRef, config, { merge: true });
      } catch (fbErr) {
        console.warn('Firestore config write warning (cached locally):', fbErr);
      }

      DakshyamDatabase.logEvent(
        'Feedback Config Updated',
        `Admin modified workshop feedback form settings (${config.workshops.length} workshops, status: ${config.isOpen ? 'OPEN' : 'CLOSED'})`,
        'admin@dakshyam.com',
        'admin',
        'SUCCESS',
        'WORKSHOP'
      );
      return true;
    } catch (err) {
      console.error('Save config error:', err);
      return false;
    }
  }

  // --- WORKSHOP LIFECYCLE & COUNTING ---
  static getTotalWorkshopsCreated(): number {
    const config = this.getFeedbackConfig();
    return config.totalWorkshopsCreated || config.workshops.length || 0;
  }

  static async createWorkshop(
    workshopData: {
      name: string;
      date: string;
      venue: string;
      trainerName?: string;
      description?: string;
      targetAudience?: string;
      isActive?: boolean;
    },
    operatorEmail = 'admin@dakshyam.com',
    operatorRole = 'admin'
  ): Promise<{ success: boolean; workshop?: WorkshopItem; error?: string }> {
    try {
      if (!workshopData.name || !workshopData.name.trim()) {
        return { success: false, error: 'Workshop title is required.' };
      }
      if (!workshopData.date || !workshopData.date.trim()) {
        return { success: false, error: 'Workshop scheduled date is required.' };
      }

      const config = this.getFeedbackConfig();
      const id = `WS-${Date.now().toString(36).toUpperCase()}`;
      const slug = toWorkshopSlug(workshopData.name) || toWorkshopSlug(id);

      const newWs: WorkshopItem = {
        id,
        name: workshopData.name.trim(),
        date: workshopData.date.trim(),
        venue: workshopData.venue?.trim() || 'Dakshyam Central STEM & Robotics Lab, Balaghat',
        trainerName: workshopData.trainerName?.trim() || 'Dakshyam Tech Lead',
        description: workshopData.description?.trim() || '',
        targetAudience: workshopData.targetAudience?.trim() || 'School, College & Vocational STEM Candidates',
        isActive: workshopData.isActive ?? true,
        createdAt: new Date().toISOString(),
        slug,
        formUrl: `/feedback-form/${slug}`
      };

      // Check for duplicate by name
      const existingIdx = config.workshops.findIndex(w => w.name.toLowerCase() === newWs.name.toLowerCase());
      if (existingIdx >= 0) {
        config.workshops[existingIdx] = { ...config.workshops[existingIdx], ...newWs };
      } else {
        config.workshops = [newWs, ...config.workshops];
      }

      // Maintain persistent lifetime count of created workshops
      const currentCount = config.totalWorkshopsCreated || (config.workshops.length - 1);
      config.totalWorkshopsCreated = Math.max(currentCount + 1, config.workshops.length);
      config.updatedAt = new Date().toISOString();

      await this.saveFeedbackConfig(config);

      // Async sync to MongoDB backend
      if (typeof fetch !== 'undefined') {
        fetch('/api/db/workshop_feedback_config', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ data: config })
        }).catch(() => {});
      }

      const shareUrl = getWorkshopShareUrl(newWs, false);
      const vercelUrl = getWorkshopShareUrl(newWs, true);

      DakshyamDatabase.logEvent(
        'Workshop Created & Form Published',
        `Published new evaluation form for workshop "${newWs.name}" (ID: ${newWs.id}, Scheduled: ${newWs.date} at ${newWs.venue}, Lead Trainer: ${newWs.trainerName}). Live URL: ${shareUrl}. Lifetime workshops created: ${config.totalWorkshopsCreated}.`,
        operatorEmail,
        operatorRole,
        'SUCCESS',
        'WORKSHOP',
        { workshopId: newWs.id, slug, shareUrl, vercelUrl, totalCount: config.totalWorkshopsCreated }
      );

      return { success: true, workshop: newWs };
    } catch (err: any) {
      console.error('Failed to create workshop:', err);
      DakshyamDatabase.logEvent(
        'Workshop Creation Failed',
        `Error creating workshop "${workshopData.name}": ${err.message}`,
        operatorEmail,
        operatorRole,
        'ERROR',
        'WORKSHOP'
      );
      return { success: false, error: err.message || 'Failed to create workshop.' };
    }
  }

  static async updateWorkshop(
    id: string,
    updates: Partial<WorkshopItem>,
    operatorEmail = 'admin@dakshyam.com',
    operatorRole = 'admin'
  ): Promise<boolean> {
    try {
      const config = this.getFeedbackConfig();
      const index = config.workshops.findIndex(w => w.id === id);
      if (index === -1) return false;

      const old = config.workshops[index];
      const updated: WorkshopItem = {
        ...old,
        ...updates,
        slug: updates.name ? toWorkshopSlug(updates.name) : (old.slug || toWorkshopSlug(old.name))
      };
      config.workshops[index] = updated;
      config.updatedAt = new Date().toISOString();

      await this.saveFeedbackConfig(config);

      DakshyamDatabase.logEvent(
        'Workshop Details Updated',
        `Admin updated workshop "${updated.name}" (ID: ${id}, Status: ${updated.isActive ? 'ACTIVE' : 'INACTIVE'})`,
        operatorEmail,
        operatorRole,
        'SUCCESS',
        'WORKSHOP',
        { workshopId: id, updates }
      );
      return true;
    } catch (e) {
      console.error('Error updating workshop:', e);
      return false;
    }
  }

  static async toggleWorkshopStatus(
    id: string,
    operatorEmail = 'admin@dakshyam.com',
    operatorRole = 'admin'
  ): Promise<boolean> {
    const config = this.getFeedbackConfig();
    const ws = config.workshops.find(w => w.id === id);
    if (!ws) return false;
    return this.updateWorkshop(id, { isActive: !ws.isActive }, operatorEmail, operatorRole);
  }

  static async deleteWorkshop(
    id: string,
    operatorEmail = 'admin@dakshyam.com',
    operatorRole = 'admin'
  ): Promise<boolean> {
    try {
      const config = this.getFeedbackConfig();
      const target = config.workshops.find(w => w.id === id);
      if (!target) return false;

      config.workshops = config.workshops.filter(w => w.id !== id);
      config.updatedAt = new Date().toISOString();

      await this.saveFeedbackConfig(config);

      DakshyamDatabase.logEvent(
        'Workshop Deleted',
        `Admin removed workshop "${target.name}" (ID: ${id}) from active configurations.`,
        operatorEmail,
        operatorRole,
        'INFO',
        'WORKSHOP',
        { workshopId: id }
      );
      return true;
    } catch (e) {
      console.error('Error deleting workshop:', e);
      return false;
    }
  }

  static getWorkshopsWithStats(): (WorkshopItem & { submissionCount: number; avgRating: number })[] {
    const config = this.getFeedbackConfig();
    const submissions = this.getSubmissions();

    return config.workshops.map(ws => {
      const related = submissions.filter(s => 
        s.workshopId === ws.id || 
        toWorkshopSlug(s.workshopName) === toWorkshopSlug(ws.name)
      );
      const subCount = related.length;
      let avgRating = 5;
      if (subCount > 0) {
        const sum = related.reduce((acc, curr) => acc + (curr.overallRating || 5), 0);
        avgRating = Number((sum / subCount).toFixed(1));
      }
      return {
        ...ws,
        submissionCount: subCount,
        avgRating
      };
    });
  }

  // --- SUBMISSIONS MANAGEMENT ---
  static getSubmissions(): WorkshopFeedbackSubmission[] {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_FEEDBACK_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn('Submissions local read warning:', e);
    }
    return SEEDED_FEEDBACKS;
  }

  static saveLocalSubmissions(items: WorkshopFeedbackSubmission[]): void {
    try {
      localStorage.setItem(LOCAL_STORAGE_FEEDBACK_KEY, JSON.stringify(items));
    } catch (e) {
      console.error('Local save error:', e);
    }
  }

  static async fetchFromFirestore(): Promise<WorkshopFeedbackSubmission[]> {
    try {
      const q = query(collection(db, 'workshop_feedbacks'), orderBy('submittedAt', 'desc'));
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        const items: WorkshopFeedbackSubmission[] = [];
        snapshot.forEach(docSnap => {
          items.push(docSnap.data() as WorkshopFeedbackSubmission);
        });
        this.saveLocalSubmissions(items);
        return items;
      }
    } catch (err) {
      console.warn('Firestore fetch fallback to local cache:', err);
    }
    return this.getSubmissions();
  }

  static async submitFeedback(submissionData: Omit<WorkshopFeedbackSubmission, 'id' | 'submittedAt'>): Promise<{ success: boolean; id?: string; error?: string }> {
    try {
      const id = `fb-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const submission: WorkshopFeedbackSubmission = {
        ...submissionData,
        id,
        submittedAt: new Date().toISOString()
      };

      // 1. Update local storage
      const currentList = this.getSubmissions();
      const updatedList = [submission, ...currentList.filter(item => item.id !== id)];
      this.saveLocalSubmissions(updatedList);

      // 2. Sync to Firestore
      try {
        const docRef = doc(db, 'workshop_feedbacks', id);
        await setDoc(docRef, submission);
      } catch (fbErr: any) {
        console.warn('Firestore submission sync fallback:', fbErr);
      }

      DakshyamDatabase.logEvent(
        'Workshop Feedback Submitted',
        `Participant ${submission.fullName} (${submission.participantCategory}) submitted evaluation for "${submission.workshopName}" (${submission.overallRating}/5 stars).`,
        submission.email,
        submission.participantCategory,
        'SUCCESS'
      );

      return { success: true, id };
    } catch (err: any) {
      console.error('Feedback submit failure:', err);
      return { success: false, error: err.message || 'Failed to register feedback.' };
    }
  }

  static async deleteSubmission(id: string): Promise<boolean> {
    try {
      const currentList = this.getSubmissions();
      const filtered = currentList.filter(item => item.id !== id);
      this.saveLocalSubmissions(filtered);

      try {
        const docRef = doc(db, 'workshop_feedbacks', id);
        await deleteDoc(docRef);
      } catch (fbErr) {
        console.warn('Firestore delete sync warning:', fbErr);
      }

      DakshyamDatabase.logEvent(
        'Feedback Record Deleted',
        `Admin purged feedback record ${id}`,
        'admin@dakshyam.com',
        'admin',
        'INFO'
      );
      return true;
    } catch (e) {
      console.error('Delete feedback error:', e);
      return false;
    }
  }

  // --- EXPORT TO EXCEL (.XLSX) ---
  static exportToExcel(submissions: WorkshopFeedbackSubmission[], filename = 'Dakshyam_Workshop_Feedback_Report.xlsx'): void {
    try {
      const formattedData = submissions.map((sub, index) => ({
        'S.No': index + 1,
        'Feedback ID': sub.id,
        'Workshop Name': sub.workshopName,
        'Workshop Date': sub.workshopDate,
        'Venue / Campus': sub.workshopVenue,
        'Category': sub.participantCategory.toUpperCase(),
        'Full Name': sub.fullName,
        'Email Address': sub.email,
        'Phone Number': sub.phone,
        'Institution / College / School': sub.institutionName,
        'City': sub.city,
        'State': sub.state,
        'Branch / Grade / Dept': sub.branchOrGrade || 'N/A',
        'Roll / ID / Emp No': sub.rollOrEmployeeId || 'N/A',
        'Role / Designation': sub.designationOrRole || 'N/A',
        'Overall Rating (1-5)': sub.overallRating,
        'Trainer Knowledge (1-5)': sub.trainerKnowledgeRating,
        'Hands-on Practical Kits (1-5)': sub.practicalHardwareRating,
        'Industry Relevance (1-5)': sub.industryRelevanceRating,
        'Lab Management (1-5)': sub.labManagementRating,
        'Key Learnings': sub.keyLearnings,
        'Favorite Exercise / Component': sub.favoriteComponent,
        'Improvement Suggestions': sub.improvementSuggestions,
        'Future Interests': Array.isArray(sub.futureInterests) ? sub.futureInterests.join(', ') : '',
        'Recommend Dakshyam': sub.recommendDakshyam,
        'Testimonial': sub.testimonial || '',
        'Submitted At': new Date(sub.submittedAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
      }));

      const worksheet = XLSX.utils.json_to_sheet(formattedData);

      // Set column widths for readability
      worksheet['!cols'] = [
        { wch: 6 },  // S.No
        { wch: 15 }, // ID
        { wch: 30 }, // Workshop Name
        { wch: 12 }, // Date
        { wch: 30 }, // Venue
        { wch: 14 }, // Category
        { wch: 22 }, // Name
        { wch: 26 }, // Email
        { wch: 14 }, // Phone
        { wch: 28 }, // Institution
        { wch: 14 }, // City
        { wch: 16 }, // State
        { wch: 22 }, // Branch
        { wch: 16 }, // Roll
        { wch: 18 }, // Role
        { wch: 12 }, // Overall Rating
        { wch: 12 }, // Trainer Rating
        { wch: 12 }, // Practical Rating
        { wch: 12 }, // Industry Rating
        { wch: 12 }, // Lab Rating
        { wch: 40 }, // Learnings
        { wch: 30 }, // Favorite
        { wch: 35 }, // Suggestions
        { wch: 30 }, // Interests
        { wch: 16 }, // Recommend
        { wch: 35 }, // Testimonial
        { wch: 20 }  // Submitted At
      ];

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Workshop Feedback');

      XLSX.writeFile(workbook, filename);
    } catch (err) {
      console.error('Excel export failure:', err);
      // Fallback to CSV
      this.exportToCsvFallback(submissions);
    }
  }

  // Fallback CSV generator
  private static exportToCsvFallback(submissions: WorkshopFeedbackSubmission[]): void {
    const headers = [
      'Feedback ID', 'Workshop Name', 'Date', 'Venue', 'Category',
      'Name', 'Email', 'Phone', 'Institution', 'City', 'Overall Rating',
      'Trainer Rating', 'Practical Kit Rating', 'Learnings', 'Suggestions', 'Recommend', 'Submitted At'
    ];

    const rows = submissions.map(sub => [
      `"${sub.id}"`,
      `"${sub.workshopName.replace(/"/g, '""')}"`,
      `"${sub.workshopDate}"`,
      `"${sub.workshopVenue.replace(/"/g, '""')}"`,
      `"${sub.participantCategory}"`,
      `"${sub.fullName.replace(/"/g, '""')}"`,
      `"${sub.email}"`,
      `"${sub.phone}"`,
      `"${sub.institutionName.replace(/"/g, '""')}"`,
      `"${sub.city}"`,
      sub.overallRating,
      sub.trainerKnowledgeRating,
      sub.practicalHardwareRating,
      `"${(sub.keyLearnings || '').replace(/"/g, '""')}"`,
      `"${(sub.improvementSuggestions || '').replace(/"/g, '""')}"`,
      `"${sub.recommendDakshyam}"`,
      `"${sub.submittedAt}"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Dakshyam_Workshop_Feedback_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // --- EXPORT TO PDF (.PDF) ---
  static exportToPdf(
    submissions: WorkshopFeedbackSubmission[],
    filterSummary = 'All Workshops & Categories',
    filename = 'Dakshyam_Workshop_Feedback_Report.pdf'
  ): void {
    try {
      const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
      const pageWidth = doc.internal.pageSize.getWidth();

      // Top Header Branding Bar
      doc.setFillColor(10, 25, 47); // Dark navy Dakshyam brand color #0a192f
      doc.rect(0, 0, pageWidth, 26, 'F');

      // Header Text
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.setTextColor(255, 255, 255);
      doc.text('DAKSHYAM INNOVATIONS', 14, 11);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(56, 189, 248); // Sky blue
      doc.text('OFFICIAL WORKSHOP EVALUATION & PARTICIPANT FEEDBACK AUDIT', 14, 17);

      doc.setFontSize(8);
      doc.setTextColor(203, 213, 225);
      const generatedDateStr = `Generated: ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}`;
      doc.text(generatedDateStr, pageWidth - 14, 17, { align: 'right' });

      // Statistical KPI Summary Row
      const totalCount = submissions.length;
      const avgOverall = totalCount > 0 ? (submissions.reduce((acc, s) => acc + s.overallRating, 0) / totalCount).toFixed(1) : '0.0';
      const avgTrainer = totalCount > 0 ? (submissions.reduce((acc, s) => acc + s.trainerKnowledgeRating, 0) / totalCount).toFixed(1) : '0.0';
      const avgKit = totalCount > 0 ? (submissions.reduce((acc, s) => acc + s.practicalHardwareRating, 0) / totalCount).toFixed(1) : '0.0';
      const recommendCount = submissions.filter(s => s.recommendDakshyam === 'Yes, Definitely' || s.recommendDakshyam === 'Likely').length;
      const npsPercent = totalCount > 0 ? Math.round((recommendCount / totalCount) * 100) : 0;

      doc.setFillColor(241, 245, 249); // light gray-blue
      doc.roundedRect(14, 31, pageWidth - 28, 18, 2, 2, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(15, 23, 42);
      doc.text(`Active Scope: ${filterSummary}`, 18, 38);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(51, 65, 85);
      const metricsLine = `Total Responses: ${totalCount}   |   Avg Overall Score: ${avgOverall}/5.0 ★   |   Trainer Clarity: ${avgTrainer}/5.0 ★   |   Hardware Kit Rating: ${avgKit}/5.0 ★   |   Recommendation: ${npsPercent}%`;
      doc.text(metricsLine, 18, 44);

      // Structured Data Table
      const startY = 54;
      const colWidths = [8, 34, 18, 30, 24, 38, 16, 16, 16, 44, 24];
      const colHeaders = [
        '#',
        'Participant Name',
        'Category',
        'Workshop Program',
        'City / Location',
        'Institution / College / School',
        'Overall',
        'Trainer',
        'Kit Exp',
        'Key Learnings & Feedback',
        'Date'
      ];

      // Draw table header
      let currentY = startY;
      doc.setFillColor(30, 41, 59); // Slate-800
      doc.rect(14, currentY, pageWidth - 28, 7, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(255, 255, 255);

      let curX = 16;
      colHeaders.forEach((h, i) => {
        doc.text(h, curX, currentY + 4.8);
        curX += colWidths[i];
      });

      currentY += 7;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);

      submissions.slice(0, 28).forEach((sub, idx) => {
        const rowHeight = 7.5;
        if (currentY + rowHeight > doc.internal.pageSize.getHeight() - 14) {
          doc.addPage();
          currentY = 20;
          // Re-draw table header on new page
          doc.setFillColor(30, 41, 59);
          doc.rect(14, currentY, pageWidth - 28, 7, 'F');
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(7.5);
          doc.setTextColor(255, 255, 255);
          let hX = 16;
          colHeaders.forEach((h, i) => {
            doc.text(h, hX, currentY + 4.8);
            hX += colWidths[i];
          });
          currentY += 7;
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(7);
        }

        // Alternating row background
        if (idx % 2 === 1) {
          doc.setFillColor(248, 250, 252);
          doc.rect(14, currentY, pageWidth - 28, rowHeight, 'F');
        }

        // Cell texts
        doc.setTextColor(30, 41, 59);
        let xPos = 16;

        const truncate = (str: string, maxLen: number) => {
          if (!str) return '';
          return str.length > maxLen ? str.substring(0, maxLen - 2) + '..' : str;
        };

        const cellValues = [
          String(idx + 1),
          truncate(sub.fullName, 20),
          sub.participantCategory.toUpperCase(),
          truncate(sub.workshopName, 18),
          truncate(sub.city, 14),
          truncate(sub.institutionName, 24),
          `${sub.overallRating} / 5`,
          `${sub.trainerKnowledgeRating} / 5`,
          `${sub.practicalHardwareRating} / 5`,
          truncate(sub.keyLearnings || sub.favoriteComponent || 'N/A', 30),
          sub.workshopDate || sub.submittedAt.slice(0, 10)
        ];

        cellValues.forEach((val, i) => {
          doc.text(val, xPos, currentY + 4.8);
          xPos += colWidths[i];
        });

        currentY += rowHeight;
      });

      // Footer
      const totalPages = (doc as any).internal.getNumberOfPages();
      for (let p = 1; p <= totalPages; p++) {
        doc.setPage(p);
        doc.setFontSize(6.5);
        doc.setTextColor(148, 163, 184);
        doc.text(
          `Dakshyam Innovations Pvt. Ltd. | Confidential Academic Workshop Audit Report | Page ${p} of ${totalPages}`,
          pageWidth / 2,
          doc.internal.pageSize.getHeight() - 6,
          { align: 'center' }
        );
      }

      doc.save(filename);
    } catch (err) {
      console.error('PDF generation error:', err);
    }
  }
}
