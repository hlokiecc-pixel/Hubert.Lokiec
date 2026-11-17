/**
 * Downscales and compresses user-uploaded images in the browser
 * to fit safely within Firestore's 1MB document limit and localStorage.
 */
const MAX_FIRESTORE_DATA_URL_BYTES = 850_000;

function renderImageToJpeg(img: HTMLImageElement, maxDimension: number, quality: number): string {
  let width = img.width;
  let height = img.height;

  if (width > maxDimension || height > maxDimension) {
    if (width > height) {
      height = Math.round((height * maxDimension) / width);
      width = maxDimension;
    } else {
      width = Math.round((width * maxDimension) / height);
      height = maxDimension;
    }
  }

  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, width);
  canvas.height = Math.max(1, height);
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Could not obtain canvas 2d context');
  }

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

  return canvas.toDataURL('image/jpeg', quality);
}

export async function compressDataUrl(
  dataUrl: string,
  maxDimension = 1400,
  initialQuality = 0.82,
  maxBytes = MAX_FIRESTORE_DATA_URL_BYTES
): Promise<string> {
  if (!dataUrl || !dataUrl.startsWith('data:image')) {
    return dataUrl;
  }
  if (dataUrl.length <= maxBytes && maxDimension >= 1400) {
    return dataUrl;
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onerror = (error) => reject(error);
    img.onload = () => {
      try {
        let dim = maxDimension;
        let quality = initialQuality;
        let result = renderImageToJpeg(img, dim, quality);

        // Iteratively lower quality or dimensions if still exceeding Firestore doc budget
        while (result.length > maxBytes && (quality > 0.45 || dim > 640)) {
          if (quality > 0.5) {
            quality = Math.max(0.45, quality - 0.12);
          } else {
            dim = Math.max(640, Math.round(dim * 0.75));
          }
          result = renderImageToJpeg(img, dim, quality);
        }

        resolve(result);
      } catch (err) {
        reject(err);
      }
    };
    img.src = dataUrl;
  });
}

export async function compressImage(file: File, maxDimension = 1400, quality = 0.82): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = (error) => reject(error);
    reader.onload = async () => {
      try {
        const raw = reader.result as string;
        const compressed = await compressDataUrl(raw, maxDimension, quality);
        resolve(compressed);
      } catch (err) {
        reject(err);
      }
    };
    reader.readAsDataURL(file);
  });
}
