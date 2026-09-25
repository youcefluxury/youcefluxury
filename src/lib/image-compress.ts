/**
 * Client-side image compression for admin uploads.
 *
 * Photos taken on modern phones are 3-8 MB; this downscales them to a sane
 * web size (max 1600px on the long edge) and re-encodes as JPEG at 82%
 * quality before they ever leave the device — typically a 10-20x reduction
 * with no visible quality loss for product shots.
 */

const MAX_EDGE = 1600;
const JPEG_QUALITY = 0.82;

/** Returns true if the file can be decoded and re-encoded in the browser. */
function isCompressible(file: File): boolean {
  if (file.type === "image/gif") return false; // keep animations intact
  return (
    file.type.startsWith("image/") &&
    typeof createImageBitmap === "function" &&
    typeof document !== "undefined"
  );
}

export async function compressImage(file: File): Promise<File> {
  if (!isCompressible(file)) return file;

  try {
    // "from-image" honours the EXIF rotation of phone photos, so a portrait
    // shot never ends up sideways after compression.
    const bitmap = await createImageBitmap(file, {
      imageOrientation: "from-image",
    });
    const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
    // Already small and well-encoded — hand it back untouched.
    if (scale === 1 && file.size <= 400_000 && file.type === "image/jpeg") {
      bitmap.close();
      return file;
    }

    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      bitmap.close();
      return file;
    }
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    /* JPEG has no transparency: a PNG/WebP with transparent parts gets a white
       backing instead of the black canvas default. */
    if (file.type === "image/png" || file.type === "image/webp") {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", JPEG_QUALITY),
    );
    if (!blob || blob.size >= file.size) {
      return file; // compression gained nothing — keep the original
    }

    const baseName = file.name.replace(/\.[^.]+$/, "") || "image";
    return new File([blob], `${baseName}.jpg`, { type: "image/jpeg" });
  } catch {
    return file; // decode failed — upload the original as-is
  }
}
