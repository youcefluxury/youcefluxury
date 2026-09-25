import { useMutation, useQuery } from "convex/react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  Image as ImageIcon,
  MoreHorizontal,
  Pencil,
  Trash2,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type SyntheticEvent,
} from "react";
import { Link, useNavigate } from "react-router";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { api } from "@/convex/_generated/api";
import { ADMIN_API_KEY } from "@/lib/admin-key";
import { AddSlideButton } from "@/components/store/AddSlideDialog";
import { pickLang, useI18n, type Lang, type TKey } from "@/lib/i18n";
import { useIsAdminSession } from "@/components/store/bits";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type HeroSlide = {
  /** Stable identity — the db id, or the image path for the fallbacks. */
  key: string;
  image: string;
  titleAr: string;
  titleEn: string;
  href: string;
};

const FALLBACK_SLIDES: HeroSlide[] = [
  {
    key: "fallback-1",
    image: "/sliders/hero-1.jpg",
    titleAr: "تي شيرت أوفرسايز",
    titleEn: "T-Shirt Oversize",
    href: "/shop?cat=tshirts",
  },
  {
    key: "fallback-2",
    image: "/sliders/hero-2.jpg",
    titleAr: "هودي ثقيل",
    titleEn: "Heavyweight Hoodie",
    href: "/shop?cat=tshirts",
  },
  {
    key: "fallback-3",
    image: "/sliders/hero-3.jpg",
    titleAr: "سراويل واسعة",
    titleEn: "Baggy & Boyfriend",
    href: "/shop?cat=pants",
  },
];

const AUTOPLAY_MS = 6500;

function slideTitle(slide: HeroSlide, lang: Lang): string {
  return pickLang(slide.titleAr, slide.titleEn, lang);
}

export function HeroSlider() {
  const { t, lang, isAr } = useI18n();
  const navigate = useNavigate();
  const sliderRows = useQuery(api.catalog.listSliders);
  const isAdmin = useIsAdminSession();

  // Admin-managed slides. While the list is still loading we render a quiet
  // solid placeholder — the old demo photos never flash on screen. Once the
  // db responds: slides exist → show them; admin deleted them all → the
  // slider stays genuinely empty for everyone (matches the dashboard).
  const slides: HeroSlide[] =
    sliderRows && sliderRows.length > 0
      ? sliderRows.map((row) => ({
          key: row._id,
          image: row.image,
          titleAr: row.titleAr,
          titleEn: row.titleEn,
          href: row.href || "/shop",
        }))
      : [];

  const [index, setIndex] = useState(0);
  const [actionsOpen, setActionsOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const deleteSlider = useMutation(api.catalog.deleteSlider);
  const count = slides.length;

  /**
   * Every slide photo is preloaded as soon as the list is known. Switching
   * slides then reads from the browser cache — no slow first paint, and no
   * half-loaded photo waiting for the network.
   */
  const imagesKey = slides.map((item) => item.image).join("|");
  const [ready, setReady] = useState<Record<string, true>>({});
  // Natural width / height of every slide photo, used to decide how it fits.
  const [aspects, setAspects] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!imagesKey) return;
    let cancelled = false;
    for (const image of imagesKey.split("|")) {
      const loader = new window.Image();
      loader.decoding = "async";
      loader.onload = () => {
        if (cancelled) return;
        const ratio =
          loader.naturalHeight > 0
            ? loader.naturalWidth / loader.naturalHeight
            : 0;
        setReady((current) =>
          current[image] ? current : { ...current, [image]: true },
        );
        if (ratio > 0) {
          setAspects((current) =>
            current[image] ? current : { ...current, [image]: ratio },
          );
        }
      };
      loader.src = image;
    }
    return () => {
      cancelled = true;
    };
  }, [imagesKey]);

  /**
   * True on real phone widths only. The expansion below is a phone fix; on
   * a computer the slider always keeps its original look (whole photo with
   * the blurred gutters), whatever the window width is.
   */
  const [isPhone, setIsPhone] = useState(false);

  useEffect(() => {
    if (typeof window.matchMedia !== "function") return;
    const query = window.matchMedia("(max-width: 640px)");
    const sync = () => setIsPhone(query.matches);
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);

  /**
   * The frame's own aspect ratio vs the photo's: a portrait photo shown
   * “contained” inside a wide frame leaves the two side gaps — on phones that
   * photo is expanded to fill the frame instead. Measured before paint so the
   * fit never changes mid-render.
   */
  const frameRef = useRef<HTMLDivElement>(null);
  const [frameAspect, setFrameAspect] = useState(0);

  useLayoutEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;
    const measure = () =>
      setFrameAspect(frame.clientWidth / Math.max(1, frame.clientHeight));
    measure();
    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", measure);
      return () => window.removeEventListener("resize", measure);
    }
    const observer = new ResizeObserver(measure);
    observer.observe(frame);
    return () => observer.disconnect();
  }, [count]);

  // Keep the active index valid when the admin removes slides.
  useEffect(() => {
    setIndex((current) => (current >= count ? 0 : current));
  }, [count]);

  const go = useCallback(
    (step: number) => setIndex((current) => (current + step + count) % count),
    [count],
  );

  // Latest values for the autoplay timer, so its interval is never recreated.
  const latest = useRef({ slides, ready });
  useEffect(() => {
    latest.current = { slides, ready };
  }, [slides, ready]);

  // Autoplay — every 6.5s, and only onto a slide whose photo is already
  // decoded. That way an empty frame can never appear mid-transition.
  useEffect(() => {
    if (count === 0) return;
    const timer = window.setInterval(() => {
      setIndex((current) => {
        const next = (current + 1) % count;
        const photo = latest.current.slides[next]?.image ?? "";
        return latest.current.ready[photo] ? next : current;
      });
    }, AUTOPLAY_MS);
    return () => window.clearInterval(timer);
  }, [count]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      // In Arabic (RTL) the left arrow moves forward, in English it moves back.
      if (event.key === "ArrowLeft") go(isAr ? 1 : -1);
      if (event.key === "ArrowRight") go(isAr ? -1 : 1);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go, isAr]);

  const slide = slides[Math.min(index, count - 1)] ?? FALLBACK_SLIDES[0];
  const activeReady = Boolean(ready[slide.image]);
  // Phone only: every photo renders at the SAME fixed size — the frame is a
  // constant 3:4 portrait, so tall and wide photos all fill the exact same
  // box (no more slides that come in different sizes). Computers keep the
  // original whole-photo layout with the blurred gutters.
  const photoAspect = aspects[slide.image] ?? 0;
  const fillFrame = isPhone;

  // Slides are still loading: hold the exact slider height with a quiet dark
  // canvas, so nothing shifts and no “coming soon” text flashes on the way in.
  const frameHeight = isPhone
    ? "h-[420px]"
    : "h-[66vh] max-h-[720px] min-h-[420px]";

  if (count === 0 && sliderRows === undefined) {
    return (
      <section
        aria-roledescription="carousel"
        aria-label={t("hero.carousel")}
        className={cn(
          "bg-ink relative isolate w-full overflow-hidden",
          frameHeight,
        )}
      >
        <div className="bg-ink absolute inset-0 animate-pulse" aria-hidden="true" />
      </section>
    );
  }

  if (count === 0) {
    return (
      <section
        aria-roledescription="carousel"
        aria-label={t("hero.carousel")}
        className="bg-ink relative isolate flex h-[40vh] min-h-[280px] w-full items-center justify-center overflow-hidden text-white"
      >
        <div className="text-center">
          <p className="font-display text-lg tracking-[0.08em] opacity-70">
            {t("hero.noSlides")}
          </p>
        </div>
        {/* Admin-only: the ＋ stays here even with zero slides, so a new slide
            can always be added without going to the dashboard. */}
        {isAdmin ? <AddSlideButton /> : null}
      </section>
    );
  }

  return (
    <section
      aria-roledescription="carousel"
      aria-label={t("hero.carousel")}
      className="bg-ink relative isolate w-full overflow-hidden text-white"
    >
      {/* Slides — clickable photos, name + discover action pinned near the bottom.
          This container is the height-giving element in normal flow, so nothing
          sits above the slides and every click lands on the photo link. */}
      <div
        ref={frameRef}
        className={cn("relative w-full", frameHeight)}
      >
        {/* Calm canvas until the current photo is decoded — never a previous
            photo, never a broken half-loaded frame. */}
        {activeReady ? (
          null
        ) : (
          <div className="bg-ink absolute inset-0 animate-pulse" aria-hidden="true" />
        )}

        {/* Only the active slide is mounted: when the index changes, the old
            photo is gone in the same frame instead of lingering behind the
            new one while it fades in. */}
        {activeReady ? (
          <motion.div
            key={slide.key}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ opacity: { duration: 0.4 } }}
            className="absolute inset-0"
          >
            <Link
              to={slide.href}
              aria-label={slideTitle(slide, lang)}
              className="group relative block h-full w-full cursor-pointer"
            >
              {/* Blurred copy of the same photo fills the whole width behind
                  the sharp one — no empty side gutters, full photo on top.
                  On phones it is dropped when the photo already covers the
                  frame, so weak devices never decode a second copy of it. */}
              <img
                src={slide.image}
                alt=""
                aria-hidden="true"
                draggable={false}
                loading="lazy"                  className={cn(
                  "pointer-events-none absolute inset-0 h-full w-full scale-110 object-cover object-center opacity-40 [filter:blur(28px)]",
                  fillFrame && "hidden",
                )}
              />
              {/* Phones: a photo that would leave side gaps is expanded to fill
                  the frame. Everywhere else the photo stays whole. */}
              <img
                src={slide.image}
                alt={slideTitle(slide, lang)}
                draggable={false}
                className={cn(
                  "pointer-events-none relative h-full w-full object-center",
                  fillFrame ? "object-cover" : "object-contain",
                )}
              />
              {/* Soft gradient only behind the caption so it stays readable */}
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-black/75 via-black/30 to-transparent" />
              <div className="pointer-events-none absolute inset-x-0 bottom-10 flex flex-col items-center gap-3 text-center">
                <h2 className="font-display text-2xl leading-tight tracking-[0.04em] drop-shadow sm:text-4xl">
                  {slideTitle(slide, lang)}
                </h2>
                <span
                  className={cn(
                    "inline-flex h-11 items-center gap-2 border border-white/70 px-6 text-white transition-colors group-hover:bg-white group-hover:text-black",
                    isAr
                      ? "text-[13px] tracking-[0.06em]"
                      : "font-display text-[11px] tracking-[0.3em] uppercase",
                  )}
                >
                  {t("hero.cta")}
                </span>
              </div>
            </Link>
          </motion.div>
        ) : null}
      </div>

      {/* Arrows */}
      <button
        type="button"
        aria-label={t("hero.previous")}
        onClick={() => go(-1)}
        className={cn(
          "absolute top-1/2 z-10 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-black shadow-lg transition-transform hover:scale-105 sm:size-12",
          isAr ? "right-3 sm:right-7" : "left-3 sm:left-7",
        )}
      >
        {isAr ? <ChevronRight className="size-5" /> : <ChevronLeft className="size-5" />}
      </button>
      <button
        type="button"
        aria-label={t("hero.next")}
        onClick={() => go(1)}
        className={cn(
          "absolute top-1/2 z-10 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-black shadow-lg transition-transform hover:scale-105 sm:size-12",
          isAr ? "left-3 sm:left-7" : "right-3 sm:right-7",
        )}
      >
        {isAr ? <ChevronLeft className="size-5" /> : <ChevronRight className="size-5" />}
      </button>

      {/* Slide actions — edit / replace straight from the admin dashboard.
          Admin-only: regular shoppers never see this button. */}
      {isAdmin ? (
        <button
          type="button"
          aria-label={t("card.actions")}
          className="bg-background/85 text-foreground absolute top-3 z-30 grid size-9 place-items-center rounded-none border border-border/70 shadow-sm transition-colors hover:bg-background"
          style={{ insetInlineStart: "0.75rem" }}
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            setActionsOpen(true);
          }}
          onTouchEnd={(event: SyntheticEvent) => {
            // Blocking the tap also cancels the click, so open it right here —
            // otherwise the menu never appears on phones.
            event.preventDefault();
            event.stopPropagation();
            setActionsOpen(true);
          }}
        >
          <MoreHorizontal className="size-4" />
        </button>
      ) : null}

      {/* Admin-only ＋ at the far edge: add a new slide without the dashboard. */}
      {isAdmin ? <AddSlideButton /> : null}

      <Dialog open={actionsOpen} onOpenChange={setActionsOpen}>
        <DialogContent className="w-[calc(100vw-2rem)] max-w-[260px] gap-0 rounded-none p-2 sm:rounded-lg">
          <DialogHeader className="sr-only">
            <DialogTitle>{t("card.actions")}</DialogTitle>
            <DialogDescription>{t("card.actions")}</DialogDescription>
          </DialogHeader>
          {confirming ? (
            <div className="p-4 text-center">
              <p className="text-sm font-medium">{t("admin.slideDeleteConfirm")}</p>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  className="h-9"
                  disabled={busy}
                  onClick={() => setConfirming(false)}
                >
                  {t("admin.cancel")}
                </Button>
                <Button
                  variant="destructive"
                  className="h-9"
                  disabled={busy}
                  onClick={() => {
                    if (!slide.key.startsWith("kty")) {
                      void deleteSlider({
                        adminKey: ADMIN_API_KEY,
                        id: slide.key as never,
                      })
                        .then(() => toast.success(t("admin.deleted")))
                        .catch(() => toast.error(t("admin.deleteFailed")))
                        .finally(() => {
                          setBusy(false);
                          setConfirming(false);
                          setActionsOpen(false);
                        });
                    }
                  }}
                >
                  {t("admin.delete")}
                </Button>
              </div>
            </div>
          ) : (
            <>
              <button
                type="button"
                className="hover:bg-muted flex w-full items-center gap-3 px-3 py-3 text-start text-sm transition-colors"
                onClick={() => {
                  setActionsOpen(false);
                  navigate(`/admin?tab=slider&edit=${slide.key}`);
                }}
              >
                <Pencil className="size-4 shrink-0" />
                {t("card.edit")}
              </button>
              <button
                type="button"
                className="hover:bg-muted flex w-full items-center gap-3 px-3 py-3 text-start text-sm transition-colors"
                onClick={() => {
                  setActionsOpen(false);
                  navigate(`/admin?tab=slider&replace=${slide.key}`);
                }}
              >
                <ImageIcon className="size-4 shrink-0" />
                {t("hero.replace")}
              </button>
              <button
                type="button"
                disabled={busy}
                className="text-destructive hover:bg-destructive/10 flex w-full items-center gap-3 px-3 py-3 text-start text-sm transition-colors"
                onClick={() => setConfirming(true)}
              >
                <Trash2 className="size-4 shrink-0" />
                {t("card.delete")}
              </button>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Dots */}
      <div className="absolute inset-x-0 bottom-4 z-10 flex items-center justify-center gap-2.5">
        {slides.map((item, slideIndex) => (
          <button
            key={item.key}
            type="button"
            aria-label={t("hero.slide", { n: slideIndex + 1 })}
            aria-current={slideIndex === index}
            onClick={() => setIndex(slideIndex)}
            className={cn(
              "size-2.5 rounded-full transition-all duration-300",
              slideIndex === index
                ? "scale-125 bg-white"
                : "bg-white/40 hover:bg-white/70",
            )}
          />
        ))}
      </div>
    </section>
  );
}
