import { pageForPath } from "../pages/routes";
import { AppLayout } from "../layouts/AppLayout";
import { DemoCartProvider } from "./DemoCart";
import { DemoMenuPage } from "./DemoMenuPage";
import { DemoFlowProvider } from "./DemoFlow";
import { DemoProductPage } from "./DemoProductPage";
import { DemoCheckoutPage } from "./DemoCheckoutPage";
import { DemoOrderPage } from "./DemoOrderPage";
import { backToMenu, navigate, useDemoPath, withOrderType } from "./navigation";
import "./demoOrdering.css";
import { DemoTrackingProvider } from "./DemoTracking";

export default function DemoPreview() {
  return <DemoCartProvider><DemoFlowProvider><DemoTrackingProvider><DemoRoutes /></DemoTrackingProvider></DemoFlowProvider></DemoCartProvider>;
}

function DemoRoutes() {
  const path = useDemoPath();
  const productMatch = path.match(/^\/menu\/product\/([^/]+)$/);
  const orderMatch = path.match(/^\/demo\/order\/([^/]+)$/);
  const ordering = Boolean(productMatch || orderMatch || path === "/demo/checkout");
  let productKey = "";
  try { productKey = productMatch ? decodeURIComponent(productMatch[1]) : ""; } catch { /* Invalid links show the normal missing-product view. */ }
  const content = productMatch ? <DemoProductPage productKey={productKey} />
    : orderMatch ? <DemoOrderPage reference={orderMatch[1]} />
    : path === "/demo/checkout" ? <DemoCheckoutPage /> : path === "/menu" ? <DemoMenuPage /> : pageForPath(path);
  return <AppLayout currentPath={path} orderingPage={ordering} onBack={ordering ? productMatch ? backToMenu : () => navigate(withOrderType("/menu")) : undefined}>{content}</AppLayout>;
}
