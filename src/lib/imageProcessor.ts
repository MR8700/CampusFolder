export interface ResizeImageOptions {
  maxWidth?: number;
  maxHeight?: number;
  cropToSquare?: boolean;
  quality?: number;
  format?: 'image/jpeg' | 'image/webp' | 'image/png';
}

export interface ProcessedImageResult {
  dataUrl: string;
  blob: Blob;
  width: number;
  height: number;
  sizeBytes: number;
  originalWidth: number;
  originalHeight: number;
  originalSizeBytes: number;
}

/**
 * Resizes, optimizes, and optionally crops an image client-side using HTML5 Canvas.
 * Supports File, Blob, or base64 Data URL.
 */
export async function resizeImage(
  source: File | Blob | string,
  options: ResizeImageOptions = {}
): Promise<ProcessedImageResult> {
  const {
    maxWidth = 512,
    maxHeight = 512,
    cropToSquare = false,
    quality = 0.85,
    format = 'image/jpeg',
  } = options;

  let dataUrl: string;
  let originalSizeBytes = 0;

  if (typeof source === 'string') {
    dataUrl = source;
    originalSizeBytes = Math.round((source.length * 3) / 4);
  } else {
    originalSizeBytes = source.size;
    dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(source);
    });
  }

  // Load into Image object
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = dataUrl;
  });

  const origWidth = img.naturalWidth || img.width;
  const origHeight = img.naturalHeight || img.height;

  let targetWidth = origWidth;
  let targetHeight = origHeight;

  let sx = 0;
  let sy = 0;
  let sWidth = origWidth;
  let sHeight = origHeight;

  if (cropToSquare) {
    // Center crop square
    const minSide = Math.min(origWidth, origHeight);
    sx = (origWidth - minSide) / 2;
    sy = (origHeight - minSide) / 2;
    sWidth = minSide;
    sHeight = minSide;

    const finalSide = Math.min(minSide, maxWidth, maxHeight);
    targetWidth = finalSide;
    targetHeight = finalSide;
  } else {
    // Preserve aspect ratio within maxWidth and maxHeight bounds
    if (targetWidth > maxWidth || targetHeight > maxHeight) {
      const ratio = Math.min(maxWidth / targetWidth, maxHeight / targetHeight);
      targetWidth = Math.round(targetWidth * ratio);
      targetHeight = Math.round(targetHeight * ratio);
    }
  }

  // Draw onto canvas
  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Impossible d\'initialiser le contexte de dessin Canvas 2D');
  }

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // Fill background with white if JPEG to prevent black transparency
  if (format === 'image/jpeg') {
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, targetWidth, targetHeight);
  }

  ctx.drawImage(img, sx, sy, sWidth, sHeight, 0, 0, targetWidth, targetHeight);

  const outputDataUrl = canvas.toDataURL(format, quality);

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => {
        if (b) resolve(b);
        else reject(new Error('Erreur lors de la conversion Canvas en Blob'));
      },
      format,
      quality
    );
  });

  return {
    dataUrl: outputDataUrl,
    blob,
    width: targetWidth,
    height: targetHeight,
    sizeBytes: blob.size,
    originalWidth: origWidth,
    originalHeight: origHeight,
    originalSizeBytes,
  };
}

/**
 * Direct upload helper that resizes on client then uploads to /api/v1/upload/image
 */
export async function uploadResizedImage(
  source: File | Blob | string,
  options: ResizeImageOptions & { folder?: 'logos' | 'avatars' | 'covers' | 'documents' } = {}
): Promise<{ url: string; result: ProcessedImageResult }> {
  const result = await resizeImage(source, options);

  const res = await fetch('/api/v1/upload/image', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      dataUrl: result.dataUrl,
      folder: options.folder || 'images',
    }),
  });

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Échec du téléversement de l’image');
  }

  return {
    url: data.url,
    result,
  };
}
