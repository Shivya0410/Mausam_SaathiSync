"use client";

// Browser image helpers for the camera features. Images stay in memory and
// are released after analysis (PRD 11.4). EXIF is never read or sent;
// createImageBitmap only applies the orientation so the photo is upright.

export const MAX_SIDE = 640;

/** Draw any image source to a canvas no larger than `max` on its long side. */
export function toCanvas(source, max = MAX_SIDE) {
  const w = source.videoWidth || source.width;
  const h = source.videoHeight || source.height;
  const scale = Math.min(1, max / Math.max(w, h));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(w * scale));
  canvas.height = Math.max(1, Math.round(h * scale));
  canvas.getContext('2d').drawImage(source, 0, 0, canvas.width, canvas.height);
  return canvas;
}

export async function fileToCanvas(file) {
  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
  try {
    return toCanvas(bitmap);
  } finally {
    bitmap.close?.();
  }
}

/** ImageData scaled to `width` px wide (Dhundh Meter uses 320). */
export function imageDataAt(canvas, width = 320) {
  const scale = Math.min(1, width / canvas.width);
  const w = Math.max(1, Math.round(canvas.width * scale));
  const h = Math.max(1, Math.round(canvas.height * scale));
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(canvas, 0, 0, w, h);
  return ctx.getImageData(0, 0, w, h);
}
