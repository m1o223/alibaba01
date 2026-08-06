import { AppLayout } from "./layouts/AppLayout";
import { ContactPage } from "./pages/ContactPage";
import { HomePage } from "./pages/HomePage";

const routes = {
  "/": <HomePage />,
  "/contact": <ContactPage />,
} as const;

export function AppRouter() {
  const path = window.location.pathname;
  const page = routes[path as keyof typeof routes] ?? routes["/"];

  return <AppLayout>{page}</AppLayout>;
}
