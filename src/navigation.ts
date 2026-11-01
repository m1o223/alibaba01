import { useSyncExternalStore } from "react";
import { flushSync } from "react-dom";

const navigationEvent = "alibaba:navigation";
let renderedLocation = window.location.href;
let transition: ViewTransition | undefined;
let fallbackAnimation: Animation | undefined;
let revision = 0;
let installed = false;
const scrollPositions = new Map<string, number>();

function ensureEntryKey() {
  if (!history.state?.alibabaNavigationKey) history.replaceState({ ...history.state, alibabaNavigationKey: crypto.randomUUID() }, "");
}

export function isInternalRoute(url: URL) {
  return url.origin === location.origin && (
    ["/", "/menu", "/about", "/contact", "/cart"].includes(url.pathname)
    || (__DEMO_MENU__ && /^\/(menu\/product|demo\/order)\/[^/]+$/.test(url.pathname))
    || (__DEMO_MENU__ && url.pathname === "/demo/checkout")
  );
}

function subscribe(callback: () => void) {
  window.addEventListener(navigationEvent, callback);
  return () => window.removeEventListener(navigationEvent, callback);
}
export function useLocation() {
  return useSyncExternalStore(subscribe, () => location.pathname + location.search + location.hash);
}
export function usePathname() {
  return useSyncExternalStore(subscribe, () => location.pathname);
}

export function replacePageUrl(url: URL) {
  history.replaceState(history.state, "", url);
  renderedLocation = location.href;
}

function rememberScroll(persist = false) {
  // Modal scroll locks temporarily move the document; those are not page positions.
  if (renderedLocation === location.href && document.body.style.position !== "fixed") {
    scrollPositions.set(history.state?.alibabaNavigationKey, window.scrollY);
    if (persist) history.replaceState({ ...history.state, scrollY: window.scrollY }, "");
  }
}

export function restorePagePosition() {
  const saved = scrollPositions.get(history.state?.alibabaNavigationKey) ?? history.state?.scrollY;
  if (typeof saved === "number") {
    window.scrollTo({ top: saved, behavior: "instant" });
  } else {
    let target: HTMLElement | null = null;
    try { target = document.getElementById(decodeURIComponent(location.hash.slice(1))); } catch { /* Malformed hashes are harmless. */ }
    if (target) target.scrollIntoView({ block: "start", behavior: "instant" });
    else window.scrollTo({ top: 0, behavior: "instant" });
  }
}

function renderNavigation(change: () => void, destinationPath = location.pathname) {
  const currentRevision = ++revision;
  transition?.skipTransition();
  fallbackAnimation?.cancel();
  const update = () => {
    if (currentRevision !== revision) return;
    flushSync(() => {
      change();
      ensureEntryKey();
      renderedLocation = location.href;
      window.dispatchEvent(new Event(navigationEvent));
    });
    if (document.body.style.position === "fixed" || document.querySelector("main[inert]")) transition?.skipTransition();
    restorePagePosition();
    const heading = document.querySelector<HTMLElement>("main h1, main h2");
    if (heading && !document.getElementById("root")?.inert) {
      heading.tabIndex = -1;
      heading.focus({ preventScroll: true });
    }
  };
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  // Checkout can reopen a delivery sheet after mounting. Snapshotting across its
  // fixed-body/blur layers crashes WebKit; retain the lightweight entrance there.
  const modalLocked = document.body.style.position === "fixed" || Boolean(document.querySelector("main[inert]"))
    || destinationPath === "/demo/checkout" || new URL(renderedLocation).pathname === "/demo/checkout";
  if (document.startViewTransition && !reduced && !modalLocked) {
    transition = document.startViewTransition(update);
    // Snapshot failures must never prevent navigation or become unhandled rejections.
    void transition.ready.catch(() => undefined);
    void transition.finished.catch(() => undefined);
  } else {
    update();
    if (!reduced) fallbackAnimation = document.querySelector("main")?.animate(
      [{ opacity: 0, transform: "translateY(10px)" }, { opacity: 1, transform: "translateY(0)" }],
      { duration: 250, easing: "ease-out" },
    );
  }
}

export function navigate(href: string) {
  const url = new URL(href, location.href);
  if (!isInternalRoute(url)) { location.assign(url.href); return; }
  if (url.href === location.href) {
    // A second click can cancel a destination whose snapshot has not committed yet.
    revision++;
    transition?.skipTransition();
    return;
  }
  rememberScroll(true);
  renderNavigation(() => history.pushState({ demoNavigation: true, ...(url.hash ? {} : { scrollY: 0 }) }, "", url), url.pathname);
}

export function installNavigation() {
  if (installed) return;
  installed = true;
  ensureEntryKey();
  history.scrollRestoration = "manual";
  // Keep scrolling cheap and avoid browser rate limits on history.replaceState.
  window.addEventListener("scroll", () => rememberScroll(), { passive: true });
  window.addEventListener("pagehide", () => rememberScroll(true));
  const traverse = () => {
    if (renderedLocation !== location.href) renderNavigation(() => undefined);
  };
  window.addEventListener("popstate", traverse);
  window.addEventListener("hashchange", traverse);
  document.addEventListener("click", event => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const link = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>("a[href]") : null;
    if (!link || link.hasAttribute("download") || (link.target && link.target !== "_self") || link.relList.contains("external")) return;
    const url = new URL(link.href);
    if (!isInternalRoute(url)) return;
    event.preventDefault();
    navigate(url.href);
  });
}
