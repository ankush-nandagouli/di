/**
 * Utility for uploading photos, videos, and 3D models via server-side proxy
 * Supports both Cloudinary and resilient server static storage fallback
 */

export interface UploadResult {
  url: string;
  publicId?: string;
  isCloudinary: boolean;
  isServerStorage?: boolean;
  duration?: number;
  error?: string;
}

export async function uploadMediaToCloudinary(
  fileData: string | File, 
  resourceType: 'image' | 'video' | 'raw' | 'auto' = 'auto',
  fileName?: string
): Promise<UploadResult> {
  let base64Data = '';
  let resolvedFileName = fileName;

  if (typeof fileData === 'string') {
    base64Data = fileData;
  } else {
    if (!resolvedFileName) {
      resolvedFileName = fileData.name;
    }
    base64Data = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(fileData);
    });
  }

  try {
    const res = await fetch('/api/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ file: base64Data, resourceType, fileName: resolvedFileName })
    });

    if (res.ok) {
      const data = await res.json();
      return {
        url: data.url,
        publicId: data.public_id,
        duration: data.duration,
        isCloudinary: data.provider === 'cloudinary',
        isServerStorage: data.provider === 'server_storage'
      };
    } else {
      const err = await res.json();
      throw new Error(err.error || 'Upload failed.');
    }
  } catch (err: any) {
    console.warn('Media upload warning:', err.message);
    return {
      url: typeof fileData === 'string' ? fileData : '',
      isCloudinary: false,
      isServerStorage: false,
      error: err.message
    };
  }
}
