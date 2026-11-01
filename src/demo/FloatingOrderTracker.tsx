import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { useDemoPath } from "./navigation";
import { formatCountdown, remainingSeconds, type TrackedOrder } from "./trackingModel";
import { OrderTrackingOverlay } from "./OrderTrackingOverlay";

export function FloatingOrderTracker({ order }: { order: TrackedOrder }) {
  const [now, setNow] = useState(Date.now);
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({ x: 16, y: 80 });
  const layer = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const path = useDemoPath();
  const seconds = remainingSeconds(order, now);
  const countdown = formatCountdown(seconds);

  useEffect(() => {
    const update = () => setNow(Date.now());
    const timer = window.setInterval(update, 1000);
    window.addEventListener("focus", update);
    document.addEventListener("visibilitychange", update);
    return () => { clearInterval(timer); window.removeEventListener("focus", update); document.removeEventListener("visibilitychange", update); };
  }, []);

  useLayoutEffect(() => {
    let frame = 0;
    function place() {
      if (open) return;
      const host = layer.current, button = trigger.current;
      if (!host || !button) return;
      const inset = getComputedStyle(host);
      const size = button.offsetWidth;
      const viewport = window.visualViewport;
      const bottom = Math.min(innerHeight, (viewport?.height ?? innerHeight) + (viewport?.offsetTop ?? 0));
      const headerBottom = document.querySelector(".app-header")?.getBoundingClientRect().bottom ?? 64;
      const top = Math.max(16, headerBottom + 12);
      const maxY = Math.max(top, bottom - size - parseFloat(inset.paddingBottom));
      const right = innerWidth - size - parseFloat(inset.paddingRight), left = parseFloat(inset.paddingLeft);
      // Prefer a corner, but keep the tracker off visible controls and the restaurant logo.
      const obstacles = [...document.querySelectorAll<HTMLElement>("#root button, #root a, #root input, #root textarea, #root select, #root .home-logo")]
        .filter(el => !host.contains(el) && !el.closest('[inert], [aria-hidden="true"]') && getComputedStyle(el).visibility !== "hidden")
        .map(el => el.getBoundingClientRect()).filter(rect => rect.width && rect.height && rect.bottom > top && rect.top < bottom);
      let best = { x: right, y: maxY, score: Infinity };
      const positions = Array.from({ length: Math.floor((maxY - top) / 8) + 1 }, (_, index) => maxY - index * 8);
      positions.push(top);
      for (const y of positions) {
        for (const x of [right, left]) {
          const score = obstacles.reduce((sum, r) => sum + Math.max(0, Math.min(x + size + 6, r.right) - Math.max(x - 6, r.left))
            * Math.max(0, Math.min(y + size + 6, r.bottom) - Math.max(y - 6, r.top)), 0);
          if (score < best.score) best = { x, y, score };
        }
        if (best.score === 0) break;
      }
      const next = { x: best.x, y: best.y };
      setPosition(current => Object.keys(next).every(key => next[key as keyof typeof next] === current[key as keyof typeof next]) ? current : next);
    }
    function schedule() { cancelAnimationFrame(frame); frame = requestAnimationFrame(place); }
    place();
    const observer = new ResizeObserver(schedule);
    const main = document.querySelector("main");
    if (main) observer.observe(main);
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    window.visualViewport?.addEventListener("resize", schedule);
    return () => { cancelAnimationFrame(frame); observer.disconnect(); window.removeEventListener("scroll", schedule); window.removeEventListener("resize", schedule); window.visualViewport?.removeEventListener("resize", schedule); };
  }, [path, open]);

  useEffect(() => { setOpen(false); }, [path]);
  const close = useCallback(() => setOpen(false), []);
  return <div className="order-tracker-layer" ref={layer} lang="sv">
    <button ref={trigger} type="button" className="order-tracker-circle" style={{ left: position.x, top: position.y }}
      aria-label={`Visa demobeställning ${order.summary.reference}`} aria-expanded={open} aria-controls="order-tracker-panel" onClick={() => setOpen(value => !value)}>
      <span className="order-tracker-time" aria-hidden="true">{countdown}</span><span className="order-tracker-demo">Demo</span>
    </button>
    {open ? <OrderTrackingOverlay order={order} now={now} onClose={close} /> : null}
  </div>;
}
