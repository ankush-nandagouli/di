/**
 * IndexedDB storage for 3D model files (supports large .obj meshes without 5MB localStorage limits)
 */

import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { db } from './firebase';

export interface ModelDisplaySettings {
  scale: number; // Multiplier on auto-normalized geometry (0.1x to 4.0x)
  rotationX: number; // Degrees (-180 to 180, e.g. -90 to fix Z-up CAD exports)
  rotationY: number;
  rotationZ: number;
  offsetY: number; // Vertical position adjustment (-5 to 5)
  style: 'metallic' | 'clay' | 'hologram' | 'chrome' | 'normals';
  materialColor: string; // Hex color string
  roughness: number; // 0 to 1
  metalness: number; // 0 to 1
  wireframe: boolean;
  autoRotate: boolean;
  autoRotateSpeed: number; // 0.5 to 5.0
  autoRotateDirection: 1 | -1; // 1 clockwise, -1 counter-clockwise
  ambientLightIntensity: number; // 0.5 to 3.5
  headlightIntensity: number; // 0.5 to 4.0
  showGlow: boolean;
}

export const DEFAULT_MODEL_SETTINGS: ModelDisplaySettings = {
  scale: 1.0,
  rotationX: 0,
  rotationY: 0,
  rotationZ: 0,
  offsetY: 0,
  style: 'metallic',
  materialColor: '#38bdf8',
  roughness: 0.25,
  metalness: 0.75,
  wireframe: false,
  autoRotate: true,
  autoRotateSpeed: 2.0,
  autoRotateDirection: 1,
  ambientLightIntensity: 1.8,
  headlightIntensity: 2.5,
  showGlow: true
};

export interface StoredModelMetadata {
  id: string;
  name: string;
  size: number;
  format?: 'obj' | 'glb' | 'gltf';
  vertexCount?: number;
  faceCount?: number;
  updatedAt: string;
  settings?: ModelDisplaySettings;
  modelUrl?: string;
  // Deprecated backward-compat fields
  materialColor?: string;
  autoRotate?: boolean;
  wireframe?: boolean;
}

const DB_NAME = 'dakshyam_3d_storage';
const DB_VERSION = 1;
const OBJ_STORE = 'obj_files';
const META_STORE = 'model_metadata';

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return reject(new Error('IndexedDB not supported in this browser'));
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(OBJ_STORE)) {
        db.createObjectStore(OBJ_STORE);
      }
      if (!db.objectStoreNames.contains(META_STORE)) {
        db.createObjectStore(META_STORE);
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

/**
 * Store 3D model file (OBJ text or GLB ArrayBuffer) and its metadata in IndexedDB
 */
export async function save3DModel(
  key: string,
  modelData: string | ArrayBuffer,
  meta: StoredModelMetadata
): Promise<void> {
  try {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([OBJ_STORE, META_STORE], 'readwrite');
      const objStore = transaction.objectStore(OBJ_STORE);
      const metaStore = transaction.objectStore(META_STORE);

      objStore.put(modelData, key);
      metaStore.put(meta, key);

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  } catch (err) {
    console.error('Error saving 3D model:', err);
    throw err;
  }
}

/** Backward compatible alias */
export const saveObjModel = save3DModel;

/**
 * Retrieve 3D model data (OBJ text or GLB ArrayBuffer) and metadata from IndexedDB
 */
export async function loadObjModel(key: string): Promise<{
  objText: string | ArrayBuffer;
  meta: StoredModelMetadata;
} | null> {
  try {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([OBJ_STORE, META_STORE], 'readonly');
      const objStore = transaction.objectStore(OBJ_STORE);
      const metaStore = transaction.objectStore(META_STORE);

      const objReq = objStore.get(key);
      const metaReq = metaStore.get(key);

      let modelData: string | ArrayBuffer | null = null;
      let meta: StoredModelMetadata | null = null;

      objReq.onsuccess = () => {
        modelData = objReq.result;
      };

      metaReq.onsuccess = () => {
        meta = metaReq.result;
      };

      transaction.oncomplete = () => {
        if (modelData && meta) {
          resolve({ objText: modelData, meta });
        } else {
          resolve(null);
        }
      };

      transaction.onerror = () => reject(transaction.error);
    });
  } catch (err) {
    console.warn('Could not load 3D model from IndexedDB:', err);
    return null;
  }
}

/**
 * Update model settings in IndexedDB without re-writing the heavy objText
 */
export async function updateModelSettings(
  key: string,
  settings: Partial<ModelDisplaySettings>
): Promise<ModelDisplaySettings | null> {
  try {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([META_STORE], 'readwrite');
      const metaStore = transaction.objectStore(META_STORE);
      const getReq = metaStore.get(key);

      getReq.onsuccess = () => {
        const existing: StoredModelMetadata = getReq.result;
        if (!existing) {
          resolve(null);
          return;
        }

        const mergedSettings: ModelDisplaySettings = {
          ...DEFAULT_MODEL_SETTINGS,
          ...(existing.settings || {}),
          ...settings
        };

        existing.settings = mergedSettings;
        existing.updatedAt = new Date().toISOString();

        metaStore.put(existing, key);
        resolve(mergedSettings);
      };

      getReq.onerror = () => reject(getReq.error);
      transaction.onerror = () => reject(transaction.error);
    });
  } catch (err) {
    console.error('Failed to update 3D model settings:', err);
    return null;
  }
}

/**
 * Delete OBJ model from IndexedDB
 */
export async function deleteObjModel(key: string): Promise<void> {
  try {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([OBJ_STORE, META_STORE], 'readwrite');
      const objStore = transaction.objectStore(OBJ_STORE);
      const metaStore = transaction.objectStore(META_STORE);

      objStore.delete(key);
      metaStore.delete(key);

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  } catch (err) {
    console.warn('Failed to delete 3D OBJ model from IndexedDB:', err);
  }
}

/**
 * Persist 3D model to Firestore and Database so all website visitors can see it
 */
export async function sync3DModelToCloud(
  modelData: string | ArrayBuffer,
  meta: StoredModelMetadata,
  uploadedUrl?: string,
  key = 'home_custom_3d_obj'
): Promise<void> {
  try {
    // 1. Save to local IndexedDB cache first for instant local rendering
    await save3DModel(key, modelData, meta);

    // 2. Prepare payload for cloud Firestore (limit direct string payload to < 800KB for Firestore limits)
    const isTextUnderFirestoreLimit = typeof modelData === 'string' && modelData.length < 800000;
    const finalModelUrl = uploadedUrl || meta.modelUrl || null;

    const cloudPayload = {
      meta: {
        ...meta,
        modelUrl: finalModelUrl || undefined
      },
      modelUrl: finalModelUrl,
      objText: isTextUnderFirestoreLimit ? modelData : null,
      deleted: false,
      updatedAt: meta.updatedAt || new Date().toISOString()
    };

    // 3. Save to Firestore `settings/home_3d_model`
    try {
      const docRef = doc(db, 'settings', 'home_3d_model');
      await setDoc(docRef, {
        value: cloudPayload,
        ...cloudPayload
      });
    } catch (fsErr) {
      console.warn('Firestore 3D model sync note:', fsErr);
    }

    // 4. Save to backend MongoDB / memory store
    try {
      await fetch('/api/db/home_3d_model', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: cloudPayload })
      });
    } catch (apiErr) {
      console.warn('Backend DB 3D model sync note:', apiErr);
    }
  } catch (err) {
    console.error('Error syncing 3D model to cloud:', err);
    throw err;
  }
}

/**
 * Fetch 3D model from Firestore and cache it locally in IndexedDB for fast, smooth loading
 */
export async function fetchAndCacheCloud3DModel(
  key = 'home_custom_3d_obj'
): Promise<{ objText: string | ArrayBuffer; meta: StoredModelMetadata } | null> {
  try {
    // A. Check local cache first
    const local = await loadObjModel(key);

    // B. Check cloud Firestore
    const docRef = doc(db, 'settings', 'home_3d_model');
    const snap = await getDoc(docRef);

    if (!snap.exists()) {
      // If Firestore has no document, return local if available or null
      return local;
    }

    const cloudRaw = snap.data();
    const cloudDoc = (cloudRaw?.value || cloudRaw) as {
      meta?: StoredModelMetadata;
      modelUrl?: string | null;
      objText?: string | null;
      deleted?: boolean;
      updatedAt?: string;
    };

    if (cloudDoc.deleted || !cloudDoc.meta) {
      if (local) {
        await deleteObjModel(key);
      }
      return null;
    }

    const cloudMeta = cloudDoc.meta;

    // If local cache is fresh and matches cloud timestamp, return local immediately!
    if (local && local.meta && local.meta.updatedAt === cloudMeta.updatedAt) {
      return local;
    }

    // Otherwise download the cloud asset and update the local cache
    let payload: string | ArrayBuffer | null = null;

    if (cloudDoc.objText) {
      payload = cloudDoc.objText;
    } else if (cloudDoc.modelUrl || cloudMeta.modelUrl) {
      const urlToFetch = cloudDoc.modelUrl || cloudMeta.modelUrl!;
      const response = await fetch(urlToFetch);
      if (response.ok) {
        if (cloudMeta.format === 'glb' || cloudMeta.format === 'gltf') {
          payload = await response.arrayBuffer();
        } else {
          payload = await response.text();
        }
      }
    }

    if (payload) {
      await save3DModel(key, payload, cloudMeta);
      return { objText: payload, meta: cloudMeta };
    }

    return local;
  } catch (err) {
    console.warn('Error fetching and caching cloud 3D model:', err);
    return await loadObjModel(key);
  }
}

/**
 * Delete 3D model globally and clear local cache
 */
export async function delete3DModelFromCloud(key = 'home_custom_3d_obj'): Promise<void> {
  try {
    await deleteObjModel(key);

    const docRef = doc(db, 'settings', 'home_3d_model');
    await setDoc(docRef, {
      value: null,
      deleted: true,
      updatedAt: new Date().toISOString()
    });

    await fetch('/api/db/home_3d_model', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data: null })
    });
  } catch (err) {
    console.warn('Failed to delete 3D model from cloud:', err);
  }
}

/**
 * Subscribe in real-time to Firestore 3D model changes
 */
export function subscribeToCloud3DModel(
  onUpdate: (model: { objText: string | ArrayBuffer; meta: StoredModelMetadata } | null) => void,
  key = 'home_custom_3d_obj'
): () => void {
  try {
    const docRef = doc(db, 'settings', 'home_3d_model');
    return onSnapshot(docRef, async (snap) => {
      if (!snap.exists()) {
        const local = await loadObjModel(key);
        onUpdate(local);
        return;
      }

      const cloudRaw = snap.data();
      const cloudDoc = (cloudRaw?.value || cloudRaw) as {
        meta?: StoredModelMetadata;
        modelUrl?: string | null;
        objText?: string | null;
        deleted?: boolean;
      };

      if (cloudDoc.deleted || !cloudDoc.meta) {
        await deleteObjModel(key);
        onUpdate(null);
        return;
      }

      const updatedModel = await fetchAndCacheCloud3DModel(key);
      onUpdate(updatedModel);
    }, (err) => {
      console.warn('Cloud 3D model snapshot listener error:', err);
    });
  } catch (err) {
    console.warn('Failed to attach 3D model real-time listener:', err);
    return () => {};
  }
}
