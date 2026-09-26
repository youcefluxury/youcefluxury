import { useAction, useMutation } from "convex/react";
import { useCallback } from "react";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { ADMIN_API_KEY } from "@/lib/admin-key";
import { compressImage } from "@/lib/image-compress";

/** True when Cloudflare R2 simply is not set up yet on this deployment. */
function isR2Missing(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return (
    message.includes("R2_NOT_CONFIGURED") ||
    message.includes("R2 is not configured")
  );
}

/**
 * Uploads an image file from the admin's device and resolves its public URL.
 *
 * Images are downscaled + re-encoded in the browser first (see
 * image-compress.ts) so uploads stay small and the site loads fast even on weak
 * devices and slow connections.
 *
 * The photo goes to Cloudflare R2 when the store's R2 keys are set — that keeps
 * the shop's own storage small and serves the photos from the bucket's CDN.
 * While R2 is not configured, the same upload quietly falls back to Convex
 * storage, so saving a product never breaks.
 */
export function useUploadImage() {
  const uploadToR2 = useAction(api.r2.uploadImage);
  const generateUploadUrl = useMutation(api.catalog.generateUploadUrl);
  const getUrl = useMutation(api.catalog.imageUrl);

  return useCallback(
    async (file: File): Promise<string> => {
      const compressed = await compressImage(file);
      const contentType = compressed.type || "image/jpeg";

      try {
        const { publicUrl } = await uploadToR2({
          adminKey: ADMIN_API_KEY,
          contentType,
          fileName: compressed.name || "image.jpg",
          body: await compressed.arrayBuffer(),
        });
        return publicUrl;
      } catch (error) {
        if (!isR2Missing(error)) throw error;
        console.warn("R2 is not configured — falling back to Convex storage.");
      }

      const uploadUrl = await generateUploadUrl({});
      const response = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": contentType },
        body: compressed,
      });
      if (!response.ok) {
        throw new Error("UPLOAD_FAILED");
      }
      const { storageId } = (await response.json()) as {
        storageId: Id<"_storage">;
      };
      const url = await getUrl({ storageId });
      if (!url) {
        throw new Error("UPLOAD_URL_FAILED");
      }
      return url;
    },
    [generateUploadUrl, getUrl, uploadToR2],
  );
}
