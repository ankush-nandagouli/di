/**
 * IndexedDB storage for 3D model files (supports large .obj meshes without 5MB localStorage limits)
 */

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
