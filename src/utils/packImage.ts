/**
 * Shrinks a model photo before it is stored: max 600px wide, JPEG, about 45 KB.
 * Keeps the work order small on the device and small enough for one Google Sheets cell later.
 * Transparent areas become white. Returns a data URL.
 */
export const MAX_PACKED_IMAGE_LENGTH = 48_000;

export function packImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error ?? new Error('Could not read the image.'));
    reader.onload = () => {
      const image = new Image();
      image.onerror = () => reject(new Error('Could not read the image.'));
      image.onload = () => {
        let width = Math.min(600, image.width);
        let quality = 0.7;
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        if (!context) {
          reject(new Error('Could not read the image.'));
          return;
        }
        let output = '';
        for (let attempt = 0; attempt < 10; attempt += 1) {
          canvas.width = width;
          canvas.height = Math.round((image.height * width) / image.width);
          context.fillStyle = '#fff';
          context.fillRect(0, 0, canvas.width, canvas.height);
          context.drawImage(image, 0, 0, canvas.width, canvas.height);
          output = canvas.toDataURL('image/jpeg', quality);
          if (output.length < 45_000) break;
          quality -= 0.1;
          if (quality < 0.4) {
            quality = 0.6;
            width = Math.round(width * 0.8);
          }
        }
        resolve(output);
      };
      image.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}
