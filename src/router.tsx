import { AppLayout } from "./layouts/AppLayout";
import { AboutPage } from "./pages/AboutPage";
import { CartPage } from "./pages/CartPage";
import { ContactPage } from "./pages/ContactPage";
import { HomePage } from "./pages/HomePage";
import { MenuPage } from "./pages/MenuPage";

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

  return <AppLayout currentPath={path}>{page}</AppLayout>;
}
