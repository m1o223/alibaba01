import { lazy, Suspense } from "react";
import { AppLayout } from "./layouts/AppLayout";
import { AboutPage } from "./pages/AboutPage";
import { CartPage } from "./pages/CartPage";
import { ContactPage } from "./pages/ContactPage";
import { HomePage } from "./pages/HomePage";
import { MenuPage } from "./pages/MenuPage";

const DemoPreview = __DEMO_MENU__ ? lazy(() => import("./demo/DemoPreview")) : null;

const routes = {
  "/": <HomePage />,
  "/about": <AboutPage />,
  "/cart": <CartPage />,
  "/contact": <ContactPage />,
  "/menu": <MenuPage />,
} as const;

export function AppRouter() {
  const path = window.location.pathname;
  const page = routes[path as keyof typeof routes] ?? routes["/"];

  return DemoPreview
    ? <Suspense fallback={<p role="status">Laddar…</p>}><DemoPreview currentPath={path} page={page} /></Suspense>
    : <AppLayout currentPath={path}>{page}</AppLayout>;
}
