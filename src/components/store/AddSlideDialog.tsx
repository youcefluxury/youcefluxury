import { useMutation } from "convex/react";
import { ImagePlus, Plus, X } from "lucide-react";
import {
  useEffect,
  useRef,
  useState,
  type SyntheticEvent,
} from "react";
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

/**
 * Admin-only ＋ pinned to the far edge of the hero slider. It opens the
 * dashboard's slide form (photo + title) as a centred popup, so a new hero
 * slide can be added without visiting the dashboard.
 */
export function AddSlideButton() {
  const { t } = useI18n();
  const isAdmin = useIsAdminSession();
  const addSlider = useMutation(api.catalog.addSlider);
  const uploadImage = useUploadImage();
  const inputRef = useRef<HTMLInputElement>(null);

  const [open, setOpen] = useState(false);
  const [image, setImage] = useState("");
  const [titleAr, setTitleAr] = useState("");
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  useEffect(() => {
    if (!open) return;
    setImage("");
    setTitleAr("");
  }, [open]);

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
    if (!image.trim()) {
      toast.error(t("admin.imageRequired"));
      return;
    }
    setBusy(true);
    try {
      // Only the Arabic title exists now — mirrored to the English slot.
      await addSlider({
        adminKey: ADMIN_API_KEY,
        image: image.trim(),
        titleAr: titleAr.trim(),
        titleEn: titleAr.trim(),
      });
      toast.success(t("admin.slideAdded"));
      setOpen(false);
    } catch {
      toast.error(t("admin.saveFailed"));
    } finally {
      setBusy(false);
    }
  }

  if (!isAdmin) return null;

  return (
    <>
      <button
        type="button"
        aria-label={t("addSlide.open")}
        title={t("addSlide.open")}
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          setOpen(true);
        }}
        onTouchEnd={(event: SyntheticEvent) => {
          // A phone tap never turns into a click once it is blocked, so the
          // popup is opened from the touch handler itself.
          event.preventDefault();
          event.stopPropagation();
          setOpen(true);
        }}
        className="bg-background/85 text-foreground hover:bg-background absolute top-3 z-30 grid size-9 place-items-center rounded-none border border-border/70 shadow-sm transition-colors"
        style={{ insetInlineEnd: "0.75rem" }}
      >
        <Plus className="size-4" />
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
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
            <DialogTitle className="text-base">{t("admin.newSlide")}</DialogTitle>
          </div>

          <form dir="rtl" onSubmit={submit} className="mt-5 grid gap-4">
            {/* Slide photo — upload from the device, drag & drop. */}
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
              <Label htmlFor="addSlideImage">{t("admin.imageUrl")}</Label>
              <div className="flex items-center gap-2">
                <Button
                  id="addSlideImage"
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

            <div className="grid gap-2">
              <Label htmlFor="addSlideTitle">{t("admin.titleAr")}</Label>
              <Input
                id="addSlideTitle"
                value={titleAr}
                onChange={(event) => setTitleAr(event.target.value)}
                placeholder={t("admin.slideTitlePlaceholder")}
              />
            </div>

            <Button type="submit" className="h-11 w-full" disabled={busy || uploading}>
              <Plus className="size-4" />
              {t("admin.addSlide")}
            </Button>
            <p className="text-muted-foreground text-[11px] leading-6">
              {t("admin.sliderHint")}
            </p>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
