import { useEffect, type ReactNode } from "react";
import { AppLayout } from "../layouts/AppLayout";
import { DemoCartProvider } from "./DemoCart";
import { DemoMenuPage } from "./DemoMenuPage";
import { DemoFlowProvider } from "./DemoFlow";
import { DemoProductPage } from "./DemoProductPage";
import { DemoCheckoutPage } from "./DemoCheckoutPage";
import { DemoOrderPage } from "./DemoOrderPage";
import { backToMenu, navigate, useDemoPath, withOrderType } from "./navigation";
import "./demoOrdering.css";

export default function DemoPreview({ currentPath, page }: { currentPath: string; page: ReactNode }) {
  return <DemoCartProvider><DemoFlowProvider><DemoRoutes initialPath={currentPath} page={page} /></DemoFlowProvider></DemoCartProvider>;
}

function DemoRoutes({ initialPath, page }: { initialPath: string; page: ReactNode }) {
  const path = useDemoPath();
  const productMatch = path.match(/^\/menu\/product\/([^/]+)$/);
  const orderMatch = path.match(/^\/demo\/order\/([^/]+)$/);
  const ordering = Boolean(productMatch || orderMatch || path === "/demo/checkout");
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      if (typeof history.state?.scrollY === "number") window.scrollTo(0, history.state.scrollY);
      else document.querySelector<HTMLElement>(".demo-ordering h1")?.focus({ preventScroll: true });
    });
    return () => cancelAnimationFrame(frame);
  }, [path]);
  let productKey = "";
  try { productKey = productMatch ? decodeURIComponent(productMatch[1]) : ""; } catch { /* Invalid links show the normal missing-product view. */ }
  // Existing non-demo routes retain their original full-document navigation.
  useEffect(() => { if (path !== initialPath && path !== "/menu" && !ordering) window.location.assign(window.location.href); }, [path, initialPath, ordering]);
  const content = productMatch ? <DemoProductPage productKey={productKey} />
    : orderMatch ? <DemoOrderPage reference={orderMatch[1]} />
    : path === "/demo/checkout" ? <DemoCheckoutPage /> : path === "/menu" ? <DemoMenuPage /> : page;
  return <AppLayout currentPath={path} orderingPage={ordering} onBack={ordering ? productMatch ? backToMenu : () => navigate(withOrderType("/menu")) : undefined}>{content}</AppLayout>;
}
