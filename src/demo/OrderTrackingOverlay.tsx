import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { restorePagePosition } from "../navigation";
import { formatDemoPrice } from "./menuData";
import { OrderLines } from "./DemoUi";
import { formatCountdown, remainingSeconds, trackingStatus, type TrackedOrder } from "./trackingModel";
import { TrackingDemoMap } from "./TrackingDemoMap";
import "./order-tracking-overlay.css";

export function OrderTrackingOverlay({ order, now, onClose }: { order: TrackedOrder; now: number; onClose: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const [closing, setClosing] = useState(false);
  const panel = useRef<HTMLElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const mapCloseButton = useRef<HTMLButtonElement>(null);
  const mapButton = useRef<HTMLButtonElement>(null);
  const mapWasExpanded = useRef(false);
  const seconds = remainingSeconds(order, now);
  const circumference = 2 * Math.PI * 88;

  useLayoutEffect(() => {
    const root = document.getElementById("root");
    const wasInert = root?.inert ?? false;
    const trigger = document.activeElement as HTMLElement | null;
    const scrollY = window.scrollY, url = location.href;
    const { position, top, width, overflow } = document.body.style;
    Object.assign(document.body.style, { position: "fixed", top: `-${scrollY}px`, width: "100%", overflow: "hidden" });
    if (root) root.inert = true;
    closeButton.current?.focus({ preventScroll: true });
    return () => {
      if (root) root.inert = wasInert;
      Object.assign(document.body.style, { position, top, width, overflow });
      if (location.href === url) {
        window.scrollTo(0, scrollY);
        if (trigger?.isConnected) trigger.focus({ preventScroll: true });
      } else restorePagePosition();
    };
  }, []);

  useEffect(() => {
    if (!closing) return;
    const timeout = window.setTimeout(onClose, 350);
    return () => clearTimeout(timeout);
  }, [closing, onClose]);

  useLayoutEffect(() => {
    if (expanded) {
      mapWasExpanded.current = true;
      mapCloseButton.current?.focus({ preventScroll: true });
    } else if (mapWasExpanded.current) mapButton.current?.focus({ preventScroll: true });
  }, [expanded]);

  function close() {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) onClose();
    else setClosing(true);
  }
  function toggleMap(next: boolean) {
    setExpanded(next);
  }

  return createPortal(<section ref={panel} id="order-tracker-panel" className={`order-tracking-screen${expanded ? " is-map-expanded" : ""}${closing ? " is-closing" : ""}`}
    role="dialog" aria-modal="true" aria-label="Orderinformation (demo)" lang="sv" dir="ltr" data-expanded={expanded}
    onKeyDown={event => {
      if (event.key === "Escape") { event.preventDefault(); event.stopPropagation(); if (expanded) toggleMap(false); else close(); }
      if (event.key !== "Tab") return;
      const controls = [...panel.current!.querySelectorAll<HTMLElement>('button:not(:disabled):not([hidden]), [tabindex="0"]')];
      const first = controls[0], last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    }}>
    <div className="tracking-map">
      <TrackingDemoMap />
      <p className="tracking-map-demo">Demokarta · ingen verklig rutt</p>
      <button ref={mapButton} type="button" className="tracking-map-expand" hidden={expanded} disabled={closing} onClick={() => toggleMap(true)}
        aria-label="Visa demokarta i helskärm" aria-description="Illustration med restaurang, kund och exempelrutt. Inga verkliga positioner." />
      <button ref={closeButton} type="button" className="tracking-screen-close" hidden={expanded} disabled={closing} onClick={close} aria-label="Stäng orderinformation"><X size={22} aria-hidden="true" /></button>
      <button ref={mapCloseButton} type="button" className="tracking-screen-close" hidden={!expanded} onClick={() => toggleMap(false)} aria-label="Stäng helskärmskarta"><X size={22} aria-hidden="true" /></button>
    </div>
    <div className="tracking-details" role="region" aria-label="Beställningsdetaljer" tabIndex={expanded || closing ? -1 : 0} inert={expanded || closing} aria-hidden={expanded || undefined}>
      <div className="tracking-details-inner">
        <div className="tracking-countdown">
          <svg viewBox="0 0 200 200" aria-hidden="true"><circle cx="100" cy="100" r="88" fill="none" stroke="#EAE0D4" strokeWidth="7" />
            <circle className="tracking-countdown-ring" cx="100" cy="100" r="88" fill="none" stroke="#4A2818" strokeWidth="7" strokeLinecap="round"
              strokeDasharray={circumference} strokeDashoffset={circumference * (1 - seconds / order.durationSeconds)} transform="rotate(-90 100 100)" /></svg>
          <div><span role="timer" aria-live="off">{formatCountdown(seconds)}</span><span className="order-demo-label">Demo</span></div>
        </div>
        <p className="tracking-estimate-label">Simulerad återstående tid</p>
        <h2 className="order-tracker-status" role="status">{trackingStatus(order, now)}</h2>
        <p className="tracking-reference">Ordernummer #{order.summary.reference}</p>
        <OrderLines lines={order.summary.lines} />
        <dl className="tracking-total"><dt>Totalt</dt><dd>{formatDemoPrice(order.summary.totalOre)}</dd></dl>
      </div>
    </div>
  </section>, document.body);
}
