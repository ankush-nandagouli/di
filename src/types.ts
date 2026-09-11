export type NavSection = 'home' | 'portal' | 'services' | 'verification' | 'dashboard';
export type UserRole = 'admin' | 'trainer' | 'student';

export interface UserProfile {
  phone?: string;
  institution?: string; // School or College
  gradeOrBranch?: string;
  address?: string;
}

export interface StudentUser {
  id: string;
  name: string;
  email: string;
  role: 'student';
  password?: string;
  profile?: UserProfile;
  groupId?: string | null;
  createdAt: string;
}

export interface TrainerProfile {
  phone?: string;
  qualification?: string;
  specialization?: string;
  experienceYears?: string;
  institution?: string;
  bio?: string;
}

export interface TrainerUser {
  id: string;
  name: string;
  email: string;
  role: 'trainer';
  isApproved: boolean; // Must be approved by Admin first
  createdAt: string;
  password?: string;
  profile?: TrainerProfile;
}

export interface PromoBanner {
  id: string;
  title: string;
  subtitle: string;
  imageUrl: string;
  actionUrl?: string;
  isActive: boolean;
  createdAt: string;
}

export interface GalleryImage {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  category: 'school_programs' | 'iot_robotics' | 'mern_web' | 'lab_setups';
  createdAt: string;
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: 'admin';
  createdAt: string;
}

export type UserType = StudentUser | TrainerUser | AdminUser;

export interface StudentGroup {
  id: string;
  name: string;
  projectTitle: string;
  projectDescription: string;
  videoUrl?: string; // Optional student uploaded video exhibition link/ID
  memberIds: string[]; // List of Student IDs
  points: number;
  trainerId: string; // Trainer who created the group
  createdAt: string;
}

export interface Course {
  id: string;
  title: string;
  duration: string;
  description: string;
  tags: string[];
  features: string[];
  mobileHardwareIncluded?: boolean;
}

export interface CourseApplication {
  id: string;
  studentId?: string; // If registered while logged in
  fullName: string;
  email: string;
  phone: string;
  institution: string; // school/college
  courseId: string;
  appliedAt: string;
  status: 'pending' | 'approved' | 'rejected';
}

export interface Certificate {
  id: string; // Unique Certificate ID (e.g. DKM-2026-X82F)
  studentName: string;
  studentEmail: string;
  courseTitle: string;
  projectTitle: string;
  issueDate: string;
  trainerId: string;
  trainerName: string;
  customLogoUrl?: string;
  customSealUrl?: string;
  trainingPartnerName?: string;
  trainingPartnerLogoUrl?: string;
}

export interface VideoPost {
  id: string;
  groupId: string;
  groupName: string;
  title: string;
  description: string;
  videoUrl: string; // URL of the video or image hosted in Cloudinary or fallback focus track ID
  mediaType?: 'video' | 'image'; // Decides whether it's a demonstration video or a photographic showcase
  likes: number;
  likedByUserIds: string[];
  views: number;
  comments: Array<{
    id: string;
    senderName: string;
    text: string;
    timestamp: string;
  }>;
  createdAt: string;
}

export interface CountdownTime {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export interface SpecialTrainingProgram {
  id: string;
  trainingName: string;
  duration: string;
  startingDateTime: string; // e.g. "2026-06-30T10:00"
  institutionName: string; // specific school or college name
  createdAt: string;
}

export interface CompanyFounder {
  name: string;
  role: string;
  bio: string;
  avatarText?: string;
}

export interface CompanyAbout {
  companyName: string;
  description: string;
  mission: string;
  vision: string;
  officeLocation: string;
  socialGithub: string;
  socialLinkedin: string;
  socialTwitter: string;
  socialYoutube: string;
  founders: CompanyFounder[];
}

export interface SpecialProgramEnrollment {
  id: string;
  programId: string;
  trainingName: string;
  institutionName: string;
  name: string;
  branch: string;
  yearOfStudy: string;
  fathersName: string;
  email: string;
  rollNumber: string;
  mobileNumber: string;
  enrolledAt: string;
}

export interface AppLog {
  id: string;
  timestamp: string;
  action: string;
  details: string;
  userEmail: string;
  role: string;
  status: 'SUCCESS' | 'ERROR' | 'INFO';
}

export interface PageLoaderConfig {
  enabled: boolean;
  videoUrl: string; // Remote URL, Cloudinary URL, or blob reference
  mediaType: 'video' | 'gif' | 'auto';
  showOnTabChange: boolean;
  minDurationMs: number; // e.g. 800 - 2500ms
  title: string;
  subtitle: string;
  overlayTheme: 'dark' | 'glass' | 'adaptive';
  soundEnabled: boolean;
  showProgress: boolean;
  videoFit: 'contain' | 'cover';
  updatedAt?: string;
}

// Workshop Feedback System Types
export type ParticipantCategory = 'student' | 'school' | 'college' | 'other';

export interface WorkshopItem {
  id: string;
  name: string;
  date: string;
  venue: string;
  trainerName?: string;
  description?: string;
  isActive: boolean;
}

export interface CustomFeedbackQuestion {
  id: string;
  label: string;
  type: 'text' | 'rating' | 'choice' | 'yesno';
  required: boolean;
  options?: string[];
}

export interface WorkshopFeedbackConfig {
  id: string;
  formTitle: string;
  formSubtitle: string;
  isOpen: boolean;
  workshops: WorkshopItem[];
  customQuestions: CustomFeedbackQuestion[];
  updatedAt: string;
}

export interface WorkshopFeedbackSubmission {
  id: string;
  workshopId: string;
  workshopName: string;
  workshopDate: string;
  workshopVenue: string;
  participantCategory: ParticipantCategory;
  fullName: string;
  email: string;
  phone: string;
  institutionName: string;
  city: string;
  state: string;
  branchOrGrade?: string;
  rollOrEmployeeId?: string;
  designationOrRole?: string;
  overallRating: number;
  trainerKnowledgeRating: number;
  practicalHardwareRating: number;
  industryRelevanceRating: number;
  labManagementRating: number;
  keyLearnings: string;
  favoriteComponent: string;
  improvementSuggestions: string;
  futureInterests: string[];
  recommendDakshyam: 'Yes, Definitely' | 'Likely' | 'Uncertain' | 'No';
  testimonial?: string;
  customAnswers?: Record<string, any>;
  submittedAt: string;
}



