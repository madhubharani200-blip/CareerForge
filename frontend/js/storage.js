/**
 * STORAGE SERVICE (Instant Base64 Preview + Firebase Storage with Fast Timeout Fallback)
 */

import { storage } from "./firebase-config.js";
import { ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js";

/**
 * Convert any File object to a Base64 Data URL instantly.
 */
export function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    if (!file) return reject(new Error("No file provided"));
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

/**
 * Compress an image file to a lightweight Base64 string for instant storage
 */
export async function getOptimizedImageDataUrl(file, maxWidth = 400, maxHeight = 400, quality = 0.85) {
  const dataUrl = await readFileAsDataUrl(file);
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      let width = img.width;
      let height = img.height;

      if (width > maxWidth || height > maxHeight) {
        if (width > height) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        } else {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL(file.type || "image/jpeg", quality));
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

/**
 * Upload an image or file to Firebase Storage under users/{uid}/{folder}/{filename}
 * with fast fallback to optimized Data URL.
 */
export async function uploadUserFile(uid, file, folder = "avatars") {
  if (!file) throw new Error("No file provided for upload");

  // Instantly generate optimized Data URL
  const instantDataUrl = await getOptimizedImageDataUrl(file, 400, 400, 0.85);

  const ext = file.name ? file.name.split(".").pop() : "jpg";
  const filename = `${folder}_${Date.now()}.${ext}`;
  const storagePath = `users/${uid}/${folder}/${filename}`;

  // Try Firebase Storage with a 2.5-second timeout race
  try {
    if (storage) {
      const uploadPromise = (async () => {
        const fileRef = ref(storage, storagePath);
        const snapshot = await uploadBytes(fileRef, file);
        const downloadUrl = await getDownloadURL(snapshot.ref);
        return { success: true, url: downloadUrl, path: storagePath };
      })();

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Storage timeout")), 2500)
      );

      const result = await Promise.race([uploadPromise, timeoutPromise]);
      return result;
    }
  } catch (error) {
    console.warn(`[Storage] Firebase upload bypassed (${error.message}). Using optimized local data URL.`);
  }

  // Resilient fallback: Return instant optimized Data URL
  return {
    success: true,
    url: instantDataUrl,
    path: "local_data_url",
    isLocal: true
  };
}
