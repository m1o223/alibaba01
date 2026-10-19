import type { DemoProduct } from "./menuData";

export type Selections = Record<string, string[]>;
export type DemoLine = { productKey: string; selections: Selections; quantity: number };
export type OrderType = "dine-in" | "takeaway";
export type PaymentMethod = "swish" | "apple" | "google" | "card";
export const paymentLabels: Record<PaymentMethod, string> = {
  swish: "Swish", apple: "Apple Pay", google: "Google Pay", card: "Betalkort – Visa / Mastercard",
};
export const statusLabels = {
  received: "Beställning mottagen",
  waiting: "Väntar på restaurangens bekräftelse",
  accepted: "Beställning bekräftad",
  preparing: "Tillagas",
  ready: "Redo att hämtas",
  rejected: "Beställning avvisad i demo",
};
export type OrderStatus = keyof typeof statusLabels;
// A future backend adapter can map events to this reducer; no transport is attached.
export type OrderEvent =
  | { type: "order_created" }
  | { type: "order_accepted"; estimateMinutes: number }
  | { type: "order_rejected" }
  | { type: "order_preparing" }
  | { type: "order_ready" };
export type ReceiptLine = DemoLine & { name: string; emoji: string; options: string[]; unitPriceOre: number };
export type DemoOrder = {
  reference: string;
  createdAt: string;
  orderType: OrderType;
  paymentMethod: PaymentMethod;
  lines: ReceiptLine[];
  totalOre: number;
  status: OrderStatus;
  estimateMinutes?: number;
  cartConsumed: boolean;
  demoOnly: true;
};

export function validateSelections(product: DemoProduct, selections: Selections): boolean {
  if (!product.available || !selections || typeof selections !== "object" || Array.isArray(selections)) return false;
  if (Object.keys(selections).some(key => !product.customizationGroups.some(group => group.key === key))) return false;
  return product.customizationGroups.every(group => {
    if (Object.prototype.hasOwnProperty.call(selections, group.key) && !Array.isArray(selections[group.key])) return false;
    const selected = selections[group.key] ?? [];
    return Array.isArray(selected) && new Set(selected).size === selected.length
      && (!group.required || selected.length > 0)
      && (group.type !== "single" || selected.length <= 1)
      && selected.every(key => group.options.some(option => option.key === key));
  });
}

export function lineKey(line: Pick<DemoLine, "productKey" | "selections">): string {
  return JSON.stringify([line.productKey, Object.entries(line.selections).filter(([, values]) => values.length).sort(([a], [b]) => a.localeCompare(b)).map(([key, values]) => [key, [...values].sort()])]);
}

export function unitPrice(product: DemoProduct, selections: Selections): number {
  return product.priceOre + product.customizationGroups.reduce((sum, group) => sum + group.options.filter(option => selections[group.key]?.includes(option.key)).reduce((total, option) => total + option.priceOre, 0), 0);
}

export function optionLabels(product: DemoProduct, selections: Selections): string[] {
  return product.customizationGroups.flatMap(group => group.options.filter(option => selections[group.key]?.includes(option.key)).map(option => option.name));
}

export function normalizeLines(raw: unknown, products: readonly DemoProduct[]): DemoLine[] {
  if (!Array.isArray(raw)) return [];
  const lines = new Map<string, DemoLine>();
  for (const value of raw.slice(0, 100)) {
    if (!value || typeof value !== "object") continue;
    const product = products.find(item => item.key === value.productKey);
    if (!product || !Number.isInteger(value.quantity) || value.quantity < 1 || value.quantity > 20) continue;
    const selections = value.selections ?? (value.optionKey ? { side: [value.optionKey] } : {});
    if (!validateSelections(product, selections)) continue;
    const line = { productKey: product.key, selections, quantity: value.quantity };
    lines.set(lineKey(line), line);
  }
  return [...lines.values()];
}

export function receiptLines(lines: DemoLine[], products: readonly DemoProduct[]): ReceiptLine[] {
  return normalizeLines(lines, products).map(line => {
    const product = products.find(item => item.key === line.productKey)!;
    return { ...line, selections: structuredClone(line.selections), name: product.name, emoji: product.emoji, options: optionLabels(product, line.selections), unitPriceOre: unitPrice(product, line.selections) };
  });
}

export function transitionOrder(order: DemoOrder, event: OrderEvent): DemoOrder {
  if (event.type === "order_created" && order.status === "received") return { ...order, status: "waiting" };
  if (event.type === "order_accepted" && order.status === "waiting" && Number.isInteger(event.estimateMinutes) && event.estimateMinutes >= 1 && event.estimateMinutes <= 120) return { ...order, status: "accepted", estimateMinutes: event.estimateMinutes };
  if (event.type === "order_rejected" && ["waiting", "accepted", "preparing"].includes(order.status)) return { ...order, status: "rejected", estimateMinutes: undefined };
  if (event.type === "order_preparing" && order.status === "accepted") return { ...order, status: "preparing" };
  if (event.type === "order_ready" && order.status === "preparing") return { ...order, status: "ready" };
  return order;
}

export function parseStoredOrder(raw: unknown, products: readonly DemoProduct[]): DemoOrder | null {
  if (!raw || typeof raw !== "object") return null;
  const order = raw as DemoOrder;
  if (order.demoOnly !== true || !/^DEMO-[A-F0-9]{8}$/.test(order.reference) || !Number.isFinite(Date.parse(order.createdAt))
    || !["dine-in", "takeaway"].includes(order.orderType) || !Object.prototype.hasOwnProperty.call(paymentLabels, order.paymentMethod)
    || !Object.prototype.hasOwnProperty.call(statusLabels, order.status) || !Array.isArray(order.lines)) return null;
  const lines = receiptLines(order.lines, products);
  if (!lines.length || lines.length !== order.lines.length) return null;
  return { reference: order.reference, createdAt: order.createdAt, orderType: order.orderType, paymentMethod: order.paymentMethod,
    status: order.status, lines, totalOre: lines.reduce((sum, line) => sum + line.quantity * line.unitPriceOre, 0),
    estimateMinutes: Number.isInteger(order.estimateMinutes) && order.estimateMinutes! >= 1 && order.estimateMinutes! <= 120 ? order.estimateMinutes : undefined,
    cartConsumed: order.cartConsumed === true, demoOnly: true };
}
