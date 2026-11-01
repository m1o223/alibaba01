import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";
import { demoProducts } from "./menuData";
import { navigate, readStored, writeStored } from "./navigation";
import { parseTracking, trackingStorageKey, transitionTracking, type TrackingEvent } from "./trackingModel";
import type { PaymentPreview } from "./PaymentDemoModal";
import { OrderConfirmation } from "./OrderConfirmation";
import { FloatingOrderTracker } from "./FloatingOrderTracker";
import "./order-tracking.css";

const TrackingContext = createContext<((summary: PaymentPreview) => void) | null>(null);
export const useDemoTracking = () => useContext(TrackingContext)!;

export function DemoTrackingProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState(() => parseTracking(readStored(trackingStorageKey, null), demoProducts, Date.now()));
  const current = useRef(state);
  const dispatch = useCallback((event: TrackingEvent) => {
    const next = transitionTracking(current.current, event);
    if (next === current.current) return;
    current.current = next;
    // Persist before navigation; never store addresses or payment credentials here.
    writeStored(trackingStorageKey, next);
    setState(next);
  }, []);
  const begin = useCallback((summary: PaymentPreview) => dispatch({ type: "preview_created", summary }), [dispatch]);
  return <TrackingContext.Provider value={begin}>
    {children}
    {state.active?.acknowledged ? <FloatingOrderTracker key={state.active.summary.reference} order={state.active} /> : null}
    {state.confirmation && !state.confirmation.acknowledged ? <OrderConfirmation order={state.confirmation} onAccept={() => dispatch({ type: "order_accepted", at: Date.now() })}
      onReject={() => dispatch({ type: "order_rejected" })} onHome={() => {
        dispatch({ type: "confirmation_dismissed" });
        navigate("/");
      }} /> : null}
  </TrackingContext.Provider>;
}
