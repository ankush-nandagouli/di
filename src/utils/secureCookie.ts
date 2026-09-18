/**
 * Secure Cookie & Resilient Storage Engine
 * 
 * Provides hardened cookie management with SameSite, Secure, and strict expiration rules.
 * Automatically synchronizes with localStorage to ensure seamless session continuity
 * across privacy-first browsers (Brave Shields, Microsoft Edge Tracking Prevention,
 * Safari ITP, and Firefox Enhanced Tracking Protection).
 */

export interface CookieOptions {
  days?: number;
  path?: string;
  sameSite?: 'Lax' | 'Strict' | 'None';
  secure?: boolean;
}

/**
 * Checks if the current connection is running over HTTPS or production
 */
export const isSecureContext = (): boolean => {
  if (typeof window === 'undefined') return false;
  return window.location.protocol === 'https:' || window.location.hostname !== 'localhost';
};

/**
 * Sets a hardened cookie with modern browser security attributes
 */
export const setSecureCookie = (
  name: string,
  value: string,
  options: CookieOptions = {}
): void => {
  if (typeof document === 'undefined') return;

  const {
    days = 30,
    path = '/',
    sameSite = 'Lax',
    secure = isSecureContext()
  } = options;

  let expires = '';
  if (days) {
    const date = new Date();
    date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
    expires = `; expires=${date.toUTCString()}`;
  }

  const encodedValue = encodeURIComponent(value);
  const secureFlag = secure ? '; Secure' : '';
  const sameSiteFlag = `; SameSite=${sameSite}`;

  document.cookie = `${encodeURIComponent(name)}=${encodedValue}${expires}; path=${path}${sameSiteFlag}${secureFlag}`;
};

/**
 * Reads a cookie securely by name
 */
export const getSecureCookie = (name: string): string | null => {
  if (typeof document === 'undefined') return null;

  const target = `${encodeURIComponent(name)}=`;
  const cookies = document.cookie.split(';');

  for (let i = 0; i < cookies.length; i++) {
    let c = cookies[i].trim();
    if (c.indexOf(target) === 0) {
      try {
        return decodeURIComponent(c.substring(target.length));
      } catch {
        return c.substring(target.length);
      }
    }
  }
  return null;
};

/**
 * Deletes a cookie by setting its expiration to the past
 */
export const deleteSecureCookie = (name: string, path: string = '/'): void => {
  if (typeof document === 'undefined') return;
  const secureFlag = isSecureContext() ? '; Secure' : '';
  document.cookie = `${encodeURIComponent(name)}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path}; SameSite=Lax${secureFlag}`;
};

/**
 * Synchronizes vital keys between localStorage and Secure Cookies.
 * If privacy shields in Brave or Edge flush one layer, the other layer immediately
 * restores state without dropping the user session.
 */
const VITAL_SYNC_KEYS = [
  'dakshyam_theme',
  'dakshyam_admin_token',
  'dakshyam_supervisor_pin',
  'dakshyam_cookie_consent'
];

export const syncStorageWithCookies = (): void => {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') return;

  try {
    VITAL_SYNC_KEYS.forEach(key => {
      const cookieVal = getSecureCookie(key);
      const localVal = localStorage.getItem(key);

      if (localVal && !cookieVal) {
        // Hydrate cookie from localStorage
        setSecureCookie(key, localVal, { days: 60 });
      } else if (cookieVal && !localVal) {
        // Hydrate localStorage from cookie
        localStorage.setItem(key, cookieVal);
      }
    });
  } catch (err) {
    console.warn('[Dakshyam Storage Sync] Non-critical sync warning:', err);
  }
};

/**
 * Resilient getter that consults localStorage first, then Secure Cookies
 */
export const getResilientStorageItem = (key: string): string | null => {
  if (typeof window === 'undefined') return null;
  try {
    const localVal = localStorage.getItem(key);
    if (localVal !== null && localVal !== '') return localVal;
  } catch {
    // localStorage restricted by browser policy
  }
  return getSecureCookie(key);
};

/**
 * Resilient setter that writes to both localStorage and Secure Cookies simultaneously
 */
export const setResilientStorageItem = (key: string, value: string, days: number = 60): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, value);
  } catch {
    // localStorage restricted by browser policy
  }
  setSecureCookie(key, value, { days });
};

/**
 * Resilient remover that clears both localStorage and Secure Cookies
 */
export const removeResilientStorageItem = (key: string): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(key);
  } catch {
    // localStorage restricted
  }
  deleteSecureCookie(key);
};
