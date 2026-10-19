import { useSyncExternalStore, type ComponentProps } from "react";
import type { OrderType } from "./orderModel";

const navigationEvent = "alibaba:demo-navigation";
function subscribe(callback: () => void) {
  window.addEventListener("popstate", callback);
  window.addEventListener(navigationEvent, callback);
  return () => { window.removeEventListener("popstate", callback); window.removeEventListener(navigationEvent, callback); };
}
export function useDemoPath() { return useSyncExternalStore(subscribe, () => window.location.pathname); }
export function navigate(href: string) {
  history.replaceState({ ...history.state, scrollY: window.scrollY }, "");
  history.pushState({ demoNavigation: true }, "", href);
  window.dispatchEvent(new Event(navigationEvent));
  window.scrollTo(0, 0);
}
export function DemoLink({ href = "/menu", onClick, ...props }: ComponentProps<"a">) {
  return <a {...props} href={href} onClick={event => {
    onClick?.(event);
    if (event.defaultPrevented || event.button !== 0 || event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) return;
    event.preventDefault(); navigate(href);
  }} />;
}
export function getOrderType(): OrderType | null {
  const parameter = new URLSearchParams(window.location.search).get("orderType");
  if (parameter === "dine-in" || parameter === "takeaway") return parameter;
  try { const stored = sessionStorage.getItem("alibaba.orderType"); return stored === "dine-in" || stored === "takeaway" ? stored : null; } catch { return null; }
}
export function withOrderType(path: string): string {
  const type = getOrderType();
  return type ? `${path}${path.includes("?") ? "&" : "?"}orderType=${type}` : path;
}
export function productHref(key: string): string { return withOrderType(`/menu/product/${encodeURIComponent(key)}`); }
export function backToMenu() {
  if (history.state?.demoNavigation) history.back();
  else navigate(withOrderType("/menu"));
}
export function readStored<T>(key: string, fallback: T): T {
  try { return JSON.parse(sessionStorage.getItem(key) ?? "null") ?? fallback; } catch { return fallback; }
}
export function writeStored(key: string, value: unknown) {
  try { sessionStorage.setItem(key, JSON.stringify(value)); } catch { /* All demo flows also work in memory. */ }
}
