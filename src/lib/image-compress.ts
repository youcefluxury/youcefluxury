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

/** Long edge of a normalised logo, in pixels. */
const LOGO_EDGE = 256;

/**
 * Normalises any logo the admin uploads so it always renders identically.
 *
 * The product pipeline re-encodes to JPEG, which has no transparency — a
 * transparent PNG logo came out as a white rectangle that broke the header
 * with a bright gap. This path instead:
 *
 *   - scales the longest side down to a fixed 256px, so a huge photo and a
 *     small icon both end up the same weight and equally crisp;
 *   - centres the artwork inside a square with a transparent margin, so a wide
 *     wordmark and a tall icon both fill the same box instead of leaving a
 *     letterbox gap;
 *   - writes PNG, which keeps the transparency the logo relies on.
 */
export async function normalizeLogoImage(file: File): Promise<File> {
  if (!isCompressible(file)) return file;

  try {
    const bitmap = await createImageBitmap(file, {
      imageOrientation: "from-image",
    });
    const longest = Math.max(bitmap.width, bitmap.height);
    if (!longest) {
      bitmap.close();
      return file;
    }

    const scale = Math.min(1, LOGO_EDGE / longest);
    const drawn = {
      width: Math.max(1, Math.round(bitmap.width * scale)),
      height: Math.max(1, Math.round(bitmap.height * scale)),
    };

    const canvas = document.createElement("canvas");
    canvas.width = LOGO_EDGE;
    canvas.height = LOGO_EDGE;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      bitmap.close();
      return file;
    }
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    /* Left and top margins are what centre the artwork in the square. */
    ctx.drawImage(
      bitmap,
      Math.round((LOGO_EDGE - drawn.width) / 2),
      Math.round((LOGO_EDGE - drawn.height) / 2),
      drawn.width,
      drawn.height,
    );
    bitmap.close();

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/png"),
    );
    if (!blob) return file;

    const baseName = file.name.replace(/\.[^.]+$/, "") || "logo";
    return new File([blob], `${baseName}.png`, { type: "image/png" });
  } catch {
    return file; // decode failed — upload the original as-is
  }
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
