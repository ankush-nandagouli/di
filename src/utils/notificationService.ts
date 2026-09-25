import { db } from './firebase';
import { 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  limit 
} from 'firebase/firestore';
import { AppNotification, UserType, NotificationTargetRole, NotificationCategory, NotificationPriority } from '../types';

const LOCAL_STORAGE_NOTIFS_KEY = 'dakshyam_app_notifications';
const LOCAL_STORAGE_READ_NOTIFS_KEY = 'dakshyam_read_notification_ids';

const INITIAL_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'notif-welcome-2026',
    title: 'Welcome to Dakshyam Innovations Portal',
    message: 'Explore our NEP 2020 aligned physical-digital technical labs, Industrial IoT bootcamps, and robotics certifications.',
    timestamp: new Date().toISOString(),
    targetRole: 'public',
    category: 'system',
    priority: 'normal',
    linkTab: 'home'
  },
  {
    id: 'notif-workshop-feedback-open',
    title: 'Workshop Feedback Forms Active',
    message: 'Participant feedback submission portals and automated QR share links are now live for all active bootcamps.',
    timestamp: new Date().toISOString(),
    targetRole: 'all',
    category: 'workshop',
    priority: 'normal',
    linkTab: 'feedback'
  },
  {
    id: 'notif-admin-security-active',
    title: 'Security Suite Active & Guarding Portal',
    message: 'Developer tools blocking, right-click restrictions, and resilient cross-browser cookie policies are fully enforced.',
    timestamp: new Date().toISOString(),
    targetRole: 'admin',
    category: 'security',
    priority: 'high',
    linkTab: 'portal'
  },
  {
    id: 'notif-trainer-activation-info',
    title: 'Trainer Instant Passcode Ready',
    message: 'New instructors can register and activate their teaching workspace using the invitation code provided by administration.',
    timestamp: new Date().toISOString(),
    targetRole: 'trainer',
    category: 'system',
    priority: 'normal',
    linkTab: 'portal'
  }
];

export class NotificationService {
  private static subscribers: Array<(notifications: AppNotification[]) => void> = [];
  private static cachedNotifications: AppNotification[] = [];
  private static unsubscribeFirestore: (() => void) | null = null;
  private static isInitialized = false;

  // Initialize service & real-time Firestore listener
  public static init() {
    if (this.isInitialized) return;
    this.isInitialized = true;

    // 1. Load from localStorage first for immediate rendering
    this.cachedNotifications = this.getLocalNotifications();

    // 2. Set up Firestore Real-time listener
    try {
      const notifsCol = collection(db, 'notifications');
      const q = query(notifsCol, orderBy('timestamp', 'desc'), limit(50));

      this.unsubscribeFirestore = onSnapshot(q, (snapshot) => {
        const remoteList: AppNotification[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data() as AppNotification;
          remoteList.push({ ...data, id: docSnap.id });
        });

        if (remoteList.length > 0) {
          this.mergeAndSaveNotifications(remoteList);
        }
      }, (err) => {
        console.warn('Firestore notifications real-time listener notice:', err);
      });
    } catch (err) {
      console.warn('Failed to initialize Firestore notification listener:', err);
    }
  }

  // Get local notifications merged with read states
  private static getLocalNotifications(): AppNotification[] {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_NOTIFS_KEY);
      const list: AppNotification[] = stored ? JSON.parse(stored) : INITIAL_NOTIFICATIONS;
      const readIds = this.getReadNotificationIds();

      return list.map(n => ({
        ...n,
        isRead: n.isRead || readIds.includes(n.id)
      }));
    } catch {
      return INITIAL_NOTIFICATIONS;
    }
  }

  private static getReadNotificationIds(): string[] {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_READ_NOTIFS_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  private static markNotificationIdAsReadLocal(id: string) {
    try {
      const readIds = this.getReadNotificationIds();
      if (!readIds.includes(id)) {
        readIds.push(id);
        localStorage.setItem(LOCAL_STORAGE_READ_NOTIFS_KEY, JSON.stringify(readIds));
      }
    } catch {}
  }

  // Merge remote and local notifications
  private static mergeAndSaveNotifications(incoming: AppNotification[]) {
    const readIds = this.getReadNotificationIds();
    const existingMap = new Map<string, AppNotification>();

    // Seed defaults
    INITIAL_NOTIFICATIONS.forEach(n => existingMap.set(n.id, n));
    // Seed cached
    this.cachedNotifications.forEach(n => existingMap.set(n.id, n));
    // Merge incoming
    incoming.forEach(n => existingMap.set(n.id, n));

    const merged = Array.from(existingMap.values())
      .map(n => ({
        ...n,
        isRead: n.isRead || readIds.includes(n.id)
      }))
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    this.cachedNotifications = merged;
    try {
      localStorage.setItem(LOCAL_STORAGE_NOTIFS_KEY, JSON.stringify(merged));
    } catch {}

    this.notifySubscribers();
  }

  // CRITICAL ROLE SEGREGATION: Returns ONLY notifications permitted for the given user
  public static getNotificationsForUser(user: UserType | null): AppNotification[] {
    const all = this.cachedNotifications.length > 0 ? this.cachedNotifications : this.getLocalNotifications();
    const readIds = this.getReadNotificationIds();

    return all.filter(n => {
      const isRead = n.isRead || readIds.includes(n.id);
      n.isRead = isRead;

      // 1. If notification is public or for all, everyone can see it
      if (n.targetRole === 'public' || n.targetRole === 'all') {
        return true;
      }

      // 2. If user is not logged in, they CANNOT see internal role-based notifications
      if (!user) {
        return false;
      }

      // 3. Admin can see all notifications including sensitive system and security alerts
      if (user.role === 'admin') {
        return true;
      }

      // 4. Trainer can see trainer and student notifications (unless student has a specific private targetUserId)
      if (user.role === 'trainer') {
        if (n.targetRole === 'trainer') return true;
        if (n.targetRole === 'student' && !n.targetUserId) return true;
        return false;
      }

      // 5. Student can ONLY see student notifications meant for all students OR specifically for their ID
      if (user.role === 'student') {
        if (n.targetRole === 'student') {
          if (!n.targetUserId) return true;
          return n.targetUserId === user.id;
        }
        return false;
      }

      return false;
    });
  }

  // Count unread notifications strictly for the user's role
  public static getUnreadCount(user: UserType | null): number {
    const list = this.getNotificationsForUser(user);
    return list.filter(n => !n.isRead).length;
  }

  // Mark single notification as read
  public static markAsRead(id: string) {
    this.markNotificationIdAsReadLocal(id);
    this.cachedNotifications = this.cachedNotifications.map(n => 
      n.id === id ? { ...n, isRead: true } : n
    );
    try {
      localStorage.setItem(LOCAL_STORAGE_NOTIFS_KEY, JSON.stringify(this.cachedNotifications));
    } catch {}
    this.notifySubscribers();
  }

  // Mark all notifications for this user as read
  public static markAllAsRead(user: UserType | null) {
    const userNotifs = this.getNotificationsForUser(user);
    userNotifs.forEach(n => this.markNotificationIdAsReadLocal(n.id));

    const readIds = this.getReadNotificationIds();
    this.cachedNotifications = this.cachedNotifications.map(n => ({
      ...n,
      isRead: readIds.includes(n.id) || n.isRead
    }));

    try {
      localStorage.setItem(LOCAL_STORAGE_NOTIFS_KEY, JSON.stringify(this.cachedNotifications));
    } catch {}
    this.notifySubscribers();
  }

  // Dispatch a new notification (dispatched to Firestore and cached locally)
  public static async dispatchNotification(notif: {
    title: string;
    message: string;
    targetRole: NotificationTargetRole;
    targetUserId?: string;
    category: NotificationCategory;
    priority?: NotificationPriority;
    linkTab?: 'home' | 'services' | 'leaderboard' | 'social' | 'portal' | 'verification' | 'about' | 'contact' | 'feedback';
    actionData?: Record<string, any>;
  }): Promise<AppNotification> {
    const newId = `notif-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const fullNotification: AppNotification = {
      id: newId,
      title: notif.title,
      message: notif.message,
      timestamp: new Date().toISOString(),
      targetRole: notif.targetRole,
      targetUserId: notif.targetUserId,
      category: notif.category,
      priority: notif.priority || 'normal',
      isRead: false,
      linkTab: notif.linkTab,
      actionData: notif.actionData
    };

    // Save locally
    this.cachedNotifications = [fullNotification, ...this.cachedNotifications];
    try {
      localStorage.setItem(LOCAL_STORAGE_NOTIFS_KEY, JSON.stringify(this.cachedNotifications));
    } catch {}
    this.notifySubscribers();

    // Push to Firestore
    try {
      const docRef = doc(db, 'notifications', newId);
      await setDoc(docRef, fullNotification);
    } catch (err) {
      console.warn('Could not persist notification to Firestore:', err);
    }

    return fullNotification;
  }

  // Remove a notification (Admin only)
  public static async deleteNotification(id: string): Promise<boolean> {
    this.cachedNotifications = this.cachedNotifications.filter(n => n.id !== id);
    try {
      localStorage.setItem(LOCAL_STORAGE_NOTIFS_KEY, JSON.stringify(this.cachedNotifications));
    } catch {}
    this.notifySubscribers();

    try {
      const docRef = doc(db, 'notifications', id);
      await deleteDoc(docRef);
      return true;
    } catch (err) {
      console.warn('Could not delete notification from Firestore:', err);
      return false;
    }
  }

  // Subscribe to changes in notifications
  public static subscribe(callback: (notifications: AppNotification[]) => void): () => void {
    this.subscribers.push(callback);
    callback(this.cachedNotifications);
    return () => {
      this.subscribers = this.subscribers.filter(sub => sub !== callback);
    };
  }

  private static notifySubscribers() {
    this.subscribers.forEach(sub => {
      try {
        sub(this.cachedNotifications);
      } catch (err) {
        console.error('Notification subscriber error:', err);
      }
    });
  }
}
