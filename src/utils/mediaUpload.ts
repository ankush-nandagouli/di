/**
 * Utility for uploading photos and videos to Cloudinary via server-side proxy
 */

export interface UploadResult {
  url: string;
  publicId?: string;
  isCloudinary: boolean;
  duration?: number;
  error?: string;
}

export async function uploadMediaToCloudinary(
  fileData: string | File, 
  resourceType: 'image' | 'video' | 'auto' = 'auto'
): Promise<UploadResult> {
  let base64Data = '';
  if (typeof fileData === 'string') {
    base64Data = fileData;
  } else {
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
      body: JSON.stringify({ file: base64Data, resourceType })
    });

    if (res.ok) {
      const data = await res.json();
      return {
        url: data.url,
        publicId: data.public_id,
        duration: data.duration,
        isCloudinary: true
      };
    } else {
      const err = await res.json();
      throw new Error(err.error || 'Upload to Cloudinary failed.');
    }
  } catch (err: any) {
    console.warn('Cloudinary upload warning:', err.message);
    return {
      url: base64Data,
      isCloudinary: false,
      error: err.message
    };
  }
}
