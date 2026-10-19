import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { useDemoCart } from "./DemoCartContext";
import { DemoFlowContext, demoLoginEvent } from "./DemoFlowContext";
import { demoProducts } from "./menuData";
import { navigate, readStored, withOrderType, writeStored } from "./navigation";
import { parseStoredOrder, paymentLabels, receiptLines, transitionOrder, type DemoOrder, type OrderEvent, type OrderType, type PaymentMethod } from "./orderModel";

const sessionKey = "alibaba.preview.demo-session.v1";
const orderKey = "alibaba.preview.demo-order.v1";
export function DemoFlowProvider({ children }: { children: ReactNode }) {
  const cart = useDemoCart()!;
  const [session, setSession] = useState(() => readStored<unknown>(sessionKey, false) === true);
  const [order, setOrder] = useState<DemoOrder | null>(() => parseStoredOrder(readStored(orderKey, null), demoProducts));
  const consumed = useRef<string | null>(null);
  useEffect(() => { writeStored(sessionKey, session); }, [session]);
  useEffect(() => { writeStored(orderKey, order); }, [order]);
  const dispatch = useCallback((event: OrderEvent) => setOrder(current => current ? transitionOrder(current, event) : current), []);

  function pay(paymentMethod: PaymentMethod, orderType: OrderType) {
    if (!session || !cart.lines.length || !Object.prototype.hasOwnProperty.call(paymentLabels, paymentMethod) || !["dine-in", "takeaway"].includes(orderType)) return;
    const lines = receiptLines(cart.lines, demoProducts);
    const next: DemoOrder = {
      reference: `DEMO-${crypto.randomUUID().split("-").join("").slice(0, 8).toUpperCase()}`,
      createdAt: new Date().toISOString(), orderType, paymentMethod, lines,
      totalOre: lines.reduce((sum, line) => sum + line.unitPriceOre * line.quantity, 0),
      status: "received", cartConsumed: false, demoOnly: true,
    };
    setOrder(next);
    writeStored(orderKey, next);
    navigate(withOrderType(`/demo/order/${next.reference}`));
  }
  return <DemoFlowContext.Provider value={{
    session,
    continueDemo: () => { writeStored(sessionKey, true); setSession(true); },
    checkout: () => navigate(withOrderType("/demo/checkout")),
    requestLogin: () => window.dispatchEvent(new Event(demoLoginEvent)),
    order, pay,
    consumeReceipt: () => {
      if (!order || order.cartConsumed || consumed.current === order.reference) return;
      consumed.current = order.reference;
      cart.consume(order.lines);
      setOrder(current => current ? { ...current, cartConsumed: true } : current);
    },
    dispatch,
    newOrder: () => { cart.clear(); navigate("/"); },
  }}>{children}</DemoFlowContext.Provider>;
}
