import type { DemoProduct } from "./menuData";
import { parseStoredOrder } from "./orderModel.ts";
import type { PaymentPreview } from "./PaymentDemoModal";

export const trackingStorageKey = "alibaba.preview.tracking.v1";
export const preparationSeconds = 25 * 60;
export type TrackedOrder = {
  demoOnly: true;
  summary: PaymentPreview;
  status: "pending" | "accepted" | "rejected";
  acceptedAt: number | null;
  durationSeconds: number;
  acknowledged: boolean;
};
export type TrackingState = { confirmation: TrackedOrder | null; active: TrackedOrder | null };
export type TrackingEvent =
  | { type: "preview_created"; summary: PaymentPreview }
  | { type: "order_accepted"; at: number }
  | { type: "order_rejected" }
  | { type: "confirmation_dismissed" };
export const emptyTracking: TrackingState = { confirmation: null, active: null };

// Only explicit demo events advance the state. A future verified event adapter can reuse this boundary.
export function transitionTracking(state: TrackingState, event: TrackingEvent): TrackingState {
  const order = state.confirmation;
  switch (event.type) {
    case "preview_created":
      if ((order && !order.acknowledged) || state.active?.summary.reference === event.summary.reference) return state;
      return { ...state, confirmation: { demoOnly: true, summary: structuredClone(event.summary), status: "pending", acceptedAt: null, durationSeconds: preparationSeconds, acknowledged: false } };
    case "order_accepted": {
      if (order?.status !== "pending" || !Number.isFinite(event.at) || event.at < 0) return state;
      const accepted: TrackedOrder = { ...order, status: "accepted", acceptedAt: event.at };
      return { confirmation: accepted, active: accepted };
    }
    case "order_rejected":
      return order?.status === "pending" ? { ...state, confirmation: { ...order, status: "rejected" } } : state;
    case "confirmation_dismissed":
      if (!order || order.status === "pending") return state;
      return { confirmation: order.status === "rejected" ? { ...order, acknowledged: true } : null,
        active: order.status === "accepted" ? { ...order, acknowledged: true } : state.active };
  }
}

export function remainingSeconds(order: TrackedOrder, now: number): number {
  if (order.status !== "accepted" || order.acceptedAt === null) return 0;
  return Math.max(0, Math.min(order.durationSeconds, Math.ceil((order.acceptedAt + order.durationSeconds * 1000 - now) / 1000)));
}
export function formatCountdown(seconds: number): string {
  return `${Math.floor(seconds / 60).toString().padStart(2, "0")}:${(seconds % 60).toString().padStart(2, "0")}`;
}
export function trackingStatus(order: TrackedOrder, now: number): string {
  if (order.status === "pending") return "Väntar på restaurangens bekräftelse…";
  if (order.status === "rejected") return "Beställningen kunde inte accepteras.";
  return remainingSeconds(order, now) === 0 ? "Beräknad tid uppnådd" : "Beställningen är bekräftad!";
}

export function parseTracking(raw: unknown, products: readonly DemoProduct[], now: number): TrackingState {
  if (!raw || typeof raw !== "object") return emptyTracking;
  const value = raw as Partial<TrackingState>;
  function parse(input: unknown): TrackedOrder | null {
    if (!input || typeof input !== "object") return null;
    const order = input as TrackedOrder;
    if (order.demoOnly !== true || !["pending", "accepted", "rejected"].includes(order.status)
      || order.durationSeconds !== preparationSeconds || typeof order.acknowledged !== "boolean" || !order.summary) return null;
    if (order.status === "accepted" ? !Number.isFinite(order.acceptedAt) || order.acceptedAt! < 0 || order.acceptedAt! > now
      : order.acceptedAt !== null || (order.status === "pending" && order.acknowledged)) return null;
    const summary = parseStoredOrder({ ...order.summary, demoOnly: true, status: "waiting", cartConsumed: false }, products);
    if (!summary || Date.parse(summary.createdAt) > now || (order.acceptedAt !== null && order.acceptedAt < Date.parse(summary.createdAt))) return null;
    return { demoOnly: true, summary: { reference: summary.reference, createdAt: summary.createdAt, orderType: summary.orderType,
      paymentMethod: summary.paymentMethod, lines: summary.lines, totalOre: summary.totalOre }, status: order.status,
      acceptedAt: order.acceptedAt, durationSeconds: preparationSeconds, acknowledged: order.acknowledged };
  }
  const confirmation = parse(value.confirmation);
  const active = parse(value.active);
  return { confirmation,
    active: active?.status === "accepted" ? active : null };
}
