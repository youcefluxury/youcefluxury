import '@vly-ai/integrations';
import { Toaster } from "@/components/ui/sonner";
import { SiteThemeProvider } from "@/components/store/SiteThemeProvider";
import { StoreLayout } from "@/components/store/StoreLayout";
import { StoreMeta } from "@/components/store/StoreMeta";
import { LanguageProvider } from "@/lib/i18n";
import { CartProvider } from "@/lib/store-state";
import { VlyToolbar } from "../vly-toolbar-readonly.tsx";
import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { ConvexReactClient } from "convex/react";
import React, { StrictMode, useEffect, lazy, Suspense } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Route, Routes, useLocation } from "react-router";
import "./index.css";

// Lazy load route components for better code splitting
const Landing = lazy(() => import("./pages/Landing.tsx"));
const Shop = lazy(() => import("./pages/Shop.tsx"));
const ProductDetails = lazy(() => import("./pages/ProductDetails.tsx"));
const CategoryPage = lazy(() => import("./pages/CategoryPage.tsx"));
const DeliveryPrices = lazy(() => import("./pages/DeliveryPrices.tsx"));
const Admin = lazy(() => import("./pages/Admin.tsx"));
const AdminDesign = lazy(() => import("./pages/AdminDesign.tsx"));
const NotFound = lazy(() => import("./pages/NotFound.tsx"));

// Simple loading fallback for route transitions
function RouteLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-pulse text-muted-foreground">Loading...</div>
    </div>
  );
}

/** Silent error boundary — if VlyToolbar crashes it renders nothing instead of
 *  crashing the whole app (e.g. hook errors in WebContainer environment). */
class ToolbarErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(err: Error) {
    console.warn("[VlyToolbar] Caught error, toolbar disabled:", err.message);
  }
  render() {
    return this.state.hasError ? null : this.props.children;
  }
}

/** Chunk/network load failures (offline user) get a small friendly screen. */
function isModuleLoadError(message: string): boolean {
  const needle = message.toLowerCase();
  return (
    needle.includes("dynamically imported module") ||
    needle.includes("failed to fetch dynamically") ||
    needle.includes("error loading dynamically") ||
    needle.includes("loading chunk") ||
    needle.includes("importing a module") ||
    (needle.includes("networkerror") && needle.includes("fetch"))
  );
}

/** Hard guard so runtime errors never leave the preview as a blank page. */
class RootErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; message: string; stack: string }
> {
  state = { hasError: false, message: "", stack: "" };
  static getDerivedStateFromError(error: Error) {
    return {
      hasError: true,
      message: error.message || "Unknown runtime error",
      stack: error.stack || "",
    };
  }
  componentDidCatch(err: Error) {
    console.error("[WebContainer preview] Root crash:", err);
  }
  render() {
    if (this.state.hasError) {
      if (isModuleLoadError(this.state.message)) {
        return (
          <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background p-6 text-center text-foreground">
            <p className="text-sm font-semibold">تعذر الاتصال</p>
            <p className="text-muted-foreground max-w-xs text-xs leading-6">
              تحقق من اتصالك بالإنترنت ثم أعد المحاولة.
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="bg-foreground text-background hover:bg-foreground/85 rounded-none border border-border px-5 py-2.5 text-xs font-medium transition-colors"
            >
              إعادة المحاولة
            </button>
          </div>
        );
      }
      return (
        <div className="min-h-screen flex items-center justify-center bg-background text-foreground p-6">
          <div className="max-w-lg text-center">
            <p className="text-sm font-semibold">Preview runtime error</p>
            <p className="mt-2 text-xs text-muted-foreground break-words">
              {this.state.message}
            </p>
            {this.state.stack && (
              <pre className="mt-3 text-left text-[10px] leading-4 text-muted-foreground/80 max-h-40 overflow-auto rounded border border-border/60 p-2">
                {this.state.stack}
              </pre>
            )}
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function RouteSyncer() {
  const location = useLocation();
  useEffect(() => {
    window.parent.postMessage(
      { type: "iframe-route-change", path: location.pathname },
      "*",
    );
  }, [location.pathname]);

  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      if (event.data?.type === "navigate") {
        if (event.data.direction === "back") window.history.back();
        if (event.data.direction === "forward") window.history.forward();
      }
    }
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  return null;
}


/**
 * The preview must never stay a blank white page. Anything thrown while the
 * app boots — a missing Convex URL, a failed module fetch — is written on
 * screen with a retry button instead of leaving an empty <div id="root">.
 * (Errors thrown later, inside a component tree, are already caught by
 * RootErrorBoundary above.)
 */
function showBootError(error: unknown) {
  console.error("[HA Drip Boys] boot failed:", error);
  const container = document.getElementById("root");
  if (!container) return;
  container.textContent = "";
  const box = document.createElement("div");
  box.className =
    "min-h-screen flex items-center justify-center bg-background text-foreground p-6";
  const card = document.createElement("div");
  card.className = "max-w-md text-center";
  const title = document.createElement("p");
  title.className = "text-sm font-semibold";
  title.textContent = "تعذر تشغيل المتجر / The store could not start";
  const detail = document.createElement("p");
  detail.className = "text-muted-foreground mt-2 text-xs break-words";
  detail.textContent = error instanceof Error ? error.message : String(error);
  const reload = document.createElement("button");
  reload.type = "button";
  reload.className =
    "bg-foreground text-background mt-4 border border-border px-5 py-2.5 text-xs font-medium";
  reload.textContent = "إعادة المحاولة / Retry";
  reload.onclick = () => window.location.reload();
  card.append(title, detail, reload);
  box.append(card);
  container.append(box);
}

/**
 * One React root per container, kept on `globalThis` so a second execution of
 * this module (dev reload, HMR) re-renders the existing root instead of
 * calling createRoot twice — the latter leaves #root mounted-but-empty, which
 * shows up as a blank white page.
 */
const bootGlobal = globalThis as typeof globalThis & {
  __hadripRoot__?: ReturnType<typeof createRoot>;
};

const rootElement = document.getElementById("root");

if (!rootElement) {
  showBootError(new Error("#root is missing from index.html"));
} else {
  try {
    const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL as string);
    const root =
      bootGlobal.__hadripRoot__ ??
      (bootGlobal.__hadripRoot__ = createRoot(rootElement));
    root.render(
      <StrictMode>
        <RootErrorBoundary>
          <ToolbarErrorBoundary>
            <VlyToolbar />
          </ToolbarErrorBoundary>
          <ConvexAuthProvider client={convex}>
            <SiteThemeProvider>
              <LanguageProvider>
                <CartProvider>
                  <BrowserRouter>
                    {/* Title, tab icon and shared-site description follow the
                        live store identity saved in the dashboard. */}
                    <StoreMeta />
                    <RouteSyncer />
                    <Suspense fallback={<RouteLoading />}>
                      <Routes>
                        <Route element={<StoreLayout />}>
                          <Route path="/" element={<Landing />} />
                          <Route path="/shop" element={<Shop />} />
                          <Route path="/category/:slug" element={<CategoryPage />} />
                          <Route path="/product/:id" element={<ProductDetails />} />
                          <Route path="/delivery" element={<DeliveryPrices />} />
                        </Route>
                        <Route path="/admin" element={<Admin />} />
                        {/* Site design: presets, store identity, R2 storage. */}
                        <Route path="/admin/design" element={<AdminDesign />} />
                        <Route path="*" element={<NotFound />} />
                      </Routes>
                    </Suspense>
                  </BrowserRouter>
                </CartProvider>
              </LanguageProvider>
            </SiteThemeProvider>
            <Toaster />
          </ConvexAuthProvider>
        </RootErrorBoundary>
      </StrictMode>,
    );
    /*
     * Tells the boot guard in index.html that React is up: from this point on
     * errors belong to the error boundary above, so the boot screen stops
     * reporting them.
     */
    window.requestAnimationFrame(() => {
      document.documentElement.dataset.appMounted = "1";
    });
  } catch (error) {
    showBootError(error);
  }
}
