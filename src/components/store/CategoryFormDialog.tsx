import { useMutation, useQuery } from "convex/react";
import { ImagePlus, Plus, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { api } from "@/convex/_generated/api";
import { ADMIN_API_KEY } from "@/lib/admin-key";
import { ProductImage, useIsAdminSession } from "@/components/store/bits";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useI18n } from "@/lib/i18n";
import { useUploadImage } from "@/lib/upload";
import { cn } from "@/lib/utils";

/** The category row shape used by the create/edit popup. */
export type CategoryDraft = {
  _id: string;
  slug: string;
  image: string;
  sizes?: string[];
  hasSizeGuide?: boolean;
};

/** "sports-shoes" → "Sports Shoes" — the slug doubles as the display name. */
function slugToLabel(slug: string): string {
  return slug
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

/**
 * The dashboard's category form as a popup. Without a category it creates a
 * new one (الاسم + صورة التصنيف — the same two fields the dashboard asks for);
 * with one it edits every current value.
 */
export function CategoryFormDialog({
  open,
  onOpenChange,
  category,
}: {
  open: boolean;
  onOpenChange: (next: boolean) => void;
  /** When set, the popup edits this category instead of creating one. */
  category?: CategoryDraft;
}) {
  const { t } = useI18n();
  const createCategory = useMutation(api.catalog.createCategory);
  const updateCategory = useMutation(api.catalog.updateCategory);
  const uploadImage = useUploadImage();
  const inputRef = useRef<HTMLInputElement>(null);

  const [slug, setSlug] = useState("");
  const [image, setImage] = useState("");
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  useEffect(() => {
    if (!open) return;
    setSlug(category?.slug ?? "");
    setImage(category?.image ?? "");
  }, [open, category?.slug, category?.image]);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      setImage(await uploadImage(files[0]!));
    } catch {
      toast.error(t("admin.uploadFailed"));
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!slug.trim()) {
      toast.error(t("admin.categoryRequired"));
      return;
    }
    if (!image.trim()) {
      toast.error(t("admin.imageRequired"));
      return;
    }

    setBusy(true);
    try {
      const label = slugToLabel(slug.trim());
      const payload = {
        adminKey: ADMIN_API_KEY,
        slug: slug.trim(),
        nameAr: label,
        nameEn: label,
        image: image.trim(),
        sizes: category?.sizes ?? [],
        hasSizeGuide: category?.hasSizeGuide ?? false,
      };
      if (category) {
        await updateCategory({ ...payload, id: category._id as never });
        toast.success(t("admin.categorySaved"));
      } else {
        await createCategory(payload);
        toast.success(t("admin.categorySaved"));
      }
      onOpenChange(false);
    } catch (error) {
      toast.error(
        error instanceof Error && error.message
          ? error.message
          : t("admin.saveFailed"),
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        dir="ltr"
        showCloseButton={false}
        aria-describedby={undefined}
        className="max-h-[88vh] w-[calc(100vw-2rem)] max-w-md gap-0 overflow-y-auto rounded-none p-5 sm:rounded-lg"
      >
        <DialogClose
          aria-label={t("common.close")}
          className="bg-background/85 text-foreground hover:bg-muted absolute left-3 top-3 z-10 grid size-9 place-items-center rounded-full border border-border/70 shadow-sm transition-colors"
        >
          <X className="size-4" />
        </DialogClose>

        <div dir="rtl" className="pl-10 text-right">
          <DialogTitle className="text-base">
            {category ? t("admin.editCategory") : t("admin.newCategory")}
          </DialogTitle>
        </div>

        <form dir="rtl" onSubmit={submit} className="mt-5 grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="categoryFormSlug">{t("admin.slug")}</Label>
            <Input
              id="categoryFormSlug"
              dir="ltr"
              value={slug}
              onChange={(event) => setSlug(event.target.value)}
              placeholder={t("admin.slugPlaceholder")}
            />
            <p className="text-muted-foreground text-[10px] leading-4">
              {t("admin.slugHint")}
            </p>
          </div>

          {/* Category photo — upload from the device, drag & drop. */}
          <div
            className={cn("grid gap-2", uploading && "opacity-60")}
            onDragOver={(event) => {
              event.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(event) => {
              event.preventDefault();
              setDragOver(false);
              void handleFiles(event.dataTransfer.files);
            }}
          >
            <Label htmlFor="categoryFormImage">{t("admin.categoryImage")}</Label>
            <div className="flex items-center gap-2">
              <Button
                id="categoryFormImage"
                type="button"
                variant="outline"
                disabled={uploading}
                className={cn(
                  "h-11 min-w-0 flex-1",
                  dragOver && "border-primary bg-primary/10 ring-primary/30 ring-2",
                )}
                onClick={() => inputRef.current?.click()}
              >
                <ImagePlus className="size-4 shrink-0" />
                <span className="truncate text-xs sm:text-sm">
                  {uploading ? t("admin.uploading") : t("admin.imageUpload")}
                </span>
              </Button>
              {image ? (
                <div className="relative size-11 shrink-0 overflow-hidden rounded-lg border border-border/70 bg-muted">
                  <ProductImage src={image} alt="" sizes="44px" />
                  <button
                    type="button"
                    aria-label={t("admin.delete")}
                    onClick={() => setImage("")}
                    className="bg-foreground/85 text-background hover:bg-destructive absolute end-0 top-0 grid size-5 place-items-center rounded-full transition-colors"
                  >
                    <X className="size-3" />
                  </button>
                </div>
              ) : null}
            </div>
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(event) => void handleFiles(event.target.files)}
            />
          </div>

          <Button type="submit" className="h-11 w-full" disabled={busy || uploading}>
            <Plus className="size-4" />
            {category ? t("admin.saveChanges") : t("admin.addCategory")}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Admin-only ＋ that opens the category form as a centred popup. Visitors
 * never see it.
 */
export function AddCategoryButton({ className }: { className?: string }) {
  const { t } = useI18n();
  const isAdmin = useIsAdminSession();
  const [open, setOpen] = useState(false);

  if (!isAdmin) return null;

  return (
    <>
      <button
        type="button"
        aria-label={t("addCategory.open")}
        title={t("addCategory.open")}
        onClick={() => setOpen(true)}
        className={cn(
          "border-foreground bg-foreground text-background hover:opacity-80 grid size-7 shrink-0 place-items-center rounded-full border transition-opacity",
          className,
        )}
      >
        <Plus className="size-4" />
      </button>
      <CategoryFormDialog open={open} onOpenChange={setOpen} />
    </>
  );
}
