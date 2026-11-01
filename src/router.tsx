import { lazy, Suspense, useState } from "react";
import { AppLayout } from "./layouts/AppLayout";
import { pageForPath } from "./pages/routes";
import { navigate, usePathname } from "./navigation";
import { PageBoundary, PageLoading } from "./components/PageBoundary";
import { ErrorPage } from "./components/ErrorPage";

let previewLoaded = false;
const createPreview = (recoveryUrl?: string) => __DEMO_MENU__ ? lazy(async () => {
  const module = recoveryUrl
    ? await import(/* @vite-ignore */ recoveryUrl) as typeof import("./demo/DemoPreview")
    : await import("./demo/DemoPreview");
  previewLoaded = true;
  return module;
}) : null;
const initialPreview = createPreview();

export function AppRouter() {
  const path = usePathname();
  const [DemoPreview, setPreview] = useState(() => initialPreview);
  const retryPreview = () => {
    // WebKit retains failed module URLs. Reuse Vite's exact preload URL with a
    // fresh query only after an explicit bootstrap retry, never a payment action.
    const preload = document.querySelector<HTMLLinkElement>('link[rel="modulepreload"][href*="/DemoPreview-"]');
    if (!previewLoaded && preload) {
      const url = new URL(preload.href);
      if (url.origin === location.origin) {
        url.searchParams.set("recovery", crypto.randomUUID());
        setPreview(() => createPreview(url.href));
        return;
      }
    }
    if (!previewLoaded) location.reload();
    else setPreview(() => createPreview());
  };

  return DemoPreview
    ? <PageBoundary resetKey={path} onRetry={retryPreview} fallback={(kind, retry) => <AppLayout currentPath={path}>
        <ErrorPage kind={kind} onRetry={retry} onHome={() => { if (path === "/") retry(); else navigate("/"); }} />
      </AppLayout>}>
        <Suspense fallback={<AppLayout currentPath={path} loading><PageLoading /></AppLayout>}><DemoPreview /></Suspense>
      </PageBoundary>
    : <AppLayout currentPath={path}>{pageForPath(path)}</AppLayout>;
}
