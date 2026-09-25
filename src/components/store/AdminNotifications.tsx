import { useQuery } from "convex/react";
import { ArrowLeft, Bell, ChevronLeft, ReceiptText } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";

import { api } from "@/convex/_generated/api";
import { ADMIN_API_KEY } from "@/lib/admin-key";
import { useIsAdminSession } from "@/components/store/bits";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { pickLang, useI18n, type Lang } from "@/lib/i18n";
import { formatDA, orderStatusLabel, sizeLabel } from "@/lib/store-data";
import { cn } from "@/lib/utils";

/** Where the last “I read them” moment is remembered (per browser). */
const SEEN_KEY = "hadrip-orders-seen-at";

/** Instagram-red used for the counter and the unread marks. */
const BADGE_RED = "#ff3040";

function readSeenAt(): number {
  try {
    return Number(window.localStorage.getItem(SEEN_KEY) ?? 0) || 0;
  } catch {
    return 0;
  }
}

function writeSeenAt(value: number) {
  try {
    window.localStorage.setItem(SEEN_KEY, String(value));
  } catch {
    /* private mode — the badge simply starts over next visit */
  }
}

/** “منذ 5 دقائق” / “5 min ago”, using the browser's own plural rules. */
function agoText(createdAt: number, lang: Lang): string {
  const seconds = Math.max(0, Math.round((Date.now() - createdAt) / 1000));
  const locale = lang === "ar" ? "ar-DZ" : "en";
  const format = (value: number, unit: Intl.RelativeTimeFormatUnit) =>
    new Intl.RelativeTimeFormat(locale, { numeric: "always", style: "long" })
      .format(-value, unit)
      .replace("قبل ", "منذ ");
  if (seconds < 60) return lang === "ar" ? "الآن" : "just now";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return format(minutes, "minute");
  const hours = Math.round(minutes / 60);
  if (hours < 24) return format(hours, "hour");
  return format(Math.round(hours / 24), "day");
}

/** Short order number, the same one the customer sees after checking out. */
function orderReference(createdAt: number): string {
  return String(createdAt).slice(-4);
}

/** Colour code shared with the dashboard's order chips. */
function statusTone(status: string): string {
  const tones: Record<string, string> = {
    new: "bg-foreground text-background",
    confirmed: "bg-blue-600/10 text-blue-700 border-blue-600/30",
    shipped: "bg-amber-600/10 text-amber-700 border-amber-600/30",
    delivered: "bg-emerald-600/10 text-emerald-700 border-emerald-600/30",
    cancelled: "bg-destructive/10 text-destructive border-destructive/30",
  };
  return tones[status] ?? "bg-muted text-muted-foreground border-border";
}

/**
 * Admin-only notification bell. Every order that arrives after the last time
 * the panel was opened bumps the red counter (1, 2, 3…), exactly like the
 * Instagram badge, and the panel lists the incoming orders with their details.
 */
export function AdminNotifications({
  tone = "light",
  className,
}: {
  /** "dark" = for the black dashboard header. */
  tone?: "light" | "dark";
  className?: string;
}) {
  const { t, lang, isAr } = useI18n();
  const isAdmin = useIsAdminSession();
  const orders = useQuery(api.orders.listOrders, { adminKey: ADMIN_API_KEY });
  const [seenAt, setSeenAt] = useState(0);
  const [open, setOpen] = useState(false);

  /* First visit: whatever is already in the dashboard counts as read, so the
     badge starts at 0 and then grows with each new order. */
  useEffect(() => {
    const stored = readSeenAt();
    if (stored > 0) {
      setSeenAt(stored);
      return;
    }
    const now = Date.now();
    writeSeenAt(now);
    setSeenAt(now);
  }, []);

  const list = orders ?? [];
  const unseen = useMemo(
    () => list.filter((order) => order.createdAt > seenAt),
    [list, seenAt],
  );

  /* Today's numbers — the two lines the shop owner checks first. */
  const today = useMemo(() => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const from = start.getTime();
    const rows = list.filter((order) => order.createdAt >= from);
    return {
      count: rows.length,
      sales: rows
        .filter((order) => order.status !== "cancelled")
        .reduce((sum, order) => sum + order.total, 0),
    };
  }, [list]);

  function markSeen() {
    const now = Date.now();
    writeSeenAt(now);
    setSeenAt(now);
  }

  /* Shoppers never see the bell — only the signed-in admin. */
  if (!isAdmin) return null;

  const onDark = tone === "dark";
  const back = <ArrowLeft className={cn("size-4", !isAr && "rotate-180")} />;

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) markSeen();
      }}
    >
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={t("notif.title")}
          title={t("notif.title")}
          className={cn(
            "relative grid size-10 place-items-center rounded-full transition-colors",
            onDark
              ? "border border-white/20 text-white hover:bg-white/10"
              : "text-foreground/80 hover:bg-muted hover:text-foreground",
            className,
          )}
        >
          <Bell className="size-5" />
          {unseen.length > 0 ? (
            <span
              key={unseen.length}
              className={cn(
                "absolute -top-0.5 -end-0.5 grid min-w-5 animate-[cart-pop_0.35s_ease-out] place-items-center rounded-full px-1 text-[10px] font-bold text-white ring-2",
                onDark ? "ring-foreground" : "ring-background",
              )}
              style={{ backgroundColor: BADGE_RED }}
            >
              {unseen.length > 9 ? "9+" : unseen.length}
            </span>
          ) : null}
        </button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        sideOffset={10}
        className="w-[min(23rem,calc(100vw-2rem))] gap-0 overflow-hidden rounded-2xl p-0 shadow-xl"
      >
        {/* Panel header — title, unread count and today's numbers */}
        <div className="bg-foreground text-background px-4 pt-3.5 pb-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="grid size-7 place-items-center rounded-full bg-white/10">
                <Bell className="size-3.5" />
              </span>
              <p className="text-sm font-semibold">{t("notif.title")}</p>
            </div>
            {unseen.length > 0 ? (
              <span
                className="rounded-full px-2 py-0.5 text-[10px] font-bold text-white"
                style={{ backgroundColor: BADGE_RED }}
              >
                {t("notif.unread", { n: unseen.length })}
              </span>
            ) : (
              <span className="text-[10px] text-white/50">
                {t("notif.allRead")}
              </span>
            )}
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2">
            <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2">
              <p className="text-[10px] text-white/50">{t("notif.todayOrders")}</p>
              <p className="mt-0.5 text-sm font-semibold">{today.count}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2">
              <p className="text-[10px] text-white/50">{t("notif.todaySales")}</p>
              <p className="mt-0.5 text-sm font-semibold">{formatDA(today.sales)}</p>
            </div>
          </div>
        </div>

        {list.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-6 py-10 text-center">
            <span className="bg-muted grid size-10 place-items-center rounded-full">
              <Bell className="text-muted-foreground size-4" />
            </span>
            <p className="text-muted-foreground text-xs leading-6">
              {t("notif.empty")}
            </p>
          </div>
        ) : (
          <ul className="max-h-[54vh] divide-y divide-border/60 overflow-y-auto">
            {list.slice(0, 12).map((order) => {
              const isUnread = order.createdAt > seenAt;
              const pieces = order.items.reduce(
                (sum, item) => sum + item.quantity,
                0,
              );
              return (
                <li key={order._id}>
                  <Link
                    to="/admin?tab=orders"
                    onClick={() => setOpen(false)}
                    className={cn(
                      "group relative flex gap-3 px-4 py-3.5 transition-colors hover:bg-muted/60",
                      isUnread && "bg-[#ff3040]/[0.04]",
                    )}
                  >
                    {/* Unread marker on the leading edge */}
                    {isUnread ? (
                      <span
                        aria-hidden="true"
                        className="absolute inset-y-2 start-0 w-[3px] rounded-full"
                        style={{ backgroundColor: BADGE_RED }}
                      />
                    ) : null}

                    <span className="bg-muted relative grid size-11 shrink-0 place-items-center overflow-hidden rounded-full border border-border/70">
                      {order.items[0]?.image ? (
                        <img
                          src={order.items[0].image}
                          alt=""
                          className="size-full object-cover"
                        />
                      ) : (
                        <ReceiptText className="text-muted-foreground size-4" />
                      )}
                    </span>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-xs font-semibold">
                          {t("notif.newOrder", {
                            reference: orderReference(order.createdAt),
                          })}
                        </p>
                        <span className="text-muted-foreground shrink-0 text-[10px]">
                          {agoText(order.createdAt, lang)}
                        </span>
                      </div>

                      <p className="mt-1 truncate text-[11px] font-medium">
                        {order.customerName}
                        <span className="text-muted-foreground">
                          {" · "}
                          <span dir="ltr">{order.phone}</span>
                        </span>
                      </p>

                      <p className="text-muted-foreground mt-0.5 truncate text-[10px]">
                        {lang === "ar" ? order.wilayaAr : order.wilayaFr}
                        {" · "}
                        {t("admin.orderItems", { n: pieces })}
                      </p>

                      {/* Exactly the sizes that were ordered — one line per
                          piece, never the product's whole size list. */}
                      <p className="text-foreground/80 mt-0.5 truncate text-[10px] font-medium">
                        {order.items
                          .slice(0, 2)
                          .map(
                            (item) =>
                              `${pickLang(item.nameAr, item.nameEn, lang)} · ${t(
                                "admin.sizeShort",
                                { size: sizeLabel(item.size, lang) },
                              )}`,
                          )
                          .join("  —  ")}
                        {order.items.length > 2
                          ? `  +${order.items.length - 2}`
                          : ""}
                      </p>

                      <div className="mt-1.5 flex items-center justify-between gap-2">
                        <span
                          className={cn(
                            "rounded-full border px-2 py-0.5 text-[9px] font-medium",
                            statusTone(order.status),
                          )}
                        >
                          {orderStatusLabel(order.status, lang)}
                        </span>
                        <span className="text-xs font-semibold">
                          {formatDA(order.total)}
                        </span>
                      </div>
                    </div>

                    <ChevronLeft
                      className={cn(
                        "text-muted-foreground/50 mt-3 size-3.5 shrink-0 transition-colors group-hover:text-foreground",
                        !isAr && "rotate-180",
                      )}
                    />
                  </Link>
                </li>
              );
            })}
          </ul>
        )}

        <Link
          to="/admin?tab=orders"
          onClick={() => setOpen(false)}
          className="hover:bg-muted flex items-center justify-center gap-2 border-t border-border/70 px-4 py-3 text-xs font-medium transition-colors"
        >
          <ReceiptText className="size-3.5" />
          {t("notif.openOrders")}
          {back}
        </Link>
      </PopoverContent>
    </Popover>
  );
}
