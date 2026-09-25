import { useMutation } from "convex/react";
import { useCallback } from "react";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { compressImage } from "@/lib/image-compress";

/**
 * Uploads an image file from the admin's device to Convex storage and
 * resolves its public URL. Images are downscaled + re-encoded in the
 * browser first (see image-compress.ts) so uploads stay small and the
 * site loads fast even on weak devices and slow connections.
 */
export function useUploadImage() {
  const generateUploadUrl = useMutation(api.catalog.generateUploadUrl);
  const getUrl = useMutation(api.catalog.imageUrl);

  return useCallback(
    async (file: File): Promise<string> => {
      const compressed = await compressImage(file);
      const uploadUrl = await generateUploadUrl({});
      const response = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": compressed.type || "application/octet-stream" },
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
    [generateUploadUrl, getUrl],
  );
}
