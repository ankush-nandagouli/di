/**
 * IndexedDB storage utility for large animated video files (bypasses localStorage 5MB limit)
 */

const DB_NAME = 'dakshyam_media_storage';
const STORE_NAME = 'app_videos';
const DB_VERSION = 1;

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return reject(new Error('IndexedDB not supported in this browser'));
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = (event) => {
      resolve((event.target as IDBOpenDBRequest).result);
    };

    request.onerror = (event) => {
      reject((event.target as IDBOpenDBRequest).error);
    };
  });
}

export async function storeVideoBlob(key: string, blob: Blob): Promise<void> {
  try {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const req = store.put(blob, key);

      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('Failed to store video in IndexedDB:', err);
  }
}

export async function getVideoBlob(key: string): Promise<Blob | null> {
  try {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const req = store.get(key);

      req.onsuccess = () => {
        resolve(req.result || null);
      };
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('Failed to get video from IndexedDB:', err);
    return null;
  }
}

export async function deleteVideoBlob(key: string): Promise<void> {
  try {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const req = store.delete(key);

      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('Failed to delete video from IndexedDB:', err);
  }
}

// Active in-memory Object URL cache to avoid redundant createObjectURL calls
let cachedObjectUrl: string | null = null;
let cachedSourceUrl: string | null = null;

/**
 * Cache an external or uploaded video URL into IndexedDB for instant, smooth playback
 * Returns an Object URL for local cached playback, or the original URL if caching fails
 */
export async function cacheVideoFromUrl(
  url: string, 
  key = 'page_loader_video'
): Promise<string> {
  if (!url || url.trim() === '') return '';

  const cleanUrl = url.trim();

  // If already an object URL or data URL, return directly
  if (cleanUrl.startsWith('blob:') || cleanUrl.startsWith('data:')) {
    return cleanUrl;
  }

  // Check if our active in-memory object URL matches
  if (cachedObjectUrl && cachedSourceUrl === cleanUrl) {
    return cachedObjectUrl;
  }

  try {
    // Check if we already cached this specific source URL in IndexedDB
    const lastCachedUrl = localStorage.getItem(`dakshyam_cached_vid_${key}`);
    if (lastCachedUrl === cleanUrl) {
      const existingBlob = await getVideoBlob(key);
      if (existingBlob && existingBlob.size > 0) {
        if (cachedObjectUrl) {
          try { URL.revokeObjectURL(cachedObjectUrl); } catch {}
        }
        cachedObjectUrl = URL.createObjectURL(existingBlob);
        cachedSourceUrl = cleanUrl;
        return cachedObjectUrl;
      }
    }

    // Otherwise fetch the remote video stream and cache as blob
    const response = await fetch(cleanUrl, { mode: 'cors' });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status} when fetching video for cache`);
    }

    const blob = await response.blob();
    if (blob.size > 0) {
      await storeVideoBlob(key, blob);
      localStorage.setItem(`dakshyam_cached_vid_${key}`, cleanUrl);

      if (cachedObjectUrl) {
        try { URL.revokeObjectURL(cachedObjectUrl); } catch {}
      }
      cachedObjectUrl = URL.createObjectURL(blob);
      cachedSourceUrl = cleanUrl;
      return cachedObjectUrl;
    }
  } catch (err) {
    console.warn('Could not cache video blob (falling back to direct streaming URL):', err);
  }

  return cleanUrl;
}

/**
 * Quickly retrieve existing cached Object URL if available
 */
export async function getCachedVideoObjectUrl(
  key = 'page_loader_video',
  expectedUrl?: string
): Promise<string | null> {
  try {
    const lastCachedUrl = localStorage.getItem(`dakshyam_cached_vid_${key}`);
    if (expectedUrl && lastCachedUrl !== expectedUrl) {
      return null;
    }

    if (cachedObjectUrl && (!expectedUrl || cachedSourceUrl === expectedUrl)) {
      return cachedObjectUrl;
    }

    const blob = await getVideoBlob(key);
    if (blob && blob.size > 0) {
      if (cachedObjectUrl) {
        try { URL.revokeObjectURL(cachedObjectUrl); } catch {}
      }
      cachedObjectUrl = URL.createObjectURL(blob);
      cachedSourceUrl = lastCachedUrl || expectedUrl || null;
      return cachedObjectUrl;
    }
  } catch (err) {
    console.warn('Error reading cached video blob URL:', err);
  }
  return null;
}

/**
 * Clear cached video and revoke active blob URL
 */
export async function clearVideoCache(key = 'page_loader_video'): Promise<void> {
  if (cachedObjectUrl) {
    try { URL.revokeObjectURL(cachedObjectUrl); } catch {}
    cachedObjectUrl = null;
    cachedSourceUrl = null;
  }
  try {
    localStorage.removeItem(`dakshyam_cached_vid_${key}`);
    await deleteVideoBlob(key);
  } catch (err) {
    console.warn('Error clearing video cache:', err);
  }
}
