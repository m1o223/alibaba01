import { lazy, Suspense } from "react";
import { AppLayout } from "./layouts/AppLayout";
import { pageForPath } from "./pages/routes";
import { usePathname } from "./navigation";
import { PageBoundary, PageError, PageLoading } from "./components/PageBoundary";

const DemoPreview = __DEMO_MENU__ ? lazy(() => import("./demo/DemoPreview")) : null;

export function AppRouter() {
  const path = usePathname();

  return DemoPreview
    ? <PageBoundary fallback={<AppLayout currentPath={path}><PageError /></AppLayout>}>
        <Suspense fallback={<AppLayout currentPath={path} loading><PageLoading /></AppLayout>}><DemoPreview /></Suspense>
      </PageBoundary>
    : <AppLayout currentPath={path}>{pageForPath(path)}</AppLayout>;
}
