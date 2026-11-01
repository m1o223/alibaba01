import { type ComponentProps } from "react";
import { isInternalRoute, navigate } from "../navigation";
export { navigate, usePathname as useDemoPath } from "../navigation";
import type { OrderType } from "./orderModel";

export function DemoLink({ href = "/menu", onClick, ...props }: ComponentProps<"a">) {
  return <a {...props} href={href} onClick={event => {
    onClick?.(event);
    if (event.defaultPrevented || event.button !== 0 || event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) return;
    if ((props.target && props.target !== "_self") || (props.download !== undefined && props.download !== false) || !isInternalRoute(new URL(href, location.href))) return;
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
