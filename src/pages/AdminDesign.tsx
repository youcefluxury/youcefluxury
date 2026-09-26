import { ExternalLink, LayoutDashboard, LogOut, Palette } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router";

import { Brand, LanguageToggle } from "@/components/store/bits";
import { SiteDesignTab } from "@/components/store/SiteDesignTab";
import { Button } from "@/components/ui/button";
import { ADMIN_SESSION_KEY } from "@/lib/admin-key";
import { useI18n } from "@/lib/i18n";
import { AdminLogin } from "@/pages/Admin";

/**
 * The dashboard's “Site design” screen: the design presets the store wears,
 * the store identity (name, tagline, description, logo, map) and the image
 * storage test — all behind the same session gate as the rest of the panel.
 */
export default function AdminDesign() {
  const { t } = useI18n();
  const [authenticated, setAuthenticated] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setAuthenticated(window.sessionStorage.getItem(ADMIN_SESSION_KEY) === "1");
    setReady(true);
  }, []);

  if (!ready) {
    return <div className="min-h-screen bg-foreground" />;
  }

  if (!authenticated) {
    return <AdminLogin onSuccess={() => setAuthenticated(true)} />;
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-muted/30">
      <header className="bg-foreground text-background">
        <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-3 px-3 py-4 sm:gap-4 sm:px-6 sm:py-5">
          <div className="flex items-center gap-3 sm:gap-4">
            <Brand onDark />
            <span className="hidden text-[10px] tracking-[0.24em] text-white/40 uppercase sm:block">
              {t("admin.dashboard")}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            <LanguageToggle onDark />
            <Button
              asChild
              variant="outline"
              size="sm"
              className="border-white/20 bg-transparent text-white hover:bg-white/10 hover:text-white"
            >
              <Link to="/admin">
                <LayoutDashboard className="size-4" />
                <span className="hidden min-[420px]:inline">
                  {t("admin.tabProducts")}
                </span>
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="sm"
              className="border-white/20 bg-transparent text-white hover:bg-white/10 hover:text-white"
            >
              <Link to="/">
                <ExternalLink className="size-4" />
                <span className="hidden min-[420px]:inline">
                  {t("admin.viewStore")}
                </span>
              </Link>
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                window.sessionStorage.removeItem(ADMIN_SESSION_KEY);
                setAuthenticated(false);
              }}
            >
              <LogOut className="size-4" />
              <span className="hidden min-[420px]:inline">
                {t("admin.logout")}
              </span>
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto w-full max-w-7xl px-3 py-6 sm:px-6 sm:py-8">
        <div className="mb-6 flex items-start gap-2.5 sm:gap-3">
          <Palette className="size-5 shrink-0" />
          <p className="min-w-0 flex-1 text-xs font-semibold leading-5 sm:text-sm">
            {t("admin.designLead")}
          </p>
        </div>
        <SiteDesignTab />
      </div>
    </div>
  );
}
