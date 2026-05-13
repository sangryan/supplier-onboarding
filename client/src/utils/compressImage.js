const MAX_SIZE_BYTES = 20 * 1024 * 1024; // 20MB

/**
 * Process a file for upload:
 * - If <= 20MB, return as-is.
 * - If > 20MB and an image, auto-resize/compress until it fits.
 * - If > 20MB and not an image, throw an error.
 */
export const processFileForUpload = (file) => {
  return new Promise((resolve, reject) => {
    if (file.size <= MAX_SIZE_BYTES) {
      resolve(file);
      return;
    }

    if (!file.type.startsWith('image/')) {
      reject(new Error(`"${file.name}" exceeds 20MB. Please use a smaller file.`));
      return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onload = (e) => {
      const img = new Image();
      img.src = e.target.result;

      img.onload = () => {
        const canvas = document.createElement('canvas');

        // Scale dimensions proportionally to target ~15MB uncompressed
        const scaleFactor = Math.sqrt((15 * 1024 * 1024) / file.size);
        canvas.width = Math.floor(img.width * scaleFactor);
        canvas.height = Math.floor(img.height * scaleFactor);

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        const compress = (quality) => {
          canvas.toBlob((blob) => {
            if (!blob) {
              reject(new Error('Failed to compress image'));
              return;
            }
            if (blob.size <= MAX_SIZE_BYTES || quality <= 0.3) {
              resolve(new File([blob], file.name, { type: 'image/jpeg', lastModified: Date.now() }));
            } else {
              compress(quality - 0.1);
            }
          }, 'image/jpeg', quality);
        };

        compress(0.85);
      };

      img.onerror = () => reject(new Error('Failed to load image for resizing'));
    };

    reader.onerror = () => reject(new Error('Failed to read file'));
  });
};

/**
 * Process multiple files, compressing images and rejecting oversized non-images.
 * Returns { processed: File[], errors: string[] }
 */
export const processFilesForUpload = async (files) => {
  const processed = [];
  const errors = [];

  for (const file of files) {
    try {
      const result = await processFileForUpload(file);
      processed.push(result);
    } catch (err) {
      errors.push(err.message);
    }
  }

  return { processed, errors };
};
