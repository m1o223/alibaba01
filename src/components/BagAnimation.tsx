import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useRef, useState, type RefObject } from "react";
import { createPortal } from "react-dom";
import { TakeawayBagIcon } from "./TakeawayBagIcon";
import { arrivalDuration, bagFlightFrame, confirmationDuration, type Point } from "./bagMotion";

type AnimateAddition = (source: HTMLElement, quantity: number) => void;
type Flight = { id: number; start: Point; quantity: number; arrived: boolean; pageKey: string };
export const BagAnimationContext = createContext<AnimateAddition | null>(null);

function FlyingBag({ flight, target, onArrival, onFinish }: {
  flight: Flight; target: RefObject<HTMLImageElement | null>; onArrival: (id: number) => void; onFinish: (id: number) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const began = performance.now();
    let frameId = 0;
    let arrived = false;
    function tick(now: number) {
      if (!ref.current || !target.current?.isConnected) { onFinish(flight.id); return; }
      const box = target.current.getBoundingClientRect();
      const frame = bagFlightFrame(flight.start, { x: box.left + box.width / 2, y: box.top + box.height / 2 }, now - began);
      ref.current.style.transform = `translate3d(${frame.x - 24}px, ${frame.y - 24}px, 0) scale(${frame.scale})`;
      ref.current.style.opacity = String(frame.opacity);
      if (frame.arrived && !arrived) { arrived = true; onArrival(flight.id); }
      if (frame.finished) onFinish(flight.id);
      else frameId = requestAnimationFrame(tick);
    }
    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [flight.id, flight.start, target, onArrival, onFinish]);
  return <div ref={ref} className="bag-flight"><TakeawayBagIcon size={30} /></div>;
}

export function useBagAnimation(actualCount: number, pageKey: string, blocked: boolean) {
  const target = useRef<HTMLImageElement>(null);
  const nextId = useRef(0);
  const bounce = useRef<Animation | null>(null);
  const [flights, setFlights] = useState<Flight[]>([]);
  const clear = useCallback(() => {
    setFlights([]);
    bounce.current?.cancel();
    bounce.current = null;
  }, []);

  useLayoutEffect(() => { clear(); }, [pageKey, blocked, clear]);
  useEffect(() => {
    const motion = matchMedia("(prefers-reduced-motion: reduce)");
    const onMotion = () => { if (motion.matches) clear(); };
    const onVisibility = () => { if (document.hidden) clear(); };
    motion.addEventListener("change", onMotion);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      motion.removeEventListener("change", onMotion);
      document.removeEventListener("visibilitychange", onVisibility);
      bounce.current?.cancel();
    };
  }, [clear]);

  const animate = useCallback<AnimateAddition>((source, quantity) => {
    if (blocked || document.hidden || matchMedia("(prefers-reduced-motion: reduce)").matches || !target.current || !source.isConnected) return;
    const box = source.getBoundingClientRect();
    const start = { x: Math.max(24, Math.min(innerWidth - 24, box.left + box.width / 2)), y: box.top + box.height / 2 };
    const id = ++nextId.current;
    setFlights(current => [...current, { id, start, quantity, arrived: false, pageKey }]);
  }, [pageKey, blocked]);

  const onArrival = useCallback((id: number) => {
    setFlights(current => current.map(flight => flight.id === id ? { ...flight, arrived: true } : flight));
    bounce.current?.cancel();
    bounce.current = target.current?.animate?.([
      { transform: "scale(1)" }, { transform: "scale(1.16)", offset: 0.4 }, { transform: "scale(1)" },
    ], { duration: arrivalDuration, easing: "ease-out" }) ?? null;
    const animation = bounce.current;
    if (animation) animation.onfinish = () => {
      animation.cancel();
      if (bounce.current === animation) bounce.current = null;
    };
  }, []);
  const onFinish = useCallback((id: number) => setFlights(current => current.filter(flight => flight.id !== id)), []);
  const visibleFlights = blocked ? [] : flights.filter(flight => flight.pageKey === pageKey);
  // Only defer quantities from successful additions; the cart remains the source of truth.
  const count = Math.max(0, actualCount - visibleFlights.reduce((sum, flight) => sum + (flight.arrived ? 0 : flight.quantity), 0));
  return {
    target, animate, count,
    layer: visibleFlights.length ? createPortal(<div className="bag-flight-layer" aria-hidden="true">
      {visibleFlights.map(flight => <FlyingBag key={flight.id} flight={flight} target={target} onArrival={onArrival} onFinish={onFinish} />)}
    </div>, document.body) : null,
  };
}

export function useAddToBagFeedback() {
  const animate = useContext(BagAnimationContext);
  const [confirmed, setConfirmed] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  function reset() { clearTimeout(timer.current); setConfirmed(false); }
  function confirm(source: HTMLElement, quantity: number) {
    clearTimeout(timer.current);
    setConfirmed(true);
    timer.current = setTimeout(() => setConfirmed(false), confirmationDuration);
    animate?.(source, quantity);
  }
  return { confirmed, confirm, reset };
}
