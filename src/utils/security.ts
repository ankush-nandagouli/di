/**
 * Dakshyam Innovations Enterprise Security Guard
 * 
 * Enforces client-side protection:
 * - Restricts unauthorized right-click (context menu) except within form text controls
 * - Restricts developer inspection keyboard shortcuts (F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C, Ctrl+U, Ctrl+S)
 * - Restricts image asset dragging to protect proprietary graphics & certificates
 * - Emits security notifications for user feedback
 * - Displays enterprise console security warning banners
 * - Detects active devtools inspection
 */

export type SecurityViolationType = 
  | 'RIGHT_CLICK' 
  | 'DEVTOOLS_SHORTCUT' 
  | 'SOURCE_VIEW' 
  | 'SAVE_PAGE' 
  | 'DEVTOOLS_ACTIVE'
  | 'IMAGE_DRAG';

export interface SecurityEventDetail {
  type: SecurityViolationType;
  message: string;
  timestamp: number;
}

type SecurityListener = (event: SecurityEventDetail) => void;

class SecurityGuardService {
  private isInitialized = false;
  private listeners: Set<SecurityListener> = new Set();
  private lastNotificationTime = 0;
  private notificationCooldownMs = 1500;
  private devtoolsWarningLogged = false;
  private isBypassed = false;

  public init(): void {
    if (this.isInitialized || typeof window === 'undefined') return;
    this.isInitialized = true;

    // Check if security bypass flag is set in sessionStorage
    try {
      if (sessionStorage.getItem('dakshyam_security_bypass') === 'true') {
        this.isBypassed = true;
      }
    } catch {
      // Storage restricted
    }

    this.attachContextMenuListener();
    this.attachKeyboardListener();
    this.attachDragListener();
    this.logConsoleSecurityBanner();
    this.startDevToolsMonitor();
  }

  public subscribe(listener: SecurityListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  public notifyViolation(type: SecurityViolationType, message: string): void {
    const now = Date.now();
    if (now - this.lastNotificationTime < this.notificationCooldownMs) {
      return;
    }
    this.lastNotificationTime = now;

    const detail: SecurityEventDetail = {
      type,
      message,
      timestamp: now
    };

    this.listeners.forEach(fn => {
      try {
        fn(detail);
      } catch (err) {
        console.warn('Error in security listener:', err);
      }
    });
  }

  public setBypass(bypass: boolean): void {
    this.isBypassed = bypass;
    try {
      if (bypass) {
        sessionStorage.setItem('dakshyam_security_bypass', 'true');
      } else {
        sessionStorage.removeItem('dakshyam_security_bypass');
      }
    } catch {}
  }

  public getIsBypassed(): boolean {
    return this.isBypassed;
  }

  /**
   * Prevents right-click unless targeted at an editable input or textarea
   */
  private attachContextMenuListener(): void {
    window.addEventListener('contextmenu', (e: MouseEvent) => {
      if (this.isBypassed) return;

      const target = e.target as HTMLElement | null;
      if (!target) return;

      // Allow natural right-click for text input, textarea, and contenteditable elements
      const isInput = target.tagName === 'INPUT' || 
                      target.tagName === 'TEXTAREA' || 
                      target.isContentEditable ||
                      target.closest('input') ||
                      target.closest('textarea') ||
                      target.closest('[contenteditable="true"]') ||
                      target.getAttribute('data-allow-context') === 'true';

      if (!isInput) {
        e.preventDefault();
        this.notifyViolation(
          'RIGHT_CLICK',
          'Right-click context menu is restricted for intellectual property protection.'
        );
      }
    }, { capture: true });
  }

  /**
   * Blocks shortcut combinations that open devtools or rip source code
   */
  private attachKeyboardListener(): void {
    window.addEventListener('keydown', (e: KeyboardEvent) => {
      if (this.isBypassed) return;

      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const cmdOrCtrl = isMac ? e.metaKey : e.ctrlKey;
      const key = e.key.toUpperCase();
      const code = e.code;

      // 1. F12 key (Inspect / DevTools)
      if (key === 'F12' || code === 'F12') {
        e.preventDefault();
        e.stopPropagation();
        this.notifyViolation('DEVTOOLS_SHORTCUT', 'Developer Inspection Tools (F12) are restricted.');
        return false;
      }

      // 2. Ctrl+Shift+I or Cmd+Option+I (DevTools Inspect)
      if ((cmdOrCtrl && e.shiftKey && (key === 'I' || code === 'KeyI')) || 
          (isMac && e.metaKey && e.altKey && (key === 'I' || code === 'KeyI'))) {
        e.preventDefault();
        e.stopPropagation();
        this.notifyViolation('DEVTOOLS_SHORTCUT', 'Developer Inspection shortcut is restricted.');
        return false;
      }

      // 3. Ctrl+Shift+J or Cmd+Option+J (Console)
      if ((cmdOrCtrl && e.shiftKey && (key === 'J' || code === 'KeyJ')) ||
          (isMac && e.metaKey && e.altKey && (key === 'J' || code === 'KeyJ'))) {
        e.preventDefault();
        e.stopPropagation();
        this.notifyViolation('DEVTOOLS_SHORTCUT', 'Developer Console shortcut is restricted.');
        return false;
      }

      // 4. Ctrl+Shift+C or Cmd+Option+C (Inspect Element)
      if ((cmdOrCtrl && e.shiftKey && (key === 'C' || code === 'KeyC')) ||
          (isMac && e.metaKey && e.altKey && (key === 'C' || code === 'KeyC'))) {
        // Only block if not focused on text input selecting
        const target = e.target as HTMLElement | null;
        const isEditing = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA');
        if (!isEditing) {
          e.preventDefault();
          e.stopPropagation();
          this.notifyViolation('DEVTOOLS_SHORTCUT', 'Element Inspector shortcut is restricted.');
          return false;
        }
      }

      // 5. Ctrl+U or Cmd+Option+U (View Page Source)
      if ((cmdOrCtrl && (key === 'U' || code === 'KeyU')) ||
          (isMac && e.metaKey && e.altKey && (key === 'U' || code === 'KeyU'))) {
        e.preventDefault();
        e.stopPropagation();
        this.notifyViolation('SOURCE_VIEW', 'Viewing page raw source code is restricted.');
        return false;
      }

      // 6. Ctrl+S or Cmd+S (Save HTML page to disk)
      if (cmdOrCtrl && (key === 'S' || code === 'KeyS')) {
        e.preventDefault();
        e.stopPropagation();
        this.notifyViolation('SAVE_PAGE', 'Saving offline page copies is restricted.');
        return false;
      }
    }, { capture: true });
  }

  /**
   * Restricts dragging images to prevent easy asset download
   */
  private attachDragListener(): void {
    window.addEventListener('dragstart', (e: DragEvent) => {
      if (this.isBypassed) return;
      const target = e.target as HTMLElement | null;
      if (target && target.tagName === 'IMG') {
        const allowDrag = target.getAttribute('data-allow-drag');
        if (!allowDrag) {
          e.preventDefault();
        }
      }
    }, { capture: true });
  }

  /**
   * Outputs a warning banner in the developer console
   */
  private logConsoleSecurityBanner(): void {
    if (this.devtoolsWarningLogged || typeof console === 'undefined') return;
    this.devtoolsWarningLogged = true;

    try {
      console.log(
        '%c DAKSHYAM INNOVATIONS %c ENTERPRISE SECURITY ACTIVE ',
        'background: #0f172a; color: #38bdf8; font-size: 14px; font-weight: bold; padding: 4px 8px; border-radius: 4px 0 0 4px;',
        'background: #dc2626; color: white; font-size: 14px; font-weight: bold; padding: 4px 8px; border-radius: 0 4px 4px 0;'
      );
      console.log(
        '%cSTOP! This browser feature is intended for authorized platform maintainers only.\nAttempting to reverse-engineer, scrape protected assets, or paste unauthorized scripts is strictly prohibited under Dakshyam Intellectual Property & Security Policy.',
        'color: #e2e8f0; font-size: 12px; line-height: 1.6; font-family: monospace;'
      );
    } catch {
      // Ignored in restricted environments
    }
  }

  /**
   * Periodically checks for docked devtools window dimension variances
   */
  private startDevToolsMonitor(): void {
    if (typeof window === 'undefined') return;

    let devtoolsDetected = false;
    const checkThreshold = () => {
      if (this.isBypassed) return;
      const widthThreshold = window.outerWidth - window.innerWidth > 160;
      const heightThreshold = window.outerHeight - window.innerHeight > 160;

      if ((widthThreshold || heightThreshold) && !devtoolsDetected) {
        devtoolsDetected = true;
        this.notifyViolation(
          'DEVTOOLS_ACTIVE',
          'Developer inspection tools detected. Please close DevTools to maintain security compliance.'
        );
      } else if (!widthThreshold && !heightThreshold) {
        devtoolsDetected = false;
      }
    };

    // Check periodically without creating excessive performance overhead
    setInterval(checkThreshold, 3000);
  }
}

export const SecurityGuard = new SecurityGuardService();
